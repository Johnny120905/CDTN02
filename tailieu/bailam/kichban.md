# KỊCH BẢN KIỂM THỬ SONG HÀNH MANUAL + SELENIUM WEBDRIVER JAVA POM (`PARTIME.VN — CDTN02`)

> **Thay thế tài liệu cũ `test.md`** — Đồng bộ 100% với bộ kịch bản `test/TestCases_Selenium_PARTIME_VN.xlsx` (**251 Test Cases**), đặc tả `tailieu/bailam/FR.xlsx` (**161 FRs**, **41 BRs**, **13 NFRs**), mã nguồn kiểm thử `test/src/test/java/com/partime/**` và tài liệu **57 lệnh Selenium WebDriver Java** (`tailieu/noidung/CÁC LỆNH TRUY VẤN TRONG SELENIUM WEBDRIVER JAVA_PLT SOLUTIONS.pdf`).  
> **[Cập nhật 20/11/2026 - Lê Thị Thuỳ Ngân]** Bộ kịch bản nay có **255 Test Cases** (thêm TC-SV-088, TC-NTD-093/094/095 cho FR-SV-12.01, FR-NTD-12.01, FR-NTD-10.01/10.02 trước đây chưa có TC) và thêm **tầng test Python** (`test/python/`, 68 test, xem mục 1.4). Kết quả "177 PASS / 0 FAIL" ở mục 2.1 là của lần chạy trước khi rà soát; khi rà soát phát hiện 23 dòng Unit trong Java tự viết lại logic ngay trong file test (không gọi code web) và một số handler UI không có nhánh FAIL, nên con số 100% chưa phản ánh đúng chất lượng. Chi tiết từng chỗ sửa: `tailieu/bailam/thaydoi.md` Giai đoạn 39.
> **Mục tiêu tài liệu:** Giúp người đảm nhận kiểm thử tiếp theo hiểu trọn vẹn toàn bộ bức tranh kiểm thử từ **Thủ công (Manual)** đến **Tự động hóa (Automation)**, từ **Dễ → Khó**, từ **Luồng Đúng (Happy Path / Smoke) → Luồng Sai (Negative)**, cũng như vai trò chính xác của từng lệnh Selenium ở tầng Frontend, Backend API và Data.

---

## 1. TỔNG QUAN KIẾN TRÚC KIỂM THỬ SONG HÀNH (DUAL-USE HYBRID)

### 1.1. Mô hình Gộp Thư mục `test/` trong Monorepo `CDTN02-main`
* Bộ kiểm thử tự động được tổ chức **gộp ngay trong thư mục `CDTN02-main/test/`** (cùng cấp với `Backend/` và `frontend/`), **không cần tách thành repository riêng biệt**, vì:
  1. Độc lập công nghệ qua `test/pom.xml` (Maven + Java 17 + TestNG `7.10.2` + Selenium `4.25.0` + Apache POI `5.3.0` + Jackson), hoàn toàn không xung đột với Python Flask hay Node/Vite.
  2. Dùng chung tệp dữ liệu mẫu (`test/sample_assets/`), tệp cấu hình môi trường Deploy Render (`https://parttime-css0.onrender.com/`) và đồng bộ phiên bản trực tiếp với mỗi thay đổi của Website trên cùng lịch sử Git.
  3. Toàn bộ kịch bản viết tập trung trong **1 tệp Excel duy nhất** `test/TestCases_Selenium_PARTIME_VN.xlsx` để người test tay (Manual Tester) và người chạy Automation dùng chung một nguồn chân lý.

### 1.2. Cấu trúc 5 Sheet & 17 Cột Trong File Excel Đồng Bộ
| Sheet | Cấu trúc & Quy ước màu | Mục đích sử dụng |
|---|---|---|
| `Overview_Summary` | Bảng 1 (Dự án), Bảng 2 & 2B (Tiến độ Role dùng `COUNTA`/`COUNTIF`/`SUM`/`IF`), Bảng 3 (`Test_Type`), Bảng 4 (`Test_Level`), Bảng 5 (`Run_Mode`) + **5 Biểu đồ thống kê** (3 Bar Charts, 2 Pie Charts). | Báo cáo tự động tổng hợp % đạt/lỗi ngay khi Apache POI (`ExcelTestManager.java`) ghi kết quả sau mỗi lần chạy TestNG. |
| `TestCases_Role Sinh viên` | **87 Test Cases** (`TC-SV-001`..`087`), 17 cột chia 3 màu header (`1–4` Xanh dương: Chung, `5–9` Xanh lá: Manual, `10–17` Cam: Automation) + Dropdown Data Validation cột `Manual_Status` & `Run_Mode`. | Kiểm thử toàn bộ phân hệ Sinh viên + API/Unit/E2E xuất phát từ Sinh viên. |
| `TestCases_Role Nhà tuyển dụng` | **92 Test Cases** (`TC-NTD-001`..`092`), cùng chuẩn 17 cột + Data Validation. | Kiểm thử toàn bộ phân hệ Nhà tuyển dụng + ATS Kanban/Lưới/Danh sách + Ca làm/Đánh giá. |
| `TestCases_Role Quản trị viên` | **72 Test Cases** (`TC-QTV-001`..`072`), cùng chuẩn 17 cột + Data Validation. | Kiểm thử phân hệ `/admin`, Dashboard 2026, GPKD, Kiểm duyệt tin, Từ khóa cấm, Master Data, Khiếu nại & Audit Log. |
| `Config_Environment` | 21 dòng cấu hình (`BASE_URL`, `BROWSER`, `HEADLESS_MODE`, `DEMO_SPEED_MS`, `HIGHLIGHT_ELEMENT`, `COOKIE_DIR`, `VIEWPORT_PRESETS`, `SELENIUM_CMD_REF`, `POM_DISPATCH_NOTE`). | Điều khiển trình duyệt, tốc độ trình chiếu và phiên Cookie mà không cần sửa code Java. |

