# THIẾT KẾ GIAO DIỆN & BỘ PROMPT GOOGLE STITCH WIREFRAMES (100% ĐỒNG BỘ MÃ NGUỒN JSX)

> **Hệ thống:** Nền tảng Tuyển dụng Việc làm Part-time theo ca cho Sinh viên — **PARTIME.VN (`CDTN02`)**  
> **Đối chiếu 100% từ:** `frontend/index.html`, `frontend/tailwind.config.js`, `frontend/src/index.css`, `frontend/src/App.jsx`, `frontend/src/shared/*`, `frontend/src/features/auth/*`, `frontend/src/features/student/StudentPortal.jsx`, `frontend/src/features/employer/EmployerPortal.jsx`, `frontend/src/features/admin/AdminPortal.jsx`.  
> **Nguyên tắc biên soạn:** Toàn bộ tên component, nhãn nút, tiêu đề cột bảng, placeholder, màu sắc và cấu trúc màn hình đều **khớp nguyên bản với giao diện thực tế đang vận hành trên Render (`https://parttime-css0.onrender.com`)**; không sử dụng emoji trên giao diện người dùng (chỉ dùng **Lucide React Icons**).

---

## PHẦN 0: KIỂM KÊ KIẾN TRÚC UI THỰC TẾ & QUY CHUẨN DESIGN SYSTEM

### 0.1. Phân vùng Routing & File Giao diện Đang Vận Hành (`App.jsx`)
| Phân hệ | Đường dẫn / Cổng | File JSX thực thi chính | Chế độ mặc định tab mới |
|---|---|---|---|
| **Sinh viên** | `/`, `/student`, port `3001` | `StudentPortal.jsx`, `LoginScreen.jsx`, `RegisterScreen.jsx`, `ForgotPasswordScreen.jsx` | Mở ở **Chế độ Khách (`isGuestMode=true`)** trên `StudentPortal`. |
| **Nhà tuyển dụng** | `/employer`, `/recruiter`, port `3002` | `EmployerPortal.jsx`, `LoginScreen.jsx`, `RegisterScreen.jsx`, `ForgotPasswordScreen.jsx` | Mở ở **Chế độ Khách (`isGuestMode=true`)** trên `EmployerPortal`. |
| **Quản trị viên** | `/admin`, port `3003` | `AdminLoginScreen.jsx`, `AdminPortal.jsx` | Bắt buộc vào **`AdminLoginScreen`** (không có Chế độ Khách). |
| **Dùng chung** | Cả 3 Portal | `Header.jsx`, `Footer.jsx`, `AccountModal.jsx`, `ConfirmDialog.jsx`, `DocumentViewerModal.jsx`, `CallMediaLayer.jsx`, `BannedKeywordWarning.jsx`, `PaginationBar.jsx`, `BrandLogo.jsx`, `SearchableDropdownInput.jsx`, `MediaAvatar.jsx`, `MeshyLogo3D.jsx`. | Cô lập khóa token & `sessionStorage` theo tab. |

> **Lưu ý phân biệt mã nguồn dự phòng (Unused Files):** Các tệp `PublicLandingPage.jsx`, `HeroLanding.jsx`, `AuthModal.jsx`, `Web3DBackground.jsx` tồn tại trong cây thư mục nhưng **không được import/mount trong `App.jsx`** ở phiên bản Production hiện tại và không dùng để sinh wireframe vận hành chính thức.

### 0.2. Hệ Thống Màu Sắc 8 Cột **Digital Light Dimension** (`index.css` & `tailwind.config.js`)
| Cột | Vai trò Design System | Mã CSS / Hex Thực tế | Lớp CSS / Ứng dụng thực tế |
|---:|---|---|---|
| **Cột 1** | Nền trang Auth Canvas | `#FAF8FF` → `#F0F7FF` → `#E2E7FF` | `.bg-canvas-dimension` (`135deg`), nền Portal trong sử dụng `bg-[#F8FAFC]`. |
| **Cột 2** | Form & Card Section | `#EFF6FF` → `#E2E7FF` → `#DBE1FF` | `.form-card-col2` (`180deg`), nổi bật form đăng tin / lọc tìm kiếm. |
| **Cột 3** | Tiêu đề & Heading | `#0F172A`, `#1E3A8A`, `#2563EB` | Gradient tiêu đề nổi bật, kết hợp `text-slate-900` sắc nét. |
| **Cột 4** | Nội dung chữ chính | `#1E293B`, `#334155`, `#475569` | Độ tương phản cao nền sáng, chống mỏi mắt khi dùng lâu. |
| **Cột 5** | Nút CTA 3D chính | `#38BDF8` → `#2563EB` → `#1D4ED8` | `.btn-primary-dimension` / `.btn-cta-col5`. |
| **Cột 6** | Trạng thái Hover CTA | `#2563EB` → `#1D4ED8` → `#003EA8` | Đổ bóng `0 8px 24px -2px rgba(56, 189, 248, 0.45)`. |
| **Cột 7** | Nền Input & Chữ nút | `#FFFFFF`, `#FAF8FF`, `#F8FAFC` | `.input-col7` nền trắng sáng, viền `border-slate-200`. |
| **Cột 8** | Accent, Rim Light & State | Accent: `#7BD0FF`, `#38BDF8`, `#2563EB` (`--col8-accent-*`)<br>States: `#10B981` (Success), `#F59E0B` (Warning), `#EF4444` (Danger), `#DC2626` (`.btn-danger-dimension`) | Đường viền kính `.glass-card-dimension` (`rgba(255,255,255,0.92)`), `.glass-header-dimension` (`rgba(255,255,255,0.94)`). |

* **Thành phần nền tối có chủ đích (Exceptions):** Trong toàn bộ app đang chạy, chỉ có **4 vị trí** giữ nền tối để tạo điểm nhấn tương phản: `<ConfirmDialog />` (`#0b1329`, `border-2 border-blue-500/60`, `z-[9999]`), hộp thoại cuộc gọi đến (`#0a0f1d`), khung vuông 3D `<MeshyLogo3D />` (`bg-slate-950/80`) trong `<BrandLogo />`, và vùng stage/thanh nổi WebRTC `<CallMediaLayer />` (`bg-slate-900/95`).
* **Typography & Chuẩn Responsive:** Font **`Be Vietnam Pro`** (load Google Font các trọng số `300–800`), cỡ chữ gốc `16px`, `.text-xs` và `.text-sm` được chuẩn hóa lên `0.875rem` (`14px`), input `>= 16px` trên mobile chống zoom iOS. Responsive chuẩn **4 màn hình**: `Mobile 430x932`, `iPad 820x1180`, `Laptop 1366x768`, `PC 1920x1080`.

---

## GLOBAL DESIGN SYSTEM PROMPT (DÙNG CHUNG CHO GOOGLE STITCH)

```text
Design System & Aesthetic Rules for PARTIME.VN (Web Application):
- Visual Style: "Digital Light Dimension" — clean, bright, high-contrast academic & SaaS light UI.
- Background Canvas: Auth pages use soft pastel gradient (#FAF8FF -> #F0F7FF -> #E2E7FF); authenticated portals use crisp cool off-white (#F8FAFC) with translucent white glass surfaces (.glass-card-dimension: rgba(255,255,255,0.92), border #E2E8F0) and pastel blue form sections (#EFF6FF -> #DBE1FF).
- Primary Action Color: Linear gradient (#38BDF8 -> #2563EB -> #1D4ED8) with white bold text and soft blue glow shadow. Danger actions use #DC2626.
- Typography: 'Be Vietnam Pro' font family, 16px base, 14px minimum for labels/badges/table cells, sentence-case Vietnamese capitalization, strict single-line buttons (no text wrapping or vertical character breaks).
- Iconography: Crisp stroke-based Lucide icons ONLY. Strictly ZERO emojis anywhere in the UI.
- Navigation Pattern: Top sticky glass Header (h-20) + Collapsible Left Sidebar (10 menu items with count badges) + Main Content Panel + 3-column White Footer. On mobile (<768px), sidebar becomes a left slide-in drawer toggled by Header Menu icon (no sticky bottom navigation bar).
- Interactive Standards: Positive/Save/Approve buttons ALWAYS placed left of Cancel/Reject/Delete buttons. Native browser alerts forbidden; destructive confirmations use dark navy modal ConfirmDialog (#0b1329, blue rim light).
- Strict Anti-Hallucination Directive (QUY TẮC BẮT BUỘC KHÔNG THÊM BỚT TÍNH NĂNG):
  1. TUYỆT ĐỐI CHỈ thiết kế chính xác theo đúng các thành phần, nhãn, nút bấm, bảng dữ liệu và trường nhập liệu được đặc tả chi tiết trong từng prompt dưới đây.
  2. TUYỆT ĐỐI KHÔNG tự ý thêm các tính năng bên ngoài chưa có trong mã nguồn như: cổng thanh toán trực tuyến/ví tiền ảo, giỏ hàng thương mại điện tử, bảng xếp hạng game hóa/huy hiệu kim cương, mạng xã hội chia sẻ công khai hay đa ngôn ngữ.
  3. TUYỆT ĐỐI KHÔNG tự ý bớt các trường dữ liệu bắt buộc (như MST 10/13 số, tải GPKD PDF, bộ đếm ngược OTP 60 giây, kiểm tra magic bytes %PDF, chấm công ca tuần Thứ 2 - Chủ Nhật, phân trang 10/20/50/Tất cả, và thanh cảnh báo từ khóa cấm đỏ trực tiếp).
  4. Đảm bảo mọi giao diện tái tạo khớp 100% bản website hiện tại đang vận hành trên mã nguồn JSX thực tế.
```

