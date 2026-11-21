# PARTIME.VN — NỀN TẢNG TUYỂN DỤNG VIỆC LÀM PART-TIME THEO CA CHO SINH VIÊN (CDTN02)

> **Đề tài Chuyên đề Tốt nghiệp 2 (Mã học phần: `CDTN02`) — Khoa Công nghệ Thông tin, Trường Đại học Văn Lang**  
> **Nhóm thực hiện:** Vũ Thế Long *(2174802010123 — Sinh viên & Kiểm thử/Hạ tầng)* · Huỳnh Nguyễn Bảo Ngọc *(2174802010456 — Nhà tuyển dụng)* · Lê Thị Thuỳ Ngân *(2174802010789 — Quản trị viên)*  
> **Hệ sinh thái công nghệ thực tế:** `React 18.2` + `Vite 5.1` + `Tailwind CSS 3.4` + `Three.js` + `Python Flask 3` + `Flask-SocketIO` + `MongoDB Atlas (18 Collections + GridFS)` + `PBKDF2-HMAC-SHA256 & JWT HS256` + `Brevo HTTPS API v3` + `Selenium WebDriver 4 Java POM (TestNG + Excel)` + `Docker / Render`.

---

## 1. TỔNG QUAN & THỐNG KÊ CẤU TRÚC THƯ MỤC `CDTN02-main`

Khi loại trừ các thư mục phụ thuộc/cache sinh tự động khi build hoặc chạy kiểm thử (`.git/`, `frontend/node_modules/`, `frontend/dist/`, `**/__pycache__/`, `test/target/`, `test/cookies/`, `test/screenshots/`, `test/test-output/` đã được khai báo trong `.gitignore`), toàn bộ kho mã nguồn chuẩn **`CDTN02-main`** gồm:

* **Tổng số thư mục:** **`35` thư mục**, trong đó có **`4` thư mục cấp 1** (`Backend`, `frontend`, `tailieu`, `test`) và **`31` thư mục con/cháu bên trong**.
* **Tổng số tệp tin:** **`122` tệp tin** (`10` tệp ở gốc + `15` trong `Backend/` + `41` trong `frontend/` + `27` trong `tailieu/` + `29` trong `test/`). *[Cập nhật 22/11/2026: đếm theo các tệp có trên GitHub; tệp cục bộ bị `.gitignore` chặn được liệt kê riêng ở cuối cây thư mục.]*

### Bảng tổng hợp số lượng theo từng nhánh thư mục

| Thư mục cấp 1 | Số thư mục nhỏ bên trong | Tổng thư mục trong nhánh | Số tệp tin | Vai trò chính |
|---|---:|---:|---:|---|
| *Thư mục gốc (`CDTN02-main/`)* | — | — | **10** | Cấu hình Git, Docker, Render Blueprint, script khởi chạy nhanh và `CLAUDE.md`. |
| `Backend/` | 9 | 10 | **15** | Máy chủ Python Flask RESTful + Socket.IO + Bảo mật + Kết nối MongoDB Atlas & GridFS. |
| `frontend/` | 9 | 10 | **41** | Giao diện SPA React 18 (*Digital Light Dimension*), Logo 3D WebGL & WebRTC Video Call. |
| `tailieu/` | 2 | 3 | **27** | Tài liệu học phần, 5 sơ đồ `.drawio` (kiến trúc, ERD, WBS), bảng tổng hợp đặc tả `Tonghop.xlsx`, bảng chấm công `Chamcong.xlsx` và 6 báo cáo `.md` đồng bộ. |
| `test/` | 11 | 12 | **29** | Bộ kiểm thử lai `255` Test Cases Excel + Selenium WebDriver Java POM & `HttpClient` + `64` test Python gọi thẳng Backend. |
| **TỔNG CỘNG** | **31** | **35** | **122** | **Full-stack Monorepo (Frontend + Backend + Test + Docs + Deploy)** |

---

### Cây thư mục chi tiết & Chú thích từng tệp (`35` thư mục · `122` tệp)

