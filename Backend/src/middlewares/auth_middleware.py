from functools import wraps
from flask import request, jsonify
from src.core.security import decode_jwt_token
from src.core.database import db_manager

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "message": "Yêu cầu cung cấp Access Token hợp lệ (Bearer token)."}), 401
        
        parts = auth_header.split(" ", 1)
        token = parts[1].strip() if len(parts) == 2 else ""
        payload = decode_jwt_token(token)
        if not payload or not payload.get("sub"):
            return jsonify({"success": False, "message": "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại."}), 401
        
        user_col = db_manager.get_collection("users")
        user = user_col.find_one({"_id": payload["sub"]})
        if not user:
            return jsonify({"success": False, "message": "Người dùng không tồn tại trên hệ thống."}), 404
        
        if user.get("is_banned"):
            ban_reason = user.get("ban_reason", "Vi phạm điều khoản hệ thống")
            return jsonify({"success": False, "message": f"Tài khoản đã bị khóa bởi Quản trị viên. Lý do: {ban_reason}"}), 403
            
        request.current_user = user
        return f(*args, **kwargs)
    return decorated

def role_required(allowed_roles):
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]
        
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            user = getattr(request, "current_user", None)
            if not user or user.get("role") not in allowed_roles:
                return jsonify({
                    "success": False,
                    "message": f"Quyền truy cập bị từ chối. Chức năng này chỉ dành cho vai trò: {', '.join(allowed_roles)}"
                }), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

def check_email_role_constraint(email: str, target_role: str):
    """
    RÀNG BUỘC CỐT LÕI (BR-AUTH-01):
    1 Email thực chỉ được phép tồn tại với đúng 1 Role trên toàn hệ thống.
    Nếu email đã tồn tại với role khác, từ chối ngay lập tức.
    """
    users_col = db_manager.get_collection("users")
    existing_user = users_col.find_one({"email": email.strip().lower()})
    
    if existing_user:
        current_role = existing_user.get("role")
        if current_role != target_role:
            role_names = {
                "student": "Sinh viên",
                "employer": "Nhà tuyển dụng",
                "admin": "Quản trị viên"
            }
            curr_str = role_names.get(current_role, current_role)
            target_str = role_names.get(target_role, target_role)
            return False, f"Email '{email}' đã được đăng ký với vai trò '{curr_str}'. Hệ thống quy định 1 Email chỉ dùng cho 1 vai trò duy nhất, không thể đăng ký thêm vai trò '{target_str}'."
        else:
            return False, f"Email '{email}' đã tồn tại trong hệ thống. Vui lòng đăng nhập."
            
    return True, ""