### 1.3. Cơ chế Trình chiếu Trực quan & Cookie Tự động Duy trì Phiên
* **Trình chiếu trực quan trên màn hình (`BasePage.java`):** Khi chạy ở chế độ `HEADLESS_MODE=FALSE` (`DEMO_SPEED_MS=450`), trình duyệt Chrome/Edge mở tối đa hóa, `JavascriptExecutor` gắn thanh banner `#selenium-live-banner` ở mép trên (`[TC-...] Mô tả bước`), con trỏ chuột ảo `#selenium-virtual-cursor` bay tới từng phần tử, hiệu ứng gợn sóng xanh khi click, viền đỏ `3px solid #ef4444` quanh ô đang thao tác và gõ chữ từng ký tự để người xem theo dõi rõ ràng từng thao tác bấm nút, điền form và kết quả hiển thị.
* **Cookie Auto-Refresh (`CookieSessionManager.java`):** Trong lượt chạy đầu tiên (hoặc khi xóa file trong `test/cookies/`), `AUTH_COOKIE_MODE=MANUAL_FIRST_THEN_COOKIE` mở trang đăng nhập để người test thao tác nhập tay (nhằm giữ an toàn mật khẩu và hỗ trợ đổi tài khoản bất kỳ lúc nào), sau đó tự động trích xuất Token + Cookie lưu vào `cookies/student_session.json`, `cookies/employer_session.json`, `cookies/admin_session.json`. Từ lần chạy thứ hai trở đi, Selenium tự nạp lại vào `localStorage`, `sessionStorage` và `driver.manage().addCookie()` (kèm làm mới phiên nếu cần) nên có thể chạy liên tục nhiều đợt không bị mất phiên hoặc văng đăng xuất giữa chừng.
* **Lưu ý về Kiến trúc POM Routing:** Cột `POM_Method` trong Excel ghi tên **Sub-Page logic theo chức năng màn hình** (VD: `StudentCvPage.uploadPreviewDefaultReplaceAndDeleteCv()`, `EmployerAtsPage.switchBetweenKanbanGridListModes()`, `[HttpClient API] ...`) giúp cả người test tay lẫn kỹ sư Automation nhận diện ngay phân hệ. Trong Java, `PartimeAutomationRunnerTest.java` định tuyến theo tiền tố `TC_ID` vào 4 lớp POM thực tế kế thừa `BasePage`: `StudentPage`, `EmployerPage`, `AdminPage` và `CrossRoleAndApiHelper`.

### 1.4. [Thêm 20/11/2026] Tầng test Python gọi thẳng code Backend (`test/python/`)
* **Vì sao thêm:** các "Unit Test" Java cũ chỉ kiểm tra regex/công thức viết lại ngay trong file test nên luôn PASS dù web sai. Test Python `import` trực tiếp `Backend/src` và gọi API thật qua Flask test client.
* **An toàn dữ liệu:** `_base.py` ép `MONGO_URI` về địa chỉ không tồn tại nên Backend tự chuyển sang kho dữ liệu RAM (3 tài khoản mẫu); không đọc/ghi MongoDB Atlas, không gọi Render, không gửi email (hàm gửi OTP được giả lập). Nhờ vậy tự động hóa được cả các thao tác trước đây phải để `Run_Mode=NO` vì sợ hỏng dữ liệu thật (khóa/xóa user, duyệt/từ chối GPKD, ẩn tin, xóa danh mục, thông báo hàng loạt).
* **Quy mô:** [Sửa 21/11] 64 test = 10 Unit + 43 Integration (API) + 11 test đối chiếu tài liệu (`test_doi_chieu_tai_lieu.py`, tên theo mã TC/BR; 10 đang FAIL = 10 bug, danh sách ở `test/python/BUG_LOG.md`).
* **Liên kết với Excel:** sheet `TestCases_Python` liệt kê từng test ↔ TC/FR; các dòng trong 3 sheet Role có `POM_Method` dạng `[UnitTest][PyTest] <tên test>` sẽ được Java runner gọi sang Python và ghi PASS/FAIL như các ca khác.
* **Chạy:** `cd test` → `run_python_tests.bat` (hoặc `python -X utf8 python/run_python_tests.py --excel`).

---

## 2. THỐNG KÊ ĐỊNH LƯỢNG 251 TEST CASES THEO ROLE × CẤP ĐỘ × LOẠI KỊCH BẢN

Kết quả thực thi trực tiếp trên hệ thống Deploy Render (`https://parttime-css0.onrender.com/`):

### 2.1. Phân bổ theo Vai trò & Trạng thái Chạy (lần chạy 20/11 TRƯỚC khi rà soát)
> **Lưu ý 20/11:** Bảng dưới giữ nguyên để đối chiếu lịch sử. Sau khi rà soát: 255 TC, `Run_Mode` 179 YES / 76 NO; các dòng đã sửa được xóa kết quả cũ (ô tô vàng, cột `Ghi_Chu_Sua_20_11`) và cần chạy lại. Các dòng trỏ vào bug Backend (TC-SV-013, 061, 068, TC-NTD-008, TC-QTV-029, 050) sẽ FAIL cho tới khi Backend được sửa.
| Vai trò (Sheet) | Tổng TC | `Run_Mode=YES` (Selenium/API/Unit) | `Run_Mode=NO` (Manual / Clone / JMeter) | Auto PASS | Auto FAIL | `NOT RUN` (Chờ Manual/Clone) | Tỷ lệ Auto chạy đạt trên tập `YES` |
|---|---:|---:|---:|---:|---:|---:|---:|
| **Sinh viên** (`TC-SV-001..087`) | **87** | 65 | 22 | **65** | **0** | 22 | **100%** (65/65) |
| **Nhà tuyển dụng** (`TC-NTD-001..092`) | **92** | 64 | 28 | **64** | **0** | 28 | **100%** (64/64) |
| **Quản trị viên** (`TC-QTV-001..072`) | **72** | 48 | 24 | **48** | **0** | 24 | **100%** (48/48) |
| **TỔNG HỆ THỐNG** | **251** | **177** | **74** | **177** | **0** | **74** | **100%** (177/177), **0 ảnh lỗi** |

### 2.2. Ma trận Phân bổ theo 4 Cấp độ (`Test_Level`) & 6 Loại Kịch bản (`Test_Type`)
| Phân loại | Sinh viên | Nhà tuyển dụng | Quản trị viên | Tổng cộng | Tỷ lệ |
|---|---:|---:|---:|---:|---:|
| **Cấp độ 1: Unit Test** (Kiểm thử đơn vị logic/regex/tính toán) | 8 | 9 | 6 | **23** | 9.2% |
| **Cấp độ 2: Integration Test** (Liên thông phiên, Socket, Upload->DB, E2E nhiều role) | 16 | 17 | 14 | **47** | 18.7% |
| **Cấp độ 3: API / Web Service Test** (`HttpClient` kiểm tra HTTP 200/201/400/401/403/404/409) | 6 | 10 | 10 | **26** | 10.4% |
| **Cấp độ 4: System / GUI Test** (Selenium thao tác trình duyệt thực tế & UI) | 57 | 56 | 42 | **155** | 61.8% |
| *Sau sửa 20/11 (Test_Level):* | *Unit 5 / Int 17 / API 6 / GUI 60* | *Unit 5 / Int 18 / API 11 / GUI 61* | *Unit 6 / Int 14 / API 10 / GUI 42* | *Unit 16 / Int 49 / API 27 / GUI 163* | *(255 TC)* |
| **Loại 1: Happy Path Testing** (Luồng nghiệp vụ chuẩn thành công) | 37 | 39 | 28 | **104** | 41.4% |
| **Loại 2: Negative Testing** (Ngoại lệ, nhập sai, chặn quyền, khóa thao tác) | 26 | 27 | 23 | **76** | 30.3% |
| **Loại 3: UI / Responsive Testing** (Bố cục, 4 màn hình, tooltip, chuẩn chữ, thứ tự nút) | 12 | 10 | 8 | **30** | 12.0% |
| **Loại 4: Regression Testing** (Kiểm thử hồi quy, liên thông, tổ hợp ngẫu nhiên) | 5 | 6 | 5 | **16** | 6.4% |
| **Loại 5: Smoke / Sanity Testing** (Các luồng sống còn khởi động/xác thực/chính) | 5 | 5 | 5 | **15** | 6.0% |
| **Loại 6: Performance / Load Testing** (Đo thời gian tải trang/Excel & kịch bản tải JMeter) | 2 | 5 | 3 | **10** | 4.0% |