---

## PHẦN 1: SHARED SHELL, HEADER, FOOTER & DIALOGS (6 PROMPTS)

### Prompt S-01: Header Navigation & Role States (`Header.jsx`)
```text
Create a high-fidelity Web UI wireframe for the sticky top Header (height 80px, white translucent background rgba(255,255,255,0.94), bottom border slate-200) of PARTIME.VN across 3 roles:
- Left Zone: Mobile hamburger menu icon (visible on <768px) + BrandLogo (dark rounded square containing mini 3D PARTIME icon, bold text "PARTIME.VN", sublabel "Việc Làm Linh Hoạt").
- Center Zone (Student Portal only, hidden on mobile): Rounded search input bar with MagnifyingGlass icon, placeholder "Tìm nhanh việc làm, chức danh, kỹ năng...", clear X button when non-empty.
- Right Zone (Horizontal single-row controls, zero wrapping):
  - If Employer: "Đăng tin mới" primary gradient pill button (Plus icon) + Chat Drawer icon button + Notification Bell icon button (with red/blue unread counter badge) + User block (Company Name & Representative Name + live status badge: green "Đang hoạt động" / amber "Tạm dừng" / red "Ngưng hoạt động") + Avatar Dropdown.
  - If Student: Chat Drawer icon button + Notification Bell icon + User info block + Avatar Dropdown.
  - If Admin: ShieldCheck badge pill "Quản trị viên hệ thống" + Notification Bell icon + Admin info block + Avatar Dropdown (no Chat Drawer icon).
  - If Guest (Student/Employer unauthenticated): "Đăng nhập" outline button + "Đăng ký sinh viên" (or "Đăng ký doanh nghiệp") primary gradient button.
- Include optional top slim alert ribbon above Header for Employer only when GPKD is pending (amber-50 banner) or rejected (red-50 banner).
- Use Lucide icons only, no emojis.
```

### Prompt S-02: Header Popovers — Notification Bell, Account Dropdown & Delete Confirm (`Header.jsx`)
```text
Design two crisp white elevated popover dropdowns (bg-white, rounded-2xl, shadow-2xl, border slate-200) triggered from Header + one danger confirmation dialog:
1. Notification Bell Dropdown: Header "Thông báo hệ thống" + "{N} chưa đọc" pill badge (NO "Mark all read" button); scrollable list of notification cards where hovering marks a row read and each row has a small X delete icon; empty state "Chưa có thông báo mới nào."; footer hint "Rê chuột vào để tự động đánh dấu đã đọc • Nhấp X để xóa".
2. User Avatar Account Dropdown (White surface, NOT dark): Top summary card (Name, Email, Role badge), menu items: "Cập nhật tài khoản cá nhân & đổi mật khẩu" (Settings icon), "Hủy tài khoản" (Trash2 icon, red text — HIDDEN for Admin role), and "Đăng xuất" (LogOut icon).
3. Cancel Account Confirmation Modal (white card border rose-200): Title "Xác nhận hủy tài khoản", warning text explaining permanent deactivation and application anonymization, two horizontal buttons left-to-right: "Không, giữ lại tài khoản" (slate outline) and "Xác nhận hủy tài khoản" (solid red #DC2626).
```

### Prompt S-03: Account & Security Modal (`AccountModal.jsx`)
```text
Wireframe the Account & Security Modal ("Tài khoản & bảo mật", max-w-lg rounded-3xl white glass modal over blurred backdrop):
- Subtitle: "Quản lý hồ sơ cá nhân, trạng thái hoạt động và mật khẩu bảo mật", top-right X close button.
- Pill tab switcher (bg-slate-100 rounded-2xl): "Thông tin tài khoản" (active blue-600 pill) | "Đổi mật khẩu".
- Tab 1 ("Thông tin tài khoản"):
  - Disabled gray input "Địa chỉ Email (Cố định)" with lock/mail icon.
  - Read-only card "Trạng thái tài khoản" showing green pulse pill "Đang hoạt động" (or "Tạm dừng"/"Ngưng hoạt động").
  - If Role = Student: editable inputs "Họ và tên sinh viên *", "Số điện thoại liên hệ", "Trường Đại học / Cao đẳng", "Địa chỉ cư trú (ưu tiên việc làm gần bạn)", primary submit button "Lưu thay đổi thông tin".
  - If Role = Employer: 2-column row "Tên Doanh nghiệp / Công ty *" & "Chi nhánh / Đơn vị", "Họ và tên Người đại diện tuyển dụng *", "Số điện thoại liên hệ", "Địa chỉ trụ sở chính", primary submit button "Lưu thay đổi thông tin".
  - If Role = Admin: read-only blue info box "Hồ sơ quản trị viên hệ thống" with badge "Quản trị cấp cao", Admin ID code box ("ADM_SUPER_2026"), Admin Name ("Lê Thị Thuỳ Ngân"), and note redirecting to tab "Đổi Mật Khẩu" (NO edit fields, NO delete account button).
- Tab 2 ("Đổi mật khẩu"): 3 password inputs with Eye/EyeOff toggle ("Mật khẩu hiện tại *", "Mật khẩu mới (tối thiểu 8 ký tự) *", "Xác nhận lại mật khẩu mới *"), live 5-criterion validation checklist (≥8 chars, uppercase, lowercase, digit, special char turning green as met), primary submit button "Cập nhật mật khẩu mới".
```

### Prompt S-04: Global 3-Column White Footer & Safety Handbook (`Footer.jsx`)
```text
Wireframe the PARTIME.VN global Footer (clean white background, top border slate-200, max-w-7xl container, 3 equal columns):
- Column 1: BrandLogo ("PARTIME.VN") + short mission paragraph describing flexible part-time job matching for Vietnamese students.
- Column 2 (Dynamic by Role):
  - Student ("Dành Cho Sinh Viên"): bullet links "Khám phá việc làm part-time theo ca học", "Quản lý kho CV PDF chuẩn", "Theo dõi tiến độ hồ sơ & lịch phỏng vấn", and clickable button "Cẩm nang phỏng vấn & tìm việc làm an toàn" (triggers <ConfirmDialog /> titled "Cẩm Nang Tìm Việc An Toàn" with action button "Đã Hiểu").
  - Employer ("Dành Cho Nhà Tuyển Dụng"): "Đăng tin tuyển dụng part-time theo ca (60s)", "Phễu ứng viên chuẩn hóa ATS Kanban", "Thẩm định Giấy phép kinh doanh (GPKD)", "Phỏng vấn trực tuyến video WebRTC".
  - Admin ("Phân Hệ Quản Trị Hệ Thống"): "Trung tâm chỉ huy (Analytics Dashboard)", "Bàn thẩm định GPKD & Mã số thuế 10/13 số", "Kiểm duyệt từ khoá cấm & Quét chat tự động", "Quản trị danh mục Master Data (63 Tỉnh/Thành)".
- Column 3 ("Đường Dây Nóng Hỗ Trợ"): Phone/Mail rows: "Tổng đài hỗ trợ sinh viên: 1900 8888", "Thẩm định DN & Kỹ thuật: 028 7300 8888", "Hòm thư giải quyết tố cáo: partime.support@gmail.com".
- Bottom Copyright Bar: "© 2026 PARTIME.VN - Nền Tảng Tuyển Dụng Sinh Viên Part-time & Thời Vụ. All rights reserved.".
```

### Prompt S-05: Shared Utility Components — DocumentViewerModal, ConfirmDialog, Banner, BannedKeywordWarning & PaginationBar
```text
Create a component specification sheet showing 5 shared UI overlays/widgets used across PARTIME.VN:
1. DocumentViewerModal (White modal bg-white/95 rounded-3xl): Header showing file icon + document title + green pill "PDF chuẩn" + blue "Tải về" button + X close button (NO zoom in/out buttons); body rendering full-width <iframe> PDF preview (min-h-[560px]) or <img>; footer "PARTIME.VN Hệ thống xác thực tài liệu" + "Đóng" button.
2. ConfirmDialog (Signature dark navy exception #0b1329, rounded-3xl, 2px glowing blue border border-blue-500/60): Clean icon badge, bold white title "Xác Nhận Thao Tác", slate-300 body copy, bottom row with primary "Xác Nhận" button on the LEFT and muted "Hủy Bỏ" button on the RIGHT.
3. App Toast Banner (`renderBanner` fixed top-right below Header): Compact rounded-2xl card in 4 light pastel variants with Lucide icons: Success (emerald-50), Warning/Loading (amber-50, spinning RefreshCw), Info (blue-50), Error (red-50) + X close button.
4. BannedKeywordWarning (Inline alert box role="alert"): Amber pastel box flagging forbidden keywords in real time: title "Cảnh báo: Phát hiện từ khóa bị cấm/nhạy cảm trong {contextLabel}!" + list of matched phrases.
5. PaginationBar: Clean white horizontal bar showing "Số mục mỗi trang:" + <select> ("10 mục/trang", "20 mục/trang", "50 mục/trang", "Tất cả (N)") + "(Tổng: N mục)" + "Trang X / Y" + "Trang trước" and "Trang sau" buttons.
```

