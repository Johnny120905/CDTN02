import time
import uuid
import re
import unicodedata
from urllib.parse import quote
from flask import Blueprint, request, jsonify, Response
from src.core.database import db_manager, MAX_UPLOAD_BYTES
from src.middlewares.auth_middleware import token_required
from src.core.socket_service import canonicalize_room_id, get_room_id_variants, chat_msg_sort_key
from src.core.notification_service import (
    create_and_emit_notification,
    emit_socket_event,
    notify_admins,
    resolve_chat_partner_user_id,
)

common_bp = Blueprint("common", __name__, url_prefix="/api")

# 0. Real File Upload & GridFS Retrieval API (PDF <= 10MB)
@common_bp.route("/upload", methods=["POST"])
def upload_file():
    """
    Tải lên tệp PDF thực tế (<= 10MB) và đẩy thẳng vào MongoDB GridFS, không ghi ra ổ đĩa.
    """
    # Xử lý multipart/form-data
    if "file" in request.files:
        file = request.files["file"]
        if not file or file.filename == "":
            return jsonify({"success": False, "message": "Chưa chọn tệp tin tải lên."}), 400

        filename = file.filename
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        mimetype = (file.mimetype or "").lower()
        if ext != "pdf" or (mimetype and mimetype not in ("application/pdf", "application/octet-stream")):
            return jsonify({"success": False, "message": "Chỉ nhận tệp định dạng .pdf (dung lượng <= 10MB)!"}), 400

        file_bytes = file.read(MAX_UPLOAD_BYTES + 1)
        file_size = len(file_bytes)
        if file_size > MAX_UPLOAD_BYTES:
            return jsonify({"success": False, "message": "Dung lượng tệp vượt quá giới hạn 10MB!"}), 400
        if not file_bytes.startswith(b"%PDF-"):
            return jsonify({"success": False, "message": "Tệp không phải PDF hợp lệ (sai chữ ký %PDF)!"}), 400

        try:
            file_id = db_manager.save_file(file_bytes, filename=filename, content_type="application/pdf", metadata={"source": "upload"})
        except ValueError as e:
            return jsonify({"success": False, "message": str(e)}), 400

        file_url = f"/api/files/{file_id}"
        return jsonify({
            "success": True,
            "message": f"Tải lên tệp '{filename}' thành công!",
            "url": file_url,
            "file_id": file_id,
            "file_name": filename,
            "file_size": file_size
        }), 201

    # Xử lý JSON base64
    data = request.get_json(silent=True) or {}
    base64_data = data.get("file_data") or data.get("file_url")
    filename = str(data.get("file_name", "document.pdf")).strip() or "document.pdf"
    if base64_data and "," in base64_data:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext != "pdf":
            return jsonify({"success": False, "message": "Chỉ nhận tệp định dạng .pdf (dung lượng <= 10MB)!"}), 400
        try:
            file_id, file_url = db_manager.save_data_url(
                base64_data,
                filename=filename,
                allowed_types=("application/pdf",),
                metadata={"source": "upload"},
                allow_pdf_magic=True
            )
            file_doc = db_manager.get_file(file_id)
            file_size = file_doc["length"] if file_doc else 0
            return jsonify({
                "success": True,
                "message": f"Tải lên tệp '{filename}' thành công!",
                "url": file_url,
                "file_id": file_id,
                "file_name": filename,
                "file_size": file_size
            }), 201
        except ValueError as e:
            return jsonify({"success": False, "message": str(e)}), 400
        except Exception as e:
            return jsonify({"success": False, "message": f"Lỗi giải mã tệp tin: {str(e)}"}), 400

    return jsonify({"success": False, "message": "Vui lòng chọn tệp tin để tải lên."}), 400


@common_bp.route("/files/<file_id>", methods=["GET"])
def get_uploaded_file(file_id):
    """Đọc tệp đã lưu trong MongoDB GridFS trả về cho web xem và tải."""
    file_doc = db_manager.get_file(file_id)
    if not file_doc:
        return jsonify({"success": False, "message": "Tệp tin không tồn tại trên hệ thống."}), 404

    disposition_type = "attachment" if request.args.get("download") in ("1", "true", "yes") else "inline"
    filename = file_doc["filename"] or "document.pdf"
    ascii_name = filename.encode("ascii", "ignore").decode("ascii") or "document.pdf"
    encoded_name = quote(filename)

    resp = Response(file_doc["data"], status=200, mimetype=file_doc["content_type"])
    resp.headers["Content-Length"] = str(file_doc["length"])
    resp.headers["Content-Disposition"] = f'{disposition_type}; filename="{ascii_name}"; filename*=UTF-8\'\'{encoded_name}'
    resp.headers["Cache-Control"] = "public, max-age=3600"
    return resp


# 1. Healthcheck
@common_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "PARTIME.VN Backend API",
        "database": "connected",
        "time": time.strftime("%Y-%m-%d %H:%M:%S")
    })

# 2. Public Categories
@common_bp.route("/categories", methods=["GET"])
def get_categories():
    cat_col = db_manager.get_collection("categories")
    unwanted = {"Bảo hành", "Thời trang"}
    legacy_loc_ids = {"loc_1", "loc_2", "loc_3", "loc_4", "loc_5"}
    c_type = request.args.get("type")
    query = {"is_active": {"$ne": False}}
    if c_type:
        query["type"] = c_type
    cats = list(cat_col.find(query))
    filtered_cats = [
        c for c in cats
        if c.get("name") not in unwanted and c.get("_id") not in legacy_loc_ids
    ]
    return jsonify({"success": True, "data": filtered_cats})

def _enrich_job_company_fields(job, comp):
    """Đồng bộ trực tiếp ảnh Logo, ảnh bìa và tên doanh nghiệp mới nhất lên dữ liệu tin tuyển dụng."""
    if not comp:
        return job
    if "logo_url" in comp:
        job["company_logo"] = comp.get("logo_url") or ""
    elif comp.get("logo_url") and not job.get("company_logo"):
        job["company_logo"] = comp.get("logo_url")
    if "cover_image_url" in comp:
        job["company_cover_image"] = comp.get("cover_image_url") or ""
    if comp.get("company_name") and (not job.get("company_name") or job.get("company_name") == "Doanh nghiệp"):
        job["company_name"] = comp.get("company_name")
    return job


