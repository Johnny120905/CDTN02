import time
import uuid
from flask import Blueprint, request, jsonify
from pymongo.errors import DuplicateKeyError
from src.core.database import db_manager
from src.middlewares.auth_middleware import role_required

employer_bp = Blueprint("employer", __name__, url_prefix="/api/employer")

def get_employer_record(user_id):
    emp_col = db_manager.get_collection("employers")
    emp = emp_col.find_one({"user_id": user_id})
    if not emp:
        emp_id = f"emp_{uuid.uuid4().hex[:8]}"
        emp = {
            "_id": emp_id,
            "user_id": user_id,
            "approval_status": "pending",
            "reject_reason": ""
        }
        emp_col.insert_one(emp)
        comp_col = db_manager.get_collection("company_profiles")
        comp_col.insert_one({
            "_id": f"comp_{uuid.uuid4().hex[:8]}",
            "employer_id": emp_id,
            "company_name": "Doanh nghiệp mới",
            "description": "Chưa có mô tả",
            "scale": "1-10",
            "address": "TP.HCM",
            "business_license_url": "",
            "logo_url": "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=120&auto=format&fit=crop&q=80",
            "cover_image_url": ""
        })
    return emp

# 1. Company Profile (FR 2.3)
@employer_bp.route("/company", methods=["GET"])
@role_required("employer")
def get_company_profile():
    user = request.current_user
    emp = get_employer_record(user["_id"])
    comp_col = db_manager.get_collection("company_profiles")
    comp = comp_col.find_one({"employer_id": emp["_id"]}) or {}
    return jsonify({
        "success": True,
        "employer_status": emp.get("approval_status"),
        "data": comp
    })

