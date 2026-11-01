# TÀI LIỆU QUY TẮC NGHIỆP VỤ, ĐIỀU KIỆN RÀNG BUỘC & KỊCH BẢN KIỂM THỬ
## NỀN TẢNG TUYỂN DỤNG PARTIME.VN (CDTN02)
> **Mục đích:** Đặc tả tường minh toàn bộ quy tắc nghiệp vụ (Business Rules), ràng buộc dữ liệu (Integrity Constraints) và kịch bản kiểm thử (Test Scenarios / Acceptance Criteria) làm kim chỉ nam phát triển và đánh giá chất lượng phần mềm.

---

## PHẦN 1: TỔNG QUAN RÀNG BUỘC HỆ THỐNG

### 1.1. Ràng Buộc Định Danh & Phân Quyền Cốt Lõi (Core Authentication & RBAC)

| Mã Ràng Buộc | Tên Quy Tắc | Diễn Giải & Điều Kiện Bắt Buộc | Xử Lý Vi Phạm |
| :--- | :--- | :--- | :--- |
| **BR-AUTH-01** | **Ràng buộc 1 Email = 1 Role duy nhất** | **Mỗi địa chỉ Email thực chỉ được phép tồn tại với một vai trò (Role) duy nhất trên toàn hệ thống (hoặc Sinh viên, hoặc Nhà tuyển dụng, hoặc Quản trị viên).** Tuyệt đối cấm 1 email đăng ký đồng thời 2 hoặc 3 role. | Trả về HTTP `409 Conflict`: *"Email này đã được đăng ký với vai trò khác trên hệ thống. Vui lòng sử dụng email khác."* |
| **BR-AUTH-02** | Định dạng Email thực | Email phải tuân thủ chuẩn RFC 5322, kiểm tra cấu trúc tên miền hợp lệ (`@domain.ext`). | Trả về HTTP `422 Unprocessable Entity`: *"Định dạng email không hợp lệ."* |
| **BR-AUTH-03** | Bảo mật mật khẩu | Mật khẩu tối thiểu 6 ký tự, tối đa 72 byte (giới hạn an toàn của bcrypt). Bắt buộc băm một chiều với Salt Rounds >= 10. | Không lưu plain text. Báo lỗi nếu mật khẩu dưới 6 ký tự. |
| **BR-AUTH-04** | **Mã xác thực OTP 10 phút & Tự động điền (Auto-fill)** | Mã OTP gồm 6 chữ số ngẫu nhiên, **thời gian sống (TTL) đúng 600 giây (10 phút)**. Hệ thống có đồng hồ đếm ngược tự động (`mm:ss`) trên màn hình và **cơ chế tự động điền mã OTP (Auto-fill)** ngay khi nhận được qua Email, người dùng không cần phải gõ tay. Sau 10 phút mã tự động vô hiệu hóa. | Sau 10 phút (600s), mã OTP bị hết hạn (HTTP 410 Gone / 400 Bad Request). Yêu cầu người dùng bấm "Gửi lại mã OTP mới". |
| **BR-AUTH-05** | Phân quyền RBAC (Role-Based Access) | Token JWT chứa `sub` (user_id) và `role`. Các endpoint `/api/student/*` chỉ nhận role `student`; `/api/employer/*` chỉ nhận role `employer`; `/api/admin/*` chỉ nhận role `admin`. | Trả về HTTP `403 Forbidden`: *"Bạn không có quyền truy cập tài nguyên này."* |
| **BR-AUTH-06** | Tài khoản bị khóa (Banned) | Nếu trường `is_banned = true`, hệ thống chặn đăng nhập hoặc chặn thực hiện mọi tác vụ thay đổi dữ liệu. | Trả về HTTP `403 Forbidden`: *"Tài khoản của bạn đã bị khóa. Lý do: [ban_reason]."* |
| **BR-RESP-01** | Đồng bộ đa thiết bị (PC, Laptop, iPad, Mobile) | Giao diện phải tương thích 100% trên mọi kích thước màn hình: PC/Desktop (>= 1280px), Laptop (1024px - 1279px), iPad/Tablet (768px - 1023px), Mobile Phone (< 768px). Khối 3D Three.js phải hỗ trợ cả di chuột và cảm ứng đa điểm (Touch gestures). | Giao diện tự động co giãn, thanh menu chuyển sang Drawer và Bottom Dock trên Mobile/iPad, không bị vỡ layout hoặc tràn màn hình. |

