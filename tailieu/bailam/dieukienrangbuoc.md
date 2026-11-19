# TÀI LIỆU ĐẶC TẢ ĐIỀU KIỆN RÀNG BUỘC & QUY TẮC NGHIỆP VỤ HỆ THỐNG (VERIFIED SPECIFICATION)

> **Dự án:** Nền tảng Tuyển dụng Việc làm Part-time theo ca cho Sinh viên — **PARTIME.VN** (`CDTN02`)  
> **Đối chiếu đồng bộ 100% từ:** Mã nguồn Backend (`Backend/src/**`), Giao diện Frontend (`frontend/src/**`), Đặc tả `tailieu/bailam/FR.xlsx` (**161 FRs**, **41 Business Rules**, **13 NFRs**) và Bộ kiểm thử `test/TestCases_Selenium_PARTIME_VN.xlsx` (**251 Test Cases**).  
> **Triển khai thực tế (Production Render):** `https://parttime-css0.onrender.com/` (Sinh viên) | `/employer` (Nhà tuyển dụng) | `/admin` (Quản trị viên) | Local hợp nhất cổng `8002`.

---

## PHẦN 1: QUY TẮC CƠ SỞ DỮ LIỆU, LƯU TRỮ TỆP & KHÓA TOÀN VẸN

### 1.1. Kiến trúc Cơ sở dữ liệu & Kho lưu trữ GridFS
* **CSDL chính:** MongoDB Atlas (`CDTN02_DB`, cấu hình qua `Backend/src/core/config.py`), vận hành qua lớp **`AtlasCollectionAdapter`** (`Backend/src/core/database.py`):
  * **RAM Cache 300 giây (`CACHE_TTL_SECONDS = 300`):** Giữ bản sao dữ liệu đọc trong bộ nhớ và làm mới nền theo cơ chế stale-while-revalidate.
  * **Blob Sanitization (`_sanitize_doc_blobs`):** Tự động tách các chuỗi PDF/Ảnh lớn hơn 2KB thành đường dẫn tệp trong `_INLINE_BLOB_STORE` / GridFS để truy vấn danh sách nhanh (`NFR-01`).
  * **Chế độ dự phòng Offline:** Tự động fallback sang `local_db_store.json` (`MemoryCollection` & `MemoryGridFS`) nếu không có kết nối MongoDB Atlas.
* **Tổng số Collection định nghĩa (`COLLECTIONS`, `database.py:99–118`): 18 Collections + GridFS (`fs.files`, `fs.chunks`)**:

