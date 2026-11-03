import time
import uuid
import copy
from pymongo import MongoClient
from src.core.config import Config

# The 16 collections specified in ERD and MongoDB Compass screenshot
COLLECTIONS = [
    "users",
    "student_profiles",
    "employers",
    "company_profiles",
    "cover_letters",
    "resumes",
    "jobs",
    "categories",
    "bookmarks",
    "applications",
    "reviews",
    "chat_rooms",
    "messages",
    "notifications",
    "reports",
    "banned_keywords"
]

class MemoryCollection:
    def __init__(self, name):
        self.name = name
        self.docs = []

    def insert_one(self, doc):
        doc_copy = copy.deepcopy(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(uuid.uuid4())
        else:
            doc_copy["_id"] = str(doc_copy["_id"])
        self.docs.append(doc_copy)
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc_copy["_id"])

    def find_one(self, query=None):
        query = query or {}
        for d in self.docs:
            if self._matches(d, query):
                return copy.deepcopy(d)
        return None

    def find(self, query=None):
        query = query or {}
        res = [copy.deepcopy(d) for d in self.docs if self._matches(d, query)]
        return MemoryCursor(res)

    def count_documents(self, query=None):
        query = query or {}
        return len([d for d in self.docs if self._matches(d, query)])

    def update_one(self, query, update, upsert=False):
        for i, d in enumerate(self.docs):
            if self._matches(d, query):
                if "$set" in update:
                    for k, v in update["$set"].items():
                        d[k] = copy.deepcopy(v)
                return True
        if upsert and "$set" in update:
            new_doc = copy.deepcopy(query)
            new_doc.update(update["$set"])
            self.insert_one(new_doc)
            return True
        return False

    def delete_one(self, query):
        for i, d in enumerate(self.docs):
            if self._matches(d, query):
                del self.docs[i]
                return True
        return False

    def delete_many(self, query):
        count = 0
        rem = []
        for d in self.docs:
            if self._matches(d, query):
                count += 1
            else:
                rem.append(d)
        self.docs = rem
        class DeleteResult:
            def __init__(self, deleted_count):
                self.deleted_count = deleted_count
        return DeleteResult(count)

    def create_index(self, keys, **kwargs):
        pass

    def _matches(self, doc, query):
        for k, v in query.items():
            if k == "$or":
                if not any(self._matches(doc, sub_q) for sub_q in v):
                    return False
            elif isinstance(v, dict):
                doc_val = doc.get(k)
                if "$regex" in v:
                    import re
                    pattern = v["$regex"]
                    options = re.IGNORECASE if v.get("$options") == "i" else 0
                    if not doc_val or not re.search(pattern, str(doc_val), options):
                        return False
                elif "$in" in v:
                    if doc_val not in v["$in"]:
                        return False
                elif "$nin" in v:
                    if doc_val in v["$nin"]:
                        return False
                elif "$ne" in v:
                    if doc_val == v["$ne"]:
                        return False
                elif "$gte" in v:
                    if doc_val is None or doc_val < v["$gte"]:
                        return False
                elif "$lte" in v:
                    if doc_val is None or doc_val > v["$lte"]:
                        return False
            else:
                if str(doc.get(k)) != str(v):
                    return False
        return True

