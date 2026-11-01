# BÁO CÁO CHUYÊN ĐỀ TỐT NGHIỆP 2

**TRƯỜNG ĐẠI HỌC VĂN LANG**  
**TRƯỜNG CÔNG NGHỆ VĂN LANG - KHOA CÔNG NGHỆ THÔNG TIN**  

---

### ĐỀ TÀI:
# NGHIÊN CỨU, PHÂN TÍCH VÀ XÂY DỰNG NỀN TẢNG TUYỂN DỤNG VIỆC LÀM LINH HOẠT CHO SINH VIÊN (PARTIME.VN) DỰA TRÊN KIẾN TRÚC PHÂN TẦNG LAYERED CLEAN ARCHITECTURE VÀ HIỆU ỨNG GIAO DIỆN WEB 3D

- **Ngành:** CÔNG NGHỆ THÔNG TIN (Mã ngành: 7480201)
- **Sinh viên thực hiện:**
  1. **Vũ Thế Long** - Phụ trách Phân hệ Sinh viên (Student Portal)
  2. **Huỳnh Nguyễn Bảo Ngọc** - Phụ trách Phân hệ Nhà tuyển dụng (Employer Portal)
  3. **Lê Thị Thuỳ Ngân** - Phụ trách Phân hệ Quản trị viên (Admin Portal)
- **Thời gian thực hiện:** Năm học 2025 - 2026
- **Địa điểm:** TP. Hồ Chí Minh, năm 2026

---

## LỜI CẢM ƠN
Nhóm nghiên cứu xin bày tỏ lòng biết ơn sâu sắc đến Ban Giám hiệu Trường Đại học Văn Lang, Ban Chủ nhiệm Khoa Công nghệ Thông tin cùng toàn thể quý Thầy Cô đã tận tình truyền đạt kiến thức chuyên môn, kỹ năng nghiên cứu khoa học và tạo điều kiện cơ sở vật chất thuận lợi trong suốt thời gian chúng em học tập và thực hiện Chuyên đề Tốt nghiệp 2.

Đặc biệt, nhóm xin chân thành cảm ơn Quý Thầy/Cô Giảng viên hướng dẫn đã dành nhiều thời gian quý báu để định hướng đề tài, tận tình chỉ dẫn phương pháp tiếp cận kiến trúc phần mềm Clean Architecture, góp ý hoàn thiện các biểu đồ phân tích và phản biện sâu sắc giúp đồ án của chúng em đạt được tính thực tiễn cao.

*TP. Hồ Chí Minh, ngày 31 tháng 10 năm 2026*  
**Đại diện nhóm tác giả**  
*(Đã ký)*  
**Vũ Thế Long - Huỳnh Nguyễn Bảo Ngọc - Lê Thị Thuỳ Ngân**

---

## LỜI CAM ĐOAN
Chúng em xin cam đoan đây là công trình nghiên cứu và phát triển phần mềm của riêng nhóm tác giả dưới sự hướng dẫn khoa học của Giảng viên hướng dẫn. Các nội dung nghiên cứu, kiến trúc thiết kế, mã nguồn lập trình và kết quả thử nghiệm trong đề tài này là hoàn toàn trung thực, do nhóm tự tay phân tích, thiết kế và cài đặt, không sao chép bất hợp pháp từ bất kỳ công trình nào trước đây.

Mọi số liệu, hình ảnh, tài liệu tham khảo và thư viện mã nguồn mở được sử dụng đều có nguồn gốc rõ ràng và được trích dẫn đầy đủ theo quy định học thuật. Nếu có bất kỳ sự gian lận hoặc vi phạm bản quyền nào, nhóm xin hoàn toàn chịu trách nhiệm trước Hội đồng Đánh giá và Nhà trường.

*TP. Hồ Chí Minh, ngày 31 tháng 10 năm 2026*  
**Nhóm sinh viên thực hiện**

---

## TÓM TẮT (ABSTRACT)

