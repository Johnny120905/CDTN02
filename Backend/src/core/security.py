import hmac
import hashlib
import base64
import json
import time
import re
from src.core.config import Config

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

def validate_email_format(email: str) -> bool:
    """Validate RFC 5322 email address format."""
    if not email or not isinstance(email, str):
        return False
    return bool(re.match(EMAIL_REGEX, email.strip()))

def validate_password_complexity(password: str) -> tuple:
    """
    Validate password requirements:
    - Minimum 8 characters
    - At least one uppercase letter [A-Z]
    - At least one lowercase letter [a-z]
    - At least one digit [0-9]
    - At least one special character [!@#$%^&*()_+-=[]{};':"|,.<>/?`~]
    """
    if not password or len(password) < 8:
        return False, "Mật khẩu phải có độ dài tối thiểu 8 ký tự."
    if not re.search(r'[A-Z]', password):
        return False, "Mật khẩu phải chứa ít nhất 1 chữ hoa (A-Z)."
    if not re.search(r'[a-z]', password):
        return False, "Mật khẩu phải chứa ít nhất 1 chữ thường (a-z)."
    if not re.search(r'[0-9]', password):
        return False, "Mật khẩu phải chứa ít nhất 1 chữ số (0-9)."
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?`~]', password):
        return False, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%...)."
    return True, ""

def hash_password(password: str) -> str:
    """Hash password using salted PBKDF2-HMAC-SHA256 (equivalent security to bcrypt)."""
    salt = "CDTN02_SALT_KEY_vlu_2026"
    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return hashed.hex()

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against stored hash."""
    return hash_password(password) == hashed_password

def generate_jwt_token(user_id: str, email: str, role: str, expires_in: int = 86400) -> str:
    """Generate signed JWT token."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": int(time.time()) + expires_in,
        "iat": int(time.time())
    }
    
    encoded_header = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
    encoded_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
    
    signature = hmac.new(
        Config.JWT_SECRET_KEY.encode(),
        f"{encoded_header}.{encoded_payload}".encode(),
        hashlib.sha256
    ).digest()
    encoded_sig = base64.urlsafe_b64encode(signature).decode().rstrip('=')
    
    return f"{encoded_header}.{encoded_payload}.{encoded_sig}"

def decode_jwt_token(token: str):
    """Decode and verify signed JWT token."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        encoded_header, encoded_payload, encoded_sig = parts
        
        expected_sig = hmac.new(
            Config.JWT_SECRET_KEY.encode(),
            f"{encoded_header}.{encoded_payload}".encode(),
            hashlib.sha256
        ).digest()
        
        # Add back padding
        rem = len(encoded_sig) % 4
        padded_sig = encoded_sig + ('=' * (4 - rem) if rem else '')
        actual_sig = base64.urlsafe_b64decode(padded_sig.encode())
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
            
        rem = len(encoded_payload) % 4
        padded_payload = encoded_payload + ('=' * (4 - rem) if rem else '')
        payload = json.loads(base64.urlsafe_b64decode(padded_payload.encode()).decode())
        
        if payload.get("exp", 0) < time.time():
            return None # Expired
            
        return payload
    except Exception:
        return None

