import logging
import time
from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room
from ..core.database import db_manager

logger = logging.getLogger("socketio")

# Theo dõi các bên trong từng cuộc gọi: room_id -> {caller_sid, answerer_sid, target_user_id}
CALL_PARTIES = {}

# Khởi tạo SocketIO với async_mode="threading" để tương thích tối đa với Werkzeug / Flask trên Windows
socketio = SocketIO(cors_allowed_origins="*", async_mode="threading", logger=False, engineio_logger=False)

def parse_room_id_parts(room_id):
    """Tách emp_part, stu_part và app_part (nếu có) từ room_emp_<emp>_stu_<stu>[_app_<app_id>]."""
    if not room_id or not isinstance(room_id, str):
        return None, None, ""
    if not room_id.startswith("room_emp_") or "_stu_" not in room_id:
        return None, None, ""
    parts = room_id.split("_stu_", 1)
    emp_part = parts[0].replace("room_emp_", "", 1)
    rest = parts[1]
    if "_app_" in rest:
        stu_part, app_part = rest.split("_app_", 1)
    else:
        stu_part, app_part = rest, ""
    return emp_part, stu_part, app_part


def canonicalize_room_id(room_id):
    """
    Chuẩn hóa room_id để 2 bên WebRTC (Sinh viên và Nhà tuyển dụng) luôn gặp nhau:
    Format chuẩn: room_emp_<emp_id>_stu_<stu_user_id>_app_<app_id> (hoặc không có _app_ với phòng cũ)
    Nếu emp_id bị truyền là user_employer_xxx -> tự động map về emp_xxx tương ứng.
    Nếu stu_id bị truyền là stu_xxx (profile id) -> tự động map về user_student_xxx.
    """
    emp_part, stu_part, app_part = parse_room_id_parts(room_id)
    if not emp_part or not stu_part:
        return room_id

    try:
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

        base = f"room_emp_{emp_part}_stu_{stu_part}"
        return f"{base}_app_{app_part}" if app_part else base
    except Exception:
        return room_id


_ROOM_VARIANTS_CACHE = {}
_ROOM_VARIANTS_TS = 0.0

def get_room_id_variants(room_id):
    """
    Trả về danh sách các room_id tương đương giữa 2 định dạng (user_id và profile_id)
    để đảm bảo cả Sinh viên và Nhà tuyển dụng luôn thấy đầy đủ tin nhắn dù được gửi từ id nào.
    """
    global _ROOM_VARIANTS_TS
    if not room_id or not isinstance(room_id, str):
        return [room_id] if room_id else []

    now = time.monotonic()
    if now - _ROOM_VARIANTS_TS > 60.0:
        _ROOM_VARIANTS_CACHE.clear()
        _ROOM_VARIANTS_TS = now
    cached = _ROOM_VARIANTS_CACHE.get(room_id)
    if cached is not None:
        return cached

    canonical = canonicalize_room_id(room_id)
    variants = {room_id, canonical}
    target = canonical if "_stu_" in canonical else room_id
    if not target.startswith("room_emp_") or "_stu_" not in target:
        res = list(variants)
        _ROOM_VARIANTS_CACHE[room_id] = res
        return res

    try:
        emp_part, stu_part, app_part = parse_room_id_parts(target)
        if not emp_part or not stu_part:
            res = list(variants)
            _ROOM_VARIANTS_CACHE[room_id] = res
            return res

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

        app_suffix = f"_app_{app_part}" if app_part else ""
        for eid in emp_ids:
            for sid in stu_ids:
                if eid and sid:
                    variants.add(f"room_emp_{eid}_stu_{sid}{app_suffix}")
    except Exception:
        pass

    res = list(variants)
    _ROOM_VARIANTS_CACHE[room_id] = res
    return res