@employer_bp.route("/company", methods=["PUT"])
@role_required("employer")
def update_company_profile():
    user = request.current_user
    emp = get_employer_record(user["_id"])
    comp_col = db_manager.get_collection("company_profiles")
    data = request.get_json() or {}

    # Validation constraints: GPKD .pdf <= 10MB, Logo & Cover .png/.jpg <= 10MB
    gpkd = str(data.get("business_license_url", "")).strip()
    if gpkd:
        if gpkd.startswith("data:") and not gpkd.startswith("data:application/pdf"):
            return jsonify({"success": False, "message": "Tệp Giấy phép kinh doanh (GPKD) chỉ nhận định dạng .pdf (≤ 10MB)!"}), 400

    logo = str(data.get("logo_url", "")).strip()
    if logo and not logo.startswith("http"):
        if logo.startswith("data:") and not (logo.startswith("data:image/png") or logo.startswith("data:image/jpeg") or logo.startswith("data:image/jpg")):
            return jsonify({"success": False, "message": "Logo Doanh nghiệp chỉ nhận định dạng ảnh .png, .jpg, .jpeg (≤ 10MB)!"}), 400

    cover = str(data.get("cover_image_url", "")).strip()
    if cover and not cover.startswith("http"):
        if cover.startswith("data:") and not (cover.startswith("data:image/png") or cover.startswith("data:image/jpeg") or cover.startswith("data:image/jpg")):
            return jsonify({"success": False, "message": "Ảnh bìa Doanh nghiệp chỉ nhận định dạng ảnh .png, .jpg, .jpeg (≤ 10MB)!"}), 400

    upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"))
    os.makedirs(upload_dir, exist_ok=True)
    import base64

    is_new_license = bool(data.get("reuploaded_license"))
    if gpkd and gpkd.startswith("data:application/pdf;base64,"):
        try:
            raw_b64 = gpkd.split(",", 1)[1]
            file_bytes = base64.b64decode(raw_b64)
            safe_name = f"gpkd_{uuid.uuid4().hex[:8]}.pdf"
            with open(os.path.join(upload_dir, safe_name), "wb") as f:
                f.write(file_bytes)
            gpkd = f"/uploads/{safe_name}"
            is_new_license = True
        except Exception:
            pass
    elif gpkd and gpkd != emp.get("license_url"):
        is_new_license = True

    comp_name = data.get("company_name") or emp.get("company_name", "Doanh nghiệp")
    new_approval_status = emp.get("approval_status", "approved")

    # Khi tải lại Giấy phép kinh doanh mới: Tự động chuyển trạng thái về "pending" (Chờ duyệt) và gửi thông báo Admin
    if is_new_license:
        new_approval_status = "pending"
        db_manager.get_collection("employers").update_one(
            {"_id": emp["_id"]},
            {"$set": {"license_url": gpkd, "approval_status": "pending", "reject_reason": ""}}
        )
        # Đẩy thông báo duyệt lại hồ sơ sang Quản trị viên (FR 3.4.6)
        try:
            admin_users = list(db_manager.get_collection("users").find({"role": "admin"}))
            notif_col = db_manager.get_collection("notifications")
            for adm in admin_users:
                notif_col.insert_one({
                    "_id": f"notif_{uuid.uuid4().hex[:8]}",
                    "user_id": adm["_id"],
                    "role": "admin",
                    "type": "employer_reapproval",
                    "title": f"Doanh nghiệp {comp_name} cập nhật lại GPKD",
                    "message": f"Doanh nghiệp {comp_name} đã cập nhật lại Giấy phép kinh doanh mới và đang chờ Quản trị viên phê duyệt lại.",
                    "target_id": emp["_id"],
                    "is_read": False,
                    "is_deleted": False,
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
                })
        except Exception:
            pass

    if logo and logo.startswith("data:image/"):
        try:
            mime_part, raw_b64 = logo.split(",", 1)
            ext = "png" if "png" in mime_part else "jpg"
            file_bytes = base64.b64decode(raw_b64)
            safe_name = f"logo_{uuid.uuid4().hex[:8]}.{ext}"
            with open(os.path.join(upload_dir, safe_name), "wb") as f:
                f.write(file_bytes)
            logo = f"/uploads/{safe_name}"
        except Exception:
            pass

    if cover and cover.startswith("data:image/"):
        try:
            mime_part, raw_b64 = cover.split(",", 1)
            ext = "png" if "png" in mime_part else "jpg"
            file_bytes = base64.b64decode(raw_b64)
            safe_name = f"cover_{uuid.uuid4().hex[:8]}.{ext}"
            with open(os.path.join(upload_dir, safe_name), "wb") as f:
                f.write(file_bytes)
            cover = f"/uploads/{safe_name}"
        except Exception:
            pass

    update_fields = {
        "company_name": data.get("company_name", "Doanh nghiệp"),
        "representative_name": data.get("representative_name", ""),
        "branch_name": data.get("branch_name", ""),
        "description": data.get("description", ""),
        "scale": data.get("scale", "1-10"),
        "address": data.get("address", ""),
        "business_license_url": gpkd or data.get("business_license_url", ""),
        "logo_url": logo or data.get("logo_url", ""),
        "cover_image_url": cover or data.get("cover_image_url", "")
    }
    comp_col.update_one({"employer_id": emp["_id"]}, {"$set": update_fields})
    msg = "Cập nhật hồ sơ doanh nghiệp thành công!"
    if is_new_license:
        msg = "Cập nhật hồ sơ thành công! Giấy phép kinh doanh mới đã được ghi nhận. Tài khoản của bạn đã được chuyển sang trạng thái 'Chờ duyệt' để Quản trị viên xem xét lại."

    updated_emp_record = db_manager.get_collection("employers").find_one({"_id": emp["_id"]})
    return jsonify({
        "success": True,
        "message": msg,
        "data": update_fields,
        "approval_status": new_approval_status,
        "license_reuploaded": is_new_license,
        "employer_record": updated_emp_record
    })

# 2. Jobs Management (FR 2.4)
@employer_bp.route("/jobs", methods=["GET"])
@role_required("employer")
def list_my_jobs():
    user = request.current_user
    emp = get_employer_record(user["_id"])
    job_col = db_manager.get_collection("jobs")
    jobs = list(job_col.find({"employer_id": emp["_id"]}).sort("created_at", -1))
    
    # Kèm số lượng ứng viên hợp lệ cho mỗi job (tự động loại bỏ hồ sơ sinh viên đã hủy - FR 2.5.1)
    app_col = db_manager.get_collection("applications")
    for j in jobs:
        j["applicant_count"] = app_col.count_documents({
            "job_id": j["_id"],
            "application_status": {"$nin": ["cancelled", "withdrawn"]},
            "is_cancelled": {"$ne": True}
        })
        
    return jsonify({"success": True, "data": jobs})