### Tóm tắt:
Trong bối cảnh nền kinh tế số và xu hướng việc làm linh hoạt (gig economy) ngày càng phát triển mạnh mẽ, nhu cầu tìm kiếm việc làm bán thời gian (part-time) và công việc tự do của sinh viên đại học tại các đô thị lớn như TP. Hồ Chí Minh là vô cùng cấp thiết. Tuy nhiên, các kênh tuyển dụng truyền thống trên mạng xã hội tiềm ẩn nhiều nguy cơ lừa đảo, đa cấp, quỵt lương hoặc thông tin sai lệch. Đề tài **"Xây dựng nền tảng tuyển dụng việc làm linh hoạt cho sinh viên (PARTIME.VN)"** được thực hiện nhằm mang đến một giải pháp công nghệ toàn diện, minh bạch và an toàn dành riêng cho cộng đồng sinh viên. 

Hệ thống được thiết kế theo mô hình **Kiến trúc phân tầng Clean Architecture (Layered Clean Architecture)**, phân định rõ ràng giữa tầng Trình bày (Presentation), tầng Điều phối/Controller, tầng Nghiệp vụ (Application Services), tầng Truy xuất dữ liệu (Data Access / Repository) và tầng Lưu trữ (Storage). Cơ sở dữ liệu đám mây **MongoDB Atlas** dùng chung gồm 16 collections chuẩn hóa, phục vụ đồng bộ cho 3 nhóm đối tượng: Sinh viên, Nhà tuyển dụng và Quản trị viên. 

Đặc biệt, đồ án thiết lập quy tắc bảo mật nghiêm ngặt **"1 Email thực cho đúng 1 Role duy nhất"**, tích hợp giao diện hiện đại với **Font chữ Be Vietnam Pro**, màu sắc xanh lá cây tươi sáng nhận diện thương hiệu `PARTIME.VN`, kết hợp biểu tượng **Logo 3D tương tác sống động** cùng công nghệ truyền thông thời gian thực **Socket.IO** và phỏng vấn trực tuyến qua **WebRTC Video Call**. Kết quả nghiên cứu đem lại một nền tảng tuyển dụng hoàn chỉnh, có khả năng mở rộng cao và giải quyết hiệu quả bài toán kết nối việc làm sinh viên.

***Từ khóa:*** *Việc làm Part-time, Clean Architecture, Web 3D, MongoDB Atlas, WebRTC.*

### Abstract:
In the context of the burgeoning digital economy and the gig workforce trend, the demand for flexible part-time and freelance employment among university students in major metropolitan areas such as Ho Chi Minh City has escalated significantly. Nonetheless, informal recruitment channels on social media pose rampant risks of employment scams, illegal multi-level marketing traps, wage theft, and fraudulent vacancies. The graduation thesis project entitled **"Developing PARTIME.VN - A Flexible Employment Platform for University Students"** is engineered to deliver a trustworthy, transparent, and specialized marketplace ecosystem.

The system is rigorously architected upon **Layered Clean Architecture**, decoupling the Presentation Layer, Controller & API Gateway Layer, Application & Business Logic Services Layer, Data Access / Repository Layer, and Infrastructure & Storage Layer. A shared cloud-based **MongoDB Atlas** database featuring 16 standardized collections seamlessly serves three core actors: Students, Employers, and Administrators. 

Crucially, the platform enforces a strict security identity constraint: **"One Real Email is Strictly Bound to One Role"**, adopts a modern UI system powered by the **Be Vietnam Pro** typography, an energetic eco-green brand identity, an interactive **3D Web Canvas Logo**, alongside real-time communication via **Socket.IO** and peer-to-peer interview conferencing via **WebRTC Video Call**. The research successfully demonstrates a robust, scalable, and user-centric platform addressing youth employment challenges.

***Keywords:*** *Part-time Employment, Clean Architecture, Web 3D, MongoDB Atlas, WebRTC.*

---

## DANH MỤC CÁC CHỮ VIẾT TẮT

