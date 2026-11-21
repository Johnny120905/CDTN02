# -*- coding: utf-8 -*-
"""[Thêm 20/11/2026 - Ngân] INTEGRATION TEST Khiếu nại & Báo cáo vi phạm (trước đây chưa có TC nào trỏ tới FR-NTD-10.01).
FR-NTD-10.01, FR-NTD-10.02, FR-QTV-09.04, BR-CH-12."""
import unittest

from _base import ApiTestCase, EMPLOYER, ADMIN


class ReportApiTest(ApiTestCase):

    def setUp(self):
        self.e = self.login(EMPLOYER, "employer")
        self.a = self.login(ADMIN, "admin")

    def test_employer_report_requires_reason_then_pending_ticket(self):
        """FR-NTD-10.01 / BR-CH-12: lý do rỗng -> 400; gửi hợp lệ -> 201, có mã phiếu, trạng thái 'pending'."""
        r = self.api("post", "/api/reports", self.e, json={"report_type": "user", "target_id": "stu_x", "reason": "   "})
        self.assertEqual(r.status_code, 400)
        r = self.api("post", "/api/reports", self.e, json={"report_type": "user", "target_id": "stu_x",
                                                           "reason": "[AutoTest] Ứng viên bùng ca không báo"})
        self.assertEqual(r.status_code, 201, r.get_json())
        rep = r.get_json()["data"]
        self.assertEqual(rep["status"], "pending")
        self.assertTrue(rep["ticket_code"].startswith("TK-"))
        admin_ids = [x["_id"] for x in self.api("get", "/api/admin/reports", self.a).get_json()["data"]]
        self.assertIn(rep["_id"], admin_ids, "QTV không thấy phiếu vừa gửi")

    def test_employer_sees_own_reports_and_admin_result(self):
        """FR-NTD-10.02 / FR-QTV-09.04: NTD xem phiếu đã gửi; QTV cập nhật trạng thái + ghi chú -> NTD thấy kết quả và nhận thông báo."""
        rep = self.api("post", "/api/reports", self.e, json={"report_type": "chat", "target_id": "room_x",
                                                             "reason": "[AutoTest] Lời lẽ không chuẩn mực"}).get_json()["data"]
        mine = self.api("get", "/api/reports/mine", self.e).get_json()["data"]
        self.assertIn(rep["_id"], [x["_id"] for x in mine])
        r = self.api("put", f"/api/admin/reports/{rep['_id']}/status", self.a, json={"status": "resolved", "note": "Đã cảnh cáo"})
        self.assertEqual(r.status_code, 200)
        me = [x for x in self.api("get", "/api/reports/mine", self.e).get_json()["data"] if x["_id"] == rep["_id"]][0]
        self.assertEqual(me["status"], "resolved")
        self.assertEqual(me.get("admin_note"), "Đã cảnh cáo")
        notifs = self.api("get", "/api/notifications", self.e).get_json().get("data") or []
        self.assertTrue(any(rep["ticket_code"] in (n.get("title") or "") for n in notifs), "NTD không nhận thông báo kết quả xử lý")

    def test_update_unknown_report_404(self):
        self.assertEqual(self.api("put", "/api/admin/reports/rep_khong_ton_tai/status", self.a, json={"status": "resolved"}).status_code, 404)


if __name__ == "__main__":
    unittest.main()