def chat_msg_sort_key(msg):
    """Chuẩn hóa khóa sắp xếp thời gian tin nhắn (hỗ trợ cả 'HH:MM' và 'YYYY-MM-DD HH:MM:SS')."""
    if not msg:
        return ""
    full_ts = str(msg.get("created_at_full") or msg.get("timestamp") or "")
    if len(full_ts) >= 19:
        return full_ts
    ts = str(msg.get("created_at", ""))
    if len(ts) <= 5 and ":" in ts:
        date_str = str(msg.get("date") or time.strftime("%Y-%m-%d"))
        return f"{date_str} {ts}:00"
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
        aliases = data.get("aliases") or []
        if isinstance(aliases, list):
            for aid in aliases:
                if aid:
                    join_room(f"user_{aid}")
        if user_id:
            uid_str = str(user_id)
            join_room(f"user_{uid_str}")
            try:
                if uid_str.startswith("user_"):
                    emp = db_manager.get_collection("employers").find_one({"user_id": uid_str})
                    if emp and emp.get("_id"):
                        join_room(f"user_{emp['_id']}")
                    stu = db_manager.get_collection("student_profiles").find_one({"user_id": uid_str})
                    if stu and stu.get("_id"):
                        join_room(f"user_{stu['_id']}")
                elif uid_str.startswith("emp_"):
                    emp = db_manager.get_collection("employers").find_one({"_id": uid_str})
                    if emp and emp.get("user_id"):
                        join_room(f"user_{emp['user_id']}")
                elif uid_str.startswith("stu_"):
                    stu = db_manager.get_collection("student_profiles").find_one({"_id": uid_str})
                    if stu and stu.get("user_id"):
                        join_room(f"user_{stu['user_id']}")
            except Exception:
                pass
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

    # --- Tín hiệu WebRTC: CHỈ gửi đích danh trong phòng cuộc gọi / người nhận, tuyệt đối không broadcast cho mọi client ---
    def _emit_call_signal(event, data, canonical_room, raw_room, extra_targets=()):
        sent = set()
        for target in [canonical_room, raw_room, *extra_targets]:
            if target and target not in sent:
                sent.add(target)
                emit(event, data, room=target, include_self=False)

    # 1. Tín hiệu Bắt đầu gọi (WebRTC Offer)
    @socketio.on("call-user")
    def handle_call_user(data):
        raw_room = data.get("room_id")
        if not raw_room:
            return
        canonical_room = canonicalize_room_id(raw_room)
        data["room_id"] = canonical_room
        target_user_id = data.get("target_user_id")
        CALL_PARTIES[canonical_room] = {"caller_sid": request.sid, "target_user_id": target_user_id}
        join_room(canonical_room)
        extra = [f"user_{target_user_id}"] if target_user_id else []
        _emit_call_signal("incoming-call", data, canonical_room, raw_room if raw_room != canonical_room else None, extra)

    # 2. Tín hiệu Chấp nhận cuộc gọi (WebRTC Answer)
    @socketio.on("make-answer")
    def handle_make_answer(data):
        raw_room = data.get("room_id")
        if not raw_room:
            return
        canonical_room = canonicalize_room_id(raw_room)
        data["room_id"] = canonical_room
        join_room(canonical_room)
        party = CALL_PARTIES.get(canonical_room) or {}
        party["answerer_sid"] = request.sid
        CALL_PARTIES[canonical_room] = party
        caller_sid = party.get("caller_sid")
        if caller_sid and caller_sid != request.sid:
            emit("answer-made", data, room=caller_sid)
        else:
            _emit_call_signal("answer-made", data, canonical_room, raw_room if raw_room != canonical_room else None)

    # 3. Tín hiệu ICE Candidate (Địa chỉ mạng P2P)
    @socketio.on("send-candidate")
    def handle_send_candidate(data):
        raw_room = data.get("room_id")
        if not raw_room:
            return
        canonical_room = canonicalize_room_id(raw_room)
        data["room_id"] = canonical_room
        party = CALL_PARTIES.get(canonical_room) or {}
        extra = []
        if party.get("caller_sid") == request.sid:
            if party.get("answerer_sid"):
                extra.append(party["answerer_sid"])
            if party.get("target_user_id"):
                extra.append(f"user_{party['target_user_id']}")
        elif party.get("caller_sid"):
            extra.append(party["caller_sid"])
        _emit_call_signal("receive-candidate", data, canonical_room, raw_room if raw_room != canonical_room else None, extra)

    # 4. Tín hiệu Từ chối cuộc gọi
    @socketio.on("reject-call")
    def handle_reject_call(data):
        raw_room = data.get("room_id")
        if not raw_room:
            return
        canonical_room = canonicalize_room_id(raw_room)
        data["room_id"] = canonical_room
        party = CALL_PARTIES.pop(canonical_room, None) or {}
        extra = [party["caller_sid"]] if party.get("caller_sid") else []
        _emit_call_signal("call-rejected", data, canonical_room, raw_room if raw_room != canonical_room else None, extra)

    # 5. Tín hiệu Kết thúc cuộc gọi / Gác máy
    @socketio.on("end-call")
    def handle_end_call(data):
        raw_room = data.get("room_id")
        if not raw_room:
            return
        canonical_room = canonicalize_room_id(raw_room)
        data["room_id"] = canonical_room
        party = CALL_PARTIES.pop(canonical_room, None) or {}
        extra = [s for s in (party.get("caller_sid"), party.get("answerer_sid")) if s]
        if party.get("target_user_id"):
            extra.append(f"user_{party['target_user_id']}")
        _emit_call_signal("call-ended", data, canonical_room, raw_room if raw_room != canonical_room else None, extra)
