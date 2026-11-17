import time
import uuid
from flask import Blueprint, request, jsonify
from src.core.database import db_manager
from src.core.notification_service import (
    create_and_emit_notification,
    emit_socket_event,
    resolve_student_user_id,
    resolve_employer_user_id,
)
from src.middlewares.auth_middleware import role_required
from src.api.common.common_routes import scan_job_banned_keywords, auto_adjust_job_moderation

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

def _record_audit_log(admin_user, action, target_type, target_id, target_label, reason="", metadata=None):
    """Ghi nhật ký hoạt động quản trị (Audit Log) cho các thao tác kiểm duyệt/khóa/xử lý."""
    try:
        admin_doc = admin_user or {}
        action_labels = {
            "BAN_USER": "Khóa tài khoản người dùng",
            "UNBAN_USER": "Mở khóa tài khoản người dùng",
            "DELETE_USER": "Xóa vĩnh viễn tài khoản",
            "APPROVE_GPKD": "Phê duyệt Giấy phép kinh doanh (GPKD)",
            "REJECT_GPKD": "Từ chối Giấy phép kinh doanh (GPKD)",
            "HIDE_JOB": "Ẩn tin tuyển dụng vi phạm",
            "UNHIDE_JOB": "Bỏ ẩn / Khôi phục tin tuyển dụng",
            "DELETE_JOB": "Xóa vĩnh viễn tin tuyển dụng",
            "APPROVE_JOB_MODERATION": "Xác nhận kiểm duyệt đạt tin tuyển dụng",
            "UPDATE_REPORT_STATUS": "Cập nhật xử lý phiếu khiếu nại",
            "DELETE_REPORT": "Xóa phiếu khiếu nại vi phạm",
            "HIDE_REVIEW": "Ẩn đánh giá vi phạm",
            "UNHIDE_REVIEW": "Khôi phục đánh giá công khai",
            "DELETE_REVIEW": "Xóa vĩnh viễn đánh giá",
            "BROADCAST_ANNOUNCEMENT": "Gửi thông báo hệ thống hàng loạt",
            "DELETE_ANNOUNCEMENT": "Xóa & thu hồi thông báo hệ thống",
        }
        log_doc = {
            "_id": f"log_{uuid.uuid4().hex[:8]}",
            "admin_id": str(admin_doc.get("_id") or "admin"),
            "admin_name": admin_doc.get("full_name") or admin_doc.get("email") or "Quản trị viên",
            "admin_email": admin_doc.get("email") or "",
            "action": action,
            "action_label": action_labels.get(action, action),
            "target_type": target_type,
            "target_id": str(target_id or ""),
            "target_label": str(target_label or target_id or ""),
            "reason": str(reason or ""),
            "metadata": metadata or {},
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        db_manager.get_collection("audit_logs").insert_one(log_doc)
        emit_socket_event("audit-log-added", log_doc)
    except Exception:
        pass

# 1. Dashboard Analytics
@admin_bp.route("/dashboard", methods=["GET"])
@role_required("admin")
def get_dashboard_stats():
    users_col = db_manager.get_collection("users")
    jobs_col = db_manager.get_collection("jobs")
    apps_col = db_manager.get_collection("applications")
    reports_col = db_manager.get_collection("reports")

    gmail_users = [
        u for u in users_col.find({})
        if str(u.get("email", "")).strip().lower().endswith("@gmail.com")
        and str(u.get("email", "")).strip().lower() != "eadeedc@gmail.com"
        and str(u.get("_id", "")).strip() != "user_student_486c9bf4"
    ]
    total_users = len(gmail_users)
    student_count = sum(1 for u in gmail_users if u.get("role") == "student")
    employer_count = sum(1 for u in gmail_users if u.get("role") == "employer")
    banned_users = sum(1 for u in gmail_users if u.get("is_banned") is True)

    real_jobs = [
        j for j in jobs_col.find({})
        if j.get("_id") not in ["job_1", "job_2", "job_3", "job_4", "job_5", "job_6"]
    ]
    total_jobs = len(real_jobs)
    active_jobs = sum(1 for j in real_jobs if j.get("is_open", True) and not j.get("is_hidden", False))
    hidden_jobs = sum(1 for j in real_jobs if j.get("is_hidden") is True)

    all_apps = list(apps_col.find({}))
    total_applications = len(all_apps)
    accepted_apps = sum(1 for a in all_apps if a.get("application_status") == "accepted")
    pending_apps = sum(1 for a in all_apps if a.get("application_status") == "pending")

    pending_reports = reports_col.count_documents({"status": "pending"})

    # Tổng hợp dữ liệu thực tế theo tháng từ dấu thời gian CSDL (không dùng số liệu giả lập)
    cur_year = time.strftime("%Y")
    growth_data = []
    for m in range(1, 13):
        prefix = f"{cur_year}-{m:02d}"
        m_users = sum(1 for u in gmail_users if str(u.get("created_at", "")).startswith(prefix))
        m_jobs = sum(1 for j in real_jobs if str(j.get("created_at", "")).startswith(prefix))
        m_apps = sum(1 for a in all_apps if str(a.get("applied_at") or a.get("created_at") or "").startswith(prefix))
        growth_data.append({
            "month": f"T{m}/{cur_year}",
            "users": m_users,
            "jobs": m_jobs,
            "applications": m_apps
        })

    applications_list = [
        {
            "_id": a.get("_id"),
            "job_id": a.get("job_id"),
            "application_status": a.get("application_status", "pending"),
            "applied_at": a.get("applied_at") or a.get("created_at") or ""
        }
        for a in all_apps
    ]

    return jsonify({
        "success": True,
        "data": {
            "metrics": {
                "total_users": total_users,
                "student_count": student_count,
                "employer_count": employer_count,
                "banned_users": banned_users,
                "total_jobs": total_jobs,
                "active_jobs": active_jobs,
                "hidden_jobs": hidden_jobs,
                "total_applications": total_applications,
                "accepted_apps": accepted_apps,
                "pending_apps": pending_apps,
                "pending_reports": pending_reports
            },
            "growth_chart": growth_data,
            "applications_list": applications_list
        }
    })

# 2. User Moderation
@admin_bp.route("/users", methods=["GET"])
@role_required("admin")
def list_users():
    role = request.args.get("role")
    status = request.args.get("status")
    users_col = db_manager.get_collection("users")
    
    query = {}
    if role:
        query["role"] = role
    else:
        query["role"] = {"$in": ["student", "employer"]}
    if status == "banned":
        query["is_banned"] = True
    elif status == "active":
        query["is_banned"] = False

    users = [
        u for u in list(users_col.find(query).sort("created_at", -1))
        if str(u.get("email", "")).strip().lower().endswith("@gmail.com")
        and str(u.get("email", "")).strip().lower() != "eadeedc@gmail.com"
        and str(u.get("_id", "")).strip() != "user_student_486c9bf4"
    ]
    # Chuẩn bị map lookup một lần để tránh N+1 query gây chậm website trên Atlas
    all_reports = list(db_manager.get_collection("reports").find({}))
    job_to_emp = {j.get("_id"): j.get("employer_id") for j in db_manager.get_collection("jobs").find({}) if j.get("_id")}
    stu_by_uid = {s.get("user_id"): s for s in db_manager.get_collection("student_profiles").find({}) if s.get("user_id")}
    emp_by_uid = {e.get("user_id"): e for e in db_manager.get_collection("employers").find({}) if e.get("user_id")}
    comp_by_emp_id = {c.get("employer_id"): c for c in db_manager.get_collection("company_profiles").find({}) if c.get("employer_id")}
    resumes_by_stu_id = {}
    resumes_by_uid = {}
    for res_doc in db_manager.get_collection("resumes").find({}):
        if res_doc.get("student_id"):
            resumes_by_stu_id.setdefault(res_doc["student_id"], []).append(res_doc)
        if res_doc.get("student_user_id"):
            resumes_by_uid.setdefault(res_doc["student_user_id"], []).append(res_doc)

    # Loại bỏ hash mật khẩu & làm giàu hồ sơ
    for u in users:
        u.pop("password_hash", None)
        target_ids = {u.get("_id"), u.get("email")}
        # Bổ sung thông tin profile
        if u.get("role") == "student":
            stu = dict(stu_by_uid.get(u["_id"]) or {})
            stu_avatar = stu.get("avatar_url") if "avatar_url" in stu else (u.get("avatar_url") or "")
            stu_cover = stu.get("cover_image_url") if "cover_image_url" in stu else (u.get("cover_image_url") or "")
            stu["avatar_url"] = stu_avatar or ""
            stu["cover_image_url"] = stu_cover or ""
            u["avatar_url"] = stu["avatar_url"]
            u["cover_image_url"] = stu["cover_image_url"]
            u["profile"] = stu
            if stu.get("_id"):
                target_ids.add(stu["_id"])
            if stu.get("full_name"):
                u.setdefault("full_name", stu.get("full_name"))
            stu_resumes = []
            seen_res_ids = set()
            for r_item in (resumes_by_stu_id.get(stu.get("_id"), []) + resumes_by_uid.get(u["_id"], [])):
                rid = r_item.get("_id")
                if rid and rid not in seen_res_ids:
                    seen_res_ids.add(rid)
                    stu_resumes.append(r_item)
            u["resumes"] = stu_resumes
            u["resumes_count"] = len(stu_resumes)
        elif u.get("role") == "employer":
            emp = emp_by_uid.get(u["_id"])
            u["employer_record"] = dict(emp) if emp else {}
            if emp:
                target_ids.add(emp["_id"])
                comp = dict(comp_by_emp_id.get(emp["_id"]) or {})
                comp_logo = comp.get("logo_url") if "logo_url" in comp else (u.get("logo_url") or u.get("avatar_url") or "")
                comp_cover = comp.get("cover_image_url") if "cover_image_url" in comp else (u.get("cover_image_url") or "")
                comp["logo_url"] = comp_logo or ""
                comp["cover_image_url"] = comp_cover or ""
                u["logo_url"] = comp["logo_url"]
                u["avatar_url"] = comp["logo_url"]
                u["cover_image_url"] = comp["cover_image_url"]
                u["profile"] = comp
                u["company_name"] = comp.get("company_name") or emp.get("company_name") or u.get("full_name") or ""
                u["branch_name"] = comp.get("branch_name") or emp.get("branch_name") or ""
                if not u.get("address"):
                    u["address"] = comp.get("address") or emp.get("address") or ""
                u["approval_status"] = emp.get("approval_status", "pending")
                u["license_url"] = comp.get("business_license_url") or emp.get("license_url") or comp.get("license_url") or ""
                u["license_name"] = comp.get("business_license_name") or emp.get("license_name") or ""
                u["license_uploaded_at"] = emp.get("license_uploaded_at", "")
                u["has_gpkd"] = bool(u["license_url"])
            else:
                u["profile"] = {}
                u["approval_status"] = "pending"
                u["license_url"] = ""
                u["license_name"] = ""
                u["license_uploaded_at"] = ""
                u["has_gpkd"] = False

        rep_count = sum(
            1 for r in all_reports
            if r.get("target_id") in target_ids or (
                u.get("role") == "employer" and u.get("employer_record", {}).get("_id") and job_to_emp.get(r.get("target_id")) == u["employer_record"]["_id"]
            )
        )
        u["reports_count"] = rep_count
        u["is_reported"] = rep_count >= 1

    return jsonify({"success": True, "data": users})

@admin_bp.route("/employers", methods=["GET"])
@role_required("admin")
def list_employers():
    users_col = db_manager.get_collection("users")
    emp_by_uid = {e.get("user_id"): e for e in db_manager.get_collection("employers").find({}) if e.get("user_id")}
    comp_by_emp_id = {c.get("employer_id"): c for c in db_manager.get_collection("company_profiles").find({}) if c.get("employer_id")}
    
    employers = [
        u for u in list(users_col.find({"role": "employer"}))
        if str(u.get("email", "")).strip().lower().endswith("@gmail.com")
    ]
    result = []
    for u in employers:
        u.pop("password_hash", None)
        emp = dict(emp_by_uid.get(u["_id"]) or {})
        comp = dict(comp_by_emp_id.get(emp.get("_id")) or {})
        u["employer_record"] = emp
        u["profile"] = comp
        u["company_name"] = comp.get("company_name") or u.get("full_name") or "Doanh nghiệp PARTIME"
        u["approval_status"] = emp.get("approval_status", "pending")
        u["license_url"] = comp.get("business_license_url") or emp.get("license_url") or comp.get("license_url") or ""
        u["license_name"] = comp.get("business_license_name") or emp.get("license_name") or ""
        u["license_uploaded_at"] = emp.get("license_uploaded_at", "")
        result.append(u)
    return jsonify({"success": True, "data": result})

@admin_bp.route("/users/<user_id>/ban", methods=["PUT"])
@role_required("admin")
def ban_user(user_id):
    current_admin = request.current_user
    if current_admin["_id"] == user_id:
        return jsonify({"success": False, "message": "Quản trị viên không thể tự khóa tài khoản của mình."}), 400

    data = request.get_json() or {}
    reason = data.get("reason", "Vi phạm điều khoản cộng đồng PARTIME.VN")
    
    users_col = db_manager.get_collection("users")
    users_col.update_one(
        {"_id": user_id},
        {"$set": {"is_banned": True, "ban_reason": reason, "status": "banned"}}
    )
    
    # Gửi thông báo hệ thống trực tiếp cho tài khoản bị khóa + phát Socket.IO tức thì
    create_and_emit_notification(
        user_id=user_id,
        title="Tài khoản của bạn đã bị khóa bởi Quản trị viên",
        message=f"Tài khoản của bạn đã bị khóa do vi phạm: {reason}. Mọi thao tác bị vô hiệu hóa.",
        notif_type="account_banned",
        related_id=user_id,
    )
    emit_socket_event("user-status-updated", {"user_id": user_id, "is_banned": True, "status": "banned"})
    target_user = users_col.find_one({"_id": user_id}) or {}
    _record_audit_log(
        current_admin,
        "BAN_USER",
        "user",
        user_id,
        target_user.get("full_name") or target_user.get("email") or user_id,
        reason=reason,
    )

    return jsonify({"success": True, "message": f"Đã khóa tài khoản thành công. Lý do: {reason}"})

@admin_bp.route("/users/<user_id>/unban", methods=["PUT"])
@role_required("admin")
def unban_user(user_id):
    users_col = db_manager.get_collection("users")
    users_col.update_one(
        {"_id": user_id},
        {"$set": {"is_banned": False, "ban_reason": "", "status": "active"}}
    )
    create_and_emit_notification(
        user_id=user_id,
        title="Tài khoản của bạn đã được mở khóa",
        message="Quản trị viên đã mở khóa tài khoản của bạn. Bạn có thể đăng nhập và sử dụng hệ thống bình thường.",
        notif_type="account_unbanned",
        related_id=user_id,
    )
    emit_socket_event("user-status-updated", {"user_id": user_id, "is_banned": False, "status": "active"})
    target_user = users_col.find_one({"_id": user_id}) or {}
    _record_audit_log(
        request.current_user,
        "UNBAN_USER",
        "user",
        user_id,
        target_user.get("full_name") or target_user.get("email") or user_id,
    )
    return jsonify({"success": True, "message": "Đã mở khóa tài khoản thành công."})

@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@role_required("admin")
def delete_user_account(user_id):
    current_admin = request.current_user
    if str(current_admin.get("_id")) == str(user_id):
        return jsonify({"success": False, "message": "Quản trị viên không thể tự xóa tài khoản của chính mình."}), 400

    users_col = db_manager.get_collection("users")
    target_user = users_col.find_one({"_id": user_id})
    if target_user and target_user.get("role") == "admin":
        return jsonify({"success": False, "message": "Không thể xóa tài khoản Quản trị viên hệ thống."}), 400

    target_label = (target_user or {}).get("full_name") or (target_user or {}).get("email") or user_id
    db_manager.cascade_delete_user(user_id)
    emit_socket_event("user-status-updated", {"user_id": user_id, "deleted": True})
    _record_audit_log(current_admin, "DELETE_USER", "user", user_id, target_label)
    return jsonify({"success": True, "message": "Đã xóa vĩnh viễn tài khoản người dùng và dữ liệu liên quan thành công!"})

@admin_bp.route("/users/<user_id>/resumes", methods=["GET"])
@role_required("admin")
def admin_get_student_resumes(user_id):
    """Admin xem danh sách tệp CV PDF của sinh viên để kiểm tra báo cáo gian lận hồ sơ."""
    stu_col = db_manager.get_collection("student_profiles")
    res_col = db_manager.get_collection("resumes")
    app_col = db_manager.get_collection("applications")
    stu = stu_col.find_one({"$or": [{"user_id": user_id}, {"_id": user_id}]})
    stu_id = stu.get("_id") if stu else user_id
    uid = stu.get("user_id") if stu else user_id
    id_candidates = [x for x in {user_id, stu_id, uid} if x]

    resumes = list(res_col.find({
        "$or": [
            {"student_id": {"$in": id_candidates}},
            {"student_user_id": {"$in": id_candidates}},
        ]
    }).sort("uploaded_at", -1))

    # Gộp thêm snapshot CV đã nộp trong đơn ứng tuyển nếu chưa có URL trùng lặp
    existing_urls = {r.get("file_url") for r in resumes if r.get("file_url")}
    for app in app_col.find({
        "$or": [
            {"student_id": {"$in": id_candidates}},
            {"student_user_id": {"$in": id_candidates}},
        ]
    }).sort("applied_at", -1):
        snap = app.get("application_snapshot") or {}
        cv_url = snap.get("cv_url") or app.get("cv_url") or ""
        if cv_url and cv_url not in existing_urls:
            existing_urls.add(cv_url)
            resumes.append({
                "_id": f"appcv_{app.get('_id')}",
                "student_id": stu_id,
                "file_name": snap.get("cv_name") or f"CV_{app.get('job_title', 'UngTuyen')}.pdf",
                "file_url": cv_url,
                "is_default": False,
                "source": "application_snapshot",
                "job_title": app.get("job_title", ""),
                "uploaded_at": app.get("applied_at", ""),
            })

    return jsonify({"success": True, "data": resumes})

# 2.1 Duyệt Giấy phép kinh doanh GPKD (FR 3.4.6)
@admin_bp.route("/employers/<user_id>/gpkd", methods=["PUT"])
@role_required("admin")
def review_employer_gpkd(user_id):
    data = request.get_json() or {}
    status = data.get("status", "approved") # approved | rejected
    reason = data.get("reason") or data.get("reject_reason") or ""

    emp_col = db_manager.get_collection("employers")
    emp = emp_col.find_one({"user_id": user_id}) or emp_col.find_one({"_id": user_id})
    target_user_id = (emp.get("user_id") if emp else None) or user_id
    if not emp:
        # Nếu chưa có thì khởi tạo
        emp_id = f"emp_{target_user_id}"
        emp_col.insert_one({
            "_id": emp_id,
            "user_id": target_user_id,
            "approval_status": status,
            "reject_reason": reason
        })
    else:
        emp_col.update_one(
            {"_id": emp["_id"]},
            {"$set": {"approval_status": status, "reject_reason": reason}}
        )

    # Đẩy thông báo cho Doanh nghiệp & SocketIO tức thì
    msg_body = "Hồ sơ Giấy phép kinh doanh (GPKD) của bạn đã được Quản trị viên phê duyệt thành công. Bạn hiện có thể đăng tin tuyển dụng không giới hạn!" if status == "approved" else f"Hồ sơ GPKD của bạn bị từ chối phê duyệt. Lý do: {reason}. Vui lòng cập nhật lại GPKD hợp lệ."
    create_and_emit_notification(
        user_id=target_user_id,
        title="Kết quả xét duyệt Giấy phép kinh doanh (GPKD)",
        message=msg_body,
        notif_type="gpkd_status",
        role="employer",
        related_id=target_user_id,
        target_id=emp["_id"] if emp else target_user_id,
    )
    emit_socket_event("gpkd-status-updated", {
        "user_id": target_user_id,
        "employer_id": emp["_id"] if emp else target_user_id,
        "status": status
    })

    comp = db_manager.get_collection("company_profiles").find_one({"employer_id": emp["_id"] if emp else target_user_id}) or {}
    _record_audit_log(
        request.current_user,
        "APPROVE_GPKD" if status == "approved" else "REJECT_GPKD",
        "employer_gpkd",
        emp["_id"] if emp else target_user_id,
        comp.get("company_name") or target_user_id,
        reason=reason,
    )

    action_text = "phê duyệt hợp lệ" if status == "approved" else "từ chối"
    return jsonify({"success": True, "message": f"Đã {action_text} Giấy phép kinh doanh của Doanh nghiệp!"})

# 3. Job Moderation (FR 3.5)
@admin_bp.route("/jobs", methods=["GET"])
@role_required("admin")
def list_all_jobs():
    jobs_col = db_manager.get_collection("jobs")
    cat_map = {c.get("_id"): c.get("name") for c in db_manager.get_collection("categories").find({}) if c.get("_id")}
    banned_docs = list(db_manager.get_collection("banned_keywords").find({}))

    jobs = [
        j for j in list(jobs_col.find({}).sort("created_at", -1))
        if j.get("_id") not in ["job_1", "job_2", "job_3", "job_4", "job_5", "job_6"]
    ]
    for j in jobs:
        if not j.get("category_name") and j.get("category_id") in cat_map:
            j["category_name"] = cat_map[j["category_id"]]
        if not j.get("status") and j.get("job_status"):
            j["status"] = j["job_status"]
        elif not j.get("job_status") and j.get("status"):
            j["job_status"] = j["status"]
        auto_adjust_job_moderation(j, banned_docs, persist=True)
    return jsonify({"success": True, "data": jobs})

@admin_bp.route("/jobs/<job_id>/approve-moderation", methods=["PUT"])
@role_required("admin")
def approve_job_moderation(job_id):
    """Đánh dấu tin tuyển dụng mới đăng đã được Quản trị viên kiểm duyệt đạt chuẩn."""
    jobs_col = db_manager.get_collection("jobs")
    job = jobs_col.find_one({"_id": job_id})
    if not job:
        return jsonify({"success": False, "message": "Không tìm thấy tin tuyển dụng."}), 404
    now_str = time.strftime("%Y-%m-%d %H:%M:%S")
    jobs_col.update_one(
        {"_id": job_id},
        {"$set": {
            "is_admin_reviewed": True,
            "is_hidden": False,
            "hidden_reason": "",
            "moderation_reviewed_at": now_str,
            "moderation_reviewed_by": request.current_user.get("email") or request.current_user.get("_id"),
        }}
    )
    _record_audit_log(
        request.current_user,
        "APPROVE_JOB_MODERATION",
        "job",
        job_id,
        job.get("title") or job_id,
    )
    if job.get("employer_id"):
        emp = db_manager.get_collection("employers").find_one({
            "$or": [{"_id": job.get("employer_id")}, {"user_id": job.get("employer_id")}]
        })
        target_user_id = emp.get("user_id") if (emp and emp.get("user_id")) else job.get("employer_id")
        if target_user_id:
            create_and_emit_notification(
                user_id=target_user_id,
                title=f"Quản trị viên đã duyệt tin: {job.get('title', '')}",
                message=f"Tin tuyển dụng '{job.get('title', '')}' của bạn đã được Quản trị viên kiểm duyệt và đạt chuẩn.",
                notif_type="job",
                role="employer",
                related_id=job_id,
                target_id=emp.get("_id") if emp else target_user_id,
            )
    emit_socket_event("job-updated", {
        "job_id": job_id,
        "employer_id": job.get("employer_id"),
        "title": job.get("title"),
        "is_admin_reviewed": True,
        "is_hidden": False,
    })
    return jsonify({"success": True, "message": "Đã xác nhận tin tuyển dụng đạt chuẩn kiểm duyệt!"})

@admin_bp.route("/jobs/<job_id>/hide", methods=["PUT"])
@role_required("admin")
def hide_job(job_id):
    data = request.get_json() or {}
    reason = data.get("reason", "Tin tuyển dụng có dấu hiệu vi phạm")
    jobs_col = db_manager.get_collection("jobs")
    jobs_col.update_one(
        {"_id": job_id},
        {"$set": {"is_hidden": True, "hidden_reason": reason, "is_admin_reviewed": True}}
    )
    
    # Gửi thông báo hệ thống trực tiếp cho Doanh nghiệp đăng tin kèm Socket.IO
    job = jobs_col.find_one({"_id": job_id})
    _record_audit_log(
        request.current_user,
        "HIDE_JOB",
        "job",
        job_id,
        (job or {}).get("title") or job_id,
        reason=reason,
    )
    if job and job.get("employer_id"):
        emp = db_manager.get_collection("employers").find_one({"_id": job.get("employer_id")})
        target_user_id = emp.get("user_id") if emp else job.get("employer_id")
        create_and_emit_notification(
            user_id=target_user_id,
            title=f"Tin tuyển dụng bị tạm ẩn: {job.get('title')}",
            message=f"Tin tuyển dụng '{job.get('title')}' đã bị Quản trị viên ẩn khỏi hệ thống. Lý do: {reason}",
            notif_type="job",
            role="employer",
            related_id=job_id,
            target_id=target_user_id,
        )
    emit_socket_event("job-updated", {"job_id": job_id, "is_hidden": True, "is_admin_reviewed": True})

    return jsonify({"success": True, "message": f"Đã ẩn tin tuyển dụng. Lý do: {reason}"})

@admin_bp.route("/jobs/<job_id>/unhide", methods=["PUT"])
@role_required("admin")
def unhide_job(job_id):
    jobs_col = db_manager.get_collection("jobs")
    jobs_col.update_one(
        {"_id": job_id},
        {"$set": {"is_hidden": False, "hidden_reason": "", "is_admin_reviewed": True}}
    )
    job = jobs_col.find_one({"_id": job_id})
    _record_audit_log(
        request.current_user,
        "UNHIDE_JOB",
        "job",
        job_id,
        (job or {}).get("title") or job_id,
    )
    if job and job.get("employer_id"):
        emp = db_manager.get_collection("employers").find_one({"_id": job.get("employer_id")})
        target_user_id = emp.get("user_id") if emp else job.get("employer_id")
        create_and_emit_notification(
            user_id=target_user_id,
            title=f"Tin tuyển dụng đã hiển thị lại: {job.get('title')}",
            message=f"Tin tuyển dụng '{job.get('title')}' đã được Quản trị viên khôi phục công khai trên sàn việc làm.",
            notif_type="job",
            role="employer",
            related_id=job_id,
            target_id=target_user_id,
        )
    emit_socket_event("job-updated", {"job_id": job_id, "is_hidden": False, "is_admin_reviewed": True})
    return jsonify({"success": True, "message": "Đã bỏ ẩn, tin tuyển dụng được hiển thị lại."})

@admin_bp.route("/jobs/<job_id>", methods=["DELETE"])
@role_required("admin")
def delete_job(job_id):
    jobs_col = db_manager.get_collection("jobs")
    job = jobs_col.find_one({"_id": job_id})
    if not job:
        return jsonify({"success": False, "message": "Không tìm thấy tin tuyển dụng."}), 404

    app_col = db_manager.get_collection("applications")
    active_apps = app_col.count_documents({
        "job_id": job_id,
        "application_status": {"$nin": ["cancelled", "withdrawn"]},
        "is_cancelled": {"$ne": True}
    })
    if active_apps > 0:
        return jsonify({
            "success": False,
            "message": f"Tin tuyển dụng này đang có {active_apps} hồ sơ ứng tuyển. Theo quy định kiểm duyệt, chỉ xóa cứng tin chưa có người nộp — vui lòng sử dụng chức năng 'Ẩn' đối với tin đã có ứng viên!"
        }), 400

    db_manager.get_collection("bookmarks").delete_many({"job_id": job_id})
    app_col.delete_many({"job_id": job_id})
    db_manager.get_collection("reports").delete_many({"target_id": job_id})
    jobs_col.delete_one({"_id": job_id})
    if job and job.get("employer_id"):
        emp = db_manager.get_collection("employers").find_one({"_id": job.get("employer_id")})
        target_user_id = emp.get("user_id") if emp else job.get("employer_id")
        create_and_emit_notification(
            user_id=target_user_id,
            title=f"Tin tuyển dụng đã bị xóa: {job.get('title')}",
            message=f"Tin tuyển dụng '{job.get('title')}' đã bị Quản trị viên xóa khỏi hệ thống.",
            notif_type="job",
            role="employer",
            related_id=job_id,
            target_id=target_user_id,
        )
    emit_socket_event("job-updated", {"job_id": job_id, "deleted": True})
    _record_audit_log(
        request.current_user,
        "DELETE_JOB",
        "job",
        job_id,
        (job or {}).get("title") or job_id,
    )
    return jsonify({"success": True, "message": "Đã xóa vĩnh viễn tin tuyển dụng thành công!"})

# 4. Master Data Categories (FR 3.7)
@admin_bp.route("/categories", methods=["GET"])
@role_required("admin")
def list_categories():
    cat_col = db_manager.get_collection("categories")
    unwanted = {"Bảo hành", "Thời trang"}
    legacy_loc_ids = {"loc_1", "loc_2", "loc_3", "loc_4", "loc_5"}
    cats = list(cat_col.find({}))
    filtered_cats = [
        c for c in cats
        if c.get("name") not in unwanted and c.get("_id") not in legacy_loc_ids
    ]
    return jsonify({"success": True, "data": filtered_cats})

@admin_bp.route("/categories", methods=["POST"])
@role_required("admin")
def add_category():
    data = request.get_json() or {}
    name = str(data.get("name", "")).strip()
    c_type = str(data.get("type", "job")).strip()
    if not name:
        return jsonify({"success": False, "message": "Tên danh mục không được để trống."}), 400

    cat_col = db_manager.get_collection("categories")
    new_cat = {
        "_id": f"cat_{uuid.uuid4().hex[:8]}",
        "name": name,
        "type": c_type,
        "is_active": True
    }
    cat_col.insert_one(new_cat)
    emit_socket_event("categories-updated", {"action": "add", "category": new_cat})
    return jsonify({"success": True, "message": "Thêm danh mục mới thành công!", "data": new_cat}), 201

@admin_bp.route("/categories/<cat_id>", methods=["PUT"])
@role_required("admin")
def update_category(cat_id):
    data = request.get_json() or {}
    cat_col = db_manager.get_collection("categories")
    cat_col.update_one({"_id": cat_id}, {"$set": data})
    emit_socket_event("categories-updated", {"action": "update", "cat_id": cat_id})
    return jsonify({"success": True, "message": "Đã cập nhật danh mục."})

@admin_bp.route("/categories/<cat_id>", methods=["DELETE"])
@role_required("admin")
def delete_category(cat_id):
    jobs_col = db_manager.get_collection("jobs")
    jobs_col.update_many({"category_id": cat_id}, {"$set": {"category_id": ""}})
    cat_col = db_manager.get_collection("categories")
    cat_col.delete_one({"_id": cat_id})
    emit_socket_event("categories-updated", {"action": "delete", "cat_id": cat_id})
    return jsonify({"success": True, "message": "Đã xóa danh mục thành công!"})


# 5. Banned Keywords Engine (FR 3.9)
@admin_bp.route("/banned-keywords", methods=["GET"])
@role_required("admin")
def list_banned_keywords():
    ban_col = db_manager.get_collection("banned_keywords")
    words = list(ban_col.find({}))
    return jsonify({"success": True, "data": words})

@admin_bp.route("/banned-keywords", methods=["POST"])
@role_required("admin")
def add_banned_keyword():
    data = request.get_json() or {}
    keyword = str(data.get("keyword", "")).strip().lower()
    if not keyword:
        return jsonify({"success": False, "message": "Từ khóa cấm không được để trống."}), 400

    ban_col = db_manager.get_collection("banned_keywords")
    if ban_col.find_one({"keyword": keyword}):
        return jsonify({"success": False, "message": "Từ khóa này đã tồn tại trong bộ lọc."}), 409

    new_item = {
        "_id": f"bkw_{uuid.uuid4().hex[:8]}",
        "keyword": keyword,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    ban_col.insert_one(new_item)
    emit_socket_event("banned-keywords-updated", {"keyword": keyword, "action": "add"})
    return jsonify({"success": True, "message": f"Đã thêm từ khóa '{keyword}' vào bộ lọc cấm tự động!", "data": new_item}), 201

@admin_bp.route("/banned-keywords/<kw_id>", methods=["PUT"])
@role_required("admin")
def update_banned_keyword(kw_id):
    data = request.get_json() or {}
    keyword = str(data.get("keyword", "")).strip().lower()
    if not keyword:
        return jsonify({"success": False, "message": "Từ khóa cấm không được để trống."}), 400

    ban_col = db_manager.get_collection("banned_keywords")
    dup = ban_col.find_one({"keyword": keyword})
    if dup and str(dup.get("_id")) != str(kw_id):
        return jsonify({"success": False, "message": "Từ khóa này đã tồn tại trong bộ lọc."}), 409

    ban_col.update_one({"_id": kw_id}, {"$set": {"keyword": keyword}})
    emit_socket_event("banned-keywords-updated", {"keyword": keyword, "action": "update"})
    return jsonify({"success": True, "message": f"Đã cập nhật từ khóa cấm thành '{keyword}'!"})

@admin_bp.route("/banned-keywords/<kw_id>", methods=["DELETE"])
@role_required("admin")
def delete_banned_keyword(kw_id):
    ban_col = db_manager.get_collection("banned_keywords")
    ban_col.delete_one({"_id": kw_id})
    emit_socket_event("banned-keywords-updated", {"kw_id": kw_id, "action": "delete"})
    return jsonify({"success": True, "message": "Đã xóa từ khóa khỏi bộ lọc thành công!"})

# 6. Reports (FR 3.8)
@admin_bp.route("/reports", methods=["GET"])
@role_required("admin")
def list_reports():
    rep_col = db_manager.get_collection("reports")
    reports = [r for r in list(rep_col.find({}).sort("created_at", -1)) if r.get("_id") != "rep_1"]
    return jsonify({"success": True, "data": reports})

@admin_bp.route("/reports/<rep_id>/status", methods=["PUT"])
@role_required("admin")
def update_report_status(rep_id):
    data = request.get_json() or {}
    new_status = data.get("status", "resolved") # pending, investigating, resolved, dismissed
    note = data.get("note", "")
    
    rep_col = db_manager.get_collection("reports")
    rep = rep_col.find_one({"_id": rep_id})
    if not rep:
        return jsonify({"success": False, "message": "Không tìm thấy ticket báo cáo."}), 404

    rep_col.update_one({"_id": rep_id}, {"$set": {"status": new_status, "admin_note": note, "resolved_at": time.strftime("%Y-%m-%d %H:%M:%S")}})

    # FR 3.8.4: Tự động gửi thông báo kết quả về cho người báo cáo kèm Socket.IO tức thì
    status_map = {
        "pending": "Chờ xử lý",
        "investigating": "Đang điều tra",
        "resolved": "Đã giải quyết",
        "dismissed": "Bị bác bỏ"
    }
    status_label = status_map.get(new_status, new_status)
    reporter_id = rep.get("reporter_id")
    reporter_uid = reporter_id
    reporter_role = rep.get("reporter_role")
    if reporter_id and str(reporter_id).startswith("stu_"):
        reporter_uid = resolve_student_user_id(reporter_id)
        reporter_role = reporter_role or "student"
    elif reporter_id and str(reporter_id).startswith("emp_"):
        reporter_uid = resolve_employer_user_id(reporter_id)
        reporter_role = reporter_role or "employer"
    elif reporter_id and str(reporter_id).startswith("user_student_"):
        reporter_role = reporter_role or "student"
    elif reporter_id and str(reporter_id).startswith("user_employer_"):
        reporter_role = reporter_role or "employer"

    if (not reporter_uid or not str(reporter_uid).startswith("user_")) and rep.get("reporter_email"):
        u_doc = db_manager.get_collection("users").find_one({"email": rep.get("reporter_email")})
        if u_doc and u_doc.get("_id"):
            reporter_uid = u_doc["_id"]
            reporter_role = reporter_role or u_doc.get("role")

    if reporter_uid:
        create_and_emit_notification(
            user_id=reporter_uid,
            title=f"Cập nhật Ticket vi phạm {rep.get('ticket_code', rep_id)}",
            message=f"Quản trị viên đã xử lý báo cáo vi phạm của bạn với kết quả: '{status_label}'. {('Ghi chú: ' + note) if note else ''}",
            notif_type="report_status",
            role=reporter_role,
            related_id=rep_id,
            target_id=reporter_id or reporter_uid,
        )
    report_event_payload = {
        "report_id": rep_id,
        "ticket_code": rep.get("ticket_code", rep_id),
        "status": new_status,
        "status_label": status_label,
        "admin_note": note,
        "reporter_id": reporter_id,
        "reporter_user_id": reporter_uid,
    }
    emit_socket_event("report-updated", report_event_payload)
    if reporter_uid:
        emit_socket_event("report-updated", report_event_payload, room=f"user_{reporter_uid}")
    if reporter_id and reporter_id != reporter_uid:
        emit_socket_event("report-updated", report_event_payload, room=f"user_{reporter_id}")
    _record_audit_log(
        request.current_user,
        "UPDATE_REPORT_STATUS",
        "report",
        rep_id,
        rep.get("ticket_code") or rep.get("target_title") or rep_id,
        reason=f"{status_label}" + (f": {note}" if note else ""),
    )

    return jsonify({"success": True, "message": f"Đã cập nhật trạng thái báo cáo sang: {status_label}"})

@admin_bp.route("/reports/<rep_id>", methods=["DELETE"])
@role_required("admin")
def delete_report(rep_id):
    rep_col = db_manager.get_collection("reports")
    rep = rep_col.find_one({"_id": rep_id})
    rep_col.delete_one({"_id": rep_id})
    reporter_id = rep.get("reporter_id") if rep else ""
    emit_socket_event("report-updated", {"report_id": rep_id, "deleted": True, "reporter_id": reporter_id})
    _record_audit_log(
        request.current_user,
        "DELETE_REPORT",
        "report",
        rep_id,
        (rep.get("ticket_code") or rep.get("target_title")) if rep else rep_id,
    )
    return jsonify({"success": True, "message": "Đã xóa vĩnh viễn báo cáo vi phạm thành công!"})

# FR 3.9.2: Xem lịch sử Chat gốc (Unmasked) để làm chứng cứ phân xử
@admin_bp.route("/reports/<rep_id>/chat-history", methods=["GET"])
@role_required("admin")
def get_report_chat_history(rep_id):
    from src.core.socket_service import get_room_id_variants, chat_msg_sort_key
    rep_col = db_manager.get_collection("reports")
    rep = rep_col.find_one({"_id": rep_id})
    if not rep:
        return jsonify({"success": False, "message": "Không tìm thấy ticket."}), 404

    msg_col = db_manager.get_collection("messages")
    target_id = str(rep.get("target_id") or "")
    reporter_id = str(rep.get("reporter_id") or "")
    explicit_room_id = str(rep.get("room_id") or "")
    explicit_app_id = str(rep.get("application_id") or "")
    room_candidates = set()
    party_a_ids = {reporter_id} if reporter_id else set()
    party_b_ids = {target_id} if target_id else set()

    is_app_scoped = False
    if explicit_room_id.startswith("room_"):
        is_app_scoped = "_app_" in explicit_room_id
        for r_var in get_room_id_variants(explicit_room_id):
            room_candidates.add(r_var)
    elif target_id.startswith("room_"):
        is_app_scoped = "_app_" in target_id
        for r_var in get_room_id_variants(target_id):
            room_candidates.add(r_var)
    elif explicit_app_id:
        app_doc = db_manager.get_collection("applications").find_one({"_id": explicit_app_id})
        if app_doc:
            emp_id = str(app_doc.get("employer_id") or "")
            stu_id = str(app_doc.get("student_user_id") or app_doc.get("student_id") or "")
            if emp_id and stu_id:
                is_app_scoped = True
                for r_var in get_room_id_variants(f"room_emp_{emp_id}_stu_{stu_id}_app_{explicit_app_id}"):
                    room_candidates.add(r_var)
    else:
        # Phân giải nếu target_id là job_id, application_id hoặc user_id/profile_id
        job_doc = db_manager.get_collection("jobs").find_one({"_id": target_id})
        if job_doc and job_doc.get("employer_id"):
            emp_id = str(job_doc.get("employer_id"))
            party_b_ids.add(emp_id)
            app_for_job = db_manager.get_collection("applications").find_one({
                "job_id": target_id,
                "$or": [{"student_user_id": reporter_id}, {"student_id": reporter_id}],
            })
            if app_for_job:
                is_app_scoped = True
                for r_var in get_room_id_variants(f"room_emp_{emp_id}_stu_{reporter_id}_app_{app_for_job['_id']}"):
                    room_candidates.add(r_var)
            else:
                for r_var in get_room_id_variants(f"room_emp_{emp_id}_stu_{reporter_id}"):
                    room_candidates.add(r_var)

        app_doc = db_manager.get_collection("applications").find_one({"_id": target_id})
        if app_doc:
            emp_id = str(app_doc.get("employer_id") or "")
            stu_id = str(app_doc.get("student_user_id") or app_doc.get("student_id") or "")
            if emp_id and stu_id:
                party_b_ids.update([emp_id, stu_id])
                is_app_scoped = True
                for r_var in get_room_id_variants(f"room_emp_{emp_id}_stu_{stu_id}_app_{app_doc['_id']}"):
                    room_candidates.add(r_var)

        # Thử ghép cặp 2 chiều giữa reporter_id và target_id
        if reporter_id and target_id and not is_app_scoped:
            for r_var in get_room_id_variants(f"room_emp_{target_id}_stu_{reporter_id}"):
                room_candidates.add(r_var)
            for r_var in get_room_id_variants(f"room_emp_{reporter_id}_stu_{target_id}"):
                room_candidates.add(r_var)

    # Mở rộng định danh của 2 bên để truy vấn tin nhắn trực tiếp giữa đúng 2 đối tượng trong ticket
    if not is_app_scoped:
        for pid in list(party_a_ids):
            emp_doc = db_manager.get_collection("employers").find_one({"$or": [{"_id": pid}, {"user_id": pid}]})
            if emp_doc:
                party_a_ids.update([str(emp_doc.get("_id", "")), str(emp_doc.get("user_id", ""))])
            stu_doc = db_manager.get_collection("student_profiles").find_one({"$or": [{"_id": pid}, {"user_id": pid}]})
            if stu_doc:
                party_a_ids.update([str(stu_doc.get("_id", "")), str(stu_doc.get("user_id", ""))])

        for pid in list(party_b_ids):
            emp_doc = db_manager.get_collection("employers").find_one({"$or": [{"_id": pid}, {"user_id": pid}]})
            if emp_doc:
                party_b_ids.update([str(emp_doc.get("_id", "")), str(emp_doc.get("user_id", ""))])
            stu_doc = db_manager.get_collection("student_profiles").find_one({"$or": [{"_id": pid}, {"user_id": pid}]})
            if stu_doc:
                party_b_ids.update([str(stu_doc.get("_id", "")), str(stu_doc.get("user_id", ""))])

    party_a_list = [x for x in party_a_ids if x]
    party_b_list = [x for x in party_b_ids if x]
    or_clauses = []
    if room_candidates:
        or_clauses.append({"room_id": {"$in": list(room_candidates)}})
    if not is_app_scoped and party_a_list and party_b_list:
        or_clauses.append({"sender_id": {"$in": party_a_list}, "receiver_id": {"$in": party_b_list}})
        or_clauses.append({"sender_id": {"$in": party_b_list}, "receiver_id": {"$in": party_a_list}})

    if or_clauses:
        msgs = list(msg_col.find({"$or": or_clauses}))
        msgs.sort(key=chat_msg_sort_key)
    else:
        msgs = []

    return jsonify({"success": True, "data": msgs, "ticket": rep})

# 7. Reviews Moderation (FR 3.6)
@admin_bp.route("/reviews", methods=["GET"])
@role_required("admin")
def list_all_reviews():
    rev_col = db_manager.get_collection("reviews")
    user_col = db_manager.get_collection("users")
    app_col = db_manager.get_collection("applications")
    comp_col = db_manager.get_collection("company_profiles")
    stu_col = db_manager.get_collection("student_profiles")
    
    reviews = list(rev_col.find({}).sort("created_at", -1))
    
    # Tạo map cache người dùng và hồ sơ để tối ưu hiệu năng
    all_users = {u["_id"]: u for u in user_col.find({})}
    all_apps = {a["_id"]: a for a in app_col.find({})}
    all_comps = list(comp_col.find({}))
    all_emps = list(db_manager.get_collection("employers").find({}))
    all_stus = list(stu_col.find({}))

    # Ánh xạ ID sang tên doanh nghiệp chính xác
    emp_to_comp = {}
    for c in all_comps:
        c_name = c.get("company_name")
        if c_name:
            if c.get("employer_id"):
                emp_to_comp[c["employer_id"]] = c_name
            if c.get("_id"):
                emp_to_comp[c["_id"]] = c_name
    for e in all_emps:
        c_name = emp_to_comp.get(e.get("_id"))
        if c_name and e.get("user_id"):
            emp_to_comp[e["user_id"]] = c_name

    # Ánh xạ ID sang tên sinh viên chính xác
    stu_to_name = {}
    for s in all_stus:
        s_name = s.get("full_name")
        if s_name:
            if s.get("student_id"):
                stu_to_name[s["student_id"]] = s_name
            if s.get("user_id"):
                stu_to_name[s["user_id"]] = s_name
            if s.get("_id"):
                stu_to_name[s["_id"]] = s_name

    def resolve_company(uid, default_val=None):
        return emp_to_comp.get(uid) or (all_users.get(uid) and all_users[uid].get("company_name")) or default_val

    def resolve_student(uid, default_val=None):
        return stu_to_name.get(uid) or (all_users.get(uid) and all_users[uid].get("full_name")) or default_val

    enriched = []
    for r in reviews:
        rev_copy = dict(r)
        rev_id = rev_copy.get("reviewer_id")
        tgt_id = rev_copy.get("target_id")
        app_id = rev_copy.get("application_id")

        u_reviewer = all_users.get(rev_id)
        u_target = all_users.get(tgt_id)
        app_item = all_apps.get(app_id) if app_id else None

        # Xác định chiều tương tác (Direction)
        if not rev_copy.get("direction"):
            if (u_reviewer and u_reviewer.get("role") == "employer") or (rev_copy.get("reviewer_name") == "Nhà tuyển dụng") or (rev_id in emp_to_comp):
                rev_copy["direction"] = "employer_to_student"
                rev_copy["reviewer_role"] = "employer"
                rev_copy["target_role"] = "student"
                if not rev_copy.get("reviewer_name") or rev_copy["reviewer_name"] == "Nhà tuyển dụng":
                    rev_copy["reviewer_name"] = resolve_company(rev_id) or (app_item and app_item.get("company_name")) or (u_reviewer and u_reviewer.get("full_name")) or "Công ty tuyển dụng"
                if not rev_copy.get("target_name"):
                    rev_copy["target_name"] = resolve_student(tgt_id) or (app_item and app_item.get("student_name")) or "Sinh viên ứng viên"
            else:
                rev_copy["direction"] = "student_to_employer"
                rev_copy["reviewer_role"] = "student"
                rev_copy["target_role"] = "employer"
                if not rev_copy.get("reviewer_name"):
                    rev_copy["reviewer_name"] = resolve_student(rev_id) or (app_item and app_item.get("student_name")) or "Sinh viên"
                if not rev_copy.get("target_name"):
                    rev_copy["target_name"] = resolve_company(tgt_id) or (app_item and app_item.get("company_name")) or (u_target and u_target.get("full_name")) or "Doanh nghiệp"

        if app_item and not rev_copy.get("job_title"):
            rev_copy["job_title"] = app_item.get("job_title", "Ca làm việc")

        # Đảm bảo luôn có đủ student_name và company_name chuẩn hóa để phục vụ tìm kiếm chính xác
        if not rev_copy.get("student_name"):
            if rev_copy.get("direction") == "employer_to_student":
                rev_copy["student_name"] = rev_copy.get("target_name") or resolve_student(tgt_id) or (app_item and (app_item.get("student_name") or (app_item.get("application_snapshot") or {}).get("student_name"))) or ""
            else:
                rev_copy["student_name"] = rev_copy.get("reviewer_name") or resolve_student(rev_id) or (app_item and (app_item.get("student_name") or (app_item.get("application_snapshot") or {}).get("student_name"))) or ""
        if not rev_copy.get("company_name"):
            if rev_copy.get("direction") == "employer_to_student":
                rev_copy["company_name"] = rev_copy.get("reviewer_name") or resolve_company(rev_id) or (app_item and app_item.get("company_name")) or ""
            else:
                rev_copy["company_name"] = rev_copy.get("target_name") or resolve_company(tgt_id) or (app_item and app_item.get("company_name")) or ""

        # Nếu reviewer_name hoặc target_name còn là chữ chung chung, ưu tiên tên chính xác
        if rev_copy.get("direction") == "employer_to_student":
            if rev_copy.get("reviewer_name") in ["Nhà tuyển dụng", "Doanh nghiệp", "Doanh nghiệp tuyển dụng"]:
                real_cname = resolve_company(rev_id) or (app_item and app_item.get("company_name"))
                if real_cname:
                    rev_copy["reviewer_name"] = real_cname
                    rev_copy["company_name"] = real_cname
        else:
            if rev_copy.get("target_name") in ["Doanh nghiệp", "Doanh nghiệp tuyển dụng"]:
                real_cname = resolve_company(tgt_id) or (app_item and app_item.get("company_name"))
                if real_cname:
                    rev_copy["target_name"] = real_cname
                    rev_copy["company_name"] = real_cname

        enriched.append(rev_copy)

    return jsonify({"success": True, "data": enriched})

@admin_bp.route("/reviews/<rev_id>/hide", methods=["PUT"])
@role_required("admin")
def toggle_hide_review(rev_id):
    rev_col = db_manager.get_collection("reviews")
    rev = rev_col.find_one({"_id": rev_id})
    if not rev:
        return jsonify({"success": False, "message": "Không tìm thấy đánh giá."}), 404
    new_state = not rev.get("is_hidden", False)
    rev_col.update_one({"_id": rev_id}, {"$set": {"is_hidden": new_state}})

    # FR-QT-05.04: Tự động tính toán lại mức điểm trung bình rating_avg của đối tượng bị đánh giá
    target_id = rev.get("target_id")
    if target_id:
        active_reviews = list(rev_col.find({"target_id": target_id, "is_hidden": {"$ne": True}}))
        if active_reviews:
            avg_score = round(sum(r.get("rating", 5) for r in active_reviews) / len(active_reviews), 1)
        else:
            avg_score = 5.0
            
        # Cập nhật vào company_profiles / employers
        db_manager.get_collection("company_profiles").update_many(
            {"$or": [{"employer_id": target_id}, {"_id": target_id}]},
            {"$set": {"rating_avg": avg_score, "review_count": len(active_reviews)}}
        )
        db_manager.get_collection("employers").update_many(
            {"$or": [{"_id": target_id}, {"user_id": target_id}]},
            {"$set": {"rating_avg": avg_score, "review_count": len(active_reviews)}}
        )
        # Cập nhật vào student_profiles / students
        db_manager.get_collection("student_profiles").update_many(
            {"$or": [{"student_id": target_id}, {"user_id": target_id}]},
            {"$set": {"rating_avg": avg_score, "review_count": len(active_reviews)}}
        )

    action_text = "ẩn do vi phạm" if new_state else "khôi phục công khai"
    if rev.get("reviewer_id"):
        create_and_emit_notification(
            user_id=rev["reviewer_id"],
            title=f"Cập nhật kiểm duyệt đánh giá",
            message=f"Đánh giá của bạn cho '{rev.get('job_title', 'công việc')}' đã được Quản trị viên {action_text}.",
            notif_type="review",
            related_id=rev_id,
        )
    emit_socket_event("review-updated", {"review_id": rev_id, "is_hidden": new_state})
    _record_audit_log(
        request.current_user,
        "HIDE_REVIEW" if new_state else "UNHIDE_REVIEW",
        "review",
        rev_id,
        rev.get("job_title") or rev.get("reviewer_name") or rev_id,
    )
    return jsonify({
        "success": True, 
        "is_hidden": new_state, 
        "message": f"Đã chuyển đánh giá sang trạng thái {action_text} và tự động tính lại điểm đánh giá trung bình."
    })

@admin_bp.route("/reviews/<rev_id>", methods=["DELETE"])
@role_required("admin")
def delete_admin_review(rev_id):
    rev_col = db_manager.get_collection("reviews")
    rev = rev_col.find_one({"_id": rev_id})
    rev_col.delete_one({"_id": rev_id})

    target_id = rev.get("target_id") if rev else None
    if target_id:
        active_reviews = list(rev_col.find({"target_id": target_id, "is_hidden": {"$ne": True}}))
        avg_score = round(sum(r.get("rating", 5) for r in active_reviews) / len(active_reviews), 1) if active_reviews else 5.0
        db_manager.get_collection("company_profiles").update_many(
            {"$or": [{"employer_id": target_id}, {"_id": target_id}]},
            {"$set": {"rating_avg": avg_score, "review_count": len(active_reviews)}}
        )
        db_manager.get_collection("employers").update_many(
            {"$or": [{"_id": target_id}, {"user_id": target_id}]},
            {"$set": {"rating_avg": avg_score, "review_count": len(active_reviews)}}
        )
        db_manager.get_collection("student_profiles").update_many(
            {"$or": [{"student_id": target_id}, {"user_id": target_id}]},
            {"$set": {"rating_avg": avg_score, "review_count": len(active_reviews)}}
        )

    if rev and rev.get("reviewer_id"):
        create_and_emit_notification(
            user_id=rev["reviewer_id"],
            title="Đánh giá đã bị gỡ bỏ",
            message=f"Đánh giá của bạn cho '{rev.get('job_title', 'công việc')}' đã bị Quản trị viên xóa vĩnh viễn khỏi hệ thống do vi phạm chính sách.",
            notif_type="review",
            role=rev.get("reviewer_role", "student"),
            related_id=rev_id,
            target_id=rev["reviewer_id"],
        )

    emit_socket_event("review-updated", {"review_id": rev_id, "deleted": True})
    _record_audit_log(
        request.current_user,
        "DELETE_REVIEW",
        "review",
        rev_id,
        (rev or {}).get("job_title") or rev_id,
    )
    return jsonify({"success": True, "message": "Đã xóa vĩnh viễn đánh giá thành công!"})

# 8. Nhật ký hoạt động Quản trị (Audit Log)
@admin_bp.route("/audit-logs", methods=["GET"])
@role_required("admin")
def list_audit_logs():
    action_filter = str(request.args.get("action") or "").strip()
    log_col = db_manager.get_collection("audit_logs")
    query = {"action": action_filter} if action_filter and action_filter != "all" else {}
    logs = list(log_col.find(query).sort("created_at", -1))
    return jsonify({"success": True, "data": logs})

# 9. Gửi Thông báo hệ thống hàng loạt (Bulk Broadcast Announcements)
@admin_bp.route("/announcements", methods=["GET"])
@role_required("admin")
def list_admin_announcements():
    ann_col = db_manager.get_collection("announcements")
    items = list(ann_col.find({}).sort("created_at", -1))
    return jsonify({"success": True, "data": items})

@admin_bp.route("/announcements", methods=["POST"])
@role_required("admin")
def create_admin_announcement():
    data = request.get_json() or {}
    title = str(data.get("title", "")).strip()
    message = str(data.get("message", "")).strip()
    target_role = str(data.get("target_role", "all")).strip().lower()
    severity = str(data.get("severity", "info")).strip().lower()

    if not title or not message:
        return jsonify({"success": False, "message": "Vui lòng nhập đầy đủ Tiêu đề và Nội dung thông báo hệ thống."}), 400
    if target_role not in ("all", "student", "employer"):
        target_role = "all"
    if severity not in ("info", "warning", "urgent"):
        severity = "info"

    users_col = db_manager.get_collection("users")
    role_filter = ["student", "employer"] if target_role == "all" else [target_role]
    recipients = [
        u for u in users_col.find({"role": {"$in": role_filter}, "is_banned": {"$ne": True}})
        if u.get("_id")
    ]

    ann_id = f"ann_{uuid.uuid4().hex[:8]}"
    for u in recipients:
        create_and_emit_notification(
            user_id=u["_id"],
            title=title,
            message=message,
            notif_type="system_announcement",
            role=u.get("role"),
            related_id=ann_id,
            target_id="system_broadcast",
        )

    admin_user = request.current_user
    now_str = time.strftime("%Y-%m-%d %H:%M:%S")
    ann_doc = {
        "_id": ann_id,
        "title": title,
        "message": message,
        "target_role": target_role,
        "severity": severity,
        "recipient_count": len(recipients),
        "created_by_id": admin_user.get("_id"),
        "created_by_name": admin_user.get("full_name") or admin_user.get("email") or "Quản trị viên",
        "created_at": now_str,
    }
    db_manager.get_collection("announcements").insert_one(ann_doc)
    emit_socket_event("system-announcement", ann_doc)
    _record_audit_log(
        admin_user,
        "BROADCAST_ANNOUNCEMENT",
        "announcement",
        ann_doc["_id"],
        title,
        reason=f"Gửi tới {target_role} ({len(recipients)} tài khoản)",
    )

    return jsonify({
        "success": True,
        "message": f"Đã phát thông báo hệ thống tới {len(recipients)} người dùng thành công!",
        "data": ann_doc,
    }), 201


@admin_bp.route("/announcements/<ann_id>", methods=["DELETE"])
@role_required("admin")
def delete_admin_announcement(ann_id):
    """Xóa lịch sử thông báo hệ thống và thu hồi toàn bộ thông báo tương ứng đã gửi tới Sinh viên / NTD."""
    ann_col = db_manager.get_collection("announcements")
    ann = ann_col.find_one({"_id": ann_id})
    if not ann:
        return jsonify({"success": False, "message": "Không tìm thấy thông báo hệ thống cần xóa."}), 404

    ann_col.delete_one({"_id": ann_id})

    notif_col = db_manager.get_collection("notifications")
    del_res = notif_col.delete_many({
        "$or": [
            {"related_id": ann_id, "type": "system_announcement"},
            {
                "type": "system_announcement",
                "related_id": "system_broadcast",
                "title": ann.get("title", ""),
                "message": ann.get("message", ""),
            },
        ]
    })
    retracted_count = getattr(del_res, "deleted_count", 0)

    admin_user = request.current_user
    _record_audit_log(
        admin_user,
        "DELETE_ANNOUNCEMENT",
        "announcement",
        ann_id,
        ann.get("title") or ann_id,
        reason=f"Xóa lịch sử & thu hồi {retracted_count} thông báo từ chuông người dùng",
        metadata={"retracted_count": retracted_count, "target_role": ann.get("target_role", "all")},
    )
    emit_socket_event("announcement-deleted", {"announcement_id": ann_id})
    emit_socket_event("notifications-updated", {"action": "retract", "announcement_id": ann_id})

    return jsonify({
        "success": True,
        "message": f"Đã xóa lịch sử và thu hồi {retracted_count} thông báo tương ứng khỏi chuông người dùng!",
        "retracted_count": retracted_count,
    })


