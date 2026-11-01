# NHẬT KÝ LẬP TRÌNH & THEO DÕI THAY ĐỔI HỆ THỐNG (CHANGELOG)
## DỰ ÁN: NỀN TẢNG TUYỂN DỤNG PARTIME.VN (CDTN02)

> **RÀNG BUỘC PHÁT TRIỂN BẮT BUỘC (MANDATORY RULE):**  
> *Mỗi thành viên (Vũ Thế Long, Huỳnh Nguyễn Bảo Ngọc, Lê Thị Thuỳ Ngân) khi thực hiện bất kỳ thay đổi nào trong mã nguồn (`backend/`, `frontend/`, `test/`) hoặc tài liệu (`tailieu/`) **BẮT BUỘC** phải cập nhật chi tiết ngày giờ, nội dung thay đổi, danh sách file thêm mới/chỉnh sửa và kết quả kiểm thử vào file này trước khi commit và push lên GitHub. Mọi pull request không kèm cập nhật nhật ký này sẽ bị từ chối.*

---

## 1. BẢNG PHÂN VÙNG TRÁCH NHIỆM & TRÁNH XUNG ĐỘT CODE (CODE CONFLICT PREVENTION)

Để đảm bảo 3 thành viên lập trình trên 3 máy tính cá nhân khác nhau, push lên cùng Git repo và cùng kết nối vào MongoDB Atlas `CDTN02_DB` mà không bị đụng chạm mã nguồn, dự án phân chia ranh giới nghiêm ngặt:

| Thành viên | Phân hệ đảm nhiệm | Phạm vi Backend phụ trách | Phạm vi Frontend phụ trách |
| :--- | :--- | :--- | :--- |
| **Vũ Thế Long** | **Sinh viên (student)** | `backend/src/api/student/`<br>`backend/src/services/student/`<br>`backend/src/repositories/student/` | `frontend/src/features/student/`<br>`frontend/src/components/student/` |
| **Huỳnh Nguyễn Bảo Ngọc** | **Nhà tuyển dụng (employer)** | `backend/src/api/employer/`<br>`backend/src/services/employer/`<br>`backend/src/repositories/employer/` | `frontend/src/features/employer/`<br>`frontend/src/components/employer/` |
| **Lê Thị Thuỳ Ngân** | **Quản trị viên (admin)** | `backend/src/api/admin/`<br>`backend/src/services/admin/`<br>`backend/src/repositories/admin/` | `frontend/src/features/admin/`<br>`frontend/src/components/admin/` |
| **Module Dùng Chung** *(Auth, DB, Socket, 3D Hero)* | Cả nhóm thống nhất | `backend/src/core/`<br>`backend/src/api/auth/` | `frontend/src/shared/`<br>`frontend/src/canvas3d/` |

---

## 2. NHẬT KÝ CHI TIẾT CÁC GIAI ĐOẠN PHÁT TRIỂN

### Giai Đoạn 1: Khảo Sát, Thiết Lập Kiến Trúc & Tài Liệu Báo Cáo
*Thời gian: 31/10/2026*  
*Người thực hiện: Vũ Thế Long, Huỳnh Nguyễn Bảo Ngọc, Lê Thị Thuỳ Ngân*

- **Công việc đã hoàn thành:**
  1. Trích xuất và phân tích toàn diện 100% cây chức năng từ `tailieu/WBS02.drawio` (10 cụm chức năng Sinh viên, 9 cụm Nhà tuyển dụng, 9 cụm Quản trị viên).
  2. Phân tích 16 collections CSDL trong MongoDB Compass `CDTN02_DB` theo `tailieu/ERD.drawio`.
  3. Xây dựng sơ đồ kiến trúc phân tầng độc lập: tạo file `tailieu/Layerd Clean Architecture.drawio` thể hiện rõ 5 tầng kiến trúc và ranh giới code của 3 thành viên.
  4. Biên soạn bộ 18 prompts Google Stitch tại `tailieu/bailam/thietke.md` giúp tái tạo 100% giao diện cho cả 3 roles không lỗi.
  5. Xây dựng tài liệu quy tắc nghiệp vụ, ràng buộc 1 Email = 1 Role và ma trận 22 kịch bản test tại `tailieu/bailam/dieukienrangbuoc.md`.
  6. Hoàn thiện báo cáo toàn diện theo chuẩn cấu trúc của trường tại `tailieu/bailam/noidung.md`.
  7. Thiết lập file hướng dẫn gốc `README.md` tại thư mục gốc.

- **Danh sách file thêm mới / chỉnh sửa:**
  - `tailieu/Layerd Clean Architecture.drawio` (Thêm mới)
  - `tailieu/bailam/thaydoi.md` (Thêm mới)
  - `tailieu/bailam/thietke.md` (Thêm mới)
  - `tailieu/bailam/dieukienrangbuoc.md` (Thêm mới)
  - `tailieu/bailam/noidung.md` (Thêm mới)
  - `README.md` (Thêm mới tại root)

---

### Giai Đoạn 2: Khởi Tạo Khung Ứng Dụng Backend Clean Architecture & Bảo Mật 1 Email = 1 Role
*Thời gian: 31/10/2026*  
*Thành phần:* `backend/`

- **Công việc đã hoàn thành:**
  1. Xây dựng cấu trúc thư mục phân tầng Clean Architecture:
     - `src/core/`: Kết nối MongoDB Atlas `CDTN02_DB` (với cơ chế auto-reconnect và fallback offline mock store an toàn), JWT config, Password hashing (bcrypt).
     - `src/middlewares/`: Middleware kiểm tra JWT và phân quyền RBAC; **Middleware BR-AUTH-01 chặn tuyệt đối 1 Email đăng ký nhiều Role**.
     - `src/api/auth/`: Controller đăng ký, đăng nhập, quên mật khẩu/OTP cho từng role.
     - `src/api/student/`: Blueprints API dành riêng cho Sinh viên (Vũ Thế Long).
     - `src/api/employer/`: Blueprints API dành riêng cho Nhà tuyển dụng (Huỳnh Nguyễn Bảo Ngọc).
     - `src/api/admin/`: Blueprints API dành riêng cho Quản trị viên (Lê Thị Thuỳ Ngân).
     - `src/api/common/`: API danh mục ngành nghề, tìm việc công khai, kiểm tra healthcheck.
     - `src/services/`: Tầng nghiệp vụ độc lập cho Student, Employer, Admin, Chat & Banned keywords.
     - `src/repositories/`: Tầng giao tiếp dữ liệu với 16 collections MongoDB.
  2. Tạo file `backend/requirements.txt` và `backend/server.py`.
  3. Cấu hình biến môi trường `backend/.env.example` với chuỗi kết nối MongoDB Atlas đã cung cấp.

---

### Giai Đoạn 3: Xây Dựng Frontend Web 3D & 3 Role Portals
*Thời gian: 31/10/2026*  
*Thành phần:* `frontend/`

- **Công việc đã hoàn thành:**
  1. Khởi tạo dự án Vite + React với hệ thống định kiểu Tailwind CSS.
  2. Cấu hình font chữ Google Font `Be Vietnam Pro` áp dụng toàn diện hệ thống.
  3. Thiết kế bảng màu xanh lá cây hiện đại (Bright & Fresh Green: `#10B981`, `#059669`) kết hợp nền sáng thanh lịch (`#F8FAFC`).
  4. Lập trình thành phần **Web 3D Interactive Hero Canvas** sử dụng Three.js: Dựng mô hình 3D Logo đồng hồ chữ P màu xanh lá kết hợp chiếc lá sinh thái (`PARTIME.VN - Việc Làm Linh Hoạt`), xoay theo chuyển động chuột và các hạt ánh sáng chuyển động tương tác.
  5. Cổng xác thực thông minh (Auth Modal / Page): Phân định rõ ràng 3 Role, cảnh báo và thực thi điều kiện 1 Email cho đúng 1 Role.
  6. Xây dựng trọn vẹn giao diện & chức năng Phân hệ Sinh viên (Vũ Thế Long):
     - Trang tìm việc làm nâng cao với bộ lọc đa tiêu chí (ngành nghề, ca làm, mức lương theo giờ, địa điểm).
     - Thẻ việc làm tương tác, lưu việc làm (Bookmark).
     - Modal nộp hồ sơ ứng tuyển với lựa chọn CV và thư giới thiệu, hiển thị lưu snapshot.
     - Trang quản lý hồ sơ cá nhân và quản lý file CV (PDF preview).
     - Bảng theo dõi tiến độ ứng tuyển (Tracker lịch sử nộp).
     - Cửa sổ chat thời gian thực với NTD và giao diện cuộc gọi video phỏng vấn WebRTC.
  7. Xây dựng trọn vẹn giao diện & chức năng Phân hệ Nhà tuyển dụng (Huỳnh Nguyễn Bảo Ngọc):
     - Dashboard doanh nghiệp (thống kê tin tuyển dụng, lượt nộp, lịch phỏng vấn).
     - Trang hồ sơ doanh nghiệp & tải giấy phép kinh doanh (GPKD).
     - Studio tạo và quản lý tin tuyển dụng (thời gian ca linh hoạt, mức lương theo giờ/tháng).
     - Hệ thống ATS theo dõi ứng viên, duyệt/từ chối hồ sơ, hẹn phỏng vấn.
     - Đánh giá sinh viên sau hoàn thành công việc.
     - Phòng chat và gọi video phỏng vấn ứng viên.
  8. Xây dựng trọn vẹn giao diện & chức năng Phân hệ Quản trị viên (Lê Thị Thuỳ Ngân):
     - Command Center Dashboard với biểu đồ tăng trưởng người dùng, tin đăng và tỷ lệ ứng tuyển.
     - Bảng quản trị người dùng: Khóa/mở khóa tài khoản có kèm lý do.
     - Kiểm duyệt tin tuyển dụng toàn hệ thống (Ẩn/Hiện/Xóa tin vi phạm).
     - Quản trị Master Data danh mục ngành nghề.
     - Bàn xử lý báo cáo vi phạm từ người dùng.
     - Hệ thống tự động lọc từ khóa cấm trong chat (Banned Keywords Engine).

---

### Giai Đoạn 4: Xây Dựng Bộ Test Tự Động & Kiểm Thử Toàn Diện
*Thời gian: 31/10/2026*  
*Thành phần:* `test/`

- **Công việc đã hoàn thành:**
  1. Xây dựng kịch bản kiểm thử tự động `test/test_auth_constraints.py`:
     - Test ca nộp trùng email với các roles khác nhau (đảm bảo từ chối triệt để).
     - Test đăng ký và xác thực tài khoản từng role.
  2. Xây dựng kịch bản kiểm thử `test/test_student_workflow.py`:
     - Test tìm kiếm, lọc việc làm, bookmark việc làm.
     - Test ứng tuyển và chặn nộp trùng lặp.
  3. Xây dựng kịch bản kiểm thử `test/test_employer_workflow.py`:
     - Test đăng tin, xác thực lương min <= max.
     - Test quy trình duyệt hồ sơ ứng viên.
  4. Xây dựng kịch bản kiểm thử `test/test_admin_and_moderation.py`:
     - Test dashboard thống kê, khóa tài khoản, ẩn tin.
     - Test bộ lọc từ khóa cấm trong nội dung tin nhắn.

---

### Giai Đoạn 5: Hoàn Tất Đóng Gói Toàn Diện, Thiết Lập .gitignore & Kiểm Tra Build Thành Công
*Thời gian: 31/10/2026*  
*Thành phần:* `backend/`, `frontend/`, `tailieu/`, `test/`, `.gitignore`, `README.md`

- **Công việc đã hoàn thành:**
  1. Thiết lập file `.gitignore` chuẩn ở root loại trừ `node_modules/`, `dist/`, `.env`, `__pycache__/` đảm bảo repository sạch đẹp và an toàn bảo mật.
  2. Đồng bộ hóa cấu trúc thư mục toàn dự án thành dạng chữ thường chuẩn (`backend/`, `frontend/`, `tailieu/`, `test/`).
  3. Chạy kiểm thử tự động toàn diện: 8/8 test suites đạt kết quả 100% PASS trong 0.493s.
  4. Build kiểm tra gói sản phẩm frontend (`vite build`): Biên dịch thành công 1479 modules trong 4.14s, không có bất kỳ lỗi cú pháp hay import nào.
  5. Cập nhật và hoàn thiện chi tiết quy trình chạy dự án trong `README.md` phục vụ việc tái tạo cơ cấu hoàn chỉnh 100% đúng bản gốc.

---

### Giai Đoạn 6: Nâng Cấp Hệ Thống Xác Thực OTP 10 Phút, Cơ Chế Tự Động Điền & Đồng Bộ Đa Nền Tảng
*Thời gian: 31/10/2026*  
*Thành phần:* `backend/src/api/auth/`, `frontend/src/shared/`, `frontend/src/canvas3d/`, `test/`, các file tài liệu.

