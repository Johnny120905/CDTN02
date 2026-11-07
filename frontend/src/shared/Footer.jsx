import React, { useState } from 'react';
import BrandLogo from './BrandLogo';
import ConfirmDialog from './ConfirmDialog';
import { 
  ShieldCheck, FileText, HelpCircle, PhoneCall, CheckCircle2, 
  Building2, GraduationCap, Database, Radio, Info, Layers
} from 'lucide-react';

export default function Footer({ currentUser, onNavigateMenu }) {
  const role = currentUser?.role || 'student';
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', message: '' });

  const showInfo = (title, message) => {
    setInfoModal({ isOpen: true, title, message });
  };

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-sm mt-auto shadow-sm">
      <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 mb-8">
          
          {/* CỘT 1: THƯƠNG HIỆU & GIỚI THIỆU HỆ THỐNG */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => onNavigateMenu && onNavigateMenu('home')}
              className="flex items-center gap-3 cursor-pointer group hover:opacity-95 transition-opacity text-left"
              title="Quay về Trang Chủ"
            >
              <BrandLogo size="md" />
            </button>
            <p className="text-slate-600 leading-relaxed text-sm max-w-sm">
              Nền tảng tuyển dụng việc làm linh hoạt và bán thời gian hàng đầu dành cho sinh viên. 
              Cam kết 100% doanh nghiệp xác minh giấy phép kinh doanh, tuyệt đối không thu phí cọc và hỗ trợ xếp ca học linh hoạt.
            </p>
            
          </div>

          {/* CỘT 2: ĐIỀU HƯỚNG NHANH THEO VAI TRÒ */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {role === 'student' && <GraduationCap className="w-5 h-5 text-blue-600" />}
              {role === 'employer' && <Building2 className="w-5 h-5 text-blue-600" />}
              {role === 'admin' && <ShieldCheck className="w-5 h-5 text-blue-600" />}
              <span>
                {role === 'student' ? 'Dành Cho Sinh Viên' : (role === 'employer' ? 'Dành Cho Nhà Tuyển Dụng' : 'Phân Hệ Quản Trị Hệ Thống')}
              </span>
            </h4>
            <ul className="space-y-2.5 text-sm">
              {role === 'student' && (
                <>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('jobs')} 
                      className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer flex items-center gap-1.5 font-medium"
                    >
                      <span>• Khám phá việc làm part-time theo ca học</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('profile_cv')} 
                      className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer flex items-center gap-1.5 font-medium"
                    >
                      <span>• Quản lý kho CV PDF chuẩn</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('applications')} 
                      className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer flex items-center gap-1.5 font-medium"
                    >
                      <span>• Theo dõi tiến độ hồ sơ & lịch phỏng vấn</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => showInfo('Cẩm Nang Tìm Việc An Toàn', 'Tuyệt đối từ chối các tin tuyển dụng yêu cầu chuyển khoản đặt cọc, nạp tiền làm nhiệm vụ, hoặc cài đặt ứng dụng không rõ nguồn gốc. Hãy sử dụng chức năng Báo Cáo Vi Phạm nếu phát hiện dấu hiệu lừa đảo.')} 
                      className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer flex items-center gap-1.5 font-medium"
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
                      onClick={() => onNavigateMenu && onNavigateMenu('post_job')} 
                      className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer flex items-center gap-1.5 font-medium"
                    >
                      <span>• Đăng tin tuyển dụng part-time theo ca (60s)</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('applicants')} 
                      className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer flex items-center gap-1.5 font-medium"
                    >
                      <span>• Phễu ứng viên chuẩn hóa ATS Kanban</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('company')} 
                      className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer flex items-center gap-1.5 font-medium"
                    >
                      <span>• Thẩm định Giấy phép kinh doanh (GPKD)</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('interviews')} 
                      className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer flex items-center gap-1.5 font-medium"
                    >
                      <span>• Phỏng vấn trực tuyến video WebRTC</span>
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
                      className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer flex items-center gap-1.5 font-medium"
                    >
                      <span>• Trung tâm chỉ huy (Analytics Dashboard)</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('gpkd_verification')} 
                      className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer flex items-center gap-1.5 font-medium"
                    >
                      <span>• Bàn thẩm định GPKD & Mã số thuế 10/13 số</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('keywords')} 
                      className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer flex items-center gap-1.5 font-medium"
                    >
                      <span>• Kiểm duyệt từ khoá cấm & Quét chat tự động</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      onClick={() => onNavigateMenu && onNavigateMenu('categories')} 
                      className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer flex items-center gap-1.5 font-medium"
                    >
                      <span>• Quản trị danh mục Master Data (63 Tỉnh/Thành)</span>
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* CỘT 3: HỖ TRỢ KỸ THUẬT & AN TOÀN NỀN TẢNG */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-emerald-600" />
              <span>Đường Dây Nóng Hỗ Trợ</span>
            </h4>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Tổng đài hỗ trợ sinh viên:</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">1900 8888</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Thẩm định DN & Kỹ thuật:</span>
                <span className="font-mono font-bold text-blue-600 text-sm">028 7300 8888</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Hòm thư giải quyết tố cáo:</span>
                <span className="font-mono text-slate-700 text-sm font-medium">partime.support@gmail.com</span>
              </div>
            </div>
            
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <div>
            © 2026 PARTIME.VN - Nền Tảng Tuyển Dụng Sinh Viên Part-time & Thời Vụ. All rights reserved.
          </div>
        </div>
      </div>

    {/* Info Dialog */}
      <ConfirmDialog
        isOpen={infoModal.isOpen}
        title={infoModal.title}
        message={infoModal.message}
        type="info"
        confirmText="Đã Hiểu"
        onConfirm={() => setInfoModal({ isOpen: false, title: '', message: '' })}
        onCancel={() => setInfoModal({ isOpen: false, title: '', message: '' })}
      />
    </footer>
  );
}
