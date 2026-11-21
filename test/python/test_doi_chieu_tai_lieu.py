# -*- coding: utf-8 -*-
"""
[Sửa 21/11/2026 - Ngân] TEST ĐỐI CHIẾU TÀI LIỆU — mỗi test kiểm tra 1 quy định ghi trong kịch bản TC / FR / BR của nhóm.
Tên test đặt theo mã TC/BR trong tài liệu (trước đây là test_known_bugs.py, đặt tên theo mã BUG).
Test nào FAIL nghĩa là web đang làm khác tài liệu; mã BUG tương ứng ghi trong test/python/BUG_LOG.md.
Khi Backend được sửa, test tự chuyển sang PASS (giữ lại để kiểm thử hồi quy). KHÔNG sửa test để cho PASS.
"""
import unittest
from unittest import mock

from _base import ApiTestCase, STUDENT, EMPLOYER, ADMIN
from src.core.database import db_manager

OK_MAIL = mock.patch("src.api.auth.auth_routes.send_otp_email_with_status", return_value=(True, ""))


class DoiChieuTaiLieuTest(ApiTestCase):

    def setUp(self):
        self.a = self.login(ADMIN, "admin")

    def _register_payload(self, email, **over):
        p = {"email": email, "password": "AutoTest@2026", "role": "student", "full_name": "SV AutoTest",
             "phone": "0912345678", "extra_field": "ĐH Văn Lang", "address": "Quận 1, TP.HCM", "otp": "123456"}
        p.update(over)
        return p

    def test_BR_CH_04_nhap_sai_OTP_bi_chan(self):
        """BR-CH-04: nhập mã OTP không phải mã đã gửi (111111) thì bị báo lỗi, không tạo tài khoản."""
        email = "autotest_sai_otp@gmail.com"
        with OK_MAIL:
            self.client.post("/api/auth/send-otp", json={"email": email, "purpose": "register"})
        rec = db_manager.get_collection("users").find_one({"temp_email": email}) or {}
        wrong = "111111" if rec.get("otp_code") != "111111" else "222222"
        r = self.client.post("/api/auth/register", json=self._register_payload(email, otp=wrong))
        self.assertEqual(r.status_code, 400, "Nhập sai mã OTP mà vẫn đăng ký được")

    def test_TC_QTV_029_tu_choi_GPKD_bat_buoc_ly_do(self):
        """TC-QTV-029 / BR-QTV-04 / FR-QTV-04.04 (BUG-04): từ chối GPKD bỏ trống lý do phải bị chặn (400)."""
        uid, _ = self.new_user("employer", approved=False)
        r = self.api("put", f"/api/admin/employers/{uid}/gpkd", self.a, json={"status": "rejected", "reason": ""})
        self.assertEqual(r.status_code, 400)

    def test_TC_QTV_064_trang_thai_GPKD_la_bi_chan(self):
        """TC-QTV-064 / BR-QTV-04 (BUG-05): trạng thái thẩm định chỉ thuộc {approved, rejected}; giá trị lạ -> 400."""
        uid, _ = self.new_user("employer", approved=False)
        r = self.api("put", f"/api/admin/employers/{uid}/gpkd", self.a, json={"status": "abc_xyz"})
        self.assertEqual(r.status_code, 400)

    def test_TC_QTV_023_an_tin_bat_buoc_ly_do(self):
        """TC-QTV-023 / FR-QTV-05.04 (BUG-06): Ẩn tin vi phạm phải bắt buộc nhập lý do (bỏ trống -> 400)."""
        e = self.login(EMPLOYER, "employer")
        job = self.create_job(e).get_json()["data"]["_id"]
        r = self.api("put", f"/api/admin/jobs/{job}/hide", self.a, json={})
        self.assertEqual(r.status_code, 400)

    def test_TC_QTV_064_ID_khong_ton_tai_tra_404(self):
        """TC-QTV-064 (BUG-07): khóa user / ẩn tin với ID không tồn tại phải trả 404, không báo thành công."""
        self.assertEqual(self.api("put", "/api/admin/users/user_khong_ton_tai/ban", self.a, json={"reason": "x"}).status_code, 404)
        self.assertEqual(self.api("put", "/api/admin/jobs/job_khong_ton_tai/hide", self.a, json={"reason": "x"}).status_code, 404)

    def test_TC_SV_044_chua_co_CV_khong_duoc_nop_don(self):
        """TC-SV-044 / FR-SV-06.01 (BUG-09): bắt buộc có ít nhất 1 CV PDF trong kho trước khi nộp đơn."""
        e = self.login(EMPLOYER, "employer")
        uid, acc = self.new_user("student")
        s = self.login(acc, "student")
        job = self.create_job(e).get_json()["data"]["_id"]
        r = self.apply(s, job)
        self.assertNotEqual(r.status_code, 201, "Nộp đơn thành công dù kho CV trống ('Không có file CV')")

    def test_TC_SV_075_don_bi_tu_choi_SV_khong_gui_duoc_tin(self):
        """TC-SV-075 / BR-CH-10 (BUG-10): đơn bị Từ chối -> phòng chat Chỉ đọc cho cả hai phía (SV cũng không gửi được)."""
        e = self.login(EMPLOYER, "employer")
        uid, acc = self.new_user("student")
        s = self.login(acc, "student")
        job = self.create_job(e).get_json()["data"]["_id"]
        app = self.apply(s, job).get_json()["data"]
        self.api("put", f"/api/employer/applicants/{app['_id']}/status", e, json={"status": "rejected", "reject_reason": "x"})
        r = self.api("post", "/api/chat/messages", s, json={
            "room_id": f"room_emp_{app['employer_id']}_stu_{uid}_app_{app['_id']}",
            "application_id": app["_id"], "content": "Cho em hỏi thêm"})
        self.assertIn(r.status_code, (400, 403), "SV vẫn gửi được tin nhắn sau khi đơn bị từ chối")

    def test_BR_QTV_07_sua_ten_danh_muc_rong_bi_chan(self):
        """BR-QTV-07 (BUG-11): tên danh mục sau khi cắt khoảng trắng không được rỗng (sửa tên thành rỗng -> 400)."""
        cid = self.api("post", "/api/admin/categories", self.a, json={"name": "[AutoTest] Danh mục"}).get_json()["data"]["_id"]
        r = self.api("put", f"/api/admin/categories/{cid}", self.a, json={"name": "   "})
        self.assertEqual(r.status_code, 400)

    def test_TC_SV_061_chan_file_gia_PDF(self):
        """TC-SV-061 / BR-SV-03 / NFR-05 (BUG-13): tệp đổi đuôi .pdf nhưng nội dung không phải PDF (sai chữ ký %PDF) phải bị chặn."""
        import io
        s = self.login(STUDENT, "student")
        r = self.client.post("/api/upload", headers=self.h(s), content_type="multipart/form-data",
                             data={"file": (io.BytesIO(b"MZ\x90\x00 day la file exe doi duoi"), "cv.pdf", "application/pdf")})
        self.assertEqual(r.status_code, 400, "Tệp giả mạo đuôi .pdf vẫn được tải lên")

    def test_TC_QTV_050_chan_danh_muc_trung_ten(self):
        """TC-QTV-050 / BR-QTV-07 (BUG-14): thêm danh mục trùng tên (sau khi cắt khoảng trắng) phải bị chặn."""
        name = "[AutoTest] Pha chế & Barista"
        r1 = self.api("post", "/api/admin/categories", self.a, json={"name": name, "type": "job"})
        self.assertEqual(r1.status_code, 201)
        r2 = self.api("post", "/api/admin/categories", self.a, json={"name": "  " + name + "  ", "type": "job"})
        self.assertIn(r2.status_code, (400, 409), "Thêm được danh mục trùng tên")

    def test_FR_QTV_09_04_trang_thai_khieu_nai_chi_4_gia_tri(self):
        """FR-QTV-09.04 / BR-QTV-08 (BUG-15): trạng thái phiếu khiếu nại chỉ thuộc 4 giá trị; giá trị lạ -> 400."""
        e = self.login(EMPLOYER, "employer")
        rep = self.api("post", "/api/reports", e, json={"report_type": "user", "target_id": "stu_x", "reason": "[AutoTest] x"}).get_json()["data"]
        r = self.api("put", f"/api/admin/reports/{rep['_id']}/status", self.a, json={"status": "abc_xyz"})
        self.assertEqual(r.status_code, 400, "QTV lưu được trạng thái phiếu không hợp lệ")


if __name__ == "__main__":
    unittest.main()