| STT | Collection | Khóa định danh (`_id` prefix) | Vai trò nghiệp vụ & Ghi chú kiểm chứng |
|---:|---|---|---|
| 1 | `users` | `user_<role>_<hex>` | Tài khoản xác thực 3 vai trò (`student`, `employer`, `admin`), băm mật khẩu, trạng thái `is_banned`, `status`. |
| 2 | `student_profiles` | `stu_<hex>` | Hồ sơ Sinh viên (`user_id`, `full_name`, `phone`, `university`, `residence_address`, `avatar_url`, `cover_image_url`). |
| 3 | `employers` | `emp_<hex>` | Hồ sơ pháp lý NTD (`user_id`, `business_license`, `license_url`, `approval_status`, `reject_reason`). |
| 4 | `company_profiles` | `comp_<hex>` | Hồ sơ thương hiệu DN (`employer_id`, `company_name`, `branch_name`, `address`, `scale`, `description`, `logo_url`, `cover_image_url`, `rating`). |
| 5 | `resumes` | `cv_<hex>` | Kho CV PDF của Sinh viên (`student_id`, `file_name`, `file_url`, `file_size`, `is_default`). |
| 6 | `cover_letters` | `cl_<hex>` | Mẫu thư giới thiệu đã lưu (`student_id`, `title`, `content` <= 5.000 ký tự). |
| 7 | `jobs` | `job_<hex>` | Tin tuyển dụng (`employer_id`, `category_id`, `salary_min`, `salary_max`, `is_negotiable`, `status`, `is_hidden`, `is_admin_reviewed`, `matched_banned_keywords`). |
| 8 | `categories` | `cat_<hex>` / `cat_1..6` | Danh mục Master Data dùng chung (`name`, `type`: ngành nghề / địa điểm, `is_active`). Backend seed sẵn **6 ngành nghề**. |
| 9 | `bookmarks` | `bm_<hex>` | Việc làm Sinh viên đã lưu (`student_id`, `job_id`). |
| 10 | `applications` | `app_<hex>` | Đơn ứng tuyển & Ca làm (`job_id`, `student_id`, `employer_id`, `application_status`, `shift_status`, `employer_confirmed`, `application_snapshot`). |
| 11 | `reviews` | `rev_<hex>` | Đánh giá chéo 2 chiều (`application_id`, `reviewer_id`, `reviewee_id`, `direction`, `rating`, `comment`, `is_hidden`). |
| 12 | `chat_rooms` | *(chưa ghi)* | Khai báo trong `COLLECTIONS` (`database.py:111`), **chưa đọc/ghi trực tiếp ở API routes**; phòng chat được định tuyến theo `room_id` trên collection `messages`. |
| 13 | `messages` | `msg_<hex>` | Tin nhắn văn bản (che `***`), bản nguyên văn `original_content` phục vụ Admin đối chứng, tệp đính kèm & call logs WebRTC (`room_id`). |
| 14 | `notifications` | `notif_<hex>` | Thông báo Chuông Realtime (`user_id`, `user_aliases`, `notif_type`, `link`, `is_read`, `announcement_id`). |
| 15 | `reports` | `rep_<hex>` | Phiếu khiếu nại & báo cáo vi phạm (`reporter_id`, `report_type`, `target_id`, `room_id`, `application_id`, `status`, `admin_note`). |
| 16 | `banned_keywords` | `bkw_<hex>` | Danh sách từ khóa cấm toàn sàn (seed sẵn **7 từ khóa** trong `database.py:1060`). |
| 17 | `audit_logs` | `log_<hex>` | Nhật ký hoạt động quản trị ghi nhận **16 mã hành động (`action`)**, hỗ trợ lọc theo **13 nhóm** trên UI Admin. |
| 18 | `announcements` | `ann_<hex>` | Thông báo hệ thống hàng loạt (Broadcast) do Admin phát và hỗ trợ Xóa & Thu hồi đồng bộ. |
| + | `fs.files` / `fs.chunks` | `ObjectId` | Kho lưu trữ **MongoDB GridFS** cho tệp PDF CV, PDF GPKD, ảnh đại diện/logo/bìa và tệp đính kèm Chat. |

### 1.2. Cơ chế Toàn vẹn & Ràng buộc Dữ liệu (Application-Level Integrity)
> *Lưu ý kỹ thuật:* Backend hiện hành **không gọi `.create_index(...)`** tạo Unique Index ở tầng MongoDB driver; mọi ràng buộc duy nhất và toàn vẹn tham chiếu được kiểm soát chặt chẽ tại tầng logic API Python (`auth_middleware.py`, `auth_routes.py`, `student_routes.py`, `employer_routes.py`, `admin_routes.py`):

