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

## 2. NHẬN DIỆN THƯƠNG HIỆU & ĐẶC TẢ GIAO DIỆN DIGITAL LIGHT DIMENSION (BẢNG MÀU 8 CỘT MATRIX)

- **Tên thương hiệu:** `PARTIME.VN`
- **Slogan:** `Việc Làm Linh Hoạt`
- **Font chữ chuẩn hóa:** `Be Vietnam Pro` (Google Fonts) - tối ưu hiển thị tiếng Việt, hiện đại và thanh lịch.
- **Phong cách thiết kế:** **Digital Light Dimension** 4D hiện đại: Tông nền khuếch tán ánh sáng mềm mại chống mỏi mắt (Anti-fatigue), kết hợp hài hòa điểm nhấn công nghệ xanh **Electric Blue / Deep Navy** (`#38BDF8`, `#2563EB`, `#1D4ED8`), thẻ kính mờ cao cấp Glassmorphism (`backdrop-blur-md`), chữ đen tương phản cao `#0F172A`, sang trọng và bảo vệ thị lực người dùng khi làm việc liên tục.

### Bảng Tổng Hợp Chi Tiết Mã Màu 8 Cột Chuẩn Hóa (8 Columns Matrix):

| Cột | Hạng Mục / Thành Phần | Màu Đỉnh (Top Hex) | Màu Giữa (Mid Hex) | Màu Đáy (Bottom Hex) | Tên Phối Thức / Hiệu Ứng | Công Thức CSS Linear-Gradient Chuẩn | Ứng Dụng Thực Tế & Vai Trò Giao Diện |
| :---: | :--- | :---: | :---: | :---: | :--- | :--- | :--- |
| **1** | **Background**<br>*(Nền Toàn Trang)* | `#FAF8FF`<br>*(Trắng ánh tím)* | `#F0F7FF`<br>*(Trắng băng)* | `#E2E7FF`<br>*(Xanh phấn dịu)* | **Pha Trắng Ánh Xanh** | `linear-gradient(135deg, #FAF8FF 0%, #F0F7FF 50%, #E2E7FF 100%)` | Nền tổng thể toàn bộ trang web; tạo cảm giác ánh sáng khuếch tán 4D mềm mại, chống mỏi mắt (Anti-fatigue). |
| **2** | **Section phụ / Card**<br>*(Khung Form & Thẻ)* | `#EFF6FF`<br>*(Xanh sương)* | `#E2E7FF`<br>*(Xanh phấn)* | `#DBE1FF`<br>*(Xanh kính mờ)* | **Pha Xanh Kính Mờ** | `linear-gradient(180deg, #EFF6FF 0%, #E2E7FF 55%, #DBE1FF 100%)` | Nền khung form nhập liệu, thẻ công việc (Job Card), kết hợp `backdrop-blur-md`. Tiêu đề bên trong luôn dùng chữ đen `#0F172A`. |
| **3** | **Heading**<br>*(Tiêu đề chính & Slogan)* | `#0F172A`<br>*(Đen mực sâu)* | `#1E3A8A`<br>*(Navy đậm)* | `#2563EB`<br>*(Electric Blue)* | **Đen Mực Pha Navy Ánh Kim** | `linear-gradient(90deg, #0F172A 0%, #1E3A8A 60%, #2563EB 100%)`<br>*(kèm bg-clip-text)* | • H1–H3 thông thường: Giữ đơn sắc `#0F172A` để dễ đọc.<br>• Slogan Hero / Banner 3D lớn: Dùng gradient ánh kim 3D sang trọng. |
| **4** | **Text**<br>*(Nội dung văn bản)* | `#1E293B`<br>*(Dòng chính)* | `#334155`<br>*(Mô tả JD / Phụ)* | `#475569`<br>*(Gợi ý / Metadata)* | **Xám Than Đậm (Solid Hierarchy)** | *Không dùng gradient cho chữ nhỏ (Dùng solid colors phân cấp 3 bậc)* | Phân tầng thị giác rõ nét theo thứ bậc: Dòng chính (`#1E293B`), mô tả chi tiết (`#334155`), nhãn phụ/timestamp (`#475569`). |
| **5** | **Button nền**<br>*(Nút bấm chính 3D)* | `#38BDF8`<br>*(Sky Cyan)* | `#2563EB`<br>*(Electric Blue)* | `#1D4ED8`<br>*(Deep Navy)* | **Pha Xanh Logo 3D** | `linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #1D4ED8 100%)` | Khớp 100% với màu khối mô hình Logo 3D (`meshy-3d-logo.glb`). Dùng cho các nút CTA then chốt: Đăng nhập, Nộp hồ sơ, Ứng tuyển. |
| **6** | **Button / Text hover**<br>*(Trạng thái tương tác)* | `#2563EB`<br>*(Electric Blue)* | `#1D4ED8`<br>*(Deep Navy)* | `#003EA8`<br>*(Navy nhấn sâu)* | **Pha Navy Nhấn Sâu** | `linear-gradient(135deg, #2563EB 0%, #1D4ED8 60%, #003EA8 100%)` | Kích hoạt khi rê chuột vào nút bấm, kết hợp bóng đổ phát quang `box-shadow: 0 8px 24px rgba(56, 189, 248, 0.45)`, tạo độ lún/nổi 3D. |
| **7** | **Chữ Button / Input**<br>*(Chữ nút & Ô nhập liệu)* | `#FFFFFF`<br>*(Trắng tinh khiết)* | `#FAF8FF`<br>*(Trắng ngọc)* | `#F8FAFC`<br>*(Trắng mờ nhẹ)* | **Trắng Tinh Khiết 100%** | `linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)` hoặc Solid `#FFFFFF` | • Chữ tương phản cao trên nền nút bấm màu đậm.<br>• Làm màu nền trắng tinh khiết cho ô Input, viền xám sáng `#CBD5E1`. |
| **8** | **Stroke / Viền & State**<br>*(Đường viền & Trạng thái)* | `#BFDBFE`<br>*(Viền kính mờ)* | `#93C5FD`<br>*(Viền nổi bật)* | `#E2E8F0`<br>*(Viền chia tách)* | **Khung Kính Định Hình** | `border: 1px solid #BFDBFE`<br>State: `#10B981`, `#F59E0B`, `#EF4444` | Phân cách thẻ Card, bảng biểu; 3 màu trạng thái: Xanh lục Thành công (`#10B981`), Vàng Cảnh báo (`#F59E0B`), Đỏ Nguy hiểm (`#EF4444`). |