# 3. Public Job Search (FR 1.5.1, 1.5.2)
@common_bp.route("/jobs", methods=["GET"])
def search_jobs():
    keyword = request.args.get("q", "").strip()
    category_id = request.args.get("category")
    location = request.args.get("location", "").strip()
    min_sal = request.args.get("min_salary")
    work_time = request.args.get("work_time", "").strip()
    payment_type = request.args.get("payment_type", "").strip()
    include_ids_raw = request.args.get("include_ids", "").strip()
    include_ids = [jid.strip() for jid in include_ids_raw.split(",") if jid.strip()] if include_ids_raw else []

    job_col = db_manager.get_collection("jobs")
    base_and = [{"is_hidden": False}, {"is_admin_reviewed": {"$ne": False}}, {"status": {"$ne": "banned"}}]
    if include_ids:
        base_and.append({"$or": [{"is_open": {"$ne": False}}, {"_id": {"$in": include_ids}}]})
    else:
        base_and.append({"is_open": {"$ne": False}})

    if category_id:
        base_and.append({"category_id": category_id})
    if location:
        base_and.append({"location": {"$regex": location, "$options": "i"}})
    if work_time:
        base_and.append({"work_time": {"$regex": work_time, "$options": "i"}})
    if payment_type:
        base_and.append({"payment_type": {"$regex": payment_type, "$options": "i"}})
    if min_sal:
        try:
            base_and.append({"salary_max": {"$gte": int(min_sal)}})
        except ValueError:
            pass

    if keyword:
        base_and.append({
            "$or": [
                {"title": {"$regex": keyword, "$options": "i"}},
                {"description": {"$regex": keyword, "$options": "i"}},
                {"company_name": {"$regex": keyword, "$options": "i"}}
            ]
        })

    query = base_and[0] if len(base_and) == 1 else {"$and": base_and}
    jobs = list(job_col.find(query).sort("created_at", -1))

    # Làm giàu category_name & company_logo để Frontend đồng bộ chính xác
    cat_map = {c.get("_id"): c.get("name") for c in db_manager.get_collection("categories").find({}) if c.get("_id")}
    comp_map = {c.get("employer_id"): c for c in db_manager.get_collection("company_profiles").find({}) if c.get("employer_id")}
    for j in jobs:
        if not j.get("category_name") and j.get("category_id") in cat_map:
            j["category_name"] = cat_map[j["category_id"]]
        _enrich_job_company_fields(j, comp_map.get(j.get("employer_id")))
        if not j.get("status") and j.get("job_status"):
            j["status"] = j["job_status"]
        elif not j.get("job_status") and j.get("status"):
            j["job_status"] = j["status"]

    return jsonify({"success": True, "total": len(jobs), "data": jobs})

@common_bp.route("/jobs/<job_id>", methods=["GET"])
def get_job_detail(job_id):
    job_col = db_manager.get_collection("jobs")
    job = job_col.find_one({"_id": job_id, "is_hidden": False, "is_admin_reviewed": {"$ne": False}})
    if not job:
        return jsonify({"success": False, "message": "Không tìm thấy tin việc làm này."}), 404
        
    # Lấy thêm thông tin công ty và đồng bộ logo mới nhất
    comp = db_manager.get_collection("company_profiles").find_one({"employer_id": job.get("employer_id")})
    _enrich_job_company_fields(job, comp)
    job["company_info"] = comp or {}
    return jsonify({"success": True, "data": job})

@common_bp.route("/companies/<company_ref>", methods=["GET"])
def get_public_company_profile(company_ref):
    """Trả về trang hồ sơ công khai doanh nghiệp (ảnh bìa, logo, quy mô, địa chỉ, đánh giá sao, tin tuyển dụng)."""
    ref = str(company_ref or "").strip()
    emp_col = db_manager.get_collection("employers")
    comp_col = db_manager.get_collection("company_profiles")
    job_col = db_manager.get_collection("jobs")
    rev_col = db_manager.get_collection("reviews")
    users_col = db_manager.get_collection("users")

    emp = emp_col.find_one({"$or": [{"_id": ref}, {"user_id": ref}]})
    comp = comp_col.find_one({"$or": [{"employer_id": ref}, {"_id": ref}]})
    if not comp and emp:
        comp = comp_col.find_one({"employer_id": emp.get("_id")})
    if not comp and not emp:
        # Fallback match theo tên công ty (trong trường hợp ref là company_name từ query)
        for c in comp_col.find({}):
            if str(c.get("company_name", "")).strip().lower() == ref.lower():
                comp = c
                break
    if not emp and comp and comp.get("employer_id"):
        emp = emp_col.find_one({"_id": comp.get("employer_id")})

    if not comp and not emp:
        return jsonify({"success": False, "message": "Không tìm thấy hồ sơ doanh nghiệp."}), 404

    emp_id = (emp.get("_id") if emp else None) or (comp.get("employer_id") if comp else ref)
    emp_user_id = emp.get("user_id") if emp else ""
    emp_user = users_col.find_one({"_id": emp_user_id}) if emp_user_id else None

    target_ids = {x for x in [emp_id, emp_user_id, comp.get("_id") if comp else None] if x}
    comp_name = (comp.get("company_name") if comp else None) or (emp.get("company_name") if emp else None) or "Doanh nghiệp"

    open_jobs = [
        j for j in job_col.find({"employer_id": {"$in": list(target_ids)}, "is_hidden": {"$ne": True}}).sort("created_at", -1)
    ]

    all_reviews = list(rev_col.find({"is_hidden": {"$ne": True}}).sort("created_at", -1))
    public_reviews = []
    for r in all_reviews:
        is_emp_target = r.get("direction") == "student_to_employer" or r.get("reviewer_role") == "student" or (not r.get("direction") and r.get("target_role") != "student")
        if not is_emp_target:
            continue
        if r.get("target_id") in target_ids or (r.get("company_name") and str(r.get("company_name")).strip().lower() == str(comp_name).strip().lower()):
            public_reviews.append(r)

    avg_rating = round(sum(float(r.get("rating", 5)) for r in public_reviews) / len(public_reviews), 1) if public_reviews else float((comp or {}).get("rating_avg") or (emp or {}).get("rating_avg") or 5.0)

    profile_payload = {
        "employer_id": emp_id,
        "user_id": emp_user_id,
        "company_name": comp_name,
        "representative_name": (comp or {}).get("representative_name") or (emp_user or {}).get("full_name") or "",
        "branch_name": (comp or {}).get("branch_name") or "",
        "address": (comp or {}).get("address") or "TP. Hồ Chí Minh",
        "scale": (comp or {}).get("scale") or "10-50 nhân viên",
        "phone": (comp or {}).get("phone") or (emp_user or {}).get("phone") or "",
        "website": (comp or {}).get("website") or "",
        "description": (comp or {}).get("description") or "Chưa có mô tả chi tiết doanh nghiệp.",
        "logo_url": (comp or {}).get("logo_url") or "",
        "cover_image_url": (comp or {}).get("cover_image_url") or "",
        "approval_status": (emp or {}).get("approval_status", "approved"),
        "rating_avg": avg_rating,
        "review_count": len(public_reviews),
        "reviews": public_reviews,
        "jobs": open_jobs,
    }
    return jsonify({"success": True, "data": profile_payload})