| STT | Từ viết tắt | Tên tiếng Anh đầy đủ | Diễn giải tiếng Việt |
| :---: | :--- | :--- | :--- |
| 1 | **API** | Application Programming Interface | Giao diện lập trình ứng dụng |
| 2 | **ATS** | Applicant Tracking System | Hệ thống theo dõi và quản lý hồ sơ ứng viên |
| 3 | **CV** | Curriculum Vitae | Sơ yếu lý lịch / Hồ sơ ứng tuyển |
| 4 | **ERD** | Entity Relationship Diagram | Sơ đồ quan hệ thực thể |
| 5 | **GPKD** | Business License | Giấy phép kinh doanh / Giấy chứng nhận ĐKKD |
| 6 | **JWT** | JSON Web Token | Chuẩn mã hóa token xác thực người dùng |
| 7 | **OTP** | One-Time Password | Mật khẩu dùng một lần |
| 8 | **RBAC** | Role-Based Access Control | Kiểm soát truy cập dựa trên vai trò |
| 9 | **REST** | Representational State Transfer | Kiểu kiến trúc dịch vụ web chuẩn |
| 10 | **UI/UX** | User Interface / User Experience | Giao diện người dùng / Trải nghiệm người dùng |
| 11 | **WBS** | Work Breakdown Structure | Sơ đồ cấu trúc phân rã công việc |
| 12 | **WebRTC**| Web Real-Time Communication | Công nghệ truyền thông thời gian thực trên web |

---

## CHƯƠNG 1: MỞ ĐẦU

### 1.1. Lý do chọn đề tài và Tính cấp thiết
Sinh viên đại học tại Việt Nam hiện nay đối mặt với nhu cầu rất lớn về tìm kiếm việc làm thêm để trang trải chi phí sinh hoạt, tích lũy kinh nghiệm làm việc thực tế và rèn luyện kỹ năng mềm trước khi tốt nghiệp. Tuy nhiên, thực trạng hiện nay cho thấy:
1. **Rủi ro lừa đảo tràn lan:** Các hội nhóm tuyển dụng tự phát trên Facebook, Zalo thường xuyên xuất hiện các chiêu trò lừa tiền cọc, nạp tiền làm nhiệm vụ Telegram, hoặc dụ dỗ sinh viên vào mạng lưới bán hàng đa cấp biến tướng.
2. **Thiếu tính linh hoạt:** Các trang tìm việc lớn (VietnamWorks, TopCV) chủ yếu nhắm tới nhân sự toàn thời gian (full-time) có kinh nghiệm, chưa có công cụ chuyên biệt giúp sinh viên lọc ca làm việc phù hợp với lịch học từng học kỳ.
3. **Thiếu cơ chế đánh giá hai chiều minh bạch:** Sinh viên khó biết được độ uy tín của chủ cơ sở kinh doanh, ngược lại nhà tuyển dụng cũng e ngại sinh viên bỏ ca không báo trước.

Xuất phát từ thực tiễn trên, việc xây dựng một nền tảng chuyên biệt như **PARTIME.VN** với quy trình xác thực chặt chẽ, kiểm duyệt giấy phép kinh doanh, bảo vệ quyền lợi sinh viên và ứng dụng kiến trúc phần mềm phân tầng tiên tiến là nhiệm vụ cấp thiết cả về mặt khoa học công nghệ lẫn giá trị xã hội.

### 1.2. Mục tiêu nghiên cứu
- **Mục tiêu tổng quát:** Xây dựng hoàn chỉnh nền tảng web tuyển dụng việc làm part-time dành cho sinh viên, đảm bảo tính bảo mật, hiệu năng cao, trải nghiệm người dùng trực quan 3D và khả năng mở rộng tốt.
- **Mục tiêu cụ thể:**
  - Thiết kế và cài đặt hệ thống trên nền tảng **Layered Clean Architecture**.
  - Xây dựng cổng chức năng riêng biệt cho 3 Role: Sinh viên, Nhà tuyển dụng, Quản trị viên dựa trên tài liệu **WBS02**.
  - Thực thi quy tắc bảo mật **1 Email = 1 Role duy nhất**.
  - Thiết kế nhận diện thương hiệu `PARTIME.VN` với font `Be Vietnam Pro`, màu xanh lá sáng hiện đại, logo 3D tương tác sống động.
  - Tích hợp tính năng Chat Realtime và Phỏng vấn trực tuyến qua WebRTC Video Call.

