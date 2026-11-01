/**
 * Danh mục chuyên nghiệp, địa bàn hành chính TP.HCM và quy tắc trạng thái (CDTN02)
 */

// Danh sách gợi ý hơn 35 ngành nghề việc làm Part-time phổ biến cho sinh viên
export const PROFESSION_SUGGESTIONS = [
  "Nhân viên Barista / Pha chế",
  "Pha chế trà sữa / Thu ngân F&B",
  "Phục vụ nhà hàng / Quán café",
  "Thu ngân siêu thị / Cửa hàng tiện lợi",
  "Lễ tân khách sạn / Tòa nhà",
  "Gia sư Tiếng Anh",
  "Gia sư Toán / Lý / Hóa",
  "Gia sư Tiểu học",
  "Nhân viên giao hàng / Shipper công nghệ",
  "Quản trị Fanpage / Trực chat page",
  "Content Creator / Viết bài SEO",
  "Thiết kế đồ họa / Canva / Banner",
  "Chăm sóc khách hàng (CSKH)",
  "Telesales / Tư vấn tuyển sinh",
  "Bán hàng siêu thị (Co.opmart, WinMart)",
  "PG / PB Sự kiện & Triển lãm",
  "Dịch thuật tài liệu Anh - Việt",
  "Nhập liệu dữ liệu văn phòng",
  "Trợ giảng tiếng Anh trung tâm",
  "Trợ lý thư viện trường học",
  "Nhân viên đóng gói kho Shopee / Lazada",
  "Trực tổng đài hỗ trợ kỹ thuật",
  "Mẫu ảnh thời trang Lookbook",
  "Quay phim / Chụp ảnh sự kiện",
  "Hỗ trợ IT Helpdesk trường học",
  "Lập trình viên tập sự (Frontend / Python / Node)",
  "Kiểm thử phần mềm (Tester) part-time",
  "Phụ bếp / Sơ chế thực phẩm",
  "Nhân viên rạp chiếu phim (CGV / Lotte)",
  "Soạn thảo văn bản & Hỗ trợ hành chính",
  "Hướng dẫn viên du lịch sinh viên",
  "Tiếp thị sản phẩm (Sampling)",
  "Bảo vệ ca đêm / Trực an ninh trường học",
  "Cộng tác viên truyền thông sự kiện"
];

// Danh sách ngành nghề nhóm việc làm chuẩn cho dropdown
export const JOB_CATEGORIES = [
  "Tất cả ngành nghề",
  "F&B / Pha chế / Phục vụ café",
  "Bán hàng / Thu ngân / Tiện lợi",
  "Gia sư / Trợ giảng / Giáo dục",
  "IT / Lập trình / Tester / Kỹ thuật",
  "Marketing / Content / Thiết kế đồ họa",
  "Chăm sóc khách hàng / Telesales / Trực page",
  "Lễ tân / Hành chính / Văn phòng",
  "Giao hàng / Kho vận / Logistics",
  "Sự kiện / PG / PB / Truyền thông",
  "Dịch thuật / Biên tập / Nhập liệu",
  "Khách sạn / Nhà hàng / Du lịch",
  "Thời trang / Mẫu ảnh / Chụp ảnh"
];

// ĐẦY ĐỦ TẤT CẢ 24 QUẬN / HUYỆN / THÀNH PHỐ THUỘC TP. HỒ CHÍ MINH
export const HCM_DISTRICTS = [
  "Quận 1",
  "Quận 3",
  "Quận 4",
  "Quận 5",
  "Quận 6",
  "Quận 7",
  "Quận 8",
  "Quận 10",
  "Quận 11",
  "Quận 12",
  "Bình Thạnh",
  "Gò Vấp",
  "Phú Nhuận",
  "Tân Bình",
  "Tân Phú",
  "Bình Tân",
  "TP. Thủ Đức",
  "Bình Chánh",
  "Hóc Môn",
  "Củ Chi",
  "Nhà Bè",
  "Cần Giờ"
];