# 4. Chat & Messaging with Automated Banned Keyword Filter (FR 1.8, 2.7, 3.9)
def _normalize_with_char_spans(text: str):
    """Normalize text to lowercase ASCII (no Vietnamese accents) while keeping original [start, end) spans."""
    chars = []
    spans = []
    for i, ch in enumerate(text):
        if ch in ("đ", "Đ"):
            chars.append("d")
            spans.append((i, i + 1))
            continue
        decomposed = unicodedata.normalize("NFD", ch)
        emitted = False
        for sub in decomposed:
            if unicodedata.category(sub) == "Mn":
                continue
            chars.append("d" if sub in ("đ", "Đ") else sub.lower())
            spans.append((i, i + 1))
            emitted = True
        if not emitted and spans:
            prev_s, _ = spans[-1]
            spans[-1] = (prev_s, i + 1)
    return "".join(chars), spans

def _strip_accents_lower(text: str) -> str:
    norm, _ = _normalize_with_char_spans(text or "")
    return norm

def _mask_phrase_inline(text: str, kw: str):
    """Replace exact and accent-insensitive occurrences of kw inline with '***'."""
    if not text or not kw:
        return text, False
    matched = False
    exact_pattern = re.compile(re.escape(kw), re.IGNORECASE)
    if exact_pattern.search(text):
        text = exact_pattern.sub("***", text)
        matched = True

    norm_kw = _strip_accents_lower(kw).strip()
    if not norm_kw:
        return text, matched

    norm_text, spans = _normalize_with_char_spans(text)
    if norm_kw not in norm_text:
        return text, matched

    ranges = []
    start = 0
    kw_len = len(norm_kw)
    while True:
        idx = norm_text.find(norm_kw, start)
        if idx == -1:
            break
        orig_start = spans[idx][0]
        orig_end = spans[idx + kw_len - 1][1]
        ranges.append((orig_start, orig_end))
        start = idx + kw_len

    if ranges:
        matched = True
        for s_idx, e_idx in reversed(ranges):
            text = text[:s_idx] + "***" + text[e_idx:]
    return text, matched

def filter_content_banned_words(text: str):
    ban_col = db_manager.get_collection("banned_keywords")
    banned_list = list(ban_col.find({}))
    # Xử lý cụm từ dài trước để tránh cắt dở cụm từ ghép
    keywords = sorted(
        {str(item.get("keyword", "")).strip() for item in banned_list if item.get("keyword")},
        key=len,
        reverse=True,
    )
    censored_text = text or ""
    flagged = False
    flagged_words = []

    for kw in keywords:
        censored_text, hit = _mask_phrase_inline(censored_text, kw)
        if hit:
            flagged = True
            flagged_words.append(kw)

    return censored_text, flagged, flagged_words

def scan_job_banned_keywords(job: dict, banned_keywords=None) -> list:
    """Quet tin tuyen dung doi chieu danh sach tu khoa cam dang hoat dong (khong dau & viet lien >= 4 ky tu)."""
    if not isinstance(job, dict):
        return []

    if banned_keywords is None:
        banned_docs = list(db_manager.get_collection("banned_keywords").find({}))
    else:
        banned_docs = list(banned_keywords)

    keywords = []
    seen_orig = set()
    for item in banned_docs:
        if isinstance(item, dict):
            if item.get("is_active", True) is False:
                continue
            raw_kw = str(item.get("keyword") or item.get("word") or "").strip()
        else:
            raw_kw = str(item or "").strip()
        if raw_kw and raw_kw not in seen_orig:
            seen_orig.add(raw_kw)
            keywords.append(raw_kw)

    if not keywords:
        return []

    raw_haystack = " ".join(
        str(job.get(field) or "")
        for field in ("title", "description", "requirements", "benefits", "company_name", "branch_name", "work_time")
    )
    haystack_norm = _strip_accents_lower(raw_haystack)
    if not haystack_norm.strip():
        return []
    haystack_compact = re.sub(r"\s+", "", haystack_norm)

    matched_kws = []
    for orig_kw in sorted(keywords, key=len, reverse=True):
        norm_kw = _strip_accents_lower(orig_kw).strip()
        if not norm_kw:
            continue
        compact_kw = re.sub(r"\s+", "", norm_kw)
        if norm_kw in haystack_norm or (len(compact_kw) >= 4 and compact_kw in haystack_compact):
            matched_kws.append(orig_kw)
    return matched_kws

def auto_adjust_job_moderation(job: dict, banned_keywords=None, persist=True) -> dict:
    """
    Quy tắc kiểm duyệt tin tuyển dụng tự động:
    • Tin sạch (không dính từ cấm) -> tự động đẩy qua Công khai ngay (is_admin_reviewed=True, is_hidden=False), Quản trị viên không cần duyệt và nhà tuyển dụng không phải chờ.
    • Tin dính từ khóa nhạy cảm (như đặt cọc, nạp tiền...) -> tự động giữ ở trạng thái Chờ kiểm duyệt (ẩn với Sinh viên) cho tới khi Admin bấm Duyệt tin hoặc Ẩn.
    """
    if not isinstance(job, dict):
        return job

    matched_kws = scan_job_banned_keywords(job, banned_keywords)
    has_sensitive = len(matched_kws) > 0
    job["matched_banned_keywords"] = matched_kws
    job["has_sensitive_keywords"] = has_sensitive

    update_fields = {}

    if not has_sensitive:
        # Tin sạch: Tự động Công khai ngay
        is_manually_hidden_by_admin = bool(
            job.get("is_hidden")
            and job.get("is_admin_reviewed")
            and job.get("hidden_reason")
            and "từ khóa nhạy cảm" not in str(job.get("hidden_reason")).lower()
        )
        if not is_manually_hidden_by_admin:
            if job.get("is_admin_reviewed") is not True or job.get("is_hidden") is not False:
                job["is_admin_reviewed"] = True
                job["is_hidden"] = False
                job["hidden_reason"] = ""
                update_fields = {
                    "is_admin_reviewed": True,
                    "is_hidden": False,
                    "hidden_reason": "",
                    "has_sensitive_keywords": False,
                    "matched_banned_keywords": []
                }
    else:
        # Tin dính từ cấm: Giữ chờ duyệt ẩn với sinh viên trừ khi admin đã duyệt thủ công
        has_admin_reviewed = bool(job.get("moderation_reviewed_at"))
        if not has_admin_reviewed:
            reason = f"Tin chứa từ khóa nhạy cảm ({', '.join(matched_kws)}), tạm ẩn chờ Quản trị viên kiểm duyệt."
            if job.get("is_admin_reviewed") is not False or job.get("is_hidden") is not True:
                job["is_admin_reviewed"] = False
                job["is_hidden"] = True
                job["hidden_reason"] = reason
                update_fields = {
                    "is_admin_reviewed": False,
                    "is_hidden": True,
                    "hidden_reason": reason,
                    "has_sensitive_keywords": True,
                    "matched_banned_keywords": matched_kws
                }

    if persist and update_fields and job.get("_id"):
        db_manager.get_collection("jobs").update_one({"_id": job["_id"]}, {"$set": update_fields})

    return job