| Ràng buộc | Cơ chế thực thi trong Mã nguồn | Mã lỗi / Phản hồi |
|---|---|---|
| **1 Email = 1 Role duy nhất (`BR-CH-02`)** | `check_email_role_constraint()` (`auth_middleware.py:50–73`) kiểm tra toàn bộ `users.email` ở cả `/api/auth/send-otp` (`register`) và `/api/auth/register`; `/api/auth/login` kiểm tra chéo role đang đăng nhập. | Đăng ký/OTP trùng: **HTTP 409**; Đăng nhập nhầm cổng: **HTTP 400** kèm tên vai trò thực tế. |
| **Chặn Ứng tuyển trùng (`BR-SV-04`)** | `apply_job` (`student_routes.py:368–374`) tìm đơn đang mở thuộc các trạng thái `{pending, reviewed, interview, accepted}`. Cho phép nộp lại nếu đơn trước đã `rejected`/`withdrawn`/`cancelled`. | **HTTP 409**: `"Bạn đã nộp hồ sơ cho vị trí này và đang chờ xét duyệt"`. |
| **Đóng băng CV Snapshot (`TC-SV-049`)** | Khi nộp đơn, `student_routes.py:412–425` sao chép bất biến `cv_id`, `cv_name`, `cv_url` vào `application_snapshot` để không bị hỏng nếu Sinh viên xóa CV gốc; riêng thông tin liên hệ/avatar được đồng bộ khi sửa Hồ sơ cá nhân. | Giữ nguyên CV đã nộp; `delete_resume` chỉ xóa file GridFS nếu `applications` không còn tham chiếu (`student_routes.py:43–52`). |
| **Giới hạn 1 đánh giá / 1 đơn (`BR-SV-07`, `BR-NTD-09`)** | • Sinh viên (`POST /api/student/reviews`): chặn đánh giá trùng cùng `(application_id, reviewer_id)`.<br>• Nhà tuyển dụng (`POST /api/employer/reviews`): cập nhật đè (**Upsert**) lên đánh giá cũ cùng đơn nếu gửi lại. | SV gửi lần 2: **HTTP 409**; NTD gửi lại: cập nhật bản ghi cũ & báo lại điểm mới. |
| **Từ khóa cấm duy nhất (`BR-QTV-06`)** | `add_banned_keyword` & `update_banned_keyword` (`admin_routes.py:709–732`) chuẩn hóa `strip().lower()` và kiểm tra trùng trước khi lưu. | **HTTP 409**: `"Từ khóa này đã tồn tại trong bộ lọc."` |
| **Xóa danh mục Master Data (`BR-QTV-07`)** | `delete_category` (`admin_routes.py:681–689`) **không chặn xóa (không Restrict)** mà tự động gỡ liên kết an toàn `jobs.update_many({"category_id": cat_id}, {"$set": {"category_id": ""}})` rồi xóa danh mục. | **HTTP 200** + phát Socket `'categories-updated'`. |
| **Khóa bảo vệ khi Xóa tin (`BR-NTD-06`, `BR-QTV-05`)** | • NTD (`employer_routes.py:1238–1253`): chặn nếu tin chưa `completed` mà vẫn còn đơn thuộc `{pending, reviewed, received, interview, accepted}`.<br>• Admin (`admin_routes.py:600–615`): chặn xóa cứng nếu tin còn đơn khác `cancelled`/`withdrawn`, yêu cầu dùng nút **Ẩn tin**. | **HTTP 400** kèm hướng dẫn đóng/ẩn tin. |
| **Xóa dây chuyền Cascade User (`BR-QTV-03`, `BR-SV-08`, `BR-NTD-10`)** | • Admin `cascade_delete_user` (`database.py:955–1031`): dọn sạch dữ liệu trên các collection liên quan + file GridFS không dùng chung.<br>• Tự hủy (`DELETE /api/auth/delete-account`): vô hiệu hóa user, ẩn danh đơn đã duyệt thành `"Người dùng đã xóa"`, tự đóng/hoàn thành tin NTD & từ chối đơn chờ. | Tài khoản ngưng vĩnh viễn (`403` nếu đăng nhập lại), không để dữ liệu mồ côi. |

---

## PHẦN 2: RÀNG BUỘC XÁC THỰC, BẢO MẬT & CÔ LẬP PHIÊN (3 VAI TRÒ)

