import React, { useState, useRef, useEffect } from 'react';
import BrandLogo from './BrandLogo';
import { 
  LogOut, UserCheck, ChevronDown, User, ShieldCheck, 
  GraduationCap, Briefcase, Settings, Trash2, AlertTriangle, X,
  Search, Bell, MessageSquare, Plus, Menu, ExternalLink,
  CheckCircle2, Clock, ChevronRight, AlertCircle, Building2
} from 'lucide-react';
import { getStatusBadge } from './professionSuggestions';

export default function Header({ 
  currentUser, 
  onLogout, 
  onOpenAccountModal, 
  onGoHome,
  onNavigateMenu,
  onToggleSidebar,
  onToggleChatDrawer,
  onSearchChange,
  onCreateJobClick,
  activeSectionTitle = 'Trang Chủ'
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const dropdownRef = useRef(null);
  const notiRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const token = localStorage.getItem('partime_token');
  const role = currentUser?.role;
  const isEmployer = role === 'employer';
  const isStudent = role === 'student';
  const isAdmin = role === 'admin';

  // Identity naming
  const representativeName = currentUser?.profile?.representative_name || 
                            currentUser?.profile?.full_name || 
                            currentUser?.full_name || 
                            'Người đại diện';
                            
  const companyName = currentUser?.profile?.company_name || 
                      currentUser?.company_name || 
                      (isEmployer ? 'Phúc Long Coffee & Tea' : '');
                      
  const branchName = currentUser?.profile?.branch_name || 
                     currentUser?.profile?.address || 
                     'Chi nhánh Quận 1, TP.HCM';

  const studentName = currentUser?.profile?.full_name || 
                      currentUser?.full_name || 
                      'Vũ Thế Long';

  const adminName = currentUser?.profile?.full_name || 
                    'Lê Thị Thuỳ Ngân';

  const userStatus = currentUser?.profile?.status || currentUser?.status || 'active';
  const statusBadge = getStatusBadge(userStatus);

  // Employer approval status for GPKD banner
  const employerApprovalStatus = currentUser?.employer_record?.approval_status || 
                                currentUser?.approval_status || 
                                'approved'; // 'approved' | 'pending' | 'rejected'

  // Fetch notifications according to role
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const endpoint = isEmployer ? '/api/employer/notifications' : (isStudent ? '/api/student/notifications' : null);
      if (!endpoint) return;
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
        const unread = data.data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.warn('Could not fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [token, role]);

  // Handle Mark as Read on Hover (FR 1.9.2 & FR 2.8.2)
  const handleNotiHover = async (noti) => {
    if (noti.is_read) return;
    // Optimistic update
    setNotifications(prev => prev.map(n => n._id === noti._id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const endpoint = isEmployer ? `/api/employer/notifications/${noti._id}/read` : `/api/student/notifications/${noti._id}/read`;
      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.warn('Error marking noti as read:', e);
    }
  };

  // Handle Delete Notification with slide-out (FR 1.9.3 & FR 2.8.3)
  const handleDeleteNoti = async (notiId, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n._id !== notiId));
    try {
      const endpoint = isEmployer ? `/api/employer/notifications/${notiId}` : `/api/student/notifications/${notiId}`;
      await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.warn('Error deleting noti:', err);
    }
  };

  // Handle Notification Click & Navigation to related screen
  const handleNotiClick = (n) => {
    handleNotiHover(n);
    setNotiOpen(false);
    const type = (n.type || '').toLowerCase();
    const title = (n.title || '').toLowerCase();
    const targetId = (n.target_id || n.related_id || '').toLowerCase();

    if (type.includes('chat') || type.includes('call') || title.includes('tin nhắn') || title.includes('cuộc gọi')) {
      if (onToggleChatDrawer) onToggleChatDrawer();
      else if (onNavigateMenu) onNavigateMenu('chat');
    } else if (type.includes('app') || targetId.startsWith('app_') || title.includes('ứng tuyển') || title.includes('hồ sơ')) {
      if (onNavigateMenu) onNavigateMenu(isEmployer ? 'applicants' : 'applications');
    } else if (type.includes('review') || title.includes('đánh giá')) {
      if (onNavigateMenu) onNavigateMenu('reviews');
    } else if (type.includes('gpkd') || type.includes('license') || title.includes('giấy phép')) {
      if (onNavigateMenu) onNavigateMenu(isAdmin ? 'licenses' : 'company');
    } else if (type.includes('job') || targetId.startsWith('job_') || title.includes('việc làm') || title.includes('tuyển dụng')) {
      if (onNavigateMenu) onNavigateMenu('jobs');
    } else if (isAdmin) {
      if (onNavigateMenu) onNavigateMenu('dashboard');
    } else {
      if (onNavigateMenu) onNavigateMenu('home');
    }
  };

  // Search input Debounce 300ms (FR 1.5.1)
  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(val);
      }
    }, 300);
  };

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setNotiOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Delete Account (FR 1.2.3 & FR 2.2.3)
  const handleDeleteAccountSubmit = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setDeleteModalOpen(false);
        onLogout();
      } else {
        setDeleteModalOpen(false);
      }
    } catch (err) {
      setDeleteModalOpen(false);
      onLogout();
    } finally {
      setDeleteLoading(false);
    }
  };

  const getRoleConfig = (r) => {
    switch (r) {
      case 'student':
        return {
          title: 'Sinh Viên',
          badgeColor: 'bg-blue-500/15 text-sky-300 border-blue-500/30',
          icon: <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
        };
      case 'employer':
        return {
          title: 'Nhà Tuyển Dụng',
          badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
          icon: <Briefcase className="w-3.5 h-3.5 text-sky-400" />
        };
      case 'admin':
        return {
          title: 'Quản Trị Viên Hệ Thống',
          badgeColor: 'bg-blue-500/15 text-sky-300 border-blue-500/30',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
        };
      default:
        return {
          title: 'Thành viên',
          badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
          icon: <User className="w-3.5 h-3.5 text-slate-400" />
        };
    }
  };

  const roleConfig = getRoleConfig(currentUser?.role);

  return (
    <div className="sticky top-0 z-40 w-full flex flex-col shadow-xl shadow-black/60">
      
      {/* 1. BANNER CẢNH BÁO GPKD DÀNH CHO NHÀ TUYỂN DỤNG (Nằm sát mép trên Header - 2.1.2 & 2.3.2) */}
      {isEmployer && employerApprovalStatus !== 'approved' && (
        <div className={`w-full py-2 px-4 flex items-center justify-between text-xs font-semibold ${
          employerApprovalStatus === 'rejected' 
            ? 'bg-red-950/95 text-red-200 border-b border-red-700/50' 
            : 'bg-amber-950/95 text-amber-200 border-b border-amber-700/50'
        }`}>
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <AlertTriangle className={`w-4 h-4 shrink-0 ${employerApprovalStatus === 'rejected' ? 'text-red-400' : 'text-amber-400'}`} />
            <span>
              {employerApprovalStatus === 'rejected' ? (
                <>Hồ sơ Giấy phép kinh doanh (GPKD) bị từ chối phê duyệt. Nút đăng tin tạm khóa. Vui lòng tải lại GPKD hợp lệ trong phần Hồ sơ Doanh nghiệp.</>
              ) : (
                <>Giấy phép kinh doanh (GPKD) đang trong quá trình chờ Quản trị viên phê duyệt. Tính năng đăng tin mới đang tạm khóa.</>
              )}
            </span>
          </div>
        </div>
      )}

      {/* 2. THANH HEADER CHÍNH */}
      <header className="w-full bg-slate-950/95 backdrop-blur-xl border-b border-blue-900/30 text-white h-20 px-4 sm:px-8 flex items-center justify-between">
        
        {/* ===================== CỤM TRÁI ===================== */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Nút Hamburger Menu trên Mobile (NFR-01) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Đóng / Mở Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo Brand: Click để về Trang chủ / Tìm việc */}
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-95 transition-opacity text-left"
            title="Quay về Trang Chủ"
          >
            <BrandLogo size="md" />
          </button>
        </div>

        {/* ===================== CỤM GIỮA ===================== */}
        {/* Thanh tìm kiếm nhanh có Debounce 300ms giảm tải UI dành cho Sinh viên (FR 1.5.1) */}
        {isStudent && (
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchInputChange}
                placeholder="Tìm nhanh việc làm, chức danh, kỹ năng..."
                className="w-full bg-slate-900/90 border border-blue-900/40 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 outline-none transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    if (onSearchChange) onSearchChange('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===================== CỤM PHẢI ===================== */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">

          {/* Icon Tin nhắn (Chat) -> Mở Drawer Widget Chat Sidebar (FR 1.8.2 & FR 2.7.2) */}
          {(isStudent || isEmployer) && (
            <button
              type="button"
              onClick={onToggleChatDrawer}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-blue-900/30 hover:border-sky-500/40 text-slate-300 hover:text-white transition-all cursor-pointer relative"
              title="Mở thanh trò chuyện & phỏng vấn"
            >
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
            </button>
          )}

          {/* Icon Chuông Thông Báo có Badge đỏ tự động nảy số (FR 1.9.1 - 1.9.3 & FR 2.8.1 - 2.8.3) */}
          {(isStudent || isEmployer) && (
            <div className="relative" ref={notiRef}>
              <button
                type="button"
                onClick={() => setNotiOpen(!notiOpen)}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-blue-900/30 hover:border-sky-500/40 text-slate-300 hover:text-white transition-all cursor-pointer relative"
                title="Thông báo hệ thống"
              >
                <Bell className={`w-4 h-4 text-slate-200 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 min-w-[18px] text-[10px] font-black rounded-full bg-red-600 text-white border border-slate-900 text-center shadow-lg shadow-red-950">
                    +{unreadCount}
                  </span>
                )}
              </button>

              {/* DROPDOWN THÔNG BÁO (UI-SV-NOTI-01 & UI-NTD-NOTI-01) - 100% Nền Đậm Đặc Opaque Không Trong Suốt */}
              {notiOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border-2 border-blue-500/80 shadow-[0_30px_90px_rgba(0,0,0,1)] py-3 z-[99999] isolate"
                  style={{ backgroundColor: '#0b1329', opacity: 1, backdropFilter: 'none' }}
                >
                  <div className="px-4 pb-2.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-sky-400" />
                      <h4 className="text-xs font-bold text-white">Thông Báo Hệ Thống</h4>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {unreadCount} chưa đọc
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 bg-[#0a0f1d]">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 bg-[#0a0f1d]">
                        Chưa có thông báo mới nào.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleNotiClick(n)}
                          onMouseEnter={() => handleNotiHover(n)}
                          className={`p-3.5 transition-all group flex items-start justify-between gap-3 cursor-pointer ${
                            !n.is_read 
                              ? 'bg-sky-950/90 border-l-4 border-l-sky-500 hover:bg-slate-800' 
                              : 'bg-[#0a0f1d] hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-sky-400 ring-2 ring-sky-500/40' : 'bg-slate-600'}`}></span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-bold truncate ${!n.is_read ? 'text-sky-200' : 'text-slate-300'}`}>
                                {n.title}
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                                {n.created_at || 'Vừa xong'}
                              </span>
                            </div>
                          </div>

                          {/* Nút X trượt ngang xóa thông báo (FR 1.9.3 & 2.8.3) */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteNoti(n._id, e)}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Xóa thông báo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 pt-2.5 border-t border-slate-800/80 text-center">
                    <p className="text-[10px] text-slate-500">
                      Rê chuột vào để tự động đánh dấu đã đọc • Nhấp X để xóa
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Badge vai trò riêng cho Admin */}
          {isAdmin && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-sky-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Vai trò: Quản trị viên hệ thống</span>
            </div>
          )}

          {/* Text block tóm tắt tài khoản */}
          <div className="hidden sm:flex flex-col text-right items-end">
            {isEmployer ? (
              <>
                <div className="flex items-center gap-1.5 line-clamp-1 max-w-[280px]">
                  <span className="text-xs font-bold text-white truncate">{companyName}</span>
                </div>
                <div className="text-[11px] text-slate-300 font-medium truncate max-w-[260px]">
                  {representativeName}
                </div>
              </>
            ) : isStudent ? (
              <>
                <div className="text-xs font-bold text-white truncate max-w-[240px]">
                  {studentName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">
                  {currentUser.email}
                </div>
              </>
            ) : (
              <>
                <div className="text-xs font-bold text-white truncate max-w-[240px]">
                  {adminName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">
                  {currentUser.email}
                </div>
              </>
            )}

            {/* Trạng thái hoạt động tự động */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border flex items-center gap-1 ${
                (currentUser?.is_banned || userStatus === 'inactive' || userStatus === 'cancelled')
                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                  : (userStatus === 'paused'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40')
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  (currentUser?.is_banned || userStatus === 'inactive' || userStatus === 'cancelled')
                    ? 'bg-red-400'
                    : (userStatus === 'paused'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400 animate-pulse')
                }`} />
                <span>
                  {(currentUser?.is_banned || userStatus === 'inactive' || userStatus === 'cancelled')
                    ? 'Ngưng hoạt động'
                    : (userStatus === 'paused' ? 'Tạm dừng' : 'Đang hoạt động')}
                </span>
              </span>
            </div>
          </div>

          {/* AVATAR + DROPDOWN MENU (FR 1.1.4, 1.2.1-1.2.3, FR 2.1.4, 2.2.1-2.2.3, FR 3.1.2, 3.2.1-3.2.2) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-blue-900/40 hover:border-sky-500/50 transition-all cursor-pointer group shadow-lg shadow-blue-950/40"
              title="Tài khoản cá nhân"
            >
              <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-black text-sm shadow-md bg-gradient-to-br from-blue-600 to-sky-500">
                {(isEmployer ? (companyName || representativeName) : (isStudent ? studentName : adminName)).charAt(0).toUpperCase()}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 mr-1 text-slate-400 group-hover:text-white transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* DROPDOWN MENU NỘI DUNG - 100% Nền Đậm Đặc Opaque Không Trong Suốt */}
            {dropdownOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-80 rounded-2xl border-2 border-blue-500/80 shadow-[0_30px_90px_rgba(0,0,0,1)] py-2 z-[99999] isolate"
                style={{ backgroundColor: '#0b1329', opacity: 1, backdropFilter: 'none' }}
              >
                
                {/* Thông tin tài khoản */}
                <div className="px-4 py-3 border-b border-slate-700 bg-[#111827] mx-2 rounded-xl mb-1.5 shadow-inner">
                  {isEmployer ? (
                    <>
                      <p className="text-xs font-black text-white truncate">{companyName}</p>
                      <p className="text-[11px] text-sky-300 font-semibold truncate mt-0.5">Người đại diện: {representativeName}</p>
                      {branchName && <p className="text-[10px] text-slate-400 truncate mt-0.5">{branchName}</p>}
                    </>
                  ) : (
                    <p className="text-xs font-bold text-white truncate">{isStudent ? studentName : adminName}</p>
                  )}
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser?.email}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleConfig.badgeColor}`}>
                      {roleConfig.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                      (currentUser?.is_banned || userStatus === 'inactive' || userStatus === 'cancelled')
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : (userStatus === 'paused'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40')
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        (currentUser?.is_banned || userStatus === 'inactive' || userStatus === 'cancelled')
                          ? 'bg-red-400'
                          : (userStatus === 'paused'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400 animate-pulse')
                      }`} />
                      <span>
                        {(currentUser?.is_banned || userStatus === 'inactive' || userStatus === 'cancelled')
                          ? 'Ngưng hoạt động'
                          : (userStatus === 'paused' ? 'Tạm dừng' : 'Đang hoạt động')}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Các nút thao tác */}
                <div className="p-1.5 space-y-1 bg-[#0a0f1d]">
                  
                  {/* Cập nhật hồ sơ & đổi mật khẩu */}
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      if (onOpenAccountModal) onOpenAccountModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-blue-600/30 transition-all text-left cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Cập nhật tài khoản cá nhân & Đổi mật khẩu</span>
                  </button>

                  {/* Nút đỏ Hủy tài khoản (FR 1.2.3 & 2.2.3 - Không áp dụng cho Quản trị viên) */}
                  {!isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        setDeleteModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 transition-all text-left cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Hủy tài khoản</span>
                    </button>
                  )}

                  {/* Nút Đăng xuất hệ thống */}
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Đăng xuất</span>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </header>

      {/* CONFIRM DELETE ACCOUNT MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-red-950/50 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-red-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-black text-white">Xác Nhận Hủy Tài Khoản</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setDeleteModalOpen(false)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn <strong className="text-red-400">hủy tài khoản ({currentUser.email})</strong>?
              Toàn bộ dữ liệu hồ sơ cá nhân và phiên đăng nhập sẽ bị vô hiệu hóa hoàn toàn theo chính sách bảo vệ dữ liệu.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                Không, giữ lại tài khoản
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteAccountSubmit}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-red-950/60 cursor-pointer"
              >
                {deleteLoading ? 'Đang xử lý...' : 'Xác Nhận Hủy Tài Khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
