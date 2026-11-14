import logging
import time
import uuid

from .database import db_manager
from .socket_service import socketio, canonicalize_room_id

logger = logging.getLogger("notifications")


def emit_socket_event(event_name: str, payload: dict, room: str = None):
    """Safely emit a Socket.IO event without invalid kwargs like broadcast=True."""
    try:
        if getattr(socketio, "server", None) is None:
            return
        if room:
            socketio.emit(event_name, payload, to=room)
        else:
            socketio.emit(event_name, payload)
    except Exception as exc:
        logger.warning("Socket emit failed for %s: %s", event_name, exc)


def create_and_emit_notification(
    user_id: str,
    title: str,
    message: str,
    notif_type: str = "system",
    role: str = None,
    related_id: str = None,
    target_id: str = None,
    extra: dict = None,
):
    """Persist a notification document and push real-time Socket.IO 'new-notification'."""
    if not user_id and not role:
        return None

    # Tự động suy luận role nếu chưa truyền
    inferred_role = role
    uid_str = str(user_id or "")
    if not inferred_role:
        if uid_str.startswith("user_employer_") or uid_str.startswith("emp_") or uid_str == "role_employer":
            inferred_role = "employer"
        elif uid_str.startswith("user_student_") or uid_str.startswith("stu_") or uid_str == "role_student":
            inferred_role = "student"
        elif uid_str.startswith("user_admin_") or uid_str == "role_admin":
            inferred_role = "admin"

    # Tự động thu thập tất cả ID định danh (User ID, Employer ID, Student ID)
    aliases = set()
    if user_id:
        aliases.add(uid_str)
        try:
            if uid_str.startswith("user_"):
                emp = db_manager.get_collection("employers").find_one({"user_id": uid_str})
                if emp and emp.get("_id"):
                    aliases.add(str(emp["_id"]))
                stu = db_manager.get_collection("student_profiles").find_one({"user_id": uid_str})
                if stu and stu.get("_id"):
                    aliases.add(str(stu["_id"]))
            elif uid_str.startswith("emp_"):
                emp = db_manager.get_collection("employers").find_one({"_id": uid_str})
                if emp and emp.get("user_id"):
                    aliases.add(str(emp["user_id"]))
            elif uid_str.startswith("stu_"):
                stu = db_manager.get_collection("student_profiles").find_one({"_id": uid_str})
                if stu and stu.get("user_id"):
                    aliases.add(str(stu["user_id"]))
        except Exception:
            pass

    if target_id:
        aliases.add(str(target_id))
    if related_id:
        aliases.add(str(related_id))

    notif_doc = {
        "_id": f"notif_{uuid.uuid4().hex[:8]}",
        "user_id": user_id or f"role_{inferred_role}",
        "user_aliases": list(aliases),
        "type": notif_type,
        "title": title,
        "message": message,
        "is_read": False,
        "is_deleted": False,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    if inferred_role:
        notif_doc["role"] = inferred_role
    if related_id:
        notif_doc["related_id"] = related_id
    if target_id:
        notif_doc["target_id"] = target_id
    if extra and isinstance(extra, dict):
        notif_doc.update(extra)

    try:
        db_manager.get_collection("notifications").insert_one(notif_doc)
    except Exception as exc:
        logger.warning("Notification DB insert failed: %s", exc)

    # 1. Phát tán sự kiện broadcast toàn hệ thống (< 500ms)
    emit_socket_event("new-notification", notif_doc)

    # 2. Phát tán trực tiếp vào room riêng của từng ID người nhận
    for aid in aliases:
        if aid and not aid.startswith("role_"):
            emit_socket_event("new-notification", notif_doc, room=f"user_{aid}")

    # 3. Phát tán vào room theo vai trò
    if inferred_role:
        emit_socket_event("new-notification", notif_doc, room=f"role_{inferred_role}")

    return notif_doc


def notify_admins(
    title: str,
    message: str,
    notif_type: str = "system",
    related_id: str = None,
    target_id: str = None,
    extra: dict = None,
):
    """Notify every admin account in the system (plus role_admin fallback)."""
    created = []
    try:
        admin_users = list(db_manager.get_collection("users").find({"role": "admin"}))
    except Exception:
        admin_users = []

    if admin_users:
        for adm in admin_users:
            doc = create_and_emit_notification(
                user_id=adm["_id"],
                title=title,
                message=message,
                notif_type=notif_type,
                role="admin",
                related_id=related_id,
                target_id=target_id,
                extra=extra,
            )
            if doc:
                created.append(doc)
    else:
        doc = create_and_emit_notification(
            user_id="role_admin",
            title=title,
            message=message,
            notif_type=notif_type,
            role="admin",
            related_id=related_id,
            target_id=target_id,
            extra=extra,
        )
        if doc:
            created.append(doc)
    return created


def resolve_employer_user_id(employer_id_or_user_id: str):
    if not employer_id_or_user_id:
        return None
    if str(employer_id_or_user_id).startswith("user_"):
        return employer_id_or_user_id
    emp = db_manager.get_collection("employers").find_one(
        {"$or": [{"_id": employer_id_or_user_id}, {"user_id": employer_id_or_user_id}]}
    )
    if emp and emp.get("user_id"):
        return emp["user_id"]
    return employer_id_or_user_id


def resolve_student_user_id(student_id_or_user_id: str):
    if not student_id_or_user_id:
        return None
    if str(student_id_or_user_id).startswith("user_"):
        return student_id_or_user_id
    stu = db_manager.get_collection("student_profiles").find_one(
        {"$or": [{"_id": student_id_or_user_id}, {"user_id": student_id_or_user_id}]}
    )
    if stu and stu.get("user_id"):
        return stu["user_id"]
    return student_id_or_user_id


def resolve_chat_partner_user_id(raw_room_id: str, sender_role: str):
    """Resolve the exact partner user_id from a room_emp_<emp>_stu_<stu> room."""
    room_id = canonicalize_room_id(raw_room_id)
    if not room_id or "_stu_" not in str(room_id):
        return None
    try:
        parts = str(room_id).split("_stu_", 1)
        emp_part = parts[0].replace("room_emp_", "")
        stu_part = parts[1]
        if sender_role == "student":
            return resolve_employer_user_id(emp_part)
        return resolve_student_user_id(stu_part)
    except Exception:
        return None