### 2.1. Định dạng Dữ liệu Đầu vào & Mật khẩu (`BR-CH-01`, `BR-CH-03`)
| Trường / Hạng mục | Frontend (`frontend/src/**`) | Backend (`Backend/src/**`) | Ngoại lệ & Cảnh báo |
|---|---|---|---|
| **Địa chỉ Email** | Bắt buộc định dạng chuẩn **và phải kết thúc bằng `@gmail.com`** (`LoginScreen`, `RegisterScreen`, `AdminLoginScreen`). | `EMAIL_REGEX` (`security.py:9`) kiểm tra chuẩn email RFC trên `/register`, `/send-otp` (**HTTP 422** nếu sai). Riêng Admin listing/analytics lọc tài khoản `@gmail.com`. | Frontend chặn email ngoài `@gmail.com` ngay khi submit; Backend đảm bảo không sai cú pháp RFC. |
| **Độ mạnh Mật khẩu** | `>= 8` ký tự, có ít nhất 1 chữ hoa (`A-Z`), 1 chữ thường (`a-z`), 1 chữ số (`0-9`), 1 ký tự đặc biệt; mật khẩu xác nhận phải khớp.<br>*(Ghi chú UI: `RegisterScreen` hiển thị checklist 4 dòng, trong khi hàm JS vẫn kiểm tra đủ 5 điều kiện; `AccountModal` hiển thị đủ 5 dòng.)* | `security.py:17–36` kiểm tra đủ **5 điều kiện** bắt buộc trên `/register`, `/reset-password-otp`, `/change-password` (**HTTP 400**). | Mật khẩu khi lưu băm bằng **PBKDF2-HMAC-SHA256 (`100.000` vòng lặp)** với salt cố định của hệ thống (**không dùng Bcrypt**). |
| **Mã OTP Email (`BR-CH-04`)** | 6 chữ số nhập tay vào 6 ô riêng, đồng hồ đếm ngược **60 giây (`otpTimer = 60`)**. **Không có nút Tự động điền (Auto-fill)**. | Gửi qua **Brevo HTTPS API v3** (`api.brevo.com:443`, fallback SMTP RFC) với **`expires_in_seconds = 60`**. Quá 60s trả **HTTP 410** (`/verify-otp`, `/reset-password-otp`) hoặc **HTTP 400** (`/register`). | Riêng `/register` hỗ trợ mã bypass nội bộ `"654321"` cho luồng dev; cổng `/admin` bị chặn hoàn toàn trên `/send-otp` (**HTTP 403**). |
| **Token Phiên (JWT)** | Lưu tách khóa theo vai trò trong `localStorage` (`partime_student_token`, `partime_employer_token`, `partime_admin_token`) + cổng `sessionStorage` theo tab trình duyệt để **cô lập đa tab** (`BR-CH-05`). | Ký thuật toán **`HS256`**, thời hạn **`86.400` giây (24 giờ)** (`security.py:61–82`). | Decorator `@token_required` & `@role_required(...)` chặn thiếu/hết hạn token (**HTTP 401**), sai vai trò (**HTTP 403**) và user bị khóa `is_banned=True` (**HTTP 403**). |
| **Bảo vệ Quản trị viên (`BR-QTV-01`)** | Màn `/admin` (`AdminLoginScreen.jsx`) không có nút Đăng ký, không có Quên mật khẩu; `AccountModal` ẩn hoàn toàn nút Hủy tài khoản. | `/register` từ chối `role == 'admin'` (**400**); `/send-otp` chặn email Admin (**403**); `/users/<id>/ban` và `DELETE /users/<id>` chặn tự khóa/tự xóa chính mình hoặc xóa bất kỳ Admin nào (**HTTP 400**). | Ngăn chặn leo thang đặc quyền hoặc mất quyền quản trị tối cao. |

---

## PHẦN 3: RÀNG BUỘC NGHIỆP VỤ CHI TIẾT THEO VAI TRÒ & TÍNH NĂNG

### 3.1. Phân hệ Sinh viên (`BR-SV-01..08`, `BR-CH-07..14`)
1. **Chế độ Khách (`Guest Mode`, `BR-SV-01`):** Tab mới mở `/student` được xem Trang chủ, Banner tìm kiếm, 6 thẻ ngành, danh sách tin công khai, chi tiết JD và Hồ sơ công ty. Các thao tác ghi (`Lưu tim`, `Ứng tuyển`, mở `Chat`, quản lý cá nhân) tự động nhắc và chuyển hướng sang `/student/login`.
2. **Hồ sơ cá nhân & Số điện thoại (`BR-SV-02`):**
   * Khi đăng ký (`RegisterScreen.jsx:170`): kiểm tra SĐT đủ 10 chữ số (`/^\d{10}$/`).
   * Khi cập nhật Hồ sơ cá nhân (`StudentPortal.jsx:1652`): **bắt buộc bắt đầu bằng `0` và đủ đúng 10 chữ số (`/^0[0-9]{9}$/`)**, báo lỗi đỏ dưới ô nhập nếu vi phạm.
   * Trường học và Địa chỉ cư trú dùng `SearchableDropdownInput` (22 quận TP.HCM / 63 tỉnh thành toàn quốc) để phục vụ gắn nhãn ưu tiên **`Gần bạn`**.
