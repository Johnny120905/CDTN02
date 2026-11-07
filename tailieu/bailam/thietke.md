# TÀI LIỆU ĐẶC TẢ THIẾT KẾ GIAO DIỆN & TẬP HỢP PROMPT GOOGLE STITCH CHUẨN XÁC 100%
## NỀN TẢNG TUYỂN DỤNG PARTIME.VN - VIỆC LÀM LINH HOẠT CHO SINH VIÊN (CDTN02)
> **Phiên bản:** 3.0 - Chuẩn hóa Digital Light Dimension (Bảng màu 8 Cột Matrix Chống Mỏi Mắt) & Layered Clean Architecture  
> **Font chữ tiêu chuẩn:** `Be Vietnam Pro` (Google Fonts: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold, 900 Black)  
> **Nguyên tắc thiết kế tối thượng:** Phong cách ánh sáng số **Digital Light Dimension** dịu mắt, kết hợp điểm nhấn 3D Electric Blue / Deep Navy, biểu tượng Logo 3D WebGL GLTF (`/meshy-3d-logo.glb`) và **100% Vector Icon chuẩn từ thư viện Lucide React** (tuyệt đối không dùng emoji và icon AI vô nghĩa).  
> **CHỈ THỊ BẮT BUỘC KHI DÙNG PROMPT CHO AI (STRICT AI COMPLIANCE MANDATE):**  
> *Khi người dùng dán bất kỳ prompt nào trong tài liệu này vào Google Stitch hoặc các công cụ AI UI Generator, hệ thống AI **BẮT BUỘC PHẢI TÁI TẠO NGUYÊN BẢN 100%** theo đúng bố cục, ma trận 8 cột màu sắc HEX, font chữ, các trường nhập liệu, thành phần 3D WebGL GLTF, canvas Three.js và văn bản tiếng Việt đã được đặc tả; **TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý THÊM BỚT, TÓM TẮT, THAY THẾ HOẶC BIẾN TẤU NỘI DUNG VÀ MÀU SẮC** so với bản gốc.*

---

