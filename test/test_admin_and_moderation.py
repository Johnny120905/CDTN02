import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from server import create_app

class TestAdminAndModeration(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        
        login_res = self.client.post("/api/auth/login", json={
            "email": "lethithuyngan985@gmail.com",
            "password": "Le090805!",
            "role": "admin"
        })
        self.token = login_res.get_json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_admin_dashboard_metrics(self):
        """Quản trị viên xem Dashboard thống kê."""
        res = self.client.get("/api/admin/dashboard", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        self.assertIn("metrics", data)
        self.assertIn("growth_chart", data)
        self.assertGreaterEqual(data["metrics"]["total_users"], 3)

    def test_banned_keyword_chat_filtering(self):
        """Test cơ chế kiểm duyệt hội thoại tự động (BR-ADM-05)."""
        # Thêm từ khóa cấm
        self.client.post("/api/admin/banned-keywords", json={
            "keyword": "tiền cọc lừa đảo"
        }, headers=self.headers)

        # Gửi tin nhắn chứa từ cấm
        chat_res = self.client.post("/api/chat/messages", json={
            "room_id": "test_room",
            "content": "Bạn hãy nạp tiền cọc lừa đảo vào tài khoản này nhé"
        }, headers=self.headers)
        
        self.assertEqual(chat_res.status_code, 201)
        msg_data = chat_res.get_json()["data"]
        self.assertTrue(msg_data["is_flagged"])
        self.assertIn("***", msg_data["content"])
        self.assertNotIn("tiền cọc lừa đảo", msg_data["content"])
        print("\n[PASS] BR-ADM-05: Successfully auto-filtered banned keywords in chat.")

if __name__ == "__main__":
    unittest.main()