3. **Kho quản lý CV PDF (`BR-SV-03`):**
   * **Chỉ chấp nhận định dạng `.pdf` (`application/pdf` + kiểm tra chữ ký magic bytes `%PDF`), dung lượng tối đa `10MB` (`10.485.760` bytes).**
   * **Không giới hạn số lượng CV tối đa 5 bản** trong kho; CV đầu tiên tự đánh dấu `Mặc định`, đổi mặc định tự tắt cờ ở các CV cũ.
   * Thay thế tệp CV (`PUT /api/student/resumes/<cv_id>`) và Xem trước A4 qua `DocumentViewerModal` (`<iframe>`).
4. **Tìm kiếm, Lọc việc làm & Địa lý toàn quốc (`NFR-12`):**
   * Hỗ trợ **63 Tỉnh/Thành phố (`VIETNAM_PROVINCES`)**, 10 tỉnh có bản đồ Quận/Huyện chi tiết (`PROVINCE_DISTRICTS_MAP`, riêng TP.HCM có 24 quận/huyện; `professionSuggestions.js` có 22 quận gợi ý và 23 nghề nghiệp gợi ý), 5 khung Ca làm việc, 6 khoảng lương.
   * Tìm kiếm tiếng Việt **không dấu đa từ** (chuẩn hóa NFD + chuyển `đ/Đ -> d`), phân biệt chính xác ranh giới địa danh (**chọn `Quận 1` tuyệt đối không dính `Quận 10`, `Quận 11`, `Quận 12`**).
5. **Ứng tuyển, Rút đơn & Ca làm tuần T2–CN (`BR-SV-04`, `BR-SV-05`, `BR-SV-06`):**
   * Chỉ nộp đơn được vào tin `status == 'open'` (chưa `closed`/`filled`/`completed`), `is_hidden != True` và đã có ít nhất 1 CV PDF trong kho (giao diện Modal Nộp hồ sơ **chỉ chọn CV PDF**, không có ô Cover Letter hay Checkbox xác nhận phụ).
   * Sinh viên được phép **Rút đơn** (`PUT /api/student/applications/<id>/cancel`) khi đơn ở `{pending, accepted, reviewed, interview}` và công việc cha chưa `completed`; nếu rút/xóa đơn `accepted` cuối cùng của tin đang ở trạng thái `filled`, hệ thống tự động mở lại tin thành `open`.
   * Lịch ca làm việc hợp lệ gồm `{upcoming, in_progress, completed, cancelled}`; nút **Viết đánh giá** chỉ mở khóa khi ca đã được Nhà tuyển dụng nghiệm thu (`employer_confirmed == True` / có `attendance_marked_at` hoặc job `completed`).

### 3.2. Phân hệ Nhà tuyển dụng (`BR-NTD-01..10`)
1. **Đăng ký & Thẩm định GPKD PDF (`BR-NTD-01`, `BR-NTD-02`, `BR-NTD-03`):**
   * **Mã số thuế (MST):** Frontend kiểm tra `/^\d{10,13}$/` (10 số công ty chính hoặc 13 số chi nhánh).
   * **Tệp GPKD:** **Bắt buộc định dạng `.pdf` (`application/pdf` + magic `%PDF`) dung lượng `<= 10MB`** (từ chối ảnh `.png`/`.jpg` hay `.docx`).
   * Mỗi lần tải lại GPKD PDF mới trong Hồ sơ doanh nghiệp, hệ thống **tự động chuyển `approval_status = "pending"`**, xóa lý do từ chối cũ, gửi thông báo + Socket `'gpkd-reupload'` cho Admin và **tạm khóa quyền đăng tin mới (HTTP 403)** cho đến khi được Admin phê duyệt lại.
