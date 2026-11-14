import logging
import time
import uuid
from flask import Blueprint, request, jsonify
from src.core.database import db_manager, MAX_UPLOAD_BYTES
from src.core.notification_service import (
    create_and_emit_notification,
    emit_socket_event,
    resolve_employer_user_id,
)
from src.core.socket_service import canonicalize_room_id, get_latest_room_message
from src.middlewares.auth_middleware import role_required

logger = logging.getLogger(__name__)
student_bp = Blueprint("student", __name__, url_prefix="/api/student")


def _store_cv_pdf(file_name: str, file_url: str, file_size: int, student_id: str):
    """Validate PDF (<= 10MB) and store base64 PDF content in GridFS without writing to disk."""
    if file_name and not file_name.lower().endswith(".pdf"):
        return None, None, (jsonify({"success": False, "message": "Chỉ nhận tệp CV định dạng .pdf (application/pdf). Hệ thống chặn mọi định dạng khác (.docx, .png, .jpg...)!"}), 400)
    if file_size > MAX_UPLOAD_BYTES:
        return None, None, (jsonify({"success": False, "message": "Dung lượng tệp CV vượt quá giới hạn 10MB!"}), 400)

    file_id = None
    if file_url and isinstance(file_url, str) and file_url.startswith("data:"):
        try:
            file_id, file_url = db_manager.save_data_url(
                file_url,
                filename=file_name or "CV.pdf",
                allowed_types=("application/pdf",),
                metadata={"type": "cv", "student_id": student_id},
                allow_pdf_magic=True
            )
        except ValueError as e:
            return None, None, (jsonify({"success": False, "message": str(e)}), 400)
        except Exception as e:
            return None, None, (jsonify({"success": False, "message": f"Không thể lưu tệp CV: {str(e)}"}), 400)

    return file_id, file_url, None


def _delete_unused_cv_file(file_url: str):
    """Remove a GridFS CV file only if no remaining resume or application references it."""
    if not db_manager.extract_file_id(file_url):
        return
    res_still_used = db_manager.get_collection("resumes").count_documents({"file_url": file_url}) > 0
    app_still_used = db_manager.get_collection("applications").count_documents({
        "$or": [{"application_snapshot.cv_url": file_url}, {"cv_url": file_url}]
    }) > 0
    if not res_still_used and not app_still_used:
        db_manager.delete_file(file_url)

def get_student_profile(user_id):
    stu_col = db_manager.get_collection("student_profiles")
    stu = stu_col.find_one({"user_id": user_id})
    if not stu:
        stu_id = f"stu_{uuid.uuid4().hex[:8]}"
        stu = {
            "_id": stu_id,
            "user_id": user_id,
            "full_name": "Sinh viên",
            "phone": "",
            "university": "Đại học Văn Lang",
            "address": "Quận 1, TP. Hồ Chí Minh"
        }
        stu_col.insert_one(stu)
    elif "address" not in stu:
        stu["address"] = "Quận 1, TP. Hồ Chí Minh"
    return stu

# 1. Profile (FR 1.3)
@student_bp.route("/profile", methods=["GET"])
@role_required("student")
def get_profile():
    user = request.current_user
    stu = get_student_profile(user["_id"])
    return jsonify({"success": True, "data": stu})

@student_bp.route("/profile", methods=["PUT"])
@role_required("student")
def update_profile():
    user = request.current_user
    stu = get_student_profile(user["_id"])
    data = request.get_json() or {}
    
    update_fields = {
        "full_name": data.get("full_name", stu.get("full_name")),
        "phone": data.get("phone", stu.get("phone")),
        "university": data.get("university", stu.get("university"))
    }
    for extra_key in ["free_schedule", "skills", "address", "bio", "avatar_url"]:
        if extra_key in data:
            update_fields[extra_key] = data[extra_key]

    db_manager.get_collection("student_profiles").update_one(
        {"_id": stu["_id"]},
        {"$set": update_fields}
    )
    if "full_name" in data:
        db_manager.get_collection("users").update_one({"_id": user["_id"]}, {"$set": {"full_name": data["full_name"]}})
    stu.update(update_fields)
    return jsonify({"success": True, "message": "Cập nhật hồ sơ thành công!", "data": stu})

# 2. CV Manager (FR 1.4)
@student_bp.route("/resumes", methods=["GET"])
@role_required("student")
def list_resumes():
    user = request.current_user
    stu = get_student_profile(user["_id"])
    res_col = db_manager.get_collection("resumes")
    cvs = list(res_col.find({"student_id": stu["_id"]}))
    return jsonify({"success": True, "data": cvs})