### 1.3. Đối tượng và Phạm vi nghiên cứu
- **Đối tượng nghiên cứu:** Quy trình tuyển dụng nhân sự part-time; kiến trúc Clean Architecture; cơ sở dữ liệu phi quan hệ MongoDB; truyền thông thời gian thực Socket.IO & WebRTC; công nghệ đồ họa WebGL/Three.js.
- **Phạm vi nghiên cứu:** Nền tảng hoạt động trên môi trường web ứng dụng (Responsive Web App), tập trung vào các công việc bán thời gian tại Việt Nam; hệ thống giao dịch kết nối ứng tuyển và đánh giá uy tín (không tích hợp cổng thanh toán tiền mặt trực tiếp).

### 1.4. Phương pháp nghiên cứu
- **Phương pháp lý thuyết:** Thu thập, phân tích các tài liệu về kiến trúc phần mềm Clean Architecture, đặc tả giao thức mạng HTTP/WebSocket, tài liệu hướng dẫn MongoDB, chuẩn an toàn thông tin OWASP.
- **Phương pháp thực tiễn:** Khảo sát nhu cầu thực tế của sinh viên Đại học Văn Lang; xây dựng sản phẩm mẫu (MVP); thực hiện kiểm thử ma trận Test Case tự động; thu thập phản hồi người dùng.

### 1.5. Thời gian thực hiện và Phân công nhân sự
- Thời gian: Kéo dài trong học kỳ Chuyên đề Tốt nghiệp 2 (Từ tháng 10/2025 đến tháng 03/2026).
- Phân công cụ thể:
  - **Vũ Thế Long:** Lập trình trọn vẹn Phân hệ Sinh viên (Student Portal - WBS 1.1 đến 1.10).
  - **Huỳnh Nguyễn Bảo Ngọc:** Lập trình trọn vẹn Phân hệ Nhà tuyển dụng (Employer Portal - WBS 2.1 đến 2.9).
  - **Lê Thị Thuỳ Ngân:** Lập trình trọn vẹn Phân hệ Quản trị viên (Admin Portal - WBS 3.1 đến 3.9).

---

## CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ ÁP DỤNG

### 2.1. Kiến Trúc Phân Tầng Clean Architecture
Clean Architecture do Robert C. Martin đề xuất tuân thủ triệt để Quy tắc phụ thuộc (Dependency Rule): các tầng bên trong không được phụ thuộc vào tầng bên ngoài. Hệ thống PARTIME.VN áp dụng mô hình 5 tầng:
1. **Presentation Layer:** Giao diện ReactJS, Three.js, Tailwind CSS.
2. **Controller & API Gateway Layer:** Flask Blueprints tiếp nhận và validate yêu cầu HTTP/WebSocket.
3. **Application & Business Logic Layer:** Các Services xử lý nghiệp vụ cốt lõi, áp dụng luật kiểm tra email duy nhất, tính điểm đánh giá, trạng thái ứng tuyển.
4. **Data Access / Repository Layer:** Các Repositories trừu tượng hóa thao tác đọc ghi dữ liệu.
5. **Storage & Infrastructure Layer:** MongoDB Atlas (16 collections), Cloudinary CDN, SMTP Server.

