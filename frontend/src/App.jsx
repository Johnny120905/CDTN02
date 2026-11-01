import React, { useState, useEffect } from 'react';
import { CheckCircle2, RefreshCw, AlertTriangle, X } from 'lucide-react';
import Header from './shared/Header';
import Footer from './shared/Footer';
import AccountModal from './shared/AccountModal';
import LoginScreen from './features/auth/LoginScreen';
import RegisterScreen from './features/auth/RegisterScreen';
import ForgotPasswordScreen from './features/auth/ForgotPasswordScreen';
import StudentPortal from './features/student/StudentPortal';
import EmployerPortal from './features/employer/EmployerPortal';
import AdminPortal from './features/admin/AdminPortal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'forgot_password'
  const [forgotPasswordRole, setForgotPasswordRole] = useState('student'); // 'student' | 'employer'
  
  // Navigation & Interactive States between Header and Portals
  const [portalActiveMenu, setPortalActiveMenu] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerSearchKeyword, setHeaderSearchKeyword] = useState('');
  const [activeSectionTitle, setActiveSectionTitle] = useState('Trang Chủ');

  // In-App Action Notification Banner (docked right beneath Header, right-aligned, 5s auto-dismiss)
  // type: 'success' (xanh lá cây) | 'loading' (vàng) | 'error' (đỏ)
  const [bannerInfo, setBannerInfo] = useState(null);

  const handleShowBanner = (message, type = 'success', duration = 5000) => {
    if (!message) {
      setBannerInfo(null);
      return;
    }
    const id = Date.now();
    setBannerInfo({ message, type, id });
    if (type !== 'loading' && duration > 0) {
      setTimeout(() => {
        setBannerInfo((curr) => (curr && curr.id === id ? null : curr));
      }, duration);
    } else if (type === 'loading') {
      // Auto-clear loading banner after 15s safety limit to prevent permanently stuck yellow banner
      setTimeout(() => {
        setBannerInfo((curr) => (curr && curr.id === id && curr.type === 'loading' ? null : curr));
      }, 15000);
    }
  };

  const handleNavigateAuth = (view, targetRole = null) => {
    setAuthView(view);
    if (targetRole && (targetRole === 'student' || targetRole === 'employer')) {
      setForgotPasswordRole(targetRole);
    }
  };

  // Load existing session on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('partime_user');
    const token = localStorage.getItem('partime_token');
    if (savedUser && token) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('partime_user');
        localStorage.removeItem('partime_token');
      }
    }
  }, []);

  const handleAuthSuccess = (user) => {
    // Tự động chuyển trạng thái tài khoản sang "Đang hoạt động" khi đăng nhập
    const updatedUser = {
      ...user,
      status: 'active',
      profile: { ...(user.profile || {}), status: 'active' }
    };
    localStorage.setItem('partime_user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    setPortalActiveMenu(null);
    setChatDrawerOpen(false);
    setHeaderSearchKeyword('');

    // Đồng bộ trạng thái active về backend API
    const token = localStorage.getItem('partime_token');
    if (token) {
      const endpoint = user.role === 'student' 
        ? '/api/student/profile' 
        : (user.role === 'employer' ? '/api/employer/company' : null);
      if (endpoint) {
        fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ status: 'active' })
        }).catch(() => {});
      }
    }
  };

  const handleLogout = async () => {
    // Tự động chuyển trạng thái sang "Tạm dừng" khi người dùng đăng xuất / thoát ra
    const token = localStorage.getItem('partime_token');
    if (token && currentUser) {
      try {
        const endpoint = currentUser.role === 'student' 
          ? '/api/student/profile' 
          : (currentUser.role === 'employer' ? '/api/employer/company' : null);
        if (endpoint) {
          await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: 'paused' })
          });
        }
      } catch (e) {
        // ignore offline
      }
    }
    localStorage.removeItem('partime_token');
    localStorage.removeItem('partime_user');
    setCurrentUser(null);
    setAuthView('login');
    setPortalActiveMenu(null);
    setIsAccountModalOpen(false);
    setChatDrawerOpen(false);
  };

  const handleOpenAccountModal = () => {
    setIsAccountModalOpen(true);
  };

  const handleGoHome = () => {
    setPortalActiveMenu({ id: 'home', key: Date.now() });
    setActiveSectionTitle('Trang Chủ');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const handleToggleChatDrawer = () => {
    setChatDrawerOpen(prev => !prev);
  };

  const handleCreateJobFromHeader = () => {
    setPortalActiveMenu('jobs_create');
  };

  // 1. KHI CHƯA ĐĂNG NHẬP: CHỈ HIỂN THỊ MÀN HÌNH XÁC THỰC (LOẠI BỎ TOÀN BỘ HEADER VÀ FOOTER)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
        {authView === 'login' && (
          <LoginScreen
            onAuthSuccess={handleAuthSuccess}
            onNavigate={handleNavigateAuth}
          />
        )}

        {authView === 'register' && (
          <RegisterScreen
            onAuthSuccess={handleAuthSuccess}
            onNavigate={handleNavigateAuth}
          />
        )}

        {authView === 'forgot_password' && (
          <ForgotPasswordScreen
            onNavigate={handleNavigateAuth}
            initialRole={forgotPasswordRole}
            lockRole={true}
          />
        )}
      </div>
    );
  }

  // 2. KHI ĐÃ ĐĂNG NHẬP: VÀO GIAO DIỆN DARK 4D CỦA TỪNG ROLE VỚI CÁC LIÊN KẾT REAL-TIME
  return (
    <div className="flex flex-col min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* THANH HEADER ĐIỀU KHIỂN RIÊNG BIỆT THEO TỪNG ROLE */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAccountModal={handleOpenAccountModal}
        onGoHome={handleGoHome}
        onNavigateMenu={(menuId) => setPortalActiveMenu({ id: menuId, key: Date.now() })}
        onToggleSidebar={handleToggleSidebar}
        onToggleChatDrawer={handleToggleChatDrawer}
        onSearchChange={setHeaderSearchKeyword}
        onCreateJobClick={handleCreateJobFromHeader}
        activeSectionTitle={activeSectionTitle}
      />

      {/* THÔNG BÁO HÀNH ĐỘNG DƯỚI THANH HEADER (Căn phải, tự tắt sau 5s, Xanh lá: Thành công/An toàn | Vàng: Chờ/Đang tải | Đỏ: Cảnh báo) */}
      {bannerInfo && (
        <div className="fixed top-[88px] right-4 sm:right-6 z-50 pointer-events-auto max-w-md w-full animate-in slide-in-from-top-3 duration-300">
          <div className={`p-4 rounded-2xl shadow-2xl border-2 flex items-center justify-between gap-3.5 ${
            bannerInfo.type === 'success'
              ? 'bg-[#064e3b] border-emerald-500 text-emerald-100 shadow-emerald-950/80'
              : bannerInfo.type === 'loading'
              ? 'bg-[#78350f] border-amber-500 text-amber-100 shadow-amber-950/80'
              : 'bg-[#881337] border-rose-500 text-rose-100 shadow-rose-950/80'
          }`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {bannerInfo.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />}
              {bannerInfo.type === 'loading' && <RefreshCw className="w-5 h-5 text-amber-300 shrink-0 animate-spin" />}
              {bannerInfo.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0" />}
              <span className="text-xs sm:text-sm font-bold truncate leading-snug">{bannerInfo.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerInfo(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* VÙNG MAIN CONTENT RENDER CỔNG ROLE PHÙ HỢP */}
      <main className="flex-1 flex flex-col">
        {currentUser.role === 'student' && (
          <StudentPortal
            currentUser={currentUser}
            onLogout={handleLogout}
            requestedMenu={portalActiveMenu}
            onOpenAccountModal={handleOpenAccountModal}
            chatDrawerOpen={chatDrawerOpen}
            onCloseChatDrawer={() => setChatDrawerOpen(false)}
            mobileSidebarOpen={sidebarOpen}
            onToggleMobileSidebar={handleToggleSidebar}
            headerSearchQuery={headerSearchKeyword}
            onSectionChange={setActiveSectionTitle}
            onShowBanner={handleShowBanner}
          />
        )}

        {currentUser.role === 'employer' && (
          <EmployerPortal
            currentUser={currentUser}
            onLogout={handleLogout}
            requestedMenu={portalActiveMenu}
            onOpenAccountModal={handleOpenAccountModal}
            chatDrawerOpen={chatDrawerOpen}
            onCloseChatDrawer={() => setChatDrawerOpen(false)}
            mobileSidebarOpen={sidebarOpen}
            onToggleMobileSidebar={handleToggleSidebar}
            onSectionChange={setActiveSectionTitle}
            onShowBanner={handleShowBanner}
          />
        )}

        {currentUser.role === 'admin' && (
          <AdminPortal
            currentUser={currentUser}
            onLogout={handleLogout}
            requestedMenu={portalActiveMenu}
            onOpenAccountModal={handleOpenAccountModal}
            mobileSidebarOpen={sidebarOpen}
            onToggleMobileSidebar={handleToggleSidebar}
            onSectionChange={setActiveSectionTitle}
            onShowBanner={handleShowBanner}
          />
        )}
      </main>

      {/* Shared Account Profile & Password Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        onUpdateSuccess={(u) => setCurrentUser(u)}
      />

      {/* CHÂN TRANG FOOTER RIÊNG BIỆT CHO TỪNG ROLE */}
      <Footer 
        currentUser={currentUser} 
        onNavigateMenu={(menuId) => setPortalActiveMenu({ id: menuId, key: Date.now() })} 
      />
    </div>
  );
}
