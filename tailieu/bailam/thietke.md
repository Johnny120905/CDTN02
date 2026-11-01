# TÀI LIỆU THIẾT KẾ GIAO DIỆN & TẬP HỢP PROMPT GOOGLE STITCH
## NỀN TẢNG TUYỂN DỤNG PARTIME.VN - VIỆC LÀM LINH HOẠT CHO SINH VIÊN (CDTN02)
> **Phiên bản:** 2.0 - Clean Architecture  
> **Font chữ tiêu chuẩn:** `Be Vietnam Pro` (Google Fonts)  
> **Bảng màu chủ đạo:** Xanh lá cây hiện đại (Bright & Fresh Green: `#10B981`, `#059669`, `#16A34A`, `#DCFCE7`), nền sáng thanh lịch (`#F8FAFC`, `#FFFFFF`), chữ tương phản cao (`#0F172A`, `#334155`).  
> **Điểm nhấn công nghệ:** Logo 3D xoay tương tác hình đồng hồ chữ P kết hợp chiếc lá sinh thái, hiệu ứng 3D Hero bằng Three.js / Canvas, WebRTC Video Call, Realtime Chat.

---

## MỤC LỤC
1. [Hệ Thống Thiết Kế (Design System & Guidelines)](#1-hệ-thống-thiết-kế-design-system--guidelines)
2. [Cấu Trúc Phân Hệ & Vai Trò Lập Trình](#2-cấu-trúc-phân-hệ--vai-trò-lập-trình)
3. [Bộ Prompt Google Stitch Tái Tạo Giao Diện Chung & Xác Thực](#3-bộ-prompt-stitch---giao-diện-chung--xác-thực)
4. [Bộ Prompt Google Stitch Phân Hệ Sinh Viên (Vũ Thế Long)](#4-bộ-prompt-stitch---phân-hệ-sinh-viên-vũ-thế-long)
5. [Bộ Prompt Google Stitch Phân Hệ Nhà Tuyển Dụng (Huỳnh Nguyễn Bảo Ngọc)](#5-bộ-prompt-stitch---phân-hệ-nhà-tuyển-dụng-huỳnh-nguyễn-bảo-ngọc)
6. [Bộ Prompt Google Stitch Phân Hệ Quản Trị Viên (Lê Thị Thuỳ Ngân)](#6-bộ-prompt-stitch---phân-hệ-quản-trị-viên-lê-thị-thuỳ-ngân)

---

## 1. HỆ THỐNG THIẾT KẾ (DESIGN SYSTEM & GUIDELINES)

### 1.1. Typography
- **Primary Font:** `Be Vietnam Pro`, sans-serif (Weights: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold).
- **Scale:**
  - `Hero Display`: 40px - 48px / Line-height 1.2
  - `Heading 1 (H1)`: 30px - 36px / Line-height 1.25
  - `Heading 2 (H2)`: 24px - 28px / Line-height 1.3
  - `Heading 3 (H3)`: 18px - 20px / Line-height 1.4
  - `Body Text`: 14px - 15px / Line-height 1.5
  - `Caption / Small`: 12px - 13px / Line-height 1.4

### 1.2. Color Palette (Dark 4D Website & Màu Xanh Dương Điện - Electric Blue)
- **Primary Brand Colors (Electric Blue Tone):**
  - Primary Blue: `#2563EB` (Blue 600) / `#38BDF8` (Sky 400)
  - Primary Dark / Deep: `#1D4ED8` (Blue 700) / `#0284C7` (Sky 600)
  - Surface Glass Cards: `#0B1329` / `#060B17` với độ mờ `backdrop-blur-xl` và viền `border-blue-900/30`
  - Deep Space Canvas: `#030712` (Không gian nền vũ trụ 4D với 650 ngôi sao phát sáng lấp lánh)
  - Text Primary: `#FFFFFF` / `#F8FAFC` (Trắng sáng tương phản cao)
  - Text Secondary: `#94A3B8` (Slate 400) / `#38BDF8` (Sky 400)
- **Chuẩn Hóa Hệ Thống Màu Sắc Trạng Thái (Status Colors):**
  - 🟡 **Vàng (Amber `#F59E0B`):** Chờ đợi (Pending / Waiting / Chờ duyệt / Chờ xử lý).
  - 🔴 **Đỏ (Red `#EF4444`):** Cảnh báo / Khóa / Từ chối / Ẩn tin vi phạm (Warning / Banned / Rejected / Hidden).
  - 🟢 **Xanh lá (Emerald `#10B981`):** Hoạt động an toàn / Đã duyệt / Trúng tuyển (Active / Safe / Accepted / Resolved).
  - 🟠 **Cam đỏ (Orange `#F97316`):** Đang xử lý / Phỏng vấn / Đang điều tra (Processing / Interviewing / Investigating).

### 1.3. Quy Tắc Bố Cục UI (Layout Guidelines)
1. **Màn hình xác thực (Đăng nhập, Đăng ký, Quên mật khẩu):**
   - Hoàn toàn **loại bỏ Header và Footer chung** của website.
   - Thẻ xác thực căn giữa tinh tế trên nền hạt ngọc 3D Three.js tương tác.
   - Các trường nhập liệu để trống ban đầu để người dùng tự nhập; checkbox "Ghi nhớ thông tin đăng nhập" hỗ trợ tự động lưu sau lần đăng nhập thành công đầu tiên.
2. **Thanh Header phân hệ sau khi đăng nhập:**
   - **Bên trái:** Logo 3D PARTIME.VN - Việc Làm Linh Hoạt (nhấp vào lập tức chuyển về Trang chủ trên cả 3 role).
   - **Bên phải:** Tên người dùng + Huy hiệu vai trò + Avatar + Dropdown Menu.
   - **Đặc tả Dropdown Menu & Chuông Thông báo:** Nền màu xanh đậm đặc hoàn toàn (`#090f20` / `#0b1329`, opacity 1, `z-[9999]`), viền neon `border-2 border-blue-500`, **tuyệt đối không bị trong suốt làm chìm nội dung**. Hỗ trợ click thông báo để điều hướng trực tiếp đến chức năng tương ứng.
3. **Thanh Sidebar bên trái:**
   - Liệt kê các danh mục chức năng chuyên biệt của từng vai trò. Đã loại bỏ khung tài khoản thừa ở đáy thanh sidebar trên cả 3 role để tối ưu không gian hiển thị.
4. **Hệ thống Hộp Thoại Xác Nhận & Thông Báo Thay Thế Toàn Bộ Browser Dialogs:**
   - **Thành phần `<ConfirmDialog>`:** Hộp thoại 4D Modal nổi cao cấp với lớp phủ mờ tối màu đen (`backdrop-blur-md bg-black/85`), thiết kế riêng biệt cho các tác vụ nguy hiểm (Xóa CV, Xóa Thư giới thiệu, Khóa tài khoản, Từ chối GPKD, Ẩn tin...) loại bỏ hoàn toàn các popup native xấu của trình duyệt (`127.0.0.1:8000 cho biết`).
   - **Thanh Banner Trạng Thái Gắn Dưới Header:** Tự động hiển thị khi người dùng Lưu/Tải/Gửi:
     - 🟢 **Xanh lá (`#064e3b` / border-emerald-500):** Thao tác thành công, an toàn.
     - 🟡 **Vàng (`#78350f` / border-amber-500):** Đang xử lý, tải dữ liệu, chờ kết nối.
     - 🔴 **Đỏ (`#7f1d1d` / border-red-500):** Cảnh báo lỗi, dữ liệu không hợp lệ.
5. **Tiến Độ Ứng Tuyển Sinh Viên (4 Chặng Rõ Ràng):**
   - Thay thế trục thời gian lặp lại trước đây bằng sơ đồ 4 cột mốc trực quan: `[1. Nộp hồ sơ] -> [2. NTD đã xem] -> [3. Phỏng vấn] -> [4. Trúng tuyển / Từ chối]`.
6. **Loại bỏ hoàn toàn mã kỹ thuật:**
   - Tuyệt đối không để lộ bất kỳ mã số WBS, FR, BR, NFR, UC, US trên giao diện người dùng. Mọi tiêu đề dùng từ ngữ tiếng Việt tự nhiên, trực quan.

### 1.3. 3D Logo & Branding Concept
- **Logo:** Biểu tượng 3D hình chiếc đồng hồ cách điệu lồng ghép chữ **P** màu xanh lá gradient bóng bẩy, bên trong mặt kim đồng hồ có chồi lá xanh vươn lên biểu trưng cho sinh viên năng động và công việc linh hoạt theo thời gian.
- **Brand Slogan:** `PARTIME.VN - Việc Làm Linh Hoạt`
- **Hiệu ứng 3D Hero:** Sử dụng Three.js Canvas hiển thị khối không gian 3D tương tác theo chuột với logo đồng hồ xoay nhẹ, các hạt ánh sáng xanh phát quang (green bioluminescent particles) tạo cảm giác công nghệ cao, thân thiện và năng lượng.

---

## 2. CẤU TRÚC PHÂN HỆ & VAI TRÒ LẬP TRÌNH

| Phân hệ (Role) | Thành viên phụ trách | Thư mục Frontend chuyên biệt | Trách nhiệm chính |
| :--- | :--- | :--- | :--- |
| **Sinh viên (student)** | **Vũ Thế Long** | `frontend/src/features/student/` | Đăng ký/đăng nhập SV, Profile, CV builder, tìm việc, ứng tuyển, đánh giá NTD, chat, video call. |
| **Nhà tuyển dụng (employer)** | **Huỳnh Nguyễn Bảo Ngọc** | `frontend/src/features/employer/` | Profile công ty, GPKD, đăng tin tuyển dụng, ATS lọc duyệt ứng viên, đánh giá SV, chat, phỏng vấn video. |
| **Quản trị viên (admin)** | **Lê Thị Thuỳ Ngân** | `frontend/src/features/admin/` | Dashboard phân tích, quản lý user, duyệt tin, kiểm duyệt review, danh mục master data, báo cáo vi phạm, bộ lọc từ cấm. |

---

## 3. BỘ PROMPT STITCH - GIAO DIỆN CHUNG & XÁC THỰC

### Prompt 01: Landing Page & 3D Interactive Hero
```text
Role: Senior UI/UX Designer & Frontend Architect
Tool: Google Stitch / Modern Web Canvas
Task: Generate a ultra-clean, high-converting Landing Page for "PARTIME.VN - Việc Làm Linh Hoạt", a premier part-time & freelance marketplace tailored for Vietnamese university students.

Design System & Specs:
- Typography: Font "Be Vietnam Pro", sans-serif. Modern, clean line-height.
- Color Palette: Dominant vibrant emerald green (#10B981, #059669) blended with sleek light slate backgrounds (#F8FAFC, #FFFFFF), slate-900 typography, subtle emerald borders (#A7F3D0).
- Layout:
  1. Sticky Glassmorphism Header:
     - Left: 3D-styled green clock-P emblem logo with text "PARTIME.VN" (bold emerald-700) and subtitle "Việc Làm Linh Hoạt".
     - Center Navigation: "Tìm việc làm", "Dành cho nhà tuyển dụng", "Bảng giá tin", "Về chúng tôi".
     - Right: Action buttons "Đăng tin (Dành cho NTD)" (Ghost button) and "Đăng nhập / Đăng ký" (Solid Emerald-500 rounded-full with hover shadow-emerald).
  2. Hero Section with 3D Canvas Mockup:
     - Left Column (60%): Badge "Nền tảng việc làm Part-time #1 Sinh Viên", Headline "Tìm Công Việc Linh Hoạt, Vững Bước Tương Lai", Subtitle "Hàng nghìn công việc part-time uy tín, linh hoạt thời gian, phù hợp lịch học dành riêng cho sinh viên Việt Nam", Quick Search Floating Bar (Input từ khóa, Dropdown Ngành nghề, Dropdown Địa điểm TP.HCM/Hà Nội, Nút "Tìm kiếm việc làm" màu xanh emerald nổi bật). Popular search tags: Barista, Gia sư, Content Writer, Lập trình thực tập, Thu ngân.
     - Right Column (40%): A 3D interactive floating card showcase featuring the 3D Green Clock-P Logo, floating dynamic cards: "Lương 30k-50k/h đã kiểm duyệt", "Phù hợp lịch học", "Nhận lương tuần/tháng".
  3. Statistics Bar: 4 Metric items: "15,000+ Việc làm", "250,000+ Sinh viên", "4,200+ Doanh nghiệp", "99.2% Đánh giá hài lòng".
  4. Popular Categories Grid (8 Cards): Bán hàng & Dịch vụ, Gia sư & Dạy kèm, Nhà hàng - Khách sạn, Lập trình & CNTT, Marketing & Nội dung, Thiết kế & Đồ họa, Giao hàng & Vận chuyển, Hành chính & Lễ tân.
  5. Featured Verified Jobs Grid (6 Cards): Company logo, Job title, Company name, Salary badge (e.g. 25.000đ - 35.000đ/giờ), Tag "Linh hoạt ca", Location tag, Deadline, "Ứng tuyển nhanh" button.
  6. Value Proposition for Both Roles (2 Tabs: "Dành cho Sinh Viên" vs "Dành cho Doanh Nghiệp").
  7. Footer: Links, Copyright, Contact, Socials, Hotline, Certification badge.
```

### Prompt 02A: Dedicated Full-Page Login Screen (Màn Hình Đăng Nhập Độc Lập)
```text
Role: UI/UX Security & Front-End Specialist
Tool: Google Stitch
Task: Generate the dedicated full-page Login Screen with 3D Brand Showcase and Role Isolation.

Design System & Specs:
- Font: "Be Vietnam Pro".
- Split 2-Column Responsive Layout:
  - Left Column (Desktop/Laptop): Dark emerald gradient background (`#064e3b` to `#047857`), official PARTIME.VN logo header, real-time 3D interactive logo canvas (`HeroLogo3D`), value proposition checkmarks (Zero deposit fees, 100% verified businesses, flexible shifts for student schedules, strict 1-email-1-role constraint).
  - Right Column: Pure white card container with role selector tabs:
    - Tab 1: "Sinh viên" (Student login)
    - Tab 2: "Tuyển dụng" (Employer login)
    - Tab 3: "Quản trị" (Admin login)
  - Form Fields:
    - Email input (RFC 5322 format placeholder).
    - Password input with secure show/hide toggle.
    - Quick link: "Quên mật khẩu? (Nhận OTP 10p)" -> navigates to Forgot Password screen.
    - Submit button: "Đăng Nhập Vào Hệ Thống" (Emerald 600 button with arrow icon).
    - Footer link: "Bạn chưa có tài khoản? Đăng ký tài khoản mới ngay" -> navigates to Register screen.
    - Demo quick-login buttons for Sinh viên (`student@partime.vn`), Tuyển dụng (`employer@partime.vn`), Quản trị (`admin@partime.vn`).
```

### Prompt 02B: Dedicated Full-Page Register Screen (Màn Hình Đăng Ký Độc Lập)
```text
Role: UI/UX Front-End Specialist
Tool: Google Stitch
Task: Generate the dedicated full-page Account Registration Screen enforcing 1-Email-1-Role.

Design System & Specs:
- Font: "Be Vietnam Pro".
- Top Navigation: "Quay lại trang Đăng nhập" back button with arrow.
- Header: BrandLogo badge, Headline "Đăng Ký Tài Khoản Mới", Subtitle.
- System Constraint Banner (BR-AUTH-01):
  - "Ràng buộc hệ thống: 1 Email thực chỉ được phép đăng ký duy nhất 1 vai trò (Sinh viên hoặc Nhà tuyển dụng). Nếu email đã được dùng cho vai trò khác, hệ thống sẽ từ chối đăng ký."
- Role Toggle:
  - Button 1: "Tôi là Sinh Viên tìm việc"
  - Button 2: "Tôi là Nhà Tuyển Dụng"
- Form Inputs:
  - Full Name / Company Name (dynamic label based on role).
  - Phone number input with Vietnam 10-digit validation.
  - School Name / Company Address.
  - Real Email address.
  - Password (minimum 6 characters).
  - Confirm Password (real-time mismatch check).
- Submit Button: "Xác Nhận Đăng Ký Tài Khoản" (Solid Emerald-600 with loading spinner).
- Bottom link: "Bạn đã có tài khoản trên PARTIME.VN? Đăng nhập ngay".
```

### Prompt 02C: Dedicated 10-Minute OTP & Password Recovery Screen
```text
Role: UI/UX Front-End Specialist
Tool: Google Stitch
Task: Generate the dedicated 10-Minute OTP Verification & Password Reset Screen.

Design System & Specs:
- Font: "Be Vietnam Pro".
- Back button: "Quay lại trang Đăng nhập".
- Step 1: Input email to request OTP.
- Step 2:
  - Big 10-Minute Countdown Clock (`10:00` -> `00:00`) with color transition (Green -> Amber -> Red).
  - Simulated incoming email toast notification on top: "📬 [Hộp thư đến] PARTIME.VN - Mã OTP: [ 8 4 9 2 0 1 ] (Hiệu lực 10 phút)".
  - 6 Individual Square OTP Input Boxes with automatic typewriter auto-fill effect.
  - Quick Button: "⚡ Tự động điền OTP" (Auto-fill without manual typing).
  - New Password & Confirm New Password inputs (min 6 characters).
  - Action Button: "Xác Nhận & Đổi Mật Khẩu Mới".
  - Resend OTP link (enabled after initial delay).
```

---

## 4. BỘ PROMPT STITCH - PHÂN HỆ SINH VIÊN (VŨ THẾ LONG)

### Prompt 03: Student Job Search & Advanced Filter Interface (FR 1.5)
```text
Role: Frontend Engineer - Student Experience (Vũ Thế Long)
Tool: Google Stitch
Task: Create the comprehensive Job Search & Filtering Portal for College Students.

Components:
- Sticky Filter Sidebar (Desktop Left 25%):
  - Search keyword input with clear button.
  - Category multi-select checkboxes (F&B, Gia sư, IT thực tập, Marketing, Sales, v.v.).
  - Work Time Shift checkboxes: "Ca sáng (7h-12h)", "Ca chiều (12h-17h)", "Ca tối (17h-22h)", "Cuối tuần", "Linh hoạt theo lịch học sinh viên".
  - Salary Filter Slider: From 20,000 VND/h to 100,000 VND/h + Checkbox "Lương thỏa thuận".
  - Work Location Dropdown (Quận/Huyện TP.HCM, Hà Nội).
  - Reset filters button & "Lọc 128 công việc phù hợp".
- Main Content Area (Right 75%):
  - Top Bar: Search summary ("128 việc làm part-time đang tuyển"), Sort dropdown ("Mới nhất", "Lương cao nhất", "Gần bạn nhất"), View mode toggle (Grid/List).
  - Job List Item Card (Rich Component):
    - Company Logo & Company Name with Green Checkmark "Đã xác thực GPKD".
    - Job Title (bold, hover emerald-600).
    - Badge Tag array: "Lương: 35.000đ/giờ", "Ca 4 tiếng", "Quận 1", "Sinh viên năm 1-4".
    - Short excerpt of job duties.
    - Bookmark Button (Heart icon: toggle save/unsave with instant feedback).
    - Quick Action: "Xem chi tiết" & "Ứng tuyển nhanh" buttons.
    - Report Flag icon: "Báo cáo tin tuyển dụng có dấu hiệu lừa đảo/vi phạm".
```

### Prompt 04: Job Detail & One-Click Application Modal (FR 1.5.3, 1.5.6)
```text
Role: Frontend Engineer - Student Experience (Vũ Thế Long)
Tool: Google Stitch
Task: Design the Job Detail View and the One-Click Application Workflow Modal.

Job Detail Page Components:
- Header Banner: Company cover image, Company logo, Title, Salary highlight badge, "Nộp hồ sơ ngay" floating sticky CTA.
- Left Content (70%):
  - Mô tả công việc chi tiết (Job Description).
  - Yêu cầu ứng viên (Kỹ năng, độ tuổi, tính chủ động, không yêu cầu kinh nghiệm).
  - Quyền lợi được hưởng (Lương thưởng theo giờ, tip, hỗ trợ dấu mộc thực tập, linh hoạt dời ca khi thi cử).
  - Thời gian & địa điểm làm việc cụ thể.
- Right Sidebar (30%):
  - Thông tin doanh nghiệp: Tên, quy mô nhân sự, địa chỉ, website, đánh giá sao trung bình (4.8/5 sao từ 26 sinh viên).
  - Nút "Xem hồ sơ công ty" & "Chat trực tiếp với NTD".
- Application Modal (Triggered on click "Nộp hồ sơ"):
  - Title: "Ứng tuyển: [Tên vị trí] tại [Tên công ty]"
  - Step 1: Chọn CV ứng tuyển (Dropdown danh sách CV PDF đã tải lên, có badge "CV Mặc định", nút "Xem trước CV" và nút "Tải lên CV mới").
  - Step 2: Chọn Thư giới thiệu (Cover Letter) mẫu hoặc viết nhanh lời nhắn gửi nhà tuyển dụng (tối đa 500 ký tự).
  - Snapshot notice: "Hệ thống sẽ lưu bản chụp hồ sơ tại thời điểm nộp để đối chiếu minh bạch."
  - Action buttons: "Hủy bỏ" & "Xác nhận gửi hồ sơ ngay" (Emerald button with success toast on submit).
```

### Prompt 05: Student CV Management & Profile Studio (FR 1.3, 1.4)
```text
Role: Frontend Engineer - Student Experience (Vũ Thế Long)
Tool: Google Stitch
Task: Create the Student Profile & Multi-CV Management Studio.

Components:
- Tabbed Navigation: "Thông tin cá nhân", "Quản lý CV (Resumes)", "Thư giới thiệu (Cover Letters)", "Cài đặt tài khoản".
- Tab "Quản lý CV":
  - Drag & Drop Upload Zone: Support PDF, DOCX up to 10MB.
  - Resume List Grid:
    - Card preview thumbnail of PDF first page.
    - File name, upload date, file size.
    - Badges: "CV Mặc định" (Default resume), "Trạng thái: Sẵn sàng ứng tuyển".
    - Action Menu: "Đặt làm mặc định", "Xem trước (PDF Preview Modal)", "Tải xuống", "Đổi tên", "Xóa CV".
- Tab "Thư giới thiệu":
  - List of saved Cover Letters (e.g. "Mẫu xin việc Barista", "Mẫu xin việc Thực tập sinh Marketing").
  - Editor modal: Rich textarea with variable suggestions (Tên NTD, Vị trí mong muốn, Lịch rảnh trong tuần).
- Tab "Thông tin cá nhân":
  - Avatar uploader with crop.
  - Full Name, Student ID (MSSV), University name, Major, Year of study, Phone, Bio intro, Portfolio links (GitHub, Behance, LinkedIn).
```

### Prompt 06: Student Application Tracker & History (FR 1.6)
```text
Role: Frontend Engineer - Student Experience (Vũ Thế Long)
Tool: Google Stitch
Task: Build the Student Application Progress & Status Tracking Dashboard.

Components:
- Status Filter Tabs with Counts: "Tất cả (8)", "Đã nộp (3)", "Nhà tuyển dụng đã xem (2)", "Mời phỏng vấn (1)", "Được tuyển dụng (1)", "Bị từ chối (1)".
- Search bar by Job Title / Company Name.
- Application History Table / Card View:
  - Columns: Vị trí ứng tuyển, Doanh nghiệp, Ngày nộp, CV đã gửi, Trạng thái (Pill Badge: Vàng - Chờ duyệt; Xanh dương - Đã xem hồ sơ; Tím - Mời phỏng vấn; Xanh lá - Đã trúng tuyển; Đỏ - Chưa phù hợp).
  - Progress Timeline Bar inside each row (visual step tracking: Nộp đơn -> Xem xét -> Phỏng vấn -> Kết quả).
  - Action Dropdown: "Xem chi tiết hồ sơ snapshot", "Hủy đơn ứng tuyển" (chỉ khả dụng khi chưa duyệt), "Nhắn tin hỏi thăm", "Đánh giá NTD" (khi trạng thái Hoàn thành/Trúng tuyển).
```

### Prompt 07: Student Realtime Chat & WebRTC Video Call (FR 1.8, 1.10)
```text
Role: Frontend Engineer - Realtime & Media Specialist (Vũ Thế Long)
Tool: Google Stitch
Task: Build the Modern Realtime Messaging Interface with embedded WebRTC Video Call modal.

Layout:
- Left Sidebar (Chat List):
  - Search conversation input.
  - List of Employer Chat Threads: Company Avatar, Name, Last message snippet, Timestamp, Online/Offline green dot status indicator, Unread count badge.
- Main Chat Window:
  - Header: Employer Avatar, Name, Job title context ("Đang trao đổi về: Nhân viên Pha chế Part-time"), Online indicator ("Đang hoạt động" / "Vừa truy cập 5 phút trước"), Action buttons: "Gọi Video Phỏng vấn" (Camera icon), "Gọi Thoại" (Phone icon), "Báo cáo cuộc trò chuyện" (Warning flag).
  - Message Body:
    - Bubbles: Incoming (White card with employer name), Outgoing (Emerald-500 bubble with white text).
    - Status receipt: "Đã gửi", "Đã nhận", "Đã xem lúc 14:20" (Checkmark icon).
    - Multimedia preview: Image attachments, PDF preview cards with download button.
  - Input Footer:
    - Paperclip attachment button (Images, Docs up to 10MB).
    - Emoji picker.
    - Textarea with typing indicator ("Nhà tuyển dụng đang soạn tin...").
    - Send button.
- WebRTC Video Call Overlay Modal:
  - Floating video window with Local video stream (Picture-in-picture) and Remote video stream.
  - Controls bar: Mute Audio, Toggle Camera, Share Screen, End Call (Red button).
  - Call connection quality indicator: "HD 1080p - Mã hóa đầu cuối".
```

---

## 5. BỘ PROMPT STITCH - PHÂN HỆ NHÀ TUYỂN DỤNG (HUỲNH NGUYỄN BẢO NGỌC)

### Prompt 08: Employer Dashboard & Overview (FR 2.1 - 2.9)
```text
Role: Frontend Engineer - Employer Experience (Huỳnh Nguyễn Bảo Ngọc)
Tool: Google Stitch
Task: Build the Comprehensive Employer Management Portal Dashboard.

Layout & Components:
- Header: Brand Logo, Company Quick Switcher, Notification Bell, Employer Profile Avatar.
- Top Metric Cards (4 Cards):
  - "Tin đang tuyển": 5 tin (Active)
  - "Hồ sơ mới nhận": 28 ứng viên (Badge "+12 tuần này")
  - "Lịch phỏng vấn sắp tới": 4 sinh viên
  - "Điểm đánh giá công ty": 4.9/5 sao (từ 42 đánh giá sinh viên)
- Quick Action Floating Header: "Đăng tin tuyển dụng mới (+)" (Prominent Green Button).
- Main Body Grid:
  - Left (65%): Table of Recent Active Jobs with columns: Tiêu đề công việc, Số hồ sơ nộp, Lượt xem tin, Trạng thái (Đang mở / Đã đóng), Hành động (Xem ứng viên, Sửa tin, Đóng tin).
  - Right (35%): Candidate Activity Feed (Realtime applications submitted by students with quick review button).
```

### Prompt 09: Company Profile & Verification Center (FR 2.3)
```text
Role: Frontend Engineer - Employer Experience (Huỳnh Nguyễn Bảo Ngọc)
Tool: Google Stitch
Task: Create the Employer Company Profile & Business Verification Interface.

Components:
- Cover Banner & Logo Uploader:
  - Drag-and-drop cover photo (1200x300px).
  - Circular avatar logo uploader with instant preview.
- Verification Status Card:
  - Status Badge: "Đã xác thực giấy phép kinh doanh" (Green badge) / "Đang chờ duyệt" / "Cần bổ sung".
  - Business License (GPKD) Uploader: PDF or JPG upload of business license, Tax Code input, Legal representative name.
- Company Details Form:
  - Tên doanh nghiệp chính thức (Company Name).
  - Giới thiệu doanh nghiệp & môi trường làm việc part-time (Rich Text with images).
  - Quy mô nhân sự dropdown: 1-10, 11-50, 50-200, 200+ nhân viên.
  - Địa chỉ trụ sở & các chi nhánh tuyển dụng sinh viên.
  - Website & Fanpage link.
  - Save Changes button with unsaved warning detector.
```

### Prompt 10: Job Creation & Lifecycle Management Studio (FR 2.4)
```text
Role: Frontend Engineer - Employer Experience (Huỳnh Nguyễn Bảo Ngọc)
Tool: Google Stitch
Task: Design the Job Posting & Editing Studio with rich form controls.

Form Fields:
- Step 1: Thông tin cơ bản:
  - Tiêu đề công việc (e.g. "Nhân viên phục vụ quán cà phê The Coffee House - Ca linh hoạt").
  - Ngành nghề / Danh mục (Dropdown từ Master Data Categories: F&B, Gia sư, Bán lẻ...).
  - Vị trí / Địa chỉ làm việc cụ thể (Quận/Huyện, Số nhà).
- Step 2: Thời gian & Mức lương:
  - Hình thức tính lương: "Theo giờ (VND/h)" hoặc "Theo ca / tháng".
  - Lương tối thiểu & Lương tối đa (Number inputs with auto-currency formatter).
  - Checkbox "Lương có thể thỏa thuận".
  - Thời gian ca làm việc: Ca sáng / Ca chiều / Ca tối / Đăng ký theo lịch rảnh hàng tuần.
- Step 3: Mô tả chi tiết & Yêu cầu:
  - Rich Text Editor: Mô tả công việc, Yêu cầu kinh nghiệm (hoặc "Đào tạo từ đầu"), Quyền lợi sinh viên (Thưởng doanh số, hỗ trợ ăn uống, linh hoạt thi cử).
- Step 4: Thiết lập hiển thị:
  - Trạng thái: "Công khai ngay" / "Lưu bản nháp".
  - Ngày hết hạn nhận hồ sơ.
- Action Buttons: "Xem trước giao diện sinh viên", "Lưu nháp", "Đăng tin ngay".
```

### Prompt 11: Applicant Tracking System (ATS) & Candidate Review (FR 2.5)
```text
Role: Frontend Engineer - Employer Experience (Huỳnh Nguyễn Bảo Ngọc)
Tool: Google Stitch
Task: Build the ATS Candidate Pipeline & Resume Viewer for Employers.

Layout:
- Top Toolbar: Select Job filter dropdown, Search applicant name, Status filter tabs (Chờ duyệt, Đã xem, Hẹn phỏng vấn, Đã tuyển, Từ chối).
- Candidate Table / Kanban Card View:
  - Student Avatar, Full Name, University & Major ("ĐH Văn Lang - CNTT").
  - Nộp lúc (Timestamp).
  - Attached Resume Badge ("CV_VuTheLong.pdf" with 1-click preview).
  - Cover Letter snippet tooltip.
  - Action Dropdown:
    - "Duyệt hồ sơ / Mời phỏng vấn" (Triggers interview scheduler & email notification).
    - "Từ chối hồ sơ" (Modal with optional polite feedback note to student).
    - "Nhắn tin trực tiếp" (Opens chat room).
    - "Báo cáo ứng viên vi phạm / không trung thực".
- Split View CV Modal: Left 60% rendered PDF document; Right 40% applicant notes, interview schedule picker, and evaluation buttons.
```

### Prompt 12: Student Work Performance Review Modal (FR 2.6)
```text
Role: Frontend Engineer - Employer Experience (Huỳnh Nguyễn Bảo Ngọc)
Tool: Google Stitch
Task: Design the Employer Review & Rating Interface for Students after job completion.

Components:
- Modal Dialog: "Đánh giá sinh viên: [Tên Sinh Viên] - Vị trí: [Tên Vị Trí]"
- Star Rating (1 to 5 Stars) with hover animation.
- Detailed Criteria Sliders:
  - Đúng giờ & Tinh thần trách nhiệm (1-5 sao).
  - Thái độ giao tiếp & làm việc (1-5 sao).
  - Chất lượng hoàn thành công việc (1-5 sao).
- Review Comment Textarea: "Nhận xét chi tiết về quá trình làm việc của sinh viên (tối thiểu 30 ký tự)..."
- Privacy toggle: "Công khai đánh giá trên hồ sơ sinh viên để giúp bạn ấy dễ tìm việc trong tương lai".
- Submit Button: "Gửi đánh giá" (Updates MongoDB reviews collection and recalculates student average rating).
```

---

## 6. BỘ PROMPT STITCH - PHÂN HỆ QUẢN TRỊ VIÊN (LÊ THỊ THUỲ NGÂN)

### Prompt 13: Admin Analytics & System Dashboard (FR 3.3)
```text
Role: Frontend Engineer - Admin Platform (Lê Thị Thuỳ Ngân)
Tool: Google Stitch
Task: Build the Admin System Command Center & Analytics Dashboard.

Components:
- Timeframe Filter: "Hôm nay", "7 ngày qua", "30 ngày qua", "Tùy chọn ngày".
- Top Stat Cards:
  - "Tổng người dùng": 28,450 (Badge "+14% tháng này")
  - "Sinh viên tích cực": 24,120
  - "Doanh nghiệp đã kiểm duyệt": 4,330
  - "Tin tuyển dụng đang mở": 1,840
  - "Tỷ lệ ứng tuyển thành công": 76.5%
- Growth Charts Section:
  - Chart 1: Biểu đồ đường (Line Chart) xu hướng đăng ký người dùng mới (Sinh viên vs NTD) qua các tháng.
  - Chart 2: Biểu đồ cột (Bar Chart) số lượng tin tuyển dụng theo ngành nghề (F&B, Retail, IT, Tutor).
  - Chart 3: Donut Chart phân bố trạng thái đơn ứng tuyển (Chờ duyệt, Trúng tuyển, Từ chối).
- Export Control: "Xuất dữ liệu thống kê (Excel / CSV)" with date range modal.
- Recent System Audit Feed: Logs of admin actions, flagged accounts, and new business license submissions.
```

### Prompt 14: User Management & Moderation Center (FR 3.4)
```text
Role: Frontend Engineer - Admin Platform (Lê Thị Thuỳ Ngân)
Tool: Google Stitch
Task: Build the Master User Moderation Table for Students and Employers.

Components:
- Role Filter Tabs: "Tất cả người dùng", "Sinh viên (Student)", "Nhà tuyển dụng (Employer)".
- Status Filter: "Hoạt động", "Bị khóa", "Chờ xác thực GPKD".
- Search Input: By Name, Email, Phone, Company Name.
- Data Table:
  - Avatar & Name
  - Email (With unique badge)
  - Role (Student pill / Employer pill)
  - University / Company Name
  - Ngày đăng ký
  - Trạng thái tài khoản (Badge: Xanh "Hoạt động", Đỏ "Bị khóa")
  - Actions:
    - "Xem chi tiết hồ sơ toàn diện"
    - "Duyệt / Từ chối Giấy phép kinh doanh (đối với NTD)"
    - "Khóa tài khoản" (Opens modal requiring Admin to enter Reason and ban duration)
    - "Mở khóa tài khoản"
```

### Prompt 15: Job Moderation & Compliance Center (FR 3.5)
```text
Role: Frontend Engineer - Admin Platform (Lê Thị Thuỳ Ngân)
Tool: Google Stitch
Task: Design the Platform-wide Job Moderation Table.

Components:
- Filter Bar: Category, Location, Hidden/Visible status, Reported flag indicator.
- Job Moderation Table:
  - Job Title & Company Name (Clickable link to full job preview).
  - Posted Date & Expiry Date.
  - Salary info.
  - Số lượt báo cáo vi phạm (Red badge if reported > 0).
  - Trạng thái kiểm duyệt: "Hiển thị công khai" / "Đã bị ẩn bởi Quản trị viên".
  - Action Controls:
    - "Ẩn tin tuyển dụng" (Enter reason: Lừa đảo, đa cấp, sai mức lương, thông tin không phù hợp).
    - "Bỏ ẩn / Khôi phục tin".
    - "Xóa vĩnh viễn tin tuyển dụng".
```

### Prompt 16: Master Data & Category Management (FR 3.7)
```text
Role: Frontend Engineer - Admin Platform (Lê Thị Thuỳ Ngân)
Tool: Google Stitch
Task: Build the Master Data Management Screen for Job Categories and Career Fields.

Components:
- Top Bar: "Thêm danh mục mới (+)" Button.
- Table of Categories:
  - Mã định danh (Slug)
  - Tên danh mục tiếng Việt (e.g. "Pha chế & Nhà hàng", "Gia sư & Trợ giảng", "Thực tập sinh CNTT")
  - Loại danh mục (Category type: Ngành nghề, Địa điểm, Kỹ năng)
  - Số tin tuyển dụng đang thuộc danh mục này
  - Trạng thái: "Đang hoạt động" / "Tạm ẩn" (Toggle Switch)
  - Actions: "Chỉnh sửa tên/mô tả", "Ẩn danh mục", "Xóa danh mục".
- Add/Edit Category Modal: Input Name, Input Type, Select Icon, Active Toggle.
```

### Prompt 17: Violation Reports Resolution Desk (FR 3.8)
```text
Role: Frontend Engineer - Admin Platform (Lê Thị Thuỳ Ngân)
Tool: Google Stitch
Task: Build the User Violation Report Investigation & Action Center.

Components:
- Filter by Report Type: "Tin tuyển dụng vi phạm", "Hội thoại quấy rối / lừa đảo", "Hồ sơ giả mạo".
- Filter by Status: "Chờ xử lý (Mới)", "Đang điều tra", "Đã xử lý", "Đã bác bỏ".
- Report Card / Row Item:
  - Người báo cáo (Sinh viên/NTD), Ngày gửi.
  - Đối tượng bị báo cáo (Tin tuyển dụng ID, Nhà tuyển dụng ID, Sinh viên ID, Chat Room ID).
  - Lý do vi phạm (Thu phí tuyển dụng trái phép, Đa cấp, Quấy rối, Lừa đảo thông tin).
  - Bằng chứng đính kèm (Ảnh chụp màn hình, trích đoạn chat).
- Resolution Workflow Modal:
  - Chọn hướng giải quyết:
    - Option 1: "Cảnh cáo người dùng"
    - Option 2: "Khóa tin tuyển dụng liên quan"
    - Option 3: "Khóa vĩnh viễn tài khoản người vi phạm"
    - Option 4: "Bác bỏ báo cáo (Không đủ căn cứ)"
  - Admin Resolution Notes textarea.
  - Submit resolution and notify both parties via system notification.
```

### Prompt 18: Automated Chat Censorship & Keyword Filter (FR 3.9)
```text
Role: Frontend Engineer - Admin Platform (Lê Thị Thuỳ Ngân)
Tool: Google Stitch
Task: Build the Realtime Chat Banned Keyword Engine & Monitoring Screen.

Components:
- Banned Keywords Manager:
  - Add keyword form (Input keyword, Category: "Lừa đảo đặt cọc", "Cờ bạc đa cấp", "Ngôn từ thô tục").
  - Tag cloud / Table of banned keywords with hit counter (e.g. "đặt cọc", "nạp tiền", "hoa hồng khủng", "telegram lôi kéo").
  - Action: Delete keyword, Import keyword list CSV.
- Flagged Chat Logs Monitor:
  - Table of chat messages auto-intercepted or flagged by the system.
  - Room ID, Sender, Receiver, Message snippet with highlighted censored words (`***`).
  - Action: "Xem ngữ cảnh toàn bộ hội thoại", "Cảnh cáo người gửi", "Khóa phòng chat ngay lập tức".
```

### Prompt 19: 10-Minute OTP Verification Modal & Automatic Auto-Fill Engine
```text
Role: Frontend Engineer - Core Security & Identity
Tool: Google Stitch
Task: Build the 10-Minute OTP Verification & Password Recovery Modal with Live Countdown & Hands-Free Auto-Fill.

Design Specifications:
- Container: Modern rounded-3xl modal card with backdrop blur and responsive max-w-lg container.
- 10-Minute Countdown Clock:
  - Display big monospace timer "10:00" counting down second-by-second (600s total TTL).
  - Dynamic progress bar that transitions color from Emerald Green (> 3 mins) to Amber (1 - 3 mins) to Crimson Red (< 1 min).
  - Status indicator: "Hiệu lực trong 10 phút. Hết thời gian mã tự động hủy."
- Simulated Incoming Email Notification Banner:
  - Sliding toast at the top showing: "📬 [Email Server] Mã OTP của bạn là: [ 8 4 9 2 0 1 ] (Hiệu lực 10 phút)".
- 6-Digit Auto-Fill Box Component:
  - 6 individual square inputs with monospace font, rounded-2xl borders, active green halo focus.
  - Hands-Free Auto-Fill Feature: Automatically types each digit one by one (120ms interval) into the 6 boxes upon receiving the code without requiring manual keyboard typing.
  - Quick Action Button: "⚡ Tự động điền mã OTP (Auto-fill)" for instant 1-click filling.
  - Checkbox toggle: "Tự động điền khi nhận được OTP qua Email" (Checked by default).
- Action Buttons:
  - "Xác Nhận Mã OTP & Tiếp Tục" (Primary Emerald Green button with arrow icon).
  - "Gửi lại mã OTP" (Enabled after 60s cooldown).
  - "Quay lại đăng nhập" (Secondary link).
```

### Prompt 20: Responsive Multi-Device Synchronization (PC, Laptop, iPad, Mobile)
```text
Role: Frontend Engineer - Responsive UI/UX
Tool: Google Stitch
Task: Build the Multi-Device Responsive Layout System supporting PC, Laptop, iPad, and Mobile.

Responsive Specifications:
- Viewport Breakpoints:
  - Desktop / PC: >= 1280px (Full multi-column layout, extended tables, 3D Hero canvas with mouse follow).
  - Laptop: 1024px - 1279px (Optimized container padding, full horizontal navigation bar).
  - iPad / Tablet: 768px - 1023px (Adaptive 2-column grids, touch-friendly tap targets min 44px, touch gesture support for 3D logo).
  - Mobile Phones: < 768px (Fluid single-column stack, collapsible drawer, fixed bottom navigation dock).
- Components:
  - Responsive Header: Hamburger menu button on < 1024px triggering smooth animated slide-down Drawer with 3 Role selectors and device sync status badge ("Đồng bộ PC • Laptop • iPad • Mobile").
  - Mobile Bottom Dock: Sticky fixed navigation dock at screen bottom with 4 primary icons: "Trang chủ", "Sinh viên", "Tuyển dụng", "Quản trị" with thumb-friendly layout and safe-area padding.
  - Touch-Enabled 3D Canvas: Supports `touchstart` and `touchmove` events to spin the 3D Clock-P Logo smoothly with finger swipe on iPads and mobile phones.
```


### Prompt 21: Validation Matrix Engine, Contextual Recovery & Real-Time Action Banners
```text
Role: Full-Stack Security & UI/UX Engineer
Tool: Google Stitch
Task: Enforce the comprehensive Validation Matrix, Context-Specific Password Recovery, and Right-Aligned In-App Action Banner.

Specifications:
- Validation Matrix Engine:
  - Student Resumes (.pdf only, <= 10MB): Strict rejection of non-PDF or oversized files with red alerts and HTTP 400.
  - Business License / GPKD (.pdf only, <= 10MB): Mandatory upload during Employer registration, blocks non-PDF files with HTTP 400.
  - Employer Logo & Cover Image (.png, .jpg, .jpeg, <= 10MB): File format and size verification.
  - Chat Attachments (.pdf, .png, .jpg, <= 10MB): Intercepts executable (.exe, .bat) or compressed (.zip, .rar) files with chat warnings.
  - Email, Password & 30-Second OTP: Valid RFC 5322 email; Password >= 8 chars with uppercase, lowercase, number, special character; 6-digit OTP with exactly 30s TTL.
  - Cover Letter & Reviews: Cover Letter <= 5,000 chars; Reviews 1-5 stars & comment < 1,000 chars with live countdown counter and button locking.
- Contextual Password Recovery (ForgotPasswordScreen):
  - Dynamic Tabs for Student vs Employer (Admin is dedicated fixed access).
  - Student Recovery: Title "Khôi Phục Mật Khẩu Sinh Viên", grey placeholder "Sinhvien@gmail.com".
  - Employer Recovery: Title "Khôi Phục Mật Khẩu Doanh Nghiệp", grey placeholder "Nhatuyendung@gmail.com".
  - 30-Second Live Countdown: "00:30" monospace countdown timer.
  - Simulated Email Inbox Toast: Floating toast displaying sender "PARTIME.VN Security", recipient, real OTP received, and 1-click Auto-Fill.
- Right-Aligned In-App Action Notification Banner:
  - Docked directly beneath Header, aligned to the top-right corner.
  - 3 Semantics: 🟢 Green (Safe / Success), 🟡 Amber (Loading / In Progress), 🔴 Red (Warning / Error).
  - Dismissible via "X" button and automatically auto-dismisses after exactly 5 seconds (5000ms).
- Solid Opaque Header Popovers:
  - User Account Dropdown and Notifications Dropdown styled with 100% opaque solid background (#0a0f1d), eliminating transparency and ensuring maximum contrast.
```

---
*Tài liệu này được định dạng tương thích 100% với Google Stitch và các công cụ AI Canvas để dựng lại chuẩn xác toàn bộ hệ sinh thái giao diện của PARTIME.VN.*