---

## PHẦN 2: ĐIỀU KIỆN RÀNG BUỘC THEO TỪNG PHÂN HỆ

### 2.1. Phân Hệ Sinh Viên (Vũ Thế Long) - WBS 1.1 đến 1.10

- **BR-STU-01 (Quản lý Hồ sơ cá nhân):**
  - Họ và tên: Độ dài từ 2 đến 100 ký tự, không chứa ký tự đặc biệt nguy hiểm.
  - Số điện thoại: Định dạng chuẩn số điện thoại Việt Nam (10 chữ số, bắt đầu bằng `03`, `05`, `07`, `08`, `09`).
  - Trường đại học & Chuyên ngành: Bắt buộc chọn hoặc nhập khi nộp hồ sơ xin việc.
- **BR-STU-02 (Quản lý CV & Thư giới thiệu):**
  - Định dạng file CV cho phép: Chỉ chấp nhận `.pdf`, `.docx`.
  - Dung lượng file tối đa: Không quá `10MB`.
  - Giới hạn số lượng: Mỗi sinh viên được lưu tối đa 5 file CV.
  - CV mặc định: Chỉ có duy nhất 1 CV có cờ `is_default = true`. Khi một CV mới được chọn làm mặc định, các CV cũ tự động chuyển về `is_default = false`.
  - Thư giới thiệu (Cover Letter): Tiêu đề không rỗng, nội dung tối đa 2.000 ký tự.
- **BR-STU-03 (Tìm kiếm & Lưu việc làm - Bookmarks):**
  - Mỗi sinh viên chỉ có thể lưu một công việc đúng 1 lần (Unique Compound Index `student_id + job_id` trên collection `bookmarks`).
  - Khi công việc bị Nhà tuyển dụng hoặc Admin xóa, bookmark tương ứng bị vô hiệu hóa hoặc xóa cascade.
- **BR-STU-04 (Ràng buộc Ứng tuyển - Applications):**
  - **Chặn nộp trùng:** Mỗi sinh viên chỉ được phép nộp 1 đơn ứng tuyển cho cùng một `job_id` nếu đơn trước đó chưa bị từ chối hoặc hủy.
  - **Bản chụp hồ sơ (Application Snapshot):** Tại thời điểm nhấn nộp, hệ thống bắt buộc chụp lại bản sao thông tin cá nhân, link CV và thư giới thiệu vào trường `application_snapshot` để lưu bằng chứng pháp lý và không bị ảnh hưởng nếu sau này sinh viên sửa profile.
  - **Trạng thái việc làm:** Chỉ cho phép ứng tuyển khi tin việc làm có `is_open = true` và `is_hidden = false`.
  - **Hủy đơn ứng tuyển:** Sinh viên CHỈ ĐƯỢC PHÉP hủy đơn khi trạng thái đang là `"pending"` (Chờ duyệt). Khi NTD đã chuyển sang `"interview"` hoặc `"accepted"`, sinh viên không thể tự ý hủy mà phải trao đổi qua chat.
- **BR-STU-05 (Đánh giá Nhà tuyển dụng):**
  - Sinh viên chỉ được phép gửi đánh giá cho Nhà tuyển dụng khi đơn ứng tuyển của công việc đó đạt trạng thái `"completed"` hoặc `"accepted"`.
  - Mỗi công việc chỉ được đánh giá 1 lần duy nhất.
  - Điểm số: Thang điểm số nguyên từ 1 đến 5 sao. Bình luận từ 10 đến 1.000 ký tự.

---

### 2.2. Phân Hệ Nhà Tuyển Dụng (Huỳnh Nguyễn Bảo Ngọc) - WBS 2.1 đến 2.9

- **BR-EMP-01 (Xác thực Doanh nghiệp & GPKD):**
  - Tên doanh nghiệp: Từ 3 đến 200 ký tự.
  - Mã số thuế (MST) / Giấy phép kinh doanh (GPKD): File tải lên dạng PDF/Ảnh <= 10MB.
  - Trạng thái kiểm duyệt GPKD (`approval_status`): Gồm `"pending"`, `"approved"`, `"rejected"`.
  - Quyền đăng tin: Chỉ những nhà tuyển dụng có `approval_status = "approved"` mới được đăng tin công khai ra hệ thống; tài khoản `"pending"` chỉ được tạo tin ở dạng Bản nháp (Draft).
