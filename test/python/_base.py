# -*- coding: utf-8 -*-
"""
Nền chung cho bộ kiểm thử Python thật của PARTIME.VN (Unit + Integration API).

AN TOÀN DỮ LIỆU:
- Ép MONGO_URI trỏ tới địa chỉ không tồn tại để TUYỆT ĐỐI không kết nối MongoDB Atlas thật.
- Backend tự chuyển sang kho dữ liệu trong RAM (MemoryCollection) khi chạy dưới unittest,
  tự tạo 3 tài khoản mẫu (SV / NTD / QTV) và KHÔNG ghi ra local_db_store.json.
- Không gửi email thật: hàm gửi OTP được giả lập (mock) trong từng test cần dùng.
=> Chạy bao nhiêu lần cũng không ảnh hưởng web deploy Render hay dữ liệu nhóm.
"""
import os
import sys
import tempfile
import unittest  # phải import trước Backend để database.py nhận ra chế độ kiểm thử
import uuid

# 1. Chặn kết nối Atlas thật TRƯỚC khi import Backend
os.environ["MONGO_URI"] = "mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=300&connectTimeoutMS=300"
os.environ["PARTIME_LOCAL_DB_PATH"] = os.path.join(tempfile.gettempdir(), "partime_pytest_unused.json")
os.environ.setdefault("BREVO_API_KEY", "")

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(HERE, "..", "..", "Backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from server import create_app  # noqa: E402
from src.core.database import db_manager  # noqa: E402

assert not db_manager.is_atlas, "Bộ test đang trỏ vào MongoDB Atlas thật - dừng lại để bảo vệ dữ liệu!"

APP = create_app()
APP.config["TESTING"] = True

# Tài khoản mẫu do Backend tự seed trong RAM (database.seed_initial_data)
STUDENT = ("vuthelong1009@gmail.com", "Long123!")
EMPLOYER = ("huynhnguyenbaongoc2k5@gmail.com", "Huynh120905!")
ADMIN = ("lethithuyngan985@gmail.com", "Le090805!")


class ApiTestCase(unittest.TestCase):
    """Lớp cha: cấp Flask test client + hàm tiện ích đăng nhập / gọi API."""

    @classmethod
    def setUpClass(cls):
        cls.client = APP.test_client()

    # ---------- tiện ích ----------
    def login(self, account, role):
        email, pw = account
        r = self.client.post("/api/auth/login", json={"email": email, "password": pw, "role": role})
        self.assertEqual(r.status_code, 200, f"Đăng nhập {role} thất bại: {r.get_json()}")
        return r.get_json()["token"]

    def h(self, token):
        return {"Authorization": f"Bearer {token}"}

    def api(self, method, url, token=None, **kw):
        headers = kw.pop("headers", {})
        if token:
            headers.update(self.h(token))
        return getattr(self.client, method)(url, headers=headers, **kw)

    def new_user(self, role="student", approved=True):
        """Tạo nhanh 1 tài khoản phụ (clone) ngay trong RAM, không qua OTP, để test thao tác phá hủy."""
        from src.core.security import hash_password
        uid = f"user_t_{uuid.uuid4().hex[:8]}"
        email = f"autotest_{uuid.uuid4().hex[:6]}@gmail.com"
        pw = "AutoTest@2026"
        db_manager.get_collection("users").insert_one({
            "_id": uid, "email": email, "password_hash": hash_password(pw), "role": role,
            "status": "active", "is_banned": False, "ban_reason": "",
        })
        if role == "student":
            db_manager.get_collection("student_profiles").insert_one({
                "_id": f"stu_{uid}", "user_id": uid, "full_name": "Sinh viên AutoTest",
                "phone": "0912345678", "university": "ĐH Văn Lang", "address": "Quận 1, TP.HCM",
            })
        if role == "employer":
            emp_id = f"emp_{uid}"
            db_manager.get_collection("employers").insert_one({
                "_id": emp_id, "user_id": uid,
                "approval_status": "approved" if approved else "pending", "reject_reason": "",
            })
            db_manager.get_collection("company_profiles").insert_one({
                "_id": f"comp_{uid}", "employer_id": emp_id, "company_name": "Công ty AutoTest",
                "business_license": "0312345678",
            })
        return uid, (email, pw)

    def create_job(self, emp_token, **over):
        body = {"title": "[AutoTest] Phục vụ ca sáng", "category_id": "cat_6", "location": "Quận 1, TP.HCM",
                "description": "Phục vụ khách tại quầy.", "salary_min": 25000, "salary_max": 30000,
                "work_time": "Ca sáng (07:00–12:00)"}
        body.update(over)
        r = self.api("post", "/api/employer/jobs", emp_token, json=body)
        return r

    def apply(self, stu_token, job_id, with_cv=True):
        # [Sửa 21/11/2026 - Ngân] FR-SV-06.01: phải có CV trong kho mới được nộp đơn -> tải 1 CV PDF mẫu trước khi nộp.
        # with_cv=False dùng cho test kiểm tra trường hợp chưa có CV (TC-SV-044).
        if with_cv:
            import base64
            pdf = base64.b64encode(b"%PDF-1.4\n%AutoTest CV\n%%EOF").decode()
            self.api("post", "/api/student/resumes", stu_token, json={
                "file_name": "CV_AutoTest.pdf", "file_url": "data:application/pdf;base64," + pdf,
                "file_size": 40, "is_default": True})
        return self.api("post", "/api/student/applications", stu_token, json={"job_id": job_id})