---

## 3. LỘ TRÌNH KỊCH BẢN TỪ DỄ → KHÓ & LUỒNG ĐÚNG → LUỒNG SAI (ÁNH XẠ `TC_*` ↔ `FR.xlsx`)

Để người tiếp nhận dễ đọc, kiểm thử và bảo trì, 251 Test Cases được sắp xếp thành **4 bậc độ khó tăng dần**, trong đó mỗi phân hệ luôn có cặp **Luồng Đúng (Happy Path / Smoke)** đi trước và **Luồng Sai (Negative / Security Guard)** đi kèm đối xứng:

### 3.1. Bậc 1 (Dễ): Smoke Public, Unit Validation Logic & Giao diện Thuần UI
* **Đang test gì?** Mở trang Khách (`?guest=true`), kiểm tra Header/Footer/Cẩm nang an toàn, đếm đủ 10 danh mục Sidebar, Typography `Be Vietnam Pro`, không vỡ layout trên 4 kích thước (`1920px`, `1366px`, `820px`, `430px`) và 23 hàm Unit Test kiểm chứng quy tắc dữ liệu bằng Java thuần (`CrossRoleAndApiHelper.runUnitValidationSuite()`).
* **Mã Test Case tiêu biểu:**
  * **Luồng Đúng (Happy / Smoke / UI):** `TC-SV-002` (Banner Khách), `TC-SV-021` (Modal Cẩm nang `"Đã Hiểu"`), `TC-SV-022` (10 menu Sidebar + thu gọn), `TC-SV-025..026` (Trang chủ SV), `TC-SV-077..078` (Responsive 4 thiết bị + Typography), `TC-SV-014, 049, 051, 057, 061, 068, 083` (Unit Test: Mật khẩu 5 điều kiện, CV Snapshot bất biến, Export `.xls` BOM, Thu nhập ca, Magic `%PDF-`, SĐT `^0\d{9}$`, Search không dấu + Quận 1), `TC-NTD-001, 018..020, 025, 040, 054, 055, 068, 087`, `TC-QTV-006, 007, 011, 012, 015, 043, 050, 060, 067, 068` (Unit Test: Dashboard lọc 2026 `@gmail.com`, Tính lại điểm sao bỏ bài ẩn, PBKDF2 `100.000` vòng & JWT `86.400s`, 16 Audit Action codes & cascade collections).
  * **Luồng Sai (Negative):** `TC-SV-001` (Khách bấm Lưu tin bị chặn đẩy sang Login), `TC-SV-003..004` (Đăng ký sai `@yahoo.com`, SĐT ngắn, mật khẩu yếu), `TC-SV-006` (Quên mật khẩu email Admin bị chặn), `TC-SV-013` (Unit regex `@gmail.com`), `TC-NTD-002..003, 008, 030` (Sai MST 10/13 số, GPKD không phải `.pdf`), `TC-QTV-001, 039` (Chặn non-Admin vào `/admin`, quét biến thể không dấu `>= 4` ký tự `datcocngay`).

### 3.2. Bậc 2 (Trung bình): Xác thực Cookie & Luồng CRUD Nghiệp vụ Nội bộ Từng Role
* **Đang test gì?** Đăng nhập lưu/nạp Cookie (`TC-SV-007`, `TC-NTD-005`, `TC-QTV-002`), sửa `AccountModal` kiểm tra đồng bộ sang trang Hồ sơ, tìm kiếm đa từ không dấu & lọc nhiều Quận/Huyện, tải CV PDF lên GridFS và đọc trong `<iframe>`, CRUD Tin tuyển dụng sạch (`[AutoTest]`) & dọn dẹp 100%, chuyển đổi 3 chế độ ATS, lọc 5 chiều Dashboard 2026 & CRUD Master Data.
* **Ánh xạ Luồng Đúng ↔ Luồng Sai theo từng Role:**