### 2.2. Hệ Sinh Thái Công Nghệ Lựa Chọn
- **Frontend:** React 18, Vite (tốc độ khởi động và HMR cực nhanh), Tailwind CSS (hệ thống utility tối ưu responsive), Lucide Icons, Three.js (dựng không gian 3D tương tác cho Logo và Hero banner).
- **Backend:** Python 3.11 + Flask (linh hoạt, nhẹ, dễ mở rộng), Flask-CORS, Flask-SocketIO cho truyền thông sự kiện hai chiều.
- **Cơ sở dữ liệu:** MongoDB Atlas Cloud với 16 collections theo sơ đồ ERD chuẩn hóa: `users`, `student_profiles`, `employers`, `company_profiles`, `cover_letters`, `resumes`, `jobs`, `categories`, `bookmarks`, `applications`, `reviews`, `chat_rooms`, `messages`, `notifications`, `reports`, `banned_keywords`.

### 2.3. Giải Pháp Truyền Thông Realtime & Phỏng Vấn WebRTC
- **Socket.IO:** Đảm bảo tin nhắn trao đổi giữa sinh viên và nhà tuyển dụng được chuyển phát tức thì, hiển thị trạng thái online/offline, typing indicator và cập nhật trạng thái đã xem.
- **WebRTC:** Cho phép thiết lập cuộc gọi video phỏng vấn ngang hàng (peer-to-peer) trực tiếp trên trình duyệt, không tốn băng thông máy chủ trung gian, hình ảnh HD và âm thanh rõ nét.

---

## CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

### 3.1. Sơ Đồ Phân Rã Chức Năng (WBS02)
Hệ thống được chuẩn hóa thành 3 nhánh chức năng độc lập tương ứng với 3 thành viên:
- Nhánh 1 (Vũ Thế Long): Xác thực SV, Profile SV, Quản lý CV đa năng, Tìm kiếm & lọc việc làm thông minh, Theo dõi tiến độ ứng tuyển, Đánh giá NTD, Tin nhắn & Video call.
- Nhánh 2 (Huỳnh Nguyễn Bảo Ngọc): Xác thực NTD, Quản lý hồ sơ công ty & GPKD, Quản lý tin tuyển dụng theo ca/giờ, Hệ thống ATS duyệt ứng viên, Đánh giá SV, Chat & Video call.
- Nhánh 3 (Lê Thị Thuỳ Ngân): Dashboard số liệu & tăng trưởng, Quản lý khóa/mở tài khoản, Kiểm duyệt tin tuyển dụng toàn sàn, Quản lý đánh giá chéo, Master Data danh mục, Xử lý báo cáo vi phạm, Kiểm duyệt hội thoại tự động.

### 3.2. Mô Hình Dữ Liệu Thực Thể (ERD - 16 Collections)
Cơ sở dữ liệu được tổ chức tại MongoDB Atlas (`CDTN02_DB`):
- Quan hệ 1-1 giữa `users` và `student_profiles` / `employers`.
- Quan hệ 1-N giữa `student_profiles` với `resumes`, `cover_letters`, `bookmarks`, `applications`.
- Quan hệ 1-N giữa `employers` với `company_profiles`, `jobs`.
- Bảng trung gian tương tác: `applications` (lưu snapshot hồ sơ), `reviews` (ràng buộc tối đa 2 chiều), `chat_rooms` và `messages`.

---

## CHƯƠNG 4: HIỆN THỰC VÀ KẾT QUẢ NGHIÊN CỨU

### 4.1. Hiện Thực Các Chức Năng Cốt Lõi
- **Ràng buộc 1 Email = 1 Role:** Middleware của hệ thống kiểm tra sự tồn tại của Email trong toàn bộ cơ sở dữ liệu `users`. Nếu email đã được cấp role `student`, hệ thống tuyệt đối không cho phép đăng ký thêm role `employer` hoặc `admin`.
- **Cơ Chế Xác Thực OTP 30 Giây & Tích Hợp Email Thực:** 
  - Mã OTP 6 chữ số ngẫu nhiên có thời hạn sống (TTL) 30 giây theo đặc tả ma trận kiểm tra.
  - Tích hợp đồng hồ đếm ngược thời gian thực dạng `00:ss` trực quan kèm thanh tiến trình màu chuyển đổi theo thời gian còn lại.
  - Tích hợp module gửi OTP trực tiếp đến hòm thư thực của người dùng qua giao thức SMTP (`backend/src/api/auth/auth_routes.py`), đảm bảo tính minh chứng thực tế, loại bỏ hoàn toàn việc hiển thị lộ mã trên web.
