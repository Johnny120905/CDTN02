import time
import uuid
import re
import os
import base64
from flask import Blueprint, request, jsonify, send_from_directory
from src.core.database import db_manager
from src.middlewares.auth_middleware import token_required

common_bp = Blueprint("common", __name__, url_prefix="/api")

UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"))
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 0. Real File Upload API (PDF, PNG, JPG <= 10MB)
@common_bp.route("/upload", methods=["POST"])
def upload_file():
    """
    Tải lên tệp tin thực tế từ máy tính của người dùng (CV, GPKD, hình ảnh, đính kèm chat).
    Lưu trữ file vật lý trên máy chủ tại backend/uploads để người dùng khác có thể xem thực tế.
    """
    # Xử lý multipart/form-data
    if "file" in request.files:
        file = request.files["file"]
        if not file or file.filename == "":
            return jsonify({"success": False, "message": "Chưa chọn tệp tin tải lên."}), 400

        filename = file.filename
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in ["pdf", "png", "jpg", "jpeg", "csv", "xlsx"]:
            return jsonify({"success": False, "message": "Chỉ nhận tệp định dạng .pdf, .png, .jpg (dung lượng <= 10MB)!"}), 400

        # Kiểm tra kích thước <= 10MB
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        if file_size > 10 * 1024 * 1024:
            return jsonify({"success": False, "message": "Dung lượng tệp vượt quá giới hạn 10MB!"}), 400

        safe_name = f"{uuid.uuid4().hex[:8]}_{filename}"
        target_path = os.path.join(UPLOAD_FOLDER, safe_name)
        file.save(target_path)

        with open(target_path, "rb") as f:
            file_bytes = f.read()

        mime = "application/pdf" if ext == "pdf" else f"image/{ext}"
        b64_url = f"data:{mime};base64,{base64.b64encode(file_bytes).decode('utf-8')}"
        file_url = f"/uploads/{safe_name}"

        return jsonify({
            "success": True,
            "message": f"Tải lên tệp '{filename}' thành công!",
            "url": file_url,
            "file_name": filename,
            "file_size": file_size,
            "data_url": b64_url
        }), 201

    # Xử lý JSON base64
    data = request.get_json(silent=True) or {}
    base64_data = data.get("file_data") or data.get("file_url")
    filename = data.get("file_name", "document.pdf")
    if base64_data and "," in base64_data:
        try:
            header, encoded = base64_data.split(",", 1)
            file_bytes = base64.b64decode(encoded)
            file_size = len(file_bytes)
            if file_size > 10 * 1024 * 1024:
                return jsonify({"success": False, "message": "Dung lượng tệp vượt quá 10MB!"}), 400

            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "pdf"
            if ext not in ["pdf", "png", "jpg", "jpeg", "csv", "xlsx"]:
                return jsonify({"success": False, "message": "Chỉ nhận tệp định dạng .pdf, .png, .jpg!"}), 400

            safe_name = f"{uuid.uuid4().hex[:8]}_{filename}"
            target_path = os.path.join(UPLOAD_FOLDER, safe_name)
            with open(target_path, "wb") as f:
                f.write(file_bytes)

            file_url = f"/uploads/{safe_name}"
            return jsonify({
                "success": True,
                "message": f"Tải lên tệp '{filename}' thành công!",
                "url": file_url,
                "file_name": filename,
                "file_size": file_size,
                "data_url": base64_data
            }), 201
        except Exception as e:
            return jsonify({"success": False, "message": f"Lỗi giải mã tệp tin: {str(e)}"}), 400

    return jsonify({"success": False, "message": "Vui lòng chọn tệp tin để tải lên."}), 400


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
    cats = list(cat_col.find({"is_active": True}))
    return jsonify({"success": True, "data": cats})