| Role | Phân hệ nghiệp vụ (`FR.xlsx`) | Luồng Đúng (Happy Path / Smoke) | Luồng Sai / Ngoại lệ (Negative) |
|---|---|---|---|
| **Sinh viên** | `1.2` Tài khoản & Header | `TC-SV-015` (Sửa AccountModal & kiểm tra lưu bền vững), `TC-SV-018` (Đăng xuất xóa token + tự nạp Cookie), `TC-SV-019, 020, 023, 087` | `TC-SV-016` (Đổi MK không khớp báo lỗi đỏ), `TC-SV-017` (Mở Hủy TK -> bấm giữ lại) |
| **Sinh viên** | `1.4–1.6` Tìm việc, Đã lưu, Tiến độ | `TC-SV-028, 029, 031..035, 037, 038, 085, 086` (Tìm không dấu, 5 tiêu chí + nhiều Quận ngẫu nhiên, Xem Slide-over JD + Hồ sơ DN, Saved Jobs) | `TC-SV-030` (Từ khóa không khớp -> Empty state), `TC-SV-039, 041, 042` (Không trùng bookmark, 7 nút lọc Tiến độ + Export Excel) |
| **Sinh viên** | `1.7–1.11` Ca làm, Kho CV, Hồ sơ, Chat | `TC-SV-052, 059` (Upload `AutoTest_CV_Sample.pdf` -> `switchTo().frame()` đọc PDF -> Tải về -> Đặt mặc định -> Xóa sạch), `TC-SV-065, 066, 070, 073, 074, 076` | `TC-SV-060` (Chặn tải `AutoTest_Invalid.txt`), `TC-SV-064` (Chặn SĐT `1234567890` không bắt đầu `0`), `TC-SV-075` (Kiểm tra khóa phòng `CHỈ ĐỌC` & filter file đính kèm) |
| **Nhà tuyển dụng** | `2.2–2.4` Header, Dashboard, Hồ sơ DN & GPKD | `TC-NTD-012, 015..017, 019, 021..024, 026..028` (Xem 3 KPI, Phễu, mở Modal GPKD đọc `<iframe>` & tải PDF, đồng bộ tên công ty) | `TC-NTD-013` (Sai xác nhận MK), `TC-NTD-014` (Mở & đóng Modal Hủy TK an toàn) |
| **Nhà tuyển dụng** | `2.5` Đăng & Quản lý tin | `TC-NTD-036..038, 091` (Tạo tin `[AutoTest]` ngẫu nhiên -> Kiểm tra Công khai -> Bật/Tắt -> Sửa lương 40k -> Xóa sạch) | `TC-NTD-034` (Gõ từ nhạy cảm bật `BannedKeywordWarning` -> Hủy), `TC-NTD-035` (Kiểm tra kẹp khung lương `15k–200k`) |
| **Nhà tuyển dụng** | `2.6–2.11` ATS, Lịch PV, Ca làm, Đánh giá, Chat | `TC-NTD-045..049, 057..059, 062, 064, 065, 074, 075, 076, 090, 092` (ATS 3 chế độ `//h4` 4 cột + căn hàng Y-aligned nút, Lịch PV 2 chế độ, Xác nhận ca tuần & Export Excel, Tạo tin nhắn mới) | `TC-NTD-063` (Kiểm tra nút chốt nhận đủ người / kết thúc đợt), `TC-NTD-069` (Mở modal đánh giá kiểm tra sao/nhận xét -> Hủy) |
| **Quản trị viên** | `3.1–3.4` Admin Bảo mật, Dashboard, User, GPKD | `TC-QTV-005, 008, 013, 014, 016, 017, 024..026, 070, 071` (Lọc 5 chiều 2026 & Export `.xls`, Soi CV/GPKD `DocumentViewerModal` `<iframe>`, Cô lập phiên đa tab) | `TC-QTV-003` (Không có nút Tự hủy tài khoản Admin), `TC-QTV-004` (Chặn đổi MK Admin không khớp) |
| **Quản trị viên** | `3.5–3.10` Kiểm duyệt tin, Từ cấm, Đánh giá, Master Data, Khiếu nại, Audit Log | `TC-QTV-030, 031, 037, 041, 042, 046, 047, 051, 052, 056` (Lọc 3 pill kiểm duyệt tin, CRUD Master Data `[AutoTest]` & Xóa ConfirmDialog sạch, Lọc 4 tab Khiếu nại, Xác nhận đủ `>=14` nhóm Audit Log) | `TC-QTV-036` (Thử sửa inline từ cấm -> Hủy giữ nguyên), `TC-QTV-048` (Thử nhập trùng danh mục), `TC-QTV-057` (Bấm Gửi Broadcast rỗng bị HTML5/UI chặn) |

### 3.3. Bậc 3 (Khó): Kiểm thử Dịch vụ API / RBAC Đa Tầng (`java.net.http.HttpClient`)
* **Đang test gì?** Dùng trực tiếp Token thật đọc từ Cookie của 3 Role gửi HTTP request tới API Production Render mà không qua giao diện, phát hiện mọi lỗ hổng vượt quyền hoặc sai validate tầng Backend:
  * **Luồng Đúng API (`200`/`201`):** `TC-SV-050` (GET applications + PUT/DELETE giả `404`), `TC-SV-063` (POST tạo CV -> PUT default -> PUT thay thế -> khôi phục & DELETE sạch), `TC-SV-080` (4 endpoint cốt lõi SV), `TC-NTD-033` (Reset Logo/Cover & khôi phục tức thì), `TC-NTD-081` (4 endpoint cốt lõi NTD), `TC-NTD-084` (Reviews + `/upload` chặn `.txt` `400` + đọc GPKD `/api/files`), `TC-QTV-035` (GET jobs & `approve-moderation` giả `404`), `TC-QTV-045, 062` (6 GET endpoints Admin), `TC-QTV-055` (Đọc nguyên văn **Chat Gốc chưa che `***`** qua `/api/admin/reports/<id>/chat-history` = `200`).
  * **Luồng Sai / Bảo mật API (`400`/`401`/`403`/`404`/`409`):** `TC-SV-058` (`shift-status` sai = `400`), `TC-SV-072` (POST review giả = `404`), `TC-SV-081` (`401` không token, SV gọi Admin/NTD = `403`), `TC-NTD-011` (`send-otp register` email trùng = `409 Conflict`), `TC-NTD-066` (Chấm công `shift_status` sai & đơn chưa trúng tuyển = `400`), `TC-NTD-082` (NTD gọi Admin/SV = `403`, xóa job lạ = `404`), `TC-NTD-083` (`POST /jobs` thiếu tiêu đề & sai lương = `400`), `TC-QTV-010` (`send-otp` email Admin = `403`), `TC-QTV-040` (Tạo từ khóa tạm -> PUT trùng `"đặt cọc"` = `409 Conflict` -> DELETE sạch), `TC-QTV-063` (SV/NTD gọi `/admin/*` = `403`, Admin tự ban/tự xóa chính mình = `400`), `TC-QTV-064` (`400`/`404` ID giả).

### 3.4. Bậc 4 (Rất khó): Kịch bản E2E Liên thông 2–3 Vai trò Đa Tab & Tập `74` Ca `Run_Mode=NO`
* **3 Siêu kịch bản E2E Đa Tab Đang Chạy Tự động (`Run_Mode=YES`, PASS 100%):**
  1. **`TC-SV-079` (`CrossRoleE2ETests.fullJobLifecycleE2E`):** Mở song song Tab 1 (NTD) & Tab 2 (SV) -> NTD đăng tin ngẫu nhiên `[AutoTest]` -> SV tìm đúng tin & nộp CV Mặc định -> NTD mở ATS duyệt SV `Trúng tuyển` -> NTD chuyển `Hoàn thành` mở khóa đánh giá -> SV & NTD cùng chấm điểm 5 sao thật -> Hệ thống tự xóa sạch đánh giá, đơn và tin `[AutoTest]` (**0 dữ liệu rác trên Render**).
  2. **`TC-NTD-052` (`CrossRoleE2ETests.employerRejectApplicantLocksChatAndSendsReason`):** NTD đăng tin `[AutoTest]` -> SV ứng tuyển -> NTD bấm `Từ chối` kèm lý do cụ thể -> Xác minh UI Chat bị khóa `CHỈ ĐỌC` & API gửi tin trả `403` -> SV thấy trạng thái `Chưa phù hợp` kèm đúng lý do -> Tự động dọn sạch.
  3. **`TC-QTV-072` (`CrossRoleE2ETests.adminHideSensitiveJobSyncsToStudent`):** Mở 3 Tab song song (**NTD -> QTV -> SV**) -> NTD đăng tin chứa từ khóa nhạy cảm `[AutoTest]` (bị giữ `Chờ kiểm duyệt`) -> QTV mở `Kiểm duyệt tin tuyển dụng` kiểm tra chi tiết & bấm `Ẩn tin vi phạm` -> Tab SV tìm không còn thấy tin đó -> Tự động xóa dọn sạch tin & thông báo thử nghiệm.