### Prompt S-06: Active WebRTC Floating Bar (`CallMediaLayer.jsx`) & ErrorBoundary (`App.jsx`)
```text
Design 2 safety & communication overlays:
1. CallMediaLayer Floating Call Pill (fixed bottom-center, dark slate-900/95 pill border slate-700 shadow-2xl rounded-full px-5 py-2.5): Left pulsed green dot + caller/partner name + call timer badge ("Đang đổ chuông..." or "02:14"), icon buttons for Mic/MicOff toggle, Camera/CameraOff toggle (when video call), MessageSquare ("Mở khung cuộc gọi" to jump back to chat room), and circular red rotated-Phone Hang-Up button.
2. ErrorBoundary Recovery Card (centered on #FAF8FF light canvas): Friendly AlertTriangle badge, heading "Đã xảy ra sự cố hiển thị", two horizontal CTA buttons "Tải lại trang" and "Đặt lại phiên & Về Trang Chủ", plus collapsible accordion "Xem chi tiết lỗi kỹ thuật".
```

---

## PHẦN 2: LUỒNG XÁC THỰC — AUTHENTICATION SCREENS (5 PROMPTS)

### Prompt A-01: Cổng Đăng nhập Sinh viên & Nhà tuyển dụng (`LoginScreen.jsx`)
```text
Wireframe LoginScreen.jsx on Digital Light Dimension full-screen gradient background (#FAF8FF -> #F0F7FF -> #E2E7FF) with NO Header and NO Footer:
- Top Center: Clickable <BrandLogo size="lg" /> (returns user to Guest Mode).
- Center Card (max-w-md glass-card-dimension bg-white/95 rounded-3xl p-8 sm:p-10 shadow-2xl border-slate-200):
  - Role pill badge locked by route: GraduationCap "Cổng sinh viên" OR Briefcase "Cổng nhà tuyển dụng" (NO role switcher tabs when locked, NO demo credentials cheat-box, NO emojis).
  - Heading: "Đăng nhập sinh viên" (or "Đăng nhập nhà tuyển dụng") + 1-line subtitle.
  - Email input with label "Địa chỉ Email tài khoản" + "Bắt buộc" hint, placeholder "Sinhvien@gmail.com" (or "Nhatuyendung@gmail.com"), Mail icon (enforces @gmail.com).
  - Password input with label "Mật khẩu", link button "Quên mật khẩu?" on right, placeholder "••••••••", Eye/EyeOff toggle button.
  - Checkbox row: "Ghi nhớ đăng nhập" checked styling.
  - Full-width primary 3D gradient CTA button: "Đăng nhập" + ArrowRight icon.
  - Card footer link: "Chưa có tài khoản? Đăng ký tài khoản Sinh viên ngay" (or "Doanh nghiệp ngay").
  - Bottom caption: "© 2026 PARTIME.VN • Nền tảng việc làm bán thời gian sinh viên".
```

### Prompt A-02: Cổng Đăng nhập Quản trị viên Tách biệt (`AdminLoginScreen.jsx`)
```text
Wireframe AdminLoginScreen.jsx on Digital Light Dimension light pastel background (NO Header, NO Footer, standalone /admin route):
- Top Center: Clickable <BrandLogo size="lg" />.
- Center Glass Card (rounded-3xl bg-white/95 border-slate-200 shadow-2xl p-8 sm:p-10):
  - Indigo/Blue ShieldCheck pill badge: "CỔNG QUẢN TRỊ VIÊN HỆ THỐNG".
  - Heading (28px bold slate-900): "Đăng nhập quản trị viên".
  - Subtitle: "Phân hệ dành riêng cho ban quản trị kiểm duyệt hồ sơ GPKD, tin tuyển dụng và từ khóa cấm."
  - Form inputs: Email input (`placeholder="Quantrivien@gmail.com"`), Password input (`placeholder="••••••••"` with Eye/EyeOff toggle), checkbox "Ghi nhớ đăng nhập Quản trị viên".
  - Full-width CTA button: "Đăng nhập trung tâm chỉ huy" + ArrowRight icon.
  - Security footer strip with KeyRound/Server icon: "PARTIME.VN Admin Portal • Bảo mật mã hóa phiên 256-bit AES".
  - CRITICAL CONSTRAINTS: Strictly NO "Đăng ký" link, NO "Quên mật khẩu?" link, and NO demo account fill hints.
```

### Prompt A-03: Đăng ký Sinh viên — 2 Bước OTP 60 Giây (`RegisterScreen.jsx` Role=Student)
```text
Wireframe RegisterScreen.jsx configured for Student Registration (NO Header, NO Footer, light Digital Light Dimension canvas):
- Center Glass Card (max-w-xl bg-white/95 rounded-3xl p-8 shadow-2xl):
  - STEP 1 (Form Info): Badge "Đăng ký sinh viên", Heading "Tạo tài khoản sinh viên".
    - Inputs: "Họ và tên sinh viên *", "Địa chỉ Email tài khoản (Nhận OTP) *" (@gmail.com enforced), "Số điện thoại liên hệ (10 chữ số) *" (maxLength 10), "Trường Đại Học / Cao Đẳng *" (regular text input), "Địa Chỉ Cư Trú (Quận/Huyện, Tỉnh/Thành phố) *" (regular text input, placeholder "Ví dụ: Quận 1, TP. Hồ Chí Minh hoặc Cầu Giấy, Hà Nội"). NOTE: NO Student ID / MSSV field.
    - "Mật khẩu *" & "Xác nhận mật khẩu *" + compact 4-item inline visual checklist ("Tối thiểu 8 ký tự", "Chữ hoa (A-Z)", "Chữ thường (a-z)", "Ký tự đặc biệt (@#$...)").
    - Terms checkbox: "Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của PARTIME.VN."
    - Submit CTA: "Tiếp Tục Xác Thực Email (Nhận Mã OTP)".
  - STEP 2 (Real Gmail OTP 60s): Badge "Bước 2: xác thực Email bảo mật", Heading "Xác thực mã OTP qua Email".
    - 6 single-digit square numeric input boxes for MANUAL entry (strictly NO Auto-Fill button, NO toast popup showing code).
    - Live red/amber countdown badge: 60s timer ("01:00" -> "00:00"), "Quay lại sửa thông tin" button, "Gửi lại sau (Ns)" / "Gửi lại mã OTP" button.
    - Primary Submit button: "Xác nhận & hoàn tất đăng ký".
    - Card bottom: "Đã có tài khoản? Đăng nhập ngay".
```

### Prompt A-04: Đăng ký Doanh nghiệp Kèm MST & GPKD PDF — 2 Bước OTP 60 Giây (`RegisterScreen.jsx` Role=Employer)
```text
Wireframe RegisterScreen.jsx configured for Employer Registration (same Digital Light Dimension light canvas, NO Header/Footer):
- STEP 1 Card: Badge "Đăng ký doanh nghiệp", Heading "Tạo tài khoản doanh nghiệp".
  - Form inputs: "Họ tên người đại diện pháp lý / Tuyển dụng *", "Địa chỉ Email tài khoản (Nhận OTP) *", "Số điện thoại liên hệ (10 chữ số) *", "Tên Doanh Nghiệp / Thương Hiệu Chuỗi *" ("Công ty TNHH Cà phê & Trà Việt Nam"), "Chi Nhánh Tuyển Dụng" ("Chi nhánh Quận 1"), "Mã Số Thuế (10 hoặc 13 số) *" ("0123456789"), "Địa chỉ trụ sở / điểm làm việc *" (text input, "42 Ngô Đức Kế, Phường Bến Nghé, Quận 1, TP.HCM").
  - Drag & Drop Upload Zone: "Đính kèm tệp Giấy Phép Kinh Doanh (.pdf ≤ 10MB) *" (dashed blue border dropzone accepting .pdf ONLY <= 10MB; rejects images/docx).
  - Password + Confirm Password + 4-item visual checklist + Terms checkbox + Submit "Tiếp Tục Xác Thực Email (Nhận Mã OTP)".
- STEP 2 Card: Identical 60-second countdown (01:00), 6 manual digit inputs, "Quay lại sửa thông tin", "Gửi lại mã OTP", and "Xác nhận & hoàn tất đăng ký" creating Employer in GPKD Pending status.
```

### Prompt A-05: Khôi Phục Mật Khẩu 3 Bước OTP 60 Giây (`ForgotPasswordScreen.jsx`)
```text
Wireframe ForgotPasswordScreen.jsx on Digital Light Dimension light canvas (shared for Student & Employer; blocks Admin emails):
- Center Glass Card (rounded-3xl bg-white/95 max-w-md p-8 shadow-2xl):
  - Heading "Khôi Phục Mật Khẩu" + horizontal 3-step indicator: "1. Nhập Email" -> "2. Nhập OTP" -> "3. Mật Khẩu Mới".
  - Step 1 View: "Email đã đăng ký" input (@gmail.com) + Primary CTA "Nhận mã OTP (60 giây)".
  - Step 2 View: Email summary + 60-second countdown timer (`01:00`) + 6 manual OTP digit boxes + "Đổi email khác" button, "Gửi lại mã OTP" button, and CTA "Xác nhận mã OTP" (NO auto-fill button).
  - Step 3 View: "Mật khẩu mới (Tối thiểu 8 ký tự)" + "Xác nhận mật khẩu mới" inputs with Eye toggles + Primary CTA "Lưu Mật Khẩu Mới".
```

---

## PHẦN 3: ROLE 1 — SINH VIÊN PORTAL (`StudentPortal.jsx` — 12 PROMPTS)

