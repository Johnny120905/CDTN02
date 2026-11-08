import React, { useState, useEffect } from 'react';
import { CheckCircle2, RefreshCw, AlertTriangle, X } from 'lucide-react';
import Header from './shared/Header';
import Footer from './shared/Footer';
import AccountModal from './shared/AccountModal';
import LoginScreen from './features/auth/LoginScreen';
import RegisterScreen from './features/auth/RegisterScreen';
import ForgotPasswordScreen from './features/auth/ForgotPasswordScreen';
import AdminLoginScreen from './features/auth/AdminLoginScreen';
import StudentPortal from './features/student/StudentPortal';
import EmployerPortal from './features/employer/EmployerPortal';
import AdminPortal from './features/admin/AdminPortal';

// React Error Boundary để bảo vệ ứng dụng không bị trắng màn hình khi có ngoại lệ
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught exception:', error, errorInfo);
  }
  handleResetSession = () => {
    try {
      localStorage.removeItem('partime_user');
      localStorage.removeItem('partime_token');
      localStorage.removeItem('partime_active_menu_student');
      localStorage.removeItem('partime_active_menu_employer');
      localStorage.removeItem('partime_active_menu_admin');
    } catch (e) {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf8ff] flex flex-col items-center justify-center p-6 text-slate-800 font-sans">
          <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Đã xảy ra sự cố hiển thị</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hệ thống đã tự động bảo vệ giao diện. Bạn có thể bấm nút bên dưới để tải lại trang hoặc khôi phục dữ liệu phiên làm việc.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="px-4 py-2.5 rounded-xl btn-primary-dimension text-xs font-bold cursor-pointer"
              >
                Tải lại trang
              </button>
              <button
                type="button"
                onClick={this.handleResetSession}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                title="Khôi phục trạng thái chuẩn khi gặp lỗi cache hoặc tài khoản cũ"
              >
                Đặt lại phiên & Về Trang Chủ
              </button>
            </div>
            {this.state.error && (
              <div className="pt-2 text-left">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                >
                  {this.state.showDetails ? 'Ẩn chi tiết kỹ thuật' : 'Xem chi tiết lỗi kỹ thuật'}
                </button>
                {this.state.showDetails && (
                  <pre className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-rose-600 overflow-x-auto font-mono whitespace-pre-wrap">
                    {String(this.state.error?.message || this.state.error)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  
  // URL & Routing State (Nhận diện theo path /student, /employer, /admin HOẶC theo port riêng 3001, 3002, 3003)
  const [currentPath, setCurrentPath] = useState(() => {
    const path = window.location.pathname || '/';
    const port = window.location.port;
    if (path === '/' || path === '') {
      if (port === '3002') return '/employer';
      if (port === '3003') return '/admin';
      return '/student';
    }
    return path;
  });

  // Navigation & Interactive States
  const [portalActiveMenu, setPortalActiveMenu] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerSearchKeyword, setHeaderSearchKeyword] = useState('');
  const [activeSectionTitle, setActiveSectionTitle] = useState('Trang Chủ');

  // Action Notification Banner
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
      setTimeout(() => {
        setBannerInfo((curr) => (curr && curr.id === id && curr.type === 'loading' ? null : curr));
      }, 15000);
    }
  };

  // Safe navigation helper that updates URL & internal state
  const navigateTo = (path) => {
    if (window.history && window.history.pushState) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen to browser popstate, pushState, and anchor clicks seamlessly
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname || '/';
      const port = window.location.port;
      if (path === '/' || path === '') {
        if (port === '3002') setCurrentPath('/employer');
        else if (port === '3003') setCurrentPath('/admin');
        else setCurrentPath('/student');
      } else {
        setCurrentPath(path);
      }
    };

    window.addEventListener('popstate', handleUrlChange);

    // Intercept pushState and replaceState so that any call anywhere immediately updates currentPath!
    const origPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      const ret = origPushState.apply(this, args);
      handleUrlChange();
      return ret;
    };

    const origReplaceState = window.history.replaceState;
    window.history.replaceState = function(...args) {
      const ret = origReplaceState.apply(this, args);
      handleUrlChange();
      return ret;
    };

    // Also intercept all click events on <a> links to internal routes (like /admin, /student, /employer)
    const handleGlobalLinkClick = (e) => {
      const a = e.target.closest('a');
      if (a && a.getAttribute('href')) {
        const href = a.getAttribute('href');
        if (href.startsWith('/') && !href.startsWith('/api') && !href.startsWith('/uploads')) {
          e.preventDefault();
          navigateTo(href);
        }
      }
    };
    document.addEventListener('click', handleGlobalLinkClick);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      document.removeEventListener('click', handleGlobalLinkClick);
      window.history.pushState = origPushState;
      window.history.replaceState = origReplaceState;
    };
  }, []);

  // Auth navigation helper
  const handleNavigateAuth = (view, role = 'student') => {
    if (role === 'admin') {
      navigateTo('/admin');
      return;
    }
    if (role === 'employer') {
      if (view === 'login') navigateTo('/employer/login');
      else if (view === 'register') navigateTo('/employer/register');
      else if (view === 'forgot_password') navigateTo('/employer/forgot-password');
      else navigateTo('/employer');
      return;
    }
    // Student
    if (view === 'login') navigateTo('/student/login');
    else if (view === 'register') navigateTo('/student/register');
    else if (view === 'forgot_password') navigateTo('/student/forgot-password');
    else navigateTo('/student');
  };

  // Load existing user session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('partime_user');
    const token = localStorage.getItem('partime_token');
    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('partime_user');
        localStorage.removeItem('partime_token');
      }
    }
  }, []);

  const handleAuthSuccess = (user) => {
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

    // Update URL according to logged in role
    if (updatedUser.role === 'admin') {
      navigateTo('/admin');
    } else if (updatedUser.role === 'employer') {
      navigateTo('/employer');
    } else {
      navigateTo('/student');
    }

    // Sync online status with backend
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
    const token = localStorage.getItem('partime_token');
    const roleBeforeLogout = currentUser?.role;

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
    localStorage.removeItem('partime_active_menu_employer');
    localStorage.removeItem('partime_active_menu_student');
    setCurrentUser(null);
    setPortalActiveMenu({ id: 'home', key: Date.now() });
    setActiveSectionTitle('Trang Chủ');
    setIsAccountModalOpen(false);
    setChatDrawerOpen(false);
    setHeaderSearchKeyword('');

    // Redirect to respective initial landing page after logout
    if (roleBeforeLogout === 'admin') {
      navigateTo('/admin');
    } else if (roleBeforeLogout === 'employer') {
      navigateTo('/employer');
    } else {
      navigateTo('/student');
    }
  };

  const handleOpenAccountModal = () => {
    setIsAccountModalOpen(true);
  };

  const handleGoHome = () => {
    setPortalActiveMenu({ id: 'home', key: Date.now() });
    setActiveSectionTitle('Trang Chủ');
    if (currentPath.startsWith('/employer') || window.location.port === '3002') {
      navigateTo('/employer');
    } else if (currentPath.startsWith('/admin') || window.location.port === '3003') {
      navigateTo('/admin');
    } else {
      navigateTo('/student');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const handleToggleChatDrawer = () => {
    setChatDrawerOpen(prev => !prev);
  };

  const handleCreateJobFromHeader = () => {
    setPortalActiveMenu('post_job');
  };

  // Render notification banner
  const renderBanner = () => {
    if (!bannerInfo) return null;
    return (
      <div className="fixed top-[88px] right-4 sm:right-6 z-50 pointer-events-auto max-w-md w-full animate-in slide-in-from-top-3 duration-300">
        <div className={`p-4 rounded-2xl shadow-xl border flex items-center justify-between gap-3 ${
          bannerInfo.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-emerald-900/10'
            : bannerInfo.type === 'loading'
            ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-amber-900/10'
            : 'bg-red-50 border-red-300 text-red-900 shadow-red-900/10'
        }`}>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {bannerInfo.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {bannerInfo.type === 'loading' && <RefreshCw className="w-5 h-5 text-amber-600 shrink-0 animate-spin" />}
            {bannerInfo.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
            <span className="text-xs sm:text-sm font-bold truncate leading-snug">{bannerInfo.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerInfo(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW RESOLUTION BASED ON ROUTE & USER ROLE
  // =========================================================================
  const isAdminPath = currentPath.startsWith('/admin');
  const isEmployerPath = currentPath.startsWith('/employer') || currentPath.startsWith('/recruiter');

  // 1. ADMIN ROUTE (/admin): Vô thẳng Giao diện trang Đăng nhập Quản trị viên nếu chưa đăng nhập
  if (isAdminPath) {
    if (!currentUser || currentUser.role !== 'admin') {
      return (
        <ErrorBoundary>
          <AdminLoginScreen
            onAuthSuccess={handleAuthSuccess}
            onNavigate={handleNavigateAuth}
          />
        </ErrorBoundary>
      );
    }
    // Admin is logged in -> render Admin Portal
    return (
      <ErrorBoundary>
        <div className="flex flex-col min-h-screen bg-[#faf8ff] text-[#131b2e] font-sans selection:bg-blue-600 selection:text-white">
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
            onShowBanner={handleShowBanner}
          />

          {renderBanner()}

          <main className="flex-1 flex flex-col">
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
          </main>

          <AccountModal
            isOpen={isAccountModalOpen}
            onClose={() => setIsAccountModalOpen(false)}
            currentUser={currentUser}
            onUpdateSuccess={(u) => setCurrentUser(u)}
          />

          <Footer 
            currentUser={currentUser} 
            onNavigateMenu={(menuId) => setPortalActiveMenu({ id: menuId, key: Date.now() })} 
          />
        </div>
      </ErrorBoundary>
    );
  }

  // 2. EMPLOYER ROUTE (/employer): Giao diện Trang xem của Nhà tuyển dụng riêng biệt
  if (isEmployerPath) {
    if (currentPath === '/employer/login') {
      return (
        <ErrorBoundary>
          <LoginScreen
            onAuthSuccess={handleAuthSuccess}
            onNavigate={handleNavigateAuth}
            initialRole="employer"
            lockRole={true}
          />
        </ErrorBoundary>
      );
    }
    if (currentPath === '/employer/register') {
      return (
        <ErrorBoundary>
          <RegisterScreen
            onAuthSuccess={handleAuthSuccess}
            onNavigate={handleNavigateAuth}
            initialRole="employer"
            lockRole={true}
          />
        </ErrorBoundary>
      );
    }
    if (currentPath === '/employer/forgot-password') {
      return (
        <ErrorBoundary>
          <ForgotPasswordScreen
            onNavigate={handleNavigateAuth}
            initialRole="employer"
            lockRole={true}
          />
        </ErrorBoundary>
      );
    }

    // Nếu chưa đăng nhập: Giao diện Trang xem trước (Chế độ khách) của Nhà tuyển dụng với đầy đủ 9 danh mục Sidebar
    if (!currentUser || currentUser.role !== 'employer') {
      return (
        <ErrorBoundary>
          <div className="flex flex-col min-h-screen bg-[#faf8ff] text-[#131b2e] font-sans selection:bg-blue-600 selection:text-white">
            <Header
              currentUser={null}
              guestRole="employer"
              onLogout={handleLogout}
              onOpenAccountModal={handleOpenAccountModal}
              onGoHome={handleGoHome}
              onNavigateMenu={(menuId) => setPortalActiveMenu({ id: menuId, key: Date.now() })}
              onToggleSidebar={handleToggleSidebar}
              onToggleChatDrawer={handleToggleChatDrawer}
              onSearchChange={setHeaderSearchKeyword}
              onCreateJobClick={() => handleNavigateAuth('login', 'employer')}
              activeSectionTitle={activeSectionTitle}
              onNavigateAuth={handleNavigateAuth}
            />

            {renderBanner()}

            <main className="flex-1 flex flex-col">
              <EmployerPortal
                key="guest_employer"
                currentUser={null}
                isGuestMode={true}
                onNavigateAuth={handleNavigateAuth}
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
            </main>

            <Footer 
              currentUser={null} 
              onNavigateMenu={(menuId) => setPortalActiveMenu({ id: menuId, key: Date.now() })} 
            />
          </div>
        </ErrorBoundary>
      );
    }

    // Nếu đã đăng nhập: Giao diện toàn diện của Nhà tuyển dụng với đầy đủ 9 danh mục Sidebar
    return (
      <ErrorBoundary>
        <div className="flex flex-col min-h-screen bg-[#faf8ff] text-[#131b2e] font-sans selection:bg-blue-600 selection:text-white">
          <Header
            currentUser={currentUser}
            guestRole="employer"
            onLogout={handleLogout}
            onOpenAccountModal={handleOpenAccountModal}
            onGoHome={handleGoHome}
            onNavigateMenu={(menuId) => setPortalActiveMenu({ id: menuId, key: Date.now() })}
            onToggleSidebar={handleToggleSidebar}
            onToggleChatDrawer={handleToggleChatDrawer}
            onSearchChange={setHeaderSearchKeyword}
            onCreateJobClick={handleCreateJobFromHeader}
            activeSectionTitle={activeSectionTitle}
            onNavigateAuth={handleNavigateAuth}
            onShowBanner={handleShowBanner}
          />

          {renderBanner()}

          <main className="flex-1 flex flex-col">
            <EmployerPortal
              key={currentUser?._id || 'logged_in_employer'}
              currentUser={currentUser}
              isGuestMode={false}
              onNavigateAuth={handleNavigateAuth}
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
          </main>

          <AccountModal
            isOpen={isAccountModalOpen}
            onClose={() => setIsAccountModalOpen(false)}
            currentUser={currentUser}
            onUpdateSuccess={(u) => setCurrentUser(u)}
          />

          <Footer 
            currentUser={currentUser} 
            onNavigateMenu={(menuId) => setPortalActiveMenu({ id: menuId, key: Date.now() })} 
          />
        </div>
      </ErrorBoundary>
    );
  }

  // 3. STUDENT ROUTE (/student hoặc /): Giao diện Trang xem của Sinh viên riêng biệt
  if (currentPath === '/student/login' || currentPath === '/login') {
    return (
      <ErrorBoundary>
        <LoginScreen
          onAuthSuccess={handleAuthSuccess}
          onNavigate={handleNavigateAuth}
          initialRole="student"
          lockRole={true}
        />
      </ErrorBoundary>
    );
  }
  if (currentPath === '/student/register' || currentPath === '/register') {
    return (
      <ErrorBoundary>
        <RegisterScreen
          onAuthSuccess={handleAuthSuccess}
          onNavigate={handleNavigateAuth}
          initialRole="student"
          lockRole={true}
        />
      </ErrorBoundary>
    );
  }
  if (currentPath === '/student/forgot-password' || currentPath === '/forgot-password') {
    return (
      <ErrorBoundary>
        <ForgotPasswordScreen
          onNavigate={handleNavigateAuth}
          initialRole="student"
          lockRole={true}
        />
      </ErrorBoundary>
    );
  }

  // Nếu chưa đăng nhập: Giao diện Trang xem trước (Chế độ khách) của Sinh viên với đầy đủ 9 danh mục Sidebar
  if (!currentUser || currentUser.role !== 'student') {
    return (
      <ErrorBoundary>
        <div className="flex flex-col min-h-screen bg-[#faf8ff] text-[#131b2e] font-sans selection:bg-blue-600 selection:text-white">
          <Header
            currentUser={null}
            guestRole="student"
            onLogout={handleLogout}
            onOpenAccountModal={handleOpenAccountModal}
            onGoHome={handleGoHome}
            onNavigateMenu={(menuId) => setPortalActiveMenu({ id: menuId, key: Date.now() })}
            onToggleSidebar={handleToggleSidebar}
            onToggleChatDrawer={handleToggleChatDrawer}
            onSearchChange={setHeaderSearchKeyword}
            onCreateJobClick={() => handleNavigateAuth('login', 'employer')}
            activeSectionTitle={activeSectionTitle}
            onNavigateAuth={handleNavigateAuth}
            onShowBanner={handleShowBanner}
          />

          {renderBanner()}

          <main className="flex-1 flex flex-col">
            <StudentPortal
              key="guest_student"
              currentUser={null}
              isGuestMode={true}
              onNavigateAuth={handleNavigateAuth}
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
          </main>

          <Footer 
            currentUser={null} 
            onNavigateMenu={(menuId) => setPortalActiveMenu({ id: menuId, key: Date.now() })} 
          />
        </div>
      </ErrorBoundary>
    );
  }

  // Nếu đã đăng nhập: Giao diện toàn diện của Sinh viên với đầy đủ 9 danh mục Sidebar
  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-[#faf8ff] text-[#131b2e] font-sans selection:bg-blue-600 selection:text-white">
        <Header
          currentUser={currentUser}
          guestRole="student"
          onLogout={handleLogout}
          onOpenAccountModal={handleOpenAccountModal}
          onGoHome={handleGoHome}
          onNavigateMenu={(menuId) => setPortalActiveMenu({ id: menuId, key: Date.now() })}
          onToggleSidebar={handleToggleSidebar}
          onToggleChatDrawer={handleToggleChatDrawer}
          onSearchChange={setHeaderSearchKeyword}
          onCreateJobClick={handleCreateJobFromHeader}
          activeSectionTitle={activeSectionTitle}
          onNavigateAuth={handleNavigateAuth}
          onShowBanner={handleShowBanner}
        />

        {renderBanner()}

        <main className="flex-1 flex flex-col">
          <StudentPortal
            key={currentUser?._id || 'logged_in_student'}
            currentUser={currentUser}
            isGuestMode={false}
            onNavigateAuth={handleNavigateAuth}
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
        </main>

        <AccountModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
          currentUser={currentUser}
          onUpdateSuccess={(u) => setCurrentUser(u)}
        />

        <Footer 
          currentUser={currentUser} 
          onNavigateMenu={(menuId) => setPortalActiveMenu({ id: menuId, key: Date.now() })} 
        />
      </div>
    </ErrorBoundary>
  );
}
