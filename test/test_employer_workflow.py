import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from server import create_app

class TestEmployerWorkflow(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        
        login_res = self.client.post("/api/auth/login", json={
            "email": "huynhnguyenbaongoc2k5@gmail.com",
            "password": "Huynh120905!",
            "role": "employer"
        })
        self.token = login_res.get_json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_post_job_and_salary_validation(self):
        """Test đăng tin và kiểm tra validation lương min <= max (BR-EMP-02)."""
        # 1. Thử tạo tin có min > max -> Phải trả về 400
        invalid_res = self.client.post("/api/employer/jobs", json={
            "title": "Nhân viên Barista",
            "salary_min": 50000,
            "salary_max": 30000,
            "is_negotiable": False
        }, headers=self.headers)
        self.assertEqual(invalid_res.status_code, 400)
        self.assertIn("lương tối thiểu", invalid_res.get_json()["message"].lower())

        # 2. Tạo tin hợp lệ
        valid_res = self.client.post("/api/employer/jobs", json={
            "title": "Nhân viên Phục vụ Part-time Cuối Tuần",
            "salary_min": 25000,
            "salary_max": 35000,
            "is_negotiable": False,
            "work_time": "Thứ 7 & CN"
        }, headers=self.headers)
        self.assertEqual(valid_res.status_code, 201)
        self.assertTrue(valid_res.get_json()["success"])
        print("\n[PASS] BR-EMP-02: Successfully validated job salary constraints.")

if __name__ == "__main__":
    unittest.main()