@common_bp.route("/banned-keywords", methods=["GET"])
def get_public_banned_keywords():
    ban_col = db_manager.get_collection("banned_keywords")
    kws = [
        str(item.get("keyword", "")).strip()
        for item in ban_col.find({})
        if item.get("keyword")
    ]
    return jsonify({"success": True, "data": kws})

def get_user_display_name(user):
    if not user:
        return "Người dùng"
    if user.get("role") == "student":
        stu_profile = db_manager.get_collection("student_profiles").find_one({"user_id": user["_id"]})
        if stu_profile and stu_profile.get("full_name"):
            return stu_profile.get("full_name")
        return user.get("full_name") or user.get("email") or "Sinh viên"
    else:
        emp = db_manager.get_collection("employers").find_one({"user_id": user["_id"]})
        if emp:
            comp = db_manager.get_collection("company_profiles").find_one({"employer_id": emp["_id"]})
            if comp:
                rep = comp.get("representative_name")
                cname = comp.get("company_name")
                if rep and cname:
                    return f"{rep} ({cname})"
                return cname or rep or "Doanh nghiệp"
        return user.get("company_name") or user.get("representative_name") or "Nhà tuyển dụng"

@common_bp.route("/chat/messages", methods=["GET"])
@token_required
def get_messages():
    raw_room_id = request.args.get("room_id", "default_room")
    room_variants = get_room_id_variants(raw_room_id)
    msg_col = db_manager.get_collection("messages")
    messages = list(msg_col.find({"room_id": {"$in": room_variants}}))

    # Sắp xếp chuẩn hóa để tin nhắn và bản ghi cuộc gọi luôn ở cuối danh sách theo thứ tự thời gian
    for m in messages:
        if m.get("file_id"):
            m["media_url"] = f"/api/files/{m['file_id']}"
    messages.sort(key=chat_msg_sort_key)
    return jsonify({"success": True, "data": messages})

