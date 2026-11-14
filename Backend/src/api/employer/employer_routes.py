import time
import uuid
from flask import Blueprint, request, jsonify
from pymongo.errors import DuplicateKeyError
from src.core.database import db_manager
from src.core.notification_service import (
    create_and_emit_notification,
    emit_socket_event,
    notify_admins,
    resolve_student_user_id,
)
from src.core.socket_service import canonicalize_room_id, get_latest_room_message
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
        "employer_record": emp,
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

    logo = str(data.get("logo_url", "")).strip()
    if logo.startswith("data:image/svg+xml"):
        logo = ""
    elif logo and not logo.startswith("http"):
        if logo.startswith("data:") and not (logo.startswith("data:image/png") or logo.startswith("data:image/jpeg") or logo.startswith("data:image/jpg")):
            return jsonify({"success": False, "message": "Logo Doanh nghiệp chỉ nhận định dạng ảnh .png, .jpg, .jpeg (≤ 10MB)!"}), 400

    cover = str(data.get("cover_image_url", "")).strip()
    if cover.startswith("data:image/svg+xml"):
        cover = ""
    elif cover and not cover.startswith("http"):
        if cover.startswith("data:") and not (cover.startswith("data:image/png") or cover.startswith("data:image/jpeg") or cover.startswith("data:image/jpg")):
            return jsonify({"success": False, "message": "Ảnh bìa Doanh nghiệp chỉ nhận định dạng ảnh .png, .jpg, .jpeg (≤ 10MB)!"}), 400

    existing_comp = comp_col.find_one({"employer_id": emp["_id"]}) or {}
    old_gpkd = existing_comp.get("business_license_url") or emp.get("license_url") or ""
    gpkd_name = str(data.get("business_license_name", "")).strip()

    is_new_license = bool(data.get("reuploaded_license"))
    if gpkd and gpkd.startswith("data:"):
        try:
            _, gpkd = db_manager.save_data_url(
                gpkd,
                filename=gpkd_name or f"gpkd_{emp['_id']}.pdf",
                allowed_types=("application/pdf",),
                metadata={"type": "gpkd", "employer_id": emp["_id"]},
                allow_pdf_magic=True
            )
            is_new_license = True
            if old_gpkd and old_gpkd != gpkd:
                db_manager.delete_file(old_gpkd)
        except ValueError as e:
            return jsonify({"success": False, "message": f"Tệp Giấy phép kinh doanh (GPKD) chỉ nhận định dạng .pdf (≤ 10MB)! ({e})"}), 400
        except Exception as e:
            return jsonify({"success": False, "message": f"Lỗi lưu Giấy phép kinh doanh: {str(e)}"}), 400
    elif gpkd and gpkd != old_gpkd:
        is_new_license = True

    comp_name = data.get("company_name") or emp.get("company_name", "Doanh nghiệp")
    new_approval_status = emp.get("approval_status", "approved")

    # Khi tải lại Giấy phép kinh doanh mới: Tự động chuyển trạng thái về "pending" (Chờ duyệt) và gửi thông báo Admin
    if is_new_license:
        new_approval_status = "pending"
        emp_update = {
            "license_url": gpkd,
            "approval_status": "pending",
            "reject_reason": "",
            "license_uploaded_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        if gpkd_name:
            emp_update["license_name"] = gpkd_name
        db_manager.get_collection("employers").update_one(
            {"_id": emp["_id"]},
            {"$set": emp_update}
        )
        # Đẩy thông báo duyệt lại hồ sơ sang Quản trị viên kèm Socket.IO tức thì (FR 3.4.6)
        notify_admins(
            title=f"Doanh nghiệp {comp_name} cập nhật lại Giấy phép kinh doanh (GPKD)",
            message=f"Doanh nghiệp {comp_name} đã cập nhật lại Giấy phép kinh doanh mới và đang chờ Quản trị viên phê duyệt lại.",
            notif_type="employer_reapproval_gpkd",
            related_id=emp["_id"],
            target_id=emp["_id"],
        )
        emit_socket_event("gpkd-reupload", {
            "employer_id": emp["_id"],
            "user_id": user["_id"],
            "company_name": comp_name,
            "approval_status": "pending",
        })

    if logo and logo.startswith("data:image/"):
        try:
            mime_part = logo.split(",", 1)[0]
            ext = "png" if "png" in mime_part else "jpg"
            _, logo = db_manager.save_data_url(
                logo,
                filename=f"logo_{emp['_id']}.{ext}",
                allowed_types=("image/png", "image/jpeg", "image/jpg"),
                metadata={"type": "company_logo", "employer_id": emp["_id"]}
            )
            old_logo = existing_comp.get("logo_url")
            if old_logo and old_logo != logo:
                db_manager.delete_file(old_logo)
        except ValueError as e:
            return jsonify({"success": False, "message": str(e)}), 400
        except Exception as e:
            return jsonify({"success": False, "message": f"Lỗi lưu Logo doanh nghiệp: {str(e)}"}), 400

    if cover and cover.startswith("data:image/"):
        try:
            mime_part = cover.split(",", 1)[0]
            ext = "png" if "png" in mime_part else "jpg"
            _, cover = db_manager.save_data_url(
                cover,
                filename=f"cover_{emp['_id']}.{ext}",
                allowed_types=("image/png", "image/jpeg", "image/jpg"),
                metadata={"type": "company_cover", "employer_id": emp["_id"]}
            )
            old_cover = existing_comp.get("cover_image_url")
            if old_cover and old_cover != cover:
                db_manager.delete_file(old_cover)
        except ValueError as e:
            return jsonify({"success": False, "message": str(e)}), 400
        except Exception as e:
            return jsonify({"success": False, "message": f"Lỗi lưu Ảnh bìa doanh nghiệp: {str(e)}"}), 400
    update_fields = {
        "company_name": data["company_name"] if "company_name" in data else existing_comp.get("company_name", "Doanh nghiệp"),
        "representative_name": data["representative_name"] if "representative_name" in data else existing_comp.get("representative_name", ""),
        "branch_name": data["branch_name"] if "branch_name" in data else existing_comp.get("branch_name", ""),
        "description": data["description"] if "description" in data else existing_comp.get("description", ""),
        "scale": data["scale"] if "scale" in data else existing_comp.get("scale", "1-10"),
        "address": data["address"] if "address" in data else existing_comp.get("address", ""),
        "business_license": data["business_license"] if "business_license" in data else existing_comp.get("business_license", ""),
        "phone": data["phone"] if "phone" in data else existing_comp.get("phone", ""),
        "website": data["website"] if "website" in data else existing_comp.get("website", ""),
        "business_license_url": gpkd if "business_license_url" in data else existing_comp.get("business_license_url", ""),
        "business_license_name": gpkd_name or existing_comp.get("business_license_name", ""),
        "logo_url": logo if "logo_url" in data else existing_comp.get("logo_url", ""),
        "cover_image_url": cover if "cover_image_url" in data else existing_comp.get("cover_image_url", "")
    }
    if "status" in data:
        update_fields["status"] = data["status"]
    comp_col.update_one({"employer_id": emp["_id"]}, {"$set": update_fields}, upsert=True)
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
    
    # Kèm số lượng ứng viên hợp lệ + số đã duyệt + tên ngành nghề cho mỗi job (FR 2.5.1)
    app_col = db_manager.get_collection("applications")
    cat_map = {c.get("_id"): c.get("name") for c in db_manager.get_collection("categories").find({}) if c.get("_id")}
    for j in jobs:
        j["applicant_count"] = app_col.count_documents({
            "job_id": j["_id"],
            "application_status": {"$nin": ["cancelled", "withdrawn"]},
            "is_cancelled": {"$ne": True}
        })
        j["accepted_count"] = app_col.count_documents({
            "job_id": j["_id"],
            "application_status": {"$in": ["accepted", "Đã duyệt"]},
            "is_deleted_by_student": {"$ne": True}
        })
        if not j.get("category_name") and j.get("category_id") in cat_map:
            j["category_name"] = cat_map[j["category_id"]]
        if not j.get("status") and j.get("job_status"):
            j["status"] = j["job_status"]
        elif not j.get("job_status") and j.get("status"):
            j["job_status"] = j["status"]
        
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
    raw_cat = str(data.get("category_id", "")).strip() or "cat_1"
    cat_col = db_manager.get_collection("categories")
    matched_cat = cat_col.find_one({"$or": [{"_id": raw_cat}, {"name": raw_cat}]})
    if matched_cat:
        category_id = matched_cat.get("_id")
        category_name = matched_cat.get("name")
    else:
        category_id = raw_cat
        category_name = str(data.get("category_name") or raw_cat).strip()
    location = str(data.get("location", comp.get("address", "TP.HCM"))).strip()
    branch_name = str(data.get("branch_name") or comp.get("branch_name") or location).strip()
    description = str(data.get("description", "")).strip()
    salary_min = int(data.get("salary_min", 25000))
    salary_max = int(data.get("salary_max", 35000))
    is_negotiable = bool(data.get("is_negotiable", False))
    work_time = str(data.get("work_time", "Ca linh hoạt")).strip()
    payment_type = str(data.get("payment_type") or data.get("salary_unit") or "").strip()

    if not title:
        return jsonify({"success": False, "message": "Tiêu đề tin tuyển dụng không được để trống."}), 400

    if not is_negotiable and salary_min > salary_max:
        return jsonify({"success": False, "message": "Lương tối thiểu không được lớn hơn lương tối đa."}), 400

    new_job = {
        "_id": f"job_{uuid.uuid4().hex[:8]}",
        "employer_id": emp["_id"],
        "category_id": category_id,
        "category_name": category_name,
        "title": title,
        "company_name": comp.get("company_name", "Doanh nghiệp"),
        "company_logo": comp.get("logo_url", ""),
        "location": location,
        "branch_name": branch_name,
        "description": description or "Tuyển dụng nhân viên part-time làm việc linh hoạt theo ca.",
        "salary_min": salary_min,
        "salary_max": salary_max,
        "is_negotiable": is_negotiable,
        "work_time": work_time,
        "payment_type": payment_type,
        "status": "open",
        "job_status": "open",
        "is_open": True,
        "is_hidden": False,
        "hidden_reason": "",
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    db_manager.get_collection("jobs").insert_one(new_job)
    notify_admins(
        title="Tin tuyển dụng mới cần giám sát",
        message=f"Doanh nghiệp {new_job['company_name']} vừa đăng tin tuyển dụng '{title}' ({location}).",
        notif_type="new_job",
        related_id=new_job["_id"],
        target_id=new_job["_id"],
    )
    emit_socket_event("new-job", new_job)
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
    for key in ["title", "category_id", "location", "description", "salary_min", "salary_max", "is_negotiable", "work_time", "is_open", "job_status", "status"]:
        if key in data:
            update_fields[key] = data[key]
    if "job_status" in update_fields and "status" not in update_fields:
        update_fields["status"] = update_fields["job_status"]
    elif "status" in update_fields and "job_status" not in update_fields:
        update_fields["job_status"] = update_fields["status"]

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
        accepted_apps = list(app_col.find({
            "job_id": job_id,
            "application_status": {"$in": ["accepted", "Đã duyệt"]}
        }))
        if len(accepted_apps) == 0:
            return jsonify({"success": False, "message": "Bắt buộc có ít nhất 1 đơn ứng tuyển Đã duyệt để chốt danh sách Đã nhận người."}), 400
        
        job_col.update_one({"_id": job_id}, {"$set": {"status": "filled", "job_status": "filled", "is_open": False}})
        # Tự động chuyển toàn bộ đơn đang Chờ duyệt sang Từ chối kèm lý do "Tin đã đủ người"
        pending_apps = list(app_col.find({"job_id": job_id, "application_status": {"$in": ["pending", "Chờ duyệt"]}}))
        app_col.update_many(
            {"job_id": job_id, "application_status": {"$in": ["pending", "Chờ duyệt"]}},
            {
                "$set": {"application_status": "rejected", "reject_reason": "Tin đã đủ người"},
                "$push": {"status_history": {"status": "rejected", "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"), "note": "Tin đã đủ người"}}
            }
        )
        for p_app in pending_apps:
            stu_uid = resolve_student_user_id(p_app.get("student_user_id") or p_app.get("student_id"))
            if stu_uid:
                create_and_emit_notification(
                    user_id=stu_uid,
                    title="Tin tuyển dụng đã đủ người",
                    message=f"Vị trí '{job.get('title')}' đã nhận đủ ứng viên. Hồ sơ chờ duyệt của bạn được đóng tự động.",
                    notif_type="application_status",
                    related_id=p_app.get("_id"),
                )
        emit_socket_event("job-updated", {"job_id": job_id, "status": "filled", "is_open": False})
        emit_socket_event("application-status-updated", {"job_id": job_id, "status": "rejected"})
        return jsonify({"success": True, "status": "filled", "job_status": "filled", "is_open": False, "message": "Đã chốt danh sách ca làm (Đã nhận đủ người)."})

    elif target_status == "completed":
        # Chuyển trạng thái sang Hoàn thành (kết thúc công việc vĩnh viễn và kích hoạt đánh giá 2 chiều)
        job_col.update_one({"_id": job_id}, {"$set": {"status": "completed", "job_status": "completed", "is_open": False, "completed_at": time.strftime("%Y-%m-%d %H:%M:%S")}})
        accepted_apps = list(app_col.find({"job_id": job_id, "application_status": {"$in": ["accepted", "Đã duyệt"]}}))
        for a_app in accepted_apps:
            stu_uid = resolve_student_user_id(a_app.get("student_user_id") or a_app.get("student_id"))
            if stu_uid:
                create_and_emit_notification(
                    user_id=stu_uid,
                    title="Công việc đã hoàn thành",
                    message=f"Doanh nghiệp vừa xác nhận hoàn thành công việc '{job.get('title')}'. Bạn có thể gửi đánh giá 2 chiều ngay!",
                    notif_type="job_completed",
                    related_id=a_app.get("_id"),
                )
        notify_admins(
            title="Công việc hoàn thành trên hệ thống",
            message=f"Doanh nghiệp {job.get('company_name', '')} đã hoàn tất công việc '{job.get('title')}'.",
            notif_type="job_updated",
            related_id=job_id,
            target_id=job_id,
        )
        emit_socket_event("job-updated", {"job_id": job_id, "status": "completed", "is_open": False})
        return jsonify({"success": True, "status": "completed", "job_status": "completed", "is_open": False, "message": "Đã xác nhận hoàn thành ca làm và kết thúc công việc thành công!"})

    elif target_status == "closed":
        job_col.update_one({"_id": job_id}, {"$set": {"status": "closed", "job_status": "closed", "is_open": False}})
        emit_socket_event("job-updated", {"job_id": job_id, "status": "closed", "is_open": False})
        return jsonify({"success": True, "status": "closed", "job_status": "closed", "is_open": False, "message": "Đã tạm đóng tin tuyển dụng."})

    elif target_status == "open":
        job_col.update_one({"_id": job_id}, {"$set": {"status": "open", "job_status": "open", "is_open": True}})
        emit_socket_event("job-updated", {"job_id": job_id, "status": "open", "is_open": True})
        return jsonify({"success": True, "status": "open", "job_status": "open", "is_open": True, "message": "Đã mở lại tin tuyển dụng."})

    # Fallback legacy 2-way toggle
    new_status = not job.get("is_open", True)
    status_label = "open" if new_status else "closed"
    job_col.update_one({"_id": job_id}, {"$set": {"is_open": new_status, "status": status_label, "job_status": status_label}})
    emit_socket_event("job-updated", {"job_id": job_id, "status": status_label, "is_open": new_status})
    msg = "Đã mở lại tin tuyển dụng." if new_status else "Đã đóng nhận hồ sơ tin tuyển dụng."
    return jsonify({"success": True, "is_open": new_status, "status": status_label, "job_status": status_label, "message": msg})

# 3. Applicant Tracking System - ATS (FR 2.5)
@employer_bp.route("/applicants", methods=["GET"])
@role_required("employer")
def list_applicants():
    user = request.current_user
    emp = get_employer_record(user["_id"])
    job_id = request.args.get("job_id")
    status = request.args.get("status")

    app_col = db_manager.get_collection("applications")
    job_col = db_manager.get_collection("jobs")
    msg_col = db_manager.get_collection("messages")
    query = {
        "$or": [
            {"employer_id": emp["_id"]},
            {"employer_id": user["_id"]}
        ],
        "is_deleted_by_employer": {"$ne": True}
    }
    if job_id:
        query["job_id"] = job_id
    
    # Lọc theo trạng thái hồ sơ (Hỗ trợ trả về cả đơn rút/hủy cho Cột 4 của Doanh nghiệp)
    if status and status not in ["all", ""]:
        if status in ["withdrawn", "cancelled"]:
            query["application_status"] = {"$in": ["withdrawn", "cancelled"]}
        else:
            query["application_status"] = status

    applicants = list(app_col.find(query).sort("applied_at", -1))

    # Làm giàu thông tin ca làm, địa điểm từ Jobs, lịch rảnh từ StudentProfiles và trạng thái phản hồi tin nhắn từ Messages
    stu_col = db_manager.get_collection("student_profiles")
    jobs_map = {j.get("_id"): j for j in job_col.find({"employer_id": emp["_id"]})}
    for a in applicants:
        parent_job = jobs_map.get(a.get("job_id")) or (job_col.find_one({"_id": a.get("job_id")}) if a.get("job_id") else None)
        if parent_job:
            a.setdefault("work_time", parent_job.get("work_time") or "Ca linh hoạt")
            a.setdefault("work_shifts", parent_job.get("work_shifts") or [])
            a.setdefault("location", parent_job.get("location") or parent_job.get("address") or "")
            a.setdefault("branch_name", parent_job.get("branch_name") or parent_job.get("location") or "")
            a.setdefault("salary_min", parent_job.get("salary_min"))
            a.setdefault("salary_max", parent_job.get("salary_max"))
            a["job_status"] = parent_job.get("job_status") or parent_job.get("status") or ("open" if parent_job.get("is_open", True) else "closed")

        stu_uid = resolve_student_user_id(a.get("student_user_id") or a.get("student_id"))
        stu_prof = stu_col.find_one({"$or": [{"_id": a.get("student_id")}, {"user_id": stu_uid}]})
        if stu_prof and stu_prof.get("free_schedule"):
            a.setdefault("free_schedule", stu_prof.get("free_schedule"))
            a["student_free_schedule"] = stu_prof.get("free_schedule")
        room_id = canonicalize_room_id(f"room_emp_{emp['_id']}_stu_{stu_uid}")
        lm = get_latest_room_message(room_id)
        if lm:
            a["last_sender_role"] = lm.get("sender_role")
            a["last_message"] = lm.get("clean_content") or lm.get("content", "")
            a["last_message_at"] = lm.get("created_at", "")
            a["unreplied"] = lm.get("sender_role") == "student"
        else:
            a["last_sender_role"] = None
            a["last_message_at"] = a.get("applied_at", "")
            a["unreplied"] = a.get("application_status") == "pending"

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
    app = app_col.find_one({"_id": app_id, "$or": [{"employer_id": emp["_id"]}, {"employer_id": user["_id"]}]})
    if not app:
        return jsonify({"success": False, "message": "Không tìm thấy hồ sơ ứng viên."}), 404

    current_status = app.get("application_status")
    if current_status == new_status:
        return jsonify({"success": True, "message": f"Hồ sơ đã ở trạng thái {'trúng tuyển' if new_status == 'accepted' else new_status}."})

    history_item = {
        "status": new_status,
        "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "note": note or ("Doanh nghiệp phê duyệt trúng tuyển" if new_status == "accepted" else ("Hồ sơ chưa phù hợp" if new_status == "rejected" else f"Doanh nghiệp chuyển trạng thái sang {new_status}"))
    }

    app_col.update_one(
        {"_id": app_id},
        {
            "$set": {"application_status": new_status, "reject_reason": note if new_status == "rejected" else ""},
            "$push": {"status_history": history_item}
        }
    )

    # Đẩy thông báo cho sinh viên & SocketIO tức thì (không dùng broadcast=True sai cú pháp)
    status_text_map = {
        "reviewed": "đã xem hồ sơ của bạn",
        "interview": "mời bạn tham gia phỏng vấn",
        "accepted": "chấp thuận tuyển dụng bạn",
        "rejected": "đã từ chối hồ sơ ứng tuyển"
    }
    target_student_id = resolve_student_user_id(app.get("student_user_id") or app.get("student_id"))

    create_and_emit_notification(
        user_id=target_student_id,
        title="Cập nhật trạng thái ứng tuyển",
        message=f"Doanh nghiệp {app.get('company_name', 'Doanh nghiệp')} {status_text_map.get(new_status, 'đã cập nhật hồ sơ')} cho công việc '{app.get('job_title')}'.",
        notif_type="application_status",
        related_id=app_id,
    )
    emit_socket_event("application-status-updated", {
        "application_id": app_id,
        "status": new_status,
        "student_user_id": target_student_id
    })

    return jsonify({"success": True, "message": f"Đã cập nhật trạng thái ứng viên sang: {new_status}"})

@employer_bp.route("/applicants/<app_id>", methods=["DELETE"])
@role_required("employer")
def delete_employer_applicant(app_id):
    user = request.current_user
    emp = get_employer_record(user["_id"])
    app_col = db_manager.get_collection("applications")
    app = app_col.find_one({"_id": app_id, "$or": [{"employer_id": emp["_id"]}, {"employer_id": user["_id"]}]})
    if not app:
        return jsonify({"success": False, "message": "Không tìm thấy hồ sơ ứng viên cần xóa."}), 404

    app_col.delete_one({"_id": app_id})
    db_manager.get_collection("reviews").delete_many({"application_id": app_id})
    return jsonify({"success": True, "message": "Đã xóa hồ sơ ứng viên thành công!"})

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
        "reviewer_name": emp.get("company_name") or user.get("company_name") or "Nhà tuyển dụng",
        "target_id": app.get("student_user_id") or app.get("student_id"),
        "target_name": app.get("student_name") or "Sinh viên ứng viên",
        "job_title": app.get("job_title", "Ca làm việc"),
        "rating": rating,
        "comment": comment,
        "direction": "employer_to_student",
        "reviewer_role": "employer",
        "target_role": "student",
        "type": "employer_review",
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

    # Gửi thông báo cho sinh viên kèm SocketIO tức thì
    student_uid = resolve_student_user_id(app.get("student_user_id") or app.get("student_id"))
    if student_uid:
        create_and_emit_notification(
            user_id=student_uid,
            title="Đánh giá năng lực mới",
            message=f"Doanh nghiệp đã gửi đánh giá năng lực ({rating}/5 sao) cho công việc '{app.get('job_title', 'bán thời gian')}'.",
            notif_type="review",
            related_id=application_id,
        )
    emit_socket_event("new-review", new_rev)

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

    emp = get_employer_record(user["_id"])
    rev_col = db_manager.get_collection("reviews")
    rev = rev_col.find_one({"_id": rev_id, "$or": [{"reviewer_id": user["_id"]}, {"reviewer_id": emp["_id"]}]})
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
    return jsonify({"success": True, "message": "Đã cập nhật đánh giá sinh viên thành công!"})

@employer_bp.route("/reviews/<rev_id>", methods=["DELETE"])
@role_required("employer")
def delete_employer_review(rev_id):
    user = request.current_user
    emp = get_employer_record(user["_id"])
    rev_col = db_manager.get_collection("reviews")
    rev = rev_col.find_one({"_id": rev_id, "$or": [{"reviewer_id": user["_id"]}, {"reviewer_id": emp["_id"]}]})
    if not rev:
        return jsonify({"success": False, "message": "Không tìm thấy đánh giá cần xóa."}), 404

    rev_col.delete_one({"_id": rev_id})
    return jsonify({"success": True, "message": "Đã xóa đánh giá năng lực sinh viên thành công!"})

# 5. Delete Job
@employer_bp.route("/jobs/<job_id>", methods=["DELETE"])
@role_required("employer")
def delete_employer_job(job_id):
    user = request.current_user
    emp = get_employer_record(user["_id"])
    job_col = db_manager.get_collection("jobs")
    job = job_col.find_one({"_id": job_id, "$or": [{"employer_id": emp["_id"]}, {"employer_id": user["_id"]}]})
    if not job:
        return jsonify({"success": False, "message": "Không tìm thấy tin tuyển dụng."}), 404

    app_col = db_manager.get_collection("applications")
    is_completed_job = job.get("job_status") == "completed" or job.get("status") == "completed"
    active_app_count = app_col.count_documents({
        "job_id": job_id,
        "application_status": {"$in": ["pending", "reviewed", "received", "interview", "accepted"]},
        "is_cancelled": {"$ne": True},
    })
    if not is_completed_job and active_app_count > 0:
        return jsonify({
            "success": False,
            "message": f"Không thể xóa tin đang có {active_app_count} hồ sơ ứng tuyển đang xử lý. Vui lòng tạm đóng tin hoặc hoàn thành ca làm trước khi xóa!"
        }), 400

    db_manager.get_collection("bookmarks").delete_many({"job_id": job_id})
    app_col.delete_many({"job_id": job_id})
    db_manager.get_collection("reports").delete_many({"target_id": job_id})
    job_col.delete_one({"_id": job_id})
    emit_socket_event("job-updated", {"job_id": job_id, "deleted": True})
    return jsonify({"success": True, "message": "Đã xóa tin tuyển dụng thành công!"})

# 6. Notifications (FR 2.8)
@employer_bp.route("/notifications", methods=["GET"])
@role_required("employer")
def list_employer_notifications():
    user = request.current_user
    emp = get_employer_record(user["_id"])
    notif_col = db_manager.get_collection("notifications")
    notifs = list(notif_col.find({
        "$or": [
            {"user_id": user["_id"]},
            {"user_id": emp["_id"]}
        ],
        "is_deleted": {"$ne": True}
    }).sort("created_at", -1))
    return jsonify({"success": True, "data": notifs})

@employer_bp.route("/notifications/<notif_id>/read", methods=["PUT"])
@role_required("employer")
def mark_employer_read(notif_id):
    user = request.current_user
    emp = get_employer_record(user["_id"])
    notif_col = db_manager.get_collection("notifications")
    notif_col.update_one(
        {"_id": notif_id, "$or": [{"user_id": user["_id"]}, {"user_id": emp["_id"]}]},
        {"$set": {"is_read": True}}
    )
    return jsonify({"success": True, "message": "Đã đọc thông báo."})

@employer_bp.route("/notifications/read-all", methods=["PUT"])
@role_required("employer")
def mark_all_employer_read():
    user = request.current_user
    emp = get_employer_record(user["_id"])
    notif_col = db_manager.get_collection("notifications")
    notif_col.update_many(
        {
            "$or": [{"user_id": user["_id"]}, {"user_id": emp["_id"]}],
            "is_deleted": {"$ne": True},
            "is_read": {"$ne": True}
        },
        {"$set": {"is_read": True}}
    )
    return jsonify({"success": True, "message": "Đã đánh dấu tất cả thông báo đã đọc."})

@employer_bp.route("/notifications/<notif_id>", methods=["DELETE"])
@role_required("employer")
def delete_employer_notification(notif_id):
    user = request.current_user
    emp = get_employer_record(user["_id"])
    notif_col = db_manager.get_collection("notifications")
    notif_col.update_one(
        {"_id": notif_id, "$or": [{"user_id": user["_id"]}, {"user_id": emp["_id"]}]},
        {"$set": {"is_deleted": True}}
    )
    return jsonify({"success": True, "message": "Đã xóa thông báo."})