class MemoryCursor:
    def __init__(self, data):
        self.data = data

    def sort(self, field, direction=1):
        try:
            self.data.sort(key=lambda x: x.get(field) or "", reverse=(direction == -1))
        except Exception:
            pass
        return self

    def limit(self, n):
        self.data = self.data[:n]
        return self

    def skip(self, n):
        self.data = self.data[n:]
        return self

    def __iter__(self):
        return iter(self.data)

    def to_list(self):
        return self.data

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_atlas = False
        self.memory_collections = {name: MemoryCollection(name) for name in COLLECTIONS}
        self.connect()
        self.seed_initial_data()

    def connect(self):
        try:
            client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=2000)
            client.admin.command('ping')
            self.client = client
            self.db = client[Config.DATABASE_NAME]
            self.is_atlas = True
            print(f"[Database] Successfully connected to MongoDB Atlas '{Config.DATABASE_NAME}'")
        except Exception as e:
            self.is_atlas = False
            print(f"[Database] MongoDB Atlas unreachable ({e}). Using resilient Local Document Store with all 16 collections.")

    def get_collection(self, name: str):
        if self.is_atlas and self.db is not None:
            return self.db[name]
        return self.memory_collections.get(name)

    def seed_initial_data(self):
        from src.core.security import hash_password
        
        # 1. Categories & Locations seed (Master Data 3.7)
        cat_col = self.get_collection("categories")
        if cat_col.count_documents({}) == 0:
            sample_cats = [
                {"_id": "cat_1", "name": "Pha chế & Barista", "type": "job", "is_active": True},
                {"_id": "cat_2", "name": "Gia sư & Trợ giảng", "type": "job", "is_active": True},
                {"_id": "cat_3", "name": "Bán lẻ & Thu ngân", "type": "job", "is_active": True},
                {"_id": "cat_4", "name": "Thực tập sinh CNTT", "type": "job", "is_active": True},
                {"_id": "cat_5", "name": "Content & Marketing", "type": "job", "is_active": True},
                {"_id": "cat_6", "name": "Phục vụ & Nhà hàng", "type": "job", "is_active": True},
                # Master Data - Địa điểm
                {"_id": "loc_1", "name": "Quận 1, TP.HCM", "type": "location", "is_active": True},
                {"_id": "loc_2", "name": "Quận 3, TP.HCM", "type": "location", "is_active": True},
                {"_id": "loc_3", "name": "Bình Thạnh, TP.HCM", "type": "location", "is_active": True},
                {"_id": "loc_4", "name": "TP. Thủ Đức, TP.HCM", "type": "location", "is_active": True},
                {"_id": "loc_5", "name": "Gò Vấp, TP.HCM", "type": "location", "is_active": True}
            ]
            for c in sample_cats:
                cat_col.insert_one(c)

        # 2. Banned keywords seed (FR 3.9)
        ban_col = self.get_collection("banned_keywords")
        if ban_col.count_documents({}) == 0:
            keywords = ["đặt cọc", "nạp tiền", "hoa hồng khủng", "telegram lôi kéo", "chuyển khoản trước", "cờ bạc", "mua tài khoản"]
            for kw in keywords:
                ban_col.insert_one({"_id": f"bkw_{uuid.uuid4().hex[:8]}", "keyword": kw, "created_at": time.strftime("%Y-%m-%d %H:%M:%S")})

        # 3. Seed Users for 3 Roles (Tài khoản thật 3 thành viên: Long - Ngọc - Ngân)
        users_col = self.get_collection("users")
        # Xóa các tài khoản giả lập cũ (Chỉ giữ 3 tài khoản thành viên thật)
        users_col.delete_many({"email": {"$in": ["student@partime.vn", "employer@partime.vn", "admin@partime.vn"]}})
        
        # Sinh viên thật: Vũ Thế Long (vuthelong1009@gmail.com - Pass: Long123!)
        stu_users = [
            {"email": "vuthelong1009@gmail.com", "pass": "Long123!", "id": "user_student_a6d3906d"}
        ]
        for s in stu_users:
            if not users_col.find_one({"email": s["email"]}):
                users_col.insert_one({
                    "_id": s["id"],
                    "email": s["email"],
                    "password_hash": hash_password(s["pass"]),
                    "role": "student",
                    "status": "active",
                    "is_banned": False,
                    "ban_reason": "",
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
                })
            else:
                users_col.update_one({"email": s["email"]}, {"$set": {"role": "student", "is_banned": False}})

        # Nhà tuyển dụng: Huỳnh Nguyễn Bảo Ngọc (huynhnguyenbaongoc2k5@gmail.com - Pass: Huynh120905!)
        emp_users = [
            {"email": "huynhnguyenbaongoc2k5@gmail.com", "pass": "Huynh120905!", "id": "user_employer_347d84ed"}
        ]
        for e in emp_users:
            if not users_col.find_one({"email": e["email"]}):
                users_col.insert_one({
                    "_id": e["id"],
                    "email": e["email"],
                    "password_hash": hash_password(e["pass"]),
                    "role": "employer",
                    "status": "active",
                    "is_banned": False,
                    "ban_reason": "",
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
                })
            else:
                users_col.update_one({"email": e["email"]}, {"$set": {"password_hash": hash_password(e["pass"]), "role": "employer", "is_banned": False}})

        emp_col = self.get_collection("employers")
        for e in emp_users:
            if not emp_col.find_one({"user_id": e["id"]}):
                emp_col.insert_one({
                    "_id": f"emp_{e['id']}",
                    "user_id": e["id"],
                    "approval_status": "approved",
                    "reject_reason": ""
                })

        comp_col = self.get_collection("company_profiles")
        for e in emp_users:
            if not comp_col.find_one({"employer_id": f"emp_{e['id']}"}):
                comp_col.insert_one({
                    "_id": f"comp_{e['id']}",
                    "employer_id": f"emp_{e['id']}",
                    "company_name": "Phúc Long Coffee & Tea",
                    "representative_name": "Huỳnh Nguyễn Bảo Ngọc",
                    "branch_name": "Chi nhánh Bến Nghé, Quận 1, TP.HCM",
                    "description": "Chuỗi cửa hàng trà & cà phê hàng đầu, môi trường năng động, thân thiện và tạo điều kiện tối đa cho sinh viên làm việc theo ca học.",
                    "scale": "50-200 nhân viên",
                    "address": "42 Ngô Đức Kế, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
                    "business_license": "0314567890",
                    "business_license_url": "/uploads/GPKD_PhucLong_0314567890.pdf",
                    "logo_url": "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=120&auto=format&fit=crop&q=80",
                    "cover_image_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80"
                })

        # Không tạo dữ liệu giả lập jobs, applications, reviews, notifications
        # Người dùng tự đăng tin, nộp hồ sơ, đánh giá và nhận thông báo thực tế.


        # Báo cáo vi phạm mẫu (Tickets 3.8)
        rep_col = self.get_collection("reports")
        if rep_col.count_documents({}) == 0:
            rep_col.insert_one({
                "_id": "rep_1",
                "ticket_code": "TK-2026-001",
                "type": "job", # job | applicant | chat
                "reporter_id": "user_student_long",
                "reporter_name": "Vũ Thế Long",
                "target_id": "job_3",
                "target_title": "Tin tuyển dụng có dấu hiệu yêu cầu nộp cọc đồng phục",
                "reason": "Tin đăng bên ngoài nghi vấn thu phí đồng phục trái quy định cấm đặt cọc của PARTIME.VN",
                "status": "pending", # pending | resolved | dismissed
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
            })

        # Quản trị viên: Lê Thị Thuỳ Ngân - Cố định Gmail & Mật khẩu (lethithuyngan985@gmail.com - Pass: Le090805!)
        admin_users = [
            {"email": "lethithuyngan985@gmail.com", "pass": "Le090805!", "id": "user_admin_ngan"}
        ]
        for a in admin_users:
            if not users_col.find_one({"email": a["email"]}):
                users_col.insert_one({
                    "_id": a["id"],
                    "email": a["email"],
                    "password_hash": hash_password(a["pass"]),
                    "role": "admin",
                    "status": "active",
                    "is_banned": False,
                    "ban_reason": "",
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
                })
            else:
                users_col.update_one(
                    {"email": a["email"]},
                    {"$set": {"password_hash": hash_password(a["pass"]), "role": "admin", "is_banned": False}}
                )

db_manager = DatabaseManager()