@student_bp.route("/resumes", methods=["POST"])
@role_required("student")
def add_resume():
    user = request.current_user
    stu = get_student_profile(user["_id"])
    data = request.get_json() or {}
    file_name = str(data.get("file_name", "CV_Moi.pdf")).strip()
    file_url = data.get("file_url", "")
    file_size = int(data.get("file_size", 0))
    is_default = data.get("is_default", False)

    # Ràng buộc FR 1.4.2, 1.4.4, 1.5.6: Chỉ nhận .pdf <= 10MB và đẩy thẳng lên GridFS
    file_id, stored_url, err_resp = _store_cv_pdf(file_name, file_url, file_size, stu["_id"])
    if err_resp:
        return err_resp

    res_col = db_manager.get_collection("resumes")
    if is_default:
        # Tắt mặc định của các CV khác
        for cv in res_col.find({"student_id": stu["_id"]}):
            res_col.update_one({"_id": cv["_id"]}, {"$set": {"is_default": False}})

    new_cv = {
        "_id": f"cv_{uuid.uuid4().hex[:8]}",
        "student_id": stu["_id"],
        "file_name": file_name,
        "file_url": stored_url,
        "file_id": file_id,
        "is_default": is_default,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    res_col.insert_one(new_cv)
    return jsonify({"success": True, "message": "Tải lên CV thành công!", "data": new_cv}), 201

@student_bp.route("/resumes/<cv_id>", methods=["PUT"])
@role_required("student")
def update_resume(cv_id):
    user = request.current_user
    stu = get_student_profile(user["_id"])
    res_col = db_manager.get_collection("resumes")
    old_cv = res_col.find_one({"_id": cv_id, "student_id": stu["_id"]})
    if not old_cv:
        return jsonify({"success": False, "message": "Không tìm thấy CV cần cập nhật."}), 404

    data = request.get_json() or {}
    file_name = str(data.get("file_name", "")).strip()
    file_url = data.get("file_url", "")
    file_size = int(data.get("file_size", 0))

    file_id, stored_url, err_resp = _store_cv_pdf(file_name, file_url, file_size, stu["_id"])
    if err_resp:
        return err_resp

    update_fields = {}
    if file_name:
        update_fields["file_name"] = file_name
    if stored_url:
        update_fields["file_url"] = stored_url
    if file_id:
        update_fields["file_id"] = file_id
    update_fields["updated_at"] = time.strftime("%Y-%m-%d %H:%M:%S")

    res_col.update_one({"_id": cv_id, "student_id": stu["_id"]}, {"$set": update_fields})
    old_url = old_cv.get("file_url", "")
    if stored_url and old_url and old_url != stored_url:
        _delete_unused_cv_file(old_url)
    return jsonify({"success": True, "message": "Thay thế file CV thành công!"})

@student_bp.route("/resumes/<cv_id>/default", methods=["PUT"])
@role_required("student")
def set_default_resume(cv_id):
    user = request.current_user
    stu = get_student_profile(user["_id"])
    res_col = db_manager.get_collection("resumes")
    
    for cv in res_col.find({"student_id": stu["_id"]}):
        res_col.update_one({"_id": cv["_id"]}, {"$set": {"is_default": (cv["_id"] == cv_id)}})
        
    return jsonify({"success": True, "message": "Đã đặt CV làm mặc định."})

@student_bp.route("/resumes/<cv_id>", methods=["DELETE"])
@role_required("student")
def delete_resume(cv_id):
    user = request.current_user
    stu = get_student_profile(user["_id"])
    res_col = db_manager.get_collection("resumes")
    old_cv = res_col.find_one({"_id": cv_id, "student_id": stu["_id"]})
    res_col.delete_one({"_id": cv_id, "student_id": stu["_id"]})
    if old_cv and old_cv.get("file_url"):
        _delete_unused_cv_file(old_cv["file_url"])
    return jsonify({"success": True, "message": "Đã xóa CV thành công."})

# 3. Bookmarks (FR 1.5.4, 1.5.8)
@student_bp.route("/bookmarks", methods=["GET"])
@role_required("student")
def get_bookmarks():
    user = request.current_user
    stu = get_student_profile(user["_id"])
    bm_col = db_manager.get_collection("bookmarks")
    job_col = db_manager.get_collection("jobs")
    
    bms = list(bm_col.find({"student_id": stu["_id"]}))
    job_ids = [b["job_id"] for b in bms]
    
    jobs = []
    for jid in job_ids:
        job = job_col.find_one({"_id": jid, "is_hidden": False})
        if job:
            jobs.append(job)
    return jsonify({"success": True, "data": jobs})

@student_bp.route("/bookmarks/<job_id>", methods=["POST", "DELETE"])
@role_required("student")
def toggle_bookmark(job_id):
    user = request.current_user
    stu = get_student_profile(user["_id"])
    bm_col = db_manager.get_collection("bookmarks")
    
    existing = bm_col.find_one({"student_id": stu["_id"], "job_id": job_id})
    if request.method == "DELETE" or existing:
        if existing:
            bm_col.delete_one({"_id": existing["_id"]})
        return jsonify({"success": True, "saved": False, "message": "Đã xóa việc làm khỏi danh sách đã lưu."})
    else:
        bm_col.insert_one({
            "_id": f"bm_{uuid.uuid4().hex[:8]}",
            "student_id": stu["_id"],
            "job_id": job_id,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        })
        return jsonify({"success": True, "saved": True, "message": "Đã lưu việc làm thành công!"})

# 4. Applications (FR 1.5.6, FR 1.6)
@student_bp.route("/applications", methods=["POST"])
@student_bp.route("/applications/<path:url_job_id>", methods=["POST"])
@role_required("student")
def apply_job(url_job_id=None):
    user = request.current_user
    stu = get_student_profile(user["_id"])
    data = request.get_json() or {}
    job_id = url_job_id or data.get("job_id")
    cover_note = data.get("cover_note", "") or data.get("cover_letter", "")
    
    if not job_id:
        return jsonify({"success": False, "message": "Vui lòng chọn việc làm để ứng tuyển."}), 400

    job_col = db_manager.get_collection("jobs")
    job = job_col.find_one({"_id": job_id})
    if not job or job.get("is_hidden") or not job.get("is_open"):
        return jsonify({"success": False, "message": "Công việc này hiện không còn nhận hồ sơ hoặc đã bị ẩn."}), 400

    app_col = db_manager.get_collection("applications")
    # Ràng buộc chặn nộp trùng
    existing = app_col.find_one({
        "student_id": stu["_id"],
        "job_id": job_id,
        "application_status": {"$in": ["pending", "reviewed", "interview", "accepted"]}
    })
    if existing:
        return jsonify({"success": False, "message": "Bạn đã nộp hồ sơ cho vị trí này và đang chờ xét duyệt."}), 409

    # Lấy CV
    res_col = db_manager.get_collection("resumes")
    cv = res_col.find_one({"student_id": stu["_id"], "is_default": True})
    if not cv:
        cvs = list(res_col.find({"student_id": stu["_id"]}))
        cv = cvs[0] if cvs else None

    # Application Snapshot
    snapshot = {
        "student_name": stu.get("full_name"),
        "phone": stu.get("phone"),
        "university": stu.get("university"),
        "cv_url": cv.get("file_url") if cv else "",
        "cv_name": cv.get("file_name") if cv else "Không có file CV",
        "cover_note": cover_note,
        "shift_registered": data.get("shift_registered") or job.get("work_time") or "Ca linh hoạt",
    }

    new_app = {
        "_id": f"app_{uuid.uuid4().hex[:8]}",
        "job_id": job_id,
        "job_title": job.get("title"),
        "company_name": job.get("company_name"),
        "employer_id": job.get("employer_id"),
        "student_id": stu["_id"],
        "student_user_id": user["_id"],
        "student_name": stu.get("full_name"),
        "work_time": job.get("work_time") or "Ca linh hoạt",
        "shift_registered": data.get("shift_registered") or job.get("work_time") or "Ca linh hoạt",
        "location": job.get("location") or job.get("address") or "TP. Hồ Chí Minh",
        "branch_name": job.get("branch_name") or job.get("location") or "",
        "salary_min": job.get("salary_min"),
        "salary_max": job.get("salary_max"),
        "application_status": "pending",
        "reject_reason": "",
        "application_snapshot": snapshot,
        "status_history": [
            {"status": "pending", "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"), "note": "Sinh viên nộp hồ sơ"}
        ],
        "applied_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    app_col.insert_one(new_app)

    # Đẩy thông báo cho Doanh nghiệp & SocketIO tức thì (≤ 3s)
    target_emp_id = job.get("employer_id")
    emp_user_id = resolve_employer_user_id(target_emp_id) or target_emp_id
    create_and_emit_notification(
        user_id=emp_user_id,
        title="Hồ sơ ứng tuyển mới",
        message=f"Sinh viên {stu.get('full_name')} vừa nộp hồ sơ vào vị trí '{job.get('title')}'.",
        notif_type="application",
        role="employer",
        related_id=new_app["_id"],
        target_id=target_emp_id,
    )
    emit_socket_event("new-application", {
        "application_id": new_app["_id"],
        "job_id": job.get("_id"),
        "employer_id": target_emp_id,
        "employer_user_id": emp_user_id,
    })

    return jsonify({"success": True, "message": "Nộp hồ sơ ứng tuyển thành công!", "data": new_app}), 201

@student_bp.route("/applications", methods=["GET"])
@role_required("student")
def list_my_applications():
    user = request.current_user
    stu = get_student_profile(user["_id"])
    app_col = db_manager.get_collection("applications")
    job_col = db_manager.get_collection("jobs")
    emp_col = db_manager.get_collection("employers")
    comp_col = db_manager.get_collection("company_profiles")
    apps = list(app_col.find({"student_id": stu["_id"], "is_deleted_by_student": {"$ne": True}}).sort("applied_at", -1))
    for a in apps:
        job = job_col.find_one({"_id": a.get("job_id")})
        if job:
            a.setdefault("work_time", job.get("work_time") or job.get("shift_schedule") or "Ca linh hoạt")
            a.setdefault("location", job.get("location") or job.get("address") or "TP. Hồ Chí Minh")
            a.setdefault("branch_name", job.get("branch_name") or job.get("location") or "")
            a.setdefault("salary_min", job.get("salary_min"))
            a.setdefault("salary_max", job.get("salary_max"))
            a.setdefault("is_negotiable", job.get("is_negotiable", False))
            a["job_status"] = job.get("job_status") or job.get("status") or ("open" if job.get("is_open", True) else "closed")
            a.setdefault("shift_date", job.get("shift_date") or job.get("work_date") or "")
            a.setdefault("shift_week", job.get("shift_week") or "")

        raw_emp_id = a.get("employer_id") or (job.get("employer_id") if job else "")
        emp_doc = emp_col.find_one({"$or": [{"_id": raw_emp_id}, {"user_id": raw_emp_id}]}) if raw_emp_id else None
        canonical_emp_id = emp_doc["_id"] if emp_doc else raw_emp_id
        if canonical_emp_id and not a.get("employer_id"):
            a["employer_id"] = canonical_emp_id

        comp_doc = comp_col.find_one({"employer_id": canonical_emp_id}) if canonical_emp_id else None
        existing_name = str(a.get("company_name") or "").strip()
        resolved_name = (
            (existing_name if existing_name and existing_name != "Doanh nghiệp" else "")
            or (job.get("company_name") if job and str(job.get("company_name") or "").strip() != "Doanh nghiệp" else "")
            or (comp_doc.get("company_name") if comp_doc else "")
            or (emp_doc.get("company_name") if emp_doc else "")
            or existing_name
            or "Doanh nghiệp"
        )
        a["company_name"] = resolved_name

        if canonical_emp_id:
            room_id = canonicalize_room_id(f"room_emp_{canonical_emp_id}_stu_{user['_id']}")
            lm = get_latest_room_message(room_id)
            if lm:
                a["last_sender_role"] = lm.get("sender_role")
                a["last_message"] = lm.get("clean_content") or lm.get("content", "")
                a["last_message_at"] = lm.get("created_at", "")
                a["unreplied"] = lm.get("sender_role") == "employer"
            else:
                a["last_sender_role"] = None
                a["last_message_at"] = a.get("applied_at", "")
                a["unreplied"] = a.get("application_status") == "pending"

    return jsonify({"success": True, "data": apps})

@student_bp.route("/applications/<app_id>/cancel", methods=["PUT"])
@role_required("student")
def cancel_application(app_id):
    user = request.current_user
    stu = get_student_profile(user["_id"])
    app_col = db_manager.get_collection("applications")
    
    app = app_col.find_one({"_id": app_id, "student_id": stu["_id"]})
    if not app:
        return jsonify({"success": False, "message": "Không tìm thấy đơn ứng tuyển."}), 404
        
    job_col = db_manager.get_collection("jobs")
    job = job_col.find_one({"_id": app.get("job_id")})
    if job and (job.get("job_status") in ["completed", "Hoàn thành"] or job.get("status") in ["completed", "Hoàn thành"]):
        return jsonify({"success": False, "message": "Không thể hủy đơn của công việc đã hoàn thành."}), 400

    prev_status = app.get("application_status")
    if prev_status not in ["pending", "accepted", "reviewed", "interview", "Chờ duyệt", "Đã duyệt"]:
        return jsonify({"success": False, "message": "Chỉ được phép hủy đơn khi trạng thái chưa hoàn thành."}), 400
        
    app_col.update_one(
        {"_id": app_id},
        {
            "$set": {
                "application_status": "withdrawn",
                "is_cancelled": True,
                "withdrawn_at": time.strftime("%Y-%m-%d %H:%M:%S")
            },
            "$push": {
                "status_history": {
                    "status": "withdrawn",
                    "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "note": "Sinh viên chủ động rút đơn"
                }
            }
        }
    )

    # FR 1.6.4: Tác động lùi trạng thái công việc
    # Nếu sinh viên rút đơn Đã duyệt cuối cùng của một công việc, tự động lùi từ "filled" -> "open"
    if prev_status in ["accepted", "Đã duyệt"]:
        remaining_accepted = app_col.count_documents({
            "job_id": app.get("job_id"),
            "application_status": {"$in": ["accepted", "Đã duyệt"]}
        })
        if remaining_accepted == 0:
            job_col.update_one(
                {
                    "_id": app.get("job_id"),
                    "$or": [
                        {"status": {"$in": ["filled", "Đã nhận người"]}},
                        {"job_status": {"$in": ["filled", "Đã nhận người"]}},
                    ],
                },
                {"$set": {"status": "open", "job_status": "open", "is_open": True}}
            )
            emit_socket_event("job-updated", {"job_id": app.get("job_id"), "status": "open"})

    # Gửi thông báo đến Doanh nghiệp và emit SocketIO tức thì
    target_emp_id = app.get("employer_id")
    emp_user_id = resolve_employer_user_id(target_emp_id) or target_emp_id
    stu_name = stu.get("full_name") or user.get("name") or "Ứng viên"
    job_title = app.get("job_title") or (job.get("title") if job else "công việc")

    create_and_emit_notification(
        user_id=emp_user_id,
        title="Ứng viên rút đơn ứng tuyển",
        message=f"Ứng viên {stu_name} đã chủ động rút đơn ứng tuyển vị trí '{job_title}'.",
        notif_type="applicant_withdrawn",
        role="employer",
        related_id=app_id,
        target_id=target_emp_id,
    )
    emit_socket_event("applicant-withdrawn", {
        "application_id": app_id,
        "job_id": app.get("job_id"),
        "student_name": stu_name,
        "employer_user_id": emp_user_id,
    })

    return jsonify({"success": True, "message": "Đã rút hồ sơ thành công!"})

@student_bp.route("/applications/<app_id>/shift-status", methods=["PUT"])
@role_required("student")
def update_shift_status(app_id):
    user = request.current_user
    stu = get_student_profile(user["_id"])
    data = request.get_json() or {}
    shift_status = str(data.get("shift_status", "upcoming")).strip()
    if shift_status not in ["upcoming", "in_progress", "completed", "cancelled"]:
        return jsonify({"success": False, "message": "Trạng thái ca làm không hợp lệ."}), 400

    app_col = db_manager.get_collection("applications")
    app = app_col.find_one({"_id": app_id, "student_id": stu["_id"]})
    if not app:
        return jsonify({"success": False, "message": "Không tìm thấy ca làm việc."}), 404

    update_fields = {"shift_status": shift_status, "shift_updated_at": time.strftime("%Y-%m-%d %H:%M:%S")}
    if "shift_date" in data:
        update_fields["shift_date"] = str(data["shift_date"]).strip()
    if "shift_week" in data:
        update_fields["shift_week"] = str(data["shift_week"]).strip()
    app_col.update_one(
        {"_id": app_id},
        {"$set": update_fields}
    )
    msg_map = {
        "in_progress": "Đã nhận ca làm việc thành công!",
        "completed": "Đã xác nhận hoàn thành ca làm việc!",
        "cancelled": "Đã hủy ca làm việc thành công!",
        "upcoming": "Đã cập nhật trạng thái ca làm việc!"
    }
    status_label_map = {
        "in_progress": "bắt đầu thực hiện ca làm",
        "completed": "xác nhận hoàn thành ca làm",
        "cancelled": "hủy ca làm",
        "upcoming": "cập nhật ca làm sắp tới",
    }
    emp_user_id = resolve_employer_user_id(app.get("employer_id")) or app.get("employer_id")
    stu_name = stu.get("full_name") or user.get("full_name") or "Ứng viên"
    if emp_user_id:
        create_and_emit_notification(
            user_id=emp_user_id,
            title="Cập nhật trạng thái ca làm việc",
            message=f"Ứng viên {stu_name} vừa {status_label_map.get(shift_status, shift_status)} cho vị trí '{app.get('job_title', 'part-time')}'.",
            notif_type="shift_status",
            role="employer",
            related_id=app_id,
            target_id=app.get("employer_id"),
        )
    emit_socket_event("shift-status-updated", {
        "application_id": app_id,
        "job_id": app.get("job_id"),
        "shift_status": shift_status,
        "employer_user_id": emp_user_id,
    })
    return jsonify({"success": True, "shift_status": shift_status, "message": msg_map.get(shift_status, "Đã cập nhật trạng thái ca làm!")})

@student_bp.route("/applications/<app_id>", methods=["DELETE"])
@role_required("student")
def delete_my_application(app_id):
    user = request.current_user
    stu = get_student_profile(user["_id"])
    app_col = db_manager.get_collection("applications")
    app = app_col.find_one({"_id": app_id, "student_id": stu["_id"]})
    if not app:
        return jsonify({"success": False, "message": "Không tìm thấy đơn ứng tuyển cần xóa."}), 404

    prev_status = app.get("application_status")
    job_id = app.get("job_id")

    # Thay vì xóa vĩnh viễn khỏi CSDL làm Doanh nghiệp bị mất đơn, đánh dấu soft delete phía Sinh viên
    # và chuyển trạng thái thành "withdrawn" để Doanh nghiệp thấy đơn ở Cột 4: Sinh Viên Rút Đơn
    app_col.update_one(
        {"_id": app_id},
        {
            "$set": {
                "is_deleted_by_student": True,
                "application_status": "withdrawn",
                "is_cancelled": True,
                "deleted_by_student_at": time.strftime("%Y-%m-%d %H:%M:%S")
            },
            "$push": {
                "status_history": {
                    "status": "withdrawn",
                    "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "note": "Sinh viên xóa đơn khỏi hồ sơ (chuyển sang đã rút)"
                }
            }
        }
    )

    if prev_status in ["accepted", "Đã duyệt"] and job_id:
        remaining_accepted = app_col.count_documents({
            "job_id": job_id,
            "application_status": {"$in": ["accepted", "Đã duyệt"]},
            "is_deleted_by_student": {"$ne": True}
        })
        if remaining_accepted == 0:
            db_manager.get_collection("jobs").update_one(
                {"_id": job_id, "status": {"$in": ["filled", "Đã nhận người"]}},
                {"$set": {"status": "open", "job_status": "open", "is_open": True}}
            )

    # Gửi thông báo đến Doanh nghiệp và emit SocketIO tức thì
    target_emp_id = app.get("employer_id")
    emp_user_id = resolve_employer_user_id(target_emp_id) or target_emp_id
    if emp_user_id:
        stu_name = stu.get("full_name") or user.get("name") or "Ứng viên"
        job = db_manager.get_collection("jobs").find_one({"_id": job_id})
        job_title = app.get("job_title") or (job.get("title") if job else "công việc")
        create_and_emit_notification(
            user_id=emp_user_id,
            title="Ứng viên rút đơn ứng tuyển",
            message=f"Ứng viên {stu_name} đã xóa/rút đơn ứng tuyển vị trí '{job_title}'.",
            notif_type="applicant_withdrawn",
            role="employer",
            related_id=app_id,
            target_id=target_emp_id,
        )
        emit_socket_event("applicant-withdrawn", {
            "application_id": app_id,
            "job_id": job_id,
            "student_name": stu_name,
            "employer_user_id": emp_user_id,
        })

    return jsonify({"success": True, "message": "Đã xóa đơn ứng tuyển thành công!"})

# 5. Reviews (FR 1.7)
@student_bp.route("/reviews", methods=["POST"])
@role_required("student")
def submit_review():
    user = request.current_user
    stu = get_student_profile(user["_id"])
    data = request.get_json() or {}
    application_id = data.get("application_id")
    rating = int(data.get("rating", 5))
    comment = str(data.get("comment", "")).strip()

    if rating < 1 or rating > 5:
        return jsonify({"success": False, "message": "Điểm đánh giá phải từ 1 đến 5 sao."}), 400
    if not comment:
        return jsonify({"success": False, "message": "Nội dung nhận xét đánh giá không được để trống."}), 400
    if len(comment) >= 1000:
        return jsonify({"success": False, "message": "Nhận xét đánh giá phải có độ dài dưới 1.000 ký tự."}), 400

    app_col = db_manager.get_collection("applications")
    app = app_col.find_one({"_id": application_id, "student_id": stu["_id"]})
    if not app:
        return jsonify({"success": False, "message": "Đơn ứng tuyển không hợp lệ."}), 404

    rev_col = db_manager.get_collection("reviews")
    existing = rev_col.find_one({"application_id": application_id, "reviewer_id": user["_id"]})
    if existing:
        return jsonify({"success": False, "message": "Bạn đã đánh giá cho công việc này rồi."}), 409

    new_rev = {
        "_id": f"rev_{uuid.uuid4().hex[:8]}",
        "application_id": application_id,
        "reviewer_id": user["_id"],
        "reviewer_name": stu.get("full_name") or user.get("full_name") or "Sinh viên",
        "target_id": app.get("employer_id"),
        "target_name": app.get("company_name") or "Doanh nghiệp",
        "job_title": app.get("job_title", "Ca làm việc"),
        "rating": rating,
        "comment": comment,
        "direction": "student_to_employer",
        "reviewer_role": "student",
        "target_role": "employer",
        "type": "student_review",
        "is_hidden": False,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    rev_col.insert_one(new_rev)

    # Thông báo cho Doanh nghiệp & Quản trị viên về đánh giá mới
    emp_user_id = resolve_employer_user_id(app.get("employer_id")) or app.get("employer_id")
    if emp_user_id:
        create_and_emit_notification(
            user_id=emp_user_id,
            title="Đánh giá mới từ Sinh viên",
            message=f"Sinh viên {new_rev['reviewer_name']} vừa đánh giá {rating}/5 sao cho công việc '{new_rev['job_title']}'.",
            notif_type="review",
            role="employer",
            related_id=new_rev["_id"],
            target_id=app.get("employer_id"),
        )
    emit_socket_event("new-review", new_rev)

    return jsonify({"success": True, "message": "Cảm ơn bạn đã gửi đánh giá!", "data": new_rev}), 201

@student_bp.route("/reviews", methods=["GET"])
@role_required("student")
def list_my_reviews():
    user = request.current_user
    rev_col = db_manager.get_collection("reviews")
    app_col = db_manager.get_collection("applications")
    reviews = list(rev_col.find({"reviewer_id": user["_id"]}).sort("created_at", -1))
    for r in reviews:
        if "application_id" in r:
            app = app_col.find_one({"_id": r["application_id"]})
            if app:
                r["job_title"] = app.get("job_title", "Việc làm đã hoàn thành")
                r["company_name"] = app.get("company_name", "Doanh nghiệp")
    return jsonify({"success": True, "data": reviews})

@student_bp.route("/reviews/<rev_id>", methods=["GET"])
@role_required("student")
def get_review_detail(rev_id):
    user = request.current_user
    rev_col = db_manager.get_collection("reviews")
    app_col = db_manager.get_collection("applications")
    rev = rev_col.find_one({"_id": rev_id, "reviewer_id": user["_id"]})
    if not rev:
        return jsonify({"success": False, "message": "Không tìm thấy bài đánh giá."}), 404
    if "application_id" in rev:
        app = app_col.find_one({"_id": rev["application_id"]})
        if app:
            rev["job_title"] = app.get("job_title", "Việc làm đã hoàn thành")
            rev["company_name"] = app.get("company_name", "Doanh nghiệp")
    return jsonify({"success": True, "data": rev})

@student_bp.route("/reviews/<rev_id>", methods=["PUT"])
@role_required("student")
def update_review(rev_id):
    user = request.current_user
    data = request.get_json() or {}
    rating = int(data.get("rating", 5))
    comment = str(data.get("comment", "")).strip()

    if rating < 1 or rating > 5:
        return jsonify({"success": False, "message": "Điểm đánh giá phải từ 1 đến 5 sao."}), 400
    if not comment:
        return jsonify({"success": False, "message": "Nội dung nhận xét đánh giá không được để trống."}), 400
    if len(comment) >= 1000:
        return jsonify({"success": False, "message": "Nhận xét đánh giá phải có độ dài dưới 1.000 ký tự."}), 400

    rev_col = db_manager.get_collection("reviews")
    rev = rev_col.find_one({"_id": rev_id, "reviewer_id": user["_id"]})
    if not rev:
        return jsonify({"success": False, "message": "Không tìm thấy đánh giá cần sửa."}), 404

    # Chặn chỉnh sửa nếu Quản trị viên đã ẩn bài đánh giá do vi phạm
    if rev.get("is_hidden"):
        return jsonify({
            "success": False, 
            "message": "Đánh giá này đã bị Quản trị viên ẩn do vi phạm tiêu chuẩn cộng đồng. Bạn không thể chỉnh sửa đánh giá này!"
        }), 403

    rev_col.update_one(
        {"_id": rev_id},
        {"$set": {"rating": rating, "comment": comment, "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")}}
    )
    return jsonify({"success": True, "message": "Đã cập nhật nội dung đánh giá thành công!"})

@student_bp.route("/reviews/<rev_id>", methods=["DELETE"])
@role_required("student")
def delete_my_review(rev_id):
    user = request.current_user
    rev_col = db_manager.get_collection("reviews")
    rev = rev_col.find_one({"_id": rev_id, "reviewer_id": user["_id"]})
    if not rev:
        return jsonify({"success": False, "message": "Không tìm thấy đánh giá cần xóa."}), 404

    rev_col.delete_one({"_id": rev_id})
    return jsonify({"success": True, "message": "Đã xóa đánh giá thành công!"})

# 6. Cover Letters (FR 1.3.3, 1.3.4, 1.3.5)
@student_bp.route("/cover-letters", methods=["GET"])
@role_required("student")
def list_cover_letters():
    user = request.current_user
    stu = get_student_profile(user["_id"])
    cl_col = db_manager.get_collection("cover_letters")
    cls = list(cl_col.find({"student_id": stu["_id"]}).sort("created_at", -1))
    return jsonify({"success": True, "data": cls})

@student_bp.route("/cover-letters", methods=["POST"])
@role_required("student")
def create_cover_letter():
    user = request.current_user
    stu = get_student_profile(user["_id"])
    data = request.get_json() or {}
    title = str(data.get("title", "")).strip() or "Thư giới thiệu bản thân"
    content = str(data.get("content", "")).strip()

    if not content:
        return jsonify({"success": False, "message": "Nội dung thư giới thiệu không được để trống."}), 400
    if len(content) > 5000:
        return jsonify({"success": False, "message": "Thư giới thiệu tối đa 5.000 ký tự theo quy định."}), 400

    new_cl = {
        "_id": f"cl_{uuid.uuid4().hex[:8]}",
        "student_id": stu["_id"],
        "title": title,
        "content": content,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    db_manager.get_collection("cover_letters").insert_one(new_cl)
    return jsonify({"success": True, "message": "Đã thêm thư giới thiệu mới!", "data": new_cl}), 201

@student_bp.route("/cover-letters/<cl_id>", methods=["PUT"])
@role_required("student")
def update_cover_letter(cl_id):
    user = request.current_user
    stu = get_student_profile(user["_id"])
    data = request.get_json() or {}
    cl_col = db_manager.get_collection("cover_letters")
    cl = cl_col.find_one({"_id": cl_id, "student_id": stu["_id"]})
    if not cl:
        return jsonify({"success": False, "message": "Không tìm thấy thư giới thiệu."}), 404

    cl_col.update_one(
        {"_id": cl_id},
        {"$set": {
            "title": data.get("title", cl.get("title")),
            "content": data.get("content", cl.get("content")),
            "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }}
    )
    return jsonify({"success": True, "message": "Đã cập nhật thư giới thiệu."})

@student_bp.route("/cover-letters/<cl_id>", methods=["DELETE"])
@role_required("student")
def delete_cover_letter(cl_id):
    user = request.current_user
    stu = get_student_profile(user["_id"])
    cl_col = db_manager.get_collection("cover_letters")
    cl_col.delete_one({"_id": cl_id, "student_id": stu["_id"]})
    return jsonify({"success": True, "message": "Đã xóa thư giới thiệu."})

# 7. Notifications (FR 1.9)
def _get_student_identities(user):
    ids = {str(user["_id"])}
    if user.get("id"):
        ids.add(str(user["id"]))
    try:
        stu = db_manager.get_collection("student_profiles").find_one({"$or": [{"user_id": user["_id"]}, {"_id": user["_id"]}]})
        if stu:
            if stu.get("_id"):
                ids.add(str(stu["_id"]))
            if stu.get("user_id"):
                ids.add(str(stu["user_id"]))
    except Exception:
        pass
    return list(ids)

@student_bp.route("/notifications", methods=["GET"])
@role_required("student")
def list_student_notifications():
    user = request.current_user
    stu_ids = _get_student_identities(user)
    notif_col = db_manager.get_collection("notifications")
    notifs = list(notif_col.find({
        "$and": [
            {
                "$or": [
                    {"user_id": {"$in": stu_ids}},
                    {"user_aliases": {"$in": stu_ids}},
                    {"target_id": {"$in": stu_ids}},
                    {"related_id": {"$in": stu_ids}},
                    {"role": "student"},
                    {"user_id": "role_student"}
                ]
            },
            {"is_deleted": {"$ne": True}}
        ]
    }).sort("created_at", -1))
    return jsonify({"success": True, "data": notifs})

@student_bp.route("/notifications/<notif_id>/read", methods=["PUT"])
@role_required("student")
def mark_read(notif_id):
    user = request.current_user
    stu_ids = _get_student_identities(user)
    notif_col = db_manager.get_collection("notifications")
    notif_col.update_one(
        {
            "_id": notif_id,
            "$or": [
                {"user_id": {"$in": stu_ids}},
                {"user_aliases": {"$in": stu_ids}},
                {"target_id": {"$in": stu_ids}},
                {"related_id": {"$in": stu_ids}},
                {"role": "student"},
                {"user_id": "role_student"}
            ]
        },
        {"$set": {"is_read": True}}
    )
    return jsonify({"success": True, "message": "Đã đọc thông báo."})

@student_bp.route("/notifications/read-all", methods=["PUT"])
@role_required("student")
def mark_all_student_read():
    user = request.current_user
    stu_ids = _get_student_identities(user)
    notif_col = db_manager.get_collection("notifications")
    notif_col.update_many(
        {
            "$and": [
                {
                    "$or": [
                        {"user_id": {"$in": stu_ids}},
                        {"user_aliases": {"$in": stu_ids}},
                        {"target_id": {"$in": stu_ids}},
                        {"related_id": {"$in": stu_ids}},
                        {"role": "student"},
                        {"user_id": "role_student"}
                    ]
                },
                {"is_deleted": {"$ne": True}},
                {"is_read": {"$ne": True}}
            ]
        },
        {"$set": {"is_read": True}}
    )
    return jsonify({"success": True, "message": "Đã đánh dấu tất cả thông báo đã đọc."})

@student_bp.route("/notifications/<notif_id>", methods=["DELETE"])
@role_required("student")
def delete_notification(notif_id):
    user = request.current_user
    stu_ids = _get_student_identities(user)
    notif_col = db_manager.get_collection("notifications")
    notif_col.update_one(
        {
            "_id": notif_id,
            "$or": [
                {"user_id": {"$in": stu_ids}},
                {"user_aliases": {"$in": stu_ids}},
                {"target_id": {"$in": stu_ids}},
                {"related_id": {"$in": stu_ids}},
                {"role": "student"},
                {"user_id": "role_student"}
            ]
        },
        {"$set": {"is_deleted": True}}
    )
    return jsonify({"success": True, "message": "Đã xóa thông báo."})