2. **Đăng tin tuyển dụng & Kiểm duyệt 2 luồng (`BR-NTD-04`, `BR-NTD-05`):**
   * **Khung lương bắt buộc:** Khi không đặt `is_negotiable`, phải thỏa `15.000 <= salary_min <= salary_max <= 200.000` VNĐ/giờ (**HTTP 400** nếu vi phạm).
   * **Kiểm duyệt tự động 2 luồng (`auto_adjust_job_moderation`):** Tự động quét 7 trường (`title`, `description`, `requirements`, `benefits`, `company_name`, `branch_name`, `work_time`) đối chiếu danh sách `banned_keywords` (cả có dấu, không dấu và chuỗi viết liền `>= 4` ký tự):
     * **Tin sạch (`0` từ khóa khớp):** Tự động công khai ngay (`is_admin_reviewed = True, is_hidden = False`) sang cổng Sinh viên.
     * **Tin nhạy cảm (`>= 1` từ khóa khớp):** Hiển thị cảnh báo đỏ `<BannedKeywordWarning />` khi nhập; nếu cố lưu sẽ tự giữ ở trạng thái `Chờ kiểm duyệt` (`is_hidden = True, is_admin_reviewed = False`) và báo Admin. Khi NTD sửa loại bỏ hết từ nhạy cảm, hệ thống tự động mở công khai lại.
3. **Vòng đời Tin & Quản trị Ứng viên ATS (`BR-NTD-06`, `BR-NTD-07`, `BR-NTD-08`):**
   * Nút **Chốt đủ người (`filled`)** yêu cầu tin có `>= 1` ứng viên đã duyệt (`accepted`), đồng thời tự động từ chối các đơn `pending` còn lại với lý do `"Tin đã đủ người"`.
   * Màn hình **Quản trị ứng viên (ATS)** cố định 3 chế độ xem (`Bảng Kanban` 4 cột giới hạn `12 thẻ/lượt` + `Xem thêm`/`Thu gọn`, `Lưới thẻ` 5 tab, `Danh sách` bảng ngang 1 hàng nút).
   * Mở Modal **Xem CV** của đơn đang `pending` tự động ghi nhận sang `reviewed` (`Đã tiếp nhận`) và thông báo tức thì tới Sinh viên.
   * Điểm danh ca làm (`PUT /api/employer/applicants/<id>/attendance`) chỉ chấp nhận đơn thuộc `{accepted, completed}` với 4 trạng thái `{upcoming, in_progress, completed, absent}` (**HTTP 400** nếu đơn chưa trúng tuyển).

### 3.3. Phân hệ Quản trị viên (`BR-QTV-01..09`) & Chung 3 Role
1. **Analytics Dashboard 2026 (`BR-QTV-02`):** Truy vấn **100% dữ liệu thực năm 2026** (bộ lọc Năm chỉ còn `Tất cả các năm` và `Năm 2026`; `historicalAnalyticsData.js = []`), chỉ tính user `@gmail.com` (loại trừ tài khoản thử nghiệm) và cố định chiều cao vùng tooltip `h-12` chống giật layout trên 3 biểu đồ SVG.
2. **Đánh giá chéo 2 chiều (`BR-SV-07`, `BR-NTD-09`, `BR-QTV-06`):** Điểm sao `1–5`, nhận xét khác rỗng và **nhỏ hơn `1.000` ký tự**. Bài đánh giá bị Admin bấm **Ẩn** lập tức không tính vào điểm trung bình công khai và **khóa chỉnh sửa phía tác giả (HTTP 403)**.
3. **Chat 1-1, Lọc từ cấm & WebRTC Call (`BR-CH-08..11`, `BR-QTV-08`):**
   * Phòng Chat cô lập tuyệt đối theo `application_id` (`room_emp_<emp>_stu_<stu>_app_<app_id>`). Tự động khóa **CHỈ ĐỌC (HTTP 403)** khi đơn bị `rejected`/`cancelled`/`withdrawn` hoặc 1 bên bị khóa/vô hiệu hóa.
   * Từ nhạy cảm trong nội dung chat tự động che bằng `***` ở trường hiển thị nhưng giữ nguyên văn tại `original_content` để Admin xem qua `GET /api/admin/reports/<id>/chat-history` khi phân xử khiếu nại.
   * Tệp đính kèm Chat chỉ nhận `.pdf, .png, .jpg, .jpeg <= 10MB` (**không cho phép `.exe`, `.bat`, `.zip`, `.rar`**).
   * Cuộc gọi WebRTC đổ chuông quá **180 giây (3 phút)** không nhấc máy tự chốt thành `"Cuộc gọi nhỡ"` và ghi log vào hội thoại.