# 3. Public Job Search (FR 1.5.1, 1.5.2)
@common_bp.route("/jobs", methods=["GET"])
def search_jobs():
    keyword = request.args.get("q", "").strip()
    category_id = request.args.get("category")
    location = request.args.get("location", "").strip()
    min_sal = request.args.get("min_salary")
    work_time = request.args.get("work_time", "").strip()

    job_col = db_manager.get_collection("jobs")
    query = {"is_open": True, "is_hidden": False}

    if category_id:
        query["category_id"] = category_id
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if work_time:
        query["work_time"] = {"$regex": work_time, "$options": "i"}
    if min_sal:
        try:
            query["salary_max"] = {"$gte": int(min_sal)}
        except ValueError:
            pass

    if keyword:
        query["$or"] = [
            {"title": {"$regex": keyword, "$options": "i"}},
            {"description": {"$regex": keyword, "$options": "i"}},
            {"company_name": {"$regex": keyword, "$options": "i"}}
        ]

    jobs = list(job_col.find(query).sort("created_at", -1))
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
def filter_content_banned_words(text: str):
    ban_col = db_manager.get_collection("banned_keywords")
    banned_list = list(ban_col.find({}))
    censored_text = text
    flagged = False
    flagged_words = []
    
    for item in banned_list:
        kw = item.get("keyword", "")
        if kw and re.search(re.escape(kw), text, re.IGNORECASE):
            censored_text = re.sub(re.escape(kw), "***", censored_text, flags=re.IGNORECASE)
            flagged = True
            flagged_words.append(kw)
            
    return censored_text, flagged, flagged_words

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
    user = request.current_user
    room_id = request.args.get("room_id", "default_room")
    msg_col = db_manager.get_collection("messages")
    messages = list(msg_col.find({"room_id": room_id}))
    
    # Sắp xếp chuẩn hóa để tin nhắn và bản ghi cuộc gọi luôn ở cuối danh sách (phía dưới) theo thứ tự thời gian
    def get_sort_key(m):
        ts = str(m.get("created_at", ""))
        if len(ts) <= 5:  # Ví dụ "17:34"
            return f"2026-11-01 {ts}:00"
        return ts
        
    messages.sort(key=get_sort_key)
    return jsonify({"success": True, "data": messages})