> **Cấu trúc khung Portal Sinh viên:** Nền trang `bg-[#F8FAFC]`, `<Header />` sticky ở trên, `<aside>` Sidebar trái nền trắng (`Cổng sinh viên`, thu gọn được) gồm **đúng 10 mục** xếp từ trên xuống: `Trang chủ`, `Khám phá việc làm` (badge count), `Việc làm đã lưu`, `Tiến độ ứng tuyển`, `Lịch ca làm đã nhận`, `Quản lý CV`, `Hồ sơ cá nhân`, `Doanh nghiệp chờ đánh giá`, `Báo cáo vi phạm đã gửi`, `Tin nhắn & phỏng vấn`.

### Prompt SV-01: Trang chủ Chế độ Khách & Đã đăng nhập (`StudentPortal.jsx` View=`home`)
```text
Wireframe View 1 ("Trang chủ") inside StudentPortal shell (Header + 10-item Left Sidebar + Main Content + Footer):
- Hero Banner Card (rounded-3xl gradient from-blue-600 via-indigo-600 to-sky-600 white text p-6 sm:p-10):
  - Search Bar Row: Text input `placeholder="Vị trí tuyển dụng"` + Select dropdown `"Tất cả địa điểm"` (63 Provinces/Cities) + CTA Button `"Tìm việc"`.
  - If Logged-In: two quick CTA buttons beneath search bar: `"Khám phá việc làm ngay"` and `"Xem tiến độ đơn (N)"`.
- Stats & Category Area (depends on Guest vs Authenticated):
  - If Guest Mode: 3 trust cards (`Xác minh doanh nghiệp`, `Cam kết bảo vệ`, `Thời gian biểu`) + 6 clickable hot category chips with Lucide icons (`Coffee`, `ShoppingCart`, `GraduationCap`, `Package`, `Laptop`, `PartyPopper`).
  - If Logged-In Student: **6 KPI Metric Cards** in responsive grid: `Việc làm đang tuyển`, `Hồ sơ đã nộp`, `Kho hồ sơ CV`, `Tổng giờ công part-time`, `Thu nhập dự kiến`, `Tỷ lệ duyệt đơn`.
- Below: Section `"Việc làm part-time nổi bật dành cho bạn"` with `"Xem tất cả"` link, 3-column grid showing up to 6 job cards (each card shows verified badge, title, company name button, hourly pay, branch district, Heart save toggle, and `"Ứng tuyển"` button) + bottom section `"3 cam kết bảo vệ quyền lợi sinh viên tại PARTIME.VN"`.
```

### Prompt SV-02: Khám phá Việc làm — Thanh Lọc 5 Tiêu chí Ngang & Danh sách (`StudentPortal.jsx` View=`jobs`)
```text
Wireframe View 2 ("Khám phá việc làm") of StudentPortal:
- Header Bar: Title `"Tìm kiếm việc làm part-time"`, subtitle `"Tìm thấy N vị trí phù hợp với lịch học sinh viên"`.
- Horizontal 5-Criteria Filter Card above results (NO 25% left filter column):
  1. Search input `placeholder="Tìm kiếm (Tiêu đề công việc; Tên doanh nghiệp)"` (supports accent-insensitive multi-word search).
  2. Category dropdown `"Tất cả ngành nghề"` (Master Data synced).
  3. Province dropdown `"Toàn quốc"` (63 Provinces).
  4. Work Shift dropdown `"Mọi ca làm việc"` (`Ca sáng`, `Ca chiều`, `Ca tối`).
  5. Salary Bracket dropdown `"Tất cả mức lương"`.
  - Dynamic Secondary Multi-District Selector Row (appears when a province with mapped districts is chosen): label `"Tích chọn nhiều Khu vực tại {Province} (N đã chọn):"`, multi-select clickable pill buttons (e.g., Quận 1..24 HCMC districts) + `"Xóa chọn"` clear button.
- Top `<PaginationBar itemLabel="việc làm" />` (`10/20/50/Tất cả`), followed by 2-column responsive Grid of Job Cards prioritizing matching student address with a emerald pill badge `"Gần bạn"`, Heart bookmark icon button, and action button `"Ứng tuyển"` / `"Đã ứng tuyển"` / `"Đã hoàn thành công việc"`.
```

### Prompt SV-03: Slide-over Chi tiết Tin tuyển dụng, Hồ sơ Công ty & Modal Nộp hồ sơ 1-Chạm (`StudentPortal.jsx`)
```text
Design 3 interactive overlays triggered from any Student job card:
1. Job Detail Slide-over Drawer (right-docked white panel z-50 max-w-xl overflow-y-auto):
   - Sticky top header with job title, clickable green Employer link (opens Public Company Profile Modal), Heart bookmark icon, X close button.
   - Verified badge `"100% đã xác thực GPKD"`, `"Mức lương theo giờ"`, shift/address summary, full `"Mô tả chi tiết công việc"`.
   - Sticky bottom footer action row (single line): `"Báo cáo"` (Flag icon, slate/amber outline on left) + `"Ứng tuyển ngay"` primary 3D blue button (or `"Đã ứng tuyển"` / `"Đã hoàn thành công việc"`).
2. Public Company Profile Modal (white modal max-w-2xl): Company cover banner, overlapping avatar/logo, verified GPKD pill, average rating stars, intro description, list of open jobs, and student public reviews list.
3. One-Tap Apply Modal ("Nộp hồ sơ ứng tuyển", compact white modal):
   - ONLY 1 form field: Dropdown label `"Chọn CV Ứng Tuyển (Tự động chọn CV Mặc định) *"` listing Student's PDF CVs from GridFS (defaults automatically to Star-marked Default CV; prompts to upload CV first if library empty).
   - Bottom row left-to-right: `"Gửi hồ sơ"` primary blue CTA button LEFT of `"Hủy"` button. (Strictly NO Cover Letter textarea, NO extra confirmation checkbox).
```

### Prompt SV-04: Việc làm Đã lưu (`StudentPortal.jsx` View=`saved_jobs`)
```text
Wireframe View 3 ("Việc làm đã lưu") inside StudentPortal:
- Heading `"Danh Sách Việc Làm Đã Lưu"` + `<PaginationBar itemLabel="việc làm đã lưu" />`.
- If Logged-In: 2-column grid of bookmarked job cards displaying live job status tags directly on each card (`Đã ứng tuyển`, `Đã hoàn thành công việc`, `Đã nhận đủ người`, `Tạm đóng tuyển dụng`), active red Heart button to remove bookmark, click-to-open JD Slide-over, and `"Ứng tuyển"` action button.
- If Guest Mode: `"Gợi ý việc làm nên lưu ngay hôm nay:"` showing 4 featured public cards where clicking Heart prompts Student login.
```

### Prompt SV-05: Tiến độ Ứng tuyển 4 Chặng & Rút đơn (`StudentPortal.jsx` View=`applications`)
```text
Wireframe View 4 ("Tiến độ ứng tuyển") inside StudentPortal:
- Top Action Row: Heading `"Quản Lý Tiến Độ Ứng Tuyển"` + right button `"Xuất Excel Đơn Ứng Tuyển"` (.xls download).
- Filter Controls: Search input `placeholder="Tìm kiếm (Tiêu đề công việc; Tên doanh nghiệp)"` + date filter + **7 horizontal status pills**: `Tất cả`, `Đang chờ xét duyệt`, `Đã tiếp nhận`, `Mời phỏng vấn`, `Trúng tuyển`, `Chưa phù hợp`, `Đã rút hồ sơ`.
- `<PaginationBar itemLabel="đơn ứng tuyển" />` + list of Application Cards, each showing:
  - Job title, Company name, frozen attached PDF CV filename (`application_snapshot`), submission date.
  - Visual 4-Step Horizontal Progress Stepper: `Bước 1: Nộp Hồ Sơ` -> `Bước 2: Tiếp Nhận` -> `Bước 3: Phỏng Vấn` -> `Bước 4: Kết Quả` (or red `Bước 4: Chưa Phù Hợp` with exact Employer rejection reason box; or scheduled Interview card showing date/time/method/note).
  - Bottom action bar: `"Mở Chat Chờ NTD"` / `"Mở Chat"`, `"Rút hồ sơ"` (enabled for pending/reviewed/interview/accepted when job not completed; triggers ConfirmDialog), and `"Xóa"` (soft delete, ConfirmDialog).
```

### Prompt SV-06: Lịch ca làm đã nhận & Thời khóa biểu Tuần T2–CN (`StudentPortal.jsx` View=`my_shifts`)
```text
Wireframe View 5 ("Lịch ca làm đã nhận") inside StudentPortal:
- Top Bar: Title `"Thời khóa biểu & lịch ca làm đã nhận"` + two green/blue export buttons `"Xuất Excel lịch ca làm"` and `"Xuất bảng chấm công (.xls)"`.
- Summary Row: **3 KPI cards**: `Tổng giờ công part-time`, `Thu nhập dự kiến`, `Tỷ lệ duyệt đơn`.
- **4 Filters Row**: Week selector (`Tuần trước`/`Tuần hiện tại`/`Tuần sau`), Shift slot (`Tất cả khung ca`, `Ca sáng (06:00 - 12:00)`, `Ca chiều (12:00 - 18:00)`, `Ca tối (18:00 - 23:00)`), SearchableDropdownInput `"Tất cả chi nhánh..."`, Status selector (`Tất cả trạng thái ca`, `Sắp diễn ra`, `Đang làm việc`, `Đã hoàn thành`, `Vắng mặt`, `Đã hủy ca`).
- 7-Column Weekly Timetable Grid (`Thứ 2` through `CN`) displaying accepted shift blocks with status badges and inline buttons `"Vào ca làm"`, `"Xong ca"`, `"Đánh Giá Doanh Nghiệp"` / `"Chờ Doanh nghiệp nghiệm thu"`. Clicking any shift opens Shift Detail Modal.
- Below Timetable: `<PaginationBar itemLabel="ca làm việc" />` + 2-column detail shift cards with buttons `"Vào Ca Làm"`, `"Xác Nhận Xong Ca"`, `"Xin Nghỉ / Hủy Ca"`.
```