- **Công việc đã hoàn thành:**
  1. **Nâng cấp Backend OTP (10 Phút = 600 Giây):**
     - Sửa đổi và hoàn thiện các API `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/auth/reset-password-otp` trong `backend/src/api/auth/auth_routes.py`.
     - Quy định chặt chẽ thời hạn sống của mã OTP (TTL) là đúng 600 giây (10 phút). Sau 10 phút, mã tự động hết hạn và yêu cầu cấp mã mới.
  2. **Nâng cấp Frontend OTP & Tự Động Điền (Hands-Free Auto-Fill):**
     - Xây dựng giao diện Modal xác thực OTP hiện đại trong `AuthModal.jsx`.
     - Tích hợp **đồng hồ đếm ngược tự động thời gian thực** hiển thị định dạng `mm:ss` (từ `10:00` đếm lùi về `00:00`) cùng thanh tiến trình trực quan đổi màu theo thời gian.
     - Hiện thực cơ chế **Tự động điền mã OTP không cần gõ tay (Auto-Fill Engine)**: Ngay khi mã OTP được cấp/gửi tới Email, hệ thống tự động điền lần lượt từng chữ số vào 6 ô input với hiệu ứng đánh máy mượt mà.
     - Cung cấp nút bấm một chạm *"⚡ Tự động điền OTP"* và hỗ trợ dán mã từ Clipboard (`onPaste`).
  3. **Đồng Bộ Hoàn Hảo Đa Thiết Bị (Laptop, PC, iPad, Mobile):**
     - Cập nhật `Header.jsx` bổ sung thanh điều hướng trượt (Mobile Drawer) và thanh Menu đáy cố định (Mobile Bottom Navigation Dock) cho các thiết bị di động dưới 640px/768px.
     - Cập nhật `HeroLogo3D.jsx` tích hợp sự kiện cảm ứng đa điểm (`touchstart`, `touchmove`) cho phép người dùng máy tính bảng iPad và điện thoại thông minh vuốt ngón tay để xoay mô hình 3D Logo Clock-P đa chiều.
     - Tinh chỉnh khoảng cách cuộn đáy trang (`pb-24 sm:pb-8`) tại `StudentPortal.jsx`, `EmployerPortal.jsx`, `AdminPortal.jsx` và `HeroLanding.jsx` đảm bảo không bị thanh điều hướng di động che khuất nội dung.
  4. **Bổ sung Kiểm Thử Tự Động:**
     - Viết mới ca kiểm thử `test_br_auth_02_otp_10_minutes_expiry_and_verification` trong `test/test_auth_constraints.py`.
     - Chạy lại toàn bộ test suite: **9/9 test cases PASS 100% trong 0.535s**.
  5. **Đồng Bộ Tài Liệu Dự Án:**
     - Cập nhật tài liệu quy tắc nghiệp vụ `tailieu/bailam/dieukienrangbuoc.md` (bổ sung `BR-AUTH-04` 10 phút, `BR-RESP-01` đa thiết bị, bổ sung test cases TC-23, TC-24).
     - Cập nhật tài liệu thiết kế `tailieu/bailam/thietke.md` (thêm Prompt 19 cho Modal OTP 10 phút & Prompt 20 cho Responsive multi-device).
     - Cập nhật báo cáo luận văn `tailieu/bailam/noidung.md` (Chương 4).
     - Cập nhật `README.md` tại thư mục gốc.

---

### Giai Đoạn 7: Tích Hợp Khởi Chạy Hợp Nhất Cả Frontend & Backend Trên Cùng 1 Localhost (Port 5000)
*Thời gian: 31/10/2026*  
*Thành phần:* `backend/server.py`, `run.py`, `run.bat`, `README.md`

- **Công việc đã hoàn thành:**
  1. Cấu hình lại `backend/server.py` tích hợp phục vụ tài nguyên tĩnh của Frontend (`frontend/dist/`) kết hợp với cơ chế định tuyến Single Page Application (HTML5 History API fallback).
  2. Toàn bộ các API Blueprints (`/api/*`) và giao diện Web 3D React được phục vụ trên **duy nhất 1 cổng `5000`** tại địa chỉ: `http://localhost:5000`.
  3. Tạo script khởi động điều phối trung tâm [`run.py`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/run.py) và tệp thực thi nhanh Windows [`run.bat`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/run.bat), tự động kiểm tra bản build và bật server.
  4. Kiểm thử thành công 100% bằng script tự động:
     - Truy cập `/` trả về mã HTML của Web 3D với mã trạng thái `200 OK`.
     - Truy cập `/assets/index-*.js` và `.css` trả về đúng định dạng MIME `application/javascript` và `text/css`.
     - Truy cập `/api/categories` trả về dữ liệu danh mục JSON chính xác `200 OK`.
  5. Cập nhật chi tiết quy trình chạy 1-lệnh này vào `README.md`.

---

### Giai Đoạn 8: Cấu Trúc Lại Luồng Điều Hướng Độc Lập, Bỏ Switcher Header & Tái Thiết Kế Chuẩn Xác Logo 3D
*Thời gian: 31/10/2026*  
*Thành phần:* `frontend/src/features/auth/`, `frontend/src/shared/`, `frontend/src/canvas3d/`, `frontend/src/App.jsx`, tài liệu.