* **Giải thích rành mạch 74 Test Case để `Run_Mode=NO` (`NOT RUN`) cho Người Tiếp Nhận:**
  Nhóm `74` ca `NO` hoàn toàn **không phải chức năng lỗi**, mà được tách riêng có chủ đích để bảo vệ tài khoản thật trên Production Render, gồm 5 nhóm:
  1. *Đăng ký OTP 60s thật / Quên MK OTP / Đổi MK thật / Tự hủy tài khoản thật:* `TC-SV-008, 009, 024`, `TC-NTD-006, 009`, `TC-QTV-009` (yêu cầu hộp thư Gmail thật nhận mã 60s hoặc sẽ làm đổi/xóa mất tài khoản test chính).
  2. *Khóa/Mở/Xóa tài khoản User, Từ chối/Tải lại GPKD PDF, Duyệt/Ẩn Review thật trên CSDL thật:* `TC-SV-011`, `TC-NTD-007, 010, 031, 044, 056, 073`, `TC-QTV-018..023, 027..029, 032..034, 038, 044` (yêu cầu tài khoản **clone phụ** đang bị khóa / GPKD `pending` / review `is_hidden=true` hoặc thao tác sẽ ghi vĩnh viễn vào `audit_logs`).
  3. *Upload ảnh đại diện/logo thật, Thay thế CV trên UI, Xóa đơn thật, Chấm công/Đánh giá đơn thật ngoài E2E, Broadcast toàn sàn:* `TC-SV-043..048, 054..056, 062, 067, 069, 071`, `TC-NTD-029, 032, 039, 041..043, 050, 051, 053, 060, 061, 067, 070, 071, 077, 078`, `TC-QTV-049, 053, 054, 058, 059, 061` (cần dữ liệu clone/2–3 máy thực WebRTC hoặc tránh gửi thông báo Broadcast hàng loạt tới user thật).
  4. *Tích hợp Python/Backend Unit-Socket cũ & Load Test JMeter 50–200 CCU:* `TC-SV-012, 082, 084`, `TC-NTD-085, 086, 088, 089`, `TC-QTV-065, 066, 069` (chạy bằng JMeter / kịch bản tải riêng).

---

## 4. ĐỐI CHIẾU TOÀN BỘ 57 LỆNH SELENIUM WEBDRIVER JAVA (`PLT SOLUTIONS PDF`) THEO 3 TẦNG KIẾN TRÚC

### 4.1. Hiểu đúng Vai trò của Selenium giữa Frontend – Backend API – Data
> **Nguyên tắc quan trọng cho người test tiếp theo:** Selenium WebDriver là công cụ **điều khiển trình duyệt (Frontend UI)**, **KHÔNG trực tiếp kết nối vào MongoDB hay gọi Backend Python**. Do đó, trong kiến trúc 3 tầng của `PARTIME.VN`:
> * **Tầng Frontend UI (DOM, Navigation, Select, Window, Frame):** Toàn bộ 40+ lệnh thao tác/kiểm tra giao diện của bộ 57 lệnh PLT Solutions chạy trực tiếp ở đây.
> * **Tầng Data & Phiên (Session/Cookie/Snapshot/Excel):** Nhóm lệnh **Cookie (`getCookies`, `getCookieNamed`, `addCookie`, `deleteCookie`, `deleteCookieNamed`, `deleteAllCookies`)** kết hợp `JavascriptExecutor` đọc/ghi `localStorage` & `sessionStorage` để nối dữ liệu phiên giữa trình duyệt và ổ đĩa (`cookies/*.json`), còn quy tắc nghiệp vụ dữ liệu (PBKDF2, Regex, Clone Snapshot, Cascade, `.xls`) được kiểm chứng bởi 23 hàm Unit Test Java trong `CrossRoleAndApiHelper.runUnitValidationSuite()`.
> * **Tầng Backend API & Realtime:** Vì Selenium không tự gửi HTTP request độc lập ngoài trình duyệt, `CrossRoleAndApiHelper.runSafeApiAndRbacSuite()` tái sử dụng chính **JWT Token trích từ Cookie phiên** truyền vào **`java.net.http.HttpClient`** (`BasePage.httpWithToken()`) để kiểm tra 26 kịch bản REST API & phân quyền RBAC trên Render. *(Lưu ý: `pom.xml` có khai báo thêm dependency `rest-assured`, nhưng mã nguồn hiện hành thống nhất dùng `HttpClient` chuẩn của JDK 17).*

### 4.2. Bảng Toàn Bộ 57 Lệnh Truy Vấn WebDriver Java (`PLT SOLUTIONS PDF`) & 10 Locator Strategies

#### A. 10 Chiến lược Định vị Phần tử (`By.*` — Trang 2 PDF)
Trong dự án đang tận dụng chủ yếu `By.xpath(...)`, `By.cssSelector(...)`, `By.id(...)`, kết hợp `contains()`, `normalize-space()`, `ancestor::`, `following-sibling::` trong `BasePage`, `StudentPage`, `EmployerPage`, `AdminPage` để bám sát TailwindCSS và text tiếng Việt trên DOM React mà không phụ thuộc ID sinh ngẫu nhiên.