### Prompt SV-07: Kho quản lý CV PDF Chuẩn ATS (`StudentPortal.jsx` View=`profile_cv`)
```text
Wireframe View 6 ("Quản lý CV") inside StudentPortal:
- Header Bar: Title `"Kho Quản Lý CV Chuẩn ATS (PDF ≤ 10MB)"` + counter badge `"{N} tệp CV đã lưu"` (NO max-5 cap).
- Drag & Drop Upload Box: Dashed border upload zone accepting `.pdf` files up to `10MB` with live upload progress bar (explicitly notes non-PDF like .docx/.txt are rejected).
- 2-Column Grid of Stored CV Cards: Each card displays red/slate `"PDF"` badge, filename, upload date, blue `"Mặc định"` badge if default, and single-row action buttons: `"Xem chi tiết"` (opens A4 DocumentViewerModal `<iframe>`), Star icon (`Đặt làm CV mặc định`), Paperclip icon (`Thay thế tệp PDF mới`), and `"Xóa"` (Trash2 -> ConfirmDialog). Note: Strictly NO Cover Letter tab in this view.
```

### Prompt SV-08: Hồ sơ cá nhân Sinh viên (`StudentPortal.jsx` View=`student_profile`)
```text
Wireframe View 7 ("Hồ sơ cá nhân") inside StudentPortal:
- Profile Hero Card: Full-width Cover Photo (hover reveals `"Thay Ảnh Bìa"` drag/drop/select + delete buttons for `.png/.jpg <= 10MB`) + overlapping Circular Avatar (hover reveals `"Đổi ảnh"` + delete buttons) + `"Chỉnh sửa hồ sơ"` primary button.
- Profile View / Edit Form (single card below Hero):
  - Exactly 4 editable fields matching live JSX:
    1. `"Họ và Tên *"`
    2. `"Số Điện Thoại (Bắt buộc đúng 10 chữ số) *"` (`placeholder="0987654321"`, live red inline validation error if not starting with `0` and 10 digits)
    3. `"Trường Đại Học / Cao Đẳng *"` (using `SearchableDropdownInput` autocomplete)
    4. `"Địa Chỉ Cư Trú (Quận/Huyện, Tỉnh/Thành) *"` (using `SearchableDropdownInput` to drive `"Gần bạn"` job ranking)
  - Edit mode bottom buttons (left-to-right): `"Lưu thông tin"` LEFT of `"Hủy"`. (NO MSSV, bio, or skills tag editor).
```

### Prompt SV-09: Đánh giá Doanh nghiệp 2 Chiều & Modal Viết đánh giá (`StudentPortal.jsx` View=`reviews`)
```text
Wireframe View 8 ("Doanh nghiệp chờ đánh giá" / "Đánh giá doanh nghiệp 2 chiều") inside StudentPortal:
- 3 Navigation Tabs: `"Ca làm chờ gửi đánh giá"` | `"Ca làm đã hoàn tất đánh giá"` | `"Nhà tuyển dụng đánh giá tôi"`.
- `<PaginationBar />` + Card Grid per tab:
  - Tab 1: Completed/employer-confirmed shifts with `"Viết Đánh Giá"` CTA button (locked until Employer confirms shift completion).
  - Tab 2: Sent reviews showing star rating, comment snippet, `"Xem chi tiết"`, `"Chỉnh sửa"` (disabled/locked if Admin hid the review), `"Xóa"`.
  - Tab 3: Employer-submitted evaluations of the student's performance.
- Review Form Modal (white rounded-3xl): Interactive 1–5 Star Rating selector, character-counted Comment `<textarea>` (`< 1,000 ký tự` — NO multi-criteria sliders), inline amber `<BannedKeywordWarning />` if sensitive word typed, buttons left-to-right: `"Gửi đánh giá"` LEFT of `"Hủy"`.
```

### Prompt SV-10: Báo cáo Vi phạm đã gửi & Modal Gửi Báo cáo (`StudentPortal.jsx` View=`my_reports`)
```text
Wireframe View 9 ("Báo cáo vi phạm đã gửi") inside StudentPortal + Reusable Report Modal:
- Report List Screen: Heading `"Báo cáo vi phạm đã gửi & tiến độ xử lý"`, `<PaginationBar itemLabel="báo cáo vi phạm" />`, list of report cards each displaying `ticket_code` (`RP-...`), type badge (`Tin tuyển dụng` / `Hội thoại`), target title, 4-state status pill (`Chờ quản trị viên xử lý`, `Đang điều tra`, `Đã giải quyết`, `Bị bác bỏ`), submitted reason, and Admin resolution note box when processed.
- Triggered Report Violation Modal ("Báo cáo vi phạm tới quản trị viên"): Reason description `<textarea>` + bottom buttons `"Gửi báo cáo"` LEFT of `"Hủy"`.
```

### Prompt SV-11: Tin nhắn 1-1, Ngăn kéo Chat & Phỏng vấn WebRTC (`StudentPortal.jsx` View=`chat` + Chat Drawer)
```text
Wireframe View 10 ("Tin nhắn & phỏng vấn") inside StudentPortal + Floating Chat Drawer:
- Main Split Workspace (2 columns responsive):
  - Left Column (Contacts Sidebar `StudentChatContactsPanel`): Heading `"Hội Thoại Doanh Nghiệp"`, Search `placeholder="Tìm kiếm (Vị trí ứng tuyển; Tên doanh nghiệp)"`, `"Chưa phản hồi"` toggle filter chip, scrollable list of application-isolated chat threads (job title + company + last message badge).
  - Right Column (Conversation Thread):
    - Top Header (`xl:flex-row whitespace-nowrap` preventing vertical wrapping): Company/Job title, status indicator, and right button group left-to-right: `"Gọi thoại"` (Phone icon), `"Gọi video"` (Video icon), `"Báo cáo"` (Flag icon).
    - Inline WebRTC Video Stage (when call active): Dark theater stage with remote full-bleed video + bottom-right self PiP + floating center controls (Mic toggle, Camera toggle, End Call — NO Share Screen button).
    - Message Feed: Text bubbles (sensitive words auto-masked as `***` with hint `"Từ ngữ nhạy cảm đã được che (***)"` + `"Báo cáo"` action), inline Call Duration log cards (`"Cuộc gọi nhỡ"` / `"03:20"`), and downloadable/previewable `.pdf`/`.png`/`.jpg` attachment cards.
    - Bottom Composer: Either Read-Only banner (when application rejected/withdrawn or account banned) OR Paperclip attachment button (`.pdf,.png,.jpg,.jpeg <= 10MB`), text input `placeholder="Nhập tin nhắn... (Hệ thống tự động lọc từ ngữ cấm ***)"`, and primary `"Gửi"` button.
- Also illustrate slide-over `"Widget chat nhanh"` Header Drawer containing contacts list + `"Mở Toàn Màn Hình Chat & Video Call"` button.
```

---

## PHẦN 4: ROLE 2 — NHÀ TUYỂN DỤNG PORTAL (`EmployerPortal.jsx` — 12 PROMPTS)

> **Cấu trúc khung Portal Nhà tuyển dụng:** Nền `bg-[#F8FAFC]`, `<Header />` sticky (`Đăng tin mới`, Drawer Chat, Chuông, Avatar), `<aside>` Sidebar trái nền trắng (`Cổng doanh nghiệp`) gồm **đúng 10 mục**: `Bảng điều khiển tuyển dụng`, `Hồ sơ doanh nghiệp & giấy phép kinh doanh`, `Đăng tin part-time theo ca`, `Quản lý tin tuyển dụng`, `Quản trị ứng viên`, `Lịch phỏng vấn trực tuyến`, `Xác nhận hoàn thành ca làm`, `Đánh giá năng lực sinh viên`, `Khiếu nại & báo cáo đã gửi`, `Tin nhắn & phỏng vấn ứng viên`.

### Prompt NTD-01: Bảng điều khiển Tuyển dụng — Khách & Đã đăng nhập (`EmployerPortal.jsx` View=`home`)
```text
Wireframe View 1 ("Bảng điều khiển tuyển dụng") inside EmployerPortal:
- Top Gradient Hero Card (blue-indigo-sky): Headline + CTA `"Đăng tin tuyển dụng mới"` / `"Bảng ứng viên tuyển dụng"`.
- Guest Mode Content (when unauthenticated): 3 Trust Value Cards (`Xác thực GPKD`, `Khớp lịch theo ca`, `Phỏng vấn & nghiệm thu`) + 3-Step Onboarding Guide + ATS workflow preview.
- Authenticated Content:
  - Exactly **3 KPI Cards** horizontal row: `Tin đang tuyển dụng`, `Tổng hồ sơ ứng tuyển`, `Đánh giá sinh viên` (strictly 3 KPIs, NOT 4).
  - `"Biểu đồ phễu tuyển dụng"`: Visual 5-tier conversion funnel bars from Views/Applications down to Accepted & Completed shifts.
  - Horizontal scrollable `"Hiệu suất theo tin tuyển dụng & chi nhánh"` 6-column table (`min-w-[640px] whitespace-nowrap`).
  - Bottom `"Ứng viên mới cần xử lý nhanh"` card list with shortcut `"Mở bảng ứng viên ATS"`.
```