// GỢI Ý CHI NHÁNH TÍCH HỢP TẤT CẢ CÁC QUẬN TP.HCM
export const HCM_BRANCH_SUGGESTIONS = [
  "Chi nhánh Quận 1 (42 Nguyễn Huệ, P. Bến Nghé)",
  "Chi nhánh Quận 1 (134 Lê Lợi, P. Bến Thành)",
  "Chi nhánh Quận 3 (325 Cao Thắng, Phường 12)",
  "Chi nhánh Quận 3 (45 Nguyễn Đình Chiểu, Phường 6)",
  "Chi nhánh Quận 4 (23 Hoàng Diệu, Phường 12)",
  "Chi nhánh Quận 5 (188 Trần Hưng Đạo, Phường 11)",
  "Chi nhánh Quận 6 (150 Hậu Giang, Phường 6)",
  "Chi nhánh Quận 7 (101 Tôn Dật Tiên, P. Tân Phú)",
  "Chi nhánh Quận 7 (Crescent Mall, P. Tân Phú)",
  "Chi nhánh Quận 8 (845 Tạ Quang Bửu, Phường 5)",
  "Chi nhánh Quận 10 (218 Ba Tháng Hai, Phường 12)",
  "Chi nhánh Quận 11 (397 Lạc Long Quân, Phường 5)",
  "Chi nhánh Quận 12 (102 Tô Ký, P. Tân Chánh Hiệp)",
  "Chi nhánh Bình Thạnh (69/1 Đinh Bộ Lĩnh, Phường 26)",
  "Chi nhánh Bình Thạnh (45 Điện Biên Phủ, Phường 15)",
  "Chi nhánh Gò Vấp (12 Quang Trung, Phường 10)",
  "Chi nhánh Gò Vấp (78 Phan Văn Trị, Phường 7)",
  "Chi nhánh Phú Nhuận (216 Phan Xích Long, Phường 2)",
  "Chi nhánh Tân Bình (15 Hoàng Hoa Thám, Phường 13)",
  "Chi nhánh Tân Bình (20 Cộng Hòa, Phường 4)",
  "Chi nhánh Tân Phú (30 Lũy Bán Bích, P. Tân Thới Hòa)",
  "Chi nhánh Bình Tân (Số 1 Đường số 17A, P. Bình Trị Đông B)",
  "Chi nhánh TP. Thủ Đức (216 Võ Văn Ngân, P. Bình Thọ)",
  "Chi nhánh TP. Thủ Đức (GigaMall 242 Phạm Văn Đồng, P. Hiệp Bình Chánh)",
  "Chi nhánh TP. Thủ Đức (Khu Đô Thị Sala, P. An Lợi Đông)",
  "Chi nhánh Bình Chánh (12 Quốc lộ 50, Bình Hưng)",
  "Chi nhánh Hóc Môn (45 Lý Thường Kiệt, TT. Hóc Môn)",
  "Chi nhánh Củ Chi (18 Tỉnh Lộ 8, TT. Củ Chi)",
  "Chi nhánh Nhà Bè (15 Huỳnh Tấn Phát, Phú Xuân)",
  "Chi nhánh Cần Giờ (20 Rừng Sác, Bình Khánh)"
];

// DANH MỤC TRẠNG THÁI LỌC TIN TUYỂN DỤNG THEO YÊU CẦU (FR 2.4.2)
export const JOB_STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'open', label: 'Đang tuyển' },
  { value: 'closed', label: 'Tạm đóng' },
  { value: 'filled', label: 'Đã nhận người' },
  { value: 'completed', label: 'Hoàn thành' }
];

/**
 * Lọc gợi ý theo từ khóa
 */
export function filterSuggestions(query, limit = 8) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  return PROFESSION_SUGGESTIONS.filter(item => 
    item.toLowerCase().includes(q)
  ).slice(0, limit);
}

/**
 * Chuẩn hóa màu sắc trạng thái (Status Colors):
 * - Vàng (Amber): Chờ duyệt (Pending / Waiting)
 * - Đỏ (Red): Từ chối / Khóa / Cảnh báo / Ngưng hoạt động (Rejected / Banned / Danger / Inactive)
 * - Xanh lá (Emerald): Đang hoạt động / Đã duyệt / Trúng tuyển (Active / Approved / Safe)
 * - Xanh dương (Blue/Sky): Phỏng vấn / Đang tuyển / Đã nhận người (Interview / Open / Filled)
 * - Cam (Orange): Tạm dừng (Paused / Offline)
 */
export function getStatusBadge(status) {
  const s = String(status || '').toLowerCase().trim();
  
  if (['pending', 'waiting', 'cho_duyet', 'chờ duyệt', 'cho_xu_ly', 'pending_approval'].includes(s)) {
    return {
      label: 'Chờ Duyệt',
      className: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
    };
  }
  
  if (['interview', 'interviewing', 'processing', 'investigating', 'dang_phong_van', 'đang xử lý'].includes(s)) {
    return {
      label: 'Đang Phỏng Vấn',
      className: 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-semibold'
    };
  }
  
  if (['active', 'approved', 'safe', 'resolved', 'hoat_dong', 'trúng tuyển', 'open', 'dang_tuyen'].includes(s)) {
    return {
      label: 'Đang Hoạt Động',
      className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
    };
  }

  if (['paused', 'tam_dung', 'closed', 'tam_dong'].includes(s)) {
    return {
      label: 'Tạm Dừng',
      className: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
    };
  }

  if (['filled', 'da_tuyen'].includes(s)) {
    return {
      label: 'Đã Đủ Người',
      className: 'bg-blue-500/20 text-sky-300 border border-blue-500/40 font-semibold'
    };
  }

  if (['completed', 'hoan_thanh'].includes(s)) {
    return {
      label: 'Đã Hoàn Thành',
      className: 'bg-sky-500/20 text-sky-200 border border-sky-500/40 font-semibold'
    };
  }
  
  if (['rejected', 'banned', 'hidden', 'dismissed', 'danger', 'khoa', 'từ chối', 'inactive', 'ngung_hoat_dong'].includes(s)) {
    return {
      label: 'Ngưng Hoạt Động',
      className: 'bg-red-500/20 text-red-300 border border-red-500/40 font-semibold'
    };
  }

  return {
    label: status,
    className: 'bg-slate-800 text-slate-300 border border-slate-700 font-medium'
  };
}
