# ==========================================
# 1. KHỞI TẠO LÕI BACKEND PYTHON & 9 BẢNG DB (TIẾNG ANH)
# ==========================================
# Tạo thư mục cấu hình, thư mục mô hình dữ liệu và 3 thư mục phân hệ độc lập
mkdir -p Backend/config Backend/models Backend/Student Backend/Employer Backend/Admin

# File môi trường (.env) chứa kết nối DB, .gitignore để loại bỏ file rác, requirements.txt để quản lý thư viện Python, main.py để chạy server tổng
touch Backend/.env Backend/.gitignore Backend/requirements.txt Backend/main.py

# File db.py cấu hình kết nối duy nhất đến MongoDB Atlas
touch Backend/config/__init__.py Backend/config/db.py

# Tạo 9 bảng CSDL (Models) dùng chung cho toàn bộ hệ thống
touch Backend/models/__init__.py 
touch Backend/models/User.py        # Lưu thông tin Tài khoản, Vai trò, Đăng nhập (WBS 1.1, 2.1, 3.1)
touch Backend/models/Job.py         # Lưu dữ liệu Tin Tuyển Dụng, mức lương, mô tả (WBS 1.5, 2.4, 3.5)
touch Backend/models/Application.py # Lưu Trạng thái Ứng tuyển: Chờ duyệt, Đã duyệt (WBS 1.6, 2.5)
touch Backend/models/Resume.py      # Lưu trữ đường dẫn tệp CV PDF của sinh viên (WBS 1.4)
touch Backend/models/Review.py      # Lưu điểm sao và nhận xét đánh giá chéo (WBS 1.7, 2.6, 3.6)
touch Backend/models/Message.py     # Lưu lịch sử chat, hội thoại Real-time và link WebRTC (WBS 1.8, 2.7)
touch Backend/models/Notification.py# Lưu thông báo hệ thống, trạng thái đã đọc (WBS 1.9, 2.8)
touch Backend/models/Category.py    # Lưu danh mục động: Ngành nghề, Vị trí (WBS 3.7)
touch Backend/models/Report.py      # Lưu các báo cáo vi phạm, lừa đảo (WBS 3.8)

# ==========================================
# 2. CHIA LUỒNG BACKEND PYTHON THEO WBS (CONTROLLERS)
# ==========================================
# Luồng Sinh Viên (Student): Nơi Long viết API
touch Backend/Student/__init__.py Backend/Student/routes.py
touch Backend/Student/auth.py        # API Xử lý Đăng nhập, Đăng ký, Đổi mật khẩu
touch Backend/Student/profile.py     # API Xử lý Cập nhật hồ sơ cá nhân & Upload CV
touch Backend/Student/job.py         # API Xử lý Tìm việc, Lọc việc làm & Nộp hồ sơ ứng tuyển
touch Backend/Student/interaction.py # API Xử lý Đánh giá, Gửi tin nhắn, Lấy thông báo

# Luồng Nhà Tuyển Dụng (Employer): Nơi Ngọc viết API
touch Backend/Employer/__init__.py Backend/Employer/routes.py
touch Backend/Employer/auth.py        # API Xử lý Đăng nhập, Đăng ký doanh nghiệp
touch Backend/Employer/company.py     # API Xử lý Cập nhật thông tin công ty, Logo
touch Backend/Employer/job.py         # API Xử lý Đăng tin tuyển dụng & Duyệt/Từ chối ứng viên
touch Backend/Employer/interaction.py # API Xử lý Đánh giá sinh viên, Chat, Quản lý thông báo

# Luồng Quản Trị Viên (Admin): Nơi Ngân viết API
touch Backend/Admin/__init__.py Backend/Admin/routes.py
touch Backend/Admin/auth.py        # API Xử lý Đăng nhập Admin
touch Backend/Admin/dashboard.py   # API Xử lý Thống kê biểu đồ & Quản lý Danh mục Master Data
touch Backend/Admin/management.py  # API Xử lý Khóa Users, Ẩn Tin vi phạm, Xóa Đánh giá, Xử lý Báo cáo

# ==========================================
# 3. KHỞI TẠO FRONTEND REACT THEO CHUẨN TIẾNG ANH
# ==========================================
# Frontend Sinh Viên (Student)
mkdir -p Frontend/Student/src/components Frontend/Student/src/pages Frontend/Student/src/services
touch Frontend/Student/package.json Frontend/Student/index.html Frontend/Student/src/services/api.js
touch Frontend/Student/src/pages/Login.jsx Frontend/Student/src/pages/Register.jsx
touch Frontend/Student/src/pages/Profile.jsx Frontend/Student/src/pages/ResumeManager.jsx
touch Frontend/Student/src/pages/JobSearch.jsx Frontend/Student/src/pages/JobDetail.jsx Frontend/Student/src/pages/ApplicationHistory.jsx
touch Frontend/Student/src/pages/Review.jsx Frontend/Student/src/pages/Message.jsx Frontend/Student/src/pages/Notification.jsx