#### B. Nhóm 1: Điều hướng & Thông tin Trình duyệt (Lệnh #1–#10, #35–#37, #48–#49)
| STT | Lệnh chuẩn PLT PDF | Tầng tác động | Vị trí sử dụng chính trong Java POM | Mục đích & Chú thích cho người tiếp nhận |
|---:|---|---|---|---|
| 1 | `driver.get(String url)` | Frontend / Nav | `BasePage.java:232,238,249,269`; `CookieSessionManager.java:239,261,348,350` | Mở URL cổng SV/NTD/QTV trên Render (dùng qua `openUrlIfDifferent` để tránh F5 thừa giữa các TC cùng Portal). |
| 2 | `driver.navigate().to(url)` | Frontend / Nav | `BasePage.java:275, 1038, 1040` (`exerciseNavigationHistorySafe`) | Điều hướng lịch sử trình duyệt giữ nguyên back/forward stack trong sub-tab kiểm thử. |
| 3 | `driver.navigate().forward()` | Frontend / Nav | `BasePage.java:277, 1044` | Tiến tới trang kế tiếp trong lịch sử điều hướng SPA. |
| 4 | `driver.navigate().back()` | Frontend / Nav | `BasePage.java:276, 1042` | Quay lại trang trước đó trong sub-tab kiểm thử (`TC-SV-004`). |
| 5 | `driver.navigate().refresh()` | Frontend / Nav + Data Sync | `BasePage.java:278, 1046`; `CookieSessionManager.java:250,385`; `CrossRoleAndApiHelper.java` (9 chỗ) | Tải lại trang sau khi tiêm Cookie/Token vào `localStorage` hoặc để kiểm chứng dữ liệu bền vững sau F5 trên Render trong E2E 3 Tab. |
| 6 | `driver.getTitle()` | Frontend | `BasePage.java:279`; `EmployerPage.java:243` (`measureDashboardLoadTime`) | Xác nhận trang đã tải xong tiêu đề HTML hợp lệ trên Render. |
| 7 | `driver.getCurrentUrl()` | Frontend / Security | `BasePage.java:235,281,803`; `StudentPage.java`; `EmployerPage.java`; `AdminPage.java` | Kiểm tra định tuyến URL `/login`, `/employer`, `/admin` và tránh tải lại URL trùng lặp. |
| 8 | `driver.getPageSource()` | Frontend DOM | 40+ chỗ across `StudentPage`, `EmployerPage`, `AdminPage` | Đọc nội dung HTML trang để assert có `"AutoTest_CV_Sample.pdf"`, `"***"`, `"CHỈ ĐỌC"`, tên người dùng... |
| 9 | `driver.close()` | Browser Window | `BasePage.java:1087` (`safeCloseSubTab`); `CrossRoleAndApiHelper.java:1335` | Đóng Tab phụ an toàn (**chỉ gọi khi `handles.size() > 1`** để không giết nhầm phiên Chrome chính). |
| 10 | `driver.quit()` | Browser Lifecycle | `BasePage.java:1115` (`quitDriver`); `PartimeAutomationRunnerTest.java:146,175` | Đóng sạch tiến trình ChromeDriver cuối `@AfterClass` hoặc khi phục hồi phiên bị ngắt. |
| 35 | `manage().timeouts().implicitlyWait()` | Wait / Frontend | `BasePage.java:88, 293, 297` | Giới hạn **4 giây** (`IMPLICIT_WAIT_SEC`) khi tìm 1 element và tạm đặt về `0s` trong `findAll()` để quét danh sách tức thì. |
| 36 | `manage().timeouts().pageLoadTimeout()` | Wait / Network | `BasePage.java:89` | Giới hạn **30 giây** (`PAGE_LOAD_TIMEOUT_SEC`) phù hợp độ trễ mạng cloud Render. |
| 37 | `manage().timeouts().scriptTimeout()` *(cũ: `setScriptTimeout`)* | Wait / JS | `BasePage.java:90` | Cấu hình timeout 30s cho các tập lệnh `JavascriptExecutor` (Selenium 4 đổi tên `setScriptTimeout` -> `scriptTimeout`). |
| 48 | `driver.findElement(By)` | Frontend DOM | `BasePage.java:287` (`find()`, 59+ vị trí) | Tìm đúng 1 phần tử DOM (nếu thiếu sẽ ném `NoSuchElementException`). |
| 49 | `driver.findElements(By)` | Frontend DOM | `BasePage.java:295` (`findAll()`, 208+ vị trí) | Tìm danh sách phần tử an toàn với wait=0s để kiểm tra điều kiện có/không xuất hiện Modal, lỗi, danh sách thẻ. |

#### C. Nhóm 2: Tương tác Phần tử, Form & Thuộc tính Giao diện (Lệnh #11–#23)
| STT | Lệnh chuẩn PLT PDF | Tầng tác động | Vị trí sử dụng chính trong Java POM | Mục đích & Chú thích cho người tiếp nhận |
|---:|---|---|---|---|
| 11 | `el.clear()` | Frontend Form | `EmployerPage.java:116,118`; `StudentPage.java:538–540` | Xóa ô mật khẩu thường; riêng input React controlled có `clearReactInput()` (`CONTROL+a` + `BACK_SPACE`) để kích hoạt `onChange`. |
| 12 | `el.sendKeys(...)` | Frontend Form / Upload | `BasePage.java:335..351`; `StudentPage.java`; `EmployerPage.java`; `AdminPage.java`; `CrossRoleAndApiHelper.java` | Gõ từng ký tự human-typing, gửi phím `Keys.ENTER`, `Keys.BACK_SPACE` và **đẩy đường dẫn file tuyệt đối** vào `<input type="file">` (upload PDF). |
| 13 | `el.click()` | Frontend DOM | 43+ vị trí across `BasePage`, `StudentPage`, `EmployerPage`, `AdminPage`, `CrossRoleAndApiHelper` | Click chuột thật sau khi cuộn giữa màn hình, di chuyển con trỏ ảo tới nút và tạo hiệu ứng gợn sóng. |
| 14 | `el.isDisplayed()` | Frontend UI Check | 28+ vị trí across các Page classes | Kiểm tra Modal/Alert/Bảng đã mở hay tắt hẳn (`closeDialogAndAssertGone`). |
| 15 | `el.isEnabled()` | Frontend UI Security | `BasePage.java`; `StudentPage.java`; `AdminPage.java` | Kiểm tra ô Email trong `AccountModal` bị khóa (`disabled`) không cho sửa (`TC-SV-015`). |
| 16 | `el.isSelected()` | Frontend Form State | `BasePage.java:716`; `StudentPage.java:135` (`TC-SV-004`) | Kiểm tra trạng thái tích chọn của `<input type="checkbox">` `"Ghi nhớ đăng nhập"`. |
| 17 | `el.submit()` | Frontend Form *(Bọc có kiểm soát)* | `BasePage.java:397` (`demoSubmit`) | Khai báo wrapper trong `BasePage`; trong luồng React 18 cố tình dùng `click()`/`Keys.ENTER` trên nút submit thay cho `form.submit()` để tránh reload trình duyệt làm mất SPA state. |
| 18 | `el.getText()` | Frontend Text Assert | 19+ vị trí (`BasePage`, `StudentPage`, `AdminPage`, `CrossRoleAndApiHelper`) | Lấy nội dung thông báo lỗi màu đỏ, nhãn nút, tên CV mặc định, tùy chọn dropdown. |
| 19 | `el.getTagName()` | Frontend DOM Audit | `BasePage.java:722, 951, 968`; `StudentPage.java:372` | Kiểm tra tên thẻ HTML khi audit layout (`TC-SV-034`) và thẻ đang focus (`activeElement`). |
| 20 | `el.getCssValue()` | Frontend Style / Typography | `BasePage.java:719`; `StudentPage.java:976–977` (`TC-SV-078`) | Đọc `font-family` (`Be Vietnam Pro`) và `font-size` kiểm chứng chuẩn typography. |
| 21 | `el.getAttribute()` | Frontend Attribute | 15+ vị trí (`BasePage`, `StudentPage`, `EmployerPage`) | Đọc `value`, `class`, `accept`, và `validationMessage` HTML5 native. |
| 22 | `el.getSize()` | Frontend Responsive Layout | `BasePage.java:720, 1062`; `StudentPage.java:370`; `AdminPage.java:258,260` | Đo chiều rộng thẻ job, chiều cao nút (`<= 56px`), và kiểm tra vùng chú thích biểu đồ `h-12` cố định không đổi chiều cao (`hBefore == hAfter`, `TC-QTV-012`). |
| 23 | `el.getLocation()` | Frontend Alignment | `BasePage.java:721, 1061` (`verifyActionRowButtonsSameLine`); `StudentPage.java:371` | Đo tọa độ `(X, Y)` kiểm chứng cụm nút bảng ATS Danh sách & Header Chat nằm trên **cùng 1 hàng ngang** (`|y - firstY| <= 14px`, `TC-NTD-049`, `TC-NTD-075`). |

