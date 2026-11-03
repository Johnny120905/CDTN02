# NỀN TẢNG TUYỂN DỤNG VIỆC LÀM LINH HOẠT CHO SINH VIÊN (PARTIME.VN)
### ĐỀ TÀI CHUYÊN ĐỀ TỐT NGHIỆP 2 - CDTN02
> **Khoa Công nghệ Thông tin - Trường Đại học Văn Lang**  
> **Repository GitHub:** [https://github.com/Johnny120905/CDTN02.git](https://github.com/Johnny120905/CDTN02.git)  
> **Cơ sở dữ liệu MongoDB Atlas dùng chung:** `CDTN02_DB` (Tập hợp 16 Collections)

---

## 1. THÀNH VIÊN THỰC HIỆN & PHÂN CÔNG VAI TRÒ (3 ROLES)

Dự án phục vụ 3 nhóm đối tượng người dùng (Sinh viên, Nhà tuyển dụng, Quản trị viên) và được chia thành 3 phân vùng mã nguồn độc lập theo kiến trúc **Layered Clean Architecture** để 3 thành viên lập trình trên máy tính cá nhân độc lập, không bị xung đột code khi commit và push lên GitHub:

| STT | Thành viên | Phân hệ (Role) | Trách nhiệm phát triển Backend | Trách nhiệm phát triển Frontend |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Vũ Thế Long** | **Sinh viên (student)** | `backend/src/api/student/`<br>`backend/src/services/student/`<br>`backend/src/repositories/student/` | `frontend/src/features/student/`<br>`frontend/src/components/student/` |
| 2 | **Huỳnh Nguyễn Bảo Ngọc** | **Nhà tuyển dụng (employer)** | `backend/src/api/employer/`<br>`backend/src/services/employer/`<br>`backend/src/repositories/employer/` | `frontend/src/features/employer/`<br>`frontend/src/components/employer/` |
| 3 | **Lê Thị Thuỳ Ngân** | **Quản trị viên (admin)** | `backend/src/api/admin/`<br>`backend/src/services/admin/`<br>`backend/src/repositories/admin/` | `frontend/src/features/admin/`<br>`frontend/src/components/admin/` |

> ⚠️ **RÀNG BUỘC PHÁT TRIỂN & CẬP NHẬT LIÊN TỤC:**
> 1. **Cập nhật tài liệu:** Khi bất kỳ thành viên nào thay đổi hoặc bổ sung mã nguồn, **BẮT BUỘC** phải cập nhật nhật ký lập trình tại `tailieu/bailam/thaydoi.md` và kiểm tra lại `README.md` trước khi push code lên Git.
> 2. **Ràng buộc định danh:** **1 Email thực chỉ được dùng cho duy nhất 1 Role** (Không được dùng 1 email cho 2 hoặc 3 role). Hệ thống kiểm soát tính toàn vẹn ở cả tầng Database và API Middleware.

---

## 2. NHẬN DIỆN THƯƠNG HIỆU & ĐẶC TẢ GIAO DIỆN DARK 4D ELECTRIC BLUE WEBSITE

- **Tên thương hiệu:** `PARTIME.VN`
- **Slogan:** `Việc Làm Linh Hoạt`
- **Font chữ chuẩn hóa:** `Be Vietnam Pro` (Google Fonts) - tối ưu hiển thị tiếng Việt, hiện đại và thanh lịch.
- **Phong cách thiết kế:** **Dark 4D Website** hiện đại: Tông màu chủ đạo là **Xanh dương (Electric Azure / Sky Blue / Deep Navy)** (`#030712`, `#0b1329`, `#2563eb`, `#38bdf8`), thẻ kính mờ cao cấp Glassmorphism (`backdrop-blur-xl border-blue-900/30`), chữ trắng tinh tế, sang trọng, tuyệt đối không sến súa.
- **Canvas Không Gian Vũ Trụ 4D:** Bầu trời 650 ngôi sao phát sáng lấp lánh ngoài vũ trụ, vòng xoay 4D Hyper-Torus đa chiều và sóng biến dạng không-thời gian theo chuột.
- **Logo 3D WebGL GLTF:** Tải trực tiếp mô hình `/meshy-3d-logo.glb` với hiệu ứng nổi bồng bềnh 4D, nghiêng theo chuột và hiển thị kèm nhận diện `PARTIME.VN` - `Việc Làm Linh Hoạt`.
- **Hệ Thống Trạng Thái 4 Màu Chuẩn Hóa:**
  - 🟡 **Vàng (Amber):** Chờ đợi (Pending / Waiting / Chờ duyệt / Chờ xử lý).
  - 🔴 **Đỏ (Red):** Cảnh báo / Khóa / Từ chối / Ẩn tin vi phạm (Warning / Banned / Rejected / Hidden).
  - 🟢 **Xanh lá (Emerald):** Hoạt động an toàn / Đã duyệt / Trúng tuyển (Active / Safe / Accepted / Resolved).
  - 🟠 **Cam đỏ (Orange):** Đang xử lý / Phỏng vấn / Đang điều tra (Processing / Interviewing / Investigating).
- **Giao Diện Màn Hình Xác Thực Độc Lập:** 
  - Màn hình Đăng nhập ([`LoginScreen.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/features/auth/LoginScreen.jsx)): **Loại bỏ Header và Footer**, loại bỏ đăng nhập mạng xã hội bên ngoài, kiểm tra mật khẩu tối thiểu 8 ký tự (chữ hoa, thường, số, ký tự đặc biệt). Quản trị viên nhập thông tin riêng bảo mật, hệ thống tự động ghi nhớ thông tin đăng nhập.
  - Màn hình Đăng ký tài khoản ([`RegisterScreen.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/features/auth/RegisterScreen.jsx)): **Loại bỏ Header và Footer**, hỗ trợ **kéo thả tệp tin trực tiếp (Drag & Drop)** từ máy tính bên ngoài vào khung tải Giấy phép kinh doanh (GPKD/MST); tích hợp chọn nhanh toàn bộ **24 quận huyện TP.HCM** và chi nhánh; cam kết 1 Email = 1 Role. Mật khẩu từ 8 ký tự.
  - Màn hình Quên mật khẩu ([`ForgotPasswordScreen.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/features/auth/ForgotPasswordScreen.jsx)): **Loại bỏ Header và Footer**, chia ngữ cảnh riêng cho Sinh viên (`Sinhvien@gmail.com`) và Doanh nghiệp (`Nhatuyendung@gmail.com`), 6 ô nhập OTP, đồng hồ đếm ngược 30 giây (`00:30`), thông báo mô phỏng Hộp thư đến (Email) kèm nút tự động điền mã OTP, con mắt ẩn/hiện mật khẩu ở cả 2 ô mật khẩu mới (tối thiểu 8 ký tự); cập nhật xong tự chuyển về Đăng nhập.
- **Thanh Header Phân Hệ Đã Đăng Nhập:**
  - **Bên trái:** Logo 3D + `PARTIME.VN` + `Việc Làm Linh Hoạt` (Click quay về Trang Chủ).
  - **Bên phải:** Tên người dùng + Tên Công ty / Chi nhánh (nếu là Nhà tuyển dụng) + Vai trò + Badge trạng thái tự động (`🟢 Đang hoạt động` / `🟡 Tạm dừng` / `🔴 Ngưng hoạt động`) + Avatar Dropdown. Bấm vào icon xuất hiện menu: **Cập nhật tài khoản cá nhân & Đổi mật khẩu**, **Nút đỏ Hủy tài khoản** và **Đăng xuất**.
- **Thanh Sidebar Điều Hướng & Độc Lập Màn Hình:**
  - Loại bỏ hoàn toàn card danh tính thừa ở đáy sidebar trên cả 3 Role.
  - Mỗi mục trong sidebar hiển thị 1 màn hình tính năng độc lập, các bảng dữ liệu có **màu nền đặc `bg-slate-900` với đường viền rõ nét (xóa bỏ hoàn toàn hiện tượng bảng trong suốt)**.
- **Hỗ Trợ Kéo Thả Tệp Tin & Hình Ảnh (Drag & Drop):** Hỗ trợ kéo thả trực tiếp tệp CV PDF của sinh viên, GPKD PDF của doanh nghiệp, Ảnh bìa và Logo doanh nghiệp từ máy tính ngoài vào trình duyệt mượt mà.
- **Tích Hợp Đầy Đủ 24 Quận Huyện TP.HCM & Gợi Ý Chi Nhánh:** Dropdown tích hợp toàn bộ các quận, huyện, TP. Thủ Đức và các chi nhánh thực tế cùng toàn bộ vòng đời tin đăng.
- **Giao Tiếp Thực Tế & WebRTC Video Call:** Nhắn tin thời gian thực; Cuộc gọi video mở webcam/microphone thực tế với nút Mute mic, Tắt cam, đếm thời lượng và Kết thúc gọi (đã loại bỏ khung phỏng vấn nhấp nháy).
- **Loại Bỏ Hoàn Toàn Mã Kỹ Thuật (WBS, FR, BR, UC, US) & Breadcrumbs Khỏi Giao Diện.**
- **Dữ Liệu Thời Gian Thực:** Tự động làm mới mỗi 10 giây; Autocomplete gợi ý hơn 34 ngành nghề part-time; Bộ lọc sắp xếp Mới nhất, Cũ nhất, Lương cao/thấp.

---

## 3. CẤU TRÚC THƯ MỤC TỔNG CDTN02

```text
CDTN02/
├── .git/                                # Git version control
├── backend/                             # MÃ NGUỒN BACKEND (Clean Architecture)
│   ├── .env.example                     # Mẫu biến môi trường kết nối DB
│   ├── requirements.txt                 # Danh sách thư viện Python
│   ├── server.py                        # Entry point khởi chạy ứng dụng Flask
│   └── src/
│       ├── core/                        # Cấu hình chung, kết nối MongoDB Atlas, JWT, Hashing
│       │   ├── config.py                # Biến môi trường & cấu hình hệ thống
│       │   ├── database.py              # MongoDB Atlas client & fallback store
│       │   └── security.py              # Bcrypt hash & JWT helper
│       ├── middlewares/                 # Middleware xác thực & kiểm tra ràng buộc 1 Email = 1 Role
│       │   └── auth_middleware.py
│       ├── api/                         # Presentation Layer (API Controllers / Blueprints)
│       │   ├── auth/                    # Đăng ký, đăng nhập, quên mật khẩu (1 Email = 1 Role)
│       │   ├── student/                 # Vũ Thế Long phụ trách (FR 1.1 -> 1.10)
│       │   ├── employer/                # Huỳnh Nguyễn Bảo Ngọc phụ trách (FR 2.1 -> 2.9)
│       │   ├── admin/                   # Lê Thị Thuỳ Ngân phụ trách (FR 3.1 -> 3.9)
│       │   └── common/                  # API công khai (Danh mục, Tìm việc, Healthcheck)
│       ├── services/                    # Business Logic Layer (Ứng dụng các quy tắc nghiệp vụ)
│       │   ├── student_service.py
│       │   ├── employer_service.py
│       │   ├── admin_service.py
│       │   ├── auth_service.py
│       │   └── chat_service.py
│       └── repositories/                # Data Access Layer (16 Collections MongoDB)
│           ├── user_repo.py
│           ├── job_repo.py
│           ├── application_repo.py
│           ├── review_repo.py
│           ├── chat_repo.py
│           └── category_repo.py
│
├── frontend/                            # MÃ NGUỒN FRONTEND (React + Vite + Tailwind + Three.js)
│   ├── index.html                       # Entry HTML tích hợp font Be Vietnam Pro
│   ├── package.json                     # Quản lý dependencies frontend
│   ├── vite.config.js                   # Cấu hình Vite dev server & proxy API
│   ├── tailwind.config.js               # Bảng màu xanh chủ đạo & font Be Vietnam Pro
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx                     # Entry React
│       ├── App.jsx                      # Định tuyến hệ thống và chuyển đổi 3 Role Portals
│       ├── index.css                    # Toàn cục CSS & hiệu ứng ánh sáng
│       ├── canvas3d/                    # Logo 3D & hiệu ứng không gian tương tác Three.js
│       │   └── HeroLogo3D.jsx           # Component 3D Clock-P Logo & floating particles
│       ├── shared/                      # Các thành phần dùng chung (Header, Footer, Auth Modal)
│       │   ├── Header.jsx
│       │   ├── Footer.jsx
│       │   └── AuthModal.jsx            # Modal xác thực ép buộc 1 Email = 1 Role
│       └── features/                    # Phân hệ độc lập theo từng thành viên
│           ├── student/                 # Vũ Thế Long (Jobs, CV, Apply Tracker, Chat, Video Call)
│           │   ├── StudentPortal.jsx
│           │   ├── JobList.jsx
│           │   ├── CVManager.jsx
│           │   ├── ApplicationTracker.jsx
│           │   └── StudentChatCall.jsx
│           ├── employer/                # Huỳnh Nguyễn Bảo Ngọc (Company, Post Job, ATS, Review)
│           │   ├── EmployerPortal.jsx
│           │   ├── CompanyProfile.jsx
│           │   ├── JobPostingStudio.jsx
│           │   ├── CandidateATS.jsx
│           │   └── EmployerReview.jsx
│           └── admin/                   # Lê Thị Thuỳ Ngân (Dashboard, Users, Moderation, Master Data)
│               ├── AdminPortal.jsx
│               ├── AnalyticsDashboard.jsx
│               ├── UserManagement.jsx
│               ├── JobModeration.jsx
│               └── BannedKeywordsManager.jsx
│
├── tailieu/                             # TÀI LIỆU DỰ ÁN & THIẾT KẾ
│   ├── Architecture.drawio              # Sơ đồ kiến trúc ban đầu
│   ├── Layerd Clean Architecture.drawio # Sơ đồ kiến trúc 5 tầng phân quyền 3 thành viên
│   ├── ERD.drawio                       # Sơ đồ 16 Collections CSDL
│   ├── UseCase.drawio                   # Sơ đồ ca sử dụng
│   ├── WBS01.drawio                     # Phân rã công việc giai đoạn 1
│   ├── WBS02.drawio                     # Toàn bộ danh mục chức năng 3 Role
│   ├── bailam/                          # Tài liệu triển khai & kịch bản
│   │   ├── thaydoi.md                   # Nhật ký lập trình & theo dõi sửa đổi (BẮT BUỘC CẬP NHẬT)
│   │   ├── thietke.md                   # Bộ 18 Prompt Google Stitch tái tạo giao diện 100%
│   │   ├── dieukienrangbuoc.md          # 6 quy tắc cốt lõi & ma trận 22 kịch bản test
│   │   ├── noidung.md                   # Báo cáo chuyên đề hoàn chỉnh theo mẫu trường
│   │   └── CongNghe.docx                # Luận chứng công nghệ
│   └── noidung/                         # Tài liệu học phần & biểu mẫu của trường
│       └── Maubaocao_ChuyenDeTotNghiep2.docx
│
├── test/                                # BỘ KIỂM THỬ TỰ ĐỘNG
│   ├── test_auth_constraints.py         # Kiểm thử ràng buộc 1 Email = 1 Role
│   ├── test_student_workflow.py         # Kiểm thử tìm việc, CV, nộp đơn không trùng lặp
│   ├── test_employer_workflow.py        # Kiểm thử đăng tin, duyệt ứng viên
│   └── test_admin_and_moderation.py     # Kiểm thử Dashboard, khóa user, lọc từ cấm
│
└── README.md                            # Hướng dẫn tổng quan & tái tạo hệ thống
```

---

## 4. HƯỚNG DẪN TÁI TẠO WEBSITE TỪNG BƯỚC (STEP-BY-STEP REPRODUCTION)

Để bất kỳ người đọc hoặc giảng viên nào có thể tái tạo hoàn chỉnh hệ thống đúng 100% với bản gốc, hãy thực hiện theo đúng các bước sau:

### Bước 1: Chuẩn Bị Môi Trường
- **Cài đặt Node.js:** Phiên bản `>= 18.0.0` (Khuyến nghị `v20.x` hoặc `v22.x`).
- **Cài đặt Python:** Phiên bản `>= 3.10` (Khuyến nghị `Python 3.11`).
- **Git:** Đã cài đặt trên máy.

### Bước 2: Clone Mã Nguồn Dự Án
Mở Terminal / PowerShell và gõ lệnh:
```bash
git clone https://github.com/Johnny120905/CDTN02.git
cd CDTN02
```

### Bước 3: Cấu Hình Biến Môi Trường Backend
Di chuyển vào thư mục `backend/`:
```bash
cd backend
```
Tạo file `.env` (sao chép từ `.env.example` nếu có) với nội dung:
```ini
PORT=8002
DEBUG=True
JWT_SECRET_KEY=CDTN02_SUPER_SECURE_JWT_SECRET_KEY_2026
MONGO_URI=mongodb://huynhnguyenbaongoc2k5_db_user:RaBr6xjc5ogYXQwL@ac-ojfhioo-shard-00-00.cpczyp1.mongodb.net:27017,ac-ojfhioo-shard-00-01.cpczyp1.mongodb.net:27017,ac-ojfhioo-shard-00-02.cpczyp1.mongodb.net:27017/?ssl=true&replicaSet=atlas-xcshgl-shard-0&authSource=admin&appName=CDTN02-DB
DATABASE_NAME=CDTN02_DB
```

### Bước 4: Khởi Chạy Cả Frontend & Backend Trên CÙNG 1 LOCALHOST: http://localhost:8002 (Khuyến Nghị)

Để chạy trọn vẹn cả giao diện Web 3D lẫn API Backend trên **duy nhất 1 địa chỉ `http://localhost:8002`** (Cổng 8002 dành riêng cho CDTN02, hoàn toàn không bị xung đột với CDTN01):

1. Tại thư mục gốc `CDTN02/`, chạy lệnh:
   ```bash
   python run.py
   ```
   *(Trên Windows, bạn có thể click đúp trực tiếp vào file `run.bat`)*

2. Mở trình duyệt truy cập:
   👉 **`http://localhost:8002`** *(hoặc `http://127.0.0.1:8002`)*

> ✨ **Ưu điểm vượt trội:**
> - Cả Frontend (React + Vite + Three.js) và Backend API Flask chạy đồng nhất trên **cùng 1 cổng 8002**.
> - Không bị lỗi CORS, không bị trùng cổng với CDTN01 (cổng 8000), không cần mở 2 cửa sổ terminal riêng biệt.
> - Client-side Routing cho cả 3 Role hoạt động tự động thông qua HTML5 History API.

---

### Bước 5 (Tùy Chọn): Khởi Chạy Chế Độ Phát Triển Riêng Biệt (Hot-Reload)

Nếu bạn muốn chỉnh sửa code giao diện với tính năng Hot-Reload tự động cập nhật:
- **Terminal 1 (Backend API):**
  ```bash
  cd backend
  pip install -r requirements.txt
  python server.py
  ```
- **Terminal 2 (Frontend Vite Dev):**
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  *(Truy cập `http://localhost:5173` - Vite tự động proxy các request `/api` sang cổng 8002).*
> Trình duyệt tự động mở hoặc bạn truy cập vào: `http://localhost:5173`.

### Bước 6: Trải Nghiệm & Kiểm Thử Các Chức Năng Của 3 Role
1. **Truy Cập Hệ Thống & Cổng Xác Thực Thực Tế (Port 8002):** 
   - Truy cập ngay tại: **`http://127.0.0.1:8002`**
   - Ngay khi mở website, hệ thống bắt buộc hiển thị trực tiếp **Màn hình Đăng nhập (`LoginScreen`)** cùng mô hình 3D Logo tương tác và nền vũ trụ sao 4D chuyển động. Các trường nhập liệu bắt đầu ở trạng thái rỗng để người dùng tự nhập. Nếu người dùng chọn checkbox *"Ghi nhớ thông tin đăng nhập"*, hệ thống sẽ tự động lưu thông tin sau lần đăng nhập thành công đầu tiên.
   - Khi quên mật khẩu, người dùng nhập Email và nhận mã OTP 6 số (thời hạn 30 giây) được gửi thực tế về Email người dùng qua giao thức SMTP.
   - Mật khẩu toàn hệ thống bắt buộc từ 8 ký tự trở lên (gồm chữ hoa, chữ thường, số, ký tự đặc biệt).
   - **Tài khoản kiểm thử thực tế trên CSDL MongoDB Atlas:**
     - 🎓 **Sinh viên:** `vuthelong@vlu.edu.vn` / `Long123!`
     - 🏢 **Nhà tuyển dụng:** `huynhnguyenbaongoc2k5@gmail.com` / `Huynh120905!` (hoặc `Ngoc123!`)
     - 🛡️ **Quản trị viên:** `lethithuyngan985@gmail.com` / `Le090805!`
2. **Loại Bỏ Hoàn Toàn Hộp Thoại Trình Duyệt (Zero Browser Dialogs):**
   - Toàn bộ các hộp thoại `window.alert`, `window.confirm`, `window.prompt` (`127.0.0.1:8000 cho biết` hoặc `localhost:8002 cho biết`) đã được thay thế 100% bằng:
     - Hộp thoại nổi Dark 4D `<ConfirmDialog>` sang trọng cho các hành vi xóa hoặc cảnh báo nguy hiểm.
     - Thanh Banner thông báo trạng thái gắn dưới Header (🟢 Xanh lá: Thành công; 🟡 Vàng: Đang tải/Chờ; 🔴 Đỏ: Cảnh báo).
3. **Thanh Header & Dropdown Nền Đậm Đặc Opaque:**
   - Dropdown thông báo và dropdown tài khoản được thiết lập nền màu đậm đặc 100% (`#090f20`, opacity 1, `z-[9999]`), loại bỏ hoàn toàn hiện tượng trong suốt bị chìm nội dung.
   - Logo PARTIME.VN gắn link trang chủ trực tiếp, nhấp vào lập tức đưa người dùng trở về Trang chủ ở bất kỳ phân hệ nào.
4. **Hệ Thống Xem & Tải Tệp Tin PDF Chuẩn Kiểm Định (DocumentViewerModal):**
   - Hỗ trợ xem trực tiếp CV Sinh viên và Giấy phép kinh doanh (GPKD) PDF toàn màn hình hoặc nhúng iframe thật, đồng thời hỗ trợ nút tải về máy tính theo chuẩn kiểm định chất lượng đề tài tốt nghiệp CDTN02.
   - Ràng buộc tệp tin nghiêm ngặt: CV Sinh viên (.pdf, ≤ 10MB), GPKD (.pdf, ≤ 10MB), Logo & Ảnh bìa (.png, .jpg, ≤ 10MB), Tệp đính kèm Chat (.pdf, .png, .jpg, ≤ 10MB).
5. **Tiến Độ Ứng Tuyển Sinh Viên (4 Cột Mốc Rõ Ràng):**
   - Chuẩn hóa trục xử lý hồ sơ thành 4 chặng ngang trực quan: `[1. Nộp hồ sơ] -> [2. NTD đã xem] -> [3. Phỏng vấn] -> [4. Trúng tuyển / Từ chối]`.
6. **Đánh Giá & Nhận Xét Nhà Tuyển Dụng:**
   - Hỗ trợ đánh giá 2 chiều minh bạch với cơ chế Upsert thông minh (tránh lỗi xung đột MongoDB DuplicateKeyError). Nhà tuyển dụng và sinh viên có thể chỉnh sửa nhận xét dễ dàng.
7. **Kiểm Duyệt Từ Khóa Cấm & Bảng Thống Kê (Admin Portal):**
   - Bảng thống kê từ khóa cấm hoạt động trong CSDL hiển thị trực quan kèm nút "Xóa" từng từ khóa theo thời gian thực.
8. **Cuộc Gọi Video/Thoại WebRTC & Ghi Nhận Lịch Sử Cuộc Gọi:**
   - Đổ chuông tối đa 180 giây (3 phút); nếu không nghe máy tự động chuyển sang cuộc gọi nhỡ và ghi nhận tin nhắn đỏ trong phòng chat. Khi kết thúc cuộc gọi, tự động lưu thời lượng dạng `mm:ss` vào bong bóng chat.

### Bước 7: Chạy Bộ Test Case Tự Động
Mở Terminal tại thư mục gốc `CDTN02/` và chạy lệnh kiểm thử:
```bash
python -m unittest discover -s test -p "test_*.py"
```
Toàn bộ các ca kiểm thử sẽ được thực thi và in kết quả `OK (Ran X tests)`.

---
*Dự án được bảo vệ bản quyền và phát triển bởi Nhóm sinh viên Khóa Chuyên đề Tốt nghiệp 2 - Trường Đại học Văn Lang.*