4. **Chuông Thông báo, Nhật ký 16 sự kiện & Broadcast (`BR-CH-13`, `BR-QTV-09`):**
   * Rê chuột qua thông báo tự đánh dấu đã đọc (`is_read = true`), đóng dropdown tự đọc toàn bộ, bấm `X` xóa vĩnh viễn.
   * Admin `audit_logs` ghi vết **16 loại sự kiện** (`BAN_USER`, `UNBAN_USER`, `DELETE_USER`, `APPROVE_GPKD`, `REJECT_GPKD`, `APPROVE_JOB_MODERATION`, `HIDE_JOB`, `UNHIDE_JOB`, `DELETE_JOB`, `HIDE_REVIEW`, `UNHIDE_REVIEW`, `DELETE_REVIEW`, `UPDATE_REPORT_STATUS`, `DELETE_REPORT`, `CREATE_ANNOUNCEMENT`, `DELETE_ANNOUNCEMENT`) qua **13 nhóm lọc** UI.
   * Admin phát Broadcast lọc bỏ user đang bị khóa; bấm **Xóa & Thu hồi** gỡ đồng bộ thông báo khỏi Chuông người nhận qua Socket.IO.
5. **Quy chuẩn Giao diện Responsive & Xuất Excel (`BR-CH-14`, `NFR-11`, `NFR-12`):**
   * Bắt buộc giao diện **Digital Light Dimension** sáng dịu mắt, **0 Emoji** trên toàn bộ luồng UI active (chỉ dùng **Lucide React Icons**), **Zero Native Dialogs** (không gọi `window.alert/confirm/prompt` — dùng `<ConfirmDialog />`).
   * Tương thích **4 kích thước màn hình** (`1920x1080`, `1366x768`, `820x1180`, `430x932`), cỡ chữ gốc `16px` (`text-xs`/`text-sm` chuẩn hóa `14px`), thứ tự nút bấm nhất quán (tích cực/lưu trước — hủy/xóa sau). Hỗ trợ xuất **6 mẫu bảng tính `.xls` UTF-8 BOM** (3 ở SV, 2 ở NTD, 1 ở QTV).

---

## PHẦN 4: BẢN ĐỒ TỔNG HỢP API ENDPOINTS & SỰ KIỆN SOCKET.IO THỰC TẾ

| Nhóm API / Socket | Tổng số | Các Endpoint / Event chính đang hoạt động (Verified Backend Routes) |
|---|---:|---|
| **Auth (`/api/auth`)** | 8 | `POST /register`, `POST /login`, `GET /me`, `POST /send-otp` (alias `/forgot-password`), `POST /verify-otp`, `POST /reset-password-otp`, `PUT /change-password`, `DELETE /delete-account`. |
| **Sinh viên (`/api/student`)** | 28 | `/profile` (`GET/PUT`), `/resumes` (`GET/POST/PUT/DELETE` + `/<id>/default`), `/bookmarks` (`GET` + `<job_id>` `POST/DELETE`), `/applications` (`POST/GET/DELETE` + `/cancel` `PUT` + `/shift-status` `PUT`), `/reviews` & `/received-reviews` (`GET/POST/PUT/DELETE`), `/cover-letters`, `/notifications`. |
| **Nhà tuyển dụng (`/api/employer`)** | 20 | `/company` (`GET/PUT`), `/jobs` (`GET/POST/PUT/DELETE` + `/status` `PATCH,PUT`), `/applicants` (`GET/DELETE` + `/status` `PUT` + `/attendance` `PUT`), `/reviews` & `/received-reviews`, `/notifications`. |
| **Quản trị viên (`/api/admin`)** | 32 | `/dashboard`, `/users` (`GET`, `/ban`, `/unban`, `DELETE`, `/<id>/resumes`), `/employers` (`GET`, `/<id>/gpkd`), `/jobs` (`GET`, `/approve-moderation`, `/hide`, `/unhide`, `DELETE`), `/categories`, `/banned-keywords`, `/reports` (`GET/PUT/DELETE` + `/<id>/chat-history`), `/reviews`, `/audit-logs`, `/announcements`. |
| **Dùng chung (`/api`) & Static** | 21 + 2 | `POST /api/upload`, `GET /api/files/<id>`, `/api/health`, `/api/categories`, `/api/jobs`, `/api/jobs/<id>`, `/api/companies/<ref>`, `/api/banned-keywords`, `/api/chat/messages`, `/api/chat/call/*` (`initiate/status/respond/end`), `/api/notifications/*`, `/api/reports`, `/api/reports/mine`, `/api/announcements`, `/uploads/*`. |
| **Socket.IO Realtime** | 10 on + 17 emit | Client: `register-user`, `join-room`, `leave-room`, `call-user`, `make-answer`, `send-candidate`, `reject-call`, `end-call`. Server push: `new-notification`, `new-chat-message`, `user-registered`, `user-status-updated`, `gpkd-reupload`, `gpkd-status-updated`, `new-job`, `job-updated`, `new-application`, `applicant-withdrawn`, `application-status-updated`, `shift-status-updated`, `new-review`, `review-updated`, `categories-updated`, `banned-keywords-updated`, `new-report`, `report-updated`, `audit-log-added`, `system-announcement`, `announcement-deleted`. |