@employer_bp.route("/jobs", methods=["POST"])
@role_required("employer")
def create_job():
    user = request.current_user
    emp = get_employer_record(user["_id"])
    
    # FR 2.4.5: Khóa chức năng đăng tin nếu hồ sơ GPKD chưa được phê duyệt
    if emp.get("approval_status") != "approved":
        reject_reason = emp.get("reject_reason", "")
        reason_msg = f" Lý do từ chối: '{reject_reason}'." if reject_reason else ""
        return jsonify({
            "success": False,
            "message": f"Hồ sơ Giấy phép kinh doanh (GPKD) của bạn chưa được Quản trị viên duyệt (Trạng thái: {emp.get('approval_status', 'chờ duyệt')}).{reason_msg} Vui lòng cập nhật lại GPKD hợp lệ để mở khóa chức năng đăng tin!"
        }), 403

    comp_col = db_manager.get_collection("company_profiles")
    comp = comp_col.find_one({"employer_id": emp["_id"]}) or {}
    
    data = request.get_json() or {}
    title = str(data.get("title", "")).strip()
    category_id = data.get("category_id", "cat_1")
    location = str(data.get("location", comp.get("address", "TP.HCM"))).strip()
    description = str(data.get("description", "")).strip()
    salary_min = int(data.get("salary_min", 25000))
    salary_max = int(data.get("salary_max", 35000))
    is_negotiable = bool(data.get("is_negotiable", False))
    work_time = str(data.get("work_time", "Ca linh hoạt")).strip()

    if not title:
        return jsonify({"success": False, "message": "Tiêu đề tin tuyển dụng không được để trống."}), 400

    if not is_negotiable and salary_min > salary_max:
        return jsonify({"success": False, "message": "Lương tối thiểu không được lớn hơn lương tối đa."}), 400

    new_job = {
        "_id": f"job_{uuid.uuid4().hex[:8]}",
        "employer_id": emp["_id"],
        "category_id": category_id,
        "title": title,
        "company_name": comp.get("company_name", "Doanh nghiệp"),
        "company_logo": comp.get("logo_url", ""),
        "location": location,
        "description": description or "Tuyển dụng nhân viên part-time làm việc linh hoạt theo ca.",
        "salary_min": salary_min,
        "salary_max": salary_max,
        "is_negotiable": is_negotiable,
        "work_time": work_time,
        "job_status": "active",
        "is_open": True,
        "is_hidden": False,
        "hidden_reason": "",
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    db_manager.get_collection("jobs").insert_one(new_job)
    return jsonify({"success": True, "message": "Đăng tin tuyển dụng thành công!", "data": new_job}), 201

@employer_bp.route("/jobs/<job_id>", methods=["PUT"])
@role_required("employer")
def update_job(job_id):
    user = request.current_user
    emp = get_employer_record(user["_id"])
    job_col = db_manager.get_collection("jobs")
    
    job = job_col.find_one({"_id": job_id, "employer_id": emp["_id"]})
    if not job:
        return jsonify({"success": False, "message": "Không tìm thấy tin tuyển dụng."}), 404

    data = request.get_json() or {}
    # Validation constraints: GPKD .pdf <= 10MB, Logo & Cover .png/.jpg <= 10MB
    gpkd = str(data.get("business_license_url", "")).strip()
    if gpkd:
        if gpkd.startswith("data:") and not gpkd.startswith("data:application/pdf"):
            return jsonify({"success": False, "message": "Tệp Giấy phép kinh doanh (GPKD) chỉ nhận định dạng .pdf (≤ 10MB)!"}), 400

    logo = str(data.get("logo_url", "")).strip()
    if logo and not logo.startswith("http"):
        if logo.startswith("data:") and not (logo.startswith("data:image/png") or logo.startswith("data:image/jpeg") or logo.startswith("data:image/jpg")):
            return jsonify({"success": False, "message": "Logo Doanh nghiệp chỉ nhận định dạng ảnh .png, .jpg, .jpeg (≤ 10MB)!"}), 400

    cover = str(data.get("cover_image_url", "")).strip()
    if cover and not cover.startswith("http"):
        if cover.startswith("data:") and not (cover.startswith("data:image/png") or cover.startswith("data:image/jpeg") or cover.startswith("data:image/jpg")):
            return jsonify({"success": False, "message": "Ảnh bìa Doanh nghiệp chỉ nhận định dạng ảnh .png, .jpg, .jpeg (≤ 10MB)!"}), 400

    update_fields = {}
    for key in ["title", "category_id", "location", "description", "salary_min", "salary_max", "is_negotiable", "work_time", "is_open", "job_status"]:
        if key in data:
            update_fields[key] = data[key]

    job_col.update_one({"_id": job_id}, {"$set": update_fields})
    return jsonify({"success": True, "message": "Cập nhật tin tuyển dụng thành công!"})

@employer_bp.route("/jobs/<job_id>/status", methods=["PATCH", "PUT"])
@role_required("employer")
def toggle_job_status(job_id):
    user = request.current_user
    emp = get_employer_record(user["_id"])
    job_col = db_manager.get_collection("jobs")
    app_col = db_manager.get_collection("applications")
    
    job = job_col.find_one({"_id": job_id, "employer_id": emp["_id"]})
    if not job:
        return jsonify({"success": False, "message": "Không tìm thấy tin tuyển dụng."}), 404

    data = request.get_json(silent=True) or {}
    target_status = data.get("status")

    if target_status == "filled":
        # Bắt buộc có >= 1 đơn Đã duyệt (accepted)
        accepted_count = app_col.count_documents({
            "job_id": job_id,
            "application_status": {"$in": ["accepted", "Đã duyệt"]}
        })
        if accepted_count == 0:
            return jsonify({"success": False, "message": "Bắt buộc có ít nhất 1 đơn ứng tuyển Đã duyệt để chốt danh sách Đã nhận người."}), 400
        
        job_col.update_one({"_id": job_id}, {"$set": {"status": "filled", "is_open": False}})
        # Tự động chuyển toàn bộ đơn đang Chờ duyệt sang Từ chối kèm lý do "Tin đã đủ người"
        app_col.update_many(
            {"job_id": job_id, "application_status": {"$in": ["pending", "Chờ duyệt"]}},
            {
                "$set": {"application_status": "rejected", "reject_reason": "Tin đã đủ người"},
                "$push": {"status_history": {"status": "rejected", "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"), "note": "Tin đã đủ người"}}
            }
        )
        return jsonify({"success": True, "status": "filled", "message": "Đã chốt danh sách ca làm (Đã nhận đủ người)."})

    elif target_status == "completed":
        # Chuyển trạng thái sang Hoàn thành (kết thúc công việc vĩnh viễn và kích hoạt đánh giá 2 chiều)
        job_col.update_one({"_id": job_id}, {"$set": {"status": "completed", "is_open": False, "completed_at": time.strftime("%Y-%m-%d %H:%M:%S")}})
        return jsonify({"success": True, "status": "completed", "message": "Đã xác nhận hoàn thành ca làm và kết thúc công việc thành công!"})

    elif target_status == "closed":
        job_col.update_one({"_id": job_id}, {"$set": {"status": "closed", "is_open": False}})
        return jsonify({"success": True, "status": "closed", "is_open": False, "message": "Đã tạm đóng tin tuyển dụng."})

    elif target_status == "open":
        job_col.update_one({"_id": job_id}, {"$set": {"status": "open", "is_open": True}})
        return jsonify({"success": True, "status": "open", "is_open": True, "message": "Đã mở lại tin tuyển dụng."})

    # Fallback legacy 2-way toggle
    new_status = not job.get("is_open", True)
    status_label = "open" if new_status else "closed"
    job_col.update_one({"_id": job_id}, {"$set": {"is_open": new_status, "status": status_label}})
    msg = "Đã mở lại tin tuyển dụng." if new_status else "Đã đóng nhận hồ sơ tin tuyển dụng."
    return jsonify({"success": True, "is_open": new_status, "status": status_label, "message": msg})

