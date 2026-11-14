import logging
from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room
from ..core.database import db_manager

logger = logging.getLogger("socketio")

# Khởi tạo SocketIO với async_mode="threading" để tương thích tối đa với Werkzeug / Flask trên Windows
socketio = SocketIO(cors_allowed_origins="*", async_mode="threading", logger=False, engineio_logger=False)

def canonicalize_room_id(room_id):
    """
    Chuẩn hóa room_id để 2 bên WebRTC (Sinh viên và Nhà tuyển dụng) luôn gặp nhau:
    Format chuẩn: room_emp_<emp_id>_stu_<stu_user_id>
    Nếu emp_id bị truyền là user_employer_xxx -> tự động map về emp_xxx tương ứng.
    Nếu stu_id bị truyền là stu_xxx (profile id) -> tự động map về user_student_xxx.
    """
    if not room_id or not isinstance(room_id, str):
        return room_id
    if not room_id.startswith("room_emp_") or "_stu_" not in room_id:
        return room_id

    try:
        parts = room_id.split("_stu_", 1)
        emp_part = parts[0].replace("room_emp_", "")
        stu_part = parts[1]

        # 1. Chuẩn hóa emp_part
        if emp_part.startswith("user_"):
            emp = db_manager.get_collection("employers").find_one({"user_id": emp_part})
            if emp:
                emp_part = emp["_id"]

        # 2. Chuẩn hóa stu_part
        if stu_part.startswith("stu_"):
            stu = db_manager.get_collection("student_profiles").find_one({"_id": stu_part})
            if stu and stu.get("user_id"):
                stu_part = stu["user_id"]

        return f"room_emp_{emp_part}_stu_{stu_part}"
    except Exception:
        return room_id


def get_room_id_variants(room_id):
    """
    Trả về danh sách các room_id tương đương giữa 2 định dạng (user_id và profile_id)
    để đảm bảo cả Sinh viên và Nhà tuyển dụng luôn thấy đầy đủ tin nhắn dù được gửi từ id nào.
    """
    if not room_id or not isinstance(room_id, str):
        return [room_id] if room_id else []

    canonical = canonicalize_room_id(room_id)
    variants = {room_id, canonical}
    target = canonical if "_stu_" in canonical else room_id
    if not target.startswith("room_emp_") or "_stu_" not in target:
        return list(variants)

    try:
        parts = target.split("_stu_", 1)
        emp_part = parts[0].replace("room_emp_", "")
        stu_part = parts[1]

        emp_ids = {emp_part}
        emp_col = db_manager.get_collection("employers")
        emp = emp_col.find_one({"$or": [{"_id": emp_part}, {"user_id": emp_part}]})
        if emp:
            if emp.get("_id"):
                emp_ids.add(emp["_id"])
            if emp.get("user_id"):
                emp_ids.add(emp["user_id"])

        stu_ids = {stu_part}
        stu_col = db_manager.get_collection("student_profiles")
        stu = stu_col.find_one({"$or": [{"_id": stu_part}, {"user_id": stu_part}]})
        if stu:
            if stu.get("_id"):
                stu_ids.add(stu["_id"])
            if stu.get("user_id"):
                stu_ids.add(stu["user_id"])

        for eid in emp_ids:
            for sid in stu_ids:
                if eid and sid:
                    variants.add(f"room_emp_{eid}_stu_{sid}")
    except Exception:
        pass

    return list(variants)


def chat_msg_sort_key(msg):
    """Chuẩn hóa khóa sắp xếp thời gian tin nhắn (hỗ trợ cả 'HH:MM' và 'YYYY-MM-DD HH:MM:SS')."""
    ts = str((msg or {}).get("created_at", ""))
    if len(ts) <= 5:
        return f"2026-11-01 {ts}:00"
    return ts


def get_latest_room_message(room_id):
    """Lấy tin nhắn mới nhất của phòng chat trên mọi biến thể room_id."""
    variants = get_room_id_variants(room_id)
    if not variants:
        return None
    msg_col = db_manager.get_collection("messages")
    msgs = list(msg_col.find({"room_id": {"$in": variants}}))
    if not msgs:
        return None
    return max(msgs, key=chat_msg_sort_key)

def init_socketio(app):
    """Khởi tạo và cấu hình Socket.IO cho Flask app."""
    socketio.init_app(app)
    register_socket_events()
    return socketio

