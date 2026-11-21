# -*- coding: utf-8 -*-
"""INTEGRATION TEST bổ sung: đóng băng hồ sơ, tải tệp PDF, đánh giá (upsert + tính lại điểm), thống kê Dashboard, danh mục."""
import io
import unittest

from _base import ApiTestCase, STUDENT, EMPLOYER, ADMIN
from src.core.database import db_manager


class MoreApiTest(ApiTestCase):

    def setUp(self):
        self.a = self.login(ADMIN, "admin")
        self.e = self.login(EMPLOYER, "employer")

    def _accepted_done_app(self):
        uid, acc = self.new_user("student")
        s = self.login(acc, "student")
        job = self.create_job(self.e).get_json()["data"]["_id"]
        app = self.apply(s, job).get_json()["data"]["_id"]
        self.api("put", f"/api/employer/applicants/{app}/status", self.e, json={"status": "accepted"})
        self.api("put", f"/api/employer/applicants/{app}/attendance", self.e, json={"shift_status": "completed"})
        return uid, s, app

    def test_application_snapshot_frozen_after_profile_edit(self):
        """TC-SV-049 / BR-SV-04: sửa Hồ sơ cá nhân sau khi nộp -> bản chụp trong đơn đã nộp giữ nguyên."""
        uid, acc = self.new_user("student")
        s = self.login(acc, "student")
        job = self.create_job(self.e).get_json()["data"]["_id"]
        app = self.apply(s, job).get_json()["data"]
        before = dict(app["application_snapshot"])
        r = self.api("put", "/api/student/profile", s, json={"university": "ĐH Bách Khoa (đổi sau khi nộp)", "full_name": "Tên Đổi Sau"})
        self.assertEqual(r.status_code, 200, r.get_json())
        after = db_manager.get_collection("applications").find_one({"_id": app["_id"]})["application_snapshot"]
        self.assertEqual(after.get("university"), before.get("university"))
        self.assertEqual(after.get("student_name"), before.get("student_name"))

    def test_upload_only_pdf_and_max_10mb(self):
        """TC-SV-060 / TC-NTD-030 / TC-SV-061 / BR-SV-03, BR-NTD-02: chỉ nhận .pdf, chặn .txt/.docx và tệp > 10MB."""
        s = self.login(STUDENT, "student")
        def up(name, data, mime):
            return self.client.post("/api/upload", headers=self.h(s), content_type="multipart/form-data",
                                    data={"file": (io.BytesIO(data), name, mime)})
        self.assertEqual(up("cv.txt", b"hello", "text/plain").status_code, 400)
        self.assertEqual(up("cv.docx", b"PK\x03\x04", "application/vnd.openxmlformats-officedocument.wordprocessingml.document").status_code, 400)
        big = b"%PDF-1.4\n" + b"0" * (10 * 1024 * 1024 + 10)
        self.assertEqual(up("big.pdf", big, "application/pdf").status_code, 400)
        r = up("cv.pdf", b"%PDF-1.4\n%%EOF", "application/pdf")
        self.assertIn(r.status_code, (200, 201), r.get_json())

    def test_employer_review_upsert_one_record(self):
        """TC-NTD-072 / BR-NTD-09: NTD gửi lại đánh giá trên cùng đơn -> cập nhật bài cũ, không tạo bản ghi thứ 2."""
        uid, s, app = self._accepted_done_app()
        r1 = self.api("post", "/api/employer/reviews", self.e, json={"application_id": app, "rating": 4, "comment": "Chăm chỉ"})
        self.assertIn(r1.status_code, (200, 201), r1.get_json())
        r2 = self.api("post", "/api/employer/reviews", self.e, json={"application_id": app, "rating": 5, "comment": "Rất chăm chỉ"})
        self.assertIn(r2.status_code, (200, 201), r2.get_json())
        revs = list(db_manager.get_collection("reviews").find({"application_id": app, "reviewer_role": {"$ne": "student"}}))
        revs = [r for r in revs if r.get("direction") != "student_to_employer"]
        self.assertEqual(len(revs), 1)
        self.assertEqual(revs[0]["rating"], 5)

    def test_admin_hide_review_recalculates_average(self):
        """TC-QTV-041 / TC-QTV-043 / BR-QTV-06: Ẩn/Khôi phục đánh giá -> tính lại điểm sao trung bình công khai."""
        uid1, s1, app1 = self._accepted_done_app()
        uid2, s2, app2 = self._accepted_done_app()
        r1 = self.api("post", "/api/student/reviews", s1, json={"application_id": app1, "rating": 1, "comment": "Tệ"}).get_json()["data"]
        self.api("post", "/api/student/reviews", s2, json={"application_id": app2, "rating": 5, "comment": "Tốt"})
        emp_id = r1["target_id"]
        all_active = [r["rating"] for r in db_manager.get_collection("reviews").find({"target_id": emp_id, "is_hidden": {"$ne": True}})]
        self.assertEqual(self.api("put", f"/api/admin/reviews/{r1['_id']}/hide", self.a).status_code, 200)
        expect = round((sum(all_active) - 1) / (len(all_active) - 1), 1)
        comp = db_manager.get_collection("company_profiles").find_one({"employer_id": emp_id})
        self.assertEqual(comp["rating_avg"], expect)
        self.assertEqual(self.api("put", f"/api/admin/reviews/{r1['_id']}/hide", self.a).status_code, 200)
        comp = db_manager.get_collection("company_profiles").find_one({"employer_id": emp_id})
        self.assertEqual(comp["rating_avg"], round(sum(all_active) / len(all_active), 1))

    def test_employer_cannot_edit_review_hidden_by_admin(self):
        """TC-NTD-073 / BR-NTD-09: đánh giá của NTD đã bị QTV ẩn -> NTD sửa bị chặn 403."""
        uid, s, app = self._accepted_done_app()
        r = self.api("post", "/api/employer/reviews", self.e, json={"application_id": app, "rating": 4, "comment": "Chăm chỉ"})
        self.assertIn(r.status_code, (200, 201), r.get_json())
        rev = db_manager.get_collection("reviews").find_one({"application_id": app, "reviewer_role": {"$ne": "student"},
                                                             "direction": {"$ne": "student_to_employer"}})
        self.assertIsNotNone(rev)
        self.assertEqual(self.api("put", f"/api/admin/reviews/{rev['_id']}/hide", self.a).status_code, 200)
        r = self.api("put", f"/api/employer/reviews/{rev['_id']}", self.e, json={"rating": 5, "comment": "Sửa lại"})
        self.assertEqual(r.status_code, 403, r.get_json())

    def test_dashboard_counts_only_gmail_users(self):
        """TC-QTV-015 / BR-QTV-02: thống kê chỉ tính tài khoản @gmail.com, loại tài khoản thử nghiệm nội bộ."""
        before = self.api("get", "/api/admin/dashboard", self.a).get_json()
        db_manager.get_collection("users").insert_one({"_id": "user_t_internal", "email": "noibo@test.local", "role": "student",
                                                       "status": "active", "is_banned": False})
        after = self.api("get", "/api/admin/dashboard", self.a).get_json()
        db_manager.get_collection("users").delete_one({"_id": "user_t_internal"})
        def total(b):
            return ((b.get("data") or {}).get("metrics") or {}).get("total_users")
        self.assertIsNotNone(total(before), before)
        self.assertEqual(total(before), total(after))
        self.new_user("student")
        self.assertEqual(total(self.api("get", "/api/admin/dashboard", self.a).get_json()), total(before) + 1)

    def test_category_name_trimmed(self):
        """TC-QTV-050 / BR-QTV-07: tên danh mục được cắt khoảng trắng thừa khi thêm."""
        r = self.api("post", "/api/admin/categories", self.a, json={"name": "   [AutoTest] Trim   "})
        self.assertEqual(r.get_json()["data"]["name"], "[AutoTest] Trim")


if __name__ == "__main__":
    unittest.main()