#### D. Nhóm 3: Điều khiển Danh sách Thả xuống `Select` (Lệnh #24–#34)
| STT | Lệnh chuẩn PLT PDF | Tầng tác động | Vị trí sử dụng chính | Mục đích & Chú thích |
|---:|---|---|---|---|
| 24 | `selectByVisibleText()` | Frontend Dropdown | `BasePage.java:403..418`; `StudentPage.java:342`; `AdminPage.java:592` | Chọn Tỉnh/Thành (`"TP. Hồ Chí Minh"`), tùy chọn Audit Log bằng nhãn hiển thị tiếng Việt. |
| 26 | `selectByIndex()` | Frontend Dropdown | `BasePage.java:436, 487`; `CrossRoleAndApiHelper.java` | Chọn ngẫu nhiên ngành nghề/địa điểm/năm khác `index=0` để tăng độ phủ dữ liệu mỗi lần chạy (`TC-SV-086`, `TC-NTD-091`, `TC-QTV-071`). |
| 28 | `selectByValue()` | Frontend Dropdown | `BasePage.java:452`; 29+ chỗ across 3 Role | Chọn giá trị `PaginationBar` (`"10"`, `"20"`), trạng thái (`"pending"`, `"all"`, `""`). |
| 30 | `getAllSelectedOptions()` | Frontend Dropdown Assert | `BasePage.java:935` (`verifySelectSingleAndSelectedOptions`) | Kiểm tra danh sách option đang được chọn sau khi lọc (`TC-SV-032`, `TC-QTV-056`). |
| 31 | `getFirstSelectedOption()` | Frontend Dropdown Assert | `BasePage.java:934` | Đọc nhãn option hiện hành của `<select>` (xác minh Reset hoặc chọn Tỉnh). |
| 33 | `getOptions()` | Frontend Data Sync Check | `BasePage.java:432, 471`; `StudentPage.java:302`; `AdminPage.java:585` | Đếm số danh mục Master Data đồng bộ sang SV (`>= 4`), đủ `>= 14` tùy chọn lọc Audit Log (`TC-QTV-056`). |
| 34 | `isMultiple()` | Frontend Guard Check | `BasePage.java:925, 936` | Kiểm chứng `<select>` trên web là **single-select (`isMultiple() == false`)**. |
| 25, 27, 29, 32 | `deselectByVisibleText()`, `deselectByIndex()`, `deselectByValue()`, `deselectAll()` | Frontend *(N/A Guarded)* | `BasePage.java:926–930` (bọc trong `if (sel.isMultiple())`) | **Thực tế N/A:** Frontend dùng multi-select chip Quận/Huyện tùy biến thay cho `<select multiple>`; Selenium sẽ báo `UnsupportedOperationException` nếu gọi trực tiếp trên `<select>` đơn, nên được bảo vệ có điều kiện trong `verifySelectSingleAndSelectedOptions()`. |

#### E. Nhóm 4: Cửa sổ Responsive & Quản lý Phiên Cookie (Lệnh #38–#47)
| STT | Lệnh chuẩn PLT PDF | Tầng tác động | Vị trí sử dụng chính | Mục đích & Chú thích |
|---:|---|---|---|---|
| 38 | `manage().window().maximize()` | Browser Window | `BasePage.java:86, 743, 752, 1023` | Phóng to toàn màn hình khi chạy trình chiếu có cửa sổ (`HEADLESS_MODE=FALSE`). |
| 39 | `manage().window().fullscreen()` | Browser Window | `BasePage.java:1021` (`verifyWindowPositionAndFullscreen`) | Chuyển sang chế độ toàn màn hình và khôi phục `maximize()` ở `TC-QTV-007` (khi headed). |
| 40 | `manage().window().getPosition()` | Browser Window | `BasePage.java:1018` | Lấy tọa độ `(x, y)` gốc của cửa sổ trình duyệt trước khi thao tác vị trí. |
| 41 | `manage().window().setPosition()` | Browser Window | `BasePage.java:1020` | Đặt vị trí cửa sổ `(0, 0)` kiểm soát hiển thị đa màn hình. |
| 42 | `manage().window().setSize()` | Frontend Responsive | `BasePage.java:725, 736, 745, 754`; `AdminPage.java:104..151` | Thay đổi viewport đúng 4 thiết bị `1920x1080`, `1366x768`, `820x1180`, `430x932` và kiểm tra `scrollWidth <= clientWidth` *(Lưu ý: Chrome desktop Windows tự giới hạn chiều rộng tối thiểu ~494–500px khi không bật mobile emulation CDP)*. |
| 43 | `manage().deleteAllCookies()` | Data / Session | `BasePage.java:913, 999` (`exerciseClearAllCookiesWithRestore`) | Xóa toàn bộ Cookie domain hiện tại trong bài test Khách `TC-SV-001`, sau đó khôi phục ngay bản sao lưu để không làm mất Cookie 3 Role đang dùng. |
| 44 | `manage().deleteCookie(Cookie)` | Data / Session | `BasePage.java:987` (`exerciseCookieDeleteCommandsSafe`) | Xóa đối tượng Cookie kiểm thử tạm (`partime_plt_probe_obj`) an toàn 100%. |
| 45 | `manage().deleteCookieNamed()` | Data / Session | `BasePage.java:988` | Xóa Cookie theo tên (`partime_plt_probe_named`) kiểm chứng API dọn Cookie. |
| 46 | `manage().getCookies()` | Data / Session | `BasePage.java:772, 914, 1001`; `CookieSessionManager.java:307` | Lấy toàn bộ Cookie hiện có từ trình duyệt để đóng gói ra JSON lưu trữ bền vững. |
| 47 | `manage().getCookieNamed()` | Data / Session | `BasePage.java:986, 990`; `CookieSessionManager.java:366, 369` | Kiểm chứng sự tồn tại của Cookie xác thực (`partime_cookie_token_<role>`) trước khi bỏ qua đăng nhập thủ công. |