### Prompt NTD-02: Hồ sơ Doanh nghiệp & Tái thẩm định GPKD PDF (`EmployerPortal.jsx` View=`company`)
```text
Wireframe View 2 ("Hồ sơ doanh nghiệp & giấy phép kinh doanh") inside EmployerPortal:
- If Guest Mode: Read-only 3-pillar legal verification showcase + login guidance (NO disabled empty form).
- If Logged-In Employer:
  - Company Cover Banner & Logo Avatar upload/drag-drop/delete widgets (`.png/.jpg <= 10MB`), top button `"Chỉnh sửa thông tin"`, `"Xem nội dung chi tiết GPKD"` (opens DocumentViewerModal).
  - Live GPKD Verification Status Card: Emerald (`Đã phê duyệt hợp lệ`), Amber (`Chờ quản trị viên duyệt` + note job posting locked), or Red (`Bị từ chối GPKD` + Admin `reject_reason`).
  - Edit Form: `"Tên doanh nghiệp *"`, `"Họ tên người đại diện *"`, `"Tên chi nhánh làm việc *"` (`SearchableDropdownInput`), `"Mã số GPKD *"`, `"Quy mô công ty *"`, `"Địa chỉ trụ sở / chi nhánh (24 quận huyện TP.HCM) *"`, `"Số điện thoại liên hệ doanh nghiệp *"`, `"Giới thiệu môi trường làm việc *"`, and `.pdf <= 10MB` GPKD PDF drag-and-drop re-upload box (explicit warning that replacing PDF resets status to pending Admin approval). Bottom buttons: `"Lưu hồ sơ doanh nghiệp"` LEFT of `"Hủy"`.
```

### Prompt NTD-03: Biểu mẫu Đăng & Chỉnh sửa Tin tuyển dụng (`EmployerPortal.jsx` View=`post_job`)
```text
Wireframe View 3 ("Đăng tin part-time theo ca") inside EmployerPortal inside `.form-card-col2` pastel card:
- Form Heading `"Đăng tin tuyển dụng part-time theo ca"` (or edit mode).
- Exact form inputs present in live JSX:
  - `"Tiêu đề công việc (gợi ý ngành nghề linh hoạt) *"` (autocomplete suggestions)
  - `"Ngành Nghề Tuyển Dụng *"` (<select> synced with Master Data)
  - `"Địa Điểm Làm Việc (63 Tỉnh/Thành phố & Quận/Huyện) *"` (Province + District dual selectors)
  - Salary Row: `"Lương tối thiểu (VNĐ/giờ)"` (`15000`–`200000`) & `"Lương tối đa (VNĐ/giờ)"` (`15000`–`200000`). *(NOTE: Strictly NO Salary Negotiable checkbox on live form, NO Headcount field, NO Deadline picker, NO Benefits box).*
  - Shift Pill Checkboxes: `"Ca sáng (7:00-12:00)"`, `"Ca chiều (13:00-18:00)"`, `"Ca tối (18:00-23:00)"`.
  - `"Mô Tả Chi Tiết Công Việc *"` (`<textarea>` wired with real-time `<BannedKeywordWarning />` checking banned words/unaccented/concatenated >=4 char variants).
- Bottom CTA Buttons (2 buttons only, NO "Save Draft"): `"Hủy Bỏ"` and primary blue CTA `"Đăng Tin Ngay"` (or `"Lưu Thay Đổi"`).
```

### Prompt NTD-04: Quản lý Tin tuyển dụng & Lọc Chi nhánh Chính xác (`EmployerPortal.jsx` View=`jobs`)
```text
Wireframe View 4 ("Quản lý tin tuyển dụng") inside EmployerPortal:
- Top Toolbar: Heading, `"Tạo tin tuyển dụng"` button (toggles inline form & back), search `"Tìm kiếm (Tin tuyển dụng)"`, `"Tất cả bật/tắt tuyển dụng"` (`Đang tuyển`/`Tạm đóng`), `"Tất cả tiến độ tuyển dụng"`, Branch `SearchableDropdownInput` `"Tất cả chi nhánh..."` (matching `"Quận 1"` strictly without mixing Quận 10/11/12).
- `<PaginationBar itemLabel="tin tuyển dụng" />` + Horizontal scrollable 6-column table (`min-w-[980px]`, all headers/badges `whitespace-nowrap`):
  1. `Tiêu đề công việc` (with auto-moderation pill `Đã công khai` or amber `Chờ kiểm duyệt` / sensitive tags)
  2. `Mức lương / giờ`
  3. `Hồ sơ nộp` (`"Xem ứng viên (N)"` button)
  4. `Bật/tắt tuyển dụng` (toggle switch)
  5. `Tiến độ tuyển dụng` (`"Chốt nhận người"` / `"Đã nhận người → Hoàn thành"` / `"Đã hoàn thành"`)
  6. `Thao tác` — single row order left-to-right: `"Xem"` -> `"Chỉnh sửa"` -> `"Xóa"`.
```

### Prompt NTD-05: Quản trị Ứng viên ATS — 3 Chế độ Kanban / Lưới thẻ / Danh sách (`EmployerPortal.jsx` View=`applicants`)
```text
Wireframe View 5 ("Bảng quản lý ứng viên (ATS)") inside EmployerPortal:
- Top Toolbar: Heading + `"Xuất Excel"` (.xls) button + **exact 3-Mode View Switcher** (`"Bảng Kanban"` active blue | `"Lưới thẻ"` | `"Danh sách"` — strictly NO "Thẻ gọn / Đầy đủ" toggle).
- Multi-Filter Bar: Search `"Tìm kiếm (Tên sinh viên; Vị trí tuyển dụng)"`, `SearchableDropdownInput` `"Lọc theo Tin tuyển dụng..."`, Status dropdown `"Mọi trạng thái hồ sơ"`, Shift dropdown `"Mọi ca làm việc đăng ký"`, School dropdown `"Trường Đại học / Cao đẳng..."`, `"Xóa bộ lọc"` reset.
- Mode 1 (`Bảng Kanban`): 4 equal fixed-height internally scrollable columns left-to-right:
  1. **`Đang chờ xét duyệt`** (Pending / Reviewed / Interview)
  2. **`Trúng tuyển`** (Accepted / Completed)
  3. **`Chưa phù hợp`** (Rejected)
  4. **`Sinh viên rút đơn`** (Withdrawn / Cancelled)
  - Each column renders max **12 cards per page** + `"Xem thêm"` / `"Thu gọn về 12 hồ sơ"` toggle button.
- Mode 2 (`Lưới thẻ`): 5 status tabs (`Tất cả`, `Đang chờ xét duyệt`, `Trúng tuyển`, `Chưa phù hợp`, `Sinh viên rút đơn`) + `<PaginationBar />` + responsive cards with `"Lịch sử chat"` / `"Nhắn tin"`, `"Báo cáo"`, `"Xóa"`.
- Mode 3 (`Danh sách`): `min-w-[1040px]` 6-column table (`Ứng viên sinh viên`, `Vị trí tuyển dụng`, `Trường đại học`, `Trạng thái`, `Ngày nộp`, `Thao tác`) with single-line fixed-order buttons left-to-right: **`[Duyệt] -> [Mời PV] -> [Xem CV] -> [Chat] -> [Từ chối] -> [Báo cáo] -> [Xóa]`**.
```

### Prompt NTD-06: Cửa sổ Xử lý Ứng viên (Modal CV 2 Cột, Hẹn Phỏng vấn, Từ chối & Báo cáo) (`EmployerPortal.jsx`)
```text
Design the 3 Employer ATS Decision Modals (all light glass white surfaces):
1. 2-Column Applicant Inspection Modal ("Hồ sơ ứng viên: {Name}", max-w-5xl grid-cols-1 lg:grid-cols-2):
   - Opening this Modal on a Pending application automatically flips status to "Đã tiếp nhận" (reviewed).
   - Left Column: Embedded PDF Viewer previewing Student's frozen CV snapshot + buttons `"Tải về máy"` and `"Xem toàn màn hình"`.
   - Right Column: Contact details, university, address, schedule match, top utility buttons `"Nhắn tin tuyển dụng"` & `"Báo cáo"`, bottom decision row left-to-right: `"Duyệt"` (green) -> `"Mời phỏng vấn"` / `"Cập nhật lịch PV"` (blue) -> `"Từ chối"` (red).
2. Schedule Interview Modal ("Đặt lịch hẹn phỏng vấn sinh viên"): Fields `"Ngày Hẹn Phỏng Vấn *"`, `"Giờ Hẹn Phỏng Vấn *"`, `"Hình Thức Phỏng Vấn *"` (3 options: Video Call WebRTC, Gặp trực tiếp, Điện thoại), `"Địa Điểm Chi Nhánh / Link Phòng Họp"` (manual input, no auto-generate), `"Ghi Chú Chuẩn Bị Cho Sinh Viên"`, CTA `"Gửi Lịch Hẹn Phỏng Vấn"` LEFT of `"Hủy bỏ"`.
3. Reject Reason Modal: 5 clickable quick reason pill chips (`REJECT_REASON_PRESETS`) + mandatory custom reason `<textarea>` + CTA `"Xác nhận từ chối"` LEFT of `"Hủy"`.
```