---

## PHẦN 5: BẢNG ĐỐI CHIẾU 13 YÊU CẦU PHI CHỨC NĂNG (`NFR-01..13` — `FR.xlsx`)

| Mã NFR | Nhóm | Chỉ số / Ràng buộc đo lường thực tế |
|---|---|---|
| **NFR-01** | Hiệu năng truy vấn | Cache RAM 300s (`AtlasCollectionAdapter`) + tách blob > 2KB giúp truy vấn lặp dưới 1ms. |
| **NFR-02** | Phân trang & Kanban | `PaginationBar` hỗ trợ `10 / 20 / 50 / Tất cả` trên mọi bảng/danh sách; Kanban tải `12 thẻ/lượt` + `Xem thêm`/`Thu gọn`. |
| **NFR-03** | Bảo mật tài khoản | Băm PBKDF2-HMAC-SHA256 `100.000` vòng + JWT `HS256` 24 giờ + RBAC + kiểm tra `is_banned`. |
| **NFR-04** | Xác minh Gmail & OTP | OTP 6 số gửi qua Brevo API v3 hết hạn sau **60 giây**, bắt buộc `@gmail.com`, mật khẩu 5 điều kiện, 1 Email = 1 Role. |
| **NFR-05** | Bảo mật tệp | Giới hạn `<= 10MB`, kiểm tra magic bytes `%PDF` cho CV/GPKD, lưu trên MongoDB GridFS (chặn `.exe`, `.bat`, `.zip`, `.rar`). |
| **NFR-06** | Cô lập phiên đa thẻ | Tách key `localStorage` + `sessionStorage` giữa 3 vai trò mở song song 3 tab không ghi đè nhau. |
| **NFR-07** | Toàn vẹn dữ liệu | `<ErrorBoundary />` chống trắng trang, CV snapshot bất biến khi nộp đơn, Admin xóa người dùng cascade dọn sạch. |
| **NFR-08** | Truy vết Audit & Evidence | Ghi **16 sự kiện** Audit Log (lọc 13 nhóm), giữ `original_content` chưa che `***` để QTV đối chiếu. |
| **NFR-09** | Đồng bộ Realtime | Socket.IO hai chiều không cần F5 kết hợp chu kỳ làm mới nền dự phòng 15 giây & Universal Sync Event Hub. |
| **NFR-10** | WebRTC P2P Call | Gọi thoại/video 1-1 đúng ứng viên trong đơn, giữ `<CallMediaLayer />` nổi khi chuyển tab, tự chốt gọi nhỡ sau 180s. |
| **NFR-11** | Responsive 4 thiết bị | Chuẩn trên Mobile `430px`, iPad `820px`, Laptop `1366px`, PC `1920px`; base font `16px`, tối thiểu `14px`, chống gãy dọc chữ. |
| **NFR-12** | Tìm kiếm & Xuất Excel | Tìm kiếm tiếng Việt không dấu chính xác Quận 1 vs Quận 10/11/12; xuất **6 báo cáo `.xls`** chuẩn UTF-8 BOM. |
| **NFR-13** | Bảo trì & Triển khai | Backend tách 5 phân hệ (`auth`, `student`, `employer`, `admin`, `common`); deploy hợp nhất một cổng Render hoặc `localhost:8002`. |
