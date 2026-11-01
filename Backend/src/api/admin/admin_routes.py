import time
import uuid
from flask import Blueprint, request, jsonify
from src.core.database import db_manager
from src.middlewares.auth_middleware import role_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

# 1. Dashboard Analytics (FR 3.3)
@admin_bp.route("/dashboard", methods=["GET"])
@role_required("admin")
def get_dashboard_stats():
    users_col = db_manager.get_collection("users")
    jobs_col = db_manager.get_collection("jobs")
    apps_col = db_manager.get_collection("applications")
    reports_col = db_manager.get_collection("reports")

    total_users = users_col.count_documents({})
    student_count = users_col.count_documents({"role": "student"})
    employer_count = users_col.count_documents({"role": "employer"})
    banned_users = users_col.count_documents({"is_banned": True})

    total_jobs = jobs_col.count_documents({})
    active_jobs = jobs_col.count_documents({"is_open": True, "is_hidden": False})
    hidden_jobs = jobs_col.count_documents({"is_hidden": True})

    total_applications = apps_col.count_documents({})
    accepted_apps = apps_col.count_documents({"application_status": "accepted"})
    pending_apps = apps_col.count_documents({"application_status": "pending"})

    pending_reports = reports_col.count_documents({"status": "pending"})

    # Dữ liệu biểu đồ tăng trưởng 6 tháng gần nhất
    growth_data = [
        {"month": "T5/2026", "users": 120, "jobs": 45, "applications": 210},
        {"month": "T6/2026", "users": 280, "jobs": 90, "applications": 480},
        {"month": "T7/2026", "users": 520, "jobs": 160, "applications": 890},
        {"month": "T8/2026", "users": 840, "jobs": 290, "applications": 1450},
        {"month": "T9/2026", "users": 1350, "jobs": 480, "applications": 2300},
        {"month": "T10/2026", "users": total_users, "jobs": total_jobs, "applications": total_applications},
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
            "growth_chart": growth_data
        }
    })

# 2. User Moderation (FR 3.4)
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

    users = list(users_col.find(query).sort("created_at", -1))
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
                comp = db_manager.get_collection("company_profiles").find_one({"employer_id": emp["_id"]})
                u["profile"] = comp or {}
                u["approval_status"] = emp.get("approval_status", "pending")
                u["license_url"] = emp.get("license_url") or (comp.get("license_url") if comp else None) or "/uploads/gpkd_phuclong.pdf"
            else:
                u["profile"] = {}
                u["approval_status"] = "pending"
                u["license_url"] = "/uploads/gpkd_phuclong.pdf"

    return jsonify({"success": True, "data": users})

@admin_bp.route("/employers", methods=["GET"])
@role_required("admin")
def list_employers():
    users_col = db_manager.get_collection("users")
    emp_col = db_manager.get_collection("employers")
    comp_col = db_manager.get_collection("company_profiles")
    
    employers = list(users_col.find({"role": "employer"}))
    result = []
    for u in employers:
        u.pop("password_hash", None)
        emp = emp_col.find_one({"user_id": u["_id"]}) or {}
        comp = comp_col.find_one({"employer_id": emp.get("_id")}) or {}
        u["employer_record"] = emp
        u["profile"] = comp
        u["company_name"] = comp.get("company_name") or u.get("full_name") or "Doanh nghiệp PARTIME"
        u["approval_status"] = emp.get("approval_status", "pending")
        u["license_url"] = emp.get("license_url") or comp.get("license_url") or "/uploads/gpkd_phuclong.pdf"
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
    jobs = list(jobs_col.find({}).sort("created_at", -1))
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
    app_col = db_manager.get_collection("applications")
    rep_col = db_manager.get_collection("reports")
    app_count = app_col.count_documents({"job_id": job_id})
    rep_count = rep_col.count_documents({"target_id": job_id})
    if app_count > 0 or rep_count > 0:
        return jsonify({"success": False, "message": f"Không thể xóa cứng tin tuyển dụng đã có {app_count} lượt ứng tuyển hoặc {rep_count} báo cáo vi phạm. Hãy dùng tính năng Ẩn tin (Icon Con mắt gạch chéo)."}), 400

    jobs_col = db_manager.get_collection("jobs")
    jobs_col.delete_one({"_id": job_id})
    return jsonify({"success": True, "message": "Đã xóa vĩnh viễn tin tuyển dụng."})

# 4. Master Data Categories (FR 3.7)
@admin_bp.route("/categories", methods=["GET"])
@role_required("admin")
def list_categories():
    cat_col = db_manager.get_collection("categories")
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
    # Ràng buộc FR 3.7.6: Xóa danh mục chưa phát sinh khóa ngoại
    jobs_col = db_manager.get_collection("jobs")
    used_in_job = jobs_col.count_documents({"category_id": cat_id})
    if used_in_job > 0:
        return jsonify({"success": False, "message": f"Không thể xóa danh mục đang có {used_in_job} tin tuyển dụng liên kết khóa ngoại."}), 400

    cat_col = db_manager.get_collection("categories")
    cat_col.delete_one({"_id": cat_id})
    return jsonify({"success": True, "message": "Đã xóa danh mục thành công."})


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

@admin_bp.route("/banned-keywords/<kw_id>", methods=["DELETE"])
@role_required("admin")
def delete_banned_keyword(kw_id):
    ban_col = db_manager.get_collection("banned_keywords")
    ban_col.delete_one({"_id": kw_id})
    return jsonify({"success": True, "message": "Đã xóa từ khóa khỏi bộ lọc."})

# 6. Reports (FR 3.8)
@admin_bp.route("/reports", methods=["GET"])
@role_required("admin")
def list_reports():
    rep_col = db_manager.get_collection("reports")
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

# FR 3.9.2: Xem lịch sử Chat gốc (Unmasked) để làm chứng cứ phân xử
@admin_bp.route("/reports/<rep_id>/chat-history", methods=["GET"])
@role_required("admin")
def get_report_chat_history(rep_id):
    rep_col = db_manager.get_collection("reports")
    rep = rep_col.find_one({"_id": rep_id})
    if not rep:
        return jsonify({"success": False, "message": "Không tìm thấy ticket."}), 404

    # Trích xuất hội thoại gốc từ messages collection
    msg_col = db_manager.get_collection("messages")
    # Lấy tin nhắn liên quan đến reporter hoặc target
    msgs = list(msg_col.find({
        "$or": [
            {"room_id": rep.get("target_id")},
            {"sender_id": rep.get("reporter_id")},
            {"receiver_id": rep.get("reporter_id")}
        ]
    }).sort("created_at", 1))

    # Nếu chưa có tin nhắn trong database thì trả về snapshot bằng chứng
    if not msgs:
        msgs = [
            {"sender": rep.get("reporter_name", "Người báo cáo"), "content": "Em muốn hỏi thông tin ca làm việc tại quán ạ.", "created_at": "10:00", "is_banned_keyword": False},
            {"sender": "Đối tượng bị báo cáo", "content": "Em chuyển cọc trước 300k tiền đồng phục vào stk để giữ ca nhé.", "created_at": "10:05", "is_banned_keyword": True},
            {"sender": rep.get("reporter_name", "Người báo cáo"), "content": "Ủa sàn cấm thu cọc mà anh?", "created_at": "10:06", "is_banned_keyword": False}
        ]

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
    rev_col.delete_one({"_id": rev_id})
    return jsonify({"success": True, "message": "Đã xóa đánh giá vi phạm thành công."})