```text
CDTN02-main/                                      # Thư mục gốc của toàn bộ dự án (10 tệp cấu hình/chạy gốc)
├── .dockerignore                                 # Loại trừ .git, .env, node_modules, tailieu, test khi đóng gói Docker
├── .gitignore                                    # Chặn đẩy tệp nhạy cảm (.env, test/cookies/, local_db_store.json, build cache) lên Git
├── CLAUDE.md                                     # Hướng dẫn cho trợ lý AI (Claude Code): lệnh chạy, cấu trúc mã nguồn, quy ước của dự án
├── Dockerfile                                    # Multi-stage build: Node 20 build frontend/dist rồi chạy Python 3.11 Flask cổng 8002
├── README.md                                     # Tài liệu hướng dẫn cấu trúc, tái tạo từ đầu, phát triển và triển khai (tệp này)
├── docker-compose.yml                            # Khởi chạy container nội bộ mở cổng 8002 + 3 cổng role 3001/3002/3003
├── render.yaml                                   # Blueprint Render Cloud: 1 Docker Web Service chính + 2 Static Sites cho NTD & QTV
├── run.bat                                       # Script Windows 1-click chạy run.py trên cổng hợp nhất 8002
├── run.py                                        # Tự kiểm tra build frontend/dist rồi khởi chạy Flask + mở trình duyệt localhost:8002
├── run_separate_roles.bat                        # Script Windows mở 4 cửa sổ tách biệt: API (8002) + 3 cổng dev 3001/3002/3003
│
├── Backend/                                      # [1 thư mục gốc + 9 thư mục con = 10 thư mục, 15 tệp] Máy chủ API & Realtime
│   ├── .env.example                              # Tệp mẫu tên các biến môi trường (phải sao chép sang .env và tự điền key của bạn)
│   ├── requirements.txt                          # Danh sách thư viện Python (Flask, Flask-CORS, PyMongo, Dotenv, Flask-SocketIO...)
│   ├── server.py                                 # Điểm khởi chạy Flask WSGI + SocketIO, phục vụ /uploads/* và SPA frontend/dist
│   └── src/                                      # Thư mục mã nguồn phân lớp của Backend
│       ├── core/                                 # Tầng hạ tầng cốt lõi (6 tệp)
│       │   ├── config.py                         # Đọc PORT, MONGO_URI, JWT_SECRET_KEY, BREVO_API_KEY từ .env / biến môi trường
│       │   ├── database.py                       # AtlasCollectionAdapter (Cache 300s), GridFS, tách blob >2KB, cascade delete & seed dữ liệu
│       │   ├── email_service.py                  # Gửi OTP 60s ưu tiên Brevo HTTPS API v3 (cổng 443), dự phòng SMTP chuẩn RFC
│       │   ├── notification_service.py           # Tạo bản ghi thông báo DB, tự suy luận link/menu đích theo Role và phát Socket.IO
│       │   ├── security.py                       # Kiểm tra regex email/5 quy tắc mật khẩu, băm PBKDF2-HMAC-SHA256 & JWT HS256 (86.400s)
│       │   └── socket_service.py                 # Quản lý 10 listener/17 emit Socket.IO, chuẩn hóa room_id chat & WebRTC CALL_PARTIES
│       ├── middlewares/                          # Tầng bảo vệ truy cập trước khi vào API (1 tệp)
│       │   └── auth_middleware.py                # Decorator @token_required, @role_required (RBAC) & check_email_role_constraint (1 Email=1 Role)
│       └── api/                                  # Tầng API Routes / Controllers phân chia theo nghiệp vụ (5 Blueprints)
│           ├── auth/                             # Phân hệ Xác thực chung
│           │   └── auth_routes.py                # 8 endpoint /api/auth/* (đăng ký, đăng nhập, OTP 60s, đổi mật khẩu, tự hủy TK)
│           ├── student/                          # Phân hệ Sinh viên
│           │   └── student_routes.py             # 28 endpoint /api/student/* (hồ sơ, kho CV PDF, lưu tin, ứng tuyển snapshot, ca T2-CN, review)
│           ├── employer/                         # Phân hệ Nhà tuyển dụng
│           │   └── employer_routes.py            # 20 endpoint /api/employer/* (hồ sơ DN/GPKD, đăng tin 2 luồng, ATS, điểm danh ca, review)
│           ├── admin/                            # Phân hệ Quản trị viên
│           │   └── admin_routes.py               # 32 endpoint /api/admin/* (Dashboard 2026, duyệt GPKD, khóa/xóa cascade, từ cấm, Chat gốc, Audit)
│           └── common/                           # Phân hệ Dùng chung & Khởi tạo
│               └── common_routes.py              # 21 endpoint /api/* (tìm việc công khai, upload GridFS, quét từ cấm, Chat, WebRTC Call, tố cáo)
│
├── frontend/                                     # [1 thư mục gốc + 9 thư mục con = 10 thư mục, 41 tệp] Giao diện React 18 + Vite
│   ├── index.html                                # Tệp HTML gốc tải Google Font Be Vietnam Pro và gắn thẻ <div id="root">
│   ├── package-lock.json                         # Khóa phiên bản chính xác các thư viện npm cho toàn nhóm
│   ├── package.json                              # Khai báo script dev/build và dependencies (React 18, Vite 5, Tailwind, Lucide, Three.js)
│   ├── postcss.config.js                         # Cấu hình PostCSS xử lý Tailwind CSS và Autoprefixer
│   ├── tailwind.config.js                        # Cấu hình Font Be Vietnam Pro, bảng màu 8 cột Digital Light Dimension & hiệu ứng đổ bóng
│   ├── vite.config.js                            # Cấu hình Vite dev server cổng 5173 kèm proxy /api và /uploads về localhost:8002
│   ├── public/                                   # Thư mục tài nguyên tĩnh public
│   │   └── meshy-3d-logo.glb                     # Mô hình Logo 3D định dạng GLTF tải trực tiếp trên Header & trang Auth
│   └── src/                                      # Thư mục mã nguồn React
│       ├── App.jsx                               # ErrorBoundary chống sập trang, định tuyến 3 cổng & cô lập phiên đa tab bằng sessionStorage
│       ├── index.css                             # CSS gốc toàn hệ thống, bảng màu Digital Light Dimension & ẩn icon con mắt thừa của Edge
│       ├── main.jsx                              # Điểm mount ứng dụng React vào DOM root
│       ├── canvas3d/                             # Các thành phần đồ họa WebGL 3D (3 tệp)
│       │   ├── HeroLogo3D.jsx                    # Khối chữ P đồng hồ 3D tương tác chuột bằng Three.js trên trang giới thiệu
│       │   ├── MeshyLogo3D.jsx                   # Trình tải mô hình /meshy-3d-logo.glb tự động căn giữa và xoay theo con trỏ
│       │   └── Web3DBackground.jsx               # Nền hạt 3D bản thử nghiệm cũ (dự phòng, không mount trong App.jsx hiện tại)
│       ├── features/                             # Các màn hình nghiệp vụ chính theo vai trò
│       │   ├── auth/                             # Nhóm màn hình Xác thực độc lập (4 tệp)
│       │   │   ├── AdminLoginScreen.jsx          # Màn đăng nhập riêng cổng /admin (ẩn hoàn toàn Đăng ký & Quên mật khẩu)
│       │   │   ├── ForgotPasswordScreen.jsx      # Quy trình 3 bước khôi phục mật khẩu qua OTP 60 giây gửi tới Gmail
│       │   │   ├── LoginScreen.jsx               # Màn đăng nhập cho Sinh viên / Nhà tuyển dụng hỗ trợ Remember Me
│       │   │   └── RegisterScreen.jsx            # Màn đăng ký 2 bước + kiểm tra MST 10/13 số & kéo thả GPKD .pdf (nếu là NTD)
│       │   ├── student/                          # Phân hệ Sinh viên (1 tệp chính)
│       │   │   └── StudentPortal.jsx             # Toàn bộ 10 mục Sidebar Sinh viên, Chế độ Khách, Kho CV, Lịch ca T2-CN, Chat/WebRTC
│       │   ├── employer/                         # Phân hệ Nhà tuyển dụng (1 tệp chính)
│       │   │   └── EmployerPortal.jsx            # Toàn bộ 10 mục Sidebar NTD, Form đăng tin chống từ cấm, ATS 3 chế độ, Điểm danh & Call
│       │   └── admin/                            # Phân hệ Quản trị viên (2 tệp)
│       │       ├── AdminPortal.jsx               # Toàn bộ 10 mục Sidebar Admin, Dashboard 2026, GPKD, Khiếu nại xem Chat gốc & Audit Log
│       │       └── historicalAnalyticsData.js    # Module dữ liệu lịch sử (được đặt [] để Dashboard 2026 hiển thị 100% số liệu DB thật)
│       └── shared/                               # Thư viện thành phần & hàm tiện ích dùng chung (20 tệp)
│           ├── AccountModal.jsx                  # Hộp thoại 2 tab sửa Thông tin cá nhân (khóa Email) & Đổi mật khẩu 5 điều kiện
│           ├── AuthModal.jsx                     # Modal xác thực bản cũ (dự phòng, không mount trong App.jsx hiện tại)
│           ├── BannedKeywordWarning.jsx          # Thanh cảnh báo đỏ tự hiện khi văn bản nhập chứa từ khóa cấm
│           ├── BrandLogo.jsx                     # Cụm Logo 3D + tên thương hiệu PARTIME.VN + slogan nhấp về Trang chủ
│           ├── CallMediaLayer.jsx                # Khung nổi cuộc gọi Thoại/Video WebRTC giữ kết nối khi chuyển tab
│           ├── ConfirmDialog.jsx                 # Hộp thoại xác nhận nền tối #0b1329 thay thế 100% window.confirm/alert
│           ├── DocumentViewerModal.jsx           # Trình xem trực tiếp tệp PDF CV / GPKD qua <iframe> A4 và tải về máy
│           ├── Footer.jsx                        # Chân trang 3 cột động theo vai trò + modal Cẩm nang tìm việc an toàn
│           ├── Header.jsx                        # Thanh Header kính mờ: Hamburger mobile, tìm kiếm SV, Chuông hover-đọc, menu tài khoản
│           ├── HeroLanding.jsx                   # Banner landing bản thử nghiệm cũ (dự phòng, không mount trong App.jsx)
│           ├── MediaAvatar.jsx                   # Ảnh đại diện/Logo có xử lý fallback ký tự đầu khi ảnh lỗi
│           ├── PaginationBar.jsx                 # Thanh phân trang chuẩn (10 / 20 / 50 / Tất cả) dùng ở các bảng dữ liệu
│           ├── PublicLandingPage.jsx             # Trang landing công khai bản cũ (dự phòng, không mount trong App.jsx)
│           ├── SearchableDropdownInput.jsx       # Ô chọn có tìm kiếm nhanh hỗ trợ trường học, quận huyện, ngành nghề
│           ├── excelExportHelper.js              # Hàm exportTablesToExcelHtml xuất 6 loại báo cáo .xls chuẩn UTF-8 BOM
│           ├── professionSuggestions.js          # Hằng số gợi ý ngành nghề, quận TP.HCM, trường ĐH-CĐ và hàm badge trạng thái
│           ├── searchAndFilterHelper.js          # Bộ máy lọc tiếng Việt không dấu (Quận 1 ≠ Quận 10), tính ca T2-CN & che từ cấm client
│           ├── syncEventHub.js                   # Kênh phát/nhận sự kiện đồng bộ đa tab qua BroadcastChannel & localStorage
│           ├── vietnamLocations.js               # Dữ liệu 63 tỉnh thành, 24 quận TP.HCM, 6 khung lương và 5 khung ca làm việc
│           └── webrtcSocketService.js            # Cấu hình STUN, khởi tạo kết nối Socket.IO client và luồng getUserMedia WebRTC
│
├── tailieu/                                      # [1 thư mục gốc + 2 thư mục con = 3 thư mục, 27 tệp] Tài liệu đồ án, đặc tả & quản lý dự án
│   ├── Architecture.drawio                       # Sơ đồ kiến trúc tổng thể hệ thống (bản cập nhật 22/11/2026)
│   ├── ERD.drawio                                # Sơ đồ thực thể – quan hệ CSDL MongoDB (bản cập nhật 22/11/2026)
│   ├── Layerd Clean Architecture.drawio          # Sơ đồ kiến trúc phân tầng Clean Architecture (bản cập nhật 22/11/2026)
│   ├── WBS01.drawio                              # Sơ đồ phân rã công việc WBS – bản 01
│   ├── WBS02.drawio                              # Sơ đồ phân rã công việc WBS – bản 02 (cây chức năng 3 vai trò)
│   ├── bailam/                                   # Nhóm tài liệu phân tích, thiết kế, công nghệ, quản lý dự án & báo cáo của nhóm (9 tệp)
│   │   ├── Chamcong.xlsx                         # Bảng chấm công & tiến độ: Project Schedule (WBS), Project Log, Performance Review theo 10 buổi
│   │   ├── CongNghe.docx                         # Tài liệu luận chứng lựa chọn công nghệ ban đầu (gốc)
│   │   ├── congnghe.md                           # Đối chiếu CongNghe.docx với công nghệ thực tế & từ điển giải thích từng hàm/biến
│   │   ├── dieukienrangbuoc.md                   # Đặc tả 18 collections + GridFS, 41 BR, 13 NFR, PBKDF2, Brevo API v3 & bản đồ API
│   │   ├── kichban.md                            # Lộ trình 255 kịch bản kiểm thử Manual/Selenium + 64 test Python + bảng đối chiếu đủ 57 lệnh PLT Solutions PDF
│   │   ├── noidung.md                            # Báo cáo đồ án CDTN02 hoàn chỉnh theo đúng cấu trúc mục lục ĐH Văn Lang (Chương 1–5)
│   │   ├── thaydoi.md                            # Nhật ký tiến hóa 42 giai đoạn xuyên suốt quá trình phát triển và kiểm thử
│   │   ├── thietke.md                            # Bộ 42 Google Stitch Prompts đồng bộ 1-1 với giao diện Digital Light Dimension thực tế
│   │   └── Tonghop.xlsx                          # Bảng tổng hợp đặc tả 10 sheet: 161 FR, 41 BR, 24 BF, 33 UF, 13 NFR, 29 RW, 24 LC, 41 TCND, Đối chiếu phạm vi, Product Backlog 171 mục
│   └── noidung/                                  # Tài liệu hướng dẫn từ Giảng viên & Nhà trường (13 tệp)
│       ├── Buoi01_ChuyenDeTotNghiep2.pdf         # Slide hướng dẫn học phần Buổi 01
│       ├── Buoi02_ChuyenDeTotNghiep2.pdf         # Slide hướng dẫn học phần Buổi 02
│       ├── Buoi04_ChuyenDeTotNghiep2.pdf         # Slide hướng dẫn học phần Buổi 04
│       ├── Buoi05_ChuyenDeTotNghiep2.pdf         # Slide hướng dẫn học phần Buổi 05
│       ├── Buoi06_ChuyenDeTotNghiep2.pdf         # Slide hướng dẫn học phần Buổi 06
│       ├── Buoi07_ChuyenDeTotNghiep2.pdf         # Slide hướng dẫn học phần Buổi 07
│       ├── Buoi08_ChuyenDeTotNghiep2.pdf         # Slide hướng dẫn học phần Buổi 08
│       ├── Buoi09_ChuyenDeTotNghiep2.pdf         # Slide hướng dẫn học phần Buổi 09
│       ├── Buoi10_ChuyenDeTotNghiep2.pdf         # Slide hướng dẫn học phần Buổi 10
│       ├── CÁC LỆNH TRUY VẤN TRONG SELENIUM WEBDRIVER JAVA_PLT SOLUTIONS.pdf # Tài liệu chuẩn 57 lệnh WebDriver Java cần phủ
│       ├── Danhsachdetai_ChuyenDeTotNghiep2.pdf  # Danh sách đề tài đăng ký học phần CDTN02
│       ├── Maubaocao_ChuyenDeTotNghiep2.docx     # Mẫu định dạng báo cáo chuẩn của Khoa CNTT
│       └── Nhatkythuchien.docx                   # Biểu mẫu nhật ký thực hiện đề tài
│
└── test/                                         # [1 thư mục gốc + 11 thư mục con = 12 thư mục, 29 tệp] Kiểm thử lai Manual + Selenium POM + test Python
    ├── TestCases_Selenium_PARTIME_VN.xlsx        # Sổ kịch bản 6 sheet (255 TC, 17 cột 3 màu + cột ghi chú R, 5 biểu đồ, sheet TestCases_Python) dùng chung Manual & Automation
    ├── cleanup_and_sync_excel.bat                # Script Windows dọn tệp tạm và chạy ExcelTestManager đồng bộ kết quả
    ├── pom.xml                                   # Cấu hình Maven Java 17 (Selenium 4.25.0, TestNG 7.10.2, Apache POI 5.3.0, Jackson)
    ├── resolve_cp.py                             # Script Python quét ~/.m2/repository dựng classpath JAR khi chạy javac/java trực tiếp
    ├── run_python_tests.bat                      # [Thêm 20/11] Chạy toàn bộ test Python gọi thẳng Backend trên dữ liệu RAM (không chạm Atlas/Render)
    ├── run_selenium_tests.bat                    # Script Windows tự tìm Maven hoặc JDK để biên dịch và chạy toàn bộ bộ test
    ├── testng.xml                                # Cấu hình Suite TestNG trỏ tới PartimeAutomationRunnerTest
    ├── python/                                   # [Thêm 20/11] Test Python thật (unittest) gọi trực tiếp Backend/src, dữ liệu RAM (10 tệp)
    │   ├── _base.py                              # Ép Backend chạy chế độ test RAM (MONGO_URI giả), tạo app Flask + hàm tiện ích login/tạo user/tin/đơn
    │   ├── test_unit_core.py                     # Unit test hàm thật: mật khẩu 5 điều kiện, email, PBKDF2, JWT 24h, từ cấm, phòng chat
    │   ├── test_api_auth_rbac.py                 # Integration: đăng nhập 3 vai trò, OTP 60s, đổi mật khẩu, 401/403, khóa/mở khóa
    │   ├── test_api_admin.py                     # Integration QTV: Dashboard, xóa dây chuyền, GPKD, kiểm duyệt/ẩn tin, từ cấm, danh mục, thông báo
    │   ├── test_api_flow.py                      # Integration SV<->NTD: đăng tin, ứng tuyển, trạng thái đơn, chấm công, đánh giá, chat
    │   ├── test_api_more.py                      # Integration: snapshot hồ sơ, upload PDF 10MB, upsert/ẩn đánh giá, Dashboard chỉ @gmail, trim danh mục
    │   ├── test_api_reports.py                   # Integration: khiếu nại & báo cáo vi phạm (FR-NTD-10.01/10.02, FR-QTV-09.04)
    │   ├── test_doi_chieu_tai_lieu.py            # 11 test đối chiếu tài liệu, tên theo mã TC/BR (10 bug đã được sửa hết ngày 21/11/2026, xem BUG_LOG.md)
    │   ├── run_python_tests.py                   # Chạy tất cả, in tóm tắt, ghi ket_qua_python.json; --excel ghi vào sheet TestCases_Python
    │   └── BUG_LOG.md                            # Danh sách 10 bug kèm căn cứ tài liệu (đã sửa hết 21/11/2026), 5 mã đã bỏ, ghi chú lỗi dữ liệu
    ├── sample_assets/                            # Tệp mẫu phục vụ kiểm thử tải lên & kiểm tra định dạng (3 tệp)
    │   ├── AutoTest_CV_Sample.pdf                # Tệp PDF hợp lệ (có header %PDF) dùng test upload/xem CV
    │   ├── AutoTest_Chat_Attachment.png          # Ảnh PNG mẫu dùng test đính kèm trong phòng chat
    │   └── AutoTest_Invalid.txt                  # Tệp văn bản .txt dùng test cơ chế chặn sai định dạng (Negative)
    └── src/test/java/com/partime/                # Mã nguồn kiểm thử Java POM (4 gói: base, pages, tests, utils)
        ├── base/                                 # Lớp nền tảng WebDriver (1 tệp)
        │   └── BasePage.java                     # Khởi tạo ChromeDriver, banner/con trỏ trình chiếu, wrapper 57 lệnh PLT & chụp ảnh lỗi
        ├── pages/                                # Page Object theo từng vai trò & lớp kiểm thử chéo (4 tệp)
        │   ├── AdminPage.java                    # Kịch bản UI cổng /admin (Dashboard 2026, GPKD, Từ cấm, Master Data, Audit Log)
        │   ├── CrossRoleAndApiHelper.java        # 3 kịch bản E2E đa tab (SV-NTD-QTV), 26 ca HttpClient API/RBAC, hàm Unit Java cũ & cầu nối [PyTest] gọi test Python (20/11)
        │   ├── EmployerPage.java                 # Kịch bản UI NTD (GPKD, Đăng tin, ATS Kanban/Lưới/Danh sách, Chấm công, Chat)
        │   └── StudentPage.java                  # Kịch bản UI Sinh viên (Guest, Auth, Tìm kiếm Quận 1, Ứng tuyển, CV PDF, Chat)
        ├── tests/                                # Lớp điều phối chạy TestNG (1 tệp)
        │   └── PartimeAutomationRunnerTest.java  # Đọc 255 dòng Excel qua DataProvider, định tuyến theo TC_ID và ghi lại bảng Excel
        └── utils/                                # Công cụ hỗ trợ phiên & Excel (3 tệp)
            ├── CookieSessionManager.java         # Lưu/nạp/làm mới Cookie + Token theo từng Role vào test/cookies/*.json (gitignored)
            ├── ExcelTestManager.java             # Đọc sheet Config_Environment & Role sheets, ghi PASS/FAIL không làm hỏng 5 biểu đồ
            └── ScenarioResult.java               # Mô hình đóng gói kết quả (PASS, FAIL, WAIT_COOKIE, NOT RUN) kèm thông điệp chi tiết
```

