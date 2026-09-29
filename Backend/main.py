from fastapi import FastAPI
from config.db import db  # Import kết nối database từ file db.py vừa tạo

app = FastAPI(title="CDTN02 Backend API")

@app.get("/")
def read_root():
    return {
        "message": "Chào mừng nhóm CDTN02 (Long, Ngọc, Ngân)! Backend đã kết nối thành công tới MongoDB."
    }

@app.get("/test-db")
def test_database():
    try:
        # Thử lấy danh sách các collection trong database CDTN02 để kiểm tra sống chết của kết nối
        collections = db.list_collection_names()
        return {
            "status": "Kết nối Database thành công!",
            "database_name": db.name,
            "collections": collections
        }
    except Exception as e:
        return {"status": "Kết nối thất bại", "error": str(e)}