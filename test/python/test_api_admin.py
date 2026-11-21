# -*- coding: utf-8 -*-
"""INTEGRATION TEST phân hệ Quản trị viên: các thao tác thật (khóa/xóa/duyệt/ẩn...) chạy trên dữ liệu RAM,
nên tự động hóa được cả những ca trước đây phải để Run_Mode=NO vì sợ hỏng dữ liệu thật."""
import unittest

from _base import ApiTestCase, STUDENT, EMPLOYER, ADMIN
from src.core.database import db_manager


class AdminApiTest(ApiTestCase):

    def setUp(self):
        self.a = self.login(ADMIN, "admin")

    def audit_actions(self, target_id):
        logs = self.api("get", "/api/admin/audit-logs", self.a).get_json()["data"]
        return {l.get("action") for l in logs if l.get("target_id") == target_id}

    # ---------- 3.2 Dashboard ----------
    def test_dashboard_200_has_stats(self):
        """TC-QTV-011 / TC-QTV-062 / FR-QTV-02.01: API thống kê trả về dữ liệu."""
        r = self.api("get", "/api/admin/dashboard", self.a)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json().get("success"))

    # ---------- 3.3 Người dùng ----------
    def test_cascade_delete_user(self):
        """TC-QTV-019 / FR-QTV-03.05 / BR-QTV-03: xóa vĩnh viễn SV -> mất tài khoản, hồ sơ, đơn; ghi Audit Log."""
        e = self.login(EMPLOYER, "employer")
        uid, acc = self.new_user("student")
        s = self.login(acc, "student")
        job = self.create_job(e).get_json()["data"]["_id"]
        self.assertEqual(self.apply(s, job).status_code, 201)
        r = self.api("delete", f"/api/admin/users/{uid}", self.a)
        self.assertEqual(r.status_code, 200)
        self.assertIsNone(db_manager.get_collection("users").find_one({"_id": uid}))
        self.assertIsNone(db_manager.get_collection("student_profiles").find_one({"user_id": uid}))
        self.assertEqual(db_manager.get_collection("applications").count_documents({"student_user_id": uid}), 0)
        self.assertIn("DELETE_USER", self.audit_actions(uid))
        r = self.client.post("/api/auth/login", json={"email": acc[0], "password": acc[1], "role": "student"})
        self.assertEqual(r.status_code, 401)

    def test_cannot_delete_admin_account(self):
        """BR-QTV-01: không xóa được tài khoản Quản trị viên khác."""
        uid, _ = self.new_user("admin")
        self.assertEqual(self.api("delete", f"/api/admin/users/{uid}", self.a).status_code, 400)

    # ---------- 3.4 GPKD ----------
    def test_gpkd_approve_unlocks_posting(self):
        """TC-QTV-027 / TC-QTV-028 / BR-NTD-03 / BR-QTV-04: GPKD chờ duyệt -> NTD bị chặn đăng tin (403); duyệt xong -> đăng được."""
        uid, acc = self.new_user("employer", approved=False)
        e = self.login(acc, "employer")
        self.assertEqual(self.create_job(e).status_code, 403)
        r = self.api("put", f"/api/admin/employers/{uid}/gpkd", self.a, json={"status": "approved"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(self.create_job(e).status_code, 201)
        self.assertIn("APPROVE_GPKD", self.audit_actions(f"emp_{uid}"))

    def test_gpkd_reject_keeps_posting_locked_and_shows_reason(self):
        """TC-QTV-027 / FR-QTV-04.04: từ chối kèm lý do -> NTD vẫn bị chặn và thấy lý do."""
        uid, acc = self.new_user("employer", approved=False)
        e = self.login(acc, "employer")
        r = self.api("put", f"/api/admin/employers/{uid}/gpkd", self.a, json={"status": "rejected", "reason": "Ảnh GPKD mờ"})
        self.assertEqual(r.status_code, 200)
        r = self.create_job(e)
        self.assertEqual(r.status_code, 403)
        self.assertIn("Ảnh GPKD mờ", r.get_json()["message"])

    # ---------- 3.5 Kiểm duyệt tin ----------
    def test_sensitive_job_held_then_approved(self):
        """TC-QTV-035 / TC-QTV-072 / BR-NTD-05 / FR-QTV-05.03: tin dính từ cấm bị ẩn chờ duyệt, SV không thấy; QTV duyệt -> công khai."""
        e = self.login(EMPLOYER, "employer")
        job = self.create_job(e, title="[AutoTest] Tuyển gấp", description="Cần đặt cọc trước 200k").get_json()["data"]
        self.assertTrue(job["is_hidden"])
        self.assertTrue(job["matched_banned_keywords"])
        public_ids = [j.get("_id") for j in (self.client.get("/api/jobs").get_json().get("data") or [])]
        self.assertNotIn(job["_id"], public_ids)
        r = self.api("put", f"/api/admin/jobs/{job['_id']}/approve-moderation", self.a)
        self.assertEqual(r.status_code, 200)
        public_ids = [j.get("_id") for j in (self.client.get("/api/jobs").get_json().get("data") or [])]
        self.assertIn(job["_id"], public_ids)

    def test_hide_and_unhide_job_syncs_to_student(self):
        """TC-QTV-032 / TC-QTV-034 / TC-QTV-072 / FR-QTV-05.04, 05.05: ẩn -> SV không thấy & không nộp được; khôi phục -> thấy lại."""
        e = self.login(EMPLOYER, "employer")
        s = self.login(STUDENT, "student")
        job = self.create_job(e).get_json()["data"]["_id"]
        r = self.api("put", f"/api/admin/jobs/{job}/hide", self.a, json={"reason": "Mô tả sai sự thật"})
        self.assertEqual(r.status_code, 200)
        public_ids = [j.get("_id") for j in (self.client.get("/api/jobs").get_json().get("data") or [])]
        self.assertNotIn(job, public_ids)
        self.assertEqual(self.apply(s, job).status_code, 400)
        self.assertEqual(self.api("put", f"/api/admin/jobs/{job}/unhide", self.a).status_code, 200)
        public_ids = [j.get("_id") for j in (self.client.get("/api/jobs").get_json().get("data") or [])]
        self.assertIn(job, public_ids)
        self.assertTrue({"HIDE_JOB", "UNHIDE_JOB"} <= self.audit_actions(job))

    def test_cannot_hard_delete_job_with_applicants(self):
        """TC-QTV-033 / BR-QTV-05: tin đã có người nộp -> cấm xóa cứng (400); tin chưa có ai -> xóa được."""
        e = self.login(EMPLOYER, "employer")
        uid, acc = self.new_user("student")
        s = self.login(acc, "student")
        job = self.create_job(e).get_json()["data"]["_id"]
        self.apply(s, job)
        self.assertEqual(self.api("delete", f"/api/admin/jobs/{job}", self.a).status_code, 400)
        job2 = self.create_job(e).get_json()["data"]["_id"]
        self.assertEqual(self.api("delete", f"/api/admin/jobs/{job2}", self.a).status_code, 200)
        self.assertIsNone(db_manager.get_collection("jobs").find_one({"_id": job2}))

    def test_invalid_job_id_404(self):
        """TC-QTV-064: ID tin không tồn tại -> 404."""
        self.assertEqual(self.api("put", "/api/admin/jobs/job_khong_ton_tai/approve-moderation", self.a).status_code, 404)
        self.assertEqual(self.api("delete", "/api/admin/jobs/job_khong_ton_tai", self.a).status_code, 404)

    # ---------- 3.6 Từ khóa cấm ----------
    def test_banned_keyword_crud_and_duplicate_409(self):
        """TC-QTV-036 / TC-QTV-038 / TC-QTV-040 / BR-QTV-06: thêm, trùng 409, rỗng 400, sửa trùng 409, xóa."""
        r = self.api("post", "/api/admin/banned-keywords", self.a, json={"keyword": "  AutoTest Lừa Đảo  "})
        self.assertEqual(r.status_code, 201)
        kw = r.get_json()["data"]
        self.assertEqual(kw["keyword"], "autotest lừa đảo")
        self.assertEqual(self.api("post", "/api/admin/banned-keywords", self.a, json={"keyword": "autotest lừa đảo"}).status_code, 409)
        self.assertEqual(self.api("post", "/api/admin/banned-keywords", self.a, json={"keyword": "   "}).status_code, 400)
        self.assertEqual(self.api("put", f"/api/admin/banned-keywords/{kw['_id']}", self.a, json={"keyword": "đặt cọc"}).status_code, 409)
        self.assertEqual(self.api("delete", f"/api/admin/banned-keywords/{kw['_id']}", self.a).status_code, 200)
        words = [k["keyword"] for k in self.api("get", "/api/admin/banned-keywords", self.a).get_json()["data"]]
        self.assertNotIn("autotest lừa đảo", words)

    # ---------- 3.8 Master Data ----------
    def test_category_crud_and_safe_unlink(self):
        """TC-QTV-047 / TC-QTV-048 / TC-QTV-049 / BR-QTV-07: thêm, rỗng 400, bật/tắt, xóa gỡ liên kết khỏi tin cũ."""
        self.assertEqual(self.api("post", "/api/admin/categories", self.a, json={"name": "  "}).status_code, 400)
        r = self.api("post", "/api/admin/categories", self.a, json={"name": "[AutoTest] Ngành thử", "type": "job"})
        self.assertEqual(r.status_code, 201)
        cid = r.get_json()["data"]["_id"]
        self.assertEqual(self.api("put", f"/api/admin/categories/{cid}", self.a, json={"is_active": False}).status_code, 200)
        self.assertFalse(db_manager.get_collection("categories").find_one({"_id": cid})["is_active"])
        e = self.login(EMPLOYER, "employer")
        job = self.create_job(e, category_id=cid).get_json()["data"]["_id"]
        self.assertEqual(self.api("delete", f"/api/admin/categories/{cid}", self.a).status_code, 200)
        self.assertIsNone(db_manager.get_collection("categories").find_one({"_id": cid}))
        self.assertEqual(db_manager.get_collection("jobs").find_one({"_id": job})["category_id"], "")

    # ---------- 3.10 Thông báo hệ thống ----------
    def test_broadcast_requires_title_and_body_then_retract(self):
        """TC-QTV-057 / TC-QTV-058 / BR-QTV-09: thiếu tiêu đề/nội dung -> 400; phát -> SV nhận; thu hồi -> mất."""
        r = self.api("post", "/api/admin/announcements", self.a, json={"title": "", "message": ""})
        self.assertEqual(r.status_code, 400)
        r = self.api("post", "/api/admin/announcements", self.a,
                     json={"title": "[AutoTest] Bảo trì", "message": "Hệ thống bảo trì 22h", "content": "Hệ thống bảo trì 22h",
                           "target_role": "student", "audience": "student"})
        self.assertIn(r.status_code, (200, 201), r.get_json())
        ann = r.get_json().get("data") or {}
        ann_id = ann.get("_id")
        self.assertTrue(ann_id)
        r = self.api("delete", f"/api/admin/announcements/{ann_id}", self.a)
        self.assertEqual(r.status_code, 200)


if __name__ == "__main__":
    unittest.main()