- **BR-EMP-02 (Ràng buộc Tin tuyển dụng - Jobs):**
  - Tiêu đề tin: Tối thiểu 10 ký tự, tối đa 150 ký tự.
  - Ngành nghề (`category_id`): Bắt buộc thuộc danh mục đang kích hoạt (`is_active = true`) trong bảng `categories`.
  - Mức lương: Nếu không chọn "Lương thỏa thuận" (`is_negotiable = false`), thì `salary_min` và `salary_max` phải là số nguyên dương và điều kiện bắt buộc: `salary_min <= salary_max`.
  - Mô tả công việc: Tối thiểu 50 ký tự.
- **BR-EMP-03 (Quản lý Ứng viên & Vòng đời Ứng tuyển):**
  - Luồng chuyển trạng thái hợp lệ của đơn ứng tuyển:
    - `pending` (Chờ duyệt) -> `reviewed` (Đã xem hồ sơ) -> `interview` (Mời phỏng vấn) -> `accepted` (Tuyển dụng thành công) HOẶC `rejected` (Từ chối).
  - Khi chuyển sang `rejected`, khuyến khích hoặc bắt buộc chọn lý do từ chối để thông báo cho sinh viên.
  - Khi chuyển trạng thái, hệ thống tự động ghi nhật ký vào `status_history` gồm `[status, updated_at, note]`.
- **BR-EMP-04 (Đánh giá Sinh viên):**
  - Chỉ được đánh giá sinh viên khi ứng viên đã được nhận làm việc (`accepted`).
  - Thang điểm 1-5 sao, nhận xét về thái độ, tính đúng giờ và hiệu suất.

---

### 2.3. Phân Hệ Quản Trị Viên (Lê Thị Thuỳ Ngân) - WBS 3.1 đến 3.9

- **BR-ADM-01 (Quản lý Khóa / Mở khóa Người dùng):**
  - Chỉ Quản trị viên mới có quyền cập nhật `is_banned` của tài khoản Sinh viên hoặc Nhà tuyển dụng.
  - Bắt buộc ghi nhận `ban_reason` (Lý do khóa) để phục vụ giải quyết khiếu nại.
  - Quản trị viên không thể tự khóa chính tài khoản của mình.
- **BR-ADM-02 (Kiểm duyệt Tin tuyển dụng):**
  - Quản trị viên có quyền cập nhật `is_hidden = true` đối với bất kỳ tin tuyển dụng nào có dấu hiệu lừa đảo, đa cấp, thu phí phỏng vấn trái phép hoặc bị nhiều người dùng báo cáo.
  - Tin bị ẩn sẽ ngay lập tức biến mất khỏi trang tìm kiếm việc của sinh viên.
- **BR-ADM-03 (Toàn vẹn Dữ liệu Master Data - Categories):**
  - Không được xóa cứng (`hard delete`) danh mục nếu đang có ít nhất 1 tin tuyển dụng đang tham chiếu đến `category_id` đó. Hệ thống chỉ cho phép chuyển sang trạng thái Ẩn (`is_active = false`).
- **BR-ADM-04 (Xử lý Báo cáo Vi phạm - Reports):**
  - Người dùng (Sinh viên/NTD) mỗi lần chỉ được báo cáo 1 đối tượng vi phạm 1 lần (tránh flood report).
  - Quản trị viên cập nhật trạng thái báo cáo theo quy trình: `pending` -> `investigating` -> `resolved` / `dismissed`.
- **BR-ADM-05 (Kiểm duyệt Tin nhắn Realtime & Từ khóa cấm):**
  - Hệ thống duy trì danh sách từ khóa cấm (`banned_keywords`), ví dụ: *"thu phí", "đặt cọc", "lừa đảo", "chuyển khoản trước", "cờ bạc"*.
  - Mọi tin nhắn gửi qua Socket.IO hoặc API chat đều tự động đối soát với danh sách này. Nếu chứa từ cấm, hệ thống tự động thay thế bằng ký tự `***` hoặc cảnh báo vi phạm.

---

## PHẦN 3: MA TRẬN KỊCH BẢN KIỂM THỬ HỆ THỐNG (TEST SCENARIOS)