> **Thư mục tự động sinh khi cài đặt / chạy (không commit lên Git):**
> `frontend/node_modules/`, `frontend/dist/`, `Backend/**/__pycache__/`, `test/target/`, `test/cookies/`, `test/screenshots/`, `test/test-output/`.
> Ngoài ra một số tệp chỉ có trên máy cá nhân, không đẩy lên Git: `.vscode/settings.json`, `Backend/local_db_store.json` (kho JSON dự phòng khi không có Atlas), `test/latest_run_results.json` (kết quả JSON lần chạy TestNG gần nhất), `test/sources.txt`, `test/python/ket_qua_python.json`.

---

## 2. HƯỚNG DẪN TÁI TẠO CƠ CẤU HỆ THỐNG TỪ ĐẦU (TỪ CON SỐ 0 ĐẾN DEPLOY PRODUCTION)

Hướng dẫn dưới đây giúp một lập trình viên mới **tạo lại dự án từ máy tính trống**, tự thiết lập **kho dữ liệu đám mây, khóa bảo mật, khóa gửi email OTP và tài khoản thử nghiệm của riêng mình**, tuyệt đối không phụ thuộc hay dùng chung thông tin cá nhân của nhóm tác giả.

### Bước 1: Chuẩn bị Phần mềm trên Máy Cá nhân
1. **Git:** Cài đặt tại [git-scm.com](https://git-scm.com/).
2. **Python `3.11+`:** Cài đặt tại [python.org](https://www.python.org/downloads/) (nhớ tick **Add Python to PATH** trên Windows).
3. **Node.js `20.x LTS` (kèm `npm`):** Cài đặt tại [nodejs.org](https://nodejs.org/).
4. *(Nếu chạy bộ kiểm thử tự động `test/`)*:
   * **Java JDK `17` trở lên** (khuyến nghị JDK 17 hoặc 21/23) và **Apache Maven `3.9+`**.
   * **Google Chrome** phiên bản mới (Selenium `4.25.0` Selenium Manager sẽ tự tải ChromeDriver phù hợp).
5. *(Nếu muốn chạy đóng gói Container cục bộ hoặc Deploy)*: **Docker Desktop** và tài khoản **Render Cloud** miễn phí.

---

### Bước 2: Khởi tạo Hoặc Nhân bản Cấu trúc Thư mục

* **Cách A — Lấy mã nguồn từ Repository GitHub:**
  ```bash
  git clone https://github.com/Johnny120905/CDTN02.git CDTN02-main
  cd CDTN02-main
  ```
* **Cách B — Tự dựng lại cây thư mục từ đầu (nếu tái tạo thủ công từ thư mục rỗng):**
  ```bash
  mkdir CDTN02-main && cd CDTN02-main
  mkdir -p Backend/src/core Backend/src/middlewares Backend/src/api/{auth,student,employer,admin,common}
  mkdir -p frontend/public frontend/src/{canvas3d,shared} frontend/src/features/{auth,student,employer,admin}
  mkdir -p tailieu/{bailam,noidung}
  mkdir -p test/sample_assets test/src/test/java/com/partime/{base,pages,tests,utils}
  ```
  Sau đó đặt các tệp mã nguồn theo đúng danh sách `111` tệp ở Mục 1.

---

### Bước 3: Tự Tạo Thông tin Bí mật & Kết nối Đám mây của Riêng Bạn (Tuyệt đối không dùng chung)

> ⚠️ **NGUYÊN TẮC BẢO MẬT:** Không dùng khóa mặc định trong tệp mẫu cho môi trường thật và **không bao giờ đẩy tệp `.env` lên GitHub**.

#### 3.1. Tạo Cơ sở dữ liệu MongoDB Atlas (`CDTN02_DB`)
1. Đăng ký/đăng nhập miễn phí tại [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas).
2. Chọn **Create a Cluster -> Shared (Free M0)**.
3. Vào **Database Access -> Add New Database User**: tự đặt `<YOUR_DB_USERNAME>` và tạo `<YOUR_DB_PASSWORD>` mạnh (chỉ gồm chữ và số để tránh lỗi ký tự đặc biệt trong URL). Cấp quyền *Read and write to any database*.
4. Vào **Network Access -> Add IP Address**: chọn *Add Current IP Address* (khi chạy máy nhà) hoặc `0.0.0.0/0` *(cần thiết nếu deploy lên Render Cloud)*.
5. Vào **Database -> Connect -> Drivers (Python 3.6 or later)**: sao chép chuỗi `mongodb+srv://<YOUR_DB_USERNAME>:<YOUR_DB_PASSWORD>@<YOUR_CLUSTER>.mongodb.net/?retryWrites=true&w=majority`.

#### 3.2. Tạo Chuỗi Bí mật Ký Token (`JWT_SECRET_KEY`)
Chạy lệnh sau trong terminal để sinh khóa ngẫu nhiên 64 ký tự hex an toàn cho riêng bạn:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

#### 3.3. Lấy Khóa Gửi Mail OTP Qua Brevo HTTPS API v3 (Miễn phí 300 email/ngày)
Vì các nền tảng cloud miễn phí (như Render Free) chặn kết nối SMTP truyền thống (cổng 25/465/587), hệ thống sử dụng **Brevo API v3 qua HTTPS cổng `443`**:
1. Đăng ký tài khoản tại [brevo.com](https://www.brevo.com/).
2. Vào **Senders, Domains & Dedicated IPs -> Senders -> Add a Sender**: nhập địa chỉ Gmail của bạn làm người gửi chính thức và xác nhận link gửi về hòm thư đó.
3. Vào biểu tượng tài khoản góc trên bên phải -> **SMTP & API -> API Keys -> Generate a new API key**: sao chép khóa bắt đầu bằng `xkeysib-...` (lưu ý chỉ hiện 1 lần duy nhất).

#### 3.4. Tạo tệp `Backend/.env` Cá nhân
Tại thư mục `Backend/`, tự tạo tệp mới tên là **`.env`** *(không commit tệp này)* với cấu trúc sau:

```ini
PORT=8002
DEBUG=False
DATABASE_NAME=CDTN02_DB

# Dán chuỗi bạn vừa tự tạo ở mục 3.1 – 3.3 vào các dấu <...>:
JWT_SECRET_KEY=<YOUR_GENERATED_64_HEX_SECRET>
MONGO_URI=mongodb+srv://<YOUR_DB_USERNAME>:<YOUR_DB_PASSWORD>@<YOUR_CLUSTER>.mongodb.net/?retryWrites=true&w=majority

# Cấu hình gửi OTP qua Brevo HTTPS API v3 (Ưu tiên chính)
BREVO_API_KEY=<YOUR_BREVO_API_V3_KEY>
BREVO_SENDER_EMAIL=<YOUR_VERIFIED_SENDER_EMAIL@gmail.com>
BREVO_SENDER_NAME=PARTIME.VN - Viec Lam Linh Hoat

# Cấu hình SMTP dự phòng (chỉ dùng nếu chạy local muốn fallback qua SMTP)
BREVO_SMTP_SERVER=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_LOGIN=<YOUR_BREVO_SMTP_LOGIN_IF_ANY>
BREVO_SMTP_KEY=<YOUR_BREVO_SMTP_KEY_IF_ANY>
```
> *Ghi chú chế độ Offline:* Nếu bạn bỏ trống `MONGO_URI` hoặc chạy máy không có Internet, `DatabaseManager` sẽ tự động chuyển sang lưu dữ liệu cục bộ vào tệp `Backend/local_db_store.json` để bạn vẫn trải nghiệm website bình thường.

---

### Bước 4: Cài đặt Thư viện & Khởi chạy Phát triển trên Máy (Localhost)

#### 4.1. Cài đặt gói phụ thuộc (chạy 1 lần đầu)
```bash
# 1. Cài thư viện Backend Python
cd Backend
pip install -r requirements.txt
cd ..

# 2. Cài thư viện Frontend React + Vite + Tailwind + Three.js và build gói tĩnh dist/
cd frontend
npm install
npm run build
cd ..
```

#### 4.2. Chọn 1 trong 3 Chế độ Khởi chạy

* **Cách 1 (Khuyên dùng khi Demo & Chạy Hợp nhất — 1 cổng `8002` duy nhất):**
  Từ thư mục gốc `CDTN02-main/`, chạy:
  ```bash
  python run.py
  ```
  *(Hoặc nháy đúp chuột vào `run.bat` trên Windows).*  
  Truy cập trên cùng một trình duyệt (hỗ trợ mở 3 tab song song không ghi đè nhờ `sessionStorage`):
  * Cổng Sinh viên *(mở Chế độ Khách trước)*: `http://localhost:8002/` hoặc `http://localhost:8002/student`
  * Cổng Nhà tuyển dụng *(mở Chế độ Khách trước)*: `http://localhost:8002/employer`
  * Cổng Quản trị viên *(bắt buộc đăng nhập)*: `http://localhost:8002/admin`
  * Kiểm tra sức khỏe API: `http://localhost:8002/api/health`

* **Cách 2 (Phát triển tách riêng Backend + Frontend Hot-Reload khi sửa JSX):**
  * Terminal 1 (Backend Flask): `cd Backend && python server.py` *(chạy tại cổng `8002`)*
  * Terminal 2 (Frontend Vite dev server): `cd frontend && npm run dev` *(chạy tại `http://localhost:5173`, tự proxy `/api` & `/uploads` sang `8002`)*

* **Cách 3 (Mô phỏng 3 tên miền/cổng độc lập `3001` / `3002` / `3003` trên Windows):**
  Chạy tệp `run_separate_roles.bat` để khởi động đồng thời Backend `8002` và 3 tiến trình Vite ở cổng `3001` (SV), `3002` (NTD), `3003` (QTV).

---

### Bước 5: Tự Tạo Tài khoản Dùng Thử cho 3 Vai trò (An toàn & Độc lập)

Hệ thống áp dụng quy tắc **`1 Email @gmail.com = 1 Role duy nhất`** và mật khẩu tối thiểu 8 ký tự gồm *chữ hoa, chữ thường, chữ số và ký tự đặc biệt*:

1. **Tạo tài khoản Sinh viên (`role: "student"`):**
   * Vào `http://localhost:8002/student/register` -> điền tên, `<your_student_email>@gmail.com`, SĐT 10 số bắt đầu bằng `0`, mật khẩu mạnh -> nhập mã **OTP 6 số** gửi về hộp thư Gmail của bạn trong vòng **60 giây**.
2. **Tạo tài khoản Nhà tuyển dụng (`role: "employer"`):**
   * Vào `http://localhost:8002/employer/register` -> chọn loại hình doanh nghiệp, nhập **Mã số thuế 10 hoặc 13 chữ số**, tải lên 1 tệp **Giấy phép kinh doanh định dạng `.pdf`** (có thể lấy file mẫu `test/sample_assets/AutoTest_CV_Sample.pdf` khi chạy thử nghiệm cục bộ) -> xác nhận OTP 60 giây.
3. **Tạo tài khoản Quản trị viên (`role: "admin"`):**
   * Vì lý do bảo mật (`BR-QTV-01`), màn `/admin` **cố ý không có nút Đăng ký công khai**. Bạn tự tạo tài khoản Admin đầu tiên trực tiếp vào bảng `users` trong MongoDB Atlas (hoặc chạy script Python nhỏ cục bộ sử dụng chính hàm `hash_password("<YOUR_OWN_ADMIN_PASSWORD>")` của [Backend/src/core/security.py](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02-main/Backend/src/core/security.py)):
   ```python
   # Chạy trong thư mục Backend/ (chỉ để sinh hash từ mật khẩu bạn tự đặt)
   python -c "from src.core.database import db_manager; from src.core.security import hash_password; db_manager.get_collection('users').insert_one({'_id':'user_admin_init','email':'<your_admin_email>@gmail.com','password_hash':hash_password('<YOUR_OWN_ADMIN_PASSWORD>'),'role':'admin','full_name':'Quan Tri Vien','is_banned':False,'status':'active'})"
   ```
   * Sau đó đăng nhập vào `http://localhost:8002/admin` để duyệt Giấy phép kinh doanh cho tài khoản Nhà tuyển dụng bạn vừa tạo ở bước 2.

---

### Bước 6: Chạy Bộ Kiểm thử Song hành Excel + Selenium Java POM (`test/`)

1. Mở [TestCases_Selenium_PARTIME_VN.xlsx](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02-main/test/TestCases_Selenium_PARTIME_VN.xlsx), sang sheet **`Config_Environment`**:
   * Sửa `BASE_URL` thành `http://localhost:8002` (khi test trên máy) hoặc URL Render của bạn.
   * Đặt `HEADLESS_MODE` = `FALSE` nếu muốn xem Chrome tự động trình chiếu kèm con trỏ chuột ảo và banner mô tả từng bước; đặt `TRUE` để chạy nhanh nền.
2. **Cách cung cấp thông tin đăng nhập an toàn cho kiểm thử Cookie (`MANUAL_FIRST_THEN_COOKIE`):**
   * **Không khuyến khích lưu mật khẩu thật vào file Excel nếu bạn định push Excel lên kho GitHub công khai.** Hãy xóa toàn bộ tệp trong `test/cookies/` (nếu có) và đặt trống mật khẩu trong 3 dòng `TC-SV-007`, `TC-NTD-005`, `TC-QTV-002` — khi chạy lượt đầu tiên ở chế độ có cửa sổ (`HEADLESS_MODE=FALSE`), Selenium sẽ dừng chờ **chính bạn gõ tay email & mật khẩu** trên màn hình đăng nhập thật rồi tự lưu Cookie/JWT vào thư mục cục bộ `test/cookies/` (đã nằm trong `.gitignore`). Các lượt test kế tiếp sẽ tự nạp Cookie không phải đăng nhập lại.
3. Chạy kiểm thử tại thư mục `test/`:
   ```bash
   cd test
   mvn test
   ```
   * Lọc chạy riêng từng role: `mvn test -DroleFilter=SV` *(hoặc `NTD` / `QTV`)*.
   * Hoặc chạy bằng script Windows: `run_selenium_tests.bat`.
   * Kết quả mới nhất của toàn bộ **`255` Test Cases** *(179 ca `Run_Mode=YES`, 76 ca Manual/Clone/OTP/JMeter `Run_Mode=NO`, số liệu sau lần sửa 20/11)* sẽ tự động cập nhật kèm **5 biểu đồ** vào sheet `Overview_Summary` và file JSON `test/latest_run_results.json`.
   * [Chốt 22/11/2026] Chạy `mvn test` cả 3 vai: **255 TC – 178 PASS / 0 FAIL / 77 Skip**, tổng thời gian **23 phút 21 giây**.
   * Các dòng có `POM_Method` bắt đầu bằng `[UnitTest][PyTest]` sẽ gọi test Python trong `test/python/` (cần Python + `pip install -r Backend/requirements.txt`; trên Mac/Linux thêm `-DpythonCmd=python3`).
4. **[Thêm 20/11] Chạy riêng tầng test Python (nhanh, an toàn, không cần trình duyệt, không chạm Atlas/Render):**
   ```bash
   cd test
   run_python_tests.bat            # Windows
   python -X utf8 python/run_python_tests.py --excel   # ghi kết quả vào sheet TestCases_Python
   ```
   * [Chốt 22/11/2026] Tổng 64 test: **64/64 PASS** (10 unit + 54 API). 10 bug web làm khác tài liệu đã được sửa hết ngày 21/11/2026 (xem `test/python/BUG_LOG.md`); 5 mã bug bị loại vì web khớp tài liệu.

---

### Bước 7: Triển khai lên Production (Docker & Render Cloud)

#### 7.1. Chạy thử bằng Docker trên máy trước khi đẩy lên Cloud
```bash
# Cách 1: Dùng Docker trực tiếp
docker build -t partime-vn:latest .
docker run -d -p 8002:8002 --env-file Backend/.env --name partime-app partime-vn:latest

# Cách 2: Dùng docker-compose.yml (lưu ý trỏ env_file tới ./Backend/.env riêng của bạn trước khi chạy)
docker compose up --build
```
Kiểm tra container khỏe mạnh bằng cách mở `http://localhost:8002/api/health`.

#### 7.2. Triển khai miễn phí 3 cổng lên Render Cloud bằng `render.yaml`
1. Tạo tài khoản trên [render.com](https://render.com/) và kết nối kho GitHub của riêng bạn.
2. Tạo dịch vụ từ tệp cấu hình **`render.yaml`** (*New -> Blueprint*) hoặc tạo thủ công:
   * **Service 1 (`partime-student` — Web Service, Runtime Docker):**
     * Trong mục **Environment Variables** trên Dashboard của Render, tự nhập các biến bí mật của bạn (`MONGO_URI`, `JWT_SECRET_KEY`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `DATABASE_NAME=CDTN02_DB`, `PORT=8002`, `DEBUG=False`).
     * Health Check Path: `/api/health`.
   * **Service 2 (`partime-employer` — Static Site) & Service 3 (`partime-admin` — Static Site):**
     * Build Command: `cd frontend && npm install && npm run build`
     * Publish Directory: `frontend/dist`
     * Biến môi trường: `VITE_BACKEND_URL = <URL Web Service chính của bạn>`
     * Thêm **Rewrite Rules** cho `/api/*`, `/uploads/*` trỏ về Web Service chính và `/* -> /index.html` để hỗ trợ React SPA routing khi F5.

---

## 3. HỆ THỐNG TÀI LIỆU ĐỒNG BỘ TRONG KHO DỰ ÁN

| Tài liệu | Liên kết | Nội dung chính |
|---|---|---|
| **Báo cáo Đồ án CDTN02** | [noidung.md](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02-main/tailieu/bailam/noidung.md) | Báo cáo hoàn chỉnh 5 Chương chuẩn ĐH Văn Lang, trình bày rõ ràng cho cả người mới đọc. |
| **Đối chiếu Công nghệ & Hàm/Biến** | [congnghe.md](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02-main/tailieu/bailam/congnghe.md) | Đối chiếu `CongNghe.docx` với thực tế code + từ điển giải thích vai trò từng hàm/biến. |
| **Đặc tả Ràng buộc & API/Socket** | [dieukienrangbuoc.md](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02-main/tailieu/bailam/dieukienrangbuoc.md) | 18 Collections + GridFS, 41 BR, 13 NFR, PBKDF2, OTP 60s, `109+` API & `10 on/17 emit` Socket.IO. |
| **Thiết kế UI & 42 Stitch Prompts** | [thietke.md](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02-main/tailieu/bailam/thietke.md) | Hệ thống 8 cột màu *Digital Light Dimension* & 42 prompt đồng bộ 1-1 với màn hình JSX thật. |
| **Kịch bản Kiểm thử & 57 lệnh PLT** | [kichban.md](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02-main/tailieu/bailam/kichban.md) | Phân tầng 251 TC (Dễ -> Khó, Đúng -> Sai) và giải thích đủ 57 lệnh Selenium WebDriver Java. |
| **Nhật ký Tiến hóa 38 Giai đoạn** | [thaydoi.md](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02-main/tailieu/bailam/thaydoi.md) | Ghi vết toàn bộ lịch sử chỉnh sửa, nâng cấp và kiểm chứng chất lượng qua từng chặng. |

---

## 4. CHECKLIST BẢO MẬT TRƯỚC KHI ĐẨY CODE LÊN GITHUB (`git push`)

1. Kiểm tra `git status` để chắc chắn **KHÔNG có** các tệp `.env`, `test/cookies/*.json`, `Backend/local_db_store.json` chuẩn bị được commit.
2. Nếu bạn có lưu mật khẩu thử nghiệm vào `TestCases_Selenium_PARTIME_VN.xlsx` để chạy nội bộ, hãy xóa giá trị mật khẩu nhạy cảm trước khi đẩy lên kho công khai (hoặc chuyển kho sang *Private*).
3. Chạy lại `cd test && mvn test` (hoặc `run_selenium_tests.bat`) để bảo đảm `0 FAIL` trước khi gộp nhánh.

---
*Phát triển bởi Nhóm sinh viên Chuyên đề Tốt nghiệp 2 (`CDTN02`) — Khoa Công nghệ Thông tin, Trường Đại học Văn Lang.*
