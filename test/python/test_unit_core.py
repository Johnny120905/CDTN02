# -*- coding: utf-8 -*-
"""
UNIT TEST THẬT: gọi trực tiếp các hàm trong Backend/src (không tự viết lại logic trong test).
Thay cho các "UnitTest" Java cũ chỉ kiểm tra regex tự viết trong file test.
"""
import time
import unittest

import _base  # noqa: F401  (thiết lập môi trường an toàn trước khi import Backend)
from src.core import security
from src.core.security import (validate_email_format, validate_password_complexity, hash_password,
                               verify_password, generate_jwt_token, decode_jwt_token)
from src.api.common.common_routes import (filter_content_banned_words, scan_job_banned_keywords,
                                          _strip_accents_lower)
from src.core.socket_service import canonicalize_room_id


class SecurityUnitTest(unittest.TestCase):
    """src/core/security.py — BR-CH-01, BR-CH-03, NFR bảo mật (PBKDF2, JWT 24h)."""

    def test_password_complexity_5_rules(self):
        """TC-SV-014 / BR-CH-03: đủ 5 điều kiện mới hợp lệ, thiếu 1 điều kiện là bị từ chối."""
        self.assertTrue(validate_password_complexity("Partime@2026")[0])
        for weak in ["Pa@1", "partime@2026", "PARTIME@2026", "Partime@abcd", "Partime2026", ""]:
            ok, msg = validate_password_complexity(weak)
            self.assertFalse(ok, f"Mật khẩu yếu '{weak}' lẽ ra bị từ chối")
            self.assertTrue(msg)

    def test_email_format_function(self):
        """BR-CH-01 (phần định dạng): hàm validate_email_format chặn chuỗi sai định dạng."""
        self.assertTrue(validate_email_format("sinhvien@gmail.com"))
        for bad in ["", "abc", "abc@", "@gmail.com", "a b@gmail.com"]:
            self.assertFalse(validate_email_format(bad), bad)

    def test_pbkdf2_hash_and_verify(self):
        """TC-QTV-067: băm PBKDF2-HMAC-SHA256 100.000 vòng, verify đúng/sai."""
        import hashlib
        h = hash_password("Partime@2026")
        expected = hashlib.pbkdf2_hmac("sha256", b"Partime@2026", b"CDTN02_SALT_KEY_vlu_2026", 100000).hex()
        self.assertEqual(h, expected)
        self.assertTrue(verify_password("Partime@2026", h))
        self.assertFalse(verify_password("Partime@2027", h))
        self.assertNotIn("Partime@2026", h)

    def test_jwt_roundtrip_and_24h_expiry(self):
        """TC-QTV-067 / BR-CH-05: JWT hợp lệ 86.400 giây, sai chữ ký hoặc hết hạn thì bị từ chối."""
        tok = generate_jwt_token("user_x", "x@gmail.com", "student")
        payload = decode_jwt_token(tok)
        self.assertEqual(payload["sub"], "user_x")
        self.assertEqual(payload["role"], "student")
        self.assertEqual(payload["exp"] - payload["iat"], 86400)
        tampered = tok[:-2] + ("AA" if not tok.endswith("AA") else "BB")
        self.assertIsNone(decode_jwt_token(tampered))
        expired = generate_jwt_token("user_x", "x@gmail.com", "student", expires_in=-5)
        self.assertIsNone(decode_jwt_token(expired))
        self.assertIsNone(decode_jwt_token("khong.phai.jwt.hop.le"))


class BannedKeywordUnitTest(unittest.TestCase):
    """src/api/common/common_routes.py — BR-CH-09, BR-NTD-05 (quét/che từ cấm)."""

    def test_strip_accents(self):
        """TC-SV-083: chuẩn hóa không dấu dùng cho tìm kiếm."""
        self.assertEqual(_strip_accents_lower("Đặt Cọc Ngay"), "dat coc ngay")

    def test_chat_mask_accent_insensitive(self):
        """TC-QTV-039 / BR-CH-09: che *** cả khi viết có dấu và không dấu."""
        out1 = filter_content_banned_words("Bạn cần đặt cọc 500k trước")
        out2 = filter_content_banned_words("ban can dat coc 500k truoc")
        for out in (out1, out2):
            text = out if isinstance(out, str) else (out[0] if isinstance(out, (list, tuple)) else str(out))
            self.assertIn("***", text, f"Không che từ cấm: {out}")
            self.assertNotIn("đặt cọc", text.lower())
            self.assertNotIn("dat coc", text.lower())

    def test_clean_text_not_masked(self):
        out = filter_content_banned_words("Ca sáng phục vụ quán cà phê")
        text = out if isinstance(out, str) else (out[0] if isinstance(out, (list, tuple)) else str(out))
        self.assertNotIn("***", text)

    def test_scan_job_concatenated_and_no_accent(self):
        """TC-QTV-039 / BR-NTD-05: quét được cụm viết liền >= 4 ký tự ('datcocngay')."""
        job = {"title": "Tuyển gấp", "description": "Yêu cầu datcocngay 500k để giữ chỗ"}
        hits = scan_job_banned_keywords(job, banned_keywords=["đặt cọc"])
        self.assertTrue(hits, "Không phát hiện từ cấm viết liền không dấu")

    def test_scan_clean_job(self):
        job = {"title": "Phục vụ ca sáng", "description": "Môi trường thân thiện"}
        self.assertEqual(scan_job_banned_keywords(job, banned_keywords=["đặt cọc", "nạp tiền"]), [])


class ChatRoomUnitTest(unittest.TestCase):
    """src/core/socket_service.py — BR-CH-10 phòng chat cô lập theo đơn."""

    def test_canonical_room_keeps_application_suffix(self):
        rid = canonicalize_room_id("room_emp_emp_abc_stu_user_xyz_app_app_123")
        self.assertIn("_app_app_123", rid)
        self.assertTrue(rid.startswith("room_emp_"))


if __name__ == "__main__":
    unittest.main()