@common_bp.route("/chat/messages", methods=["POST"])
@token_required
def send_message():
    user = request.current_user
    data = request.get_json() or {}
    raw_room_id = data.get("room_id", "default_room")
    app_id = str(data.get("application_id") or "").strip()
    if app_id and isinstance(raw_room_id, str) and raw_room_id.startswith("room_emp_") and "_app_" not in raw_room_id:
        raw_room_id = f"{raw_room_id}_app_{app_id}"
    room_id = canonicalize_room_id(raw_room_id)
    content = str(data.get("content", "")).strip()
    media_url = data.get("media_url", "")
    file_name = str(data.get("file_name", "")).strip()
    file_size = int(data.get("file_size", 0))

    if not content and not media_url:
        return jsonify({"success": False, "message": "Nội dung tin nhắn không được để trống."}), 400

    # Chặn gửi tin nhắn nếu tài khoản bị khóa hoặc vô hiệu hóa
    if user.get("is_banned") or not user.get("is_active", True):
        return jsonify({
            "success": False, 
            "message": "Tài khoản của bạn đã bị khóa hoặc vô hiệu hóa. Cuộc trò chuyện đang ở chế độ CHỈ ĐỌC!"
        }), 403

    # Ràng buộc FR 2.7.1, 2.7.2: Nhà tuyển dụng chỉ gửi được tin nhắn khi sinh viên đang có đơn Chờ duyệt hoặc Đã duyệt
    if user.get("role") == "employer":
        app_col = db_manager.get_collection("applications")
        emp = db_manager.get_collection("employers").find_one({"user_id": user["_id"]})
        student_id = data.get("student_id") or data.get("target_id")
        if not app_id and isinstance(room_id, str) and "_app_" in room_id:
            app_id = room_id.split("_app_", 1)[1].strip()

        query_app = {}
        if emp:
            query_app["employer_id"] = emp["_id"]
        if app_id:
            query_app["_id"] = app_id
        elif student_id:
            query_app["$or"] = [{"student_id": student_id}, {"student_user_id": student_id}]

        if query_app:
            app_record = app_col.find_one(query_app)
            if app_record:
                app_st = app_record.get("application_status", "")
                if app_st in ["rejected", "cancelled", "withdrawn"] or app_record.get("is_cancelled"):
                    return jsonify({
                        "success": False,
                        "message": "Đơn ứng tuyển đã bị 'Từ chối' hoặc 'Đã hủy'. Hệ thống giới hạn cuộc trò chuyện ở chế độ CHỈ ĐỌC (Read-Only) và không cho phép gửi thêm tin nhắn!"
                    }), 403

    # BR-CH-10: đơn đã Từ chối/Hủy -> phòng chat Chỉ đọc cho cả Sinh viên
    if user.get("role") == "student":
        if not app_id and isinstance(room_id, str) and "_app_" in room_id:
            app_id = room_id.split("_app_", 1)[1].strip()
        if app_id:
            app_record = db_manager.get_collection("applications").find_one({"_id": app_id})
            if app_record and (app_record.get("application_status") in ["rejected", "cancelled", "withdrawn"] or app_record.get("is_cancelled")):
                return jsonify({
                    "success": False,
                    "message": "Đơn ứng tuyển đã bị 'Từ chối' hoặc 'Đã hủy'. Cuộc trò chuyện ở chế độ CHỈ ĐỌC (Read-Only), không thể gửi thêm tin nhắn!"
                }), 403

    # Ràng buộc tệp đính kèm Chat: chỉ .pdf, .png, .jpg <= 10MB; chặn tệp thực thi/nén
    if file_name:
        ext = file_name.lower().split(".")[-1] if "." in file_name else ""
        if ext not in ["pdf", "png", "jpg", "jpeg"]:
            return jsonify({"success": False, "message": "Tệp đính kèm chỉ chấp nhận định dạng .pdf, .png, .jpg. Hệ thống chặn các tệp thực thi (.exe, .bat...) hoặc nén (.zip, .rar...)!"}), 400
        if file_size > MAX_UPLOAD_BYTES:
            return jsonify({"success": False, "message": "Dung lượng tệp đính kèm vượt quá 10MB!"}), 400

    # Nếu gửi base64 đính kèm, đẩy thẳng vào MongoDB GridFS để cả 2 bên mở xem được
    file_id = None
    if media_url and isinstance(media_url, str) and media_url.startswith("data:"):
        try:
            file_id, media_url = db_manager.save_data_url(
                media_url,
                filename=file_name or "attachment.pdf",
                allowed_types=("application/pdf", "image/png", "image/jpeg", "image/jpg"),
                metadata={"type": "chat_attachment", "room_id": room_id, "sender_id": user["_id"]},
                allow_pdf_magic=True
            )
        except ValueError as e:
            return jsonify({"success": False, "message": str(e)}), 400
        except Exception as e:
            return jsonify({"success": False, "message": f"Không thể lưu tệp đính kèm: {str(e)}"}), 400

    # Lọc từ cấm tự động: vẫn giữ nội dung gốc để người dùng đọc được nhằm mục đích báo cáo
    clean_content, was_flagged, flagged_words = filter_content_banned_words(content)

    sender_name = get_user_display_name(user)
    new_msg = {
        "_id": f"msg_{uuid.uuid4().hex[:8]}",
        "room_id": room_id,
        "sender_id": user["_id"],
        "sender_email": user["email"],
        "sender_role": user["role"],
        "sender_name": sender_name,
        "content": clean_content,  # Nội dung đã lọc *** theo chuẩn BR-ADM-05
        "original_content": content,  # Lưu trữ nội dung gốc để hiển thị khi người dùng bấm xem/báo cáo vi phạm
        "clean_content": clean_content,
        "is_flagged": was_flagged,
        "flagged_words": flagged_words,
        "media_url": media_url,
        "file_id": file_id,
        "file_name": file_name,
        "message_status": "sent",
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    db_manager.get_collection("messages").insert_one(new_msg)
    
    # Phát tin nhắn mới theo thời gian thực qua WebSocket tới phòng chat & người nhận
    emit_socket_event("new-chat-message", new_msg, room=room_id)
    if raw_room_id != room_id:
        emit_socket_event("new-chat-message", new_msg, room=raw_room_id)

    # Đẩy thông báo thời gian thực cho đúng đối tác trong phòng chat (FR 1.9 & 2.8)
    target_user_id = resolve_chat_partner_user_id(room_id, user.get("role", "student"))
    if target_user_id and target_user_id != user.get("_id"):
        emit_socket_event("new-chat-message", new_msg, room=f"user_{target_user_id}")
        create_and_emit_notification(
            user_id=target_user_id,
            title=f"Tin nhắn mới từ {sender_name}",
            message=clean_content[:90] + ("..." if len(clean_content) > 90 else ""),
            notif_type="chat_message",
            related_id=room_id,
        )

    warning_note = " (Lưu ý: Tin nhắn chứa từ ngữ nhạy cảm đã được hệ thống tự động lọc.)" if was_flagged else ""
    return jsonify({
        "success": True,
        "message": f"Gửi tin nhắn thành công!{warning_note}",
        "data": new_msg
    }), 201

# --- WEBRTC TWO-WAY CALL SIGNALING (FR 1.10.4 & 2.9.4) ---
ACTIVE_CALL_SESSIONS = {}

def _emit_call_event(event_name, payload, sess, room_id, raw_room_id=None, include_caller=True):
    """Chỉ gửi tín hiệu cuộc gọi tới đúng phòng & đúng 2 người trong cuộc gọi (không phát cho mọi client)."""
    targets = []
    for r in (room_id, raw_room_id):
        if r and r not in targets:
            targets.append(r)
    for uid in (sess.get("target_user_id"), sess.get("caller_id") if include_caller else None):
        if uid and f"user_{uid}" not in targets:
            targets.append(f"user_{uid}")
    for tgt in targets:
        emit_socket_event(event_name, payload, room=tgt)

def _is_call_participant(sess, user):
    """Chỉ người gọi hoặc đúng người nhận của phiên cuộc gọi mới được xem / phản hồi."""
    uid = user.get("_id")
    if not sess or not uid:
        return False
    if uid in (sess.get("caller_id"), sess.get("target_user_id")):
        return True
    if user.get("role") == sess.get("caller_role"):
        return False
    room = str(sess.get("room_id", ""))
    if user.get("role") == "employer":
        emp = db_manager.get_collection("employers").find_one({"user_id": uid})
        emp_id = emp["_id"] if emp else ""
        return bool(emp_id) and f"room_emp_{emp_id}_stu_" in room
    return f"_stu_{uid}" in room

@common_bp.route("/chat/call/initiate", methods=["POST"])
@token_required
def initiate_call():
    user = request.current_user
    data = request.get_json() or {}
    raw_room_id = data.get("room_id", "default_room")
    room_id = canonicalize_room_id(raw_room_id)
    call_type = data.get("call_type", "video") # 'video' or 'audio'
    
    caller_role = user.get("role", "student")
    target_role = "employer" if caller_role == "student" else "student"
    caller_name = get_user_display_name(user)

    # Xác định chính xác target_user_id theo phòng
    target_user_id = resolve_chat_partner_user_id(room_id, caller_role)
    
    # Nếu đối phương cũng đang đổ chuông tới mình thì lập tức kết nối thông suốt hai chiều
    existing_call = ACTIVE_CALL_SESSIONS.get(room_id) or ACTIVE_CALL_SESSIONS.get(raw_room_id)
    if existing_call and existing_call.get("status") == "ringing" and existing_call.get("caller_role") != caller_role:
        existing_call["status"] = "connected"
        existing_call["connected_at"] = time.time()
        ACTIVE_CALL_SESSIONS[room_id] = existing_call
        ACTIVE_CALL_SESSIONS[raw_room_id] = existing_call
        return jsonify({"success": True, "call": existing_call, "message": "Đã tự động kết nối cuộc gọi hai chiều thành công!"}), 200

    offer = data.get("offer")
    call_id = f"call_{uuid.uuid4().hex[:8]}"
    call_session = {
        "call_id": call_id,
        "room_id": room_id,
        "raw_room_id": raw_room_id,
        "caller_id": user["_id"],
        "caller_email": user["email"],
        "caller_name": caller_name,
        "caller_role": caller_role,
        "target_role": target_role,
        "target_user_id": target_user_id,
        "call_type": call_type,
        "offer": offer,
        "status": "ringing", # ringing | connected | declined | ended
        "timestamp": time.time(),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    ACTIVE_CALL_SESSIONS[room_id] = call_session
    if raw_room_id != room_id:
        ACTIVE_CALL_SESSIONS[raw_room_id] = call_session

    # Đẩy thông báo chuông gọi đến đích danh người nhận
    _emit_call_event("incoming-call", {
        "room_id": room_id,
        "raw_room_id": raw_room_id,
        "caller_name": caller_name,
        "caller_role": caller_role,
        "caller_id": user["_id"],
        "target_role": target_role,
        "target_user_id": target_user_id,
        "call_type": call_type,
        "status": "ringing",
        "offer": offer
    }, call_session, room_id, raw_room_id if raw_room_id != room_id else None, include_caller=False)

    if target_user_id:
        create_and_emit_notification(
            user_id=target_user_id,
            title=f"Cuộc gọi {('Video' if call_type == 'video' else 'Thoại')} đến từ {caller_name}",
            message="Có cuộc gọi phỏng vấn trực tuyến đang đổ chuông, vui lòng nhấp vào để nghe máy!",
            notif_type="incoming_call",
            related_id=room_id,
        )

    return jsonify({"success": True, "call": call_session}), 201

@common_bp.route("/chat/call/status", methods=["GET"])
@token_required
def get_call_status():
    if not ACTIVE_CALL_SESSIONS:
        return jsonify({"success": True, "call": None})
    user = request.current_user
    raw_room_id = request.args.get("room_id", "default_room")
    room_id = canonicalize_room_id(raw_room_id)
    call_session = ACTIVE_CALL_SESSIONS.get(room_id) or ACTIVE_CALL_SESSIONS.get(raw_room_id)
    if call_session and not _is_call_participant(call_session, user):
        call_session = None
    
    # Nếu không tìm thấy trong phòng cụ thể, kiểm tra xem có bất kỳ cuộc gọi nào đang đổ chuông tới tài khoản này không
    if not call_session or call_session.get("status") not in ["ringing", "connected"]:
        for sess in list(ACTIVE_CALL_SESSIONS.values()):
            if sess.get("status") == "ringing":
                # Kiểm tra xem user này có phải là đối tượng nhận cuộc gọi không
                is_target = sess.get("target_role") == user.get("role") and _is_call_participant(sess, user)
                
                if is_target:
                    call_session = sess
                    break
    
    if call_session:
        # Hết hạn đổ chuông tối đa 3 phút (180 giây) nếu không ai nhấc máy -> Chuyển thành Cuộc gọi nhỡ
        if call_session.get("status") == "ringing" and (time.time() - call_session.get("timestamp", 0) > 180):
            call_session["status"] = "missed"
            call_session["end_reason"] = "timeout_3min"
            call_session["ended_at"] = time.time()
            
            # Ghi nhận bản ghi cuộc gọi nhỡ vào lịch sử chat
            try:
                now_h_m = time.strftime("%H:%M")
                now_full = time.strftime("%Y-%m-%d %H:%M:%S")
                target_room_id = call_session.get("room_id", room_id)
                call_msg = {
                    "_id": f"msg_call_{uuid.uuid4().hex[:8]}",
                    "room_id": target_room_id,
                    "raw_room_id": raw_room_id,
                    "sender_id": call_session.get("caller_id"),
                    "caller_id": call_session.get("caller_id"),
                    "sender_name": call_session.get("caller_name"),
                    "caller_name": call_session.get("caller_name"),
                    "sender_role": call_session.get("caller_role"),
                    "caller_role": call_session.get("caller_role"),
                    "content": f"Cuộc gọi nhỡ ({'Video' if call_session.get('call_type') == 'video' else 'Thoại'}) - Không trả lời sau 3 phút",
                    "type": "call_record",
                    "call_status": "missed",
                    "call_type": call_session.get("call_type"),
                    "duration": 0,
                    "duration_str": "0:00",
                    "created_at": now_h_m,
                    "date": time.strftime("%Y-%m-%d"),
                    "created_at_full": now_full,
                    "timestamp": now_full
                }
                db_manager.get_collection("messages").insert_one(call_msg)
                emit_socket_event("new-chat-message", call_msg, room=target_room_id)
                if raw_room_id != target_room_id:
                    emit_socket_event("new-chat-message", call_msg, room=raw_room_id)
            except Exception as e:
                print(f"[Call Log Error] {e}")
            
    return jsonify({"success": True, "call": call_session})

@common_bp.route("/chat/call/respond", methods=["POST"])
@token_required
def respond_call():
    user = request.current_user
    data = request.get_json() or {}
    raw_room_id = data.get("room_id", "default_room")
    room_id = canonicalize_room_id(raw_room_id)
    action = data.get("action", "accept") # 'accept' | 'decline' | 'missed'
    answer = data.get("answer")
    
    call_session = ACTIVE_CALL_SESSIONS.get(room_id) or ACTIVE_CALL_SESSIONS.get(raw_room_id)
    if not call_session:
        # Fallback tìm cuộc gọi theo session ringing gần nhất cho user này
        for sess in list(ACTIVE_CALL_SESSIONS.values()):
            if sess.get("target_role") == user.get("role") and _is_call_participant(sess, user):
                call_session = sess
                break

    if not call_session or not _is_call_participant(call_session, user):
        return jsonify({"success": False, "message": "Không tìm thấy phiên cuộc gọi."}), 404
        
    if action == "accept":
        call_session["status"] = "connected"
        call_session["connected_at"] = time.time()
        if answer:
            call_session["answer"] = answer
            _emit_call_event("answer-made", {"room_id": room_id, "answer": answer}, call_session, room_id)
    elif action == "missed":
        call_session["status"] = "missed"
        call_session["ended_at"] = time.time()
        try:
            now_h_m = time.strftime("%H:%M")
            now_full = time.strftime("%Y-%m-%d %H:%M:%S")
            target_room_id = call_session.get("room_id", room_id)
            call_msg = {
                "_id": f"msg_call_{uuid.uuid4().hex[:8]}",
                "room_id": target_room_id,
                "raw_room_id": raw_room_id,
                "sender_id": call_session.get("caller_id"),
                "caller_id": call_session.get("caller_id"),
                "caller_name": call_session.get("caller_name"),
                "caller_role": call_session.get("caller_role"),
                "call_type": call_session.get("call_type", "video"),
                "content": f"Cuộc gọi nhỡ ({'Video' if call_session.get('call_type') == 'video' else 'Thoại'}) - Không trả lời sau 3 phút đổ chuông",
                "type": "call_record",
                "call_status": "missed",
                "duration": 0,
                "duration_str": "0:00",
                "created_at": now_h_m,
                "date": time.strftime("%Y-%m-%d"),
                "created_at_full": now_full,
                "timestamp": now_full
            }
            db_manager.get_collection("messages").insert_one(call_msg)
            emit_socket_event("new-chat-message", call_msg, room=target_room_id)
            if raw_room_id != target_room_id:
                emit_socket_event("new-chat-message", call_msg, room=raw_room_id)
            target_uid = call_session.get("target_user_id") or resolve_chat_partner_user_id(room_id, user.get("role", "student"))
            if target_uid:
                emit_socket_event("new-chat-message", call_msg, room=f"user_{target_uid}")
            if call_session.get("caller_id"):
                emit_socket_event("new-chat-message", call_msg, room=f"user_{call_session.get('caller_id')}")
        except Exception:
            pass
    else:
        call_session["status"] = "declined"
        call_session["ended_at"] = time.time()
        try:
            now_h_m = time.strftime("%H:%M")
            now_full = time.strftime("%Y-%m-%d %H:%M:%S")
            target_room_id = call_session.get("room_id", room_id)
            call_msg = {
                "_id": f"msg_call_{uuid.uuid4().hex[:8]}",
                "room_id": target_room_id,
                "raw_room_id": raw_room_id,
                "sender_id": call_session.get("caller_id"),
                "caller_id": call_session.get("caller_id"),
                "caller_name": call_session.get("caller_name"),
                "caller_role": call_session.get("caller_role"),
                "call_type": call_session.get("call_type", "video"),
                "content": f"Cuộc gọi ({'Video' if call_session.get('call_type') == 'video' else 'Thoại'}) - Người nhận từ chối cuộc gọi",
                "type": "call_record",
                "call_status": "missed",
                "duration": 0,
                "duration_str": "0:00",
                "created_at": now_h_m,
                "date": time.strftime("%Y-%m-%d"),
                "created_at_full": now_full,
                "timestamp": now_full
            }
            db_manager.get_collection("messages").insert_one(call_msg)
            emit_socket_event("new-chat-message", call_msg, room=target_room_id)
            if raw_room_id != target_room_id:
                emit_socket_event("new-chat-message", call_msg, room=raw_room_id)
            target_uid = call_session.get("target_user_id") or resolve_chat_partner_user_id(room_id, user.get("role", "student"))
            if target_uid:
                emit_socket_event("new-chat-message", call_msg, room=f"user_{target_uid}")
            if call_session.get("caller_id"):
                emit_socket_event("new-chat-message", call_msg, room=f"user_{call_session.get('caller_id')}")
        except Exception:
            pass
        
    return jsonify({"success": True, "call": call_session})

@common_bp.route("/chat/call/end", methods=["POST"])
@token_required
def end_call():
    user = request.current_user
    data = request.get_json() or {}
    raw_room_id = data.get("room_id", "default_room")
    room_id = canonicalize_room_id(raw_room_id)
    
    call_session = ACTIVE_CALL_SESSIONS.get(room_id) or ACTIVE_CALL_SESSIONS.get(raw_room_id)
    if not call_session:
        for sess in list(ACTIVE_CALL_SESSIONS.values()):
            if sess.get("status") in ("ringing", "connected") and (sess.get("caller_id") == user["_id"] or sess.get("target_user_id") == user["_id"]):
                call_session = sess
                break

    # Không có phiên cuộc gọi thật (hoặc phiên đã kết thúc/ghi nhận rồi) -> không tạo bản ghi cuộc gọi ảo
    if not call_session or call_session.get("status") in ("ended", "missed", "declined"):
        return jsonify({"success": True, "message": "Không có cuộc gọi đang diễn ra."})

    if call_session:
        call_session["status"] = "ended"
        call_session["ended_at"] = time.time()

    caller_id = call_session.get("caller_id") if call_session else user["_id"]
    caller_role = call_session.get("caller_role") if call_session else user.get("role", "student")
    caller_name = call_session.get("caller_name") if call_session else (user.get("profile", {}).get("full_name") or user.get("full_name") or "Đối tác")
    call_type = call_session.get("call_type", "video") if call_session else data.get("call_type", "video")

    conn_at = call_session.get("connected_at") if call_session else None
    duration = int(time.time() - conn_at) if conn_at else int(data.get("duration", 0))
    duration_str = f"{duration // 60}:{duration % 60:02d}"
        
    try:
        now_h_m = time.strftime("%H:%M")
        now_full = time.strftime("%Y-%m-%d %H:%M:%S")
        target_room_id = call_session.get("room_id", room_id)
        call_msg = {
            "_id": f"msg_call_{uuid.uuid4().hex[:8]}",
            "room_id": target_room_id,
            "raw_room_id": raw_room_id,
            "sender_id": user["_id"],
            "caller_id": caller_id,
            "caller_name": caller_name,
            "caller_role": caller_role,
            "call_type": call_type,
            "content": f"Cuộc gọi kết thúc (Thời lượng đàm thoại: {duration_str})",
            "type": "call_record",
            "call_status": "ended",
            "duration": duration,
            "duration_str": duration_str,
            "created_at": now_h_m,
            "date": time.strftime("%Y-%m-%d"),
            "created_at_full": now_full,
            "timestamp": now_full
        }
        db_manager.get_collection("messages").insert_one(call_msg)
        emit_socket_event("new-chat-message", call_msg, room=target_room_id)
        if raw_room_id != target_room_id:
            emit_socket_event("new-chat-message", call_msg, room=raw_room_id)
        target_uid = (call_session.get("target_user_id") if call_session else None) or resolve_chat_partner_user_id(room_id, user.get("role", "student"))
        if target_uid:
            emit_socket_event("new-chat-message", call_msg, room=f"user_{target_uid}")
        if caller_id:
            emit_socket_event("new-chat-message", call_msg, room=f"user_{caller_id}")
    except Exception as e:
        print(f"[Call End Error] {e}")

    # Dọn dẹp session đã kết thúc
    ACTIVE_CALL_SESSIONS.pop(room_id, None)
    ACTIVE_CALL_SESSIONS.pop(raw_room_id, None)
    if call_session and call_session.get("call_id"):
        for k in list(ACTIVE_CALL_SESSIONS.keys()):
            if ACTIVE_CALL_SESSIONS[k].get("call_id") == call_session.get("call_id"):
                ACTIVE_CALL_SESSIONS.pop(k, None)
    
    return jsonify({"success": True, "message": "Đã kết thúc cuộc gọi."})


# 5. Notifications
def _notif_owner_filter(user, notif_id=None):
    u_id = str(user.get("_id", ""))
    u_role = user.get("role", "")
    
    if u_role == "admin":
        owner_filter = {
            "$or": [
                {"user_id": u_id},
                {"user_aliases": u_id},
                {"role": "admin"},
                {"user_id": "role_admin"}
            ]
        }
    elif u_role == "employer":
        from src.api.employer.employer_routes import _get_employer_identities
        emp_ids = _get_employer_identities(user)
        owner_filter = {
            "$or": [
                {"user_id": {"$in": emp_ids}},
                {"user_aliases": {"$in": emp_ids}},
                {"target_id": {"$in": emp_ids}},
                {"user_id": "role_employer"},
                {"target": "all_employers"}
            ]
        }
    elif u_role == "student":
        from src.api.student.student_routes import _get_student_identities
        stu_ids = _get_student_identities(user)
        owner_filter = {
            "$or": [
                {"user_id": {"$in": stu_ids}},
                {"user_aliases": {"$in": stu_ids}},
                {"target_id": {"$in": stu_ids}},
                {"user_id": "role_student"},
                {"target": "all_students"}
            ]
        }
    else:
        owner_filter = {"$or": [{"user_id": u_id}, {"user_aliases": u_id}]}

    if notif_id:
        return {"$and": [{"_id": notif_id}, owner_filter]}
    return owner_filter

@common_bp.route("/notifications", methods=["GET"])
@token_required
def get_my_notifications():
    user = request.current_user
    notif_col = db_manager.get_collection("notifications")
    query = {"$and": [_notif_owner_filter(user), {"is_deleted": {"$ne": True}}]}
    notifs = list(notif_col.find(query).sort("created_at", -1))
    return jsonify({"success": True, "data": notifs})

@common_bp.route("/notifications/<notif_id>/read", methods=["PUT"])
@token_required
def mark_notification_read(notif_id):
    user = request.current_user
    notif_col = db_manager.get_collection("notifications")
    notif_col.update_one(_notif_owner_filter(user, notif_id), {"$set": {"is_read": True}})
    return jsonify({"success": True, "message": "Đã đánh dấu đã đọc."})

@common_bp.route("/notifications/read-all", methods=["PUT"])
@token_required
def mark_all_notifications_read():
    user = request.current_user
    notif_col = db_manager.get_collection("notifications")
    query = {"$and": [_notif_owner_filter(user), {"is_deleted": {"$ne": True}}, {"is_read": {"$ne": True}}]}
    notif_col.update_many(query, {"$set": {"is_read": True}})
    return jsonify({"success": True, "message": "Đã đánh dấu tất cả thông báo đã đọc."})

@common_bp.route("/notifications/<notif_id>", methods=["DELETE"])
@token_required
def delete_my_notification(notif_id):
    user = request.current_user
    notif_col = db_manager.get_collection("notifications")
    notif_col.update_one(_notif_owner_filter(user, notif_id), {"$set": {"is_deleted": True}})
    return jsonify({"success": True, "message": "Đã xóa thông báo thành công!"})

# 6. Violation Report Submission (FR 1.5.7, 2.5.6)
@common_bp.route("/reports", methods=["POST"])
@token_required
def submit_report():
    user = request.current_user
    data = request.get_json() or {}
    report_type = data.get("report_type", "job") # job, user, chat
    target_id = data.get("target_id", "")
    reason = str(data.get("reason", "")).strip()

    if not reason:
        return jsonify({"success": False, "message": "Vui lòng nhập lý do báo cáo vi phạm."}), 400

    ticket_code = f"TK-2026-{uuid.uuid4().hex[:4].upper()}"
    reporter_name = get_user_display_name(user) or user.get("full_name") or user.get("email")
    reporter_role_label = "Sinh viên" if user.get("role") == "student" else ("Doanh nghiệp" if user.get("role") == "employer" else "Người dùng")

    new_report = {
        "_id": f"rep_{uuid.uuid4().hex[:8]}",
        "ticket_code": ticket_code,
        "type": report_type,
        "report_type": report_type,
        "reporter_id": user["_id"],
        "reporter_role": user.get("role", ""),
        "reporter_email": user["email"],
        "reporter_name": reporter_name,
        "target_id": target_id,
        "application_id": data.get("application_id", ""),
        "room_id": canonicalize_room_id(data.get("room_id", "")) if data.get("room_id") else "",
        "target_title": data.get("target_title", f"Đối tượng vi phạm ({target_id})"),
        "reason": reason,
        "evidence": data.get("evidence", ""),
        "status": "pending",
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    db_manager.get_collection("reports").insert_one(new_report)

    # Đẩy thông báo phiếu khiếu nại tới Quản trị viên kèm Socket.IO tức thì (FR 3.8.2)
    notify_admins(
        title=f"Phiếu khiếu nại vi phạm mới: {ticket_code}",
        message=f"{reporter_role_label} {reporter_name} vừa tạo khiếu nại về '{new_report['target_title']}'. Lý do: {reason}",
        notif_type="report_ticket",
        related_id=new_report["_id"],
        target_id=new_report["_id"],
    )
    emit_socket_event("new-report", new_report)

    return jsonify({"success": True, "message": "Đã tạo phiếu khiếu nại ở trạng thái Chờ xử lý và đẩy trực tiếp sang cho Quản trị viên giải quyết!", "data": new_report}), 201

@common_bp.route("/reports/mine", methods=["GET"])
@token_required
def list_my_submitted_reports():
    """Lấy danh sách báo cáo vi phạm / khiếu nại mà Sinh viên hoặc Nhà tuyển dụng hiện tại đã gửi để theo dõi tiến độ xử lý."""
    user = request.current_user
    identities = {str(user.get("_id") or ""), str(user.get("email") or "")}
    try:
        if user.get("role") == "student":
            stu = db_manager.get_collection("student_profiles").find_one({"user_id": user["_id"]})
            if stu and stu.get("_id"):
                identities.add(str(stu["_id"]))
        elif user.get("role") == "employer":
            emp = db_manager.get_collection("employers").find_one({"user_id": user["_id"]})
            if emp and emp.get("_id"):
                identities.add(str(emp["_id"]))
    except Exception:
        pass
    identities = [x for x in identities if x]
    rep_col = db_manager.get_collection("reports")
    my_reports = list(rep_col.find({"reporter_id": {"$in": identities}}).sort("created_at", -1))
    return jsonify({"success": True, "data": my_reports})

@common_bp.route("/announcements", methods=["GET"])
@token_required
def list_user_announcements():
    """Trả về thông báo hệ thống hàng loạt dành cho vai trò người dùng hiện tại."""
    user = request.current_user
    role = user.get("role", "student")
    ann_col = db_manager.get_collection("announcements")
    items = list(ann_col.find({"target_role": {"$in": ["all", role]}}).sort("created_at", -1))
    return jsonify({"success": True, "data": items})

