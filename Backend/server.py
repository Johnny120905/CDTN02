import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, send_from_directory
from flask.json.provider import DefaultJSONProvider
try:
    from flask_cors import CORS
except ImportError:
    # Minimal CORS fallback if flask_cors is not yet installed
    def CORS(app, **kwargs):
        @app.after_request
        def add_cors_headers(response):
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
            response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,PATCH,OPTIONS"
            return response

from src.core.config import Config
from src.core.socket_service import init_socketio, socketio
from src.api.auth.auth_routes import auth_bp
from src.api.student.student_routes import student_bp
from src.api.employer.employer_routes import employer_bp
from src.api.admin.admin_routes import admin_bp
from src.api.common.common_routes import common_bp

# Robust JSON Provider to automatically serialize MongoDB ObjectId and Date objects
class MongoJSONProvider(DefaultJSONProvider):
    def default(self, o):
        if type(o).__name__ == "ObjectId":
            return str(o)
        if hasattr(o, "isoformat"):
            return o.isoformat()
        return super().default(o)

# Path to built frontend
FRONTEND_DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

def create_app():
    app = Flask(__name__, static_folder=None)
    app.json_provider_class = MongoJSONProvider
    app.json = MongoJSONProvider(app)
    app.config.from_object(Config)

    # Enable CORS for React Vite frontend during development
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register Clean Architecture API Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(employer_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(common_bp)

    # Initialize Realtime Socket.IO Engine (WebRTC Signaling)
    init_socketio(app)

    # UNIFIED SINGLE-PORT ROUTE: SERVES BOTH FRONTEND & BACKEND ON THE SAME LOCALHOST
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend_and_spa(path):
        # 1. API routes that don't match any blueprint should 404
        if path.startswith("api"):
            return jsonify({"success": False, "message": "API endpoint không tồn tại."}), 404

        # 2. Check if a static file exists in frontend dist (e.g. assets/index.js, assets/index.css, favicon.ico)
        file_path = os.path.join(FRONTEND_DIST_DIR, path)
        if path and os.path.exists(file_path) and not os.path.isdir(file_path):
            return send_from_directory(FRONTEND_DIST_DIR, path)

        # 3. Critical: Do not serve index.html for missing media/document files (prevents iframe loading website)
        if path and any(path.lower().endswith(ext) for ext in [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".glb", ".zip"]):
            return jsonify({"success": False, "message": f"Tệp tài liệu '{path}' không tồn tại trên máy chủ."}), 404

        # 4. Serve index.html for Single Page Application client-side routing (HTML5 History API)
        index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return send_from_directory(FRONTEND_DIST_DIR, "index.html")

        # 5. Fallback info if frontend dist has not been built yet
        return jsonify({
            "service": "PARTIME.VN - Nền Tảng Tuyển Dụng Việc Làm Linh Hoạt (CDTN02)",
            "version": "2.0.0",
            "architecture": "Layered Clean Architecture",
            "status": "Backend running. Vui lòng chạy 'npm run build' trong frontend/ để kích hoạt giao diện Web 3D.",
            "roles": {
                "student": "Vũ Thế Long (Student Portal)",
                "employer": "Huỳnh Nguyễn Bảo Ngọc (Employer Portal)",
                "admin": "Lê Thị Thuỳ Ngân (Admin Portal)"
            },
            "constraint": "1 Real Email = 1 Role duy nhất (BR-AUTH-01)",
            "otp_ttl": "10 minutes (600s) với Hands-Free Auto-Fill",
            "device_sync": "PC, Laptop, iPad, Mobile"
        })

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "message": "Endpoint không tồn tại."}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"success": False, "message": "Lỗi máy chủ nội bộ.", "error": str(e)}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", Config.PORT or 8002))
    print(f"============================================================")
    print(f"  PARTIME.VN UNIFIED LOCALHOST SERVER (CDTN02)")
    print(f"  --> HỆ THỐNG PHÂN ĐỊNH 3 ĐƯỜNG DẪN WEB RIÊNG BIỆT CHO 3 ROLE:")
    print(f"      🎓 Web Sinh viên:       http://localhost:{port}/student  (hoặc http://localhost:{port}/)")
    print(f"      💼 Web Nhà tuyển dụng:  http://localhost:{port}/employer")
    print(f"      🛡️  Web Quản trị viên:   http://localhost:{port}/admin")
    print(f"      🔌 Backend API:         http://localhost:{port}/api/...")
    print(f"      ⚡ Realtime Socket.IO:  Enabled (WebRTC P2P Signaling)")
    print(f"============================================================")
    socketio.run(app, host="0.0.0.0", port=port, debug=Config.DEBUG, allow_unsafe_werkzeug=True)
