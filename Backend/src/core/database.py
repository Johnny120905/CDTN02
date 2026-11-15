import os
import sys
import json
import time
import uuid
import copy
import base64
import hashlib
import threading
from concurrent.futures import ThreadPoolExecutor
import gridfs
from gridfs.errors import NoFile
from pymongo import MongoClient
from bson import ObjectId
from src.core.config import Config

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10MB

# Bộ nhớ đệm RAM cho các chuỗi data:... (PDF/Ảnh Base64 lớn) để cắt khỏi JSON danh sách
_INLINE_BLOB_STORE = {}
_INLINE_BLOB_LOCK = threading.RLock()


def _fast_doc_copy(doc):
    """Sao chép nông 2 tầng siêu tốc (nhanh hơn copy.deepcopy ~20 lần) cho document dict."""
    if not isinstance(doc, dict):
        return doc
    out = {}
    for k, v in doc.items():
        if isinstance(v, dict):
            out[k] = dict(v)
        elif isinstance(v, list):
            out[k] = [dict(x) if isinstance(x, dict) else x for x in v]
        else:
            out[k] = v
    return out


def _offload_base64_value(val: str, default_name: str = "document.pdf") -> str:
    """Nếu giá trị là chuỗi data:... Base64 lớn (> 2KB), chuyển sang lưu RAM và trả về URL /api/files/inline_<hash>."""
    if not isinstance(val, str) or len(val) <= 2048 or not val.startswith("data:") or "," not in val:
        return val
    if val.startswith("data:image/svg+xml"):
        return val
    fid = "inline_" + hashlib.sha1(val.encode("utf-8", errors="ignore")).hexdigest()[:24]
    with _INLINE_BLOB_LOCK:
        if fid not in _INLINE_BLOB_STORE:
            try:
                header, raw_b64 = val.split(",", 1)
                mime_part = header[5:].split(";", 1)[0].strip().lower() or "application/pdf"
                if mime_part == "image/jpg":
                    mime_part = "image/jpeg"
                raw_bytes = base64.b64decode(raw_b64)
                ext = "pdf" if "pdf" in mime_part else ("png" if "png" in mime_part else "jpg")
                fname = default_name if default_name else f"file.{ext}"
                if "." not in fname:
                    fname = f"{fname}.{ext}"
                _INLINE_BLOB_STORE[fid] = {
                    "data": raw_bytes,
                    "filename": fname,
                    "content_type": mime_part,
                    "length": len(raw_bytes),
                }
            except Exception:
                return val
    return f"/api/files/{fid}"