| Test ID | Tên Kịch Bản Kiểm Thử | Điều Kiện Tiền Đề (Pre-condition) | Các Bước Thực Hiện (Test Steps) | Kết Quả Mong Đợi (Expected Outcome) | Phân Hệ Phụ Trách |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Kiểm tra ràng buộc 1 Email = 1 Role khi Đăng ký mới | Email `sv.nguyenvana@gmail.com` đã đăng ký thành công với role `student`. | 1. Mở trang Đăng ký với vai trò Nhà tuyển dụng.<br>2. Nhập email `sv.nguyenvana@gmail.com`.<br>3. Điền thông tin và nhấn "Đăng ký". | Hệ thống từ chối, báo lỗi: "Email đã tồn tại với vai trò Sinh viên. Mỗi email chỉ được dùng cho 1 vai trò duy nhất." Không tạo tài khoản mới. | Chung / Vũ Thế Long |
| **TC-02** | Đăng ký tài khoản Sinh viên thành công với Email mới | Email `long.vuthe@student.vlu.edu.vn` chưa từng đăng ký trên hệ thống. | 1. Chọn vai trò Sinh viên.<br>2. Nhập email, mật khẩu >= 6 ký tự, họ tên.<br>3. Nhấn "Đăng ký". | Tài khoản được tạo với role `student`, mã hóa bcrypt, nhận thông báo tạo tài khoản thành công và đăng nhập được. | Vũ Thế Long |
| **TC-03** | Đăng ký Nhà tuyển dụng và tạo hồ sơ công ty | Email `recruiter@highlandscoffee.com` chưa đăng ký. | 1. Chọn vai trò Nhà tuyển dụng.<br>2. Nhập thông tin công ty, MST.<br>3. Đăng ký tài khoản. | Tạo tài khoản role `employer`, trạng thái duyệt `pending`, hồ sơ công ty được khởi tạo trong `company_profiles`. | Huỳnh Nguyễn Bảo Ngọc |
| **TC-04** | Đăng nhập sai mật khẩu quá 5 lần | Tài khoản hợp lệ tồn tại. | Nhập sai mật khẩu liên tiếp 5 lần. | Hệ thống cảnh báo và tạm khóa đăng nhập trong 5 phút để chống tấn công brute-force. | Chung |
| **TC-05** | Tải lên CV định dạng PDF <= 10MB | Sinh viên đã đăng nhập. | 1. Vào trang Quản lý CV.<br>2. Chọn file `my_cv.pdf` dung lượng 2.5MB.<br>3. Nhấn Tải lên. | File được upload thành công, metadata lưu vào `resumes`, hiển thị nút xem trước. | Vũ Thế Long |
| **TC-06** | Tải lên CV sai định dạng (file .exe hoặc file > 10MB) | Sinh viên đã đăng nhập. | 1. Chọn file `virus.exe` hoặc file dung lượng 15MB.<br>2. Nhấn Tải lên. | Hệ thống chặn ngay tại client và server, báo lỗi: "Chỉ chấp nhận file PDF hoặc DOCX dung lượng tối đa 10MB." | Vũ Thế Long |
| **TC-07** | Thiết lập CV mặc định | Sinh viên có 3 bản CV đã tải lên. | 1. Chọn CV số 2.<br>2. Nhấn "Đặt làm CV mặc định". | CV số 2 chuyển sang `is_default = true`, CV số 1 và 3 tự động chuyển thành `is_default = false`. | Vũ Thế Long |
| **TC-08** | Tìm kiếm việc làm part-time theo từ khóa và bộ lọc | Hệ thống có danh sách việc làm đa dạng. | 1. Nhập từ khóa "Pha chế".<br>2. Chọn địa điểm "Quận 1".<br>3. Lọc mức lương từ "25.000đ - 35.000đ/h". | Danh sách trả về chỉ hiển thị các công việc thỏa mãn đồng thời cả 3 điều kiện trên. | Vũ Thế Long |
| **TC-09** | Thêm và xóa việc làm đã lưu (Bookmark) | Sinh viên đã đăng nhập. | 1. Nhấn icon Trái tim tại tin việc làm A.<br>2. Kiểm tra danh sách đã lưu.<br>3. Nhấn lại icon Trái tim để bỏ lưu. | Lần 1: Việc làm A xuất hiện trong danh sách đã lưu. Lần 2: Việc làm A bị xóa khỏi danh sách đã lưu. | Vũ Thế Long |
| **TC-10** | Sinh viên ứng tuyển việc làm thành công | Việc làm đang mở (`is_open = true`), sinh viên chưa từng ứng tuyển. | 1. Nhấn "Ứng tuyển ngay".<br>2. Chọn CV mặc định và kèm lời nhắn.<br>3. Xác nhận nộp. | Tạo bản ghi trong `applications`, lưu snapshot hồ sơ, trạng thái là `pending`, gửi thông báo đến Nhà tuyển dụng. | Vũ Thế Long |
| **TC-11** | Chặn nộp trùng đơn ứng tuyển | Sinh viên đã nộp vào việc làm B và đơn đang chờ duyệt. | Nhấn ứng tuyển lại vào việc làm B. | Hệ thống chặn và hiển thị thông báo: "Bạn đã nộp hồ sơ cho công việc này, vui lòng chờ phản hồi." | Vũ Thế Long |
| **TC-12** | Hủy yêu cầu ứng tuyển khi đang chờ duyệt | Đơn ứng tuyển đang ở trạng thái `pending`. | Nhấn nút "Hủy đơn ứng tuyển" và xác nhận. | Đơn ứng tuyển được xóa hoặc chuyển trạng thái `cancelled`, NTD không thấy hồ sơ trong danh sách chờ duyệt nữa. | Vũ Thế Long |
| **TC-13** | Nhà tuyển dụng tạo tin tuyển dụng hợp lệ | NTD đã được cấp quyền đăng tin. | 1. Nhập tiêu đề, địa chỉ, chọn ngành nghề hợp lệ.<br>2. Nhập lương min: 25.000, lương max: 35.000.<br>3. Nhấn Đăng tin. | Tin được lưu vào `jobs`, hiển thị công khai trên sàn việc làm part-time. | Huỳnh Nguyễn Bảo Ngọc |
| **TC-14** | Nhà tuyển dụng nhập lương min lớn hơn lương max | NTD tạo tin. | Nhập lương min: 40.000, lương max: 30.000. | Hệ thống báo lỗi validation: "Lương tối thiểu không được lớn hơn lương tối đa." | Huỳnh Nguyễn Bảo Ngọc |
| **TC-15** | Nhà tuyển dụng duyệt hồ sơ và chuyển trạng thái ứng viên | Có ứng viên đang ở trạng thái `pending`. | 1. Xem CV ứng viên.<br>2. Nhấn "Duyệt hồ sơ & Hẹn phỏng vấn".<br>3. Nhập thời gian phỏng vấn. | Trạng thái chuyển thành `interview`, ghi vào `status_history`, đẩy thông báo thời gian thực đến sinh viên. | Huỳnh Nguyễn Bảo Ngọc |
| **TC-16** | Đánh giá hai chiều sau khi hoàn thành công việc | Ứng viên đã hoàn thành công việc (`accepted` / `completed`). | 1. Sinh viên đánh giá NTD (5 sao, khen ngợi môi trường).<br>2. NTD đánh giá Sinh viên (5 sao, khen đúng giờ). | 2 bản ghi lưu vào `reviews`, tính lại điểm trung bình sao của cả hai đối tượng. Mỗi bên chỉ được đánh giá 1 lần. | Chung (Long + Ngọc) |
| **TC-17** | Chat Realtime và lọc từ khóa nhạy cảm tự động | 2 người dùng mở cửa sổ chat. | Người gửi nhập tin: "Bạn cần chuyển khoản đặt cọc 200k trước để nhận ca". | Hệ thống tự động lọc từ cấm, thay thế thành: "Bạn cần chuyển khoản *** 200k trước để nhận ca" và gắn cờ cảnh báo. | Chung (Long + Ngọc + Ngân) |
| **TC-18** | Gọi Video phỏng vấn mô phỏng WebRTC | Cả Sinh viên và NTD cùng trực tuyến trong phòng chat. | 1. NTD nhấn nút "Gọi Video Phỏng vấn".<br>2. Sinh viên nhận thông báo cuộc gọi đến và bấm "Chấp nhận". | Luồng Media Stream (Audio/Video) hiển thị trên màn hình 2 bên, có đầy đủ nút Mute mic, Tắt cam, Kết thúc cuộc gọi. | Long + Ngọc |
| **TC-19** | Quản trị viên xem Dashboard thống kê và xuất báo cáo | Admin đăng nhập hệ thống. | 1. Vào trang Bảng điều khiển.<br>2. Xem biểu đồ người dùng và tin tuyển dụng.<br>3. Nhấn "Xuất báo cáo Excel/CSV". | File báo cáo được tải về với đầy đủ số liệu chính xác theo kỳ thống kê. | Lê Thị Thuỳ Ngân |
| **TC-20** | Quản trị viên khóa tài khoản vi phạm | Phát hiện tài khoản NTD lừa đảo. | 1. Admin tìm kiếm tài khoản.<br>2. Nhấn "Khóa tài khoản", nhập lý do "Lừa đảo thu tiền cọc sinh viên".<br>3. Xác nhận. | Trường `is_banned = true`, tài khoản bị logout ngay lập tức và các tin của NTD này tự động bị ẩn khỏi sàn. | Lê Thị Thuỳ Ngân |
| **TC-21** | Quản trị viên ẩn tin tuyển dụng vi phạm | Tin tuyển dụng bị nhiều sinh viên báo cáo vi phạm. | Admin chọn tin tuyển dụng và bấm "Ẩn tin". | Trường `is_hidden = true`, tin biến mất khỏi màn hình sinh viên nhưng dữ liệu vẫn lưu để đối soát. | Lê Thị Thuỳ Ngân |
| **TC-22** | Quản trị viên thêm và cấu hình từ khóa cấm | Admin vào mục Kiểm duyệt hội thoại. | Thêm từ khóa "nạp tiền telegram". | Từ khóa mới được ghi vào `banned_keywords`, công cụ chat ngay lập tức kích hoạt bộ lọc với từ khóa này. | Lê Thị Thuỳ Ngân |
| **TC-23** | Kiểm tra thời hạn mã OTP 10 phút, đồng hồ đếm ngược & Tự động điền (Auto-fill) | Người dùng chọn Quên mật khẩu hoặc Xác thực OTP. | 1. Nhập email thực và bấm "Gửi OTP".<br>2. Quan sát đồng hồ đếm ngược bắt đầu từ 10:00 (600s).<br>3. Kiểm tra mã OTP được tự động điền (Auto-fill) vào 6 ô mà không cần gõ tay.<br>4. Nhấn xác nhận. | Đồng hồ đếm ngược giảm từng giây chính xác; 6 ô số tự động nhận diện và điền đầy đủ mã OTP; xác thực thành công. Nếu quá 10 phút, mã tự động vô hiệu hóa. | Chung |
| **TC-24** | Kiểm tra hiển thị & đồng bộ đa thiết bị (PC, Laptop, iPad, Mobile) | Mở website trên nhiều độ phân giải (Desktop 1920x1080, Laptop 1366x768, iPad 768x1024, Mobile 375x812). | 1. Thao tác xoay mô hình 3D Logo bằng chuột (PC) và vuốt ngón tay (Mobile/iPad).<br>2. Kiểm tra thanh Menu co giãn thành Drawer và Bottom Dock trên Mobile.<br>3. Thao tác các bảng biểu, modal. | Giao diện hiển thị trơn tru, không tràn viền, thao tác cảm ứng xoay 3D mượt mà, menu điều hướng một chạm tiện lợi cho ngón tay cái trên di động. | Chung |
| **TC-25** | Kiểm tra độ phức tạp mật khẩu (Chữ hoa, chữ thường, số, ký tự đặc biệt) | Người dùng đăng ký tài khoản hoặc đổi mật khẩu mới. | 1. Nhập mật khẩu yếu (chỉ có số hoặc không có ký tự đặc biệt).<br>2. Quan sát bảng checklist trực quan.<br>3. Thử submit form. | Hệ thống chặn submit, hiển thị lỗi yêu cầu tối thiểu 6 ký tự gồm đầy đủ chữ hoa, chữ thường, số và ký tự đặc biệt. Khi nhập đúng, các icon tích xanh sáng lên và cho phép lưu thành công. | Chung |
| **TC-26** | Đăng nhập tài khoản Quản trị viên cố định & bảo mật | Tài khoản Admin mặc định hệ thống. | 1. Mở màn hình Đăng nhập Quản trị viên.<br>2. Nhập email `lethithuyngan985@gmail.com` và mật khẩu `Le090805!`.<br>3. Kiểm tra tính năng Quên mật khẩu/Đăng ký. | Đăng nhập thành công vào Trung tâm Quản trị. Nút Quên mật khẩu và Đăng ký bị ẩn hoàn toàn để bảo đảm an toàn phân quyền tối cao. | Lê Thị Thuỳ Ngân |


---
*Tài liệu này là cơ sở bắt buộc để nghiệm thu chức năng, viết Unit Test, Integration Test và kiểm thử chấp nhận người dùng (UAT) cho toàn bộ dự án CDTN02.*

