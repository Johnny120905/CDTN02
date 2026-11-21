# -*- coding: utf-8 -*-
"""INTEGRATION TEST luồng nghiệp vụ SV <-> NTD: đăng tin, ứng tuyển, xử lý hồ sơ, chấm công, đánh giá, chat."""
import unittest

from _base import ApiTestCase, STUDENT, EMPLOYER, ADMIN
from src.core.database import db_manager


class EmployerJobApiTest(ApiTestCase):

    def setUp(self):
        self.e = self.login(EMPLOYER, "employer")

    def test_job_title_required_and_salary_range(self):
        """TC-NTD-035 / TC-NTD-083 / BR-NTD-04: thiếu tiêu đề, lương ngoài khung, min > max -> 400; Thỏa thuận bỏ qua khung."""
        self.assertEqual(self.create_job(self.e, title="").status_code, 400)
        self.assertEqual(self.create_job(self.e, salary_min=14000).status_code, 400)
        self.assertEqual(self.create_job(self.e, salary_max=200001).status_code, 400)
        self.assertEqual(self.create_job(self.e, salary_min=40000, salary_max=30000).status_code, 400)
        self.assertEqual(self.create_job(self.e, salary_min=0, salary_max=0, is_negotiable=True).status_code, 201)

    def test_clean_job_auto_public(self):
        """TC-NTD-036 / BR-NTD-05: tin sạch tự động công khai ngay."""
        job = self.create_job(self.e).get_json()["data"]
        self.assertFalse(job["is_hidden"])
        public_ids = [j.get("_id") for j in (self.client.get("/api/jobs").get_json().get("data") or [])]
        self.assertIn(job["_id"], public_ids)


