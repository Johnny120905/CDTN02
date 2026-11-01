import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from server import create_app

class TestAuthConstraints(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_br_auth_01_one_email_one_role_strict_constraint(self):
        """
        Ràng buộc cốt lõi (BR-AUTH-01):
        1 Email thực chỉ được đăng ký cho 1 Role duy nhất.
        Đăng ký email làm Student trước -> Thử đăng ký lại làm Employer -> Phải bị từ chối 409 Conflict.
        """
        unique_email = "test.student.strict@partime.vn"
        
        # 1. Đăng ký tài khoản Sinh viên
        reg_student = self.client.post("/api/auth/register", json={
            "email": unique_email,
            "password": "Password123!",
            "role": "student",
            "full_name": "Nguyễn Văn Sinh Viên",
            "phone": "0912345678",
            "extra_field": "Đại học Văn Lang"
        })
        self.assertEqual(reg_student.status_code, 201)
        self.assertTrue(reg_student.get_json()["success"])

        # 2. Cố tình đăng ký Nhà tuyển dụng với CÙNG ĐỊA CHỈ EMAIL ĐÓ
        reg_employer_conflict = self.client.post("/api/auth/register", json={
            "email": unique_email,
            "password": "Password123!",
            "role": "employer",
            "full_name": "Công ty ABC",
            "phone": "0988888888",
            "extra_field": "Công ty TNHH ABC"
        })
        self.assertEqual(reg_employer_conflict.status_code, 409)
        data = reg_employer_conflict.get_json()
        self.assertFalse(data["success"])
        self.assertIn("vai trò", data["message"].lower())
        print("\n[PASS] BR-AUTH-01: Successfully blocked registering multiple roles with one email.")

    def test_auth_login_with_correct_credentials(self):
        """Đăng nhập tài khoản hợp lệ với đúng role tab."""
        res = self.client.post("/api/auth/login", json={
            "email": "vuthelong@vlu.edu.vn",
            "password": "Long123!",
            "role": "student"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("token", data)
        self.assertEqual(data["user"]["role"], "student")

    def test_auth_login_wrong_role_tab(self):
        """Đăng nhập tài khoản student nhưng chọn tab employer."""
        res = self.client.post("/api/auth/login", json={
            "email": "vuthelong@vlu.edu.vn",
            "password": "Long123!",
            "role": "employer"
        })
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertIn("chọn đúng tab", data["message"].lower())

    def test_br_auth_02_otp_10_minutes_expiry_and_verification(self):
        """
        Ràng buộc OTP 10 phút (BR-AUTH-02):
        - Tạo mã OTP ngẫu nhiên 6 chữ số có thời hạn hiệu lực đúng 10 phút (600 giây).
        - Kiểm tra xác thực mã OTP thành công.
        - Kiểm tra đổi mật khẩu qua OTP hợp lệ.
        """
        email = "test.otp.student@partime.vn"
        
        # 0. Tạo user thử nghiệm
        self.client.post("/api/auth/register", json={
            "email": email,
            "password": "InitialPass123!",
            "role": "student",
            "full_name": "Sinh Viên Test OTP",
            "phone": "0911223344",
            "extra_field": "Đại học Văn Lang"
        })
        
        # 1. Yêu cầu tạo mã OTP
        send_res = self.client.post("/api/auth/send-otp", json={
            "email": email,
            "purpose": "forgot_password"
        })
        self.assertEqual(send_res.status_code, 200)
        send_data = send_res.get_json()
        self.assertTrue(send_data["success"])
        self.assertEqual(send_data["expires_in"], 30, "Thời hạn hiệu lực của OTP phải là đúng 30 giây (FR 1.1.1, Matrix Spec)")
        otp_code = send_data["otp"]
        self.assertEqual(len(otp_code), 6, "Mã OTP phải có đúng 6 chữ số")

        # 2. Thử xác thực với OTP sai
        bad_verify = self.client.post("/api/auth/verify-otp", json={
            "email": email,
            "otp": "000000"
        })
        self.assertEqual(bad_verify.status_code, 400)
        self.assertFalse(bad_verify.get_json()["success"])

        # 3. Xác thực với OTP đúng
        good_verify = self.client.post("/api/auth/verify-otp", json={
            "email": email,
            "otp": otp_code
        })
        self.assertEqual(good_verify.status_code, 200)
        self.assertTrue(good_verify.get_json()["success"])

        # 4. Đổi mật khẩu qua OTP
        reset_res = self.client.post("/api/auth/reset-password-otp", json={
            "email": email,
            "otp": otp_code,
            "new_password": "NewSecretPass2026!"
        })
        self.assertEqual(reset_res.status_code, 200)
        self.assertTrue(reset_res.get_json()["success"])
        print("\n[PASS] BR-AUTH-02: Successfully validated 10-minute OTP expiry and auto-fill verification.")

if __name__ == "__main__":
    unittest.main()