# 3. Applicant Tracking System - ATS (FR 2.5)
@employer_bp.route("/applicants", methods=["GET"])
@role_required("employer")
def list_applicants():
    user = request.current_user
    emp = get_employer_record(user["_id"])
    job_id = request.args.get("job_id")
    status = request.args.get("status")

    app_col = db_manager.get_collection("applications")
    query = {"employer_id": emp["_id"]}
    if job_id:
        query["job_id"] = job_id
    # Ràng buộc FR 2.5.1: Tự động ẩn đi các đơn ứng tuyển mà sinh viên đã chủ động hủy trước đó (1.6.4)
    if status and status not in ["cancelled", "withdrawn"]:
        query["application_status"] = status
    else:
        query["application_status"] = {"$nin": ["cancelled", "withdrawn"]}
    query["is_cancelled"] = {"$ne": True}

    applicants = list(app_col.find(query).sort("applied_at", -1))
    return jsonify({"success": True, "data": applicants})

@employer_bp.route("/applicants/<app_id>/status", methods=["PUT"])
@role_required("employer")
def update_applicant_status(app_id):
    user = request.current_user
    emp = get_employer_record(user["_id"])
    data = request.get_json() or {}
    new_status = data.get("status") # reviewed, interview, accepted, rejected
    note = data.get("note", "")

    valid_statuses = ["reviewed", "interview", "accepted", "rejected"]
    if new_status not in valid_statuses:
        return jsonify({"success": False, "message": f"Trạng thái không hợp lệ. Phải là một trong: {valid_statuses}"}), 400

    app_col = db_manager.get_collection("applications")
    app = app_col.find_one({"_id": app_id, "employer_id": emp["_id"]})
    if not app:
        return jsonify({"success": False, "message": "Không tìm thấy hồ sơ ứng viên."}), 404

    current_status = app.get("application_status")
    if current_status == new_status:
        return jsonify({"success": True, "message": f"Hồ sơ đã ở trạng thái {'trúng tuyển' if new_status == 'accepted' else new_status}."})

    history_item = {
        "status": new_status,
        "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "note": note or ("Nhà tuyển dụng phê duyệt trúng tuyển" if new_status == "accepted" else ("Hồ sơ chưa phù hợp" if new_status == "rejected" else f"Nhà tuyển dụng chuyển trạng thái sang {new_status}"))
    }

    app_col.update_one(
        {"_id": app_id},
        {
            "$set": {"application_status": new_status, "reject_reason": note if new_status == "rejected" else ""},
            "$push": {"status_history": history_item}
        }
    )

    # Đẩy thông báo cho sinh viên
    notif_col = db_manager.get_collection("notifications")
    status_text_map = {
        "reviewed": "đã xem hồ sơ của bạn",
        "interview": "mời bạn tham gia phỏng vấn",
        "accepted": "chấp thuận tuyển dụng bạn",
        "rejected": "đã từ chối hồ sơ ứng tuyển"
    }
    notif_col.insert_one({
        "_id": f"notif_{uuid.uuid4().hex[:8]}",
        "user_id": app.get("student_user_id"),
        "title": "Cập nhật trạng thái ứng tuyển",
        "message": f"Nhà tuyển dụng {app.get('company_name')} {status_text_map.get(new_status, 'đã cập nhật hồ sơ')} cho công việc '{app.get('job_title')}'.",
        "type": "application_status",
        "related_id": app_id,
        "is_read": False,
        "is_deleted": False,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    })

    return jsonify({"success": True, "message": f"Đã cập nhật trạng thái ứng viên sang: {new_status}"})