def _sanitize_doc_blobs(doc):
    """Chuẩn hóa _id thành chuỗi và tách mọi chuỗi Base64 nặng (>2KB) ra khỏi bản ghi danh sách."""
    if not isinstance(doc, dict):
        return doc
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    url_fields = (
        ("file_url", doc.get("file_name") or "CV_UngVien.pdf"),
        ("cv_url", doc.get("cv_name") or "CV_UngVien.pdf"),
        ("business_license_url", doc.get("business_license_name") or "GPKD_DoanhNghiep.pdf"),
        ("license_url", doc.get("license_name") or "GPKD_DoanhNghiep.pdf"),
        ("logo_url", "logo.png"),
        ("cover_image_url", "cover.jpg"),
        ("avatar_url", "avatar.png"),
        ("media_url", doc.get("file_name") or "attachment.pdf"),
    )
    for field_name, def_fname in url_fields:
        val = doc.get(field_name)
        if isinstance(val, str) and len(val) > 2048 and val.startswith("data:"):
            doc[field_name] = _offload_base64_value(val, def_fname)

    snap = doc.get("application_snapshot")
    if isinstance(snap, dict):
        for s_field in ("cv_url", "cv_file", "file_url"):
            s_val = snap.get(s_field)
            if isinstance(s_val, str) and len(s_val) > 2048 and s_val.startswith("data:"):
                snap[s_field] = _offload_base64_value(s_val, snap.get("cv_name") or "CV_UngVien.pdf")
    return doc

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
    "banned_keywords",
    "audit_logs",
    "announcements"
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
    def __init__(self, adapter, raw_query, args=(), kwargs=None):
        self._adapter = adapter
        self._raw_query = raw_query or {}
        self._args = args
        self._kwargs = kwargs or {}
        self._sort_spec = []
        self._limit_n = None
        self._skip_n = None

    def sort(self, *args, **kwargs):
        self._sort_spec.append((args, kwargs))
        return self

    def limit(self, n):
        self._limit_n = n
        return self

    def skip(self, n):
        self._skip_n = n
        return self

    def __iter__(self):
        cache_key = (
            "find",
            json.dumps(self._raw_query, sort_keys=True, default=str),
            repr(self._sort_spec),
            self._limit_n,
            self._skip_n,
        )
        hit, cached_docs = self._adapter._get_cached(cache_key)
        if hit and cached_docs is not None:
            for doc in cached_docs:
                yield _fast_doc_copy(doc)
            return

        mirror_docs = self._adapter._get_mirror_docs()
        if not self._raw_query:
            matched = list(mirror_docs)
        else:
            matched = [d for d in mirror_docs if MemoryCollection._matches_static(d, self._raw_query)]

        for s_args, _ in reversed(self._sort_spec):
            if s_args:
                first_arg = s_args[0]
                if isinstance(first_arg, str):
                    direction = s_args[1] if len(s_args) > 1 else 1
                    try:
                        matched.sort(key=lambda x: str(x.get(first_arg) or ""), reverse=(direction == -1))
                    except Exception:
                        pass
                elif isinstance(first_arg, list):
                    for field, direction in reversed(first_arg):
                        try:
                            matched.sort(key=lambda x: str(x.get(field) or ""), reverse=(direction == -1))
                        except Exception:
                            pass

        if self._skip_n is not None:
            matched = matched[self._skip_n:]
        if self._limit_n is not None:
            matched = matched[:self._limit_n]

        self._adapter._set_cached(cache_key, matched)
        for doc in matched:
            yield _fast_doc_copy(doc)

    def to_list(self):
        return list(self)