# Frontend Nhà Tuyển Dụng (Employer)
mkdir -p Frontend/Employer/src/components Frontend/Employer/src/pages Frontend/Employer/src/services
touch Frontend/Employer/package.json Frontend/Employer/index.html Frontend/Employer/src/services/api.js
touch Frontend/Employer/src/pages/Login.jsx Frontend/Employer/src/pages/Register.jsx
touch Frontend/Employer/src/pages/CompanyProfile.jsx
touch Frontend/Employer/src/pages/JobManager.jsx Frontend/Employer/src/pages/CreateJob.jsx Frontend/Employer/src/pages/CandidateManager.jsx
touch Frontend/Employer/src/pages/StudentReview.jsx Frontend/Employer/src/pages/Message.jsx Frontend/Employer/src/pages/Notification.jsx

# Frontend Quản Trị Viên (Admin)
mkdir -p Frontend/Admin/src/components Frontend/Admin/src/pages Frontend/Admin/src/services
touch Frontend/Admin/package.json Frontend/Admin/index.html Frontend/Admin/src/services/api.js
touch Frontend/Admin/src/pages/Login.jsx
touch Frontend/Admin/src/pages/Dashboard.jsx
touch Frontend/Admin/src/pages/UserManager.jsx Frontend/Admin/src/pages/JobManager.jsx Frontend/Admin/src/pages/ReviewManager.jsx Frontend/Admin/src/pages/CategoryManager.jsx Frontend/Admin/src/pages/ReportManager.jsx

# ==========================================
# 4. KHỞI TẠO TÀI NGUYÊN CHUNG & LƯU LÊN GITHUB
# ==========================================
# Tạo thư mục chứa WBS, Excel tiến độ và hình ảnh Logo chung
mkdir -p Shared/Documents Shared/Assets
git add .
git commit -m "Khoi tao cau truc thu muc cho 3 role: Student, Employer, Admin"
git push


# Nền Tảng Marketplace Việc Làm Part-time Cho Sinh Viên (CDTN02)

Dự án CDTN02 là nền tảng kết nối việc làm bán thời gian, tích hợp hệ thống quản lý hồ sơ, tuyển dụng và tương tác trực tiếp (Chat Real-time & WebRTC). Hệ thống được chia thành 3 phân hệ giao diện độc lập sử dụng chung một cơ sở dữ liệu tập trung, đảm bảo mã nguồn modular và ngăn chặn xung đột (conflict) khi làm việc nhóm.

## 🛠 Ngôn Ngữ & Công Nghệ (Tech Stack)

*   **Frontend (Giao diện web):** React JS (Sử dụng đuôi file `.jsx`) - Xây dựng giao diện hiện đại bằng cách lắp ghép các Component. Bộ khung (HTML) và logic (JS) được viết gộp chung một cách tự nhiên trong các file `.jsx` giúp tái sử dụng code linh hoạt cho cả 3 role.
*   **Backend (Máy chủ & API):** Python, Flask - Đóng vai trò là bộ não của hệ thống, xử lý logic nghiệp vụ, kiểm tra xác thực phân quyền (Admin, Student, Employer) và cung cấp dữ liệu qua API.
*   **Môi trường khởi chạy:** Flask Development Server, Python 3.11 - Khởi chạy máy chủ web cục bộ để chạy liên tục mã lệnh Backend. *(Lưu ý: cổng mạng mặc định của Flask thường là `127.0.0.1:5000` thay vì `8000`)*.
*   **Cơ sở dữ liệu (Database):** MongoDB Atlas, MongoDB Compass - Atlas lưu trữ toàn bộ dữ liệu dự án trên đám mây; Compass giúp nhóm xem, thêm/sửa/xóa dữ liệu trực quan bằng giao diện trên máy tính.
*   **Môi trường lập trình (IDE):** Visual Studio Code (VS Code) - Trình soạn thảo mã nguồn chính cho cả Frontend (React) và Backend (Flask), tích hợp sẵn Terminal để chạy lệnh cài đặt thư viện.
*   **Kiểm thử API (Testing):** Postman - Công cụ chuyên dụng để nhóm gửi thử các yêu cầu xem Flask Backend có trả về đúng dữ liệu từ MongoDB hay không trước khi gắn vào giao diện React.
*   **Thiết kế trải nghiệm (UI/UX):** Figma, Stitch - Thiết kế, vẽ bản thảo giao diện (mockup) và luồng di chuyển giữa các trang trước khi bắt tay vào code Frontend.
*   **Quản lý mã nguồn (Source):** Git, GitHub - Lưu trữ an toàn các phiên bản code, giúp các thành viên cùng làm việc, ghép code lại với nhau mà không bị đè hay mất file.
*   **Quản lý công việc (Task):** Jira, Trello - Phân chia nhiệm vụ cụ thể cho từng thành viên, theo dõi tiến độ hoàn thành các tính năng của đồ án theo từng tuần.
*   **Kiến trúc:** Modular Monolith Backend & Micro-frontend (3 giao diện độc lập)