@common_bp.route("/chat/messages", methods=["POST"])
@token_required
def send_message():
    user = request.current_user
    data = request.get_json() or {}
    room_id = data.get("room_id", "default_room")
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
        if file_size > 10 * 1024 * 1024:
            return jsonify({"success": False, "message": "Dung lượng tệp đính kèm vượt quá 10MB!"}), 400

    # Nếu gửi base64 đính kèm, ghi file vật lý vào backend/uploads để cả 2 bên mở xem được
    if media_url and media_url.startswith("data:"):
        try:
            mime_part, raw_b64 = media_url.split(",", 1)
            ext = file_name.split(".")[-1].lower() if "." in file_name else ("pdf" if "pdf" in mime_part else "png")
            file_bytes = base64.b64decode(raw_b64)
            safe_name = f"chat_{uuid.uuid4().hex[:8]}_{file_name}"
            target_path = os.path.join(UPLOAD_FOLDER, safe_name)
            with open(target_path, "wb") as f:
                f.write(file_bytes)
            media_url = f"/uploads/{safe_name}"
        except Exception:
            pass

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
        "file_name": file_name,
        "message_status": "sent",
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    db_manager.get_collection("messages").insert_one(new_msg)
    
    # Tự động đẩy thông báo thời gian thực cho đối tác bên kia cuộc trò chuyện (FR 1.9 & 2.8)
    try:
        users_col = db_manager.get_collection("users")
        target_role = "employer" if user.get("role") == "student" else "student"
        target_user = users_col.find_one({"role": target_role})
        if target_user:
            notif_sender_name = sender_name
            db_manager.get_collection("notifications").insert_one({
                "_id": f"notif_{uuid.uuid4().hex[:8]}",
                "user_id": target_user.get("_id"),
                "type": "chat_message",
                "title": f"Tin nhắn mới từ {notif_sender_name}",
                "message": clean_content[:90] + ("..." if len(clean_content) > 90 else ""),
                "is_read": False,
                "is_deleted": False,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
            })
    except Exception as e:
        pass

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
    room_id = data.get("room_id", "default_room")
    call_type = data.get("call_type", "video") # 'video' or 'audio'
    
    caller_role = user.get("role", "student")
    target_role = "employer" if caller_role == "student" else "student"
    caller_name = get_user_display_name(user)
    
    # Nếu đối phương cũng đang đổ chuông tới mình thì lập tức kết nối thông suốt hai chiều
    existing_call = ACTIVE_CALL_SESSIONS.get(room_id)
    if existing_call and existing_call.get("status") == "ringing" and existing_call.get("caller_role") != caller_role:
        existing_call["status"] = "connected"
        existing_call["connected_at"] = time.time()
        return jsonify({"success": True, "call": existing_call, "message": "Đã tự động kết nối cuộc gọi hai chiều thành công!"}), 200

    call_id = f"call_{uuid.uuid4().hex[:8]}"
    call_session = {
        "call_id": call_id,
        "room_id": room_id,
        "caller_id": user["_id"],
        "caller_email": user["email"],
        "caller_name": caller_name,
        "caller_role": caller_role,
        "target_role": target_role,
        "call_type": call_type,
        "status": "ringing", # ringing | connected | declined | ended
        "timestamp": time.time(),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    ACTIVE_CALL_SESSIONS[room_id] = call_session

    # Đẩy thông báo chuông gọi đến
    try:
        users_col = db_manager.get_collection("users")
        target_user = users_col.find_one({"role": target_role})
        if target_user:
            db_manager.get_collection("notifications").insert_one({
                "_id": f"notif_{uuid.uuid4().hex[:8]}",
                "user_id": target_user.get("_id"),
                "type": "incoming_call",
                "title": f"Cuộc gọi {('Video' if call_type == 'video' else 'Thoại')} đến từ {caller_name}",
                "message": "Có cuộc gọi phỏng vấn trực tuyến đang đổ chuông, vui lòng nhấp vào để nghe máy!",
                "is_read": False,
                "is_deleted": False,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
            })
    except Exception:
        pass

    return jsonify({"success": True, "call": call_session}), 201

@common_bp.route("/chat/call/status", methods=["GET"])
@token_required
def get_call_status():
    user = request.current_user
    room_id = request.args.get("room_id", "default_room")
    call_session = ACTIVE_CALL_SESSIONS.get(room_id)
    
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
                    "room_id": room_id,
                    "sender_id": call_session.get("caller_id"),
                    "sender_name": call_session.get("caller_name"),
                    "sender_role": call_session.get("caller_role"),
                    "content": f"📞 Cuộc gọi nhỡ ({'Video' if call_session.get('call_type') == 'video' else 'Thoại'}) - Không trả lời sau 3 phút",
                    "type": "call_record",
                    "call_status": "missed",
                    "call_type": call_session.get("call_type"),
                    "created_at": time.strftime("%H:%M")
                })
                # Đẩy thông báo cuộc gọi nhỡ
                target_user = "user_student_long" if call_session.get("caller_role") == "employer" else "user_employer_ngoc"
                db_manager.get_collection("notifications").insert_one({
                    "_id": f"notif_{uuid.uuid4().hex[:8]}",
                    "user_id": target_user,
                    "title": "Cuộc gọi nhỡ",
                    "message": f"Bạn có 1 cuộc gọi nhỡ từ {call_session.get('caller_name')} (Không trả lời sau 3 phút).",
                    "type": "call",
                    "related_id": room_id,
                    "is_read": False,
                    "is_deleted": False,
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
                })
            except Exception as e:
                print(f"[Call Log Error] {e}")
            
    return jsonify({"success": True, "call": call_session})

@common_bp.route("/chat/call/respond", methods=["POST"])
@token_required
def respond_call():
    user = request.current_user
    data = request.get_json() or {}
    room_id = data.get("room_id", "default_room")
    action = data.get("action", "accept") # 'accept' | 'decline' | 'missed'
    
    call_session = ACTIVE_CALL_SESSIONS.get(room_id)
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
                "room_id": room_id,
                "sender_id": call_session.get("caller_id"),
                "caller_id": call_session.get("caller_id"),
                "caller_name": call_session.get("caller_name"),
                "caller_role": call_session.get("caller_role"),
                "call_type": call_session.get("call_type", "video"),
                "content": f"📞 Cuộc gọi nhỡ ({'Video' if call_session.get('call_type') == 'video' else 'Thoại'}) - Không trả lời sau 3 phút đổ chuông",
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
            db_manager.get_collection("messages").insert_one({
                "_id": f"msg_call_{uuid.uuid4().hex[:8]}",
                "room_id": room_id,
                "sender_id": call_session.get("caller_id"),
                "caller_id": call_session.get("caller_id"),
                "caller_name": call_session.get("caller_name"),
                "caller_role": call_session.get("caller_role"),
                "call_type": call_session.get("call_type", "video"),
                "content": f"📞 Cuộc gọi ({'Video' if call_session.get('call_type') == 'video' else 'Thoại'}) - Người nhận từ chối cuộc gọi",
                "type": "call_record",
                "call_status": "missed",
                "created_at": time.strftime("%H:%M")
            })
        except Exception:
            pass
        
    return jsonify({"success": True, "call": call_session})

