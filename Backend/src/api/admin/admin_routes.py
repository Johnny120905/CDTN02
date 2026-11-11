import time
import uuid
from flask import Blueprint, request, jsonify
from src.core.database import db_manager
from src.middlewares.auth_middleware import role_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

# 1. Dashboard Analytics
@admin_bp.route("/dashboard", methods=["GET"])
@role_required("admin")
def get_dashboard_stats():
    users_col = db_manager.get_collection("users")
    jobs_col = db_manager.get_collection("jobs")
    apps_col = db_manager.get_collection("applications")
    reports_col = db_manager.get_collection("reports")

    # Đảm bảo tài khoản yêu cầu xóa vĩnh viễn không bao giờ tồn tại lại
    db_manager.cascade_delete_user("eadeedc@gmail.com")
    db_manager.cascade_delete_user("user_student_486c9bf4")

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

    db_manager.cascade_delete_user("eadeedc@gmail.com")
    db_manager.cascade_delete_user("user_student_486c9bf4")

    users = [
        u for u in list(users_col.find(query).sort("created_at", -1))
        if str(u.get("email", "")).strip().lower().endswith("@gmail.com")
        and str(u.get("email", "")).strip().lower() != "eadeedc@gmail.com"
        and str(u.get("_id", "")).strip() != "user_student_486c9bf4"
    ]
    # Loại bỏ hash mật khẩu
    for u in users:
        u.pop("password_hash", None)
        # Bổ sung thông tin profile
        if u.get("role") == "student":
            stu = db_manager.get_collection("student_profiles").find_one({"user_id": u["_id"]})
            u["profile"] = stu or {}
        elif u.get("role") == "employer":
            emp = db_manager.get_collection("employers").find_one({"user_id": u["_id"]})
            u["employer_record"] = emp or {}
            if emp:
                comp = db_manager.get_collection("company_profiles").find_one({"employer_id": emp["_id"]}) or {}
                u["profile"] = comp
                u["approval_status"] = emp.get("approval_status", "pending")
                u["license_url"] = comp.get("business_license_url") or emp.get("license_url") or comp.get("license_url") or ""
                u["license_name"] = comp.get("business_license_name") or emp.get("license_name") or ""
                u["license_uploaded_at"] = emp.get("license_uploaded_at", "")
            else:
                u["profile"] = {}
                u["approval_status"] = "pending"
                u["license_url"] = ""
                u["license_name"] = ""
                u["license_uploaded_at"] = ""

    return jsonify({"success": True, "data": users})

@admin_bp.route("/employers", methods=["GET"])
@role_required("admin")
def list_employers():
    users_col = db_manager.get_collection("users")
    emp_col = db_manager.get_collection("employers")
    comp_col = db_manager.get_collection("company_profiles")
    
    employers = [
        u for u in list(users_col.find({"role": "employer"}))
        if str(u.get("email", "")).strip().lower().endswith("@gmail.com")
    ]
    result = []
    for u in employers:
        u.pop("password_hash", None)
        emp = emp_col.find_one({"user_id": u["_id"]}) or {}
        comp = comp_col.find_one({"employer_id": emp.get("_id")}) or {}
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
    
    # Gửi thông báo hệ thống trực tiếp cho tài khoản bị khóa
    try:
        db_manager.get_collection("notifications").insert_one({
            "_id": f"notif_{uuid.uuid4().hex[:8]}",
            "user_id": user_id,
            "title": "Tài khoản của bạn đã bị khóa bởi Quản trị viên",
            "message": f"Tài khoản của bạn đã bị khóa do vi phạm: {reason}. Mọi thao tác bị vô hiệu hóa.",
            "type": "account_banned",
            "related_id": user_id,
            "is_read": False,
            "is_deleted": False,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        })
    except Exception:
        pass

    return jsonify({"success": True, "message": f"Đã khóa tài khoản thành công. Lý do: {reason}"})