- **Loại Bỏ Hoàn Toàn Hộp Thoại Trình Duyệt (Zero Native Alerts/Confirms):**
  - Toàn bộ các hộp thoại `window.alert`, `window.confirm`, `window.prompt` (gây hiện tượng thông báo cục bộ `127.0.0.1:8000 cho biết` hoặc `localhost:8002 cho biết`) đã được thay thế 100% bằng thành phần giao diện chuẩn Dark 4D `<ConfirmDialog>` và thanh thông báo trạng thái dạng banner gắn dưới Header (Xanh lá: Thành công; Vàng: Đang xử lý; Đỏ: Cảnh báo).
- **Hệ Thống Xem & Tải Tài Liệu Chuẩn Kiểm Định (DocumentViewerModal):**
  - Hỗ trợ xem trực tiếp tài liệu CV Sinh viên và Giấy phép kinh doanh (GPKD) PDF toàn màn hình hoặc nhúng iframe thật, đồng thời hỗ trợ nút tải về máy tính theo chuẩn kiểm định chất lượng đề tài tốt nghiệp CDTN02.
  - Kiểm soát chặt chẽ định dạng và ngưỡng dung lượng: CV sinh viên (.pdf, ≤ 10MB), GPKD (.pdf, ≤ 10MB), Logo & Ảnh bìa (.png, .jpg, ≤ 10MB), Tệp đính kèm chat (.pdf, .png, .jpg, ≤ 10MB).
- **Quy Trình Ứng Tuyển & ATS Rõ Ràng (4 Chặng Tiến Độ):**
  - Khắc phục hiện tượng lặp lại trạng thái trên trục thời gian; chuẩn hóa thành 4 chặng cột mốc ngang: `[1. Nộp hồ sơ] -> [2. NTD đã xem] -> [3. Phỏng vấn] -> [4. Trúng tuyển / Từ chối]`.
- **Cổng Dịch Vụ Hợp Nhất Tại Port 8002:**
  - Hệ thống vận hành trơn tru tại địa chỉ `http://127.0.0.1:8002`, tránh xung đột cổng với CDTN01 (port 8000), tích hợp cả Backend Flask RESTful API, Socket.IO và Frontend Vite React SPA trên cùng một dịch vụ thống nhất.
- **Đồng Bộ Đa Thiết Bị (Laptop, PC, iPad, Mobile):**
  - Hệ thống giao diện thích ứng hoàn hảo trên mọi kích thước màn hình từ Desktop (> 1280px), Laptop (1024px), Máy tính bảng iPad (768px) đến Điện thoại di động (< 768px).
  - Bổ sung thanh điều hướng đáy di động (Mobile Bottom Navigation Dock) tối ưu thao tác ngón cái một chạm và ngăn kéo trượt (Mobile Drawer) mượt mà.
  - Mô hình 3D Three.js Logo đồng hồ chữ P hỗ trợ cả sự kiện rê chuột (PC/Laptop) lẫn cử chỉ vuốt cảm ứng đa điểm (Touch gestures trên iPad/Mobile).
- **Giao diện 3D Nhận Diện Thương Hiệu:**
  - Font chữ: `Be Vietnam Pro` chuẩn tiếng Việt hiển thị sắc nét trên mọi kích thước màn hình.
  - Logo 3D xoay linh hoạt hình đồng hồ chữ P màu xanh lá cây sinh thái, kết hợp các hạt năng lượng phát sáng.
  - Bộ thẻ việc làm được tối ưu hóa hiển thị thông tin ca làm, mức lương theo giờ và vị trí địa lý.
- **Tính Năng Chat & Lọc Từ Cấm Tự Động:** Tích hợp bộ lọc từ khóa độc hại tự động ngăn chặn các hành vi gian lận ngay trong lúc soạn tin nhắn.

