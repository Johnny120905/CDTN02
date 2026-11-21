# -*- coding: utf-8 -*-
"""INTEGRATION TEST (API thật qua Flask test client, dữ liệu RAM): Xác thực, phân quyền, khóa tài khoản."""
import unittest
from unittest import mock

from _base import ApiTestCase, STUDENT, EMPLOYER, ADMIN


class AuthApiTest(ApiTestCase):

    def test_login_3_roles(self):
        """TC-SV-007 / TC-NTD-005 / TC-QTV-002: 3 vai trò đăng nhập đúng tab nhận JWT."""
        for acc, role in [(STUDENT, "student"), (EMPLOYER, "employer"), (ADMIN, "admin")]:
            r = self.client.post("/api/auth/login", json={"email": acc[0], "password": acc[1], "role": role})
            self.assertEqual(r.status_code, 200)
            body = r.get_json()
            self.assertTrue(body["token"])
            self.assertEqual(body["user"]["role"], role)

    def test_login_wrong_password_401(self):
        r = self.client.post("/api/auth/login", json={"email": STUDENT[0], "password": "Sai@12345", "role": "student"})
        self.assertEqual(r.status_code, 401)

    def test_login_wrong_role_tab_blocked(self):
        """TC-QTV-001 / BR-CH-02: tài khoản SV đăng nhập ở cổng /admin bị chặn và báo đúng vai trò."""
        r = self.client.post("/api/auth/login", json={"email": STUDENT[0], "password": STUDENT[1], "role": "admin"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("Sinh viên", r.get_json()["message"])

    def test_admin_forgot_password_blocked_403(self):
        """TC-QTV-010 / BR-CH-04: email Quản trị viên không được khôi phục mật khẩu qua OTP công khai."""
        with mock.patch("src.api.auth.auth_routes.send_otp_email_with_status", return_value=(True, "")) as m:
            r = self.client.post("/api/auth/forgot-password", json={"email": ADMIN[0], "purpose": "forgot_password"})
        self.assertEqual(r.status_code, 403)
        m.assert_not_called()

    def test_register_otp_email_already_used_409(self):
        """TC-NTD-011 / BR-CH-02: gửi OTP đăng ký bằng email đã tồn tại -> 409."""
        with mock.patch("src.api.auth.auth_routes.send_otp_email_with_status", return_value=(True, "")):
            r = self.client.post("/api/auth/send-otp", json={"email": EMPLOYER[0], "purpose": "register"})
        self.assertEqual(r.status_code, 409)

    def test_otp_expires_after_60s(self):
        """BR-CH-04: OTP quá 60 giây thì verify-otp trả 410."""
        uid, acc = self.new_user("student")
        with mock.patch("src.api.auth.auth_routes.send_otp_email_with_status", return_value=(True, "")):
            r = self.client.post("/api/auth/send-otp", json={"email": acc[0], "purpose": "forgot_password"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()["expires_in"], 60)
        from src.core.database import db_manager
        otp = db_manager.get_collection("users").find_one({"_id": uid})["otp_code"]
        import time as _t
        with mock.patch("time.time", return_value=_t.time() + 61):
            r2 = self.client.post("/api/auth/verify-otp", json={"email": acc[0], "otp": otp})
        self.assertEqual(r2.status_code, 410)
        r3 = self.client.post("/api/auth/verify-otp", json={"email": acc[0], "otp": otp})
        self.assertEqual(r3.status_code, 200)

    def test_change_password_wrong_old_blocked(self):
        """TC-SV-016 / TC-QTV-004: sai mật khẩu hiện tại hoặc mật khẩu mới yếu -> 400."""
        uid, acc = self.new_user("student")
        tok = self.login(acc, "student")
        r = self.api("put", "/api/auth/change-password", tok, json={"old_password": "Sai@12345", "new_password": "Moi@2026x"})
        self.assertEqual(r.status_code, 400)
        r = self.api("put", "/api/auth/change-password", tok, json={"old_password": acc[1], "new_password": "yeu"})
        self.assertEqual(r.status_code, 400)
        r = self.api("put", "/api/auth/change-password", tok, json={"old_password": acc[1], "new_password": "Moi@2026x"})
        self.assertEqual(r.status_code, 200)
        self.login((acc[0], "Moi@2026x"), "student")


class RbacApiTest(ApiTestCase):

    def test_no_token_401(self):
        """TC-SV-081: gọi API riêng tư không có token -> 401."""
        for url in ["/api/student/profile", "/api/employer/jobs", "/api/admin/dashboard"]:
            self.assertEqual(self.client.get(url).status_code, 401, url)

    def test_cross_role_forbidden_403(self):
        """TC-SV-081 / TC-NTD-082 / TC-QTV-063: SV/NTD gọi API vai trò khác -> 403."""
        s = self.login(STUDENT, "student")
        e = self.login(EMPLOYER, "employer")
        self.assertEqual(self.api("get", "/api/admin/dashboard", s).status_code, 403)
        self.assertEqual(self.api("get", "/api/employer/jobs", s).status_code, 403)
        self.assertEqual(self.api("get", "/api/admin/users", e).status_code, 403)
        self.assertEqual(self.api("get", "/api/student/profile", e).status_code, 403)

    def test_admin_cannot_ban_or_delete_self(self):
        """TC-QTV-063 / BR-QTV-01: Admin tự khóa / tự xóa chính mình -> 400."""
        a = self.login(ADMIN, "admin")
        me = self.api("get", "/api/auth/me", a).get_json()
        my_id = (me.get("user") or me.get("data") or me).get("_id") or (me.get("user") or {}).get("id") or "user_admin_ngan"
        self.assertEqual(self.api("put", f"/api/admin/users/{my_id}/ban", a, json={"reason": "x"}).status_code, 400)
        self.assertEqual(self.api("delete", f"/api/admin/users/{my_id}", a).status_code, 400)

    def test_ban_blocks_login_and_api_then_unban_restores(self):
        """TC-QTV-018 / TC-QTV-022 / BR-CH-06 / FR-QTV-03.03, 03.04: khóa -> chặn đăng nhập + API; mở khóa -> dùng lại được."""
        a = self.login(ADMIN, "admin")
        uid, acc = self.new_user("student")
        tok = self.login(acc, "student")
        r = self.api("put", f"/api/admin/users/{uid}/ban", a, json={"reason": "Spam tin nhắn"})
        self.assertEqual(r.status_code, 200)
        r = self.client.post("/api/auth/login", json={"email": acc[0], "password": acc[1], "role": "student"})
        self.assertEqual(r.status_code, 403)
        self.assertIn("Spam tin nhắn", r.get_json()["message"])
        self.assertIn(self.api("get", "/api/student/profile", tok).status_code, (401, 403))
        self.assertEqual(self.api("put", f"/api/admin/users/{uid}/unban", a).status_code, 200)
        self.login(acc, "student")
        logs = self.api("get", "/api/admin/audit-logs", a).get_json()["data"]
        actions = {l.get("action") for l in logs if l.get("target_id") == uid}
        self.assertTrue({"BAN_USER", "UNBAN_USER"} <= actions, actions)


if __name__ == "__main__":
    unittest.main()