class ApplicationFlowApiTest(ApiTestCase):

    def setUp(self):
        self.e = self.login(EMPLOYER, "employer")
        self.uid, acc = self.new_user("student")
        self.s = self.login(acc, "student")
        self.job = self.create_job(self.e).get_json()["data"]["_id"]

    def status(self, app_id):
        return db_manager.get_collection("applications").find_one({"_id": app_id})["application_status"]

    def test_apply_and_duplicate_409(self):
        """TC-SV-081 / BR-SV-04: nộp đơn 201, nộp trùng khi đơn đang xử lý -> 409."""
        r = self.apply(self.s, self.job)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.get_json()["data"]["application_status"], "pending")
        self.assertEqual(self.apply(self.s, self.job).status_code, 409)

    def test_status_pipeline_and_invalid_status(self):
        """TC-NTD-047..052 / BR-NTD-08: chuyển Đã tiếp nhận -> Mời PV -> Trúng tuyển; trạng thái lạ -> 400."""
        app = self.apply(self.s, self.job).get_json()["data"]["_id"]
        for st in ["reviewed", "interview", "accepted"]:
            r = self.api("put", f"/api/employer/applicants/{app}/status", self.e, json={"status": st})
            self.assertEqual(r.status_code, 200, r.get_json())
            self.assertEqual(self.status(app), st)
        self.assertEqual(self.api("put", f"/api/employer/applicants/{app}/status", self.e, json={"status": "abc"}).status_code, 400)

    def test_reject_sends_reason_to_student(self):
        """TC-NTD-052 / FR-NTD-06.08: từ chối kèm lý do -> đơn phía SV có lý do."""
        app = self.apply(self.s, self.job).get_json()["data"]["_id"]
        r = self.api("put", f"/api/employer/applicants/{app}/status", self.e, json={"status": "rejected", "reject_reason": "Không khớp ca"})
        self.assertEqual(r.status_code, 200)
        mine = self.api("get", "/api/student/applications", self.s).get_json()["data"]
        me = [a for a in mine if a.get("_id") == app][0]
        self.assertEqual(me.get("reject_reason"), "Không khớp ca")

    def test_attendance_only_for_accepted(self):
        """TC-NTD-066 / BR-NTD-08: chấm công cho đơn chưa trúng tuyển -> 400; trạng thái ca sai -> 400."""
        app = self.apply(self.s, self.job).get_json()["data"]["_id"]
        r = self.api("put", f"/api/employer/applicants/{app}/attendance", self.e, json={"shift_status": "completed"})
        self.assertEqual(r.status_code, 400)
        self.api("put", f"/api/employer/applicants/{app}/status", self.e, json={"status": "accepted"})
        self.assertEqual(self.api("put", f"/api/employer/applicants/{app}/attendance", self.e, json={"shift_status": "xyz"}).status_code, 400)
        self.assertEqual(self.api("put", f"/api/employer/applicants/{app}/attendance", self.e, json={"shift_status": "completed"}).status_code, 200)

    def test_student_review_locked_until_work_done_then_once(self):
        """TC-SV-070 / TC-SV-072 / BR-SV-06, BR-SV-07: chưa nghiệm thu -> không đánh giá; sau nghiệm thu -> 201; lần 2 -> 409; >= 1000 ký tự -> 400."""
        app = self.apply(self.s, self.job).get_json()["data"]["_id"]
        self.api("put", f"/api/employer/applicants/{app}/status", self.e, json={"status": "accepted"})
        body = {"application_id": app, "rating": 5, "comment": "Môi trường tốt"}
        r = self.api("post", "/api/student/reviews", self.s, json=body)
        self.assertEqual(r.status_code, 400, "SV đánh giá được khi NTD chưa nghiệm thu ca")
        self.api("put", f"/api/employer/applicants/{app}/attendance", self.e, json={"shift_status": "completed"})
        self.assertEqual(self.api("post", "/api/student/reviews", self.s, json=dict(body, comment="x" * 1000)).status_code, 400)
        self.assertEqual(self.api("post", "/api/student/reviews", self.s, json=dict(body, rating=6)).status_code, 400)
        self.assertEqual(self.api("post", "/api/student/reviews", self.s, json=body).status_code, 201)
        self.assertEqual(self.api("post", "/api/student/reviews", self.s, json=body).status_code, 409)

    def test_withdraw_last_accepted_reopens_job(self):
        """TC-SV-044 / BR-SV-05: rút đơn trúng tuyển cuối cùng của tin 'Đã nhận người' -> tin mở lại."""
        app = self.apply(self.s, self.job).get_json()["data"]["_id"]
        self.api("put", f"/api/employer/applicants/{app}/status", self.e, json={"status": "accepted"})
        db_manager.get_collection("jobs").update_one({"_id": self.job}, {"$set": {"status": "filled", "job_status": "filled", "is_open": False}})
        r = self.api("put", f"/api/student/applications/{app}/cancel", self.s)
        self.assertEqual(r.status_code, 200, r.get_json())
        self.assertEqual(self.status(app), "withdrawn")
        job = db_manager.get_collection("jobs").find_one({"_id": self.job})
        self.assertEqual(job.get("status"), "open")

    def test_chat_attachment_type_blocked(self):
        """TC-SV-075 / BR-CH-08: đính kèm .exe trong chat bị chặn (400)."""
        app = self.apply(self.s, self.job).get_json()["data"]["_id"]
        r = self.api("post", "/api/chat/messages", self.s, json={
            "room_id": f"room_emp_x_stu_{self.uid}_app_{app}", "application_id": app,
            "content": "gửi file", "media_url": "/api/files/x", "file_name": "virus.exe", "file_size": 100})
        self.assertEqual(r.status_code, 400)

    def test_employer_blocked_from_chat_after_reject(self):
        """TC-NTD-052 / BR-CH-10: đơn bị từ chối -> NTD không gửi được tin mới (phòng Chỉ đọc)."""
        app = self.apply(self.s, self.job).get_json()["data"]
        self.api("put", f"/api/employer/applicants/{app['_id']}/status", self.e, json={"status": "rejected", "reject_reason": "x"})
        r = self.api("post", "/api/chat/messages", self.e, json={
            "room_id": f"room_emp_{app['employer_id']}_stu_{self.uid}_app_{app['_id']}",
            "application_id": app["_id"], "student_id": app["student_id"], "content": "Xin chào"})
        self.assertIn(r.status_code, (400, 403), r.get_json())


if __name__ == "__main__":
    unittest.main()
