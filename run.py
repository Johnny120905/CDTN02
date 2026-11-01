#!/usr/bin/env python3
"""
PARTIME.VN - UNIFIED LOCALHOST RUNNER (CDTN02)
Chạy cả Frontend (React + Vite + Web 3D) và Backend (Flask + Clean Architecture + MongoDB)
trên CÙNG 1 LOCALHOST: http://localhost:8002
"""

import os
import sys
import subprocess
import webbrowser
import time

# Đảm bảo mã hóa UTF-8 tuyệt đối trên terminal Windows để tránh crash UnicodeEncodeError
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
FRONTEND_DIST = os.path.join(FRONTEND_DIR, "dist")
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

def ensure_frontend_built():
    """Kiểm tra và tự động build frontend nếu dist chưa tồn tại."""
    index_html = os.path.join(FRONTEND_DIST, "index.html")
    if not os.path.exists(index_html):
        print("[Unified Runner] Chưa tìm thấy frontend/dist. Đang tiến hành build tự động...")
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        try:
            subprocess.run([npm_cmd, "run", "build"], cwd=FRONTEND_DIR, check=True)
            print("[Unified Runner] Build Frontend thành công!")
        except Exception as e:
            print(f"[Unified Runner] Cảnh báo không thể tự build: {e}")
            print("[Unified Runner] Bạn có thể chạy thủ công 'cd frontend; npm run build'")

def main():
    os.environ["PYTHONIOENCODING"] = "utf-8"
    ensure_frontend_built()

    port = 8002
    host = "127.0.0.1"
    url = f"http://localhost:{port}"

    print("=" * 68)
    print("  PARTIME.VN - NỀN TẢNG TUYỂN DỤNG VIỆC LÀM LINH HOẠT CHO SINH VIÊN")
    print("  ĐỀ TÀI: CHUYÊN ĐỀ TỐT NGHIỆP 2 (CDTN02) - ĐH VĂN LANG")
    print("=" * 68)
    print(f"  👉 CẢ FRONTEND VÀ BACKEND CHẠY TRÊN CÙNG 1 ĐỊA CHỈ DUY NHẤT:")
    print(f"     🌐 {url}   (hoặc http://{host}:{port})")
    print("=" * 68)
    print("  Phân hệ 3 thành viên:")
    print("    🎓 Sinh viên:        Vũ Thế Long        (WBS 1.1 -> 1.10)")
    print("    💼 Nhà tuyển dụng:   Huỳnh Nguyễn Bảo Ngọc (WBS 2.1 -> 2.9)")
    print("    🛡️  Quản trị viên:    Lê Thị Thuỳ Ngân   (WBS 3.1 -> 3.9)")
    print("-" * 68)
    print("  Tính năng nổi bật:")
    print("    ✨ Web 3D Three.js Logo tương tác đa chiều")
    print("    🔒 Ràng buộc: 1 Email thật chỉ dùng cho đúng 1 Role duy nhất")
    print("    ⏱️  Mã xác thực OTP 10 phút, đếm ngược tự động & Tự động điền")
    print("    📱 Đồng bộ đa nền tảng: PC, Laptop, iPad, Mobile (Drawer & Dock)")
    print("=" * 68)
    print(f"  Đang khởi động máy chủ Flask tại cổng {port}...")
    print("  Nhấn CTRL + C trong terminal để dừng server.\n")

    # Add backend to sys.path and start server
    sys.path.insert(0, BACKEND_DIR)
    from server import create_app
    app = create_app()

    # Tự động mở trình duyệt web sau khi server sẵn sàng
    import threading
    def auto_open():
        time.sleep(1.2)
        try:
            webbrowser.open(url)
        except Exception:
            pass
    threading.Thread(target=auto_open, daemon=True).start()

    try:
        app.run(host="0.0.0.0", port=port, debug=False)
    except KeyboardInterrupt:
        print("\n[Unified Runner] Đã dừng server.")

if __name__ == "__main__":
    main()