def register_socket_events():
    @socketio.on("connect")
    def handle_connect():
        # Client kết nối
        pass

    @socketio.on("disconnect")
    def handle_disconnect():
        # Client ngắt kết nối
        pass

    @socketio.on("register-user")
    def handle_register_user(data):
        if not isinstance(data, dict):
            return
        user_id = data.get("user_id")
        role = data.get("role")
        if user_id:
            join_room(f"user_{user_id}")
        if role:
            join_room(f"role_{role}")

    @socketio.on("join-room")
    def handle_join_room(data):
        raw_room = data.get("room_id") if isinstance(data, dict) else str(data)
        user_id = data.get("user_id") if isinstance(data, dict) else None
        role = data.get("role") if isinstance(data, dict) else None
        if user_id:
            join_room(f"user_{user_id}")
        if role:
            join_room(f"role_{role}")
        if raw_room:
            canonical_room = canonicalize_room_id(raw_room)
            join_room(canonical_room)
            if raw_room != canonical_room:
                join_room(raw_room)

            emit("user-joined", {
                "room_id": canonical_room,
                "user_id": user_id,
                "role": role
            }, room=canonical_room, include_self=False)

    @socketio.on("leave-room")
    def handle_leave_room(data):
        raw_room = data.get("room_id") if isinstance(data, dict) else str(data)
        if raw_room:
            canonical_room = canonicalize_room_id(raw_room)
            leave_room(canonical_room)
            if raw_room != canonical_room:
                leave_room(raw_room)
            emit("user-left", {
                "room_id": canonical_room,
                "user_id": data.get("user_id") if isinstance(data, dict) else None
            }, room=canonical_room, include_self=False)

    # 1. Tín hiệu Bắt đầu gọi (WebRTC Offer)
    @socketio.on("call-user")
    def handle_call_user(data):
        raw_room = data.get("room_id")
        if raw_room:
            canonical_room = canonicalize_room_id(raw_room)
            data["room_id"] = canonical_room
            emit("incoming-call", data, room=canonical_room, include_self=False)
            if raw_room != canonical_room:
                emit("incoming-call", data, room=raw_room, include_self=False)
            target_user_id = data.get("target_user_id")
            if target_user_id:
                emit("incoming-call", data, room=f"user_{target_user_id}", include_self=False)
        # Phát broadcast để đảm bảo người nhận nhận được tín hiệu bắt máy ngay tức khắc dù ở bất kỳ tab nào
        emit("incoming-call", data, broadcast=True, include_self=False)

    # 2. Tín hiệu Chấp nhận cuộc gọi (WebRTC Answer)
    @socketio.on("make-answer")
    def handle_make_answer(data):
        raw_room = data.get("room_id")
        if raw_room:
            canonical_room = canonicalize_room_id(raw_room)
            data["room_id"] = canonical_room
            emit("answer-made", data, room=canonical_room, include_self=False)
            if raw_room != canonical_room:
                emit("answer-made", data, room=raw_room, include_self=False)
        emit("answer-made", data, broadcast=True, include_self=False)

    # 3. Tín hiệu ICE Candidate (Địa chỉ mạng P2P)
    @socketio.on("send-candidate")
    def handle_send_candidate(data):
        raw_room = data.get("room_id")
        if raw_room:
            canonical_room = canonicalize_room_id(raw_room)
            data["room_id"] = canonical_room
            emit("receive-candidate", data, room=canonical_room, include_self=False)
            if raw_room != canonical_room:
                emit("receive-candidate", data, room=raw_room, include_self=False)
        emit("receive-candidate", data, broadcast=True, include_self=False)

    # 4. Tín hiệu Từ chối cuộc gọi
    @socketio.on("reject-call")
    def handle_reject_call(data):
        raw_room = data.get("room_id")
        if raw_room:
            canonical_room = canonicalize_room_id(raw_room)
            data["room_id"] = canonical_room
            emit("call-rejected", data, room=canonical_room, include_self=False)
            if raw_room != canonical_room:
                emit("call-rejected", data, room=raw_room, include_self=False)
        emit("call-rejected", data, broadcast=True, include_self=False)

    # 5. Tín hiệu Kết thúc cuộc gọi / Gác máy
    @socketio.on("end-call")
    def handle_end_call(data):
        raw_room = data.get("room_id")
        if raw_room:
            canonical_room = canonicalize_room_id(raw_room)
            data["room_id"] = canonical_room
            emit("call-ended", data, room=canonical_room, include_self=False)
            if raw_room != canonical_room:
                emit("call-ended", data, room=raw_room, include_self=False)
        emit("call-ended", data, broadcast=True, include_self=False)