#### F. Nhóm 5: Đa Tab, Frame PDF, Active Focus & Cảnh báo (Lệnh #50–#57)
| STT | Lệnh chuẩn PLT PDF | Tầng tác động | Vị trí sử dụng chính | Mục đích & Chú thích |
|---:|---|---|---|---|
| 50 | `driver.getWindowHandle()` | Multi-Tab | `BasePage.java:1035`; `StudentPage`; `EmployerPage`; `AdminPage`; `CrossRoleAndApiHelper` | Lưu ID Tab chính trước khi mở Tab phụ Khách / Auth hoặc Tab Role khác để quay về đúng chỗ. |
| 51 | `driver.getWindowHandles()` | Multi-Tab | `BasePage.java:1073, 1085`; `CrossRoleAndApiHelper.java:1332` | Kiểm tra trình duyệt còn sống (`isSessionAlive()`) và đếm tab đang mở. |
| 52 | `switchTo().activeElement()` | Frontend Focus/A11y | `BasePage.java:950, 966` | Kiểm tra phần tử đang giữ focus bên trong `<iframe>` PDF và khi kích hoạt `<ConfirmDialog />`. |
| 53 | `switchTo().alert()` | Frontend *(Zero Native Alert Guard)* | `BasePage.java:970` (`verifyZeroNativeAlertAndActiveFocus`) | Kiểm chứng quy chuẩn **Zero Native Dialogs**: gọi thử trong khối `try/catch (NoAlertPresentException)` để khẳng định web tuyệt đối không bật `window.alert/confirm/prompt` thô mà dùng `<ConfirmDialog />`. |
| 54 | `switchTo().defaultContent()` | Frontend Frame | `BasePage.java:953, 956` (`verifyPdfIframeNavigation`) | Thoát từ khung xem PDF `<iframe>` trong `<DocumentViewerModal />` về lại trang chính để bấm `Tải về` / `Đóng` (`TC-SV-059`, `TC-NTD-027`, `TC-QTV-017`, `TC-QTV-024`). |
| 55 | `switchTo().frame()` | Frontend Frame | `BasePage.java:948–949` | Chuyển ngữ cảnh WebDriver vào thẻ `<iframe src={previewUrl} />` của `DocumentViewerModal.jsx:231` kiểm chứng PDF CV / GPKD hiển thị thực tế. |
| 56 | `switchTo().parentFrame()` | Frontend Frame | `BasePage.java:952` | Trở về khung cha trực tiếp của `<iframe>` PDF trước khi thoát ra `defaultContent()`. |
| 57 | `switchTo().window()` | Multi-Tab E2E | `BasePage.java:1091, 1093`; `CrossRoleAndApiHelper.java` (18 chỗ) | Chuyển đổi qua lại trực tiếp giữa 2–3 tab (NTD <-> SV <-> QTV) trong các siêu kịch bản E2E `TC-SV-079`, `TC-NTD-052`, `TC-QTV-072`. |

> **API mở rộng ngoài danh sách 57 lệnh cơ bản được dùng thêm từ Selenium 4:** `switchTo().newWindow(WindowType.TAB)` (tạo tab mới cô lập), `manage().addCookie()` (tiêm Cookie đăng nhập lại), `Actions.moveToElement()` (rê chuột kích hoạt tooltip SVG & hover Chuông), `TakesScreenshot` (chụp `<TC_ID>_FAIL.png` khi lỗi) và `JavascriptExecutor` (tiêm Token + vẽ Banner/Cursor).

---

## 5. HƯỚNG DẪN VẬN HÀNH BÀN GIAO CHO NGƯỜI KIỂM THỬ TIẾP THEO

1. **Chạy trình chiếu trực quan đầy đủ (Headed Chrome — nhìn thấy rõ mọi thao tác trên Web):**
   ```powershell
   cd d:\Hoc\DH\N4\N4.HK01\Chuyende2\CDTN02-main\test
   .\run_selenium_tests.bat
   ```
   * Đọc tham số `HEADLESS_MODE=FALSE` & `DEMO_SPEED_MS=450` trực tiếp từ sheet `Config_Environment`. Kết thúc tự đồng bộ lại `Auto_Status`, `Auto_Log_Error` và biểu đồ `Overview_Summary`.
2. **Chạy kiểm tra nhanh không giao diện trước khi Push GitHub (Batch Headless ~3–5 phút):**
   ```powershell
   cd d:\Hoc\DH\N4\N4.HK01\Chuyende2\CDTN02-main\test
   $cp = python resolve_cp.py
   java -Dfile.encoding=UTF-8 -Dheadless=true -DdemoSpeedMs=60 -cp "target/test-classes;$cp" org.testng.TestNG testng.xml
   ```
3. **Cách Xóa Cookie để Nhập lại Tài khoản Thủ công ở Lần Chạy Đầu:**
   ```powershell
   Remove-Item d:\Hoc\DH\N4\N4.HK01\Chuyende2\CDTN02-main\test\cookies\*_session.json
   ```
   Sau khi xóa, bật `run_selenium_tests.bat`: tại `TC-SV-007`, `TC-NTD-005`, `TC-QTV-002`, hệ thống sẽ mở trình duyệt dừng chờ tối đa `120` giây để bạn gõ tay Email/Mật khẩu mới, sau khi đăng nhập thành công sẽ tự động đóng gói Cookie mới dùng cho hàng chục lần chạy tiếp theo.
4. **Thực hiện Manual Test Song hành trên cùng File Excel:**
   * Lọc cột `Test_Type` (VD: chỉ chạy `Smoke / Sanity` hoặc `Negative`) hoặc lọc `Run_Mode = NO` để test tay 74 kịch bản cần OTP thật / tài khoản clone / tải JMeter.
   * Đọc cột màu xanh lá (`Test_Scenario`, `Pre_Conditions`, `Test_Steps`, `Expected_Result`) -> thao tác trực tiếp trên Web -> chọn Dropdown cột `Manual_Status` (`PASS`/`FAIL`/`BLOCKED`/`NOT RUN`) -> Bảng 2 trong `Overview_Summary` tự nhảy số ngay tức thì.