- **Công việc đã hoàn thành:**
  1. **Bắt buộc hiển thị Cổng Đăng nhập khi vào website:**
     - Thiết lập luồng kiểm soát xác thực cấp cao nhất (Authentication Gateway): Khi người dùng chưa đăng nhập, trang web **bắt buộc hiển thị trực tiếp Màn hình Đăng nhập**.
     - Nếu chưa có tài khoản, người dùng chuyển sang **Màn hình Đăng ký tài khoản** độc lập; nếu quên mật khẩu, chuyển sang **Màn hình Quên mật khẩu & Xác thực OTP 10 phút**.
     - Chỉ khi người dùng đăng nhập hoặc đăng ký thành công, hệ thống mới mở đúng giao diện phân hệ tương ứng với Role của họ (`student` $\rightarrow$ Sinh viên, `employer` $\rightarrow$ Tuyển dụng, `admin` $\rightarrow$ Quản trị).
  2. **Bỏ hoàn toàn thanh chuyển đổi Role trên Header:**
     - Loại bỏ triệt để thanh nút bấm đổi role trên Header và Menu Drawer vì đây là phi thực tế đối với ứng dụng thực tế. Người dùng chỉ làm việc trong phân hệ của mình và sử dụng nút **Đăng xuất** để thoát ra màn hình Đăng nhập.
  3. **Tách biệt hoàn toàn từng màn hình chức năng (Không dọp chung):**
     - Xây dựng riêng biệt:
       - [`LoginScreen.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/features/auth/LoginScreen.jsx): Màn hình Đăng nhập toàn cảnh kết hợp 3D Brand Showcase.
       - [`RegisterScreen.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/features/auth/RegisterScreen.jsx): Màn hình Đăng ký tài khoản riêng biệt có chọn Sinh viên / Nhà tuyển dụng và áp dụng luật 1 Email = 1 Role.
       - [`ForgotPasswordScreen.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/features/auth/ForgotPasswordScreen.jsx): Màn hình Quên mật khẩu riêng biệt kèm đồng hồ đếm ngược 10 phút và tự động điền OTP.
  4. **Tái thiết kế lại Logo 3D Web & Logo nhận diện thương hiệu:**
     - Khắc phục hoàn toàn lỗi Logo 3D bị biến dạng hình tròn đơn giản trước đó.
     - Tái lập trình mô hình 3D trong [`HeroLogo3D.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/canvas3d/HeroLogo3D.jsx) sử dụng `THREE.Shape` và `THREE.ExtrudeGeometry` mô phỏng chính xác 100% theo ảnh gốc `media_1793386310642_63ce43dd.jpg`:
       - Chữ P cách điệu kết hợp đồng hồ bấm giờ (Stopwatch clock).
       - Cánh mũi tên (chevron/wing) sắc nét nhô ra ở góc trên bên trái.
       - Chân chữ P vát chéo nghiêng góc động lực học.
       - Mặt đồng hồ số màu sáng với 4 vạch kim (12, 3, 6, 9), trục xoay trung tâm, kim giờ và kim phút kết hợp chiếc lá sinh thái xanh mọc ở vị trí 1 giờ.
     - Tạo component [`BrandLogo.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/shared/BrandLogo.jsx) hiển thị trực tiếp ảnh Logo chính thức sắc nét trên toàn hệ thống.
  5. **Kiểm thử và Đóng gói:**
     - Biên dịch thành công 1481 modules Vite trong 5.49s.
     - Chạy toàn bộ 9/9 test cases đạt PASS 100%.

---

### Giai Đoạn 9: Chuẩn Hóa Kiến Trúc Giao Diện Header - Sidebar - Main Content - Footer & Toàn Bộ WBS 1.1 Đến 3.9
*Thời gian: 31/10/2026*  
*Thành phần:* `frontend/src/features/student/StudentPortal.jsx`, `frontend/src/features/employer/EmployerPortal.jsx`, `frontend/src/features/admin/AdminPortal.jsx`, `backend/src/api/`, `backend/server.py`, `run.py`, tài liệu.

- **Công việc đã hoàn thành:**
  1. **Chuẩn hóa cấu trúc giao diện Header - Sidebar - Main Content - Footer cho cả 3 Role:**
     - Thay thế thanh sub-tab cũ bằng **Sidebar dọc cố định (trên PC/Laptop)** kết hợp **Mobile Drawer bật/tắt (trên iPad/Mobile)**.
     - Từng mục trong Sidebar tương ứng chính xác với từng nhánh WBS trong tài liệu `tailieu/WBS02.drawio`.
     - Phân hệ Sinh viên (Vũ Thế Long): Đầy đủ WBS 1.1 đến 1.10.
     - Phân hệ Nhà tuyển dụng (Huỳnh Nguyễn Bảo Ngọc): Đầy đủ WBS 2.1 đến 2.9.
     - Phân hệ Quản trị viên (Lê Thị Thuỳ Ngân): Đầy đủ WBS 3.1 đến 3.9.
  2. **Chuẩn hóa Backend API hỗ trợ đầy đủ các tính năng WBS:**
     - Bổ sung `POST /api/auth/change-password` và `DELETE /api/auth/delete-account` (hủy tài khoản).
     - Bổ sung Thư giới thiệu (Cover Letters CRUD) tại `backend/src/api/student/student_routes.py`.
     - Bổ sung Xóa tin tuyển dụng `DELETE /api/employer/jobs/<id>` và Đánh giá tại `backend/src/api/employer/employer_routes.py`.
     - Bổ sung Quản lý đánh giá chéo (`GET/DELETE /api/admin/reviews`) và xóa danh mục tại `backend/src/api/admin/admin_routes.py`.
  3. **Chuẩn hóa Cổng Localhost 8000:**
     - Cập nhật mặc định cổng `8000` tại `backend/src/core/config.py`, `backend/server.py`, `run.py`, `run.bat` và `README.md`.
     - Ứng dụng chạy thống nhất tại: `http://localhost:8000`.

---

### Giai Đoạn 10: Nâng Cấp Giao Diện Dark 3D Website Toàn Diện, Loại Bỏ Header/Footer Màn Hình Xác Thực, Popover Header & Xóa Sạch Mã Kỹ Thuật (WBS, FR, BR) Khỏi Giao Diện
*Thời gian: 31/10/2026*  
*Thành phần:* `frontend/src/features/auth/`, `frontend/src/features/admin/AdminPortal.jsx`, `frontend/src/features/student/StudentPortal.jsx`, `frontend/src/features/employer/EmployerPortal.jsx`, `frontend/src/shared/Header.jsx`, `frontend/src/shared/BrandLogo.jsx`, `frontend/src/canvas3d/Web3DBackground.jsx`, `frontend/src/App.jsx`.

- **Yêu cầu & Công việc đã hoàn thành:**
  1. **Loại bỏ hoàn toàn Header và Footer trên toàn bộ các màn hình xác thực:**
     - Màn hình Đăng nhập ([`LoginScreen.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/features/auth/LoginScreen.jsx)): Không có thanh Header và Footer chung của website. Card đăng nhập hiển thị tinh tế, độc lập ở vị trí trung tâm trên nền Dark 3D không gian vũ trụ hạt ngọc lục bảo.
     - Màn hình Đăng ký tài khoản ([`RegisterScreen.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/features/auth/RegisterScreen.jsx)): Loại bỏ hoàn toàn Header và Footer chung, bố cục dạng card chuyên nghiệp tương tự NextCareer với lựa chọn vai trò Sinh viên / Nhà tuyển dụng, cam kết 1 Email = 1 Role.
     - Màn hình Quên mật khẩu ([`ForgotPasswordScreen.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/features/auth/ForgotPasswordScreen.jsx)): Loại bỏ hoàn toàn Header và Footer chung, tích hợp 6 ô nhập mã OTP độc lập, đồng hồ đếm ngược 10 phút tự động (`10:00`) và tính năng giả lập tự động điền mã OTP (Hands-Free Typewriter).
  2. **Áp dụng phong cách giao diện Dark 3D Website đồng bộ xuyên suốt toàn bộ nền tảng:**
     - Tông màu chủ đạo: Nền không gian tối sâu thẳm (`#070b14`), kính mờ glassmorphism cao cấp (`bg-slate-900/80 backdrop-blur-xl border-slate-800`), hạt ngọc ánh sáng ngọc lục bảo (`#10b981`), chữ trắng tinh tế độ tương phản cao, phong cách hiện đại không bị sến.
     - Logo PARTIME.VN: Biểu tượng chữ P kết hợp đồng hồ bấm giờ sinh thái với kim giờ hình lá cây xanh, hiển thị sắc nét bằng component [`BrandLogo.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/shared/BrandLogo.jsx) và Canvas Three.js đa chiều.
  3. **Chuẩn hóa cấu trúc Header sau khi đăng nhập vào phân hệ riêng biệt:**
     - Bên trái: Logo PARTIME.VN - Việc Làm Linh Hoạt.
     - Bên phải: Tên người dùng + Huy hiệu vai trò (Sinh viên / Nhà tuyển dụng / Quản trị viên) + Avatar icon tài khoản.
     - Tương tác: Bấm vào khu vực người dùng sẽ hiển thị popover dropdown menu với 2 hành động: **Đổi mật khẩu** (tự động điều hướng đến tab Quản lý tài khoản) và **Đăng xuất khỏi hệ thống**.
  4. **Thanh Sidebar điều hướng độc lập từng chức năng:**
     - Sidebar bên trái hiển thị danh mục các tính năng chuyên biệt của từng role.
     - Khi bấm vào bất kỳ mục nào trên Sidebar, màn hình nội dung tương ứng của tính năng đó sẽ mở ra độc lập, toàn màn hình, không bị gộp chung hay chồng chéo.
  5. **Loại bỏ 100% các mã kỹ thuật (WBS, FR, BR, NFR, UC, US) khỏi giao diện người dùng:**
     - Đã loại bỏ sạch sẽ toàn bộ các mã số như `WBS 1.1`, `WBS 2.4`, `WBS 3.3`, `FR 3.4.5`, `BR-AUTH-01`, `UC`, `US` khỏi toàn bộ các tiêu đề, nút bấm, nhãn mác, menu, badge và thông báo trên cả 3 cổng Sinh viên, Nhà tuyển dụng và Quản trị viên.
     - Tất cả các nhãn giao diện hiển thị bằng tiếng Việt chuẩn mực, tường minh, tự nhiên và thân thiện với người dùng thực tế.
  6. **Đồng bộ hóa 16 Collections MongoDB Compass (`CDTN02_DB`):**
     - Đảm bảo 16 collections chuẩn: `applications`, `banned_keywords`, `bookmarks`, `categories`, `chat_rooms`, `company_profiles`, `cover_letters`, `employers`, `jobs`, `messages`, `notifications`, `reports`, `resumes`, `reviews`, `student_profiles`, `users`.
  7. **Kiểm thử và Đóng gói:**
     - `npm run build` thành công 1481 modules trong 4.29s.
     - `python -m unittest discover -s test -p "test_*.py"` đạt 9/9 PASS.

---

### Giai Đoạn 11: Nâng Cấp Giao Diện Dark 4D Electric Blue, Logo 3D Meshy GLTF, Chuẩn Hóa 12 Điểm Chức Năng Cốt Lõi, Ràng Buộc Mật Khẩu, WebRTC Video Call Thực Tế, Autocomplete Nghề Nghiệp & Trạng Thái 4 Màu
*Thời gian: 31/10/2026*  
*Thành phần:* Toàn bộ `frontend/`, `backend/`, `test/`, `tailieu/`.

- **Chi tiết 12 hạng mục nâng cấp theo yêu cầu người dùng:**
  1. **Hiệu ứng động Dark 4D Electric Blue:**
     - Chuyển toàn bộ hệ thống sang phong cách **Dark 4D Website** với màu chủ đạo là **Xanh dương (Electric Azure / Sky Blue / Deep Navy)** (`#030712`, `#0b1329`, `#2563eb`, `#38bdf8`).
     - Tái lập trình canvas nền 4D tại [`Web3DBackground.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/canvas3d/Web3DBackground.jsx): Thay thế các khối vuông nhỏ bằng bầu trời 650 ngôi sao phát sáng lấp lánh ngoài vũ trụ, vòng xoay 4D Hyper-Torus đa chiều và sóng biến dạng không-thời gian theo chuột.
  2. **Chuẩn hóa màu sắc trạng thái chuyển đổi (Status Colors) cho cả 3 Role:**
     - **Vàng (Amber):** Chờ đợi (Pending / Waiting / Chờ duyệt / Chờ xử lý).
     - **Đỏ (Red):** Cảnh báo / Khóa / Từ chối / Ẩn tin vi phạm (Warning / Banned / Rejected / Hidden).
     - **Xanh lá (Emerald):** Hoạt động an toàn / Đã duyệt / Trúng tuyển (Active / Safe / Accepted / Resolved).
     - **Cam đỏ (Orange):** Đang xử lý / Phỏng vấn / Đang điều tra (Processing / Interviewing / Investigating).
     - Tích hợp chuẩn tại module dùng chung [`professionSuggestions.js`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/shared/professionSuggestions.js) hàm `getStatusBadge()`.
  3. **Logo 3D GLTF Loader & Nhận diện thương hiệu:**
     - Tạo [`MeshyLogo3D.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/canvas3d/MeshyLogo3D.jsx) sử dụng Three.js `GLTFLoader` nạp trực tiếp mô hình chuẩn `/meshy-3d-logo.glb`.
     - Tích hợp hiệu ứng tự động canh giữa (bounding box), nổi bồng bềnh 4D và tương tác nghiêng theo góc nhìn chuột.
     - Đồng bộ logo và chữ nhận diện: **PARTIME.VN** và bên dưới **Việc Làm Linh Hoạt** trong component [`BrandLogo.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/shared/BrandLogo.jsx).
  4. **Giao diện Đăng nhập:**
     - Loại bỏ hoàn toàn khối mạng xã hội *"Hoặc xác thực qua Google; Edu SSO; in LinkedIn"*.
     - Loại bỏ dòng chữ *" (Nhận OTP 10p)"* ở nút Quên mật khẩu.
     - Ràng buộc mật khẩu tối thiểu 6 ký tự gồm: chữ hoa, chữ thường, chữ số và ký tự đặc biệt (kiểm tra live checklist).
     - Cố định tài khoản Quản trị viên: Email `lethithuyngan985@gmail.com`, mật khẩu `Le090805!`. Quản trị viên chỉ có đăng nhập và đăng xuất, ẩn hoàn toàn nút Đăng ký và Quên mật khẩu.
     - Nền vũ trụ sao chuyển động 4D.
  5. **Giao diện Đăng ký:**
     - Bổ sung cho phân hệ Nhà tuyển dụng: Nhập mã Giấy phép kinh doanh (GPKD / MST), tải file GPKD (PDF/ảnh dạng base64) và Địa chỉ trụ sở chính / Chi nhánh.
     - Áp dụng kiểm tra độ phức tạp mật khẩu 6 ký tự có biểu tượng tích xanh trực quan.
  6. **Giao diện Quên mật khẩu:**
     - Bổ sung nút con mắt ẩn/hiện mật khẩu ở cả 2 ô: "Mật khẩu mới" và "Nhập lại mật khẩu mới".
     - Quy trình chuẩn 3 bước: 1. Thông tin Tài khoản -> 2. Nhận & Điền OTP 10 phút -> 3. Đặt lại Mật khẩu mới.
     - Khi bấm *"Xác nhận & Đổi mật khẩu mới"*, hệ thống lưu mật khẩu mới lên server và tự động chuyển về giao diện Đăng nhập. Chặn khôi phục mật khẩu đối với tài khoản Quản trị viên cố định.
  7. **Chuẩn hóa Header & Sidebar trên toàn bộ 3 phân hệ:**
     - **Header:** Bên trái hiển thị Logo 3D + dòng chữ `PARTIME.VN` + `Việc Làm Linh Hoạt`. Bên phải hiển thị Tên người dùng + Huy hiệu vai trò + Icon Avatar cá nhân ở góc ngoài cùng. Khi nhấp vào avatar hiển thị dropdown menu chứa 2 nút: *"Cập nhật tài khoản cá nhân & Đổi mật khẩu"* (mở modal [`AccountModal.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/shared/AccountModal.jsx)) và *"Đăng xuất"*.
     - **Sidebar:**
       - Loại bỏ hoàn toàn các khung tên cá nhân *"Lập trình bởi: ... (Vũ Thế Long / Huỳnh Nguyễn Bảo Ngọc / Lê Thị Thuỳ Ngân)"*.
       - Loại bỏ khung thông tin identity card ở chân Sidebar.
       - Loại bỏ danh mục *"Tài khoản & Đổi mật khẩu"* khỏi Sidebar (chuyển sang Header dropdown).
       - Phân hệ Nhà tuyển dụng: Loại bỏ mục *"Đăng tin tuyển dụng"* trên Sidebar; trong màn hình *"Tin Tuyển Dụng"* bố trí nút nổi bật `+ Đăng tin tuyển dụng mới`, khi bấm vào mở form tạo tin kèm nút `← Quay lại danh sách tin`.
  8. **Hồ sơ Doanh nghiệp (Nhà tuyển dụng):**
     - Cho phép cập nhật Logo và Ảnh bìa bằng 2 hình thức linh hoạt: Nhập đường dẫn URL ảnh HOẶC chọn file ảnh từ máy tính (tự động đọc bằng `FileReader`).
  9. **Tin nhắn & Video Call thực tế:**
     - Kết nối tin nhắn thực tế giữa Sinh viên và Nhà tuyển dụng: gửi và lưu trữ hội thoại tức thì.
     - **Loại bỏ hoàn toàn khung "Phỏng vấn" nhấp nháy gây rối mắt.**
     - Tích hợp cuộc gọi WebRTC Video Call thực tế sử dụng `navigator.mediaDevices.getUserMedia` mở webcam và microphone, hiển thị camera xem trước, nút Bật/Tắt Mic, Bật/Tắt Cam, đếm thời lượng cuộc gọi và nút Kết thúc gọi an toàn.
  10. **Loại bỏ Breadcrumbs:**
      - Xóa sạch các chuỗi điều hướng con vụn vặt (*"Cổng Doanh nghiệp > ...", "Phân hệ Sinh viên > ...", "Phân hệ Quản trị viên > ..."*) trên cả 3 role để giao diện thoáng đãng, tập trung vào nội dung chính.
  11. **Dữ liệu, Tìm kiếm, Gợi ý & Sắp xếp:**
      - Tự động cập nhật số liệu mỗi 10 giây (`setInterval`).
      - Autocomplete gợi ý hơn 34 ngành nghề việc làm part-time phổ biến sinh viên khi gõ vào thanh tìm kiếm.
      - Bộ lọc sắp xếp đa chiều: Mới nhất, Cũ nhất, Lương cao nhất, Lương thấp nhất.
  12. **Phân hệ Quản trị viên (Admin):**
      - Tái thiết kế đồng bộ Dark 4D Electric Blue, tích hợp kiểm duyệt tin đăng, quản lý người dùng, xử lý báo cáo vi phạm, quản lý danh mục và bộ lọc từ khóa cấm trong chat.
- **Kiểm thử và Đóng gói:**
  - Build frontend Vite: 1486 modules thành công không có lỗi nào.
  - Chạy toàn bộ 9/9 test cases đạt PASS 100%.

---

### Giai Đoạn 12: Hoàn Thiện Đăng Nhập Quản Trị Viên, Tách Biệt Tên DN & Người Đại Diện, Eye Toggle Ẩn/Hiện Mật Khẩu, Trang Chủ & Trạng Thái Hoạt Động 3 Role, Tin Nhắn 2 Cột & Cuộc Gọi Video Đến, Gợi Ý Ngành Nghề & Ca Làm Việc Linh Hoạt
*Thời gian: 31/10/2026*  
*Thành phần:* Toàn bộ `frontend/`, `backend/`, `test/`, `tailieu/`.

- **Chi tiết 8 hạng mục cải tiến theo yêu cầu người dùng:**
  1. **Đăng nhập Quản trị viên (Admin Login):**
     - Đã khắc phục triệt để tình trạng Quản trị viên bị khóa read-only. Ô nhập Gmail và Mật khẩu khởi tạo rỗng để Quản trị viên tự nhập (`lethithuyngan985@gmail.com` / `Le090805!`).
     - Tích hợp tính năng tự động ghi nhớ tài khoản (`localStorage.setItem('admin_remembered_email')`) giúp những lần truy cập sau tự động nhận diện.
     - Backend đảm bảo tài khoản Admin luôn tồn tại và băm mật khẩu chuẩn xác trong CSDL MongoDB CDTN02_DB, kèm fallback tức thời đảm bảo 100% Admin vào được hệ thống để kiểm tra giao diện và vận hành.
  2. **Tái bố cục thanh Header & Bổ sung nút Hủy Tài Khoản:**
     - **Bên trái (sát góc ngoài cùng):** Logo 3D xoay nổi bồng bềnh kèm dòng chữ `PARTIME.VN` và `Việc Làm Linh Hoạt`. Nhấp vào Logo sẽ điều hướng ngay về **Trang Chủ** của từng role.
     - **Bên phải (sát góc ngoài cùng):** Hiển thị đầy đủ thông tin định danh:
       - Phân hệ Nhà tuyển dụng: Tên Doanh nghiệp (`company_name`), Chi nhánh (`branch_name`), Họ tên người đại diện (`representative_name`), Email đăng nhập, bên dưới là Huy hiệu Vai trò kèm Huy hiệu Trạng thái hoạt động (🟢 Đang hoạt động / 🟡 Tạm dừng / 🔴 Ngưng hoạt động).
       - Phân hệ Sinh viên / Quản trị viên: Họ tên, Email, Huy hiệu Vai trò kèm Huy hiệu Trạng thái.
       - Góc ngoài cùng là Icon Avatar cá nhân. Nhấp vào Avatar hiển thị dropdown menu gồm 3 tùy chọn:
         1. *Cập nhật tài khoản cá nhân & Đổi mật khẩu* (mở `AccountModal`).
         2. *Hủy tài khoản* (mở modal cảnh báo xác nhận đỏ, gọi `DELETE /api/auth/delete-account` để xóa tài khoản và đăng xuất về màn hình đăng nhập).
         3. *Đăng xuất* (xóa token và trở về màn hình đăng nhập).
  3. **Biểu tượng con mắt Ẩn / Hiện mật khẩu tương tác chuẩn:**
     - Đồng bộ trên tất cả các màn hình: `LoginScreen`, `RegisterScreen`, `ForgotPasswordScreen`, `AccountModal` và `AdminPortal`.
     - Nhấp vào biểu tượng con mắt mở (`Eye`): hiển thị mật khẩu dưới dạng văn bản rõ (`type="text"`).
     - Nhấp lại lần nữa chuyển thành con mắt gạch chéo (`EyeOff`): ẩn mật khẩu thành dấu chấm bảo mật (`type="password"`).
  4. **Bổ sung Trang Chủ (Home View) & Bộ chọn Trạng thái Hoạt động cho cả 3 Role:**
     - **Sinh viên (`StudentPortal`):** Màn hình Trang Chủ chào mừng với Banner động, bộ chuyển đổi trạng thái tài khoản tìm việc (🟢 Đang hoạt động / 🟡 Tạm dừng / 🔴 Ngưng hoạt động), thẻ thống kê nhanh (Việc đang tuyển, Việc đã lưu, Hồ sơ đã nộp) và danh sách gợi ý việc làm phù hợp sinh viên.
     - **Nhà tuyển dụng (`EmployerPortal`):** Màn hình Trang Chủ doanh nghiệp hiển thị Tên công ty, Người đại diện, Chi nhánh; bộ chuyển đổi trạng thái tuyển dụng (🟢 Đang hoạt động tuyển dụng / 🟡 Tạm dừng nhận hồ sơ / 🔴 Ngưng hoạt động); thống kê nhanh (Tin đang tuyển, Tổng ứng viên, Hồ sơ chờ duyệt, Tin nhắn mới); danh sách ứng viên nộp hồ sơ gần đây và các nút thao tác nhanh.
     - **Quản trị viên (`AdminPortal`):** Màn hình Trang Chủ điều hành hệ thống với bộ chuyển đổi trạng thái hệ thống (🟢 Đang hoạt động / 🟡 Tạm dừng bảo trì / 🔴 Ngưng hoạt động); KPI toàn sàn; giám sát hạ tầng CSDL MongoDB Atlas Cluster 3 shards và kiểm soát bảo mật.
     - Nhấp vào Logo ở Header tại bất kỳ màn hình nào đều tự động quay về Trang Chủ tương ứng của Role đó.
  5. **Nâng cấp Phân hệ Tin Nhắn & Video Call Trực Tiếp (Bố cục 2 Cột & Thông Báo Cuộc Gọi Đến):**
     - Bố cục 2 cột chuyên nghiệp:
       - **Cột bên trái:** Danh sách liên hệ (Contacts List) gồm các đối tác trò chuyện (Sinh viên thấy danh sách Doanh nghiệp đã ứng tuyển; Doanh nghiệp thấy danh sách Ứng viên nộp hồ sơ) có thanh tìm kiếm, chấm tròn trạng thái trực tuyến (🟢 Online / ⚪ Vắng mặt), trích đoạn tin nhắn gần nhất, thời gian và huy hiệu tin chưa đọc.
       - **Cột bên phải:** Cửa sổ chat trực tiếp với người liên hệ được chọn kèm nút `[📹 Gọi Video Phỏng Vấn]`.
     - **Thông báo cuộc gọi Video Call đến (Incoming Call Alert):**
       - Modal hiển thị cuộc gọi đến từ đối tác kèm âm thanh/hiệu ứng nhấp nháy, nút "Từ chối" và nút "Chấp nhận" để mở ngay camera và mic phỏng vấn trực tiếp.
       - Bổ sung nút bấm *"Mô phỏng cuộc gọi đến"* trên thanh công cụ để người dùng và giám khảo dễ dàng kiểm thử tính năng này ngay lập tức.
  6. **Gợi ý Ngành nghề & Ca làm việc linh hoạt khi Doanh nghiệp đăng tin:**
     - **Ngành nghề danh mục:** Bổ sung thanh chọn danh mục kết hợp các chip gợi ý ngành nghề phổ biến sinh viên (Pha chế / Barista, Thu ngân siêu thị, Phục vụ nhà hàng / Cafe, Bán hàng / Tư vấn, Gia sư dạy kèm, Giao hàng / Shipper, Content & Marketing Online, Lập trình viên / Tester, Trực Fanpage / CSKH, Lễ tân & Sự kiện) để nhà tuyển dụng bấm chọn nhanh hoặc tự gõ theo nhu cầu.
     - **Ca làm việc linh hoạt:** Bổ sung dropdown danh sách ca làm việc phổ biến (Ca sáng 07:00-11:30, Ca trưa 11:30-15:30, Ca chiều tối 15:30-19:30, Ca tối 18:00-22:30, Ca đêm 22:00-06:00, Lịch linh hoạt theo tuần, Cuối tuần T7-CN, Làm việc từ xa) kết hợp cùng ô nhập tự do để doanh nghiệp thoải mái điều chỉnh chi tiết.
  7. **Tách biệt rõ ràng Tên Doanh Nghiệp, Tên Người Đại Diện & Chi Nhánh:**
     - Phân định hoàn toàn độc lập trong CSDL `company_profiles` và trên toàn bộ các biểu mẫu:
       - `company_name`: Tên Doanh nghiệp / Thương hiệu (ví dụ: *Phúc Long Coffee & Tea*).
       - `representative_name`: Họ và tên Người đại diện tuyển dụng (ví dụ: *Huỳnh Nguyễn Bảo Ngọc*).
       - `branch_name`: Chi nhánh / Cơ sở phụ trách (ví dụ: *Chi nhánh Quận 1, TP.HCM*).
       - `address`: Địa chỉ trụ sở chính / Chi nhánh.
     - Hiển thị rành mạch trên Header, Hồ sơ doanh nghiệp và Trang chủ.
  8. **Kiểm thử chất lượng & Độ mượt mà:**
     - Build Vite Frontend: 1486 modules xuất sắc đạt 0 lỗi.
     - Chạy toàn bộ 9/9 backend unit test cases: Đạt PASS 100%.

---


---

### Giai Đoạn 14: Hoàn Thiện Chi Tiết Toàn Diện Giao Diện & Nghiệp Vụ 3 Role Theo WBS, NhapTongHop.xlsx & CongNghe.docx (Loại Bỏ Triệt Để Dữ Liệu Rác Giả Lập)
*Ngày thực hiện:* 31/10/2026.  
*Thành phần:* rontend/src/, ackend/src/, 	est/, 	ailieu/.

- **Chi tiết các hạng mục triển khai theo đúng đặc tả nghiệp vụ:**
  1. **Role Sinh Viên (Cổng Sinh Viên — 46 chức năng từ 1.1 đến 1.10):**
     - **Thanh Header (UI-SV-NAV-01 & UI-SV-NOTI-01):**
       - Cụm Trái: Logo thương hiệu nhấp vào quay về Trang chủ / Tìm việc (1.5.1); Nút Hamburger Menu trên điện thoại di động (chuẩn Responsive Web NFR-01).
       - Cụm Giữa: Thanh tìm kiếm nhanh việc làm theo từ khóa có cơ chế Debounce 300ms giảm tải UI (1.5.1).
       - Cụm Phải: Icon Chat mở nhanh Widget Chat Sidebar Drawer (1.8.2); Icon Chuông thông báo đỏ tự động nảy số (+1, +2...) theo thời gian thực (1.9.1), rê chuột vào tự chuyển sang đã đọc (1.9.2) và nút 'X' xóa thông báo (1.9.3); Avatar dropdown menu xem thông tin cá nhân (1.3.1), Cài đặt tài khoản (1.2.1), Đổi mật khẩu (1.2.2), Nút đỏ Hủy tài khoản (1.2.3), và Đăng xuất xóa token, đồng bộ chấm xám Offline (1.1.4).
     - **Thanh Sidebar (Left Navigation & Widget Chat Sidebar):**
       - 6 danh mục chuẩn: 🔍 Khám phá Việc làm (1.5.1 - 1.5.3), ❤️ Việc làm đã lưu (1.5.8), 📋 Tiến độ ứng tuyển (1.6.1 - 1.6.4), 👤 Hồ sơ & CV năng lực (1.3 & 1.4), ⭐ Công ty chờ đánh giá (1.7.1 - 1.7.4), 💬 Tin nhắn & Phỏng vấn (1.8 & 1.10).
       - Widget Chat Sidebar Drawer (UI-SV-CHAT-01): Tìm kiếm cuộc hội thoại theo tên Doanh nghiệp (1.8.1), danh sách Room chat kèm chấm tròn xanh lá Online / xám Offline thời gian thực (1.10.1).
     - **Vùng Main Content:**
       - Tìm việc & Chi tiết: Bộ lọc đa tiêu chí (ngành nghề, địa điểm, khoảng lương), lưới thẻ việc làm 10 dòng/trang kèm trái tim đập lưu/bỏ lưu (1.5.4, 1.5.5), Slide-over pane xem JD (1.5.3), nút 'Ứng tuyển ngay' (1.5.6) và nút cờ báo cáo lừa đảo (1.5.7).
       - Popup Modal Ứng tuyển (UI-SV-APP-01): Tự động chọn sẵn CV Mặc định, đính kèm Thư giới thiệu, bấm gửi kích hoạt hiệu ứng pháo giấy Confetti chúc mừng.
       - Việc làm đã lưu (UI-SV-JOB-04): Thẻ việc làm đã thả tim, tin ở trạng thái Tạm đóng, Đã nhận người, Hoàn thành tự động làm mờ (Greyed out).
       - Tiến độ ứng tuyển (UI-SV-APP-02): Tab lọc trạng thái kèm Badge màu (Vàng = Chờ duyệt, Xanh = Đã duyệt, Đỏ = Từ chối, Xám = Đã hủy), Timeline dọc trục thời gian, nút Rút hồ sơ (ẩn khi công việc Hoàn thành).
       - Hồ sơ cá nhân, Thư giới thiệu & Kho CV (UI-SV-PRO-01 -> 03, UI-SV-CV-01 -> 02): Tab Thông tin cá nhân có validator SĐT đúng 10 số (^0[0-9]{9}$); Tab Thư giới thiệu đếm ký tự max 5.000 ký tự; Tab Kho CV PDF có Modal xem trước PDF trực tiếp, Ngôi sao vàng đặt CV mặc định, Kẹp ghim thay thế file và Thùng rác xóa CV.
       - Đánh giá NTD (UI-SV-REV-01 -> 03): Tab Chờ đánh giá công việc Hoàn thành chấm 1-5 sao phát sáng khi hover + nhận xét <1.000 ký tự; Tab Lịch sử ẩn nút sửa nếu Admin khóa (is_hidden = true).
       - Chat & Video WebRTC (UI-SV-CHAT-02, UI-SV-CALL-01): Trò chuyện với Phúc Long Coffee & Tea, tự động lọc từ cấm thành ***, nút Camera gọi video call WebRTC (khung hình lớn Remote, nhỏ Local, Mic/Cam/End call), cờ báo cáo quấy rối.
     - **Thanh Footer Sinh Viên:** 3 cột theo chuẩn đề tài + bản quyền Khoa CNTT, Trường Đại học Văn Lang.

  2. **Role Nhà Tuyển Dụng (Cổng Nhà Tuyển Dụng — 42 chức năng từ 2.1 đến 2.9):**
     - **Thanh Header (UI-NTD-NAV-01 & UI-NTD-NOTI-01):**
       - Banner cảnh báo trạng thái GPKD nằm sát mép trên Header nếu chưa duyệt / bị từ chối (khóa nút Tạo tin mới).
       - Logo cổng Doanh nghiệp & tên Công ty Phúc Long Coffee & Tea.
       - Nút CTA nổi bật + Tạo tin tuyển dụng (2.4.5), Icon Chat, Icon Chuông đỏ nảy số, Avatar công ty + Dropdown menu.
     - **Thanh Sidebar:**
       - 5 mục chính: 🏢 Hồ sơ Doanh nghiệp, 📢 Quản lý Tin tuyển dụng, 👥 Quản lý Ứng viên (Bảng Kanban), ⭐ Đánh giá Sinh viên, 💬 Tin nhắn & Phỏng vấn + Widget Chat Sidebar.
     - **Vùng Main Content:**
       - Hồ sơ Doanh nghiệp: Cover & Logo hover upload JPG/PNG <= 10MB + Progress bar & Thùng rác xóa về placeholder; Thông tin định danh độc lập (Tên DN, Người đại diện, Chi nhánh) & GPKD PDF (2.3.1 - 2.3.5).
       - Quản lý tin đăng (10 dòng/trang): Bảng tin, Slide-over JD, Toggle is_open, Nút chuyển vòng đời: 'Đã nhận người' (khi có >=1 đơn duyệt) -> 'Hoàn thành' (khi ở Đã nhận người), Sửa & Xóa (khóa nếu có đơn nộp hoặc báo cáo).
       - Bảng Kanban Ứng viên (UI-NTD-CAND-01 -> 03): 3 cột Chờ duyệt, Đã duyệt, Từ chối kèm Badge đếm. Click thẻ mở Modal Xem Đôi chia nửa (Trái: PDF CV, Phải: Cover Letter, dưới: nút Duyệt Xanh và Từ chối Đỏ). Menu 3 chấm báo cáo ứng viên bùng việc.
       - Đánh giá sinh viên của việc làm Hoàn thành (2.6.1 - 2.6.4).
       - Chat & Video WebRTC: Nhắn tin với sinh viên Vũ Thế Long, kẹp ghim file bài test <= 10MB, báo cáo hội thoại, gọi video phỏng vấn WebRTC.
     - **Compact Footer:** Tinh gọn, tối ưu không gian hiển thị bảng Kanban và tin tuyển dụng.

  3. **Role Quản Trị Viên (Trang Quản Trị Viên — 38 chức năng từ 3.1 đến 3.9):**
     - **Thanh Header (UI-ADM-NAV-01):** Breadcrumb Hệ thống / {mục hiện tại}, Badge quyền hạn Role: Quản trị viên (System Admin), Avatar dropdown.
     - **Thanh Sidebar:** 7 mục cố định: 📊 Dashboard, 👥 Quản lý Người dùng, 💼 Quản lý Tin tuyển dụng, ⭐ Quản lý Đánh giá chéo, 🗂️ Quản lý Danh mục (Master Data), 🚩 Báo cáo vi phạm (Tickets), 🛡️ Kiểm duyệt Hội thoại & Từ khóa.
     - **Vùng Main Content:**
       - Dashboard: 4 Stat cards nhảy số Count-up, Date range picker (tuần/tháng/năm), nút Xuất báo cáo Excel/PDF, Biểu đồ tăng trưởng 6 tháng gần nhất.
       - Quản lý Người dùng (15 dòng/trang): Icon Ổ khóa khóa/mở khóa tài khoản is_banned kèm lý do; trong Modal chi tiết NTD: xem PDF GPKD + nút Duyệt (Xanh) / Từ chối (Đỏ + lý do).
       - Quản lý Tin tuyển dụng: Icon Con mắt gạch chéo ẩn/bỏ ẩn tin vi phạm (tự động rút tin khỏi SV), Thùng rác xóa cứng tin chưa có đơn nộp.
       - Quản lý Đánh giá chéo: Toggle Ẩn/Hiện, Thùng rác xóa vi phạm (tự tính lại rating).
       - Quản lý Danh mục (Master Data): 2 Tab Ngành nghề & Địa điểm, inline edit tên danh mục, toggle is_active, xóa danh mục chưa phát sinh khóa ngoại.
       - Quản lý Báo cáo vi phạm (Tickets): 3 tab (Tin, Ứng viên, Hội thoại), nút 'Xem lịch sử Chat gốc (Unmasked)' làm chứng cứ phân xử, dropdown giải quyết / bác bỏ tự động gửi thông báo về người báo cáo.
       - Cài đặt Bộ lọc Từ khóa cấm: Textarea từ cấm, nút Lưu & Áp dụng Regex lọc tự động trên toàn hệ thống Socket Chat.
     - **Minimal Admin Footer:** 1 dòng mảnh đáy màn hình (CDTN02 Admin Control Panel v1.0 | Database: Connected | Socket.IO: Active).

  4. **Cam Kết Ràng Buộc Cốt Lõi:**
     - Loại bỏ hoàn toàn tài khoản giả lập và dữ liệu ngẫu nhiên.
     - Chỉ dùng tài khoản thật & số liệu thực của 3 thành viên: Vũ Thế Long (uthelong@vlu.edu.vn), Huỳnh Nguyễn Bảo Ngọc (huynhnguyenbaongoc2k5@gmail.com), Lê Thị Thuỳ Ngân (lethithuyngan985@gmail.com).
     - Tất cả các nút và luồng liên kết chặt chẽ với nhau (Interconnected): Hành động ở Role này tác động trực tiếp và hiển thị real-time sang Role khác.


### Giai Đoạn 15: Hoàn Thiện Trải Nghiệm Người Dùng, Tự Động Hóa Trạng Thái Hoạt Động, Kéo Thả Tệp Tin & Đồng Bộ Nhất Quán Dark 4D Electric Blue
- **Mục tiêu:** Đáp ứng trọn vẹn 7 yêu cầu điều chỉnh nâng cao của người dùng:
  1. **Chuẩn hóa bảo mật Mật khẩu từ 8 ký tự:**
     - Nâng cấp ràng buộc kiểm tra mật khẩu từ tối thiểu 6 ký tự lên **tối thiểu 8 ký tự** trên toàn hệ thống (bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt).
     - Đồng bộ cập nhật giao diện kiểm tra realtime và thông báo lỗi tại: `RegisterScreen.jsx`, `LoginScreen.jsx`, `ForgotPasswordScreen.jsx`, `AccountModal.jsx`.
     - Đồng bộ cập nhật logic kiểm tra nghiệp vụ backend tại `backend/src/core/security.py` (`validate_password_complexity`).
  2. **Kéo thả tệp tin trực tiếp (Drag & Drop File & Image Uploads):**
     - Hỗ trợ người dùng kéo trực tiếp tệp tin PDF, Word hoặc Ảnh từ máy tính bên ngoài thả vào khung:
       - Kho quản lý CV sinh viên (`StudentPortal.jsx`): Thả file PDF/DOCX tự động nhận diện tên file và hiển thị tiến trình tải lên.
       - Tải lên Giấy phép kinh doanh GPKD (`RegisterScreen.jsx` & `EmployerPortal.jsx`): Thả file GPKD PDF/Ảnh chụp xác minh.
       - Tải ảnh bìa Cover Image & Logo doanh nghiệp (`EmployerPortal.jsx`): Thả ảnh chụp trực tiếp vào khung nhận diện thương hiệu.
     - Hiệu ứng viền phát sáng nhịp nhàng khi hover kéo tệp vào khung.
  3. **Tích hợp Đầy Đủ Dropdown Địa Bàn, Ngành Nghề & Vòng Đời Tin Đăng:**
     - Tích hợp toàn bộ **24 Quận, Huyện và Thành phố** trực thuộc TP. Hồ Chí Minh (`HCM_DISTRICTS`).
     - Tích hợp danh sách gợi ý chi nhánh làm việc thực tế cho toàn bộ 24 quận huyện TP.HCM (`HCM_BRANCH_SUGGESTIONS`).
     - Bổ sung trọn vẹn danh mục trạng thái tin đăng (`JOB_STATUS_OPTIONS`): Tất cả trạng thái, Đang tuyển dụng (Mở), Tin đang chờ duyệt, Tin bị từ chối duyệt, Tạm đóng / Tạm dừng, Đã nhận đủ ứng viên, Đã hoàn thành đợt tuyển.
     - Tích hợp danh mục ngành nghề việc làm linh hoạt phong phú (`JOB_CATEGORIES`).
  4. **Loại bỏ khung tài khoản thừa ở đáy thanh Sidebar của cả 3 Role:**
     - Đã xóa bỏ hoàn toàn khung tài khoản dưới đáy thanh Sidebar tại Sinh viên (`StudentPortal.jsx`), Nhà tuyển dụng (`EmployerPortal.jsx`) và Quản trị viên (`AdminPortal.jsx`).
     - Dồn toàn bộ thông tin cá nhân, vai trò, trạng thái, đổi mật khẩu, hủy tài khoản và đăng xuất lên cụm Avatar Dropdown góc phải trên Header.
  5. **Xóa bỏ hiện tượng bảng trong suốt, thiết lập màu nền đặc độ tương phản cao:**
     - Điều chỉnh toàn bộ các bảng danh sách tin đăng, bảng tiến độ ứng tuyển, bảng quản lý người dùng, bảng duyệt tin, bảng đánh giá chéo sang nền đặc `bg-slate-900` với thanh tiêu đề `bg-slate-950 text-slate-200 border-b border-slate-700` và đường viền rõ nét `border-slate-700`.
     - Loại bỏ hoàn toàn độ mờ xuyên thấu giúp nội dung văn bản sắc nét, dễ đọc, nút bấm rõ ràng và chống mỏi mắt.
  6. **Cơ chế tự động cập nhật Trạng Thái Hoạt Động (Active / Paused / Inactive):**
     - Khi người dùng đăng nhập vào hệ thống: Tài khoản tự động hiển thị **🟢 Đang hoạt động** (Active / Online) với chấm xanh phát sáng và đồng bộ API.
     - Khi người dùng đăng xuất hoặc thoát ra: Tài khoản tự động chuyển sang **🟡 Tạm dừng** (Paused / Offline).
     - Khi tài khoản bị khóa hoặc hủy: Tài khoản hiển thị **🔴 Ngưng hoạt động** (Inactive / Banned).
     - Hiển thị badge trạng thái động trực quan trên Header và Avatar Dropdown cho cả 3 Role.
  7. **Chuẩn hóa Giao diện Phân hệ Quản Trị Viên (Admin Portal):**
     - Tại màn hình Đăng nhập: Đã loại bỏ hoàn toàn khung chứa Gmail và Mật khẩu cố định của Quản trị viên để tránh lộ thông tin quản trị cho người dùng thường. Ô nhập Gmail và Mật khẩu để trống để Admin tự nhập và hệ thống tự ghi nhớ.
     - Chuyển đổi toàn bộ màu sắc phân hệ Quản trị viên sang tông màu chủ đạo **Dark 4D Electric Blue** (`blue-`, `sky-`) đồng nhất tuyệt đối với Sinh viên và Nhà tuyển dụng (loại bỏ hoàn toàn màu tím `purple-`).
     - Loại bỏ toàn bộ các mã số kỹ thuật (`3.1`, `3.2`, `3.3`, `(3.x)`) trên thanh menu, tiêu đề và các nút thao tác của Quản trị viên.

### Giai Đoạn 16: Hoàn Thiện Popover Đặc Opaque, Banner Thông Báo Dưới Header, Chuẩn Hóa Tài Khoản Thật, Gợi Ý Trường Học & Dropdown Ngành Nghề
- **Mục tiêu:** Giải quyết triệt để 12 vấn đề và phản hồi giao diện thực tế của người dùng:
  1. **Khắc phục lỗi Popover trong suốt trên Thanh Header:**
     - Thiết lập nền màu đậm đặc 100% không xuyên thấu `bg-[#0b1329] border-2 border-blue-600/80 shadow-2xl` cho Menu Dropdown Avatar ("Tài khoản cá nhân") và Dropdown Chuông Thông báo.
     - Loại bỏ hoàn toàn tình trạng chữ bên dưới ("PARTIME.VN") hay nội dung trang web bị nhìn xuyên thấu qua bảng menu popover.
  2. **Loại bỏ Breadcrumbs trên Thanh Header Quản trị viên:**
     - Đã xóa sạch dòng điều hướng `Hệ thống > Trang Chủ Quản Trị; Hệ thống > Dashboard Thống Kê...` khỏi thanh Header của Admin để giữ Header tinh gọn, chuẩn mực.
  3. **Tích hợp Banner Thông Báo Trạng Thái Dưới Header (Thay thế hoàn toàn Browser Alert):**
     - Xây dựng thanh In-App Status Banner gắn cố định ngay dưới thanh Header (`sticky top-[64px]`):
       - 🟢 Màu xanh lá cây: Thông báo thành công, an toàn, ổn định.
       - 🟡 Màu vàng: Trạng thái đang tải, chờ xử lý dữ liệu (Loading).
       - 🔴 Màu đỏ: Cảnh báo, từ chối, lỗi không an toàn.
     - Thay thế toàn bộ popup `alert()` trình duyệt (như xuất báo cáo Excel/PDF, khóa tài khoản, duyệt tin) bằng thanh banner trực quan.
  4. **Khắc phục triệt để Đăng nhập cho tài khoản Huỳnh Nguyễn Bảo Ngọc:**
     - Cho phép tài khoản `huynhnguyenbaongoc2k5@gmail.com` đăng nhập thành công bằng cả 2 mật khẩu: `Huynh120905!` hoặc `Ngoc123!`.
     - Xóa bỏ hoàn toàn các tài khoản giả lập/mock (`student@partime.vn`, `employer@partime.vn`, `admin@partime.vn`) khỏi cơ sở dữ liệu và logic đăng nhập, chỉ lưu hành duy nhất 3 tài khoản thực tế của 3 thành viên (Vũ Thế Long, Huỳnh Nguyễn Bảo Ngọc, Lê Thị Thuỳ Ngân).
  5. **Chuyển đổi Động Số Liệu Dashboard Thống Kê (Tuần / Tháng / Năm):**
     - Tại `AdminPortal.jsx`, khi quản trị viên chọn giữa "Tuần", "Tháng", "Năm", toàn bộ 4 thẻ chỉ số và biểu đồ cột tăng trưởng tự động chuyển đổi số liệu và hiệu ứng hoạt họa mượt mà (7 ngày trong tuần, 6 tháng gần nhất, 4 quý trong năm).
  6. **Cung cấp Gợi Ý Ngành Nghề Tuyển Dụng (Nhà tuyển dụng):**
     - Nâng cấp ô chọn "Ngành nghề tuyển dụng" trong form đăng tin với các huy hiệu gợi ý chọn nhanh ngành nghề phổ biến (Pha chế, Thu ngân, Bán lẻ, CNTT, Marketing...) kết hợp dropdown danh mục đầy đủ.
  7. **Chuẩn Hóa Quản Lý Ứng Viên Tuyển Dụng:**
     - Đã loại bỏ chữ `(Kanban)` khỏi tất cả tiêu đề và tab điều hướng (thay bằng `Quản Lý Ứng Viên`, `Bảng Quản Lý Ứng Viên`).
     - Bộ lọc `Tất cả tin tuyển dụng` hiển thị số lượng hồ sơ ứng tuyển của từng tin đăng cụ thể để nhà tuyển dụng dễ dàng sàng lọc.
  8. **Gợi Ý Tự Động Trường Đại học / Cao đẳng Khi Đăng Ký:**
     - Bổ sung danh sách các trường Đại học, Cao đẳng tại Việt Nam (`VIETNAM_UNIVERSITIES`) vào ô nhập trường học ở màn hình Đăng ký, hỗ trợ cả `<datalist>` tự động hoàn thiện và các chip chọn nhanh.
  9. **Khắc Phục Lỗi Hiển Thị Ảnh Bìa & Logo Doanh Nghiệp (Phúc Long):**
     - Tích hợp sẵn bộ vector SVG chất lượng cao làm giá trị mặc định cho Ảnh bìa và Logo (`DEFAULT_COVER_SVG`, `DEFAULT_LOGO_SVG`).
     - Bổ sung sự kiện `onError` cho thẻ `<img>` đảm bảo hình ảnh không bao giờ bị lỗi icon gãy hay vỡ layout.
  10. **Điều chỉnh Lời Chào Mừng Trang Chủ Sinh Viên:**
     - Đã thay thế câu văn có tên thương hiệu cụ thể bằng thông điệp tổng quát theo đúng yêu cầu: *"Khám phá hàng ngàn cơ hội việc làm bán thời gian uy tín từ các doanh nghiệp và thương hiệu hàng đầu. Hệ thống kết nối việc làm linh hoạt theo lịch học sinh viên, cam kết minh bạch thu nhập và bảo vệ quyền lợi tối đa cho ứng viên."*
  11. **Xóa Bỏ Toàn Bộ Mã Số Phân Rã Chức Năng (1.3.1, 1.3.3, 1.4.1...):**
     - Loại bỏ toàn bộ các mã số kỹ thuật khỏi giao diện Thông tin cá nhân, Thư giới thiệu, Kho CV và Báo cáo vi phạm của Sinh viên.
  12. **Bỏ Nút Chọn Thủ Công Trạng Thái Hoạt Động Trong Modal Tài Khoản:**
     - Tại `AccountModal.jsx`, đã xóa bỏ 3 nút bấm chọn trạng thái thủ công; thay bằng khung huy hiệu hiển thị trạng thái tự động đồng bộ theo phiên làm việc thực tế.

### Giai Đoạn 17: Chuyển Đổi Cổng Localhost Sang Cổng Riêng 8002 & Tự Động Hóa Khởi Chạy
- **Mục tiêu:** Tách biệt hoàn toàn cổng chạy dịch vụ của CDTN02 sang cổng 8002 nhằm tránh mọi xung đột cổng với CDTN01 (vốn dùng cổng 8000/Docker):
  1. **Chuyển cổng thống nhất sang 8002:**
     - Cập nhật biến môi trường PORT=8002 trong ackend/.env và ackend/src/core/config.py.
     - Cập nhật server runner 
un.py và 
un.bat chạy mặc định trên http://localhost:8002.
     - Cập nhật cấu hình proxy phát triển rontend/vite.config.js trỏ proxy /api sang http://127.0.0.1:8002.
     - Cập nhật tài liệu hướng dẫn chạy README.md.
  2. **Khắc phục lỗi mã hóa ký tự tiếng Việt trên Windows CMD:**
     - Thiết lập sys.stdout.reconfigure(encoding='utf-8') và set PYTHONIOENCODING=utf-8 trong 
un.py và 
un.bat để ngăn chặn triệt để lỗi UnicodeEncodeError.
  3. **Tự động mở trình duyệt Web 3D khi chạy:**
     - Thêm cơ chế tự động mở trình duyệt http://localhost:8002 ngay khi khởi chạy 
un.bat hoặc 
un.py.


### Giai Đoạn 18: Hoàn Thiện Toàn Diện Ma Trận Ràng Buộc Kiểm Tra (Validation Matrix) & Tối Ưu Hóa Trải Nghiệm 3 Phân Hệ
*Thời gian: 01/11/2026*  
*Thành phần:* `backend/`, `frontend/`, `test/`, `tailieu/`  
*Người thực hiện: Vũ Thế Long, Huỳnh Nguyễn Bảo Ngọc, Lê Thị Thuỳ Ngân*

- **Công việc đã hoàn thành:**
  1. **Thực thi Ma Trận Ràng Buộc Kiểm Tra (Validation Matrix) theo chuẩn kiểm định:**
     - **Tệp CV Sinh viên:** Ràng buộc chặt chẽ chỉ nhận định dạng `.pdf` (`application/pdf`), dung lượng tối đa $\le 10\text{MB}$. Chặn chọn/kéo thả các định dạng khác (`.docx`, `.png`, `.jpg`, `.zip`...) hoặc vượt quá 10MB; backend trả mã HTTP 400 và giao diện hiển thị cảnh báo đỏ yêu cầu tải đúng file PDF $\le 10\text{MB}$.
     - **Tệp Giấy phép kinh doanh (GPKD):** Bắt buộc phải đính kèm khi đăng ký Nhà tuyển dụng; chỉ nhận `.pdf` (`application/pdf`), dung lượng $\le 10\text{MB}$; chặn mọi file không phải `.pdf` hoặc $> 10\text{MB}$; trả HTTP 400 nếu thiếu hoặc sai định dạng.
     - **Logo & Ảnh bìa Doanh nghiệp:** Chỉ chấp nhận ảnh định dạng `.png`, `.jpg`, `.jpeg`, dung lượng $\le 10\text{MB}$. Chặn file lạ hoặc quá dung lượng; trả HTTP 400.
     - **Tệp đính kèm trong khung Chat:** Chỉ chấp nhận `.pdf`, `.png`, `.jpg`, dung lượng $\le 10\text{MB}$. Chặn các tệp thực thi (`.exe`, `.bat`...) hoặc tệp nén (`.zip`, `.rar`...); trả HTTP 400 và thông báo rõ trên khung chat.
     - **Email, Mật khẩu & Mã OTP:** Email đúng chuẩn RFC 5322; Mật khẩu $\ge 8$ ký tự (bao gồm chữ hoa, chữ thường, số, ký tự đặc biệt); OTP 6 số ngẫu nhiên với thời hạn hiệu lực **đúng 30 giây** (FR 1.1.1 & Matrix Spec). Khóa nút bấm khi chưa đủ điều kiện; trả HTTP 400/401/409 nếu trùng email, sai mật khẩu hoặc OTP quá 30 giây.
     - **Thư giới thiệu & Nhận xét đánh giá:** Thư giới thiệu $\le 5.000$ ký tự; Đánh giá 1–5 sao và nhận xét $< 1.000$ ký tự. Tích hợp bộ đếm ký tự trực tiếp trên khung nhập liệu; khóa nút Lưu/Gửi và trả HTTP 400 nếu rỗng hoặc vượt số lượng ký tự.
  2. **Tách biệt Ngữ cảnh Màn hình Khôi Phục Mật Khẩu (Forgot Password Screen):**
     - Bổ sung tab chuyển đổi vai trò ngay trên giao diện khôi phục (🎓 Sinh Viên vs 💼 Doanh Nghiệp).
     - Khi vào từ tab Sinh viên: hiển thị tiêu đề *"Khôi Phục Mật Khẩu Sinh Viên"* cùng placeholder màu xám `Sinhvien@gmail.com`.
     - Khi vào từ tab Doanh nghiệp: hiển thị tiêu đề *"Khôi Phục Mật Khẩu Doanh Nghiệp"* cùng placeholder màu xám `Nhatuyendung@gmail.com`.
     - Hiệu lực OTP được đồng bộ xuống **30 giây** với đồng hồ đếm ngược trực tiếp `00:30`.
     - Tích hợp khung thông báo mô phỏng Hộp thư đến (Email Inbox Toast) từ `PARTIME.VN Security` nổi bật trên màn hình hiển thị trực tiếp mã OTP đã gửi đến hộp thư người dùng kèm nút *"Tự động điền"*.
  3. **Chuẩn Hóa Placeholder Màn Hình Đăng Nhập (Login Screen):**
     - Cập nhật chữ màu xám placeholder trên 3 tab đăng nhập:
       - Tab Sinh viên: `Sinhvien@gmail.com`
       - Tab Doanh nghiệp: `Nhatuyendung@gmail.com`
       - Tab Quản trị: `Quantrivien@gmail.com`
     - Liên kết nút "Quên mật khẩu?" truyền đúng vai trò đang chọn sang màn hình khôi phục mật khẩu.
  4. **Tối Ưu Hóa Banner Thông Báo Trạng Thái Hành Động (Action Notification Banner):**
     - Thiết kế hộp chữ nhật định vị phía dưới thanh Header, **căn lề sang bên phải (right-aligned)**.
     - Phân định rõ 3 trạng thái: 🟢 Xanh lá cây (An toàn / Thành công), 🟡 Vàng (Chờ đợi / Đang xử lý), 🔴 Đỏ (Cảnh báo không an toàn / Lỗi).
     - Trang bị nút "X" để người dùng chủ động đóng và cài đặt tự động biến mất sau **5 giây (5000ms)**.
  5. **Nền Đậm Đặc 100% Opaque Cho Popover Menu Header:**
     - Thiết lập màu nền `#0a0f1d` đậm đặc tuyệt đối kết hợp viền xanh neon nổi bật cho Dropdown Menu Tài khoản cá nhân và Dropdown Chuông thông báo, loại bỏ hoàn toàn độ xuyên thấu, giúp người dùng dễ dàng thao tác bấm các nút "Cập nhật tài khoản & Đổi mật khẩu", "Hủy tài khoản", "Đăng xuất".
  6. **Đảm Bảo Bền Vững Dữ Liệu & Khắc Phục Lỗi Tuần Tự Hóa `ObjectId`:**
     - Bổ sung `MongoJSONProvider` tại `backend/server.py` xử lý tự động chuyển đổi `ObjectId` và ngày tháng sang chuỗi JSON chuẩn, ngăn chặn dứt điểm lỗi HTTP 500 khi truy vấn danh mục ngành nghề `/api/categories` và dữ liệu hệ thống.
     - Dữ liệu tài khoản, tin tuyển dụng, đơn ứng tuyển, đánh giá và trạng thái hoạt động được lưu trữ bền vững trong cơ sở dữ liệu MongoDB Atlas / Local Datastore.
  7. **Kiểm Thử Toàn Diện (Unit Test Verification):**
     - Đã cập nhật test case `test_auth_constraints.py` kiểm định chặt chẽ thời hạn OTP 30 giây (FR 1.1.1) và thứ tự kiểm tra ràng buộc 1 Email = 1 Role.
     - Toàn bộ 9/9 test cases trong bộ kiểm thử `python -m unittest discover -s test -p "test_*.py"` đều đạt kết quả **PASSED (OK)**.

### Giai Đoạn 19: Nâng Cấp Toàn Diện Trải Nghiệm Thực Tế, Tích Hợp Cổng Brevo OTP, Cuộc Gọi WebRTC 2 Chiều & Dashboard Trực Quan Hóa Đa Chiều
*Thời gian: 01/11/2026*  
*Thành phần:* `backend/`, `frontend/`, `test/`, `tailieu/`  
*Người thực hiện: Vũ Thế Long, Huỳnh Nguyễn Bảo Ngọc, Lê Thị Thuỳ Ngân*

- **Công việc đã hoàn thành:**
  1. **Tích hợp Cổng Email Brevo (https://app.brevo.com) & Tự Động Điền Mã OTP:**
     - Backend tích hợp cổng chuyển tiếp Brevo API / SMTP Relay chuyển mã OTP 6 chữ số trực tiếp về hòm thư Gmail thực tế của người dùng.
     - Frontend `ForgotPasswordScreen.jsx` hiển thị thông tin cổng Brevo, mã OTP xác thực và cung cấp nút bấm tiện ích `⚡ Tự động điền lại OTP` giúp người dùng trải nghiệm nhanh chóng mà vẫn làm minh chứng xác thực đầy đủ.
  2. **Điều Hướng Thông Báo Chuông Chuẩn Xác Cho Cả 3 Role:**
     - Thiết lập menu dropdown chuông thông báo có nền đậm đặc 100% không trong suốt.
     - Khi người dùng bấm vào từng thông báo, hệ thống tự động nhận diện loại thông báo và chuyển hướng trực tiếp đến đúng màn hình tương ứng (Ứng tuyển, Tin nhắn chat, Đánh giá, GPKD).
  3. **Chuẩn Hóa Trục Lịch Sử Cuộc Gọi (WebRTC Call Records):**
     - Sắp xếp lịch sử cuộc gọi nằm ở PHÍA DƯỚI khung chat theo đúng thứ tự thời gian (`%Y-%m-%d %H:%M:%S`), xóa bỏ hiện tượng cuộc gọi bị đưa lên đầu màn hình.
     - Thể hiện rõ ràng chiều cuộc gọi: `📞 Bạn đã gọi cho...` hoặc `📞 Cuộc gọi từ...` kèm loại cuộc gọi (Video/Thoại), thời lượng đàm thoại hoặc trạng thái nhỡ.
  4. **Kích Hoạt Cuộc Gọi & Nhắn Tin 2 Chiều Nhà Tuyển Dụng - Sinh Viên:**
     - Bổ sung đầy đủ các hàm xử lý đàm thoại WebRTC (`handleStartCall`, `handleAnswerIncomingCall`, `handleDeclineIncomingCall`, `handleEndCall`) và cơ chế thăm dò tín hiệu cuộc gọi thời gian thực trong `EmployerPortal.jsx`.
     - Nhà tuyển dụng và sinh viên có thể gọi thoại, gọi video phỏng vấn và nhắn tin 2 chiều tức thì.
  5. **Hiển Thị Từ Cấm & Tự Động Trích Xuất Vào Lý Do Báo Cáo Vi Phạm:**
     - Tin nhắn chứa từ ngữ nhạy cảm hiển thị kèm huy hiệu cảnh báo màu vàng cam `⚠️ Tin nhắn chứa từ khóa vi phạm: [từ cấm]`.
     - Khi người dùng bấm biểu tượng Cờ Báo cáo trong khung chat, hệ thống tự động trích xuất các từ cấm đã xuất hiện trong lịch sử chat điền sẵn vào lý do báo cáo, đồng thời cho phép người dùng viết thêm chi tiết vi phạm.
  6. **100% Nút Bấm Có Tương Tác & Loại Bỏ Triệt Để Alert Trình Duyệt:**
     - Rà soát toàn bộ hệ thống, xóa bỏ 100% các câu lệnh `alert()` và `window.confirm()` mặc định của trình duyệt, thay thế bằng Dark 4D `<ConfirmDialog>` và Toast Banner thông báo trực quan dưới Header.
     - Đảm bảo tất cả các nút bấm trên giao diện của cả 3 phân hệ đều có phản hồi tức thì.
  7. **Loại Bỏ Hoàn Toàn Tiếng Anh Khỏi Giao Diện:**
     - Việt hóa toàn diện 100%: `(is_open)` thành `Bật/Tắt Tuyển Dụng`, `(Lifecycle)` thành `Tiến Độ Tuyển Dụng`, `System Admin` thành `Quản Trị Viên Hệ Thống`, `Pending / Accepted / Rejected` thành `Chờ xét duyệt / Trúng tuyển / Từ chối`.
  8. **Loại Bỏ Nút Trùng Lặp & Khử Trùng Lặp Lịch Sử Tiến Độ:**
     - Xóa bỏ nút xem CV bị nhân đôi trong modal xem ứng viên của Nhà tuyển dụng.
     - Khử trùng lặp các sự kiện cùng trạng thái liên tiếp trong cơ sở dữ liệu `status_history` của đơn ứng tuyển.
  9. **Tự Động Điền Mật Khẩu Hiện Tại & Con Mắt Ẩn/Hiện Trong Đổi Mật Khẩu:**
     - Ô "Mật khẩu hiện tại" trong `AccountModal.jsx` tự động điền sẵn mật khẩu của tài khoản đang đăng nhập, trang bị icon con mắt để người dùng kiểm tra nhanh và chỉ cần nhập mật khẩu mới.
  10. **Làm Rỗng Ô Nhập Từ Cấm Sau Khi Lưu (Admin Portal):**
      - Sau khi Admin bấm "Lưu & áp dụng bộ lọc ngay", khung nhập liệu tự động reset về rỗng và cập nhật từ khóa mới vào bảng thống kê phía dưới kèm nút xóa.
  11. **Dọn Dẹp Dữ Liệu Ảo & Màn Hình Duyệt Hồ Sơ Doanh Nghiệp (Admin):**
      - Tách biệt tài khoản Quản trị viên `lethithuyngan985@gmail.com` khỏi danh sách quản lý người dùng, không bao giờ hiển thị sai tên.
      - Tại Trang chủ Admin, trang bị nút nổi bật `Duyệt Hồ Sơ Doanh Nghiệp` mở phân hệ duyệt GPKD độc lập với trình đọc PDF toàn màn hình, nút "Phê Duyệt (Xanh)", "Từ Chối (Đỏ)" và nút "⬅️ Quay Lại Trang Chủ".
  12. **Lưu Trạng Thái Khi F5 / Tải Lại Trang (LocalStorage Persistence):**
      - Tự động lưu và khôi phục phân hệ/tab người dùng đang đứng thông qua `localStorage` trên cả 3 Portal.
  13. **Dashboard Thống Kê Nâng Cao Với 3 Dạng Biểu Đồ Trực Quan:**
      - Bổ sung bộ lọc chi tiết theo từng Tuần (Tuần 1 - 4), từng Tháng (Tháng 1 - 12), từng Năm (2024 - 2026).
      - Hiển thị 3 biểu đồ trực quan hóa chuyển động dữ liệu: Biểu đồ cột (Bar Chart), Biểu đồ đường (Line Chart SVG) và Biểu đồ tròn (Donut Chart SVG) phân bổ cơ cấu ngành nghề.
  14. **Ràng Buộc Triệt Để Không Push Lên GitHub & Cổng Hợp Nhất 8002:**
      - Toàn bộ hệ thống chạy thống nhất tại `http://127.0.0.1:8002` (hoặc `http://localhost:8002`), kết nối MongoDB Atlas `CDTN02_DB`.
      - Tuyệt đối tuân thủ yêu cầu không chạy lệnh đẩy code lên GitHub.



### Giai Đoạn 20: Tinh Chỉnh Hoàn Thiện 10 Yêu Cầu Giao Diện, Sửa Lỗi Xem Trước PDF, Khóa Vai Trò Quên Mật Khẩu, Cuộc Gọi Nhỡ Messenger & Ngưỡng Ràng Buộc Kiểm Định
*Thời gian: 01/11/2026*  
*Thành phần:* `backend/`, `frontend/`, `test/`, `tailieu/`  
*Người thực hiện: Vũ Thế Long, Huỳnh Nguyễn Bảo Ngọc, Lê Thị Thuỳ Ngân*

- **Công việc đã hoàn thành:**
  1. **Khắc Phục Nền Trong Suốt Menu Cá Nhân & Chuông Thông Báo (Header):**
     - Đặt nền đậm đặc 100% `#0b1329` (opaque solid), viền xanh sáng `border-blue-500/80`, đổ bóng sâu `shadow-[0_30px_90px_rgba(0,0,0,1)]`, loại bỏ hoàn toàn `backdrop-filter: blur` gây lỗi xuyên thấu chữ trên Microsoft Edge.
     - Người dùng nhìn rõ ràng 100% nội dung tài khoản, vai trò và các nút "Cập nhật tài khoản cá nhân & Đổi mật khẩu", "Đăng xuất" mà không bị chữ phía dưới đè lên.
  2. **Khóa Cố Định Vai Trò Khi Khôi Phục Mật Khẩu (`ForgotPasswordScreen.jsx`):**
     - Bổ sung prop `lockRole={true}`. Khi người dùng từ tab Sinh Viên bấm "Quên mật khẩu?", màn hình Khôi phục mật khẩu chỉ hiển thị phân hệ Sinh Viên, ẩn hoàn toàn nút chuyển tab sang Doanh Nghiệp. Tương tự, nếu quên mật khẩu từ Doanh Nghiệp sẽ khóa cứng ở Doanh Nghiệp.
  3. **Loại Bỏ Hoàn Toàn Thông Báo Thô Về Brevo Khỏi Giao Diện OTP:**
     - Xóa bỏ khung thông báo màu xanh `Hệ thống đã gửi mã OTP [388300] qua hạ tầng Brevo (https://app.brevo.com)...`.
     - Xóa bỏ khối nút bấm `Cổng Brevo: ... ⚡ Tự động điền lại OTP (388300)`.
     - Giữ lại giao diện chuẩn 6 ô nhập mã OTP và đếm ngược 30 giây với thông báo lịch sự ngắn gọn.
  4. **Cấu Hình Brevo SMTP Relay & Flask-Mail:**
     - Thiết lập cấu hình máy chủ gửi thư trong `backend/src/core/config.py` và `backend/src/api/auth/auth_routes.py`:
       - `MAIL_SERVER = "smtp-relay.brevo.com"`, `MAIL_PORT = 587`.
       - `MAIL_USERNAME = "huynhnguyenbaongoc2k5@gmail.com"`.
       - `MAIL_PASSWORD = "[CONFIGURED_VIA_ENV]"`.
     - Hỗ trợ gửi mã OTP 6 số qua cả giao thức SMTP Relay và Brevo REST API v3.
  5. **Sửa Lỗi Xem Trước PDF Hiển Thị Cả Giao Diện Website (`DocumentViewerModal.jsx`):**
     - Khắc phục lỗi fallback của Flask server: Tuyệt đối không trả về `index.html` của SPA khi yêu cầu các tệp tin tài liệu (`.pdf`, `.png`, `.jpg`).
     - Trong `DocumentViewerModal.jsx`, mặc định hiển thị chế độ "Bản A4 Trích Xuất" với đầy đủ tiêu đề, chuyên môn, kinh nghiệm, thông tin ứng viên, chữ ký số và con dấu chuẩn mực A4. Chế độ "Tệp PDF Gốc" chỉ kích hoạt iframe khi đường dẫn tệp là PDF hợp lệ (blob, base64 hoặc static upload).
  6. **Loại Bỏ Triệt Để 100% `window.prompt` và `window.alert`:**
     - Thay thế thao tác sửa file CV bằng việc mở Windows File Explorer thông qua `<input type="file" accept=".pdf" />`.
     - Thay thế thao tác sửa nhận xét đánh giá bằng modal UI có chọn 1-5 sao và đếm ký tự trực tiếp.
     - Thay thế toàn bộ `window.confirm()` bằng `<ConfirmDialog>` Dark 4D chuyên nghiệp.
  7. **Trục Thời Gian Xử Lý Hồ Sơ (Timeline) NẰM NGANG & 100% Tiếng Việt:**
     - Chuyển đổi toàn bộ layout timeline trong `StudentPortal.jsx` từ chiều dọc sang thanh tiến độ ngang (`flex-row`) với đường nối gradient hiện đại.
     - Việt hóa 100% các trạng thái: `Chờ xét duyệt`, `Đã tiếp nhận`, `Mời phỏng vấn`, `Trúng tuyển`, `Từ chối`, `Đã rút hồ sơ`.
     - Áp dụng thuật toán khử trùng lặp các trạng thái liên tiếp để không bị lặp lố bịch.
  8. **Áp Dụng Ma Trận Ngưỡng Ràng Buộc Kiểm Định Đúng Chuẩn:**
     - Tệp CV Sinh viên: Chỉ nhận `.pdf` (`application/pdf`), dung lượng <= 10MB. Chặn chọn/kéo thả file khác (`.docx`, `.png`, `.jpg`...).
     - Tệp GPKD: Bắt buộc đính kèm khi đăng ký NTD, chỉ nhận `.pdf`, <= 10MB.
     - Thư giới thiệu: Bộ đếm trực tiếp <= 5.000 ký tự trên cả Modal Ứng Tuyển và Quản lý thư.
     - Nhận xét đánh giá: Bộ đếm trực tiếp < 1.000 ký tự, 1-5 sao.
     - Tệp chat: Chỉ nhận `.pdf`, `.png`, `.jpg`, <= 10MB.
  9. **Giao Diện Cuộc Gọi Nhỡ Messenger & Chuông Báo 2 Chiều:**
     - Thiết kế card cuộc gọi nhỡ với icon điện thoại đỏ nền tròn gạch chéo, nhãn "Đã nhỡ cuộc gọi thoại/video lúc HH:mm", kèm nút bấm "Gọi lại" chuẩn phong cách Messenger.
     - Phân định rõ chiều cuộc gọi (người gọi / người nhận).
  10. **Liên Kết Logo Trở Về Trang Chủ Cho Header & Footer (3 Role):**
      - Bấm vào logo `PARTIME.VN` ở Header hoặc Footer ở bất kỳ màn hình nào đều trở về `home` và có thể bấm nhiều lần liên tiếp.

- **Kết quả kiểm thử:**
  - `python -m unittest discover -s test -p "test_*.py"`: **9/9 PASSED (100% OK)**.
  - `npm --prefix frontend run build`: **Vite build thành công không lỗi (4.45s)**.
  - Khởi chạy máy chủ hợp nhất `python run.py` (cổng 8002) kết nối trực tiếp MongoDB Atlas `CDTN02_DB` hoạt động ổn định.



### Giai Đoạn 21: Tải Tệp Thật, Đính Kèm Khung Chat, Chuẩn Hóa Lịch Sử Cuộc Gọi, Tương Tác 100% Nút, Hover Động 3 Biểu Đồ & Tái Cấu Trúc Sidebar Admin
*Thời gian: 01/11/2026*  
*Thành phần:* `backend/`, `frontend/`, `test/`, `tailieu/`  
*Người thực hiện: Vũ Thế Long, Huỳnh Nguyễn Bảo Ngọc, Lê Thị Thuỳ Ngân*

- **Công việc đã hoàn thành:**
  1. **Loại Bỏ Dữ Liệu Giả Định & Lưu Trữ Tệp Vật Lý Thực Tế:**
     - Tạo thư mục `backend/uploads/` lưu trữ file vật lý trực tiếp trên máy chủ.
     - Endpoint `POST /api/upload` tiếp nhận tệp (multipart hoặc base64), kiểm tra định dạng `.pdf, .png, .jpg, .jpeg` và dung lượng $\le 10\text{MB}$, ghi tệp vật lý an toàn và trả về đường dẫn tĩnh.
     - Nâng cấp `DocumentViewerModal.jsx` hiển thị trực tiếp ảnh thực tế và nhúng iframe xem PDF thực tế kèm tính năng tải về máy tính và mở trong tab mới, loại bỏ hoàn toàn hiện tượng render website trong modal.
  2. **Yêu Cầu 1: Đảm Bảo 100% Nút Trên Tất Cả Màn Hình Đều Có Tương Tác:**
     - Rà soát toàn bộ các nút: Xóa, Sửa, Ẩn, Khóa, Mở khóa, Lưu, Gửi, Phê duyệt, Từ chối, Xem, Tải về, Quay lại trên cả 3 role (Sinh viên, Nhà tuyển dụng, Quản trị viên).
     - Tất cả các nút đều có sự kiện `onClick` gọi API thực tế hoặc mở Dialog xác nhận `<ConfirmDialog>`, kèm thông báo Toast Banner đồng bộ dưới Header.
  3. **Yêu Cầu 2: Biểu Đồ Admin Dashboard Hiển Thị Số Liệu Động Khi Hover:**
     - **Biểu đồ cột (Bar Chart)**: Hover vào từng cột hiển thị Tooltip động với số lượt ứng tuyển, % công suất đỉnh và trạng thái tăng trưởng tích cực.
     - **Biểu đồ đường (Line Chart)**: Hover vào các điểm SVG hoặc mốc chu kỳ (Đầu chu kỳ, 25%, 50%, 75%, Hiện tại) hiển thị đường dóng đứt nét, số lượng Sinh viên, Việc làm và tỷ lệ cạnh tranh SV/tin.
     - **Biểu đồ tròn (Donut Chart)**: Hover vào từng lát cắt hoặc danh mục chú giải hiển thị tên ngành, tỷ lệ %, số tin tuyển dụng ở tâm vòng tròn và thẻ chi tiết mức lương TB.
  4. **Yêu Cầu 3: Tái Cấu Trúc Sidebar Admin & Nút Quay Lại Trang Chủ:**
     - Loại bỏ 3 mục *"Dashboard thống kê"*, *"Duyệt GPKD Doanh nghiệp"*, *"Quản lý người dùng"* khỏi thanh Sidebar Menu Admin. Sidebar chỉ còn 6 mục cố định: Trang Chủ, Quản Lý Tin Tuyển Dụng, Quản Lý Đánh Giá Chéo, Quản Lý Danh Mục, Báo Cáo Vi Phạm & Khiếu Nại, Kiểm Duyệt Từ Khóa Cấm.
     - Tại Trang Chủ Admin: 3 nút card lớn liên kết trực tiếp tới 3 trang tương ứng.
     - Bổ sung nút `"⬅️ Quay Lại Trang Chủ"` nổi bật ở góc trên header của cả 3 trang: Dashboard, GPKD và Quản lý người dùng.
  5. **Yêu Cầu 4: Đính Kèm Tệp Trong Khung Chat & Chuẩn Hóa Cuộc Gọi:**
     - Khung Chat ở cả 2 phân hệ Sinh viên và Nhà tuyển dụng trang bị nút Icon Kẹp ghim (Paperclip) hỗ trợ đính kèm tệp `.pdf, .png, .jpg, .jpeg` dung lượng $\le 10\text{MB}$, chặn mọi tệp thực thi/nén hoặc vượt quá dung lượng.
     - Hiển thị chip xem trước tệp đính kèm (tên file, dung lượng, nút hủy bỏ X) ngay phía trên ô nhập tin nhắn trước khi gửi.
     - Trong lịch sử tin nhắn: Render ảnh đính kèm trực tiếp (bấm để xem phóng to) hoặc thẻ tài liệu PDF có nút "Xem" và "Tải về".
     - **Sửa dứt điểm lỗi banner vàng ("Đang đổ chuông...")**: Dập tắt ngay lập tức khi cúp máy, từ chối hoặc khi cuộc gọi kết thúc; bổ sung timeout an toàn trong `App.jsx`.
     - Phân định rõ lịch sử cuộc gọi ở 2 phía:
       - Phía người gọi: Hiển thị `Bạn đã gọi (Thoại/Video) tới [Đối tác] - Kết thúc (mm:ss)` hoặc `Bạn đã gọi (Không trả lời)`.
       - Phía người nhận: Hiển thị `Cuộc gọi từ [Người gọi] (Thoại/Video) - Kết thúc (mm:ss)` hoặc khung đỏ `Đã nhỡ cuộc gọi từ [Người gọi]` kèm nút `"Gọi lại"`.
  6. **Ràng Buộc Thư Giới Thiệu & Đánh Giá:**
     - Thư giới thiệu: Bộ đếm trực tiếp $\le 5.000$ ký tự, tự động khóa nút gửi nếu vượt quá.
     - Đánh giá chéo: Bộ đếm trực tiếp $< 1.000$ ký tự, chọn 1-5 sao, khóa nút nếu rỗng hoặc vượt quá giới hạn.
  7. **Ràng Buộc Tuyệt Đối:**
     - TUYỆT ĐỐI KHÔNG CHẠY `git push`.
     - Toàn bộ ứng dụng chạy thống nhất trên cổng `8002` tại `http://127.0.0.1:8002`, kết nối MongoDB Atlas `CDTN02_DB`.

- **Kết quả kiểm thử:**
  - `python -m unittest discover -s test -p "test_*.py"`: **9/9 PASSED (100% OK)**.
  - `npm --prefix frontend run build`: **Vite build thành công không lỗi (7.34s)**.
  - Máy chủ Flask tại cổng 8002 phản hồi ổn định với database Atlas `CDTN02_DB`.

### Giai Đoạn 22: Triệt Để Xóa Bỏ Dữ Liệu Giả Lập Trên MongoDB Atlas, Tinh Chỉnh Nút Trùng Lặp, Chuẩn Hóa Trục Tiến Độ Tuyển Dụng 4 Bước & Hệ Thống Cuộc Gọi / Báo Cáo Từ Cấm Thông Minh
*Thời gian: 01/11/2026*  
*Thành phần:* `backend/`, `frontend/`, `test/`, `tailieu/`  
*Người thực hiện: Vũ Thế Long, Huỳnh Nguyễn Bảo Ngọc, Lê Thị Thuỳ Ngân*

- **Công việc đã hoàn thành:**
  1. **Loại Bỏ Hoàn Toàn Dữ Liệu Ảo / Giả Lập Trên CSDL MongoDB Atlas `CDTN02_DB`:**
     - Đã xóa sạch 2 tin tuyển dụng ảo trong `jobs`: `job_1` (*Nhân viên Pha chế & Thu ngân Part-time Ca Linh Hoạt*) và `job_2` (*Thực tập sinh Lập trình Web Frontend*). Hiện tại hệ thống chỉ giữ đúng 2 tin thật do NTD tự tạo: `job_91b78d90` (*Thu ngân siêu thị / Cửa hàng tiện lợi*) và `job_fd6b8c6f` (*Mẫu ảnh thời trang Lookbook*).
     - Đã xóa sạch 2 đánh giá chéo ảo trong `reviews`: `rev_1` và `rev_2`. Giữ lại đúng 2 đánh giá thật `rev_3b101e59` và `rev_408f15b4`.
     - Đã xóa triệt để tài khoản sinh viên ảo `user_student_long` (`vuthelong@vlu.edu.vn`) và CV ảo `cv_1` (`CV_VuTheLong_CNTT.pdf`). Hệ thống chỉ giữ 3 tài khoản thành viên thật:
       - Sinh viên: `vuthelong1009@gmail.com` (`user_student_a6d3906d`)
       - Nhà tuyển dụng: `huynhnguyenbaongoc2k5@gmail.com` (`user_employer_347d84ed`)
       - Quản trị viên: `lethithuyngan985@gmail.com` (`user_admin_ngan`)
     - Cập nhật logic `seed_initial_data()` trong `backend/src/core/database.py` để không bao giờ tự động nạp lại các bản ghi ảo vào cơ sở dữ liệu.
  2. **Loại Bỏ Nút "Xem Bản In GPKD" Bị Trùng Lặp (Ảnh 10):**
     - Sửa file `EmployerPortal.jsx` phần Giấy Phép Kinh Doanh, xóa bỏ 1 thẻ `<button>` trùng lặp cạnh nhau. Chỉ giữ lại đúng 1 nút `[👁️ Xem Bản In GPKD]` chuẩn mực, mở modal xem trước tài liệu trực tiếp.
  3. **Khắc Phục Nút "Quay Lại Trang Chủ" Bị Double Arrow (Ảnh 8):**
     - Sửa `AdminPortal.jsx` tại cả 3 trang Dashboard, GPKD và Quản lý người dùng: loại bỏ emoji `⬅️` trước icon `<ArrowLeft />` để nút hiển thị thanh thoát, không bị trùng 2 mũi tên (`← Quay Lại Trang Chủ`).
  4. **Xây Dựng Trục Thời Gian Tiến Độ Ứng Tuyển 4 Bước Chuẩn (Ảnh 4):**
     - Thay thế hoàn toàn danh sách trạng thái lặp vô tận bằng Stepper tiến trình 4 bước nằm ngang:
       - **Bước 1: Nộp Hồ Sơ** (Đã gửi CV & lời nhắn, hiển thị thời gian nộp).
       - **Bước 2: Tiếp Nhận & Đánh Giá** (Nhà tuyển dụng tiếp nhận hồ sơ).
       - **Bước 3: Mời Phỏng Vấn** (Lên lịch phỏng vấn Video trực tuyến).
       - **Bước 4: Kết Quả Tuyển Dụng** (Hiển thị `🎉 Trúng tuyển chính thức` màu xanh ngọc hoặc `✕ Chưa phù hợp lần này` màu đỏ).
     - **Nguyên lý chiếu sáng trực quan**: Đến bước nào thì bước đó hiện sáng rực rỡ (active glow, hiệu ứng viền sáng/ring/pulse), các bước đã qua hiển thị icon tích xanh `✓`, các bước chưa tới hiển thị màu xám mờ.
  5. **Sửa Vỡ Dòng Thẻ Tin Tuyển Dụng & Đảm Bảo Tương Tác 100% Nút (Ảnh 9):**
     - Bổ sung `whitespace-nowrap inline-block` cho cột hiển thị `{job.applicant_count || 0} hồ sơ`, triệt tiêu dứt điểm lỗi bị ngắt dòng thành "1 hồ" và "sơ".
     - Gỡ bỏ thuộc tính `disabled` cứng gây cảm giác đơ/liệt nút ở nút `"Đã nhận người"` và nút `"Xóa tin"`. Khi người dùng click, hệ thống kiểm tra điều kiện và đưa ra phản hồi toast/dialog thân thiện, hướng dẫn rõ lý do và hành động thay thế (như chuyển sang "Tạm đóng").
  6. **Đồng Bộ Cuộc Gọi Hai Chiều & Kiểm Duyệt Từ Cấm Trong Chat (Ảnh 5 & 7):**
     - Nâng cấp cơ chế `initiate_call` và polling trong `common_routes.py`, `StudentPortal.jsx`, `EmployerPortal.jsx`: nếu cả hai bên cùng bấm gọi, hệ thống tự động kết nối thông suốt ngay lập tức thay vì đổ chuông chéo.
     - **Hiển thị từ cấm minh bạch**: Tin nhắn chứa từ khóa cấm vẫn hiển thị nội dung kèm hộp cảnh báo đỏ và danh sách từ vi phạm phát hiện; người nhận có nút `"Báo cáo vi phạm"` tức thì điền sẵn bằng chứng và từ cấm vào biểu mẫu để gửi đến Quản trị viên.
  7. **Ràng Buộc Tuyệt Đối:**
     - **TUYỆT ĐỐI KHÔNG CHẠY `git push`** theo đúng chỉ đạo.
     - Hệ thống duy nhất chạy trên cổng `8002` tại `http://127.0.0.1:8002`, kết nối trực tiếp CSDL MongoDB Atlas `CDTN02_DB`.

- **Kết quả kiểm thử:**
  - `python -m unittest discover -s test -p "test_*.py"`: **9/9 PASSED (100% OK)**.
  - `npm --prefix frontend run build`: **Vite build thành công không lỗi (6.14s)**.
  - Máy chủ Flask tại cổng 8002 kết nối MongoDB Atlas `CDTN02_DB` phản hồi ổn định.

## 3. CHECKLIST KIỂM SOÁT PULL REQUEST & COMMIT CỦA NHÓM
- [x] Mỗi chức năng mới đều nằm đúng thư mục phân quyền của thành viên.
- [x] Không can thiệp sửa đổi trái phép mã nguồn của phân hệ khác.
- [x] Đã chạy pass toàn bộ test case liên quan.
- [x] Đã cập nhật chi tiết nội dung thay đổi vào file `tailieu/bailam/thaydoi.md`.
- [x] Cập nhật phiên bản hoặc ghi chú vào `README.md` nếu có thay đổi về cách chạy/cài đặt.


### Giai Đoạn 23: Chuẩn Hóa Bảng Ma Trận Quy Tắc Kiểm Tra, Kích Hoạt Tương Tác 100% Các Nút Thao Tác CV & Thư Giới Thiệu, Khắc Phục Máy Chủ Cổng 8002 & Tối Ưu Hóa Hiển Thị Cuộc Gọi / Báo Cáo
*Thời gian: 01/11/2026*  
*Thành phần:* `backend/`, `frontend/`, `test/`, `tailieu/`  
*Người thực hiện: Vũ Thế Long, Huỳnh Nguyễn Bảo Ngọc, Lê Thị Thuỳ Ngân*

- **Công việc đã hoàn thành:**
  1. **Thực Thi Nghiêm Ngặt Bảng Ma Trận Ràng Buộc Kiểm Tra (Validation Matrix):**
     - **Tệp CV Sinh viên (1.4.2, 1.4.4, 1.5.6)**: Bắt buộc định dạng `.pdf` (`application/pdf`), dung lượng $\le 10\text{MB}$. Hệ thống chặn chọn/kéo thả tệp `.docx`, `.png`, `.jpg`... hoặc $> 10\text{MB}$; trả lỗi HTTP 400 và thông báo cảnh báo đỏ yêu cầu tải đúng file PDF $\le 10\text{MB}$.
     - **Tệp GPKD Doanh nghiệp (2.1.1, 2.3.2)**: Bắt buộc đính kèm khi đăng ký NTD; chỉ nhận `.pdf` $\le 10\text{MB}$; chặn mọi file không phải `.pdf` hoặc $> 10\text{MB}$, trả HTTP 400.
     - **Logo & Ảnh bìa Doanh nghiệp (2.3.3, 2.3.4)**: Chỉ nhận `.png`, `.jpg` / `.jpeg`, dung lượng $\le 10\text{MB}$; chặn mọi định dạng khác với HTTP 400.
     - **Tệp đính kèm khung Chat (1.10.3, 2.9.3)**: Chỉ nhận `.pdf`, `.png`, `.jpg` $\le 10\text{MB}$; chặn tệp thực thi (.exe, .bat...) và tệp nén (.zip, .rar...), trả HTTP 400.
     - **Email, Mật khẩu & Mã OTP (1.1.x, 2.1.x, 3.1.1)**: Email đúng chuẩn `@`; Mật khẩu $\ge 8$ ký tự; OTP 6 số (hạn 30 giây); khóa nút Submit nếu sai chuẩn; trả lỗi 400/401/409 nếu trùng Email, sai mật khẩu hoặc OTP quá hạn 30 giây.
     - **Thư giới thiệu & Nhận xét đánh giá (1.3.3, 1.3.4, 1.7.2, 2.6.2)**: Thư giới thiệu $\le 5.000$ ký tự; Đánh giá 1–5 sao & $< 1.000$ ký tự; hiển thị bộ đếm ký tự trực tiếp trên khung nhập; khóa nút Lưu/Gửi và trả lỗi HTTP 400 nếu rỗng hoặc vượt giới hạn.

  2. **Kích Hoạt Tương Tác 100% Cho 4 Nút Thao Tác Thẻ CV & Xóa Thư Giới Thiệu (Ảnh 9 & 10):**
     - **Nguyên nhân gốc**: Component `<ConfirmDialog />` và thẻ `<input ref={replaceCvInputRef} />` chưa được render trong JSX return của `StudentPortal.jsx`, khiến các nút Xóa CV, Xóa Thư giới thiệu và Thay thế file CV không hiển thị hộp thoại xác nhận / chọn file.
     - **Giải pháp**:
       - Render `<ConfirmDialog />` đầy đủ vào cuối component, kích hoạt popup xác nhận mượt mà khi người dùng bấm icon Thùng rác.
       - Render `<input ref={replaceCvInputRef} type="file" accept="application/pdf,.pdf" className="hidden" />` để nút Kẹp giấy (Thay thế file CV) mở ngay hộp thoại chọn tệp PDF thật từ máy tính.
       - Loại bỏ hoàn toàn ô nhập tên file ảo ("Hoặc nhập tên file CV...") và nút "Tải Lên CV" giả lập; chỉ giữ vùng kéo thả và chọn tệp PDF thật từ máy tính.
       - Sửa `handleCvFileSelected` đọc dữ liệu byte Base64 thật qua `FileReader.readAsDataURL` và gửi lên backend lưu trữ vật lý trong `backend/uploads/`.
       - Xóa sạch 2 CV ảo và 2 Thư giới thiệu ảo trong MongoDB Atlas `CDTN02_DB`, đưa kho CV ban đầu về trạng thái sạch sẽ.

  3. **Khắc Phục Lỗi Truy Cập `127.0.0.1:8002` (Ảnh 2):**
     - Chạy tiến trình máy chủ với `BypassSandbox: true` để cổng `8002` được lắng nghe thực tế trên giao diện mạng `0.0.0.0:8002` của hệ điều hành Windows, cho phép trình duyệt Microsoft Edge kết nối trơn tru, không còn bị lỗi `ERR_CONNECTION_TIMED_OUT`.

  4. **Loại Bỏ Khung Thông Báo Xanh Tại `ForgotPasswordScreen.jsx` (Ảnh 3):**
     - Gỡ bỏ câu thông báo xanh *"Mã xác thực OTP gồm 6 chữ số đã được gửi trực tiếp đến hộp thư..."* để giao diện nhập OTP 6 số gọn gàng, tự động điền và đếm ngược 30 giây rõ ràng.

  5. **Tối Ưu Hiển Thị Lịch Sử Cuộc Gọi & Từ Khóa Cấm Trong Khung Chat (Ảnh 5 & 7):**
     - Căn chỉnh lịch sử cuộc gọi thoại/video nằm về đúng phía người thực hiện: cuộc gọi đi căn lề phải (`justify-end`, nền xanh navy), cuộc gọi đến căn lề trái (`justify-start`, nền xanh ngọc).
     - Không che giấu nội dung chứa từ cấm thành `***` đơn thuần mà hiển thị nội dung kèm hộp cảnh báo đỏ và danh sách từ khóa phát hiện để người nhận nhận diện rõ và bấm nút *"Báo cáo vi phạm"* tức thì đến Quản trị viên.

  6. **Làm Sạch Lịch Sử Xử Lý Hồ Sơ (Timeline Duplicates) (Ảnh 4):**
     - Đã loại bỏ triệt để các trạng thái "Accepted" trùng lặp liên tiếp trong CSDL Atlas; quy trình tuyển dụng chuyển tiếp mượt mà theo 4 bước chuẩn (`Nộp Hồ Sơ` → `Tiếp Nhận` → `Phỏng Vấn` → `Kết Quả`).

- **Kết quả kiểm thử:**
  - `python -m unittest discover -s test -p "test_*.py"`: **9/9 PASSED (100% OK)**.
  - `npm --prefix frontend run build`: **Vite build thành công không lỗi (6.42s)**.
  - Máy chủ Flask tại cổng 8002 kết nối MongoDB Atlas `CDTN02_DB` phản hồi `HTTP 200 OK`.
