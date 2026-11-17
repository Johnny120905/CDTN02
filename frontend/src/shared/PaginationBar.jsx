import React from 'react';

/**
 * COMPONENT PHÂN TRANG & BỘ CHỌN SỐ LƯỢNG HIỂN THỊ CHUẨN HÓA (PARTIME.VN)
 * Dùng chung cho cả 3 phân hệ: Sinh viên (Student), Nhà tuyển dụng (Employer), Quản trị viên (Admin)
 * 
 * Đáp ứng đầy đủ các tiêu chí kỹ thuật:
 * - Vị trí: Đặt ngay bên dưới khu vực tìm kiếm / bộ lọc và phía trên khung bảng / danh sách
 * - Tùy chọn: 10 mục/trang, 20 mục/trang, 50 mục/trang, Tất cả ({totalItems})
 * - Nhãn rõ ràng: "Số mục mỗi trang:"
 * - Hiển thị tổng số bản ghi: (Tổng: {totalItems} {itemLabel})
 * - Thông tin: Trang {currentPage} / {totalPages}
 * - Nút: "Trang trước", "Trang sau" (không tự ý thêm icon)
 * - Tự động đưa về trang 1 khi đổi số lượng hiển thị
 * - Responsive trên Desktop, Tablet, Mobile
 */
export default function PaginationBar({
  currentPage = 1,
  totalPages = 1,
  pageSize = '10',
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'mục',
  className = ''
}) {
  const computedTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage || 1), computedTotalPages);

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 ${className}`}
    >
      {/* Bộ chọn số lượng hiển thị & Tổng số bản ghi */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-slate-600 whitespace-nowrap">Số mục mỗi trang:</span>
        <select
          value={pageSize}
          onChange={(e) => {
            const nextSize = e.target.value;
            if (onPageSizeChange) onPageSizeChange(nextSize);
            if (onPageChange) onPageChange(1);
          }}
          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none cursor-pointer focus:border-blue-500 shadow-xs transition-colors"
        >
          <option value="10">10 mục/trang</option>
          <option value="20">20 mục/trang</option>
          <option value="50">50 mục/trang</option>
          <option value="all">Tất cả ({totalItems})</option>
        </select>
        <span className="text-slate-500 font-medium whitespace-nowrap">
          (Tổng: <span className="font-bold text-slate-800">{totalItems}</span> {itemLabel})
        </span>
      </div>

      {/* Điều khiển chuyển trang */}
      <div className="flex items-center gap-2">
        <span className="text-slate-600 font-semibold whitespace-nowrap">
          Trang <span className="text-slate-900 font-bold">{safeCurrentPage}</span> / {computedTotalPages}
        </span>
        <button
          type="button"
          disabled={safeCurrentPage <= 1 || pageSize === 'all' || totalItems === 0}
          onClick={() => onPageChange && onPageChange(Math.max(1, safeCurrentPage - 1))}
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          Trang trước
        </button>
        <button
          type="button"
          disabled={safeCurrentPage >= computedTotalPages || pageSize === 'all' || totalItems === 0}
          onClick={() => onPageChange && onPageChange(Math.min(computedTotalPages, safeCurrentPage + 1))}
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          Trang sau
        </button>
      </div>
    </div>
  );
}