class AtlasCollectionAdapter:
    """
    Adapter cho PyMongo Collection giúp:
    1. Giữ bản sao dữ liệu (In-Memory Mirror) trong RAM với TTL 300s + làm mới ngầm (Stale-While-Revalidate).
    2. Cập nhật tức thì cả trong RAM lẫn trên MongoDB Atlas khi có thao tác Ghi (insert/update/delete).
    3. Cắt bỏ chuỗi Base64 nặng khỏi bản ghi danh sách và bỏ copy.deepcopy dư thừa, giúp mọi truy vấn phản hồi < 1ms.
    """
    CACHE_TTL = 300.0

    def __init__(self, col):
        self._col = col
        self._cache = {}
        self._docs_mirror = None
        self._mirror_ts = 0.0
        self._refreshing = False
        self._lock = threading.RLock()
        self._fetch_lock = threading.Lock()

    def seed_from_snapshot(self, docs):
        """Nạp tức thì từ bản chụp ổ cứng cục bộ trong lúc chờ luồng ngầm đồng bộ từ MongoDB Atlas."""
        with self._lock:
            if self._docs_mirror is None and isinstance(docs, list):
                self._docs_mirror = [_sanitize_doc_blobs(d) for d in docs if isinstance(d, dict)]
                self._mirror_ts = time.monotonic() - (self.CACHE_TTL - 30.0)
                self._cache.clear()

    def invalidate_cache(self):
        with self._lock:
            self._cache.clear()

    def _load_mirror_from_atlas(self):
        with self._fetch_lock:
            raw_docs = list(self._col.find({}))
            cleaned = [_sanitize_doc_blobs(d) for d in raw_docs if isinstance(d, dict)]
            with self._lock:
                self._docs_mirror = cleaned
                self._mirror_ts = time.monotonic()
                self._cache.clear()
                self._refreshing = False
            return cleaned

    def _refresh_mirror_async(self):
        def _worker():
            try:
                self._load_mirror_from_atlas()
            except Exception:
                with self._lock:
                    self._refreshing = False
        t = threading.Thread(target=_worker, daemon=True)
        t.start()

    def _get_mirror_docs(self):
        now = time.monotonic()
        with self._lock:
            if self._docs_mirror is not None:
                if (now - self._mirror_ts > self.CACHE_TTL) and not self._refreshing:
                    self._refreshing = True
                    self._refresh_mirror_async()
                return self._docs_mirror
        return self._load_mirror_from_atlas()

    def _get_cached(self, key):
        now = time.monotonic()
        with self._lock:
            entry = self._cache.get(key)
            if entry is not None:
                ts, val = entry
                if now - ts <= self.CACHE_TTL:
                    return True, val
                self._cache.pop(key, None)
        return False, None

    def _set_cached(self, key, val):
        with self._lock:
            if len(self._cache) > 1024:
                self._cache.clear()
            self._cache[key] = (time.monotonic(), val)

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
        doc_copy = _fast_doc_copy(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(uuid.uuid4())
        else:
            doc_copy["_id"] = str(doc_copy["_id"])
        res = self._col.insert_one(_fast_doc_copy(doc_copy))
        sanitized = _sanitize_doc_blobs(doc_copy)
        with self._lock:
            if self._docs_mirror is not None:
                self._docs_mirror.append(sanitized)
            self._cache.clear()
        return res

    def find_one(self, query=None, *args, **kwargs):
        raw_q = query or {}
        cache_key = ("find_one", json.dumps(raw_q, sort_keys=True, default=str))
        hit, cached_val = self._get_cached(cache_key)
        if hit:
            return _fast_doc_copy(cached_val)
        mirror_docs = self._get_mirror_docs()
        for d in mirror_docs:
            if MemoryCollection._matches_static(d, raw_q):
                self._set_cached(cache_key, d)
                return _fast_doc_copy(d)
        self._set_cached(cache_key, None)
        return None

    def find(self, query=None, *args, **kwargs):
        return AtlasCursorAdapter(self, query or {}, args=args, kwargs=kwargs)

    def count_documents(self, query=None):
        raw_q = query or {}
        cache_key = ("count", json.dumps(raw_q, sort_keys=True, default=str))
        hit, cached_cnt = self._get_cached(cache_key)
        if hit:
            return cached_cnt
        mirror_docs = self._get_mirror_docs()
        if not raw_q:
            cnt = len(mirror_docs)
        else:
            cnt = sum(1 for d in mirror_docs if MemoryCollection._matches_static(d, raw_q))
        self._set_cached(cache_key, cnt)
        return cnt

    def _apply_update_to_doc(self, d, update):
        if "$set" in update and isinstance(update["$set"], dict):
            for k, v in update["$set"].items():
                if "." in k:
                    parts = k.split(".")
                    curr = d
                    for p in parts[:-1]:
                        if not isinstance(curr.get(p), dict):
                            curr[p] = {}
                        curr = curr[p]
                    curr[parts[-1]] = v
                else:
                    d[k] = v
        if "$push" in update and isinstance(update["$push"], dict):
            for k, v in update["$push"].items():
                if not isinstance(d.get(k), list):
                    d[k] = []
                d[k].append(_fast_doc_copy(v))
        _sanitize_doc_blobs(d)

    def update_one(self, query, update, upsert=False):
        res = self._col.update_one(self._normalize_query(query), update, upsert=upsert)
        raw_q = query or {}
        with self._lock:
            if self._docs_mirror is not None:
                updated = False
                for d in self._docs_mirror:
                    if MemoryCollection._matches_static(d, raw_q):
                        self._apply_update_to_doc(d, update)
                        updated = True
                        break
                if not updated and upsert and "$set" in update:
                    new_doc = {k: v for k, v in raw_q.items() if not str(k).startswith("$") and not isinstance(v, dict)}
                    new_doc.update(_fast_doc_copy(update["$set"]))
                    if "_id" not in new_doc:
                        new_doc["_id"] = str(uuid.uuid4())
                    else:
                        new_doc["_id"] = str(new_doc["_id"])
                    self._docs_mirror.append(_sanitize_doc_blobs(new_doc))
            self._cache.clear()
        return res

    def update_many(self, query, update, upsert=False):
        res = self._col.update_many(self._normalize_query(query), update, upsert=upsert)
        raw_q = query or {}
        with self._lock:
            if self._docs_mirror is not None:
                for d in self._docs_mirror:
                    if MemoryCollection._matches_static(d, raw_q):
                        self._apply_update_to_doc(d, update)
            self._cache.clear()
        return res

    def delete_one(self, query):
        res = self._col.delete_one(self._normalize_query(query))
        raw_q = query or {}
        with self._lock:
            if self._docs_mirror is not None:
                for i, d in enumerate(self._docs_mirror):
                    if MemoryCollection._matches_static(d, raw_q):
                        del self._docs_mirror[i]
                        break
            self._cache.clear()
        return res

    def delete_many(self, query):
        res = self._col.delete_many(self._normalize_query(query))
        raw_q = query or {}
        with self._lock:
            if self._docs_mirror is not None:
                self._docs_mirror = [d for d in self._docs_mirror if not MemoryCollection._matches_static(d, raw_q)]
            self._cache.clear()
        return res

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
        doc_copy = _sanitize_doc_blobs(_fast_doc_copy(doc))
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
            if self._matches_static(d, query):
                return _fast_doc_copy(d)
        return None

    def find(self, query=None):
        query = query or {}
        res = [_fast_doc_copy(d) for d in self.docs if self._matches_static(d, query)]
        return MemoryCursor(res)

    def count_documents(self, query=None):
        query = query or {}
        return sum(1 for d in self.docs if self._matches_static(d, query))

    def update_one(self, query, update, upsert=False):
        for d in self.docs:
            if self._matches_static(d, query):
                if "$set" in update:
                    for k, v in update["$set"].items():
                        d[k] = copy.deepcopy(v) if isinstance(v, (dict, list)) else v
                    _sanitize_doc_blobs(d)
                if "$push" in update:
                    for k, v in update["$push"].items():
                        if not isinstance(d.get(k), list):
                            d[k] = []
                        d[k].append(copy.deepcopy(v) if isinstance(v, (dict, list)) else v)
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
            if self._matches_static(d, query):
                matched += 1
                if "$set" in update:
                    for k, v in update["$set"].items():
                        d[k] = copy.deepcopy(v) if isinstance(v, (dict, list)) else v
                    _sanitize_doc_blobs(d)
                if "$push" in update:
                    for k, v in update["$push"].items():
                        if not isinstance(d.get(k), list):
                            d[k] = []
                        d[k].append(copy.deepcopy(v) if isinstance(v, (dict, list)) else v)
        if matched > 0:
            self._save()
        return _SimpleUpdateResult(matched, matched)

    def delete_one(self, query):
        for i, d in enumerate(self.docs):
            if self._matches_static(d, query):
                del self.docs[i]
                self._save()
                return _SimpleDeleteResult(1)
        return _SimpleDeleteResult(0)

    def delete_many(self, query):
        count = 0
        rem = []
        for d in self.docs:
            if self._matches_static(d, query):
                count += 1
            else:
                rem.append(d)
        self.docs = rem
        if count > 0:
            self._save()
        return _SimpleDeleteResult(count)

    def create_index(self, keys, **kwargs):
        pass

    @staticmethod
    def _get_field(doc, key):
        if not isinstance(doc, dict):
            return None
        if "." not in key:
            return doc.get(key)
        curr = doc
        for part in key.split("."):
            if isinstance(curr, dict) and part in curr:
                curr = curr[part]
            else:
                return None
        return curr

    def _matches(self, doc, query):
        return self._matches_static(doc, query)

    @classmethod
    def _matches_static(cls, doc, query):
        if not query:
            return True
        import re
        for k, v in query.items():
            if k == "$and":
                if not isinstance(v, list) or not all(cls._matches_static(doc, sub_q) for sub_q in v):
                    return False
            elif k == "$or":
                if not isinstance(v, list) or not any(cls._matches_static(doc, sub_q) for sub_q in v):
                    return False
            elif k == "$nor":
                if not isinstance(v, list) or any(cls._matches_static(doc, sub_q) for sub_q in v):
                    return False
            elif isinstance(v, dict) and any(str(op).startswith("$") for op in v.keys()):
                doc_val = cls._get_field(doc, k)
                for op, op_val in v.items():
                    if op == "$options":
                        continue
                    if op == "$regex":
                        pattern = op_val
                        options = re.IGNORECASE if "i" in str(v.get("$options", "")) else 0
                        def _regex_hit(val):
                            if val is None or val == "":
                                return False
                            if hasattr(pattern, "search"):
                                return bool(pattern.search(str(val)))
                            return bool(re.search(pattern, str(val), options))
                        if isinstance(doc_val, list):
                            if not any(_regex_hit(item) for item in doc_val):
                                return False
                        elif not _regex_hit(doc_val):
                            return False
                    elif op == "$in":
                        in_list = op_val if isinstance(op_val, (list, tuple, set)) else []
                        in_strs = [str(x) for x in in_list]
                        if isinstance(doc_val, list):
                            if not any(item in in_list or (item is not None and str(item) in in_strs) for item in doc_val):
                                return False
                        elif doc_val not in in_list and (doc_val is None or str(doc_val) not in in_strs):
                            return False
                    elif op == "$nin":
                        nin_list = op_val if isinstance(op_val, (list, tuple, set)) else []
                        nin_strs = [str(x) for x in nin_list]
                        if isinstance(doc_val, list):
                            if any(item in nin_list or (item is not None and str(item) in nin_strs) for item in doc_val):
                                return False
                        elif doc_val in nin_list or (doc_val is not None and str(doc_val) in nin_strs):
                            return False
                    elif op == "$ne":
                        if doc_val == op_val:
                            return False
                    elif op == "$exists":
                        field_exists = k in doc if "." not in k else (doc_val is not None)
                        if bool(op_val) != bool(field_exists):
                            return False
                    elif op in ("$gte", "$gt", "$lte", "$lt"):
                        if doc_val is None:
                            return False
                        try:
                            if op == "$gte" and not (doc_val >= op_val):
                                return False
                            if op == "$gt" and not (doc_val > op_val):
                                return False
                            if op == "$lte" and not (doc_val <= op_val):
                                return False
                            if op == "$lt" and not (doc_val < op_val):
                                return False
                        except TypeError:
                            return False
            else:
                doc_val = cls._get_field(doc, k)
                if isinstance(doc_val, list) and not isinstance(v, list):
                    if v not in doc_val and str(v) not in [str(x) for x in doc_val]:
                        return False
                elif str(doc_val) != str(v):
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

class _MemoryGridOut:
    def __init__(self, doc):
        self._doc = doc
        self.filename = doc.get("filename", "file.pdf")
        self.content_type = doc.get("content_type", "application/pdf")
        self.length = doc.get("length", 0)
        self.metadata = doc.get("metadata", {})

    def read(self):
        return base64.b64decode(self._doc.get("data_b64", ""))


class MemoryGridFS:
    """In-memory GridFS fallback used only when MongoDB Atlas is unreachable or in unit tests."""
    def __init__(self, collection):
        self._col = collection

    def put(self, data_bytes: bytes, filename: str = "file.pdf", content_type: str = "application/pdf", metadata: dict = None):
        oid = ObjectId()
        self._col.insert_one({
            "_id": str(oid),
            "filename": filename,
            "content_type": content_type,
            "length": len(data_bytes),
            "metadata": metadata or {},
            "data_b64": base64.b64encode(data_bytes).decode("ascii")
        })
        return oid

    def get(self, file_id):
        doc = self._col.find_one({"_id": str(file_id)})
        if not doc:
            raise NoFile(f"No file with id {file_id}")
        return _MemoryGridOut(doc)

    def delete(self, file_id):
        self._col.delete_one({"_id": str(file_id)})


class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.fs = None
        self.is_atlas = False
        self.is_testing = "unittest" in sys.modules
        self.local_db_path = os.path.abspath(
            os.getenv("PARTIME_LOCAL_DB_PATH")
            or os.path.join(os.path.dirname(__file__), "..", "..", "local_db_store.json")
        )
        self._saving_local = False
        self._file_ram_cache = {}
        self.memory_collections = {
            name: MemoryCollection(name, on_change=(None if self.is_testing else self._persist_local_store))
            for name in COLLECTIONS
        }
        self.memory_collections["fs_files"] = MemoryCollection(
            "fs_files", on_change=(None if self.is_testing else self._persist_local_store)
        )
        self._atlas_adapters = {}
        self.connect()
        if self.is_atlas and not self.is_testing:
            # 1. Nạp nhanh bản chụp trên ổ cứng vào RAM (~0.03s) để có dữ liệu tức thì ngay giây đầu tiên
            self._Warm_adapters_from_disk_snapshot()
            # 2. Chạy ngầm đồng bộ 16 collections từ MongoDB Atlas + seed_initial_data (không chặn luồng mở cổng 8002)
            self._prewarm_atlas_cache_async()
        elif not self.is_atlas and not self.is_testing:
            self._load_local_store()
            self.seed_initial_data()
        else:
            self.seed_initial_data()

    def _Warm_adapters_from_disk_snapshot(self):
        if not os.path.exists(self.local_db_path):
            return
        try:
            with open(self.local_db_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
            if isinstance(raw, dict):
                for name in COLLECTIONS:
                    docs = raw.get(name)
                    if isinstance(docs, list):
                        adapter = self.get_collection(name)
                        if hasattr(adapter, "seed_from_snapshot"):
                            adapter.seed_from_snapshot(docs)
        except Exception:
            pass

    def _save_atlas_snapshot_to_disk(self):
        if self.is_testing or self._saving_local or not self.is_atlas:
            return
        try:
            self._saving_local = True
            payload = {}
            for name in COLLECTIONS:
                ad = self._atlas_adapters.get(name)
                if ad is not None and ad._docs_mirror is not None:
                    payload[name] = ad._docs_mirror
            if payload:
                with open(self.local_db_path, "w", encoding="utf-8") as f:
                    json.dump(payload, f, ensure_ascii=False, separators=(",", ":"), default=str)
        except Exception:
            pass
        finally:
            self._saving_local = False

    def _prewarm_atlas_cache_async(self):
        """Tự động nạp ngầm (Non-blocking Daemon Thread) toàn bộ 16 collections từ Atlas vào RAM để server mở cổng 8002 ngay tức thì."""
        if not self.is_atlas or self.db is None:
            return
        def _bg_worker():
            try:
                # Ưu tiên nạp trước các bảng nhẹ cần ngay khi vừa mở trang chủ
                priority_cols = ["categories", "jobs", "users", "employers", "company_profiles", "banned_keywords"]
                remaining_cols = [c for c in COLLECTIONS if c not in priority_cols]
                ordered_adapters = [self.get_collection(name) for name in (priority_cols + remaining_cols)]
                with ThreadPoolExecutor(max_workers=8) as pool:
                    list(pool.map(lambda ad: ad._load_mirror_from_atlas(), ordered_adapters))
                self.seed_initial_data()
                self._save_atlas_snapshot_to_disk()
            except Exception as e:
                print(f"[Database] Pre-warm warning: {e}")
        threading.Thread(target=_bg_worker, daemon=True).start()

    def _load_local_store(self):
        if not os.path.exists(self.local_db_path):
            return
        try:
            with open(self.local_db_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
            if isinstance(raw, dict):
                for name in COLLECTIONS:
                    if isinstance(raw.get(name), list):
                        self.memory_collections[name].docs = [_sanitize_doc_blobs(d) for d in raw[name]]
        except Exception as e:
            print(f"[Database] Could not load local store: {e}")

    def _persist_local_store(self):
        if self.is_testing or self._saving_local:
            return
        try:
            self._saving_local = True
            payload = {name: self.memory_collections[name].docs for name in COLLECTIONS}
            with open(self.local_db_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
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
            self.fs = gridfs.GridFS(self.db)
            self.is_atlas = True
            print(f"[Database] Successfully connected to MongoDB Atlas '{Config.DATABASE_NAME}'")
        except Exception as e:
            self.is_atlas = False
            self.fs = MemoryGridFS(self.memory_collections["fs_files"])
            print(f"[Database] MongoDB Atlas unreachable ({e}). Using resilient Local Document Store with all 16 collections.")

    @staticmethod
    def extract_file_id(file_url: str):
        if isinstance(file_url, str) and file_url.startswith("/api/files/"):
            fid = file_url[len("/api/files/"):].split("?", 1)[0].strip()
            if ObjectId.is_valid(fid) or fid.startswith("inline_"):
                return fid
        return None

    def save_file(self, data_bytes: bytes, filename: str, content_type: str = "application/pdf", metadata: dict = None) -> str:
        if not isinstance(data_bytes, (bytes, bytearray)):
            raise ValueError("Dữ liệu tệp tin không hợp lệ.")
        raw = bytes(data_bytes)
        if len(raw) > MAX_UPLOAD_BYTES:
            raise ValueError("Dung lượng tệp vượt quá giới hạn 10MB!")
        if self.fs is None:
            self.fs = gridfs.GridFS(self.db) if (self.is_atlas and self.db is not None) else MemoryGridFS(self.memory_collections["fs_files"])
        file_id = str(self.fs.put(raw, filename=filename, content_type=content_type, metadata=metadata or {}))
        self._file_ram_cache[file_id] = {
            "data": raw,
            "filename": filename or "document.pdf",
            "content_type": content_type or "application/pdf",
            "length": len(raw),
        }
        return file_id

    def save_data_url(self, data_url: str, filename: str, allowed_types=("application/pdf",), metadata: dict = None, allow_pdf_magic: bool = False):
        if not data_url or not isinstance(data_url, str) or not data_url.startswith("data:") or "," not in data_url:
            raise ValueError("Dữ liệu tệp tin không hợp lệ.")
        header, raw_b64 = data_url.split(",", 1)
        mime_part = header[5:].split(";", 1)[0].strip().lower()
        file_bytes = base64.b64decode(raw_b64)
        if len(file_bytes) > MAX_UPLOAD_BYTES:
            raise ValueError("Dung lượng tệp vượt quá giới hạn 10MB!")

        is_pdf_bytes = file_bytes.lstrip().startswith(b"%PDF")
        if allow_pdf_magic and "application/pdf" in (allowed_types or ()):
            if mime_part in ("application/pdf", "application/x-pdf") or (
                mime_part in ("", "application/octet-stream") and is_pdf_bytes
            ):
                mime_part = "application/pdf"

        if allowed_types and mime_part not in allowed_types:
            raise ValueError(f"Định dạng tệp '{mime_part}' không được hỗ trợ.")
        if mime_part == "image/jpg":
            mime_part = "image/jpeg"
        file_id = self.save_file(file_bytes, filename=filename, content_type=mime_part, metadata=metadata)
        return file_id, f"/api/files/{file_id}"

    def get_file(self, file_id: str):
        fid = str(file_id or "").strip()
        if not fid:
            return None
        if fid.startswith("inline_"):
            with _INLINE_BLOB_LOCK:
                blob = _INLINE_BLOB_STORE.get(fid)
            if blob is not None:
                return blob
            # Nếu vừa khởi động từ disk snapshot mà luồng ngầm chưa kịp giải mã Base64 của bảng chứa file, nạp bảng đó ngay
            if self.is_atlas and self.db is not None:
                for col_name in ("resumes", "applications", "company_profiles", "messages"):
                    ad = self.get_collection(col_name)
                    if hasattr(ad, "_load_mirror_from_atlas"):
                        try:
                            ad._load_mirror_from_atlas()
                        except Exception:
                            pass
                    with _INLINE_BLOB_LOCK:
                        blob = _INLINE_BLOB_STORE.get(fid)
                    if blob is not None:
                        return blob
            return None
        if fid in self._file_ram_cache:
            return self._file_ram_cache[fid]
        if not ObjectId.is_valid(fid):
            return None
        if self.fs is None:
            self.fs = gridfs.GridFS(self.db) if (self.is_atlas and self.db is not None) else MemoryGridFS(self.memory_collections["fs_files"])
        try:
            grid_out = self.fs.get(ObjectId(fid))
            data = grid_out.read()
            filename = grid_out.filename or "document.pdf"
            content_type = getattr(grid_out, "content_type", None)
            if not content_type:
                ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "pdf"
                content_type = "application/pdf" if ext == "pdf" else (f"image/{'jpeg' if ext in ('jpg', 'jpeg') else ext}")
            result = {
                "data": data,
                "filename": filename,
                "content_type": content_type,
                "length": getattr(grid_out, "length", len(data)) or len(data)
            }
            if len(self._file_ram_cache) >= 64:
                self._file_ram_cache.clear()
            self._file_ram_cache[fid] = result
            return result
        except NoFile:
            return None
        except Exception:
            return None

    def delete_file(self, file_id_or_url: str) -> bool:
        fid = self.extract_file_id(file_id_or_url)
        if not fid and isinstance(file_id_or_url, str) and ObjectId.is_valid(file_id_or_url.strip()):
            fid = file_id_or_url.strip()
        if not fid:
            return False
        self._file_ram_cache.pop(fid, None)
        if fid.startswith("inline_"):
            with _INLINE_BLOB_LOCK:
                _INLINE_BLOB_STORE.pop(fid, None)
            return True
        if self.fs is None:
            return False
        try:
            self.fs.delete(ObjectId(fid))
            return True
        except Exception:
            return False

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

        resumes_col = self.get_collection("resumes")
        stu_resumes = list(resumes_col.find({"student_id": {"$in": stu_ids}}))
        resumes_col.delete_many({"student_id": {"$in": stu_ids}})
        self.get_collection("cover_letters").delete_many({"student_id": {"$in": stu_ids}})
        self.get_collection("bookmarks").delete_many({"student_id": {"$in": stu_ids}})
        apps_col = self.get_collection("applications")
        apps_col.delete_many({
            "$or": [{"student_id": {"$in": stu_ids}}, {"student_user_id": uid}]
        })
        for cv_doc in stu_resumes:
            cv_url = cv_doc.get("file_url", "")
            if self.extract_file_id(cv_url) and apps_col.count_documents({"$or": [{"application_snapshot.cv_url": cv_url}, {"cv_url": cv_url}]}) == 0:
                self.delete_file(cv_url)

        # Xóa hồ sơ doanh nghiệp và tin tuyển dụng phụ thuộc
        emp_col = self.get_collection("employers")
        emp_docs = list(emp_col.find({"user_id": uid}))
        emp_ids = [ed["_id"] for ed in emp_docs]
        if emp_ids:
            comp_col = self.get_collection("company_profiles")
            for comp_doc in list(comp_col.find({"employer_id": {"$in": emp_ids}})):
                for field in ("business_license_url", "logo_url", "cover_image_url"):
                    self.delete_file(comp_doc.get(field, ""))
            comp_col.delete_many({"employer_id": {"$in": emp_ids}})
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

        cat_col = self.get_collection("categories")
        notif_col = self.get_collection("notifications")
        users_col = self.get_collection("users")
        already_seeded = (not self.is_testing) and (
            (notif_col.find_one({"_id": "_system_seed_v2"}) is not None)
            or (users_col.count_documents({}) > 0 and cat_col.count_documents({}) > 0)
        )

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

        # 3. Seed Users for 3 Roles (Chỉ khởi tạo tài khoản mẫu nếu database chưa có dữ liệu; tuyệt đối không xóa dữ liệu hiện có)
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
                        "business_license_url": "",
                        "logo_url": "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=120&auto=format&fit=crop&q=80",
                        "cover_image_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80"
                    })

        # Quản trị viên: Lê Thị Thuỳ Ngân - Cố định Gmail (lethithuyngan985@gmail.com) - chỉ chèn nếu chưa có
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

        if not self.is_testing and not already_seeded:
            notif_col.update_one(
                {"_id": "_system_seed_v2"},
                {"$set": {"user_id": "_system", "is_deleted": True, "created_at": time.strftime("%Y-%m-%d %H:%M:%S")}},
                upsert=True
            )

db_manager = DatabaseManager()

