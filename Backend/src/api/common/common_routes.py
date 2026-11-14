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
    query = {"is_active": True}
    if c_type:
        query["type"] = c_type
    cats = list(cat_col.find(query))
    filtered_cats = [
        c for c in cats
        if c.get("name") not in unwanted and c.get("_id") not in legacy_loc_ids
    ]
    return jsonify({"success": True, "data": filtered_cats})

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
    base_and = [{"is_hidden": False}]
    if include_ids:
        base_and.append({"$or": [{"is_open": True}, {"_id": {"$in": include_ids}}]})
    else:
        base_and.append({"is_open": True})

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

    # Làm giàu category_name để Frontend đồng bộ chính xác bộ lọc ngành nghề
    cat_map = {c.get("_id"): c.get("name") for c in db_manager.get_collection("categories").find({}) if c.get("_id")}
    for j in jobs:
        if not j.get("category_name") and j.get("category_id") in cat_map:
            j["category_name"] = cat_map[j["category_id"]]
        if not j.get("status") and j.get("job_status"):
            j["status"] = j["job_status"]
        elif not j.get("job_status") and j.get("status"):
            j["job_status"] = j["status"]

    return jsonify({"success": True, "total": len(jobs), "data": jobs})

@common_bp.route("/jobs/<job_id>", methods=["GET"])
def get_job_detail(job_id):
    job_col = db_manager.get_collection("jobs")
    job = job_col.find_one({"_id": job_id, "is_hidden": False})
    if not job:
        return jsonify({"success": False, "message": "Không tìm thấy tin việc làm này."}), 404
        
    # Lấy thêm thông tin công ty
    comp = db_manager.get_collection("company_profiles").find_one({"employer_id": job.get("employer_id")})
    job["company_info"] = comp or {}
    return jsonify({"success": True, "data": job})

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
    messages.sort(key=chat_msg_sort_key)
    return jsonify({"success": True, "data": messages})