@common_bp.route("/chat/call/end", methods=["POST"])
@token_required
def end_call():
    user = request.current_user
    data = request.get_json() or {}
    room_id = data.get("room_id", "default_room")
    
    call_session = ACTIVE_CALL_SESSIONS.get(room_id)
    if call_session:
        call_session["status"] = "ended"
        call_session["ended_at"] = time.time()
        conn_at = call_session.get("connected_at")
        duration = int(time.time() - conn_at) if conn_at else 0
        duration_str = f"{duration // 60}:{duration % 60:02d}"
        
        try:
            db_manager.get_collection("messages").insert_one({
                "_id": f"msg_call_{uuid.uuid4().hex[:8]}",
                "room_id": room_id,
                "sender_id": user["_id"],
                "caller_id": call_session.get("caller_id"),
                "caller_name": call_session.get("caller_name", "Đối tác"),
                "caller_role": call_session.get("caller_role", "student"),
                "call_type": call_session.get("call_type", "video"),
                "content": f"📞 Cuộc gọi kết thúc (Thời lượng đàm thoại: {duration_str})",
                "type": "call_record",
                "call_status": "ended",
                "duration": duration,
                "duration_str": duration_str,
                "created_at": time.strftime("%H:%M")
            })
        except Exception as e:
            print(f"[Call End Error] {e}")
        
    return jsonify({"success": True, "message": "Đã kết thúc cuộc gọi."})


# 5. Notifications
@common_bp.route("/notifications", methods=["GET"])
@token_required
def get_my_notifications():
    user = request.current_user
    notif_col = db_manager.get_collection("notifications")
    notifs = list(notif_col.find({"user_id": user["_id"], "is_deleted": False}).sort("created_at", -1))
    return jsonify({"success": True, "data": notifs})

@common_bp.route("/notifications/<notif_id>/read", methods=["PUT"])
@token_required
def mark_notification_read(notif_id):
    user = request.current_user
    notif_col = db_manager.get_collection("notifications")
    notif_col.update_one({"_id": notif_id, "user_id": user["_id"]}, {"$set": {"is_read": True}})
    return jsonify({"success": True, "message": "Đã đánh dấu đã đọc."})

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
                "message": "Theo quy tắc ràng buộc nghiêm ngặt (FR 2.5.6): Chỉ cho phép báo cáo đối với ứng viên đã có đơn ứng tuyển ở trạng thái 'Đã duyệt'!"
            }), 400

    ticket_code = f"TK-2026-{uuid.uuid4().hex[:4].upper()}"
    reporter_name = user.get("full_name") or user.get("email")

    new_report = {
        "_id": f"rep_{uuid.uuid4().hex[:8]}",
        "ticket_code": ticket_code,
        "type": report_type,
        "report_type": report_type,
        "reporter_id": user["_id"],
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

    # Đẩy thông báo phiếu khiếu nại tới Quản trị viên (FR 3.8.2)
    try:
        admin_users = list(db_manager.get_collection("users").find({"role": "admin"}))
        notif_col = db_manager.get_collection("notifications")
        for adm in admin_users:
            notif_col.insert_one({
                "_id": f"notif_{uuid.uuid4().hex[:8]}",
                "user_id": adm["_id"],
                "role": "admin",
                "type": "report_ticket",
                "title": f"Phiếu khiếu nại vi phạm mới: {ticket_code}",
                "message": f"Nhà tuyển dụng {reporter_name} vừa tạo khiếu nại về '{new_report['target_title']}'. Lý do: {reason}",
                "target_id": new_report["_id"],
                "is_read": False,
                "is_deleted": False,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
            })
    except Exception:
        pass

    return jsonify({"success": True, "message": "Đã tạo phiếu khiếu nại ở trạng thái Chờ xử lý và đẩy trực tiếp sang cho Quản trị viên giải quyết!", "data": new_report}), 201

