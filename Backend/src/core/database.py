import os
import sys
import json
import time
import uuid
import copy
from pymongo import MongoClient
from bson import ObjectId
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

class _SimpleUpdateResult:
    def __init__(self, matched_count=0, modified_count=0):
        self.matched_count = matched_count
        self.modified_count = modified_count

    def __bool__(self):
        return self.matched_count > 0

class _SimpleDeleteResult:
    def __init__(self, deleted_count=0):
        self.deleted_count = deleted_count

    def __bool__(self):
        return self.deleted_count > 0

class AtlasCursorAdapter:
    def __init__(self, cursor):
        self._cursor = cursor

    def sort(self, *args, **kwargs):
        self._cursor = self._cursor.sort(*args, **kwargs)
        return self

    def limit(self, n):
        self._cursor = self._cursor.limit(n)
        return self

    def skip(self, n):
        self._cursor = self._cursor.skip(n)
        return self

    def __iter__(self):
        for doc in self._cursor:
            if isinstance(doc, dict) and "_id" in doc:
                doc["_id"] = str(doc["_id"])
            yield doc

    def to_list(self):
        return list(self)

class AtlasCollectionAdapter:
    """
    Adapter cho PyMongo Collection giúp tự động đồng bộ _id dạng str và ObjectId,
    đảm bảo mọi thao tác tìm kiếm, sửa, xóa trên MongoDB Atlas luôn khớp chính xác
    100% và không bao giờ khôi phục lại dữ liệu đã xóa khi người dùng F5 hoặc đăng nhập lại.
    """
    def __init__(self, col):
        self._col = col

    def _expand_id(self, val):
        if isinstance(val, str) and len(val) == 24 and ObjectId.is_valid(val):
            return {"$in": [val, ObjectId(val)]}
        if isinstance(val, dict):
            new_v = {}
            for op, op_val in val.items():
                if op in ("$in", "$nin") and isinstance(op_val, list):
                    expanded = []
                    for item in op_val:
                        expanded.append(item)
                        if isinstance(item, str) and len(item) == 24 and ObjectId.is_valid(item):
                            expanded.append(ObjectId(item))
                    new_v[op] = expanded
                else:
                    new_v[op] = op_val
            return new_v
        return val

    def _normalize_query(self, query):
        if not query or not isinstance(query, dict):
            return query or {}
        norm = {}
        for k, v in query.items():
            if k in ("$or", "$and") and isinstance(v, list):
                norm[k] = [self._normalize_query(sub) for sub in v]
            elif k == "_id":
                norm[k] = self._expand_id(v)
            else:
                norm[k] = v
        return norm

    def insert_one(self, doc):
        doc_copy = copy.deepcopy(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(uuid.uuid4())
        return self._col.insert_one(doc_copy)

    def find_one(self, query=None, *args, **kwargs):
        res = self._col.find_one(self._normalize_query(query), *args, **kwargs)
        if isinstance(res, dict) and "_id" in res:
            res["_id"] = str(res["_id"])
        return res

    def find(self, query=None, *args, **kwargs):
        return AtlasCursorAdapter(self._col.find(self._normalize_query(query), *args, **kwargs))

    def count_documents(self, query=None):
        return self._col.count_documents(self._normalize_query(query))

    def update_one(self, query, update, upsert=False):
        return self._col.update_one(self._normalize_query(query), update, upsert=upsert)

    def update_many(self, query, update, upsert=False):
        return self._col.update_many(self._normalize_query(query), update, upsert=upsert)

    def delete_one(self, query):
        return self._col.delete_one(self._normalize_query(query))

    def delete_many(self, query):
        return self._col.delete_many(self._normalize_query(query))

    def create_index(self, *args, **kwargs):
        return self._col.create_index(*args, **kwargs)

class MemoryCollection:
    def __init__(self, name, on_change=None):
        self.name = name
        self.docs = []
        self.on_change = on_change

    def _save(self):
        if self.on_change:
            self.on_change()

    def insert_one(self, doc):
        doc_copy = copy.deepcopy(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(uuid.uuid4())
        else:
            doc_copy["_id"] = str(doc_copy["_id"])
        self.docs.append(doc_copy)
        self._save()
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
        for d in self.docs:
            if self._matches(d, query):
                if "$set" in update:
                    for k, v in update["$set"].items():
                        d[k] = copy.deepcopy(v)
                if "$push" in update:
                    for k, v in update["$push"].items():
                        if not isinstance(d.get(k), list):
                            d[k] = []
                        d[k].append(copy.deepcopy(v))
                self._save()
                return _SimpleUpdateResult(1, 1)
        if upsert and "$set" in update:
            new_doc = {k: v for k, v in (query or {}).items() if not str(k).startswith("$") and not isinstance(v, dict)}
            new_doc.update(copy.deepcopy(update["$set"]))
            self.insert_one(new_doc)
            return _SimpleUpdateResult(1, 1)
        return _SimpleUpdateResult(0, 0)

    def update_many(self, query, update, upsert=False):
        matched = 0
        for d in self.docs:
            if self._matches(d, query):
                matched += 1
                if "$set" in update:
                    for k, v in update["$set"].items():
                        d[k] = copy.deepcopy(v)
                if "$push" in update:
                    for k, v in update["$push"].items():
                        if not isinstance(d.get(k), list):
                            d[k] = []
                        d[k].append(copy.deepcopy(v))
        if matched > 0:
            self._save()
        return _SimpleUpdateResult(matched, matched)

    def delete_one(self, query):
        for i, d in enumerate(self.docs):
            if self._matches(d, query):
                del self.docs[i]
                self._save()
                return _SimpleDeleteResult(1)
        return _SimpleDeleteResult(0)

    def delete_many(self, query):
        count = 0
        rem = []
        for d in self.docs:
            if self._matches(d, query):
                count += 1
            else:
                rem.append(d)
        self.docs = rem
        if count > 0:
            self._save()
        return _SimpleDeleteResult(count)

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
        self.is_testing = "unittest" in sys.modules
        self.local_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "local_db_store.json"))
        self._saving_local = False
        self.memory_collections = {
            name: MemoryCollection(name, on_change=(None if self.is_testing else self._persist_local_store))
            for name in COLLECTIONS
        }
        self._atlas_adapters = {}
        self.connect()
        if not self.is_atlas and not self.is_testing:
            self._load_local_store()
        self.seed_initial_data()

    def _load_local_store(self):
        if not os.path.exists(self.local_db_path):
            return
        try:
            with open(self.local_db_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
            if isinstance(raw, dict):
                for name in COLLECTIONS:
                    if isinstance(raw.get(name), list):
                        self.memory_collections[name].docs = raw[name]
        except Exception as e:
            print(f"[Database] Could not load local store: {e}")

    def _persist_local_store(self):
        if self.is_testing or self._saving_local:
            return
        try:
            self._saving_local = True
            payload = {name: self.memory_collections[name].docs for name in COLLECTIONS}
            with open(self.local_db_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[Database] Could not save local store: {e}")
        finally:
            self._saving_local = False

    def connect(self):
        timeout_ms = 1500 if self.is_testing else 4000
        try:
            client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=timeout_ms)
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
            if name not in self._atlas_adapters:
                self._atlas_adapters[name] = AtlasCollectionAdapter(self.db[name])
            return self._atlas_adapters[name]
        if name not in self.memory_collections:
            self.memory_collections[name] = MemoryCollection(
                name, on_change=(None if self.is_testing else self._persist_local_store)
            )
        return self.memory_collections[name]

    def cascade_delete_user(self, user_id_or_email: str) -> bool:
        """
        Xóa vĩnh viễn tài khoản người dùng cùng toàn bộ hồ sơ, CV, tin đăng, đơn ứng tuyển,
        thông báo, đánh giá và dữ liệu liên quan để không bao giờ xuất hiện lại khi F5 hoặc đăng nhập lại.
        """
        target = str(user_id_or_email or "").strip()
        if not target:
            return False

        users_col = self.get_collection("users")
        user_doc = users_col.find_one({"$or": [{"_id": target}, {"email": target.lower()}]})
        uid = user_doc["_id"] if user_doc else target
        u_email = str(user_doc.get("email", "")).lower() if user_doc else (target.lower() if "@" in target else "")

        deleted_any = False
        if user_doc:
            users_col.delete_one({"_id": uid})
            deleted_any = True
        else:
            r1 = users_col.delete_many({"$or": [{"_id": uid}, {"email": target.lower()}]})
            if getattr(r1, "deleted_count", 0) > 0:
                deleted_any = True

        # Xóa hồ sơ sinh viên và dữ liệu phụ thuộc
        stu_col = self.get_collection("student_profiles")
        stu_docs = list(stu_col.find({"user_id": uid}))
        stu_ids = [s["_id"] for s in stu_docs] + [uid]
        stu_col.delete_many({"user_id": uid})

        self.get_collection("resumes").delete_many({"student_id": {"$in": stu_ids}})
        self.get_collection("cover_letters").delete_many({"student_id": {"$in": stu_ids}})
        self.get_collection("bookmarks").delete_many({"student_id": {"$in": stu_ids}})
        self.get_collection("applications").delete_many({
            "$or": [{"student_id": {"$in": stu_ids}}, {"student_user_id": uid}]
        })

        # Xóa hồ sơ doanh nghiệp và tin tuyển dụng phụ thuộc
        emp_col = self.get_collection("employers")
        emp_docs = list(emp_col.find({"user_id": uid}))
        emp_ids = [ed["_id"] for ed in emp_docs]
        if emp_ids:
            self.get_collection("company_profiles").delete_many({"employer_id": {"$in": emp_ids}})
            emp_jobs = list(self.get_collection("jobs").find({"employer_id": {"$in": emp_ids}}))
            emp_job_ids = [j["_id"] for j in emp_jobs]
            if emp_job_ids:
                self.get_collection("bookmarks").delete_many({"job_id": {"$in": emp_job_ids}})
                self.get_collection("applications").delete_many({"job_id": {"$in": emp_job_ids}})
                self.get_collection("reports").delete_many({"target_id": {"$in": emp_job_ids}})
            self.get_collection("jobs").delete_many({"employer_id": {"$in": emp_ids}})
            self.get_collection("applications").delete_many({"employer_id": {"$in": emp_ids}})
        emp_col.delete_many({"user_id": uid})

        # Xóa đánh giá, thông báo, tin nhắn, báo cáo liên quan
        all_related_ids = list(set([uid] + stu_ids + emp_ids))
        self.get_collection("reviews").delete_many({
            "$or": [{"reviewer_id": {"$in": all_related_ids}}, {"target_id": {"$in": all_related_ids}}]
        })
        self.get_collection("notifications").delete_many({"user_id": {"$in": all_related_ids}})
        self.get_collection("reports").delete_many({
            "$or": [{"reporter_id": {"$in": all_related_ids}}, {"target_id": {"$in": all_related_ids}}]
        })
        msg_or = [{"sender_id": {"$in": all_related_ids}}]
        if u_email:
            msg_or.append({"sender_email": u_email})
        self.get_collection("messages").delete_many({"$or": msg_or})
        return deleted_any

    def seed_initial_data(self):
        from src.core.security import hash_password

        # Dọn dẹp vĩnh viễn tài khoản eadeedc@gmail.com (user_student_486c9bf4) theo yêu cầu Quản trị viên
        self.cascade_delete_user("eadeedc@gmail.com")
        self.cascade_delete_user("user_student_486c9bf4")

        # Xóa các danh mục mẫu địa điểm dư thừa cũ (loc_1..loc_5)
        cat_col = self.get_collection("categories")
        cat_col.delete_many({"_id": {"$in": ["loc_1", "loc_2", "loc_3", "loc_4", "loc_5"]}})

        notif_col = self.get_collection("notifications")
        already_seeded = (not self.is_testing) and (notif_col.find_one({"_id": "_system_seed_v2"}) is not None)

        # 1. Categories seed (Master Data) - Chỉ khởi tạo lần đầu để không phục hồi lại các mục Admin đã xóa
        if not already_seeded and cat_col.count_documents({}) == 0:
            sample_cats = [
                {"_id": "cat_1", "name": "Pha chế & Barista", "type": "job", "is_active": True},
                {"_id": "cat_2", "name": "Gia sư & Trợ giảng", "type": "job", "is_active": True},
                {"_id": "cat_3", "name": "Bán lẻ & Thu ngân", "type": "job", "is_active": True},
                {"_id": "cat_4", "name": "Thực tập sinh CNTT", "type": "job", "is_active": True},
                {"_id": "cat_5", "name": "Content & Marketing", "type": "job", "is_active": True},
                {"_id": "cat_6", "name": "Phục vụ & Nhà hàng", "type": "job", "is_active": True}
            ]
            for c in sample_cats:
                cat_col.insert_one(c)

        # 2. Banned keywords seed - Chỉ khởi tạo lần đầu
        ban_col = self.get_collection("banned_keywords")
        if not already_seeded and ban_col.count_documents({}) == 0:
            keywords = ["đặt cọc", "nạp tiền", "hoa hồng khủng", "telegram lôi kéo", "chuyển khoản trước", "cờ bạc", "mua tài khoản"]
            for kw in keywords:
                ban_col.insert_one({"_id": f"bkw_{uuid.uuid4().hex[:8]}", "keyword": kw, "created_at": time.strftime("%Y-%m-%d %H:%M:%S")})

        # 3. Seed Users for 3 Roles (Chỉ giữ tài khoản thực có đuôi @gmail.com, xóa toàn bộ tài khoản giả lập)
        users_col = self.get_collection("users")
        if not self.is_testing:
            non_gmail_users = [
                u for u in list(users_col.find({}))
                if not str(u.get("email", "")).strip().lower().endswith("@gmail.com")
            ]
            for u in non_gmail_users:
                self.cascade_delete_user(u.get("_id"))

        if not already_seeded:
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
                existing_emp_u = users_col.find_one({"email": e["email"]})
                uid_ref = existing_emp_u["_id"] if existing_emp_u else e["id"]
                if not emp_col.find_one({"user_id": uid_ref}):
                    emp_col.insert_one({
                        "_id": f"emp_{uid_ref}",
                        "user_id": uid_ref,
                        "approval_status": "approved",
                        "reject_reason": ""
                    })

            comp_col = self.get_collection("company_profiles")
            for e in emp_users:
                existing_emp_u = users_col.find_one({"email": e["email"]})
                uid_ref = existing_emp_u["_id"] if existing_emp_u else e["id"]
                emp_rec = emp_col.find_one({"user_id": uid_ref})
                emp_id_ref = emp_rec["_id"] if emp_rec else f"emp_{uid_ref}"
                if not comp_col.find_one({"employer_id": emp_id_ref}):
                    comp_col.insert_one({
                        "_id": f"comp_{uid_ref}",
                        "employer_id": emp_id_ref,
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

        # Dọn dẹp toàn bộ tin tuyển dụng giả lập hoặc mồ côi và báo cáo mẫu cũ
        valid_emp_ids = {ed["_id"] for ed in self.get_collection("employers").find({})}
        jobs_col = self.get_collection("jobs")
        for j in list(jobs_col.find({})):
            if j.get("_id") in ["job_1", "job_2", "job_3", "job_4", "job_5", "job_6"] or j.get("employer_id") not in valid_emp_ids:
                jobs_col.delete_one({"_id": j["_id"]})

        rep_col = self.get_collection("reports")
        rep_col.delete_many({"_id": "rep_1"})

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

        if not self.is_testing and not already_seeded:
            notif_col.update_one(
                {"_id": "_system_seed_v2"},
                {"$set": {"user_id": "_system", "is_deleted": True, "created_at": time.strftime("%Y-%m-%d %H:%M:%S")}},
                upsert=True
            )

db_manager = DatabaseManager()

