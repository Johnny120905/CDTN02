import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Tải các biến môi trường từ file .env
load_dotenv()

# Lấy chuỗi kết nối MONGO_URI từ file .env
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("Không tìm thấy MONGO_URI trong file .env! Vui lòng kiểm tra lại.")

# Khởi tạo kết nối MongoDB Client
client = MongoClient(MONGO_URI)

# Kết nối trực tiếp vào database tên là CDTN02
db = client["CDTN02"]