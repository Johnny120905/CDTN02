import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from server import create_app

class TestStudentWorkflow(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        
        # Đăng nhập Student thật (Vũ Thế Long)
        login_res = self.client.post("/api/auth/login", json={
            "email": "vuthelong@vlu.edu.vn",
            "password": "Long123!",
            "role": "student"
        })
        self.token = login_res.get_json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_student_cv_management(self):
        """Test tải lên CV, đặt làm mặc định và xem danh sách."""
        # 1. Thêm CV
        add_res = self.client.post("/api/student/resumes", json={
            "file_name": "CV_Tester.pdf",
            "file_url": "/uploads/cv_test.pdf",
            "is_default": False
        }, headers=self.headers)
        self.assertEqual(add_res.status_code, 201)
        cv_id = add_res.get_json()["data"]["_id"]

        # 2. Đặt làm mặc định
        def_res = self.client.put(f"/api/student/resumes/{cv_id}/default", headers=self.headers)
        self.assertEqual(def_res.status_code, 200)

        # 3. Xem danh sách
        list_res = self.client.get("/api/student/resumes", headers=self.headers)
        cvs = list_res.get_json()["data"]
        target = next((c for c in cvs if c["_id"] == cv_id), None)
        self.assertIsNotNone(target)
        self.assertTrue(target["is_default"])

    def test_apply_and_prevent_duplicate(self):
        """Test nộp hồ sơ ứng tuyển và chặn nộp trùng lặp (BR-STU-04)."""
        # Lấy 1 công việc
        jobs_res = self.client.get("/api/jobs")
        jobs = jobs_res.get_json()["data"]
        self.assertTrue(len(jobs) > 0)
        unapplied = [j for j in jobs if j["_id"] not in ["job_1", "job_2"]]
        job_id = unapplied[0]["_id"] if unapplied else jobs[-1]["_id"]

        # Nộp đơn lần 1
        app1 = self.client.post("/api/student/applications", json={
            "job_id": job_id,
            "cover_note": "Em rất mong được nhận vào vị trí này"
        }, headers=self.headers)
        self.assertEqual(app1.status_code, 201)
        self.assertTrue(app1.get_json()["success"])

        # Cố nộp lại cùng công việc đó lần 2 -> Phải bị từ chối 409
        app2 = self.client.post("/api/student/applications", json={
            "job_id": job_id,
            "cover_note": "Em nộp lại"
        }, headers=self.headers)
        self.assertEqual(app2.status_code, 409)
        self.assertIn("đã nộp hồ sơ", app2.get_json()["message"].lower())
        print("\n[PASS] BR-STU-04: Successfully prevented duplicate applications for the same job.")

if __name__ == "__main__":
    unittest.main()