### Prompt NTD-07: Lịch phỏng vấn trực tuyến — 2 Chế độ Xem (`EmployerPortal.jsx` View=`interviews`)
```text
Wireframe View 6 ("Lịch phỏng vấn trực tuyến (WebRTC realtime)") inside EmployerPortal:
- Header + View Mode Switcher: `"Thẻ ứng viên"` | `"Khung lịch theo ngày"` (max-h-[600px] daily schedule scroll container).
- Filter Bar: **3 status tabs** (`Tất cả`, `Mời phỏng vấn`, `Đã trúng tuyển`), keyword search, specific interview date picker, `<PaginationBar itemLabel="lịch phỏng vấn" />`.
- Interview Card Layout: Candidate info, scheduled date/time, method badge, quick inline action buttons `"Gọi video"`, `"Gọi thoại"`, `"Duyệt vào làm"`, `"Mời phỏng vấn"` / `"Đổi lịch PV"`, `"Xem CV"`, `"Nhắn tin"`.
```

### Prompt NTD-08: Xác nhận hoàn thành ca làm & Chấm công T2–CN (`EmployerPortal.jsx` View=`job_completion`)
```text
Wireframe View 7 ("Xác nhận hoàn thành ca làm & bàn giao") inside EmployerPortal:
- Top Toolbar: Heading + Mode Toggle `"Theo tin & điểm danh"` vs `"Lịch ca theo tuần (T2 - CN)"` (100% synced shift count with Student) + `"Xuất Excel chấm công"` (.xls) + `"Chuyển sang bảng đánh giá"`.
- 3 Filters: Branch, Job Posting, Shift Status.
- Mode A ("Theo tin & điểm danh"): Grouped per Job block with job-level buttons `"Chốt nhận đủ người (dừng tuyển)"` and `"Đóng / kết thúc đợt tuyển"`, listing accepted students with `"Duyệt Xong Ca"`, `"Vắng"`, `"Đánh giá"`.
- Mode B ("Lịch ca theo tuần (T2 - CN)"): 7-column Monday–Sunday calendar matrix showing scheduled student shift cards with one-click attendance buttons.
```

### Prompt NTD-09: Đánh giá Năng lực Sinh viên & Khiếu nại đã gửi (`EmployerPortal.jsx` Views `reviews` & `my_reports`)
```text
Wireframe Views 8 & 9 inside EmployerPortal:
- View 8 ("Đánh giá hiệu suất sinh viên"): **3 Tabs** (`Ca làm chờ gửi đánh giá` with `"Chấm điểm & đánh giá"` CTA | `Ca làm đã hoàn tất đánh giá` with `Xem chi tiết`, `Chỉnh sửa`, `Xóa` | `Đánh giá từ sinh viên`), `<PaginationBar />`. Includes White Review Modal (1–5 stars + `<1,000 char` textarea + `<BannedKeywordWarning />`, NO criteria sliders).
- View 9 ("Khiếu nại & báo cáo đã gửi tới quản trị viên"): `<PaginationBar />` + list of submitted applicant/chat violation tickets showing 4 statuses (`Chờ xử lý`, `Đang điều tra`, `Đã giải quyết`, `Bị bác bỏ`) and Admin resolution notes; also modal for creating applicant violation report (5 preset reason categories + detail textarea).
```

### Prompt NTD-10: Tin nhắn, Modal Tạo tin nhắn mới & Phỏng vấn WebRTC NTD (`EmployerPortal.jsx` View=`chat`)
```text
Wireframe View 10 ("Tin nhắn & phỏng vấn ứng viên") inside EmployerPortal + New Message Modal:
- Split 2-Column Chat Workspace:
  - Left Contacts Column: `"Hội thoại ứng viên"`, primary `"Tạo tin nhắn mới"` button, job dropdown `"Tất cả tin tuyển dụng"`, toggle `"Chưa phản hồi"`, candidate room list (displays `"Chỉ đọc"` tag for rejected/withdrawn rooms).
  - Right Chat Header (`xl:flex-row whitespace-nowrap`): Candidate & Job title + 4 horizontal same-row action buttons left-to-right: `"Tạo tin nhắn mới"` -> `"Gọi thoại"` -> `"Gọi video"` -> `"Báo cáo"`.
  - Message Stream + Bottom Composer (identical masking `***`, `.pdf/.png/.jpg <= 10MB` attachment, or locked `"CHỈ ĐỌC"` banner) + inline WebRTC Video Stage (PiP + Mic/Camera/End Call ONLY; strictly NO 30% side Evaluation Notepad).
- New Message Modal ("Tạo tin nhắn mới"): Application `<select>` choosing eligible applicant, message `<textarea>`, bottom CTA `"Khởi tạo & gửi tin"` (switches automatically to `"Xem lịch sử trò chuyện cũ"` when a rejected/withdrawn application is selected).
```

---

## PHẦN 5: ROLE 3 — QUẢN TRỊ VIÊN PORTAL (`AdminPortal.jsx` — 11 PROMPTS)

> **Cấu trúc khung Portal Quản trị viên:** Nền `bg-[#F8FAFC]`, `<Header />` (huy hiệu `Quản trị viên hệ thống`, Chuông giám sát Realtime, Avatar Dropdown không có nút Hủy tài khoản), `<aside>` Sidebar trái nền trắng (`Cổng quản trị hệ thống`) gồm **đúng 10 mục** kèm bộ đếm bản ghi thực: `Trung tâm chỉ huy (Analytics Dashboard)`, `Quản lý người dùng & phân quyền`, `Bàn thẩm định doanh nghiệp & GPKD`, `Kiểm duyệt tin tuyển dụng`, `Kiểm duyệt từ khoá cấm`, `Quản lý đánh giá chéo 2 chiều`, `Quản trị danh mục Master Data`, `Xử lý Khiếu nại & Báo cáo vi phạm`, `Nhật ký hoạt động (Audit Log)`, `Thông báo hệ thống hàng loạt`.

### Prompt QTV-01: Trung tâm chỉ huy Analytics Dashboard 2026 (`AdminPortal.jsx` View=`dashboard`)
```text
Wireframe View 1 ("Trung tâm chỉ huy (Analytics Dashboard)") inside AdminPortal:
- Top Bar: Heading `"Thống kê & báo cáo tăng trưởng"` + green/blue `"Xuất báo cáo Excel"` button (NO CSV export button) + `"Xem tất cả dữ liệu"` reset.
- Multi-Dimensional Filter Card (100% Real 2026 Live MongoDB Data — NO 2024/2025 options):
  - Row 1: `"1. Chọn Năm"` dropdown (ONLY `"Tất cả các năm"` and `"Năm 2026"`) | `"2. Chọn Tháng (trong năm đã chọn)"` dropdown | `"Khu vực Tỉnh / Thành phố (Toàn quốc)"` | `"Tất cả nhóm ngành nghề (Master Data)"`.
  - Row 2: `"Từ ngày"` & `"Đến ngày"` date pickers (`min="2026-01-01" max="2026-12-31"`).
- **4 Real KPI Summary Cards** (excluding test accounts/non-Gmail): `Tổng số sinh viên`, `Tổng doanh nghiệp`, `Tin tuyển dụng`, `Đơn ứng tuyển`.
- **3 SVG Interactive Charts Grid** (each chart card includes a fixed-height `h-12` hover tooltip strip ABOVE the SVG preventing page layout shift):
  1. Vertical Bar Chart (Quarterly / Weekly 2026 breakdown).
  2. Dual-Series SVG Line Chart (`viewBox="0 0 400 150"`, `Sinh viên` vs `Việc làm`).
  3. SVG Donut Chart (`viewBox="0 0 100 100"`, `Cơ cấu ngành nghề`).
```

### Prompt QTV-02: Quản lý Người dùng & Modal Chi tiết CV / GPKD (`AdminPortal.jsx` View=`users`)
```text
Wireframe View 2 ("Quản lý người dùng & phân quyền") + User Detail & Ban Modals inside AdminPortal:
- Filter Toolbar: Search `"Tìm kiếm (Email; ID)"`, `"Tất cả vai trò"` (`Sinh viên`/`Nhà tuyển dụng`), `"Tất cả trạng thái khóa"`, `SearchableDropdownInput` Trường/Chi nhánh, `"Tất cả trạng thái GPKD (NTD)"`.
- `<PaginationBar itemLabel="người dùng" />` + Horizontal 6-column Table (`min-w-[940px]`): `Email / ID`, `Họ tên / doanh nghiệp`, `Vai trò`, `Trạng thái GPKD (NTD)`, `Trạng thái khóa`, `Thao tác` (`Mở khóa`/`Khóa` left of `Xóa`). System Admin account excluded & protected from self-ban/delete.
- Clicking any table row opens white User Detail Modal: Student shows uploaded CV PDF links (`"Xem CV PDF"` -> DocumentViewerModal); Employer shows MST + `"Xem bản in GPKD"` + quick action buttons `"Duyệt"` -> `"Từ chối"`.
- Lock User Modal ("Khóa tài khoản người dùng"): mandatory reason textarea + `"Xác nhận khóa"` LEFT of `"Hủy"`.
```