- **Chuẩn Hóa 100% Icon Vector Lucide React:** Loại bỏ triệt để toàn bộ ký tự emoji (`☕`, `🛒`, `📚`, `📦`, `💻`, `🎪`, `🎉`, `✓`, `✕`, `🟢`, `⚪`, `🟡`, `🔴`, `⏳`, `⭐`, `💡`, `📞`, `⚠️`...) và icon AI vô nghĩa (`<Sparkles />`, `<Zap />`, `<Coffee />`). Toàn bộ hệ thống sử dụng vector icons chuẩn từ `lucide-react`.
- **Tên Nút Bấm Chuyên Nghiệp:** Tuyệt đối không chứa từ ngữ chỉ màu sắc thô trong tên nút ("Phê duyệt", "Từ chối", không dùng "Phê duyệt (Xanh)").
- **Cơ Chế Điều Hướng Bằng Logo 3D:** Loại bỏ toàn bộ các nút "Quay lại trang chủ" trong Admin Dashboard và "Quay lại trang" trong các màn hình Đăng nhập / Đăng ký / Quên mật khẩu. Người dùng bấm vào Logo 3D `PARTIME.VN` để trở về chế độ khách / trang chủ.
- **Chế Độ Xem Trước Khách (Guest Preview Mode):** Bảo vệ an toàn dữ liệu cá nhân của Sinh viên và Doanh nghiệp khi chưa xác thực. Giao diện hiển thị khung lưới mẫu (Skeleton Grid), không làm lộ số liệu hay tin nhắn riêng tư. Mở khóa toàn diện tài khoản ngay sau khi đăng nhập hoặc đăng ký thành công.
- **Trung Tâm Chỉ Huy Quản Trị Viên (Analytics Dashboard):**
  - Bộ lọc thời gian tối ưu 2 cột đối xứng: Cột 1 "1. Chọn Năm" (2024, 2025, 2026), Cột 2 "2. Chọn Tháng (trong năm đã chọn)" (Tháng 1 đến Tháng 12).
  - Dòng chọn khoảng ngày: `Từ ngày: [dd/mm/yyyy]` và `Đến ngày: [dd/mm/yyyy]` linh hoạt và chuẩn xác.
  - Loại bỏ hoàn toàn dropdown trung gian chọn phạm vi và 4 nút chọn nhanh tuần ("Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4").
  - Chiến lược dữ liệu: Năm 2024–2025 tải bộ dữ liệu lịch sử chuẩn hóa (`historicalAnalyticsData.js`); Riêng năm 2026 đồng bộ trực tiếp 100% dữ liệu thực từ MongoDB Atlas (`users`, `jobs`, `applications`), tuyệt đối không dùng số liệu ảo giả.
  - Khắc phục triệt để hiện tượng Line Chart giật màn hình khi rê chuột và Pie Chart đổi màu chữ trắng khi hover.