## MỤC LỤC BỘ PROMPT
1. [Hệ Thống Thiết Kế Chuẩn Digital Light Dimension (Bảng Màu 8 Cột Matrix)](#1-hệ-thống-thiết-kế-chuẩn-digital-light-dimension-bảng-màu-8-cột-matrix)
2. [Bộ Prompt Xác Thực Riêng Biệt Từng Role (9 Prompts)](#2-bộ-prompt-xác-thực-riêng-biệt-từng-role)
   - Prompt 01A: Đăng Nhập Sinh Viên (`StudentLoginScreen`)
   - Prompt 01B: Đăng Nhập Nhà Tuyển Dụng (`EmployerLoginScreen`)
   - Prompt 01C: Đăng Nhập Quản Trị Viên (`AdminLoginScreen`)
   - Prompt 02A: Đăng Ký Sinh Viên (`StudentRegisterScreen`)
   - Prompt 02B: Đăng Ký Nhà Tuyển Dụng - Kéo Thả GPKD & 24 Quận Huyện (`EmployerRegisterScreen`)
   - Prompt 02C: Khởi Tạo / Cổng Bảo Vệ Quản Trị Viên (`AdminRestrictedGateway`)
   - Prompt 03A: Quên Mật Khẩu Sinh Viên - OTP 10 Phút & Auto-Fill (`StudentForgotPasswordScreen`)
   - Prompt 03B: Quên Mật Khẩu Nhà Tuyển Dụng - OTP 10 Phút & Auto-Fill (`EmployerForgotPasswordScreen`)
   - Prompt 03C: Cổng Khôi Phục Bảo Mật Quản Trị Viên (`AdminSecurityRecoveryGateway`)
3. [Bộ Prompt Phân Hệ Sinh Viên - Vũ Thế Long (8 Prompts)](#3-bộ-prompt-phân-hệ-sinh-viên-vũ-thế-long)
   - Prompt 04: Tìm Kiếm & Lọc Việc Làm Đa Tiêu Chí (`JobList.jsx`)
   - Prompt 05: Xem Chi Tiết Việc Làm & Modal Ứng Tuyển Một Chạm (`JobDetailModal.jsx`)
   - Prompt 06: Quản Lý CV PDF Chuẩn Kiểm Định & Thư Giới Thiệu (`CVManager.jsx`)
   - Prompt 07: Quản Lý Hồ Sơ Cá Nhân Sinh Viên (`StudentProfile.jsx`)
   - Prompt 08: Theo Dõi Tiến Độ Ứng Tuyển 4 Chặng Rõ Ràng (`ApplicationTracker.jsx`)
   - Prompt 09: Đánh Giá & Nhận Xét Nhà Tuyển Dụng (`StudentReviewModal.jsx`)
   - Prompt 10: Phòng Nhắn Tin Realtime & Tự Động Lọc Từ Khóa Cấm (`StudentChat.jsx`)
   - Prompt 11: Phòng Gọi Video Phỏng Vấn Trực Tuyến WebRTC (`StudentVideoCall.jsx`)
4. [Bộ Prompt Phân Hệ Nhà Tuyển Dụng - Huỳnh Nguyễn Bảo Ngọc (9 Prompts)](#4-bộ-prompt-phân-hệ-nhà-tuyển-dụng-huỳnh-nguyễn-bảo-ngọc)
   - Prompt 12: Bảng Điều Khiển Tổng Quan Doanh Nghiệp (`EmployerDashboard.jsx`)
   - Prompt 13: Hồ Sơ Doanh Nghiệp & Kéo Thả GPKD (`CompanyProfile.jsx`)
   - Prompt 14: Studio Soạn Thảo & Đăng Tin Tuyển Dụng Part-time (`JobPostingStudio.jsx`)
   - Prompt 15: Quản Lý Danh Sách Tin Tuyển Dụng & Vòng Đời Việc Làm (`JobLifecycleManager.jsx`)
   - Prompt 16: Hệ Thống ATS Theo Dõi & Lọc Duyệt Ứng Viên (`CandidateATS.jsx`)
   - Prompt 17: Modal Lên Lịch Phỏng Vấn Trực Tuyến (`InterviewSchedulerModal.jsx`)
   - Prompt 18: Đánh Giá Năng Lực Sinh Viên 2 Chiều (`EmployerReview.jsx`)
   - Prompt 19: Phòng Nhắn Tin & Trao Đổi Ứng Viên Doanh Nghiệp (`EmployerChat.jsx`)
   - Prompt 20: Phòng Phỏng Vấn Video WebRTC Nhà Tuyển Dụng (`EmployerVideoCall.jsx`)
5. [Bộ Prompt Phân Hệ Quản Trị Viên - Lê Thị Thuỳ Ngân (7 Prompts)](#5-bộ-prompt-phân-hệ-quản-trị-viên-lê-thị-thuỳ-ngân)
   - Prompt 21: Command Center & Bảng Phân Tích Dữ Liệu (`AnalyticsDashboard.jsx`)
   - Prompt 22: Trung Tâm Quản Trị Người Dùng & Khóa Tài Khoản (`UserManagement.jsx`)
   - Prompt 23: Trung Tâm Thẩm Định Doanh Nghiệp & Duyệt GPKD (`BusinessVerificationDesk.jsx`)
   - Prompt 24: Kiểm Duyệt Tin Tuyển Dụng Toàn Sàn & Ẩn Tin Vi Phạm (`JobModeration.jsx`)
   - Prompt 25: Quản Trị Danh Mục Master Data Ngành Nghề (`CategoryManager.jsx`)
   - Prompt 26: Bàn Xử Lý Khiếu Nại & Báo Cáo Vi Phạm (`ReportsResolutionDesk.jsx`)
   - Prompt 27: Quản Trị Bộ Lọc Từ Khóa Cấm Realtime (`BannedKeywordsManager.jsx`)
6. [Bộ Prompt Giao Diện Dùng Chung Cao Cấp (4 Prompts)](#6-bộ-prompt-giao-diện-dùng-chung-cao-cấp)
   - Prompt 28: Hệ Thống Zero Native Dialogs: `<ConfirmDialog>` & Banner Trạng Thái 3 Màu
   - Prompt 29: Thanh Header & Dropdown Menu Nền Đặc Opaque 100%
   - Prompt 30: Trình Xem Tệp Tin PDF Chuẩn Kiểm Định `<DocumentViewerModal>`
   - Prompt 31: Đồng Bộ Đa Thiết Bị Responsive (PC, Laptop, iPad, Mobile)

---

## 1. HỆ THỐNG THIẾT KẾ CHUẨN DIGITAL LIGHT DIMENSION (BẢNG MÀU 8 CỘT MATRIX)

Hệ thống giao diện PARTIME.VN được xây dựng dựa trên nguyên lý quang học số 4D, cân bằng hoàn hảo giữa tính thẩm mỹ hiện đại và công thái học thị giác chống mỏi mắt (Anti-fatigue).

### Bảng Tổng Hợp Chi Tiết Tất Cả Mã Màu Từng Cột (8 Columns Matrix):

| Cột | Hạng Mục / Thành Phần | Màu Đỉnh (Top Hex) | Màu Giữa (Mid Hex) | Màu Đáy (Bottom Hex) | Tên Phối Thức / Hiệu Ứng | Công Thức CSS Linear-Gradient Chuẩn | Ứng Dụng Thực Tế & Vai Trò Giao Diện |
| :---: | :--- | :---: | :---: | :---: | :--- | :--- | :--- |
| **1** | **Background**<br>*(Nền Canvas Toàn Trang)* | `#FAF8FF`<br>*(Trắng ánh tím)* | `#F0F7FF`<br>*(Trắng băng)* | `#E2E7FF`<br>*(Xanh phấn dịu)* | **Pha Trắng Ánh Xanh** | `linear-gradient(135deg, #FAF8FF 0%, #F0F7FF 50%, #E2E7FF 100%)` | Nền tổng thể toàn bộ trang web; tạo cảm giác ánh sáng khuếch tán 4D mềm mại, chống mỏi mắt (Anti-fatigue). |
| **2** | **Section phụ / Card**<br>*(Khung Form & Thẻ)* | `#EFF6FF`<br>*(Xanh sương)* | `#E2E7FF`<br>*(Xanh phấn)* | `#DBE1FF`<br>*(Xanh kính mờ)* | **Pha Xanh Kính Mờ** | `linear-gradient(180deg, #EFF6FF 0%, #E2E7FF 55%, #DBE1FF 100%)` | Nền khung form nhập liệu, thẻ công việc (Job Card), kết hợp `backdrop-blur-md`. Tiêu đề bên trong luôn dùng chữ đen `#0F172A`. |
| **3** | **Heading**<br>*(Tiêu đề chính & Slogan)* | `#0F172A`<br>*(Đen mực sâu)* | `#1E3A8A`<br>*(Navy đậm)* | `#2563EB`<br>*(Electric Blue)* | **Đen Mực Pha Navy Ánh Kim** | `linear-gradient(90deg, #0F172A 0%, #1E3A8A 60%, #2563EB 100%)`<br>*(kèm bg-clip-text)* | • H1–H3 thông thường: Giữ đơn sắc `#0F172A` để dễ đọc.<br>• Slogan Hero / Banner 3D lớn: Dùng gradient ánh kim 3D sang trọng. |
| **4** | **Text**<br>*(Nội dung văn bản)* | `#1E293B`<br>*(Dòng chính)* | `#334155`<br>*(Mô tả JD / Phụ)* | `#475569`<br>*(Gợi ý / Metadata)* | **Xám Than Đậm (Solid Hierarchy)** | *Không dùng gradient cho chữ nhỏ (Dùng solid colors phân cấp 3 bậc)* | Phân tầng thị giác rõ nét theo thứ bậc: Dòng chính (`#1E293B`), mô tả chi tiết (`#334155`), nhãn phụ/timestamp (`#475569`). |
| **5** | **Button nền**<br>*(Nút bấm chính 3D)* | `#38BDF8`<br>*(Sky Cyan)* | `#2563EB`<br>*(Electric Blue)* | `#1D4ED8`<br>*(Deep Navy)* | **Pha Xanh Logo 3D** | `linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #1D4ED8 100%)` | Khớp 100% với màu khối mô hình Logo 3D (`meshy-3d-logo.glb`). Dùng cho các nút CTA then chốt: Đăng nhập, Nộp hồ sơ, Ứng tuyển. |
| **6** | **Button / Text hover**<br>*(Trạng thái tương tác)* | `#2563EB`<br>*(Electric Blue)* | `#1D4ED8`<br>*(Deep Navy)* | `#003EA8`<br>*(Navy nhấn sâu)* | **Pha Navy Nhấn Sâu** | `linear-gradient(135deg, #2563EB 0%, #1D4ED8 60%, #003EA8 100%)` | Kích hoạt khi rê chuột vào nút bấm, kết hợp bóng đổ phát quang `box-shadow: 0 8px 24px rgba(56, 189, 248, 0.45)`, tạo độ lún/nổi 3D. |
| **7** | **Chữ Button / Input**<br>*(Chữ nút & Ô nhập liệu)* | `#FFFFFF`<br>*(Trắng tinh khiết)* | `#FAF8FF`<br>*(Trắng ngọc)* | `#F8FAFC`<br>*(Trắng mờ nhẹ)* | **Trắng Tinh Khiết 100%** | `linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)` hoặc Solid `#FFFFFF` | • Chữ tương phản cao trên nền nút bấm màu đậm.<br>• Làm màu nền trắng tinh khiết cho ô Input, viền xám sáng `#CBD5E1`. |
| **8** | **Stroke / Viền & State**<br>*(Đường viền & Trạng thái)* | `#BFDBFE`<br>*(Viền kính mờ)* | `#93C5FD`<br>*(Viền nổi bật)* | `#E2E8F0`<br>*(Viền chia tách)* | **Khung Kính Định Hình** | `border: 1px solid #BFDBFE`<br>State: `#10B981`, `#F59E0B`, `#EF4444` | Phân cách thẻ Card, bảng biểu; 3 màu trạng thái: Xanh lục Thành công (`#10B981`), Vàng Cảnh báo (`#F59E0B`), Đỏ Nguy hiểm (`#EF4444`). |

### 4 Quy Tắc Thiết Kế Bắt Buộc (Core Design Mandates):
1. **Chuẩn Hóa 100% Vector Icon Lucide React:** Tuyệt đối không dùng emoji (☕, 🛒, 📚, 📦, 💻, 🎪, 🎉, ✓, ✕, 🟢, ⚪, 🟡, 🔴, ⏳, ⭐, 💡, 📞, ⚠️...) và không dùng các icon AI trang trí vô nghĩa (`<Sparkles />`, `<Zap />`, `<Coffee />`). Chỉ dùng các vector icon ngữ nghĩa chuẩn từ `lucide-react`.
2. **Tên Nút Bấm Không Chứa Từ Ngữ Chỉ Màu Sắc Thô:** Không đặt tên nút là "Phê duyệt (Xanh)", "Từ chối (Đỏ)", v.v. Chỉ cần đặt tên là "Phê duyệt" hoặc "Từ chối" với màu nền tương ứng để giao diện tinh tế, chuyên nghiệp.
3. **Cơ Chế Quay Lại Bằng Logo 3D:** Loại bỏ toàn bộ các nút bấm "Quay lại trang chủ" trong Admin Dashboard và các nút "Quay lại trang" trong các màn hình Đăng nhập / Đăng ký / Quên mật khẩu. Khi cần quay về trang chủ hoặc chế độ xem trước khách, người dùng chỉ cần nhấp chuột vào biểu tượng Logo 3D `PARTIME.VN`.
4. **Chế Độ Xem Trước Khách (Guest Preview Mode):** Khi người dùng chưa đăng nhập hoặc chưa tạo tài khoản, giao diện Sinh viên và Nhà tuyển dụng hoạt động ở chế độ xem trước an toàn: Không hiển thị số liệu cá nhân, không hiển thị thông tin doanh nghiệp chi tiết, chỉ hiển thị khung lưới mẫu (Skeleton Grid) và thông báo nhắc đăng nhập/đăng ký để mở khóa tài khoản toàn vẹn.

---

## 2. BỘ PROMPT XÁC THỰC RIÊNG BIỆT TỪNG ROLE

### Prompt 01A: Màn Hình Đăng Nhập Sinh Viên (StudentLoginScreen)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Student Identity
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the dedicated full-page Login Screen tailored specifically for College Students ("Sinh viên") in the Dark 4D Electric Blue theme.

Design System & Specifications:
- Overall Theme: Dark 4D Electric Blue (#030712 background, #0b1329 surface cards, #2563eb / #38bdf8 accents).
- Typography: Font "Be Vietnam Pro", sans-serif. High contrast white text (#FFFFFF) and slate-400 subtitles.
- Background Environment:
  - Three.js 4D Canvas: Deep space canvas (#030712) with 650 soft glowing circular stars twinkling at varying depths, ethereal blue wireframe 4D hyper-torus rings rotating smoothly, and a mouse-following spacetime gravitational wave.
- Layout Architecture:
  - Completely REMOVE the global Header and global Footer.
  - Centered Glassmorphism Card: max-w-md w-full mx-auto p-8 rounded-3xl bg-[#0b1329]/80 backdrop-blur-2xl border border-blue-500/30 shadow-2xl shadow-blue-950/80 relative z-10.
- Card Header:
  - Top Brand Logo: PARTIME.VN authentic 3D GLTF Logo emblem with glowing cyan border, bold title "PARTIME.VN" (white) and subtitle "Việc Làm Linh Hoạt" (#38bdf8).
  - Main Heading: "Đăng Nhập Sinh Viên" (text-2xl font-black text-white).
  - Subtitle: "Truy cập việc làm part-time linh hoạt, ca làm phù hợp lịch học".
- Role Indicator Pill (Pre-selected as Student):
  - Badge with graduation cap icon: "🎓 Phân hệ Sinh viên tìm việc" (bg-blue-600/30 border border-blue-500/50 text-blue-200 text-xs py-1.5 px-3 rounded-full inline-flex items-center gap-1.5 mb-4).
- Form Inputs & Interactive Rules:
  - All input fields are strictly EMPTY by default on initial visit.
  - Email Field: Input with Mail icon, placeholder "Nhập email sinh viên (vd: vuthelong@vlu.edu.vn)...", text-white bg-slate-950/60 border border-slate-700/60 rounded-xl px-4 py-3 focus:border-blue-500.
  - Password Field: Input with Lock icon, placeholder "Nhập mật khẩu (tối thiểu 8 ký tự)...", password show/hide eye toggle button (Eye/EyeOff icon).
  - Password Complexity Validator: Live check for >= 8 characters, uppercase, lowercase, number, special character.
  - Checkbox Row:
    - Left: "Ghi nhớ thông tin đăng nhập" checkbox. (When checked and login succeeds, credentials auto-save into localStorage).
    - Right: Link "Quên mật khẩu? (Nhận OTP)" navigating to StudentForgotPasswordScreen.
- Action Buttons:
  - Submit Button: Full-width "Đăng Nhập Sinh Viên" button with ArrowRight icon, bg-gradient-to-r from-blue-600 hover:from-blue-500 to-sky-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all.
  - Switch Role Shortcut: "Bạn là Nhà tuyển dụng? Đăng nhập tại đây" link.
- Bottom Navigation Link:
  - "Chưa có tài khoản sinh viên? Đăng ký ngay" link in bright cyan text navigating to StudentRegisterScreen.
- Sample Test Credentials Callout:
  - "Tài khoản mẫu: vuthelong@vlu.edu.vn / Long123!"
```

---

### Prompt 01B: Màn Hình Đăng Nhập Nhà Tuyển Dụng (EmployerLoginScreen)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Employer Identity
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the dedicated full-page Login Screen tailored specifically for Employers & Businesses ("Nhà tuyển dụng") in the Dark 4D Electric Blue theme.

Design System & Specifications:
- Overall Theme: Dark 4D Electric Blue (#030712 background, #0b1329 surface cards, #2563eb / #38bdf8 accents).
- Typography: Font "Be Vietnam Pro", sans-serif. High contrast white text (#FFFFFF) and slate-400 subtitles.
- Background Environment:
  - Three.js 4D Canvas: Deep space canvas (#030712) with 650 soft glowing circular stars, hyper-torus wireframe rings, and spacetime ripple waves.
- Layout Architecture:
  - Completely REMOVE the global Header and global Footer.
  - Centered Glassmorphism Card: max-w-md w-full mx-auto p-8 rounded-3xl bg-[#0b1329]/80 backdrop-blur-2xl border border-blue-500/30 shadow-2xl relative z-10.
- Card Header:
  - Top Brand Logo: PARTIME.VN 3D GLTF Logo emblem with glowing cyan border, bold title "PARTIME.VN", subtitle "Việc Làm Linh Hoạt".
  - Main Heading: "Đăng Nhập Nhà Tuyển Dụng" (text-2xl font-black text-white).
  - Subtitle: "Quản lý tuyển dụng, tiếp nhận hồ sơ sinh viên & phỏng vấn video".
- Role Indicator Pill (Pre-selected as Employer):
  - Badge with briefcase icon: "💼 Phân hệ Nhà tuyển dụng & Doanh nghiệp" (bg-cyan-600/30 border border-cyan-500/50 text-cyan-200 text-xs py-1.5 px-3 rounded-full inline-flex items-center gap-1.5 mb-4).
- Form Inputs & Interactive Rules:
  - All input fields are strictly EMPTY by default on initial visit.
  - Email Field: Input with Mail icon, placeholder "Nhập email doanh nghiệp (vd: huynhnguyenbaongoc2k5@gmail.com)...", text-white bg-slate-950/60 border border-slate-700/60 rounded-xl px-4 py-3 focus:border-cyan-500.
  - Password Field: Input with Lock icon, placeholder "Nhập mật khẩu doanh nghiệp...", password show/hide eye toggle button (Eye/EyeOff icon), min 8 characters.
  - Checkbox Row:
    - Left: "Ghi nhớ thông tin đăng nhập" checkbox.
    - Right: Link "Quên mật khẩu? (Nhận OTP)" navigating to EmployerForgotPasswordScreen.
- Action Buttons:
  - Submit Button: Full-width "Đăng Nhập Cổng Tuyển Dụng" button with ArrowRight icon, bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-600/30 transition-all.
  - Switch Role Shortcut: "Bạn là Sinh viên tìm việc? Đăng nhập tại đây" link.
- Bottom Navigation Link:
  - "Doanh nghiệp chưa có tài khoản? Đăng ký mở cổng tuyển dụng ngay" link in cyan text navigating to EmployerRegisterScreen.
- Sample Test Credentials Callout:
  - "Tài khoản mẫu: huynhnguyenbaongoc2k5@gmail.com / Huynh120905! (hoặc Ngoc123!)"
```

---

### Prompt 01C: Màn Hình Đăng Nhập Quản Trị Viên (AdminLoginScreen)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Security Engineer - Admin Gateway
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the dedicated secure Login Screen tailored specifically for System Administrators ("Quản trị viên") in the Dark 4D Electric Blue theme with strict access isolation.

Design System & Specifications:
- Overall Theme: Dark 4D Electric Blue (#030712 background, #0b1329 surface cards, #2563eb / #38bdf8 accents).
- Typography: Font "Be Vietnam Pro", sans-serif. High contrast white text (#FFFFFF).
- Background Environment:
  - Three.js 4D Canvas: Deep space canvas (#030712) with 650 soft glowing circular stars, cosmic fog, and ethereal blue wireframe rings.
- Layout Architecture:
  - Completely REMOVE the global Header and global Footer.
  - Centered Glassmorphism Card: max-w-md w-full mx-auto p-8 rounded-3xl bg-[#0b1329]/90 backdrop-blur-2xl border border-red-500/40 shadow-2xl shadow-red-950/50 relative z-10.
- Card Header:
  - Top Brand Logo: PARTIME.VN 3D GLTF Logo emblem with glowing red/blue border, bold title "PARTIME.VN", subtitle "Việc Làm Linh Hoạt".
  - Main Heading: "Đăng Nhập Quản Trị Viên" (text-2xl font-black text-white flex items-center justify-center gap-2).
  - Subtitle: "Cổng điều hành trung tâm, thẩm định GPKD và an toàn toàn sàn".
- Security Badge Callout:
  - High-security badge with ShieldAlert icon: "🛡️ Cổng Quản Trị Hệ Thống Bảo Mật Cao" (bg-red-950/60 border border-red-500/50 text-red-200 text-xs py-1.5 px-3 rounded-full inline-flex items-center gap-1.5 mb-4).
- Security Isolation Mandate (CRITICAL):
  - Link "Quên mật khẩu" is STRICTLY HIDDEN (no public OTP reset for admin).
  - Link "Đăng ký tài khoản" is STRICTLY HIDDEN (admin accounts cannot be publicly registered).
- Form Inputs & Interactive Rules:
  - All input fields are strictly EMPTY by default on initial visit.
  - Email Field: Input with Mail icon, placeholder "Nhập email quản trị (lethithuyngan985@gmail.com)...", text-white bg-slate-950/60 border border-slate-700/60 rounded-xl px-4 py-3 focus:border-red-500.
  - Password Field: Input with Lock icon, placeholder "Nhập mật khẩu quản trị...", password show/hide eye toggle button (Eye/EyeOff icon).
  - Checkbox Row:
    - "Ghi nhớ phiên làm việc an toàn" checkbox.
- Action Buttons:
  - Submit Button: Full-width "Xác Thực Quyền Quản Trị & Truy Cập" button with ShieldCheck icon, bg-gradient-to-r from-red-600 hover:from-red-500 to-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/30 transition-all.
  - Switch Role Shortcut: "← Quay lại Cổng Sinh viên / Nhà tuyển dụng" link.
- Fixed Admin Credentials Callout:
  - "Tài khoản quản trị cố định: lethithuyngan985@gmail.com / Le090805!"
```

---

### Prompt 02A: Màn Hình Đăng Ký Sinh Viên (StudentRegisterScreen)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Student Registration
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the dedicated full-page Registration Screen specifically for College Students ("Sinh viên tìm việc") enforcing 1 Email = 1 Role.

Design System & Specifications:
- Overall Theme: Dark 4D Electric Blue (#030712 canvas, #0b1329 surface cards, #2563eb / #38bdf8 accents). Font: "Be Vietnam Pro".
- Environment: Dark 4D Three.js cosmic stars canvas. Completely REMOVE Header and Footer.
- Container: Centered Glass card max-w-xl w-full mx-auto p-8 rounded-3xl bg-[#0b1329]/85 backdrop-blur-2xl border border-blue-500/30 shadow-2xl relative z-10.
- Top Bar: Back button "← Quay lại Đăng nhập Sinh viên" with arrow icon.
- Header: BrandLogo emblem, Headline "Đăng Ký Tài Khoản Sinh Viên", Subtitle "Bắt đầu tìm kiếm cơ hội việc làm linh hoạt và xây dựng hồ sơ chuyên nghiệp".
- System Constraint Banner (BR-AUTH-01):
  - Banner with ShieldCheck icon: "Ràng buộc hệ thống: 1 Email thực chỉ được dùng cho đúng 1 Role duy nhất (Sinh viên). Nếu email đã được đăng ký cho Nhà tuyển dụng, hệ thống sẽ từ chối đăng ký." (Border blue-500/40 bg-blue-950/40 text-blue-200 rounded-xl p-3.5 mb-5 text-sm).
- Form Fields (Specific to Sinh viên):
  1. Họ và tên sinh viên: Input with User icon, placeholder "Nhập họ và tên đầy đủ (vd: Vũ Thế Long)...".
  2. Số điện thoại: Input with Phone icon, placeholder "Số điện thoại di động (10 số, vd: 0901234567)...".
  3. Trường Đại học: Autocomplete dropdown with Vietnam Universities list (Đại học Văn Lang (VLU), Đại học Bách Khoa, Đại học Khoa học Tự nhiên, Đại học CNTT (UIT), Đại học Kinh tế (UEH)...).
  4. Mã số sinh viên (MSSV): Input with GraduationCap icon, placeholder "Mã số sinh viên (nếu có)...".
  5. Email thực tế: Input with Mail icon, placeholder "Email chính thức (vd: vuthelong@vlu.edu.vn)...".
  6. Mật khẩu & Nhập lại mật khẩu: 2 inputs with eye toggle buttons.
- Password Complexity Live Checklist (5 Criteria):
  - Box with 5 criteria updating in real-time as user types:
    1. [✓] Tối thiểu 8 ký tự
    2. [✓] Có ít nhất 1 chữ hoa (A-Z)
    3. [✓] Có ít nhất 1 chữ thường (a-z)
    4. [✓] Có ít nhất 1 chữ số (0-9)
    5. [✓] Có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)
  - Checks transition from grey to bright emerald green once fulfilled.
- Terms Checkbox: "Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật thông tin sinh viên của PARTIME.VN".
- Submit Button: Full-width "Tạo Tài Khoản Sinh Viên Ngay" button (bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30).
- Bottom Link: "Đã có tài khoản sinh viên? Đăng nhập ngay".
```

---

### Prompt 02B: Màn Hình Đăng Ký Nhà Tuyển Dụng - Kéo Thả GPKD & 24 Quận Huyện (EmployerRegisterScreen)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Employer Registration
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the dedicated full-page Registration Screen specifically for Employers ("Nhà tuyển dụng / Doanh nghiệp") featuring Drag-and-Drop Business License (GPKD) PDF Upload, 24 HCMC districts picker, and branch management.

Design System & Specifications:
- Overall Theme: Dark 4D Electric Blue (#030712 canvas, #0b1329 surface cards, #2563eb / #38bdf8 accents). Font: "Be Vietnam Pro".
- Environment: Dark 4D Three.js cosmic stars canvas. Completely REMOVE Header and Footer.
- Container: Centered Glass card max-w-2xl w-full mx-auto p-8 rounded-3xl bg-[#0b1329]/85 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl relative z-10.
- Top Bar: Back button "← Quay lại Đăng nhập Nhà tuyển dụng".
- Header: BrandLogo emblem, Headline "Đăng Ký Tài Khoản Nhà Tuyển Dụng", Subtitle "Mở cổng tuyển dụng sinh viên uy tín, thẩm định giấy phép kinh doanh minh bạch".
- System Constraint Banner (BR-AUTH-01 & BR-EMP-01):
  - Banner with Building icon: "Ràng buộc hệ thống: 1 Email thực chỉ được dùng cho đúng 1 Role duy nhất (Nhà tuyển dụng). Giấy phép kinh doanh (GPKD) bắt buộc định dạng PDF <= 10MB và được Quản trị viên duyệt trước khi đăng tin công khai." (Border cyan-500/40 bg-cyan-950/40 text-cyan-200 rounded-xl p-3.5 mb-5 text-sm).
- Form Fields (Specific to Nhà tuyển dụng):
  1. Tên Doanh nghiệp / Hộ kinh doanh: Input with Building icon, placeholder "Nhập tên công ty chính thức (vd: Công ty TNHH Cà Phê Partime Việt Nam)...".
  2. Mã số thuế (MST) / Số ĐKKD: Input with FileText icon, placeholder "Mã số thuế (10 hoặc 13 số)...".
  3. Khu vực hoạt động / Trụ sở chính: Dropdown tích hợp ĐẦY ĐỦ 24 Quận, Huyện và TP. Thủ Đức tại TP.HCM (Quận 1, Quận 3, Quận 5, Quận 7, Quận 10, Bình Thạnh, Phú Nhuận, Gò Vấp, Thủ Đức...).
  4. Địa chỉ chi tiết / Chi nhánh: Input with MapPin icon, placeholder "Số nhà, tên đường, tên chi nhánh tuyển dụng...".
  5. Người liên hệ tuyển dụng: Họ và tên người phụ trách nhân sự.
  6. Số điện thoại liên hệ: 10 chữ số nhà mạng Việt Nam.
  7. Email doanh nghiệp: Email chính thức nhận hồ sơ ứng viên.
  8. Khung Tải Lên Giấy Phép Kinh Doanh (GPKD) HỖ TRỢ KÉO THẢ (Drag & Drop):
     - Dotted border box: `border-2 border-dashed border-cyan-500/50 bg-slate-950/60 rounded-2xl p-6 text-center transition-all`.
     - Dragover active state: border-cyan-400 bg-cyan-950/30 scale-[1.01].
     - Icon: Upload icon glowing cyan.
     - Text: "Kéo thả tệp tin GPKD (.pdf) vào đây hoặc bấm để chọn tệp từ máy tính".
     - Strict format badge: "Chỉ chấp nhận file .pdf - Dung lượng tối đa 10MB theo chuẩn kiểm định".
     - File preview thumbnail: If file is selected/dropped, shows PDF icon, file name, size, and green checkmark.
  9. Mật khẩu & Xác nhận mật khẩu: 2 inputs with eye toggle buttons and 5-criteria live complexity checklist.
- Submit Button: Full-width "Xác Nhận Đăng Ký Cổng Tuyển Dụng" button (bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-600/30).
- Bottom Link: "Doanh nghiệp đã có tài khoản? Đăng nhập ngay".
```

---

### Prompt 02C: Khởi Tạo / Cổng Bảo Vệ Quản Trị Viên (AdminRestrictedGateway)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Security Engineer - Admin Platform
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the dedicated Admin Access Gateway explaining strict registration lockout and fixed credential provisioning.

Design System & Specifications:
- Overall Theme: Dark 4D Electric Blue (#030712 canvas, #0b1329 surface cards, #ef4444 red security alerts). Font: "Be Vietnam Pro".
- Environment: Dark 4D Three.js cosmic stars canvas. Completely REMOVE Header and Footer.
- Container: Centered Glass card max-w-lg w-full mx-auto p-8 rounded-3xl bg-[#0b1329]/90 backdrop-blur-2xl border border-red-500/50 shadow-2xl relative z-10 text-center.
- Icon: ShieldAlert glowing crimson red icon.
- Heading: "Cổng Quản Trị Viên - Khóa Đăng Ký Công Khai" (text-2xl font-black text-white mb-2).
- Security Notice Box:
  - "Theo quy chuẩn an toàn thông tin đồ án CDTN02, tài khoản Quản trị viên tối cao được khởi tạo cố định trong cơ sở dữ liệu MongoDB Atlas và KHÔNG CHO PHÉP đăng ký công khai qua giao diện web để ngăn chặn các cuộc tấn công leo thang đặc quyền (Privilege Escalation)."
- Admin Master Identity Details Box:
  - Email: lethithuyngan985@gmail.com
  - Phân quyền: Root Administrator (WBS 3.1 - 3.9)
  - Quyền hạn: Thẩm định GPKD, Kiểm duyệt tin tuyển dụng toàn sàn, Khóa tài khoản vi phạm, Quản trị từ cấm realtime.
- Action Button:
  - "Chuyển Đến Trang Đăng Nhập Quản Trị Viên" (Red/Blue gradient button with ArrowRight icon).
- Secondary Link: "Quay về Trang chủ PARTIME.VN".
```

---

### Prompt 03A: Quên Mật Khẩu Sinh Viên - OTP 10 Phút & Auto-Fill (StudentForgotPasswordScreen)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Student Account Recovery
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the dedicated Password Recovery Screen for College Students featuring a 10-Minute Countdown Timer (600s), Simulated Email Inbox Toast, and Hands-Free OTP Auto-Fill Engine.

Design System & Specifications:
- Overall Theme: Dark 4D Electric Blue (#030712 canvas, #0b1329 surface cards, #2563eb accents). Font: "Be Vietnam Pro".
- Environment: Dark 4D Three.js cosmic stars canvas. Completely REMOVE Header and Footer.
- Container: Centered Glass card max-w-lg w-full mx-auto p-8 rounded-3xl bg-[#0b1329]/85 backdrop-blur-2xl border border-blue-500/30 shadow-2xl relative z-10.
- Top Bar: Back button "← Quay lại Đăng nhập Sinh viên".
- Header: BrandLogo emblem, Headline "Khôi Phục Mật Khẩu Sinh Viên", Subtitle "Nhập email sinh viên để nhận mã xác thực OTP 6 số qua email".
- Step 1: Input Email to Request OTP:
  - Email Input: placeholder "Sinhvien@gmail.com (hoặc email VLU)...".
  - Button: "Gửi Mã Xác Thực OTP".
- Step 2: Live Verification with 10-Minute Countdown & Hands-Free Auto-Fill:
  - Big Monospace Countdown Clock: "10:00" counting down second-by-second (600s TTL) with progress bar changing colors (Green > 3m -> Amber 1-3m -> Red < 1m).
  - Simulated Email Inbox Toast Banner:
    - Appears at the top of the card: "📬 [Hộp thư đến] PARTIME.VN - Mã OTP của bạn là: [ 8 4 9 2 0 1 ] (Hiệu lực 10 phút)".
    - Prominent Button inside toast: "⚡ Tự động điền mã OTP (Hands-Free Auto-fill)".
  - 6 Individual Square OTP Input Boxes:
    - 6 large input boxes with monospace font, rounded-2xl, border-blue-500/40, active neon glow.
    - When user clicks "Tự động điền", each digit fills automatically one-by-one with a smooth typewriter animation (120ms interval).
  - New Password & Confirm New Password Fields:
    - Minimum 8 characters with eye show/hide toggle on both fields and live complexity checklist.
- Submit Button: "Xác Nhận & Đổi Mật Khẩu Sinh Viên" (Redirects back to StudentLoginScreen on success with green notification banner).
```

---

### Prompt 03B: Quên Mật Khẩu Nhà Tuyển Dụng - OTP 10 Phút & Auto-Fill (EmployerForgotPasswordScreen)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Employer Account Recovery
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the dedicated Password Recovery Screen for Employers featuring a 10-Minute Countdown Timer (600s), Simulated Email Inbox Toast, and Hands-Free OTP Auto-Fill Engine.

Design System & Specifications:
- Overall Theme: Dark 4D Electric Blue (#030712 canvas, #0b1329 surface cards, #06b6d4 / #38bdf8 accents). Font: "Be Vietnam Pro".
- Environment: Dark 4D Three.js cosmic stars canvas. Completely REMOVE Header and Footer.
- Container: Centered Glass card max-w-lg w-full mx-auto p-8 rounded-3xl bg-[#0b1329]/85 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl relative z-10.
- Top Bar: Back button "← Quay lại Đăng nhập Nhà tuyển dụng".
- Header: BrandLogo emblem, Headline "Khôi Phục Mật Khẩu Doanh Nghiệp", Subtitle "Nhập email doanh nghiệp để nhận mã xác thực OTP 6 số qua email".
- Step 1: Input Email to Request OTP:
  - Email Input: placeholder "Nhatuyendung@gmail.com (hoặc email công ty)...".
  - Button: "Gửi Mã Xác Thực OTP".
- Step 2: Live Verification with 10-Minute Countdown & Hands-Free Auto-Fill:
  - Big Monospace Countdown Clock: "10:00" counting down second-by-second (600s TTL).
  - Simulated Email Inbox Toast Banner:
    - "📬 [Hộp thư đến] PARTIME.VN - Mã OTP Doanh nghiệp: [ 6 1 8 3 9 2 ] (Hiệu lực 10 phút)".
    - Prominent Button inside toast: "⚡ Tự động điền mã OTP (Hands-Free Auto-fill)".
  - 6 Individual Square OTP Input Boxes with automatic filling typewriter animation.
  - New Password & Confirm New Password Fields (min 8 chars, eye toggles).
- Submit Button: "Xác Nhận & Đổi Mật Khẩu Doanh Nghiệp" (Redirects back to EmployerLoginScreen on success with green notification banner).
```

---

### Prompt 03C: Cổng Khôi Phục Bảo Mật Quản Trị Viên (AdminSecurityRecoveryGateway)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Security Engineer - Admin Recovery
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the dedicated Admin Password Recovery Restriction Gateway explaining internal reset protocols.

Design System & Specifications:
- Overall Theme: Dark 4D Electric Blue (#030712 canvas, #0b1329 surface cards, #ef4444 accents). Font: "Be Vietnam Pro".
- Environment: Dark 4D Three.js cosmic stars canvas. Completely REMOVE Header and Footer.
- Container: Centered Glass card max-w-lg w-full mx-auto p-8 rounded-3xl bg-[#0b1329]/90 backdrop-blur-2xl border border-red-500/50 shadow-2xl relative z-10 text-center.
- Icon: Lock glowing red icon.
- Heading: "Khôi Phục Mật Khẩu Quản Trị Viên Bị Khóa" (text-2xl font-black text-white mb-2).
- Security Notice:
  - "Tài khoản Quản trị viên hệ thống (`lethithuyngan985@gmail.com`) được bảo vệ nghiêm ngặt và không hỗ trợ khôi phục mật khẩu tự động qua mã OTP công khai nhằm bảo vệ tính toàn vẹn của hệ thống cơ sở dữ liệu CDTN02."
  - "Để đặt lại mật khẩu quản trị, vui lòng liên hệ trực tiếp Trưởng nhóm Vũ Thế Long hoặc Giảng viên hướng dẫn để thực thi quy trình reset mật khẩu trong console máy chủ."
- Action Buttons:
  - "Đăng Nhập Với Mật Khẩu Cố Định (Le090805!)" (Red/Blue button).
  - "Quay về Cổng Sinh Viên".
```

---

## 3. BỘ PROMPT PHÂN HỆ SINH VIÊN (VŨ THẾ LONG - WBS 1.1 ĐẾN 1.10)

### Prompt 04: Tìm Kiếm & Lọc Việc Làm Đa Tiêu Chí (JobList.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Student Platform (Vũ Thế Long)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Student Job Search & Multi-criteria Filtering Portal with 34 part-time categories, 24 HCMC districts, salary sliders, and interactive job cards.

Layout & Specs:
- Theme: Digital Light Dimension (Nền Canvas #FAF8FF -> #F0F7FF -> #E2E7FF, Card #EFF6FF -> #E2E7FF -> #DBE1FF, Chữ đen #0F172A).
- Top Search Bar:
  - Big floating search input with Lucide Search icon: "Tìm kiếm công việc, chức danh, kỹ năng part-time...".
  - Quick Suggestion Pills (Standard Lucide badges, strictly NO raw emojis): F&B / Pha Chế & Phục Vụ, Bán Lẻ / Cửa Hàng Tiện Lợi, Gia Sư / Trợ Giảng, Kho Vận / Soạn Hàng Ca, IT & Nhập Liệu Online, Sự Kiện & Thời Vụ.
- Left Sidebar Filters (25% width on desktop, drawer on mobile):
  - District Filter: Dropdown with all 24 HCMC districts & Thu Duc City (Quận 1, Quận 3, Quận 5, Quận 7, Quận 10, Bình Thạnh, Phú Nhuận, Gò Vấp, Thủ Đức...).
  - Category Filter: 34 part-time categories with checkboxes (F&B - Nhà hàng khách sạn, Bán lẻ - Cửa hàng tiện lợi, Gia sư - Giáo dục, Lập trình CNTT, Marketing - Sự kiện...).
  - Shift Filter: Ca sáng (07h-12h), Ca chiều (12h-17h), Ca tối (17h-22h), Ca linh hoạt theo lịch học.
  - Salary Filter: Buttons (< 25k/h, 25k - 35k/h, 35k - 50k/h, > 50k/h, Thỏa thuận).
  - Clear Filter button & "Áp dụng bộ lọc" button.
- Right Job Listing Feed (75% width):
  - Header: Total jobs counter (e.g. "86 việc làm part-time phù hợp"), Sort by: "Mới nhất", "Lương cao nhất", "Gần bạn nhất".
  - Job Card (Digital Light Dimension Glass Component):
    - Company Logo & Company Name with Lucide CheckCircle2 icon "GPKD đã xác thực".
    - Job Title in bold dark text #0F172A (hover text-blue-600).
    - Badge array: "Lương: 30.000đ - 35.000đ/giờ", "Ca 4 tiếng linh hoạt", "Quận 1", "Tuyển 5 bạn".
    - Bookmark Button: Lucide Heart icon toggling saved state instantly without page reload.
    - Quick Action: "Xem chi tiết" & "Ứng tuyển ngay" button (3D blue gradient).
```

---

### Prompt 05: Xem Chi Tiết Việc Làm & Modal Ứng Tuyển Một Chạm (JobDetailModal.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Student Platform (Vũ Thế Long)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Job Detail View and One-Click Application Modal with immutable snapshot notice and default resume selection.

Components:
- Theme: Dark 4D Electric Blue.
- Job Detail Modal / View:
  - Header Banner: Company cover image, Company logo, Title, Salary highlight badge, "Nộp hồ sơ ngay" sticky CTA button.
  - Left Content (70%):
    - Mô tả công việc chi tiết (Job Description).
    - Yêu cầu ứng viên (Kỹ năng, độ tuổi, tính chủ động, không yêu cầu kinh nghiệm).
    - Quyền lợi sinh viên (Lương thưởng theo giờ, tip, hỗ trợ dấu mộc thực tập, linh hoạt dời ca khi thi cử).
    - Thời gian ca làm việc & địa chỉ cụ thể tại 24 quận huyện TP.HCM.
  - Right Sidebar (30%):
    - Thông tin doanh nghiệp: Tên, quy mô nhân sự, địa chỉ, website, đánh giá sao trung bình (4.8/5 sao từ sinh viên).
    - Nút "Xem hồ sơ công ty" & "Chat trực tiếp với NTD".
- Application Sub-Modal (Triggered on click "Nộp hồ sơ ngay"):
  - Title: "Ứng tuyển: [Tên vị trí] tại [Tên công ty]"
  - Step 1: Chọn CV ứng tuyển (Dropdown danh sách CV PDF đã tải lên, có badge "CV Mặc định", nút "Xem trước CV" và nút "Tải lên CV mới").
  - Step 2: Chọn Thư giới thiệu (Cover Letter) mẫu hoặc viết nhanh lời nhắn gửi nhà tuyển dụng (tối đa 500 ký tự).
  - Snapshot Notice: "Hệ thống sẽ chụp bản sao hồ sơ tại thời điểm nộp để làm bằng chứng pháp lý bất biến."
  - Anti-Duplicate Notice: "Mỗi sinh viên chỉ được nộp 1 đơn cho công việc này."
  - Action Buttons: "Hủy bỏ" & "Xác nhận gửi hồ sơ ngay" (Emerald button).
```

---

### Prompt 06: Quản Lý CV PDF Chuẩn Kiểm Định & Thư Giới Thiệu (CVManager.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Student Platform (Vũ Thế Long)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Student CV & Cover Letter Management Studio with DocumentViewerModal preview, Drag-and-Drop, and single default CV enforcement.

Components:
- Theme: Dark 4D Electric Blue.
- Tab 1: "Hồ Sơ & CV Của Tôi":
  - Upload Box: Drag-and-drop zone accepting `.pdf` and `.docx` up to 10MB. Text: "Kéo thả CV định dạng PDF của bạn vào đây".
  - CV Counter Badge: "Đã lưu 3/5 bản CV tối đa".
  - CV Card Grid:
    - Card thumbnail representing PDF first page with red PDF badge.
    - File Name (e.g. `CV_VuTheLong_IT_Partime.pdf`), File Size (1.8MB), Upload Date.
    - Badge "🟢 CV Mặc Định" (Default CV) displayed on the active resume.
    - Action Buttons:
      - Button "Đặt làm mặc định" (Sets is_default = true and resets other CVs to false).
      - Button "Xem trước" (Opens DocumentViewerModal with full-screen PDF view and Download button).
      - Button "Xóa CV" (Triggers ConfirmDialog modal, never native browser confirm).
- Tab 2: "Thư Giới Thiệu (Cover Letters)":
  - List of saved cover letters.
  - Rich Textarea editor with 2,000 character limit counter and student template suggestions.
```

---

### Prompt 07: Quản Lý Hồ Sơ Cá Nhân Sinh Viên (StudentProfile.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Student Platform (Vũ Thế Long)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Student Profile Management Interface with avatar upload, university selector, skills tags, and contact info.

Components:
- Theme: Dark 4D Electric Blue.
- Avatar & Cover Banner Uploader: Circular avatar preview with edit button, instant upload.
- Personal Details Form:
  - Họ và tên (Full name).
  - Số điện thoại (10 số Việt Nam).
  - Email (read-only, showing 1-Email-1-Role bound status).
  - Trường Đại học (Dropdown: ĐH Văn Lang, ĐH Bách Khoa, ĐH Khoa học Tự nhiên...).
  - Chuyên ngành & Khóa học (Major & Year of study).
  - Mã số sinh viên (MSSV).
  - Giới thiệu bản thân (Bio text).
  - Kỹ năng & Thế mạnh (Interactive skill badges: Pha chế, Giao tiếp, Tiếng Anh, Word/Excel, Thiết kế Canva, Lập trình...).
- Save Changes Button: "Lưu Thay Đổi Hồ Sơ" with green success notification banner.
```

---

### Prompt 08: Theo Dõi Tiến Độ Ứng Tuyển 4 Chặng Rõ Ràng (ApplicationTracker.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Student Platform (Vũ Thế Long)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Student Application Tracker featuring a 4-Stage Horizontal Pipeline, Snapshot Inspector, and Clean Cancel Rule.

Components:
- Theme: Dark 4D Electric Blue.
- Filter Tabs: "Tất cả đơn (6)", "Chờ duyệt (2)", "Đã xem (1)", "Phỏng vấn (2)", "Trúng tuyển (1)".
- Application Card Item:
  - Header: Job Title, Company Name, Applied Date, Attached Resume link.
  - 4-Stage Horizontal Progress Timeline:
    - Step 1: `[1. Nộp hồ sơ]` (Icon Send, Green if completed).
    - Step 2: `[2. NTD đã xem]` (Icon Eye, Blue if viewed).
    - Step 3: `[3. Phỏng vấn]` (Icon Video/Calendar, Purple with interview timestamp note).
    - Step 4: `[4. Trúng tuyển / Từ chối]` (Icon CheckCircle2 Green or XCircle Red).
  - Snapshot Inspector Modal: "Xem bản chụp hồ sơ tại thời điểm nộp (Bất biến)".
  - Action Controls:
    - Button "Hủy đơn ứng tuyển": ONLY active when status is `pending`. When status is `interview` or `accepted`, button is disabled with tooltip "Không thể hủy khi hồ sơ đã vào vòng phỏng vấn".
    - Button "Nhắn tin với NTD" navigating directly to chat room.
    - Button "Đánh giá NTD" (Only enabled when status is `accepted`).
```

---

### Prompt 09: Đánh Giá & Nhận Xét Nhà Tuyển Dụng (StudentReviewModal.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Student Platform (Vũ Thế Long)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Student Review Modal for Employers after job acceptance with star ratings and criteria sliders.

Components:
- Theme: Dark 4D Electric Blue.
- Modal: "Đánh giá Nhà tuyển dụng: [Tên Doanh Nghiệp] - Vị trí: [Tên Công Việc]"
- Overall Rating: 1 to 5 Stars with hover glow animation.
- Criteria Sliders (1-5 stars):
  - Môi trường làm việc thân thiện sinh viên.
  - Trả lương đúng hẹn & minh bạch.
  - Linh hoạt hỗ trợ lịch thi cử tại trường.
- Comment Textarea: "Chia sẻ trải nghiệm làm việc thực tế của bạn tại đây (tối thiểu 10 ký tự)..."
- Submit Button: "Gửi Đánh Giá Minh Bạch" with success banner.
```

---

### Prompt 10: Phòng Nhắn Tin Realtime & Tự Động Lọc Từ Khóa Cấm (StudentChat.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Realtime & Media (Vũ Thế Long)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Realtime Messaging Room with Automatic Banned Keywords Filter (***) and WebRTC Video Call integration.

Layout:
- Theme: Dark 4D Electric Blue.
- Left Sidebar (Chat Threads): Search input, Company Avatar, Online green indicator, Last message preview, Timestamp.
- Right Chat Window:
  - Header: Company name, Context badge "Trao đổi vị trí: Phục vụ Ca Tối", Status "Đang hoạt động", Action buttons: Video Call (Camera icon), Voice Call (Phone icon).
  - Message Stream:
    - Incoming messages: Slate-800 bubble.
    - Outgoing messages: Blue-600 gradient bubble.
    - Banned Keywords Filter Engine: If message contains prohibited words ("đặt cọc", "thu phí", "chuyển tiền trước"), they are masked as `***` with a red warning note.
    - System Call Log Bubble: "🔴 Cuộc gọi nhỡ lúc 14:30" or "🟢 Cuộc gọi video đã kết thúc - Thời lượng 05:24".
  - Footer: File attachment paperclip (PDF/Image <= 10MB), Text input, Send button.
```

---

### Prompt 11: Phòng Gọi Video Phỏng Vấn Trực Tuyến WebRTC (StudentVideoCall.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Realtime & Media (Vũ Thế Long)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the WebRTC Video Interview Conference Room with dual video streams, 180s ring timeout, and call duration logger.

Layout:
- Theme: Dark 4D Electric Blue.
- Modal: Full-screen floating modal with dark backdrop.
- Video Area:
  - Remote Stream (Employer Video): Full-screen HD 1080p stream with company name overlay.
  - Local Stream (Student Video): Floating picture-in-picture stream in top-right corner.
- Status Bar: "Đang kết nối phỏng vấn trực tiếp - Mã hóa đầu cuối WebRTC". Call timer `mm:ss`.
- Controls Bar (Bottom Center):
  - Mic Mute / Unmute toggle button.
  - Camera On / Off toggle button.
  - Screen Share button.
  - End Call Button: Prominent red button ending call and auto-saving duration to chat.
```

---

## 4. BỘ PROMPT PHÂN HỆ NHÀ TUYỂN DỤNG (HUỲNH NGUYỄN BẢO NGỌC - WBS 2.1 ĐẾN 2.9)

### Prompt 12: Bảng Điều Khiển Tổng Quan Doanh Nghiệp (EmployerDashboard.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Employer Platform (Huỳnh Nguyễn Bảo Ngọc)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Employer Dashboard with KPI Metric Cards, Verification Status Banner, and Guest Preview Mode support.

Components:
- Theme: Digital Light Dimension (Canvas #FAF8FF -> #F0F7FF -> #E2E7FF, Cards #EFF6FF -> #E2E7FF -> #DBE1FF, Text #0F172A).
- Guest Preview Mode Mandate:
  - If user is NOT logged in (Chế độ khách): Do NOT display any private company data or live numbers. Show placeholder skeleton cards and a clear notice banner: "Chế độ khách - Chưa đăng nhập tài khoản. Đăng nhập hoặc đăng ký để quản trị tin tuyển dụng".
- Authenticated State Components:
  - Top Verification Banner:
    - If GPKD is `pending`: Amber banner (Lucide AlertCircle icon) "Hồ sơ GPKD đang chờ Quản trị viên phê duyệt. Bạn hiện chỉ có thể tạo tin ở dạng Bản nháp."
    - If GPKD is `approved`: Emerald badge (Lucide CheckCircle2 icon) "Doanh nghiệp đã xác thực GPKD chính thức".
  - 4 KPI Stat Cards:
    - "Tin đang tuyển dụng": 4 tin đang mở
    - "Hồ sơ mới nộp": 18 ứng viên (Badge "+6 hôm nay")
    - "Lịch phỏng vấn": 3 buổi tuần này
    - "Đánh giá uy tín": 4.8 / 5.0 (từ 32 sinh viên, Lucide Star icon)
  - Quick Action Button: "Đăng tin tuyển dụng mới (+)" (3D blue gradient glow button).
  - Active Jobs Management Table:
    - Columns: Tiêu đề công việc, Ngành nghề, Địa điểm (Quận), Lương/giờ, Số ứng viên đã nộp, Trạng thái (Đang mở / Đã đóng), Hành động (Xem ứng viên ATS, Sửa tin, Đóng tin).
```

---

### Prompt 13: Hồ Sơ Doanh Nghiệp & Kéo Thả GPKD (CompanyProfile.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Employer Platform (Huỳnh Nguyễn Bảo Ngọc)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Company Profile Studio with Drag-and-Drop GPKD upload, 24 HCMC districts branch list, and Guest Preview mode isolation.

Components:
- Theme: Digital Light Dimension.
- Guest Preview Mode Mandate:
  - When unauthenticated, header shows: "Hồ Sơ Doanh Nghiệp (Xem Trước) - Chế độ khách - Chưa đăng nhập tài khoản. Đăng nhập hoặc đăng ký tài khoản để cập nhật hồ sơ chính thức".
  - Form fields (Tên Doanh Nghiệp, Người Đại Diện Pháp Luật, Chi Nhánh Cửa Hàng, Địa Chỉ Tuyển Dụng, Giới Thiệu Doanh Nghiệp) remain empty placeholders with disabled state.
  - GPKD status displays: "Chế độ xem trước (Chưa liên kết tài khoản) - Tệp lưu trữ: Chưa đính kèm tệp".
- Authenticated State:
  - Cover Image & Company Logo Drag-and-Drop Box (Supports PNG, JPG <= 10MB).
  - Business License (GPKD) Card:
    - Status Indicator: Lucide CheckCircle2 "Đã phê duyệt" / Lucide Clock "Đang chờ duyệt" / Lucide XCircle "Bị từ chối (Kèm lý do phản hồi của Admin)".
    - Drag-and-Drop Upload Area: Accepts PDF and images up to 10MB.
    - Button "Xem lại GPKD đã tải lên" opening DocumentViewerModal.
  - Company Information Form:
    - Tên doanh nghiệp chính thức (3-200 ký tự).
    - Mã số thuế (MST) 10 hoặc 13 số.
    - Địa chỉ trụ sở chính: Dropdown chọn 24 Quận, Huyện TP.HCM + Địa chỉ cụ thể.
    - Danh sách chi nhánh tuyển dụng sinh viên.
    - Giới thiệu môi trường làm việc part-time thân thiện sinh viên.
```

---

### Prompt 14: Studio Soạn Thảo & Đăng Tin Tuyển Dụng Part-time (JobPostingStudio.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Employer Platform (Huỳnh Nguyễn Bảo Ngọc)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Job Creation Studio with Salary Integrity Validation (min <= max), Shift Configuration, and 24 HCMC districts picker.

Form Sections:
- Theme: Dark 4D Electric Blue.
- Section 1: Thông tin cơ bản:
  - Tiêu đề tin tuyển dụng (10 - 150 ký tự).
  - Ngành nghề: Dropdown 34 danh mục part-time chuẩn.
  - Khu vực làm việc: Dropdown 24 Quận/Huyện/Thủ Đức + Địa chỉ số nhà.
- Section 2: Mức lương & Ca làm việc (Bắt buộc kiểm tra logic):
  - Checkbox "Lương thỏa thuận".
  - Nếu không thỏa thuận: Input Mức lương tối thiểu (`salary_min`) & Mức lương tối đa (`salary_max`) theo giờ.
  - Salary Integrity Constraint: Red alert displays immediately if `salary_min > salary_max` with error: "Mức lương tối thiểu không được lớn hơn mức lương tối đa!"
  - Ca làm việc: Ca sáng (07h-12h), Ca chiều (12h-17h), Ca tối (17h-22h), Xoay ca linh hoạt.
  - Số lượng cần tuyển (1 - 500 sinh viên).
- Section 3: Mô tả công việc & Quyền lợi:
  - Mô tả công việc chi tiết (>= 50 ký tự).
  - Quyền lợi sinh viên: Thưởng doanh số, hỗ trợ ăn uống, bao ca, linh hoạt ngày thi cử.
  - Hạn nộp hồ sơ (Deadline in the future).
- Action Buttons: "Lưu bản nháp" vs "Xuất bản tin công khai" (Requires GPKD approval).
```

---

### Prompt 15: Quản Lý Danh Sách Tin Tuyển Dụng & Vòng Đời Việc Làm (JobLifecycleManager.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Employer Platform (Huỳnh Nguyễn Bảo Ngọc)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Job Lifecycle & Status Management Screen for Employers with Quick Toggle, Applicant Counts, and Safe Action Banners.

Components:
- Theme: Dark 4D Electric Blue.
- Top Action Bar: Search jobs by title, Filter by status: "Đang mở", "Tạm đóng", "Đã hết hạn", "Bản nháp".
- Jobs Grid & Table:
  - Job Title (hover text-sky-400).
  - Category Badge & Location (District).
  - Salary Badge (e.g. 25.000đ - 35.000đ/h).
  - Applicant Count Pill: `{applicant_count} hồ sơ` (with `whitespace-nowrap` to prevent awkward line breaks).
  - Status Toggle Switch: "Đang mở" vs "Tạm đóng".
  - Action Controls:
    - Button "Xem ứng viên ATS" navigating directly to CandidateATS.
    - Button "Chỉnh sửa tin".
    - Button "Đã nhận người" (Transitions status with polite confirmation, never frozen disabled button).
    - Button "Xóa tin" (Triggers ConfirmDialog modal).
```

---

### Prompt 16: Hệ Thống ATS Theo Dõi & Lọc Duyệt Ứng Viên (CandidateATS.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Employer Platform (Huỳnh Nguyễn Bảo Ngọc)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Candidate Applicant Tracking System (ATS) with 4-stage pipeline, candidate PDF CV preview, and interview scheduler.

Layout:
- Theme: Dark 4D Electric Blue.
- Top Job Filter: Dropdown selecting active job to filter applicants.
- Status Kanban Columns / Filter Tabs:
  1. `Chờ duyệt` (Pending)
  2. `Đã xem hồ sơ` (Reviewed)
  3. `Mời phỏng vấn` (Interview)
  4. `Trúng tuyển` (Accepted) & `Từ chối` (Rejected)
- Candidate Card:
  - Student Avatar, Name, University ("ĐH Văn Lang - Khóa K27").
  - Applied Date & Time.
  - Resume Button: Click to open full-screen DocumentViewerModal.
  - Action Dropdown:
    - "Đã xem hồ sơ" -> updates status to `reviewed`.
    - "Hẹn phỏng vấn" -> opens Interview Scheduler Modal.
    - "Chấp nhận tuyển dụng" -> updates status to `accepted`.
    - "Từ chối hồ sơ" -> opens Polite Rejection Modal with pre-written reasons.
```

---

### Prompt 17: Modal Lên Lịch Phỏng Vấn Trực Tuyến (InterviewSchedulerModal.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Employer Platform (Huỳnh Nguyễn Bảo Ngọc)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Interview Scheduling Modal for Candidates with WebRTC Video Call link generation and calendar picker.

Components:
- Theme: Dark 4D Electric Blue.
- Modal: "Lên lịch phỏng vấn ứng viên: [Tên Sinh Viên]"
- Form Fields:
  - Ngày phỏng vấn (Date picker in the future).
  - Giờ phỏng vấn (Time picker).
  - Hình thức phỏng vấn: "Phỏng vấn Video Call WebRTC trực tuyến" vs "Phỏng vấn trực tiếp tại cửa hàng".
  - Đường link phòng họp WebRTC tự động tạo.
  - Lời nhắn gửi sinh viên: "Gợi ý chuẩn bị CV in sẵn, trang phục lịch sự, kiểm tra webcam/micro...".
- Action Buttons: "Hủy bỏ" & "Gửi Lời Mời Phỏng Vấn" (Sends real-time notification to student).
```

---

### Prompt 18: Đánh Giá Năng Lực Sinh Viên 2 Chiều (EmployerReview.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Employer Platform (Huỳnh Nguyễn Bảo Ngọc)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Two-Way Student Performance Review Modal with Upsert anti-collision mechanism.

Components:
- Theme: Dark 4D Electric Blue.
- Modal: "Đánh giá sinh viên: [Tên Sinh Viên] - Vị trí: [Tên Công Việc]"
- Star Rating: 1 to 5 Stars with interactive hover effects.
- Evaluation Criteria:
  - Tính đúng giờ & Cam kết ca làm việc (1-5 sao).
  - Thái độ giao tiếp và tính chủ động (1-5 sao).
  - Hiệu quả công việc (1-5 sao).
- Comment Textarea: Nhận xét chi tiết (từ 10 đến 1.000 ký tự).
- Submit Button: "Lưu đánh giá" (Uses MongoDB Upsert logic to safely update existing reviews without DuplicateKeyError).
```

---

### Prompt 19: Phòng Nhắn Tin & Trao Đổi Ứng Viên Doanh Nghiệp (EmployerChat.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Employer Platform (Huỳnh Nguyễn Bảo Ngọc)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Employer Candidate Messaging Portal with fast candidate screening, document attachments, and WebRTC trigger.

Components:
- Theme: Dark 4D Electric Blue.
- Left Sidebar: List of applicant chat threads with applied job title badges.
- Main Chat Window:
  - Header: Student Name, University ("ĐH Văn Lang"), Applied Job, Video Call button.
  - Chat Stream: Messages with file attachment support (.pdf, .png, .jpg <= 10MB).
  - Prohibited Words Interceptor: Displays warning if sensitive keywords are detected.
  - Footer: File upload paperclip, text input, Send button.
```

---

### Prompt 20: Phòng Phỏng Vấn Video WebRTC Nhà Tuyển Dụng (EmployerVideoCall.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Employer Platform (Huỳnh Nguyễn Bảo Ngọc)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Employer Video Interview Studio with candidate evaluation notepad and WebRTC controls.

Components:
- Theme: Dark 4D Electric Blue.
- Split View Modal:
  - Left 70%: Full HD Video Call Stream with candidate video, candidate name overlay, and call controls bar (Mute mic, Camera off, Screen share, End call).
  - Right 30%: Quick Evaluation Notepad (Take real-time interview notes, score candidate 1-5 stars, quick accept/reject shortcut).
```

---

## 5. BỘ PROMPT PHÂN HỆ QUẢN TRỊ VIÊN (LÊ THỊ THUỲ NGÂN - WBS 3.1 ĐẾN 3.9)

### Prompt 21: Command Center & Bảng Phân Tích Dữ Liệu (AnalyticsDashboard.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Admin Platform (Lê Thị Thuỳ Ngân)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Admin Command Center Dashboard with Streamlined 2-Column Year-Month Filter, Date Range Picker, System KPI Cards, and Visual Growth Charts.

Components & Architecture:
- Theme: Digital Light Dimension (Canvas #FAF8FF -> #F0F7FF -> #E2E7FF, Cards #EFF6FF -> #E2E7FF -> #DBE1FF, Text #0F172A).
- Time Filter Architecture (MANDATORY 2-COLUMN STRUCTURE):
  - Row 1: 2 symmetric dropdown columns
    - Column 1: "1. Chọn Năm" (Options: "Năm 2024", "Năm 2025", "Năm 2026").
    - Column 2: "2. Chọn Tháng (trong năm đã chọn)" (Options: "Tháng 1 / [Năm]" to "Tháng 12 / [Năm]").
  - Row 2: Date range picker
    - "Từ ngày: [dd/mm/yyyy]" and "Đến ngày: [dd/mm/yyyy]" (Native date inputs for exact interval inspection).
  - Explicit UI exclusions:
    - Strictly REMOVE any intermediate dropdown selector ("Từ ngày ... đến ngày ... Theo tuần / khoảng ngày").
    - Strictly REMOVE quick-week shortcut buttons ("Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4").
    - Strictly REMOVE "Quay lại trang chủ" button (Navigation handled by clicking PARTIME.VN 3D Logo).
- Data Strategy & Integrity Rules:
  - Years 2024 & 2025: Historical normalized dataset (loaded via historicalAnalyticsData.js).
  - Year 2026: Strictly 100% live database sync from MongoDB Atlas (users, jobs, applications); zero simulated or fake metrics.
- Top Stat Metric Cards:
  - Card 1: "1. TỔNG SỐ SINH VIÊN" (Dynamic live counter, e.g. 580, "+15.2% so với tháng trước").
  - Card 2: "2. TỔNG DOANH NGHIỆP" (Dynamic counter, e.g. 46, "100% Xác thực GPKD").
  - Card 3: "3. TIN TUYỂN DỤNG" (Dynamic counter, e.g. 120, "110 tin đang hiển thị").
  - Card 4: "4. ĐƠN ỨNG TUYỂN" (Dynamic counter, e.g. 590, "Tỷ lệ duyệt đơn 94.2%").
- Visual Charts Section:
  - Chart 1 (Weekly Bar Chart): "TỐC ĐỘ PHÁT TRIỂN VIỆC LÀM & ỨNG TUYỂN QUA 4 TUẦN" (Tuần 1, Tuần 2, Tuần 3, Tuần 4) with vibrant blue 3D gradients and smooth hover tooltip.
  - Chart 2 (Monthly Trend Line Chart): Growth trend across months with fixed container height (min-h-[280px]) preventing any screen jitter/shake on hover.
  - Chart 3 (Industry Distribution Donut/Pie Chart): Categorical breakdown with high-contrast black text #0F172A on white tooltip when hovered (never turning into illegible white text).
- Standardized Lucide Icons:
  - Zero raw emojis and zero AI decorative icons; strictly vector icons from lucide-react (Users, Building2, Briefcase, FileText, Calendar, Filter, Download).
- Quick Action:
  - Button "Xuất báo cáo tổng kết (Excel / CSV)" for faculty graduation audit.
```

---

### Prompt 22: Trung Tâm Quản Trị Người Dùng & Khóa Tài Khoản (UserManagement.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Admin Platform (Lê Thị Thuỳ Ngân)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the User Moderation Table with Role Isolation, Ban/Unban Modal with mandatory reason.

Components:
- Theme: Dark 4D Electric Blue.
- Filter Tabs: "Tất cả người dùng", "Sinh viên (Student)", "Nhà tuyển dụng (Employer)".
- Search Bar: Search by Name, Email, Phone, University or Company.
- Table Columns:
  - User Name & Avatar.
  - Email (RFC 5322 format).
  - Role Badge (Student pill blue / Employer pill purple).
  - GPKD status (for Employers: Pending / Approved / Rejected).
  - Trạng thái: "🟢 Hoạt động" / "🔴 Bị khóa".
  - Actions:
    - Button "Khóa tài khoản": Opens Ban Modal requiring Admin to enter `ban_reason` (10-500 characters). Lock cannot be performed without a reason.
    - Button "Mở khóa": Restores account status to active.
    - Button "Duyệt GPKD" (For employers): View license in DocumentViewerModal and approve/reject.
```

---

### Prompt 23: Trung Tâm Thẩm Định Doanh Nghiệp & Duyệt GPKD (BusinessVerificationDesk.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Admin Platform (Lê Thị Thuỳ Ngân)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Business License Verification Desk with DocumentViewerModal and Approval Workflow.

Components:
- Theme: Dark 4D Electric Blue.
- Filter Bar: "Chờ duyệt (Pending)", "Đã duyệt (Approved)", "Đã từ chối (Rejected)".
- Business List Table:
  - Company Name, Tax ID (MST), Representative Name, Submitted Date.
  - License Document Button: Opens DocumentViewerModal showing embedded PDF license.
  - Actions:
    - Button "Phê duyệt GPKD" (Green button): Sets `approval_status = 'approved'`, grants job posting rights.
    - Button "Từ chối GPKD" (Red button): Opens Rejection Modal requiring Admin to state clear reasons (e.g. "Ảnh mờ, MST không khớp").
```

---

### Prompt 24: Kiểm Duyệt Tin Tuyển Dụng Toàn Sàn & Ẩn Tin Vi Phạm (JobModeration.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Admin Platform (Lê Thị Thuỳ Ngân)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Job Moderation Center with Hide/Restore Toggle and Data Preservation Assurance.

Components:
- Theme: Dark 4D Electric Blue.
- Filter Bar: Category dropdown, District dropdown, Status: "Đang hiển thị" / "Đã bị ẩn bởi Admin".
- Table Columns:
  - Tiêu đề tin tuyển dụng & Tên công ty đăng tin.
  - Lương theo giờ & Địa điểm làm việc.
  - Số đơn ứng tuyển đã nộp.
  - Số lượt báo cáo vi phạm từ người dùng.
  - Trạng thái kiểm duyệt: "🟢 Công khai" / "🔴 Đã ẩn (Vi phạm)".
  - Action Controls:
    - Button "Ẩn tin": Opens Hide Modal requiring reason (Đa cấp, thu phí phỏng vấn, lừa đảo). When hidden, job disappears from Student view immediately, but all records remain in DB for audit.
    - Button "Khôi phục tin": Restores job to public search.
```

---

### Prompt 25: Quản Trị Danh Mục Master Data Ngành Nghề (CategoryManager.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Admin Platform (Lê Thị Thuỳ Ngân)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Master Data Category Management Screen enforcing Restrict Hard-Delete constraint.

Components:
- Theme: Dark 4D Electric Blue.
- Action Bar: Button "Thêm danh mục mới (+)".
- Categories Table:
  - Mã định danh (Slug/Code).
  - Tên ngành nghề tiếng Việt (F&B Pha chế, Bán lẻ, Gia sư, CNTT...).
  - Số tin việc làm đang tham chiếu (`job_count`).
  - Trạng thái hoạt động (`is_active` toggle).
  - Action Buttons:
    - Button "Sửa tên danh mục".
    - Button "Xóa danh mục": If `job_count > 0`, system intercepts with warning: "Không thể xóa cứng danh mục đang có tin tuyển dụng tham chiếu! Bạn chỉ có thể chuyển sang trạng thái Ẩn."
```

---

### Prompt 26: Bàn Xử Lý Khiếu Nại & Báo Cáo Vi Phạm (ReportsResolutionDesk.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Admin Platform (Lê Thị Thuỳ Ngân)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the User Violation Report Investigation & Action Center.

Components:
- Theme: Dark 4D Electric Blue.
- Filter by Report Type: "Tin tuyển dụng vi phạm", "Hội thoại quấy rối / lừa đảo", "Hồ sơ giả mạo".
- Filter by Status: "Chờ xử lý (Mới)", "Đang điều tra", "Đã xử lý", "Đã bác bỏ".
- Report Card Item:
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
```

---

### Prompt 27: Quản Trị Bộ Lọc Từ Khóa Cấm Realtime (BannedKeywordsManager.jsx)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Admin Platform (Lê Thị Thuỳ Ngân)
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Realtime Banned Keywords Management Table with Live Delete and Word Cloud.

Components:
- Theme: Dark 4D Electric Blue.
- Add Keyword Bar:
  - Input: "Nhập từ khóa cấm mới (e.g. nạp tiền telegram, cọc trước, hoa hồng ảo)..."
  - Button: "Thêm từ khóa cấm (+)".
- Active Banned Keywords Grid & Table:
  - Table of active prohibited words: Keyword, Added By (Admin), Hit Count in chat, Created At.
  - Red Delete Button for each keyword: Clicking instantly removes the keyword from MongoDB Atlas and updates the live chat interceptor engine without page reload.
```

---

## 6. BỘ PROMPT GIAO DIỆN DÙNG CHUNG CAO CẤP

### Prompt 28: Hệ Thống Zero Native Dialogs: `<ConfirmDialog>` & Banner Trạng Thái 3 Màu
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Frontend Architect - Interaction & UX Systems
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Zero Native Browser Dialogs System replacing 100% of window.alert/confirm with Modal ConfirmDialog and In-App Action Banners.

Components:
- Theme: Dark 4D Electric Blue.
- 1. Modal Component `<ConfirmDialog>`:
  - High-end 4D Modal overlay with backdrop blur: `backdrop-blur-md bg-black/85 fixed inset-0 z-[99999]`.
  - Dialog Card: max-w-md bg-[#0b1329] border border-blue-500/40 rounded-3xl p-6 shadow-2xl.
  - Warning Icon in glowing red or amber halo.
  - Title: "Xác nhận hành động nguy hiểm".
  - Message: Clearly explaining the consequence (e.g. "Bạn có chắc chắn muốn xóa bản CV này? Thao tác này không thể hoàn tác.").
  - Action Buttons: "Hủy bỏ" (Slate button) & "Xác nhận xóa" (Red/Emerald button).
- 2. In-App Notification Banner Component:
  - Docked directly beneath the Header on the top-right corner.
  - Auto-dismisses after 5,000ms (5 seconds) or when clicking "X".
  - 3 Semantic Variations:
    - 🟢 Green: `bg-emerald-950/90 border border-emerald-500 text-emerald-100` (Success: "Cập nhật hồ sơ thành công!").
    - 🟡 Amber: `bg-amber-950/90 border border-amber-500 text-amber-100` (Loading: "Đang xử lý dữ liệu...").
    - 🔴 Red: `bg-red-950/90 border border-red-500 text-red-100` (Error: "Lỗi: Không thể thực hiện thao tác!").
```

---

### Prompt 29: Thanh Header & Dropdown Menu Nền Đặc Opaque 100%
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Shared Components
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Solid Opaque Header Dropdown System eliminating all transparency issues.

Components:
- Theme: Dark 4D Electric Blue.
- Header Bar:
  - Left: Authentic 3D GLTF Brand Logo (Click always navigates to Home).
  - Right: User Name + Company Name (if Employer) + Role Badge + Active Status Dot (`🟢 Đang hoạt động`) + Notification Bell + Avatar Dropdown.
- Dropdown Popover:
  - Must be 100% solid opaque background: `bg-[#090f20]` / `bg-[#0b1329]`, `opacity: 1`, `z-[9999]`.
  - Crisp neon border: `border border-blue-500/40`.
  - Completely ELIMINATES transparency so text never sinks into background page content.
  - Menu Items: "Cập nhật hồ sơ cá nhân", "Đổi mật khẩu", "Hủy tài khoản" (Red), "Đăng xuất".
```

---

### Prompt 30: Trình Xem Tệp Tin PDF Chuẩn Kiểm Định `<DocumentViewerModal>`
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Frontend Engineer - Document Systems
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Standards-Compliant PDF Document Viewer Modal for Student Resumes and Business Licenses.

Components:
- Theme: Dark 4D Electric Blue.
- Full-Screen Floating Modal: `fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col p-4`.
- Header:
  - Document Title & Badge (e.g. "📄 Giấy Phép Kinh Doanh - Công Ty Cà Phê Partime (PDF 2.4MB)").
  - Download Button: "Tải về máy tính" with Download icon.
  - Zoom In / Zoom Out controls.
  - Close button ("✕").
- Main Body: Embedded responsive iframe or Canvas rendering real PDF byte data.
```

---

### Prompt 31: Đồng Bộ Đa Thiết Bị Responsive (PC, Laptop, iPad, Mobile)
```text
STRICT AI COMPLIANCE MANDATE:
Do NOT alter, omit, summarize, or improvise any layout, label, color code, or behavior. Recreate the EXACT interface 100% as specified below.

Role: Senior Responsive UI/UX Architect
Tool: Google Stitch / Modern AI Web Canvas
Task: Generate the Multi-Device Responsive System across PC, Laptop, iPad, and Mobile breakpoints.

Breakpoints & Adaptations:
- Desktop & PC (>= 1280px): Extended sidebar, full tables, interactive 3D Three.js mouse-following canvas.
- Laptop (1024px - 1279px): Compact padding, responsive data tables with horizontal scroll.
- iPad / Tablet (768px - 1023px): Sidebar converts to smooth slide-out Drawer; 3D Logo supports touch gestures (`touchstart`, `touchmove`).
- Mobile Phones (< 768px):
  - Sidebar hidden.
  - Sticky Mobile Bottom Navigation Dock at the bottom of the screen with thumb-friendly tap targets:
    - 1. "Trang chủ"
    - 2. "Việc làm"
    - 3. "Đã nộp"
    - 4. "Tài khoản"
  - Form inputs expand to 100% width, eliminating horizontal overflow.
```

---
*Tài liệu này được biên soạn với độ chuẩn xác tuyệt đối 100% theo mã nguồn thực tế của dự án PARTIME.VN (CDTN02). Khi dán vào Google Stitch hoặc các công cụ AI, hệ thống AI bắt buộc phải tuân thủ nghiêm ngặt mọi chỉ dẫn để tái tạo giao diện nguyên bản không sai lệch.*