## 📂 Tổng Quan Kiến Trúc Thư Mục
*   `Backend/`: Chứa mã nguồn máy chủ, cấu hình kết nối DB và các luồng API phân tách theo vai trò.
*   `Frontend/`: Chứa 3 dự án React độc lập (`Admin`, `Employer`, `Student`).
*   `Shared/`: Tài liệu dự án (WBS, Excel) và tài nguyên hình ảnh dùng chung.

## 🔗 Bản Đồ Phân Bổ Logic (Backend)
Để đảm bảo code không giẫm chân nhau, luồng xử lý API được chia cứng theo thư mục:

### 1. Cơ Sở Dữ Liệu Tập Trung (`Backend/models/`)
Nơi định nghĩa cấu trúc (Schema) của MongoDB. Tất cả 3 roles đều phải gọi chung dữ liệu từ thư mục này.
*   `User.py`: Tài khoản, Phân quyền, Thông tin cơ bản.
*   `Job.py`: Tin Tuyển Dụng, Yêu cầu, Mức lương.
*   `Application.py`: Tiến độ & Trạng thái Ứng tuyển (Chờ duyệt, Đã duyệt).
*   `Resume.py`: Tệp đính kèm CV (PDF).
*   `Review.py`: Đánh giá chéo Sinh viên - NTD.
*   `Message.py`: Hội thoại, Tin nhắn Real-time.
*   `Notification.py`: Thông báo hệ thống.
*   `Category.py`: Danh mục Master Data.
*   `Report.py`: Báo cáo vi phạm.

### 2. Luồng Xử Lý Nghiệp Vụ (`Backend/`)
*   `Student/`: API xác thực SV, upload CV, tìm kiếm việc làm, nộp hồ sơ, chat.
*   `Employer/`: API đăng ký doanh nghiệp, quản lý tin đăng, xét duyệt ứng viên, đánh giá SV.
*   `Admin/`: API biểu đồ thống kê, quản lý/khóa người dùng, kiểm duyệt tin đăng, xử lý báo cáo.

## 💻 Bản Đồ Phân Bổ Giao Diện (Frontend)
Mỗi role sở hữu một thư mục Frontend riêng biệt. Các trang hiển thị (`pages/`) được chia nhỏ bám sát cấu trúc WBS:

### 1. Phân Hệ Sinh Viên (`Frontend/Student/src/pages`)
*   `Login.jsx` / `Register.jsx`: Xác thực.
*   `Profile.jsx`: Xem và Chỉnh sửa hồ sơ cá nhân.
*   `ResumeManager.jsx`: Tải lên và Quản lý danh sách CV.
*   `JobSearch.jsx` / `JobDetail.jsx`: Lọc, tìm kiếm, lưu và xem chi tiết việc làm.
*   `ApplicationHistory.jsx`: Xem lịch sử nộp hồ sơ.
*   `Message.jsx` / `Notification.jsx`: Tương tác, Chat, Gọi Video.
*   `Review.jsx`: Đánh giá doanh nghiệp.

### 2. Phân Hệ Nhà Tuyển Dụng (`Frontend/Employer/src/pages`)
*   `Login.jsx` / `Register.jsx`: Xác thực doanh nghiệp.
*   `CompanyProfile.jsx`: Quản lý thông tin và Logo công ty.
*   `JobManager.jsx` / `CreateJob.jsx`: Bảng điều khiển tin đăng và Tạo tin mới.
*   `CandidateManager.jsx`: Xem CV, Duyệt/Từ chối ứng viên.
*   `Message.jsx` / `Notification.jsx`: Hỗ trợ sinh viên, gửi link phỏng vấn.
*   `StudentReview.jsx`: Chấm điểm ứng viên.

### 3. Phân Hệ Quản Trị Viên (`Frontend/Admin/src/pages`)
*   `Login.jsx`: Đăng nhập.
*   `Dashboard.jsx`: Biểu đồ tăng trưởng, thống kê hệ thống.
*   `UserManager.jsx`: Quản lý, đình chỉ tài khoản vi phạm.
*   `JobManager.jsx`: Quản lý, ẩn tin tuyển dụng.
*   `ReviewManager.jsx` / `CategoryManager.jsx` / `ReportManager.jsx`: Quản lý Master Data và phản hồi.

## ⚠️ Quy Tắc Quản Lý Mã Nguồn (Git Workflow)
1.  **Ranh giới thư mục:** Frontend và Backend của role nào, người đó tự quản lý và giới hạn thao tác trong thư mục đó.
2.  **Đồng bộ DB:** Mọi thay đổi trong `Backend/models/` phải được thống nhất với toàn team trước khi commit.
3.  **Branching:** Không code trực tiếp trên nhánh `main`. Luôn tạo nhánh mới (ví dụ: `git checkout -b feature/student-login`).
4.  **Hợp nhất:** Cập nhật nhánh chính (`git pull origin main`) trước khi gộp (merge) code cá nhân lên kho lưu trữ.