@common_bp.route("/chat/messages", methods=["POST"])
@token_required
def send_message():
    user = request.current_user
    data = request.get_json() or {}
    raw_room_id = data.get("room_id", "default_room")
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
        app_id = data.get("application_id")

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
    target_user_id = None
    try:
        if "_stu_" in room_id:
            parts = room_id.split("_stu_")
            emp_part = parts[0].replace("room_emp_", "")
            stu_part = parts[1]
            if caller_role == "student":
                emp = db_manager.get_collection("employers").find_one({"$or": [{"_id": emp_part}, {"user_id": emp_part}]})
                if emp:
                    target_user_id = emp.get("user_id")
            else:
                target_user_id = stu_part
    except Exception:
        pass
    
    # Nếu đối phương cũng đang đổ chuông tới mình thì lập tức kết nối thông suốt hai chiều
    existing_call = ACTIVE_CALL_SESSIONS.get(room_id) or ACTIVE_CALL_SESSIONS.get(raw_room_id)
    if existing_call and existing_call.get("status") == "ringing" and existing_call.get("caller_role") != caller_role:
        existing_call["status"] = "connected"
        existing_call["connected_at"] = time.time()
        ACTIVE_CALL_SESSIONS[room_id] = existing_call
        ACTIVE_CALL_SESSIONS[raw_room_id] = existing_call
        return jsonify({"success": True, "call": existing_call, "message": "Đã tự động kết nối cuộc gọi hai chiều thành công!"}), 200

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
        "status": "ringing", # ringing | connected | declined | ended
        "timestamp": time.time(),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    ACTIVE_CALL_SESSIONS[room_id] = call_session
    if raw_room_id != room_id:
        ACTIVE_CALL_SESSIONS[raw_room_id] = call_session

    # Đẩy thông báo chuông gọi đến đích danh người nhận
    emit_socket_event("incoming-call", {
        "room_id": room_id,
        "raw_room_id": raw_room_id,
        "caller_name": caller_name,
        "caller_role": caller_role,
        "caller_id": user["_id"],
        "target_role": target_role,
        "target_user_id": target_user_id,
        "call_type": call_type,
        "status": "ringing"
    })

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
    user = request.current_user
    raw_room_id = request.args.get("room_id", "default_room")
    room_id = canonicalize_room_id(raw_room_id)
    call_session = ACTIVE_CALL_SESSIONS.get(room_id) or ACTIVE_CALL_SESSIONS.get(raw_room_id)
    
    # Nếu không tìm thấy trong phòng cụ thể, kiểm tra xem có bất kỳ cuộc gọi nào đang đổ chuông tới tài khoản này không
    if not call_session or call_session.get("status") not in ["ringing", "connected"]:
        for sess in list(ACTIVE_CALL_SESSIONS.values()):
            if sess.get("status") == "ringing":
                # Kiểm tra xem user này có phải là đối tượng nhận cuộc gọi không
                is_target = False
                if sess.get("target_user_id") and sess.get("target_user_id") == user["_id"]:
                    is_target = True
                elif user.get("role") == "employer" and sess.get("target_role") == "employer":
                    emp = db_manager.get_collection("employers").find_one({"user_id": user["_id"]})
                    emp_id = emp["_id"] if emp else ""
                    if (emp_id and emp_id in sess.get("room_id", "")) or (user["_id"] in sess.get("room_id", "")):
                        is_target = True
                elif user.get("role") == "student" and sess.get("target_role") == "student":
                    if user["_id"] in sess.get("room_id", ""):
                        is_target = True
                
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
                db_manager.get_collection("messages").insert_one({
                    "_id": f"msg_call_{uuid.uuid4().hex[:8]}",
                    "room_id": call_session.get("room_id", room_id),
                    "sender_id": call_session.get("caller_id"),
                    "sender_name": call_session.get("caller_name"),
                    "sender_role": call_session.get("caller_role"),
                    "content": f"Cuộc gọi nhỡ ({'Video' if call_session.get('call_type') == 'video' else 'Thoại'}) - Không trả lời sau 3 phút",
                    "type": "call_record",
                    "call_status": "missed",
                    "call_type": call_session.get("call_type"),
                    "created_at": time.strftime("%H:%M")
                })
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
    
    call_session = ACTIVE_CALL_SESSIONS.get(room_id) or ACTIVE_CALL_SESSIONS.get(raw_room_id)
    if not call_session:
        # Fallback tìm cuộc gọi theo session ringing gần nhất cho user này
        for sess in list(ACTIVE_CALL_SESSIONS.values()):
            if sess.get("target_role") == user.get("role"):
                call_session = sess
                break

    if not call_session:
        return jsonify({"success": False, "message": "Không tìm thấy phiên cuộc gọi."}), 404
        
    if action == "accept":
        call_session["status"] = "connected"
        call_session["connected_at"] = time.time()
    elif action == "missed":
        call_session["status"] = "missed"
        call_session["ended_at"] = time.time()
        try:
            db_manager.get_collection("messages").insert_one({
                "_id": f"msg_call_{uuid.uuid4().hex[:8]}",
                "room_id": call_session.get("room_id", room_id),
                "sender_id": call_session.get("caller_id"),
                "caller_id": call_session.get("caller_id"),
                "caller_name": call_session.get("caller_name"),
                "caller_role": call_session.get("caller_role"),
                "call_type": call_session.get("call_type", "video"),
                "content": f"Cuộc gọi nhỡ ({'Video' if call_session.get('call_type') == 'video' else 'Thoại'}) - Không trả lời sau 3 phút đổ chuông",
                "type": "call_record",
                "call_status": "missed",
                "created_at": time.strftime("%H:%M")
            })
        except Exception:
            pass
    else:
        call_session["status"] = "declined"
        call_session["ended_at"] = time.time()
        try:
            call_msg = {
                "_id": f"msg_call_{uuid.uuid4().hex[:8]}",
                "room_id": call_session.get("room_id", room_id),
                "sender_id": call_session.get("caller_id"),
                "caller_id": call_session.get("caller_id"),
                "caller_name": call_session.get("caller_name"),
                "caller_role": call_session.get("caller_role"),
                "call_type": call_session.get("call_type", "video"),
                "content": f"Cuộc gọi ({'Video' if call_session.get('call_type') == 'video' else 'Thoại'}) - Người nhận từ chối cuộc gọi",
                "type": "call_record",
                "call_status": "missed",
                "created_at": time.strftime("%H:%M")
            }
            db_manager.get_collection("messages").insert_one(call_msg)
            try:
                from src.core.socket_service import socketio
                socketio.emit("new-chat-message", call_msg, room=call_session.get("room_id", room_id))
            except Exception:
                pass
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
            if sess.get("caller_id") == user["_id"] or sess.get("target_user_id") == user["_id"]:
                call_session = sess
                break

    if call_session:
        call_session["status"] = "ended"
        call_session["ended_at"] = time.time()
        conn_at = call_session.get("connected_at")
        duration = int(time.time() - conn_at) if conn_at else 0
        duration_str = f"{duration // 60}:{duration % 60:02d}"
        
        try:
            call_msg = {
                "_id": f"msg_call_{uuid.uuid4().hex[:8]}",
                "room_id": call_session.get("room_id", room_id),
                "sender_id": user["_id"],
                "caller_id": call_session.get("caller_id"),
                "caller_name": call_session.get("caller_name", "Đối tác"),
                "caller_role": call_session.get("caller_role", "student"),
                "call_type": call_session.get("call_type", "video"),
                "content": f"Cuộc gọi kết thúc (Thời lượng đàm thoại: {duration_str})",
                "type": "call_record",
                "call_status": "ended",
                "duration": duration,
                "duration_str": duration_str,
                "created_at": time.strftime("%H:%M")
            }
            db_manager.get_collection("messages").insert_one(call_msg)
            try:
                from src.core.socket_service import socketio
                socketio.emit("new-chat-message", call_msg, room=call_session.get("room_id", room_id))
            except Exception:
                pass
        except Exception as e:
            print(f"[Call End Error] {e}")
        
    return jsonify({"success": True, "message": "Đã kết thúc cuộc gọi."})


# 5. Notifications
def _notif_owner_filter(user, notif_id=None):
    owner_filter = {"user_id": user["_id"]}
    if user.get("role") == "admin":
        owner_filter = {"$or": [{"user_id": user["_id"]}, {"role": "admin"}]}
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

    # Ràng buộc FR 2.5.6: Nhà tuyển dụng báo cáo ứng viên vi phạm
    # Chỉ cho phép thực hiện thao tác báo cáo này đối với những ứng viên đã có đơn ứng tuyển ở trạng thái "Đã duyệt" (accepted)
    if user.get("role") == "employer" and report_type == "applicant":
        app_col = db_manager.get_collection("applications")
        app_id = data.get("application_id")
        candidate_app = None
        if app_id:
            candidate_app = app_col.find_one({"_id": app_id})
        elif target_id:
            candidate_app = app_col.find_one({
                "$or": [{"_id": target_id}, {"student_id": target_id}, {"student_user_id": target_id}]
            })
        if candidate_app and candidate_app.get("application_status") != "accepted":
            return jsonify({
                "success": False,
                "message": "Chỉ cho phép gửi báo cáo đối với ứng viên đã có đơn ứng tuyển ở trạng thái 'Đã duyệt'!"
            }), 400

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