### Prompt QTV-03: Bàn thẩm định Doanh nghiệp & GPKD PDF (`AdminPortal.jsx` View=`gpkd`)
```text
Wireframe View 3 ("Bàn thẩm định doanh nghiệp & GPKD") inside AdminPortal:
- Header `"Kiểm duyệt hồ sơ & GPKD"` + **3 Partner KPI Cards**: `Tổng doanh nghiệp`, `Đã phê duyệt hợp lệ`, `Chờ xét duyệt GPKD`.
- 4 Filters: Approval Status tabs/select (`Tất cả`, `Chờ duyệt`, `Đã duyệt`, `Bị từ chối`), Tax Code format (`10 số` vs `13 số`), Province/City, District.
- `<PaginationBar itemLabel="doanh nghiệp" />` + 7-Column Table (`min-w-[940px]`): `Doanh nghiệp & chi nhánh`, `Người đại diện`, `Email / SĐT`, `Mã số GPKD`, `Tài liệu đính kèm` (`"Xem file GPKD (PDF)"` -> DocumentViewerModal `<iframe>`), `Trạng thái`, `Thao tác phê duyệt` (`"Duyệt"` LEFT of `"Từ chối"`).
- GPKD Reject Modal: Mandatory rejection reason textarea + `"Xác nhận từ chối"` LEFT of `"Hủy"`.
```

### Prompt QTV-04: Kiểm duyệt Tin tuyển dụng Toàn sàn (`AdminPortal.jsx` View=`jobs`)
```text
Wireframe View 4 ("Kiểm duyệt tin tuyển dụng") inside AdminPortal:
- Heading `"Quản lý tin tuyển dụng toàn hệ thống"` + 3 Quick Filter Pills: `"Tất cả tin"` | `"Tin mới đăng chờ kiểm duyệt"` | `"Cảnh báo từ ngữ nhạy cảm"` + shortcut link `"Quản lý từ khóa cấm"`.
- Search + 2 dropdowns (`Tất cả trạng thái vận hành`, `Tất cả trạng thái kiểm duyệt`) + clickable matched sensitive keyword tag chips.
- `<PaginationBar itemLabel="tin tuyển dụng" />` + 6-Column Table (`min-w-[940px]`): `Tiêu đề công việc` (highlighted keyword badges), `Doanh nghiệp`, `Mức lương`, `Trạng thái vận hành`, `Trạng thái kiểm duyệt`, `Thao tác` (`"Duyệt tin"` -> `"Ẩn"`/`"Hiện"` -> `"Xóa"` — blocks hard delete with HTTP 400 tooltip/alert if applicants exist, prompting `"Ẩn"`).
- Click row -> White Job Detail Modal showing full JD + flagged sensitive terms + bottom action bar `"Duyệt tin & công khai"` / `"Ẩn tin vi phạm"` (opens Hide Reason Modal) / `"Khôi phục hiển thị"`.
```

### Prompt QTV-05: Kiểm duyệt Từ khóa cấm (`AdminPortal.jsx` View=`keywords`)
```text
Wireframe View 5 ("Kiểm duyệt từ khoá cấm") inside AdminPortal:
- Heading `"Cài đặt bộ lọc từ khóa cấm toàn hệ thống"` + shortcut `"Xem tin cảnh báo"` (jumps to `jobs` sensitive tab).
- Bulk Update Box: Comma-separated `<textarea>` + primary CTA `"Lưu & áp dụng bộ lọc ngay"`.
- `<PaginationBar itemLabel="từ khóa cấm" />` + 6-Column Table (`min-w-[860px]`): `STT`, `Từ khóa / cụm từ cấm` (with inline Edit pencil -> Save/Cancel), `Mức độ cảnh báo`, `Tin tuyển dụng khớp` (count + clickable filter), `Ngày cập nhật`, `Thao tác` (`Xóa`). *(Strictly NO Word Cloud visualization, NO Added-By Admin column, NO Chat Hit Count column).*
```

### Prompt QTV-06: Quản lý Đánh giá chéo 2 Chiều (`AdminPortal.jsx` View=`reviews`)
```text
Wireframe View 6 ("Quản lý đánh giá chéo 2 chiều") inside AdminPortal:
- Heading `"Quản lý đánh giá chéo"` + Filter Bar: Search input, `"Tất cả đánh giá"` (`Công khai`/`Đã ẩn`), `"Tất cả chiều tương tác"` (`SV -> Doanh nghiệp` / `Doanh nghiệp -> SV`), `"Tất cả số sao"` (`1..5 sao`).
- `<PaginationBar itemLabel="đánh giá" />` + 5-Column Table (`min-w-[940px]`): `Người đánh giá`, `Điểm sao`, `Nội dung nhận xét`, `Trạng thái`, `Thao tác` (`Ẩn`/`Hiện` LEFT of `Xóa`).
- Click row -> White Modal `"Chi tiết bài đánh giá"` showing full reviewer, reviewee, direction, stars, comment, moderation state, and buttons `"Ẩn đánh giá vi phạm"` / `"Khôi phục hiển thị công khai"`.
```

### Prompt QTV-07: Quản trị Danh mục Master Data (`AdminPortal.jsx` View=`categories`)
```text
Wireframe View 7 ("Quản trị danh mục Master Data") inside AdminPortal:
- Heading `"Quản lý danh mục gốc (Master Data)"` + 3 Tabs: `"Tất Cả"` | `"Ngành Nghề"` | `"Địa Điểm"`.
- Add Category Inline Form: Type dropdown (`Ngành Nghề`/`Địa Điểm`) + Category Name input + primary CTA `"Thêm danh mục"`.
- Search `"Tìm kiếm (Tên danh mục)"` + `<PaginationBar itemLabel="danh mục" />` + 5-Column Table (`min-w-[940px]`): `STT`, `Tên danh mục` (with inline edit pen -> Lưu/Hủy), `Loại danh mục`, `Trạng thái hiển thị` (toggle `"Đang Áp Dụng"` / `"Tạm Ẩn"`), `Thao tác` (`"Xóa"` safely unlinks from jobs via `category_id: ""`). *(Strictly NO Slug/Code column, NO job_count column).*
```

### Prompt QTV-08: Xử lý Khiếu nại & Xem Chat Gốc Nguyên văn (`AdminPortal.jsx` View=`reports`)
```text
Wireframe View 8 ("Xử lý Khiếu nại & Báo cáo vi phạm") + Ticket Resolution & Raw Chat Modals inside AdminPortal:
- Heading `"Quản lý báo cáo vi phạm"` + Search `"Tìm kiếm (Mã phiếu; Lý do khiếu nại)"` + 4 Category Tabs (`Tất cả`, `Tin tuyển dụng`, `Ứng viên`, `Hội thoại`) + Status Filter Dropdown (`Chờ tiếp nhận xử lý`, `Đang điều tra xác minh`, `Đã xử lý thỏa đáng`, `Bị bác bỏ do không căn cứ`).
- `<PaginationBar itemLabel="phiếu khiếu nại" />` + Report Ticket Cards with action buttons left-to-right: `"Xem Chat Gốc"` | `"Xem chi tiết"` | `"Xóa"`.
- Ticket Detail Modal ("Chi tiết phiếu khiếu nại / báo cáo vi phạm"): Shows evidence metadata, button `"Mở CV PDF"` (if student application fraud) or `"Xem lịch sử trò chuyện gốc"` -> **Unmasked Raw Chat Evidence Modal** showing original unmasked messages (`original_content` prior to `***` masking), plus status `<select>` (`4` states), `"Ghi chú xử lý của QTV"` textarea, and CTA `"Lưu trạng thái & gửi thông báo kết quả"` (NO 4 radio action presets).
```

### Prompt QTV-09: Nhật ký hoạt động Audit Log & Thông báo hệ thống Broadcast (`AdminPortal.jsx` Views `audit_logs` & `announcements`)
```text
Wireframe Views 9 & 10 inside AdminPortal:
1. View 9 ("Nhật ký hoạt động (Audit Log)"): Filter dropdown (`"Tất cả hành động quản trị"` + 13 admin filter groups tracking 16 system events), `<PaginationBar itemLabel="nhật ký hoạt động" />`, 5-Column Table (`min-w-[880px]`): `Thời gian`, `Quản trị viên thực hiện`, `Hành động` (color-coded action pill), `Đối tượng tác động`, `Lý do / chi tiết`.
2. View 10 ("Gửi Thông Báo Hệ Thống Hàng Loạt (Broadcast)"): Creation card with Target Group select (`Tất cả người dùng`, `Chỉ Sinh viên`, `Chỉ Nhà tuyển dụng`), Severity select (`Thông tin chung`, `Cảnh báo quan trọng`, `Khẩn cấp / Bảo trì`), Title input `*`, Message `<textarea>` `*`, primary button `"Phát thông báo hàng loạt"`. Below: `<PaginationBar itemLabel="thông báo" />` + Broadcast History list where each item has a `"Xóa & Thu hồi"` button retracting notifications from all recipients in real time.
```

---

## PHẦN 6: RESPONSIVE ĐA THIẾT BỊ — MOBILE, IPAD, LAPTOP, PC (`430px`–`1920px`)

### Prompt R-01: Mobile & Tablet Portal Drawer Navigation (`430x932` & `820x1180`)
```text
Design the Mobile (430x932) and Tablet (820x1180) Responsive Views of PARTIME.VN (NO sticky bottom tab bar dock):
- Header collapses search input (Student) / secondary badges gracefully, surfacing the Hamburger Menu button (Menu icon) on the top left beside BrandLogo.
- Tapping Menu toggles a smooth white Slide-In Left Navigation Drawer (`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 shadow-2xl`) displaying all 10 portal menu items with full Vietnamese labels and count badges, dismissible via backdrop click or X icon.
- Data tables enforce `overflow-x-auto` wrapper around `min-w-[860px..1040px]` tables with `whitespace-nowrap` on status pills and single-line action buttons so ZERO text breaks vertically character-by-character (`documentElement.scrollWidth <= clientWidth`).
```