@admin_bp.route("/users/<user_id>/unban", methods=["PUT"])
@role_required("admin")
def unban_user(user_id):
    users_col = db_manager.get_collection("users")
    users_col.update_one(
        {"_id": user_id},
        {"$set": {"is_banned": False, "ban_reason": "", "status": "active"}}
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

    db_manager.cascade_delete_user(user_id)
    return jsonify({"success": True, "message": "Đã xóa vĩnh viễn tài khoản người dùng và dữ liệu liên quan thành công!"})

# 2.1 Duyệt Giấy phép kinh doanh GPKD (FR 3.4.6)
@admin_bp.route("/employers/<user_id>/gpkd", methods=["PUT"])
@role_required("admin")
def review_employer_gpkd(user_id):
    data = request.get_json() or {}
    status = data.get("status", "approved") # approved | rejected
    reason = data.get("reason", "")

    emp_col = db_manager.get_collection("employers")
    emp = emp_col.find_one({"user_id": user_id})
    if not emp:
        # Nếu chưa có thì khởi tạo
        emp_id = f"emp_{user_id}"
        emp_col.insert_one({
            "_id": emp_id,
            "user_id": user_id,
            "approval_status": status,
            "reject_reason": reason
        })
    else:
        emp_col.update_one(
            {"user_id": user_id},
            {"$set": {"approval_status": status, "reject_reason": reason}}
        )

    # Đẩy thông báo cho Nhà tuyển dụng
    notif_col = db_manager.get_collection("notifications")
    msg_body = "Hồ sơ Giấy phép kinh doanh (GPKD) của bạn đã được Quản trị viên phê duyệt thành công. Bạn hiện có thể đăng tin tuyển dụng không giới hạn!" if status == "approved" else f"Hồ sơ GPKD của bạn bị từ chối phê duyệt. Lý do: {reason}. Vui lòng cập nhật lại GPKD hợp lệ."
    notif_col.insert_one({
        "_id": f"notif_{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "title": "Kết quả xét duyệt Giấy phép kinh doanh (GPKD)",
        "message": msg_body,
        "type": "gpkd_status",
        "related_id": user_id,
        "is_read": False,
        "is_deleted": False,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    })

    action_text = "phê duyệt hợp lệ" if status == "approved" else "từ chối"
    return jsonify({"success": True, "message": f"Đã {action_text} Giấy phép kinh doanh của Nhà tuyển dụng!"})

# 3. Job Moderation (FR 3.5)
@admin_bp.route("/jobs", methods=["GET"])
@role_required("admin")
def list_all_jobs():
    jobs_col = db_manager.get_collection("jobs")
    jobs = [
        j for j in list(jobs_col.find({}).sort("created_at", -1))
        if j.get("_id") not in ["job_1", "job_2", "job_3", "job_4", "job_5", "job_6"]
    ]
    return jsonify({"success": True, "data": jobs})

@admin_bp.route("/jobs/<job_id>/hide", methods=["PUT"])
@role_required("admin")
def hide_job(job_id):
    data = request.get_json() or {}
    reason = data.get("reason", "Tin tuyển dụng có dấu hiệu vi phạm")
    jobs_col = db_manager.get_collection("jobs")
    jobs_col.update_one(
        {"_id": job_id},
        {"$set": {"is_hidden": True, "hidden_reason": reason}}
    )
    
    # Gửi thông báo hệ thống trực tiếp cho Doanh nghiệp đăng tin
    try:
        job = jobs_col.find_one({"_id": job_id})
        if job and job.get("employer_id"):
            emp = db_manager.get_collection("employers").find_one({"_id": job.get("employer_id")})
            target_user_id = emp.get("user_id") if emp else job.get("employer_id")
            db_manager.get_collection("notifications").insert_one({
                "_id": f"notif_{uuid.uuid4().hex[:8]}",
                "user_id": target_user_id,
                "title": f"Tin tuyển dụng bị tạm ẩn: {job.get('title')}",
                "message": f"Tin tuyển dụng '{job.get('title')}' đã bị Quản trị viên ẩn khỏi hệ thống. Lý do: {reason}",
                "type": "job",
                "related_id": job_id,
                "is_read": False,
                "is_deleted": False,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
            })
    except Exception:
        pass

    return jsonify({"success": True, "message": f"Đã ẩn tin tuyển dụng. Lý do: {reason}"})

@admin_bp.route("/jobs/<job_id>/unhide", methods=["PUT"])
@role_required("admin")
def unhide_job(job_id):
    jobs_col = db_manager.get_collection("jobs")
    jobs_col.update_one(
        {"_id": job_id},
        {"$set": {"is_hidden": False, "hidden_reason": ""}}
    )
    try:
        job = jobs_col.find_one({"_id": job_id})
        if job and job.get("employer_id"):
            emp = db_manager.get_collection("employers").find_one({"_id": job.get("employer_id")})
            target_user_id = emp.get("user_id") if emp else job.get("employer_id")
            db_manager.get_collection("notifications").insert_one({
                "_id": f"notif_{uuid.uuid4().hex[:8]}",
                "user_id": target_user_id,
                "title": f"Tin tuyển dụng đã hiển thị lại: {job.get('title')}",
                "message": f"Tin tuyển dụng '{job.get('title')}' đã được Quản trị viên khôi phục công khai trên sàn việc làm.",
                "type": "job",
                "related_id": job_id,
                "is_read": False,
                "is_deleted": False,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
            })
    except Exception:
        pass
    return jsonify({"success": True, "message": "Đã bỏ ẩn, tin tuyển dụng được hiển thị lại."})

@admin_bp.route("/jobs/<job_id>", methods=["DELETE"])
@role_required("admin")
def delete_job(job_id):
    db_manager.get_collection("bookmarks").delete_many({"job_id": job_id})
    db_manager.get_collection("applications").delete_many({"job_id": job_id})
    db_manager.get_collection("reports").delete_many({"target_id": job_id})
    jobs_col = db_manager.get_collection("jobs")
    jobs_col.delete_one({"_id": job_id})
    return jsonify({"success": True, "message": "Đã xóa vĩnh viễn tin tuyển dụng thành công!"})

# 4. Master Data Categories (FR 3.7)
@admin_bp.route("/categories", methods=["GET"])
@role_required("admin")
def list_categories():
    cat_col = db_manager.get_collection("categories")
    cat_col.delete_many({"_id": {"$in": ["loc_1", "loc_2", "loc_3", "loc_4", "loc_5"]}})
    cats = list(cat_col.find({}))
    return jsonify({"success": True, "data": cats})

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
    return jsonify({"success": True, "message": "Thêm danh mục mới thành công!", "data": new_cat}), 201

@admin_bp.route("/categories/<cat_id>", methods=["PUT"])
@role_required("admin")
def update_category(cat_id):
    data = request.get_json() or {}
    cat_col = db_manager.get_collection("categories")
    cat_col.update_one({"_id": cat_id}, {"$set": data})
    return jsonify({"success": True, "message": "Đã cập nhật danh mục."})

@admin_bp.route("/categories/<cat_id>", methods=["DELETE"])
@role_required("admin")
def delete_category(cat_id):
    jobs_col = db_manager.get_collection("jobs")
    jobs_col.update_many({"category_id": cat_id}, {"$set": {"category_id": ""}})
    cat_col = db_manager.get_collection("categories")
    cat_col.delete_one({"_id": cat_id})
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
    return jsonify({"success": True, "message": f"Đã cập nhật từ khóa cấm thành '{keyword}'!"})

@admin_bp.route("/banned-keywords/<kw_id>", methods=["DELETE"])
@role_required("admin")
def delete_banned_keyword(kw_id):
    ban_col = db_manager.get_collection("banned_keywords")
    ban_col.delete_one({"_id": kw_id})
    return jsonify({"success": True, "message": "Đã xóa từ khóa khỏi bộ lọc thành công!"})

# 6. Reports (FR 3.8)
@admin_bp.route("/reports", methods=["GET"])
@role_required("admin")
def list_reports():
    rep_col = db_manager.get_collection("reports")
    rep_col.delete_many({"_id": "rep_1"})
    reports = list(rep_col.find({}).sort("created_at", -1))
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

    # FR 3.8.4: Tự động gửi thông báo kết quả về cho người báo cáo
    notif_col = db_manager.get_collection("notifications")
    status_map = {
        "pending": "Chờ xử lý",
        "investigating": "Đang điều tra",
        "resolved": "Đã giải quyết",
        "dismissed": "Bị bác bỏ"
    }
    status_label = status_map.get(new_status, new_status)
    reporter_id = rep.get("reporter_id")
    if reporter_id:
        notif_col.insert_one({
            "_id": f"notif_{uuid.uuid4().hex[:8]}",
            "user_id": reporter_id,
            "title": f"Cập nhật Ticket vi phạm {rep.get('ticket_code', rep_id)}",
            "message": f"Quản trị viên đã xử lý báo cáo vi phạm của bạn với kết quả: '{status_label}'. {('Ghi chú: ' + note) if note else ''}",
            "type": "report_status",
            "related_id": rep_id,
            "is_read": False,
            "is_deleted": False,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        })

    return jsonify({"success": True, "message": f"Đã cập nhật trạng thái báo cáo sang: {status_label}"})

@admin_bp.route("/reports/<rep_id>", methods=["DELETE"])
@role_required("admin")
def delete_report(rep_id):
    rep_col = db_manager.get_collection("reports")
    rep_col.delete_one({"_id": rep_id})
    return jsonify({"success": True, "message": "Đã xóa vĩnh viễn báo cáo vi phạm thành công!"})

# FR 3.9.2: Xem lịch sử Chat gốc (Unmasked) để làm chứng cứ phân xử
@admin_bp.route("/reports/<rep_id>/chat-history", methods=["GET"])
@role_required("admin")
def get_report_chat_history(rep_id):
    rep_col = db_manager.get_collection("reports")
    rep = rep_col.find_one({"_id": rep_id})
    if not rep:
        return jsonify({"success": False, "message": "Không tìm thấy ticket."}), 404

    # Trích xuất hội thoại gốc thực tế từ messages collection (không dùng dữ liệu mẫu giả lập)
    msg_col = db_manager.get_collection("messages")
    msgs = list(msg_col.find({
        "$or": [
            {"room_id": rep.get("target_id")},
            {"sender_id": rep.get("reporter_id")},
            {"receiver_id": rep.get("reporter_id")}
        ]
    }).sort("created_at", 1))

    return jsonify({"success": True, "data": msgs, "ticket": rep})

# 7. Reviews Moderation (FR 3.6)
@admin_bp.route("/reviews", methods=["GET"])
@role_required("admin")
def list_all_reviews():
    rev_col = db_manager.get_collection("reviews")
    reviews = list(rev_col.find({}).sort("created_at", -1))
    return jsonify({"success": True, "data": reviews})

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

    return jsonify({"success": True, "message": "Đã xóa vĩnh viễn đánh giá thành công!"})