# 4. Employer Reviews (FR 2.6)
@employer_bp.route("/reviews", methods=["POST"])
@role_required("employer")
def review_student():
    user = request.current_user
    emp = get_employer_record(user["_id"])
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
    app = app_col.find_one({"_id": application_id, "$or": [{"employer_id": emp["_id"]}, {"employer_id": user["_id"]}]})
    if not app:
        app = app_col.find_one({"_id": application_id})
    if not app:
        return jsonify({"success": False, "message": "Không tìm thấy hồ sơ ứng viên."}), 404

    rev_col = db_manager.get_collection("reviews")
    
    # Kiểm tra xem đã có đánh giá nào cho application_id này bởi nhà tuyển dụng chưa (tránh DuplicateKeyError)
    existing_rev = rev_col.find_one({
        "$or": [
            {"application_id": application_id, "reviewer_id": user["_id"]},
            {"application_id": application_id, "reviewer_id": emp["_id"]}
        ]
    })

    if existing_rev:
        # Cập nhật đánh giá đã có (FR 2.6.4)
        rev_col.update_one(
            {"_id": existing_rev["_id"]},
            {"$set": {
                "rating": rating,
                "comment": comment,
                "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }}
        )
        updated_rev = rev_col.find_one({"_id": existing_rev["_id"]})
        return jsonify({
            "success": True, 
            "message": "Đã cập nhật đánh giá năng lực sinh viên thành công!", 
            "data": updated_rev
        }), 200

    new_rev = {
        "_id": f"rev_{uuid.uuid4().hex[:8]}",
        "application_id": application_id,
        "reviewer_id": user["_id"],
        "reviewer_name": "Nhà tuyển dụng",
        "target_id": app.get("student_user_id") or app.get("student_id"),
        "rating": rating,
        "comment": comment,
        "is_hidden": False,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    try:
        rev_col.insert_one(new_rev)
    except DuplicateKeyError:
        # Trong trường hợp có race condition, cập nhật record
        rev_col.update_one(
            {"application_id": application_id, "reviewer_id": user["_id"]},
            {"$set": {
                "rating": rating,
                "comment": comment,
                "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }}
        )
        new_rev = rev_col.find_one({"application_id": application_id, "reviewer_id": user["_id"]})

    # Gửi thông báo cho sinh viên
    student_uid = app.get("student_user_id")
    if student_uid:
        db_manager.get_collection("notifications").insert_one({
            "_id": f"notif_{uuid.uuid4().hex[:8]}",
            "user_id": student_uid,
            "title": "Đánh giá năng lực mới",
            "message": f"Nhà tuyển dụng đã gửi đánh giá năng lực ({rating}/5 sao) cho công việc '{app.get('job_title', 'bán thời gian')}'.",
            "type": "review",
            "related_id": application_id,
            "is_read": False,
            "is_deleted": False,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        })

    return jsonify({"success": True, "message": "Đã gửi đánh giá năng lực sinh viên thành công!", "data": new_rev}), 201

@employer_bp.route("/reviews", methods=["GET"])
@role_required("employer")
def list_employer_reviews():
    user = request.current_user
    rev_col = db_manager.get_collection("reviews")
    reviews = list(rev_col.find({"reviewer_id": user["_id"]}).sort("created_at", -1))
    return jsonify({"success": True, "data": reviews})

@employer_bp.route("/reviews/<rev_id>", methods=["PUT"])
@role_required("employer")
def update_employer_review(rev_id):
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

    # FR-QT-05.04: Chặn chỉnh sửa nếu Quản trị viên đã ẩn bài đánh giá do vi phạm
    if rev.get("is_hidden"):
        return jsonify({
            "success": False, 
            "message": "Đánh giá này đã bị Quản trị viên ẩn do vi phạm tiêu chuẩn cộng đồng. Bạn không thể chỉnh sửa đánh giá này!"
        }), 403

    rev_col.update_one(
        {"_id": rev_id},
        {"$set": {"rating": rating, "comment": comment, "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")}}
    )
    return jsonify({"success": True, "message": "Đã cập nhật đánh giá sinh viên."})

# 5. Delete Job (FR 2.4.8)
@employer_bp.route("/jobs/<job_id>", methods=["DELETE"])
@role_required("employer")
def delete_employer_job(job_id):
    user = request.current_user
    emp = get_employer_record(user["_id"])
    job_col = db_manager.get_collection("jobs")
    job = job_col.find_one({"_id": job_id, "employer_id": emp["_id"]})
    if not job:
        return jsonify({"success": False, "message": "Không tìm thấy tin tuyển dụng."}), 404

    # Ràng buộc FR 2.4.8: Không xóa tin đã có lượt nộp đơn > 0 hoặc lượt báo cáo > 0
    app_col = db_manager.get_collection("applications")
    rep_col = db_manager.get_collection("reports")
    app_count = app_col.count_documents({"job_id": job_id})
    rep_count = rep_col.count_documents({"target_id": job_id})
    if app_count > 0 or rep_count > 0:
        return jsonify({"success": False, "message": f"Không thể xóa tin tuyển dụng đã có {app_count} lượt nộp đơn hoặc {rep_count} báo cáo vi phạm."}), 400

    job_col.delete_one({"_id": job_id})
    return jsonify({"success": True, "message": "Đã xóa tin tuyển dụng thành công."})

# 6. Notifications (FR 2.8)
@employer_bp.route("/notifications", methods=["GET"])
@role_required("employer")
def list_employer_notifications():
    user = request.current_user
    notif_col = db_manager.get_collection("notifications")
    notifs = list(notif_col.find({"user_id": user["_id"], "is_deleted": False}).sort("created_at", -1))
    return jsonify({"success": True, "data": notifs})

@employer_bp.route("/notifications/<notif_id>/read", methods=["PUT"])
@role_required("employer")
def mark_employer_read(notif_id):
    user = request.current_user
    notif_col = db_manager.get_collection("notifications")
    notif_col.update_one({"_id": notif_id, "user_id": user["_id"]}, {"$set": {"is_read": True}})
    return jsonify({"success": True, "message": "Đã đọc thông báo."})

@employer_bp.route("/notifications/<notif_id>", methods=["DELETE"])
@role_required("employer")
def delete_employer_notification(notif_id):
    user = request.current_user
    notif_col = db_manager.get_collection("notifications")
    notif_col.update_one({"_id": notif_id, "user_id": user["_id"]}, {"$set": {"is_deleted": True}})
    return jsonify({"success": True, "message": "Đã xóa thông báo."})