- **Cơ Chế Xóa Vĩnh Viễn (Cascade Delete) & Toàn Vẹn CSDL:** Thao tác Thêm / Sửa / Xóa / Lọc được đồng bộ vĩnh viễn trên CSDL và UI, duy trì trạng thái khi F5 hoặc đăng nhập lại. Đã xóa vĩnh viễn tài khoản rác `eadeedc@gmail.com` (`user_student_486c9bf4`). Loại bỏ các tài khoản không có đuôi `@gmail.com` và xóa sạch các chuỗi mã kỹ thuật thô (`1.5.6`, `BR-NTD-05`, `FR 2.4.7`...) khỏi giao diện người dùng.
- **Đồng Bộ Sidebar & Responsive Đa Thiết Bị:** Bổ sung nút mũi tên toggle thu gọn / mở rộng Sidebar, đồng bộ badge số liệu nhỏ gọn khớp 100% với nội dung maincontent; chống bể vỡ layout và chống gãy chữ khi co kéo cửa sổ nửa màn hình trên PC, Laptop, iPad và Mobile.
- **Canvas Không Gian Vũ Trụ 4D & Logo 3D GLTF:** Tải trực tiếp mô hình `/meshy-3d-logo.glb` với hiệu ứng nổi bồng bềnh 4D, nghiêng theo chuột và hiển thị kèm nhận diện `PARTIME.VN` - `Việc Làm Linh Hoạt`.
- **Giao Diện Màn Hình Xác Thực Độc Lập:** 
  - Màn hình Đăng nhập ([`LoginScreen.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/features/auth/LoginScreen.jsx)): Loại bỏ Header và Footer, loại bỏ đăng nhập mạng xã hội bên ngoài, kiểm tra mật khẩu tối thiểu 8 ký tự (chữ hoa, thường, số, ký tự đặc biệt). Quản trị viên đăng nhập bằng tài khoản tối cao bảo mật, hệ thống tự động ghi nhớ thông tin đăng nhập.
  - Màn hình Đăng ký tài khoản ([`RegisterScreen.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/features/auth/RegisterScreen.jsx)): Loại bỏ Header và Footer, hỗ trợ kéo thả tệp tin trực tiếp (Drag & Drop) vào khung tải GPKD; tích hợp chọn nhanh 24 quận huyện TP.HCM và chi nhánh; cam kết 1 Email = 1 Role.
  - Màn hình Quên mật khẩu ([`ForgotPasswordScreen.jsx`](file:///d:/Hoc/DH/N4/N4.HK01/Chuyende2/CDTN02/frontend/src/features/auth/ForgotPasswordScreen.jsx)): Loại bỏ Header và Footer, chia ngữ cảnh riêng cho Sinh viên và Doanh nghiệp, 6 ô nhập OTP, đồng hồ đếm ngược 10 phút (600s), nút tự động điền mã OTP (Hands-Free Auto-fill); cập nhật xong tự chuyển về Đăng nhập.
- **Thanh Header Phân Hệ Đã Đăng Nhập:**
  - Bên trái: Logo 3D + `PARTIME.VN` + `Việc Làm Linh Hoạt` (Click quay về Trang Chủ / Chế độ khách).
  - Bên phải: Tên người dùng + Tên Công ty / Chi nhánh (nếu là Nhà tuyển dụng) + Vai trò + Badge trạng thái tự động + Avatar Dropdown (Cập nhật tài khoản cá nhân, Đổi mật khẩu, Hủy tài khoản và Đăng xuất).
- **Hỗ Trợ Kéo Thả Tệp Tin & Hình Ảnh (Drag & Drop):** Hỗ trợ kéo thả trực tiếp tệp CV PDF của sinh viên, GPKD PDF của doanh nghiệp, Ảnh bìa và Logo doanh nghiệp từ máy tính ngoài vào trình duyệt mượt mà.
- **Tích Hợp Đầy Đủ 24 Quận Huyện TP.HCM & Gợi Ý Chi Nhánh:** Dropdown tích hợp toàn bộ các quận, huyện, TP. Thủ Đức và các chi nhánh thực tế cùng toàn bộ vòng đời tin đăng.
- **Giao Tiếp Thực Tế & WebRTC Video Call:** Nhắn tin thời gian thực tự động lọc từ cấm; Cuộc gọi video mở webcam/microphone thực tế với nút Mute mic, Tắt cam, đếm thời lượng và Kết thúc gọi.
- **Loại Bỏ Hoàn Toàn Mã Kỹ Thuật (WBS, FR, BR, UC, US) Khỏi Giao Diện.**
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
     - - **Sinh viên:** `vuthelong@vlu.edu.vn` / `Long123!`
     - - **Nhà tuyển dụng:** `huynhnguyenbaongoc2k5@gmail.com` / `Huynh120905!` (hoặc `Ngoc123!`)
     - - **Quản trị viên:** `lethithuyngan985@gmail.com` / `Le090805!`
2. **Loại Bỏ Hoàn Toàn Hộp Thoại Trình Duyệt (Zero Browser Dialogs):**
   - Toàn bộ các hộp thoại `window.alert`, `window.confirm`, `window.prompt` (`127.0.0.1:8000 cho biết` hoặc `localhost:8002 cho biết`) đã được thay thế 100% bằng:
     - Hộp thoại nổi Dark 4D `<ConfirmDialog>` sang trọng cho các hành vi xóa hoặc cảnh báo nguy hiểm.
     - Thanh Banner thông báo trạng thái gắn dưới Header (Thành công (Emerald): Thành công; Đang tải/Chờ (Amber): Đang tải/Chờ; Cảnh báo/Lỗi (Rose): Cảnh báo).
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

