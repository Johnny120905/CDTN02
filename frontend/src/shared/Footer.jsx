import React, { useState } from 'react';
import BrandLogo from './BrandLogo';
import ConfirmDialog from './ConfirmDialog';
import { 
  ShieldCheck, FileText, HelpCircle, PhoneCall, CheckCircle2, 
  Sparkles, Building2, GraduationCap, Database, Radio, Info, Layers
} from 'lucide-react';

export default function Footer({ currentUser, onNavigateMenu }) {
  const role = currentUser?.role || 'student';
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', message: '' });

  const showInfo = (title, message) => {
    setInfoModal({ isOpen: true, title, message });
  };

  return (
    <footer className="bg-[#070d1e] border-t border-blue-900/40 text-slate-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* CỘT 1: THƯƠNG HIỆU & GIỚI THIỆU HỆ THỐNG */}
          <div className="space-y-3.5">
            <button
              type="button"
              onClick={() => onNavigateMenu && onNavigateMenu('home')}
              className="flex items-center gap-3 cursor-pointer group hover:opacity-95 transition-opacity text-left"
              title="Quay về Trang Chủ"
            >
              <BrandLogo size="md" />
            </button>
            <p className="text-slate-400 leading-relaxed text-xs max-w-sm">
              Nền tảng tuyển dụng việc làm linh hoạt và bán thời gian hàng đầu dành cho sinh viên. 
              Cam kết 100% doanh nghiệp xác minh giấy phép kinh doanh, tuyệt đối không thu phí cọc và hỗ trợ xếp ca học linh hoạt.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-sky-400 font-semibold pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Cổng dịch vụ {role === 'admin' ? 'Quản Trị Viên' : (role === 'employer' ? 'Nhà Tuyển Dụng' : 'Sinh Viên')} đang hoạt động</span>
            </div>
          </div>

          {/* CỘT 2: ĐIỀU HƯỚNG NHANH THEO VAI TRÒ */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              {role === 'student' && <GraduationCap className="w-4 h-4 text-sky-400" />}
              {role === 'employer' && <Building2 className="w-4 h-4 text-sky-400" />}
              {role === 'admin' && <ShieldCheck className="w-4 h-4 text-sky-400" />}
              <span>
                {role === 'student' ? 'Dành Cho Sinh Viên' : (role === 'employer' ? 'Dành Cho Nhà Tuyển Dụng' : 'Phân Hệ Quản Trị Hệ Thống')}
              </span>
            </h4>
            <ul className="space-y-2 text-xs">
              {role === 'student' && (
                <>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('jobs')} 
                      className="hover:text-sky-300 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span>• Tìm việc làm part-time nhanh theo ca học</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('cv')} 
                      className="hover:text-sky-300 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span>• Quản lý kho CV PDF & Thư giới thiệu chuẩn</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('applications')} 
                      className="hover:text-sky-300 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span>• Theo dõi tiến độ 4 giai đoạn hồ sơ & Phỏng vấn</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => showInfo('Cẩm Nang Tìm Việc An Toàn', 'Tuyệt đối từ chối các tin tuyển dụng yêu cầu chuyển khoản đặt cọc, nạp tiền làm nhiệm vụ, hoặc cài đặt ứng dụng không rõ nguồn gốc. Hãy sử dụng chức năng Báo Cáo Vi Phạm nếu phát hiện dấu hiệu lừa đảo.')} 
                      className="hover:text-sky-300 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span>• Cẩm nang phỏng vấn & tìm việc làm an toàn</span>
                    </button>
                  </li>
                </>
              )}

              {role === 'employer' && (
                <>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('jobs')} 
                      className="hover:text-sky-300 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span>• Quản lý danh sách tin đăng tuyển dụng</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('applicants')} 
                      className="hover:text-sky-300 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span>• Quản trị phễu ứng viên & Hồ sơ CV trực tuyến</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('company')} 
                      className="hover:text-sky-300 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span>• Hồ sơ thương hiệu doanh nghiệp & Giấy phép GPKD</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('reviews')} 
                      className="hover:text-sky-300 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span>• Đánh giá năng lực sinh viên sau ca làm việc</span>
                    </button>
                  </li>
                </>
              )}

              {role === 'admin' && (
                <>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('dashboard')} 
                      className="hover:text-sky-300 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span>• Dashboard thống kê tuần, tháng, năm</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('users')} 
                      className="hover:text-sky-300 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span>• Phê duyệt GPKD & Kiểm duyệt người dùng</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('reports')} 
                      className="hover:text-sky-300 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span>• Xử lý báo cáo vi phạm & Xem bằng chứng chat</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('keywords')} 
                      className="hover:text-sky-300 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span>• Quản trị bộ lọc từ khóa cấm toàn hệ thống</span>
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* CỘT 3: CHÍNH SÁCH, TIÊU CHUẨN & HỖ TRỢ */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Chính Sách & Tiêu Chuẩn Kiểm Định</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => showInfo('Chính Sách Bảo Mật Hồ Sơ', 'Hồ sơ cá nhân và tệp CV của sinh viên được bảo vệ nghiêm ngặt. Thông tin liên hệ chỉ hiển thị với các Nhà tuyển dụng đã được Quản trị viên đối soát Giấy phép kinh doanh hợp lệ.')}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer"
                >
                  • Quy định bảo mật hồ sơ & CV cá nhân
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => showInfo('Tiêu Chuẩn Kiểm Định GPKD', 'Doanh nghiệp bắt buộc đính kèm tệp GPKD định dạng .pdf dung lượng ≤ 10MB khi đăng ký. Quản trị viên đối chiếu thông tin pháp nhân trên CSDL quốc gia trước khi kích hoạt quyền đăng tin.')}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer"
                >
                  • Quy định kiểm duyệt Giấy phép kinh doanh (GPKD)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => showInfo('Kênh Hỗ Trợ 24/7', 'Đầu mối liên hệ Quản trị viên: lethithuyngan985@gmail.com | Hotline hỗ trợ kỹ thuật: 1900-CDTN02 (Khoa CNTT, Trường Đại học Văn Lang).')}
                  className="text-amber-400 hover:text-amber-300 transition-colors text-left cursor-pointer"
                >
                  • Kênh hỗ trợ & Liên hệ Ban Quản Trị
                </button>
              </li>
              <li>
                <span className="text-slate-500 text-[11px] block pt-1">
                  • Chuẩn kiểm định chất lượng đồ án tốt nghiệp CDTN02 - NFR-01 Responsive
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* DÒNG BẢN QUYỀN ĐỒNG BỘ CHO CẢ 3 ROLE */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p className="font-medium text-slate-400 text-center sm:text-left">
            © 2026 CDTN02 – Chuyên ngành Công nghệ phần mềm – Khoa CNTT, Trường Đại học Văn Lang.
          </p>
          <div className="flex items-center gap-4 text-sky-400/90 font-mono text-[10px]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Database className="w-3.5 h-3.5" />
              <span>MongoDB Atlas: Connected</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 text-sky-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Socket.IO: Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* INFORMATIONAL DIALOG MODAL (REPLACES ALL BROWSER ALERTS) */}
      <ConfirmDialog
        isOpen={infoModal.isOpen}
        title={infoModal.title}
        message={infoModal.message}
        type="info"
        confirmText="Đã Hiểu"
        showCancel={false}
        onConfirm={() => setInfoModal({ isOpen: false, title: '', message: '' })}
        onCancel={() => setInfoModal({ isOpen: false, title: '', message: '' })}
      />
    </footer>
  );
}