### 4.2. Kết Quả Phân Công Công Việc
| Thành viên | Phân hệ đảm nhiệm | Tỷ lệ hoàn thành | Đánh giá đóng góp |
| :--- | :--- | :---: | :--- |
| **Vũ Thế Long** | Phân hệ Sinh viên (FR 1.1 đến 1.10) | 100% | Hoàn thành xuất sắc cổng sinh viên, CV uploader, quy trình ứng tuyển và chat/call. |
| **Huỳnh Nguyễn Bảo Ngọc** | Phân hệ Nhà tuyển dụng (FR 2.1 đến 2.9) | 100% | Hoàn thành xuất sắc hồ sơ doanh nghiệp, đăng tin, quy trình ATS duyệt ứng viên và đánh giá. |
| **Lê Thị Thuỳ Ngân** | Phân hệ Quản trị viên (FR 3.1 đến 3.9) | 100% | Hoàn thành xuất sắc Dashboard phân tích, quản trị người dùng, duyệt tin, từ cấm và báo cáo. |

### 4.3. Đánh Giá Kiểm Thử (UAT & Test Cases)
Hệ thống đã trải qua 24 kịch bản kiểm thử nghiêm ngặt từ TC-01 đến TC-24 (chi tiết tại file `dieukienrangbuoc.md`). 100% các ca kiểm thử về ràng buộc email duy nhất, thời hạn mã OTP 30 giây gửi thực tế qua email, xác thực mật khẩu ≥ 8 ký tự, nộp đơn không trùng lặp, chuyển đổi trạng thái ứng tuyển 4 chặng rõ ràng, kiểm duyệt từ cấm thời gian thực và loại bỏ hoàn toàn cảnh báo mặc định trình duyệt đều đạt kết quả PASS tuyệt đối.

---

## CHƯƠNG 5: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 5.1. Kết Quả Đạt Được
1. Hiện thực thành công nền tảng tuyển dụng sinh viên `PARTIME.VN` với kiến trúc Clean Architecture rõ ràng, độc lập mã nguồn giữa 3 thành viên, không gây xung đột khi làm việc nhóm trên Git.
2. Đáp ứng đầy đủ 100% các chức năng đề ra trong WBS02 cho cả 3 nhóm người dùng.
3. Thực thi an toàn quy tắc 1 Email cho đúng 1 Role trên CSDL MongoDB Atlas dùng chung.
4. Đạt chuẩn thẩm mỹ UI/UX cao với font `Be Vietnam Pro`, màu xanh hiện đại và hiệu ứng 3D trực quan.

### 5.2. Hướng Phát Triển Tiếp Theo
- Tích hợp thêm AI gợi ý việc làm thông minh dựa trên lịch học và kỹ năng của sinh viên.
- Phát triển ứng dụng di động đa nền tảng (React Native) để sinh viên nhận thông báo đẩy nhanh hơn.
- Kết nối hợp tác chính thức với các chuỗi cửa hàng và doanh nghiệp liên kết cùng Nhà trường.

---

## TÀI LIỆU THAM KHẢO
1. Robert C. Martin, *Clean Architecture: A Craftsman's Guide to Software Structure and Design*, Prentice Hall, 2017.
2. MongoDB Inc., *MongoDB Atlas Architecture and Document Modeling Best Practices*, 2024.
3. Mozilla Developer Network (MDN), *WebRTC API Documentation & Peer-to-Peer Architecture*, 2024.
4. Flask Community, *Flask-SocketIO Documentation: Real-Time Web Applications with Python*, 2024.
5. Tailwind Labs, *Tailwind CSS Utility-First Framework Guide*, 2024.

---

## PHỤ LỤC: HƯỚNG DẪN TÁI TẠO VÀ CÀI ĐẶT HỆ THỐNG
*(Xem chi tiết từng bước tái tạo hoàn chỉnh trong file `README.md` tại thư mục gốc của dự án).*

