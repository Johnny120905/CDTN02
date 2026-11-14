import React, { useState, useEffect } from 'react';
import DocumentViewerModal from '../../shared/DocumentViewerModal';
import ConfirmDialog from '../../shared/ConfirmDialog';
import { 
  ShieldCheck, Users, Briefcase, FileBarChart, AlertTriangle, 
  Lock, Unlock, Eye, EyeOff, Trash2, Plus, CheckCircle2, XCircle, 
  Search, Filter, Download, MessageSquare, Tag, KeyRound, 
  RefreshCw, Menu, Check, Star, Edit3, ArrowUpDown, Home,
  Server, Database, X, FileText, ChevronRight, ChevronLeft,
  TrendingUp, Calendar, AlertCircle, Building2, GraduationCap,
  PieChart, Activity, FileCheck, Clock, ArrowLeft,
  Phone, MapPin, Globe, Mail
} from 'lucide-react';
import { PROFESSION_SUGGESTIONS, filterSuggestions, getStatusBadge } from '../../shared/professionSuggestions';
import { HISTORICAL_2024_2025_BUCKETS } from './historicalAnalyticsData';
import { VIETNAM_PROVINCES, PROVINCE_DISTRICTS_MAP, getDistrictsByProvince } from '../../shared/vietnamLocations';
import { getSocket } from '../../shared/webrtcSocketService';
import {
  removeVietnameseTones,
  parseSalaryNumber,
  matchKeywordFlexible,
  matchCategoryFlexible,
  matchShiftFlexible,
  matchSalaryBracketFlexible,
  matchLocationFlexible,
  normalizeJobStatus,
  getRoleToken
} from '../../shared/searchAndFilterHelper';

export default function AdminPortal({ 
  currentUser, 
  onLogout, 
  requestedMenu, 
  onOpenAccountModal,
  mobileSidebarOpen,
  onToggleMobileSidebar,
  onSectionChange,
  onShowBanner
}) {
  const notify = (msg, type = 'success') => {
    if (onShowBanner) {
      onShowBanner(msg, type);
    }
  };
  // Navigation State (8 Phân hệ quản trị cốt lõi)
  const [activeMenu, setActiveMenu] = useState(() => {
    const saved = localStorage.getItem('partime_active_menu_admin');
    return (saved && saved !== 'home') ? saved : 'dashboard';
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    confirmText: 'Xác Nhận',
    onConfirm: () => {}
  });

  // Data States
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bannedKeywords, setBannedKeywords] = useState([]);
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Sidebar Collapse State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('partime_sidebar_collapsed_admin') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('partime_sidebar_collapsed_admin', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Dashboard Time Filter & Geo/Industry Filter (FR-QTV-03.02 & FR-QTV-03.07)
  const [filterYear, setFilterYear] = useState(''); // '' (Tất cả) | '2024' | '2025' | '2026'
  const [filterMonth, setFilterMonth] = useState(''); // '' (Cả năm) | '1' .. '12'
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [dashProvinceFilter, setDashProvinceFilter] = useState(''); // FR-QTV-03.07: Tỉnh/Thành phố
  const [dashCategoryFilter, setDashCategoryFilter] = useState(''); // FR-QTV-03.07: Nhóm ngành Master Data

  // User Moderation States (FR 3.4 & FR-QTV-04.10)
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userUniFilter, setUserUniFilter] = useState('all'); // FR-QTV-04.10: Trường Đại học
  const [userRiskFilter, setUserRiskFilter] = useState('all'); // FR-QTV-04.10: Mức độ rủi ro vi phạm (>=1 report, >=3 khiếu nại)
  const [userIdentityFilter, setUserIdentityFilter] = useState('all'); // FR-QTV-04.10: Định danh (OTP, GPKD thật, chưa cập nhật)
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 15;
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [adminGpkdViewer, setAdminGpkdViewer] = useState(null);
  const [banModalUser, setBanModalUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [gpkdRejectModal, setGpkdRejectModal] = useState(null); // { userId, companyName, reason }

  // GPKD Moderation Filter (FR-QTV-04.11: MST 10/13 số, Tỉnh thành, Quận huyện, Hồ sơ tồn đọng)
  const [gpkdMstFilter, setGpkdMstFilter] = useState('all'); // 'all' | '10' | '13'
  const [gpkdProvinceFilter, setGpkdProvinceFilter] = useState('all');
  const [gpkdDistrictFilter, setGpkdDistrictFilter] = useState('');
  const [gpkdAgeFilter, setGpkdAgeFilter] = useState('all'); // 'all' | 'overdue' | 'today'

  // Job Moderation States (FR 3.5 & FR-QTV-05.07)
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [jobViolationFilter, setJobViolationFilter] = useState('all'); // FR-QTV-05.07: Vi phạm lương 4 vùng, ca >8h, lừa đảo
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);
  const [hideJobModal, setHideJobModal] = useState(null);
  const [hideReason, setHideReason] = useState('');

  // Reviews Moderation States (FR 3.6 & FR-QTV-06.07)
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('all'); // 'all' | 'public' | 'hidden'
  const [reviewDirectionFilter, setReviewDirectionFilter] = useState('all'); // FR-QTV-06.07: SV->NTD vs NTD->SV
  const [reviewStarsFilter, setReviewStarsFilter] = useState('all'); // FR-QTV-06.07: 1-2 sao tiêu cực
  const [selectedReviewDetail, setSelectedReviewDetail] = useState(null);

  // Master Data Categories States
  const [categoryTab, setCategoryTab] = useState('all'); // 'all' | 'job' | 'location'
  const [categorySearch, setCategorySearch] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('job');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Tickets & Reports States (FR 3.8 & FR-QTV-08.02)
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketTab, setTicketTab] = useState('all'); // 'all' | 'job' | 'applicant' | 'chat'
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all'); // FR-QTV-08.02: 4 trạng thái chuẩn hóa
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketChatHistory, setTicketChatHistory] = useState(null);
  const [ticketNote, setTicketNote] = useState('');
  const [ticketStatusSelect, setTicketStatusSelect] = useState('pending');

  // Banned Keywords Engine
  const [keywordsText, setKeywordsText] = useState('');
  const [keywordSaveMsg, setKeywordSaveMsg] = useState('');
  const [editingKwId, setEditingKwId] = useState(null);
  const [editingKwText, setEditingKwText] = useState('');

  // Interactive Dynamic Hover States for 3 Charts (Yêu cầu 2)
  const [hoveredBar, setHoveredBar] = useState(null); // { idx, label, val, pct }
  const [hoveredLinePoint, setHoveredLinePoint] = useState(null); // { idx, label, svVal, jobVal, ratio }
  const [hoveredDonutSlice, setHoveredDonutSlice] = useState(null); // { name, pct, count, salary, color }

  const token = getRoleToken('admin');
  const headers = token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' };

  // Sync section title - 8 phân hệ cốt lõi
  const sectionTitleMap = {
    dashboard: 'Trung tâm chỉ huy (Analytics Dashboard)',
    users: 'Quản lý người dùng & Phân quyền',
    gpkd: 'Bàn thẩm định doanh nghiệp & Giấy phép kinh doanh',
    jobs: 'Kiểm duyệt tin tuyển dụng',
    keywords: 'Kiểm duyệt từ khoá cấm',
    reviews: 'Quản lý đánh giá chéo 2 chiều',
    categories: 'Quản trị danh mục Master Data',
    reports: 'Xử lý Khiếu nại & Báo cáo vi phạm',
    home: 'Trung tâm chỉ huy (Analytics Dashboard)'
  };

  useEffect(() => {
    localStorage.setItem('partime_active_menu_admin', activeMenu);
  }, [activeMenu]);

  const handleMenuSwitch = (menuId) => {
    const target = menuId === 'home' ? 'dashboard' : (menuId === 'gpkd_verification' ? 'gpkd' : menuId);
    setActiveMenu(target);
    if (onSectionChange) onSectionChange(sectionTitleMap[target] || 'Trung tâm chỉ huy (Analytics Dashboard)');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync requestedMenu from Header dropdown / Logo
  useEffect(() => {
    if (requestedMenu) {
      const targetMenu = typeof requestedMenu === 'object' ? requestedMenu.id : requestedMenu;
      if (targetMenu === 'account' && onOpenAccountModal) {
        onOpenAccountModal();
      } else if (targetMenu) {
        handleMenuSwitch(targetMenu);
      }
    }
  }, [requestedMenu]);

  // Initial Load + Socket.IO real-time targeted sync (tránh spam 7 API mỗi 3s gây chậm web)
  useEffect(() => {
    fetchAllData();

    const socket = getSocket();
    const adminId = currentUser?._id || currentUser?.id;
    if (token) {
      socket.emit('register-user', { user_id: adminId, role: 'admin' });
      socket.emit('join-room', { room_id: 'role_admin', user_id: adminId, role: 'admin' });
    }

    const onUsersChanged = () => {
      fetchUsers();
      fetchDashboard();
    };
    const onJobsChanged = () => {
      fetchAllJobs();
      fetchDashboard();
    };
    const onReportsChanged = () => {
      fetchReports();
      fetchDashboard();
    };
    const onAppsChanged = () => {
      fetchDashboard();
    };

    const socketHandlers = [
      ['new-application', onAppsChanged],
      ['applicant-withdrawn', onAppsChanged],
      ['application-status-updated', onAppsChanged],
      ['shift-status-updated', onAppsChanged],
      ['gpkd-reupload', onUsersChanged],
      ['gpkd-status-updated', onUsersChanged],
      ['user-status-updated', onUsersChanged],
      ['user-registered', onUsersChanged],
      ['new-job', onJobsChanged],
      ['job-updated', onJobsChanged],
      ['new-report', onReportsChanged],
      ['report-updated', onReportsChanged],
      ['new-review', fetchReviews],
      ['review-updated', fetchReviews],
      ['categories-updated', fetchCategories],
      ['banned-keywords-updated', fetchBannedKeywords]
    ];
    socketHandlers.forEach(([ev, fn]) => socket.on(ev, fn));

    return () => {
      socketHandlers.forEach(([ev, fn]) => socket.off(ev, fn));
    };
  }, [token, currentUser]);

  // Fallback polling nhẹ 3s: chỉ làm mới đúng phân hệ đang xem
  useEffect(() => {
    if (!token) return;
    const fetchActiveTabOnly = () => {
      if (activeMenu === 'dashboard' || activeMenu === 'home') fetchDashboard();
      else if (activeMenu === 'users' || activeMenu === 'gpkd') fetchUsers();
      else if (activeMenu === 'jobs') fetchAllJobs();
      else if (activeMenu === 'keywords') fetchBannedKeywords();
      else if (activeMenu === 'reviews') fetchReviews();
      else if (activeMenu === 'categories') fetchCategories();
      else if (activeMenu === 'reports') fetchReports();
    };
    const interval = setInterval(fetchActiveTabOnly, 3000);
    return () => clearInterval(interval);
  }, [token, activeMenu]);

  const fetchAllData = () => {
    if (token) {
      fetchDashboard();
      fetchUsers();
      fetchAllJobs();
      fetchCategories();
      fetchBannedKeywords();
      fetchReports();
      fetchReviews();
    }
  };

  // API Calls
  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard', { headers });
      const data = await res.json();
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch (err) {
      console.warn('Dashboard fetch warning:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data.filter(u => String(u.email || '').trim().toLowerCase().endsWith('@gmail.com')));
      }
    } catch (err) {
      console.warn('Users fetch warning:', err);
    }
  };

  const fetchAllJobs = async () => {
    try {
      const res = await fetch('/api/admin/jobs', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setJobs(data.data.filter(j => !['job_1', 'job_2', 'job_3', 'job_4', 'job_5', 'job_6'].includes(j._id)));
      }
    } catch (err) {
      console.warn('Jobs fetch warning:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data.filter(c => {
          if (['loc_1', 'loc_2', 'loc_3', 'loc_4', 'loc_5'].includes(c._id)) return false;
          const n = (c.name || '').toLowerCase();
          if (['bảo hành', 'thời trang'].includes(n)) return false;
          return true;
        }));
      }
    } catch (err) {
      console.warn('Categories fetch warning:', err);
    }
  };

  const fetchBannedKeywords = async () => {
    try {
      const res = await fetch('/api/admin/banned-keywords', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBannedKeywords(data.data);
      }
    } catch (err) {
      console.warn('Keywords fetch warning:', err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setReports(data.data.filter(r => r._id !== 'rep_1'));
      }
    } catch (err) {
      console.warn('Reports fetch warning:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setReviews(data.data);
      }
    } catch (err) {
      console.warn('Reviews fetch warning:', err);
    }
  };

  // User Ban / Unban (FR 3.4.5)
  const handleBanUserSubmit = async (e) => {
    e.preventDefault();
    if (!banModalUser) return;
    try {
      const res = await fetch(`/api/admin/users/${banModalUser._id}/ban`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ reason: banReason })
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message, data.success ? 'success' : 'error');
        setBanModalUser(null);
        setBanReason('');
        fetchUsers();
        fetchDashboard();
      } else {
        notify(data.message, data.success ? 'success' : 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/unban`, {
        method: 'PUT',
        headers
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message, data.success ? 'success' : 'error');
        fetchUsers();
        fetchDashboard();
      } else {
        notify(data.message, data.success ? 'success' : 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUserAccount = (user) => {
    const displayName = user.role === 'employer'
      ? (user.profile?.company_name || user.company_name || user.email)
      : (user.profile?.full_name || user.full_name || user.email);
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa Vĩnh Viễn Tài Khoản Người Dùng',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${displayName}" (${user.email}) và toàn bộ dữ liệu liên quan khỏi hệ thống? Thao tác này không thể khôi phục.`,
      type: 'danger',
      confirmText: 'Xóa',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/admin/users/${user._id}`, {
            method: 'DELETE',
            headers
          });
          const data = await res.json();
          if (data.success) {
            notify(data.message || 'Đã xóa vĩnh viễn tài khoản người dùng thành công!', 'success');
            if (selectedUserDetail && selectedUserDetail._id === user._id) {
              setSelectedUserDetail(null);
            }
            fetchUsers();
            fetchAllJobs();
            fetchReviews();
            fetchReports();
            fetchDashboard();
          } else {
            notify(data.message || 'Không thể xóa tài khoản người dùng.', 'error');
          }
        } catch (err) {
          notify('Lỗi máy chủ khi xóa tài khoản người dùng.', 'error');
        }
      }
    });
  };

  // GPKD Approval in Employer Detail Modal (FR 3.4.6)
  const handleReviewEmployerGpkd = async (userId, status) => {
    if (status === 'rejected') {
      const compName = selectedUserDetail?.profile?.company_name || 'Doanh nghiệp';
      setGpkdRejectModal({
        userId,
        companyName: compName,
        reason: 'Tài liệu Giấy phép kinh doanh (GPKD) mờ hoặc không hợp lệ theo quy định.'
      });
      return;
    }
    await executeGpkdReview(userId, 'approved', '');
  };

  const executeGpkdReview = async (userId, status, reason = '') => {
    try {
      const res = await fetch(`/api/admin/employers/${userId}/gpkd`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status, reason })
      });
      const data = await res.json();
      notify(data.message, data.success ? 'success' : 'error');
      fetchUsers();
      if (selectedUserDetail) {
        setSelectedUserDetail(prev => ({
          ...prev,
          approval_status: status,
          employer_record: { ...prev.employer_record, approval_status: status, reject_reason: reason }
        }));
      }
    } catch (err) {
      notify('Lỗi máy chủ khi cập nhật GPKD.', 'error');
    }
  };

  const handleReviewGpkd = executeGpkdReview;

  // Job Hide / Unhide (FR 3.5.5)
  const handleHideJobSubmit = async (e) => {
    e.preventDefault();
    if (!hideJobModal) return;
    try {
      const res = await fetch(`/api/admin/jobs/${hideJobModal._id}/hide`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ reason: hideReason })
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message, data.success ? 'success' : 'error');
        setHideJobModal(null);
        setHideReason('');
        fetchAllJobs();
        fetchDashboard();
      } else {
        notify(data.message, data.success ? 'success' : 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnhideJob = async (jobId) => {
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/unhide`, {
        method: 'PUT',
        headers
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message, data.success ? 'success' : 'error');
        fetchAllJobs();
        fetchDashboard();
      } else {
        notify(data.message, data.success ? 'success' : 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Hard Delete Job (FR 3.5.6)
  const handleDeleteJobAdmin = async (jobId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa Vĩnh Viễn Tin Tuyển Dụng',
      message: 'Bạn có chắc chắn muốn xóa vĩnh viễn tin tuyển dụng này khỏi cơ sở dữ liệu?',
      type: 'danger',
      confirmText: 'Xóa',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/admin/jobs/${jobId}`, {
            method: 'DELETE',
            headers
          });
          const data = await res.json();
          notify(data.message, data.success ? 'success' : 'error');
          fetchAllJobs();
          fetchDashboard();
        } catch (err) {
          notify('Lỗi máy chủ khi xóa tin tuyển dụng.', 'error');
        }
      }
    });
  };

  // Reviews Moderation (FR 3.6.5 & 3.6.6)
  const handleToggleHideReview = async (revId) => {
    try {
      const res = await fetch(`/api/admin/reviews/${revId}/hide`, {
        method: 'PUT',
        headers
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message, data.success ? 'success' : 'error');
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReview = async (revId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa Đánh Giá Vi Phạm',
      message: 'Bạn có chắc chắn muốn xóa đánh giá vi phạm này? Điểm Rating sẽ tự động được hệ thống tính toán lại.',
      type: 'danger',
      confirmText: 'Xóa',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/admin/reviews/${revId}`, {
            method: 'DELETE',
            headers
          });
          const data = await res.json();
          notify(data.message, data.success ? 'success' : 'error');
          fetchReviews();
        } catch (err) {
          notify('Lỗi máy chủ khi xóa đánh giá.', 'error');
        }
      }
    });
  };

  // Master Data Categories CRUD
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const targetType = categoryTab === 'all' ? newCatType : categoryTab;
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newCatName.trim(), type: targetType })
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || 'Đã thêm danh mục mới thành công!', 'success');
        setNewCatName('');
        fetchCategories();
      } else {
        notify(data.message || 'Không thể thêm danh mục.', 'error');
      }
    } catch (err) {
      notify('Lỗi kết nối máy chủ khi thêm danh mục.', 'error');
    }
  };

  const handleUpdateCategoryInline = async (catId) => {
    if (!editingCatName.trim()) return;
    try {
      const res = await fetch(`/api/admin/categories/${catId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: editingCatName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || 'Đã cập nhật tên danh mục thành công!', 'success');
        setEditingCatId(null);
        fetchCategories();
      } else {
        notify(data.message || 'Lỗi cập nhật danh mục.', 'error');
      }
    } catch (err) {
      notify('Lỗi máy chủ khi cập nhật danh mục.', 'error');
    }
  };

  const handleToggleCategoryActive = async (cat) => {
    try {
      const res = await fetch(`/api/admin/categories/${cat._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ is_active: !cat.is_active })
      });
      const data = await res.json();
      if (data.success) {
        notify(!cat.is_active ? 'Đã kích hoạt hiển thị danh mục thành công!' : 'Đã tạm ẩn danh mục thành công!', 'success');
        fetchCategories();
      }
    } catch (err) {
      notify('Lỗi máy chủ khi cập nhật trạng thái danh mục.', 'error');
    }
  };

  const handleDeleteCategory = async (catId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa Danh Mục Nghề Nghiệp',
      message: 'Xác nhận xóa danh mục này? Hệ thống sẽ kiểm tra ràng buộc toàn vẹn khóa ngoại trước khi tiến hành xóa.',
      type: 'danger',
      confirmText: 'Xóa',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/admin/categories/${catId}`, {
            method: 'DELETE',
            headers
          });
          const data = await res.json();
          if (data.success) {
            notify(data.message, 'success');
            fetchCategories();
          } else {
            notify(data.message, 'error');
          }
        } catch (err) {
          notify('Lỗi máy chủ khi xóa danh mục.', 'error');
        }
      }
    });
  };

  // Tickets Status Update (FR 3.8.4)
  const handleUpdateTicketStatus = async (ticketId, status) => {
    try {
      const res = await fetch(`/api/admin/reports/${ticketId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status, note: ticketNote })
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message, data.success ? 'success' : 'error');
        fetchReports();
        setSelectedTicket(null);
        setTicketChatHistory(null);
        setTicketNote('');
      } else {
        notify(data.message, data.success ? 'success' : 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReport = (ticket) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa Vĩnh Viễn Báo Cáo Vi Phạm',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn phiếu khiếu nại "${ticket.ticket_code || ticket._id}" khỏi hệ thống?`,
      type: 'danger',
      confirmText: 'Xóa',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/admin/reports/${ticket._id}`, {
            method: 'DELETE',
            headers
          });
          const data = await res.json();
          if (data.success) {
            notify(data.message || 'Đã xóa báo cáo vi phạm thành công!', 'success');
            if (selectedTicket && selectedTicket._id === ticket._id) {
              setSelectedTicket(null);
              setTicketChatHistory(null);
            }
            fetchReports();
            fetchDashboard();
          } else {
            notify(data.message || 'Không thể xóa báo cáo vi phạm.', 'error');
          }
        } catch (err) {
          notify('Lỗi máy chủ khi xóa báo cáo vi phạm.', 'error');
        }
      }
    });
  };

  // View Unmasked Chat History for Ticket
  const handleViewTicketChatHistory = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const res = await fetch(`/api/admin/reports/${ticket._id}/chat-history`, { headers });
      const data = await res.json();
      if (data.success) {
        setTicketChatHistory(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Banned Keywords
  const handleSaveKeywords = async (e) => {
    e.preventDefault();
    setKeywordSaveMsg('');
    const rawList = keywordsText.split(',').map(w => w.trim()).filter(Boolean);
    if (rawList.length === 0) return;

    try {
      for (const kw of rawList) {
        await fetch('/api/admin/banned-keywords', {
          method: 'POST',
          headers,
          body: JSON.stringify({ keyword: kw })
        });
      }
      setKeywordsText('');
      const msg = 'Đã thêm và áp dụng từ khóa cấm tự động thành công!';
      setKeywordSaveMsg(msg);
      notify(msg, 'success');
      fetchBannedKeywords();
      setTimeout(() => setKeywordSaveMsg(''), 3000);
    } catch (err) {
      setKeywordSaveMsg('Lỗi lưu từ khóa.');
      notify('Lỗi kết nối máy chủ khi lưu từ khóa cấm.', 'error');
    }
  };

  const handleUpdateBannedKeyword = async (kwId) => {
    if (!editingKwText.trim()) return;
    try {
      const res = await fetch(`/api/admin/banned-keywords/${kwId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ keyword: editingKwText.trim() })
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || 'Đã cập nhật từ khóa cấm thành công!', 'success');
        setEditingKwId(null);
        setEditingKwText('');
        fetchBannedKeywords();
      } else {
        notify(data.message || 'Không thể cập nhật từ khóa cấm.', 'error');
      }
    } catch (err) {
      notify('Lỗi máy chủ khi cập nhật từ khóa cấm.', 'error');
    }
  };

  const handleDeleteBannedKeyword = (kwId, kwName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa Từ Khóa Cấm',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn từ khóa cấm "${kwName}" khỏi bộ lọc hệ thống?`,
      type: 'danger',
      confirmText: 'Xóa',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/admin/banned-keywords/${kwId}`, {
            method: 'DELETE',
            headers
          });
          const data = await res.json();
          if (data.success) {
            notify(`Đã xóa từ khóa cấm "${kwName}" thành công!`, 'success');
            fetchBannedKeywords();
          } else {
            notify(data.message || 'Lỗi xóa từ khóa.', 'error');
          }
        } catch (err) {
          notify('Lỗi máy chủ khi xóa từ khóa.', 'error');
        }
      }
    });
  };

  // Export Report (FR 3.3.4) với Banner trạng thái dưới Header & Tải tệp thực tế về máy
  const handleExportReport = (format) => {
    notify(`Đang tổng hợp số liệu và kết xuất báo cáo định dạng ${format.toUpperCase()}...`, 'loading');
    setTimeout(() => {
      const nowStr = new Date().toLocaleString('vi-VN');
      const dateOnly = new Date().toISOString().slice(0, 10);

      if (format === 'excel') {
        const studentCount = users.filter(u => u.role === 'student').length;
        const employerCount = users.filter(u => u.role === 'employer').length;
        const activeJobCount = jobs.filter(j => !j.is_hidden).length;
        const hiddenJobCount = jobs.filter(j => j.is_hidden).length;

        const excelHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 25px; }
    th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #cbd5e1; text-align: left; }
    td { padding: 8px 10px; border: 1px solid #cbd5e1; color: #1e293b; font-size: 13px; }
    .title-banner { font-size: 18px; font-weight: bold; color: #1e3a8a; margin-bottom: 5px; }
    .sub-banner { font-size: 12px; color: #64748b; margin-bottom: 15px; }
    .section-title { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 20px; margin-bottom: 8px; }
    .badge-active { color: #059669; font-weight: bold; }
    .badge-banned { color: #dc2626; font-weight: bold; }
  </style>
</head>
<body>
  <div class="title-banner">HỆ THỐNG TUYỂN DỤNG PARTIME.VN - BÁO CÁO THỐNG KÊ QUẢN TRỊ</div>
  <div class="sub-banner">Thời gian kết xuất: ${nowStr} | Hệ thống Tuyển dụng Sinh viên PARTIME.VN</div>

  <div class="section-title">1. TỔNG QUAN CHỈ SỐ HỆ THỐNG</div>
  <table>
    <thead>
      <tr>
        <th>Chỉ Số Quản Trị</th>
        <th>Giá Trị Thống Kê</th>
        <th>Ghi Chú & Tỷ Lệ</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Tổng số tài khoản người dùng trong CSDL</td><td>${users.length}</td><td>Bao gồm sinh viên và nhà tuyển dụng</td></tr>
      <tr><td>Tài khoản Sinh viên</td><td>${studentCount}</td><td>Đã đăng ký xác thực email OTP</td></tr>
      <tr><td>Tài khoản Doanh nghiệp tuyển dụng</td><td>${employerCount}</td><td>Đã kích hoạt hồ sơ doanh nghiệp</td></tr>
      <tr><td>Tổng số tin tuyển dụng việc làm</td><td>${jobs.length}</td><td>Toàn bộ tin việc làm trên hệ thống</td></tr>
      <tr><td>Tin tuyển dụng đang hoạt động</td><td>${activeJobCount}</td><td>Đang hiển thị công khai cho sinh viên ứng tuyển</td></tr>
      <tr><td>Tin tuyển dụng bị ẩn do vi phạm</td><td>${hiddenJobCount}</td><td>Tạm khóa kiểm duyệt nội dung</td></tr>
      <tr><td>Tổng số lượt đánh giá 2 chiều</td><td>${reviews.length}</td><td>Đánh giá minh bạch giữa sinh viên và doanh nghiệp</td></tr>
      <tr><td>Tổng số báo cáo / khiếu nại vi phạm</td><td>${reports.length}</td><td>Bao gồm các ticket chờ xử lý và đã xử lý</td></tr>
      <tr><td>Danh mục ngành nghề & địa điểm</td><td>${categories.length}</td><td>Đang phân loại trên hệ thống</td></tr>
    </tbody>
  </table>

  <div class="section-title">2. DANH SÁCH CHI TIẾT TIN TUYỂN DỤNG VIỆC LÀM</div>
  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Mã Tin</th>
        <th>Tiêu Đề Công Việc</th>
        <th>Doanh Nghiệp Tuyển Dụng</th>
        <th>Ngành Nghề</th>
        <th>Địa Điểm Làm Việc</th>
        <th>Khoảng Lương</th>
        <th>Trạng Thái Vận Hành</th>
        <th>Kiểm Duyệt</th>
      </tr>
    </thead>
    <tbody>
      ${jobs.map((j, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${j._id}</td>
          <td>${j.title || ''}</td>
          <td>${j.company_name || 'Doanh nghiệp'}</td>
          <td>${j.category_name || (j.category_id === 'cat_1' ? 'Bán lẻ / Phục vụ' : j.category_id) || 'Bán thời gian'}</td>
          <td>${j.location || 'TP.HCM'}</td>
          <td>${j.is_negotiable ? 'Lương thỏa thuận' : `${j.salary_min?.toLocaleString('vi-VN')}đ - ${j.salary_max?.toLocaleString('vi-VN')}đ`}</td>
          <td>${j.job_status === 'open' || j.is_open ? 'Đang tuyển' : (j.job_status === 'filled' ? 'Đã nhận người' : (j.job_status === 'completed' ? 'Hoàn thành' : 'Tạm đóng'))}</td>
          <td>${j.is_hidden ? '<span class="badge-banned">Bị ẩn do vi phạm</span>' : '<span class="badge-active">Công khai</span>'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">3. DANH SÁCH TÀI KHOẢN NGƯỜI DÙNG HỆ THỐNG</div>
  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Mã Định Danh (ID)</th>
        <th>Email Đăng Nhập</th>
        <th>Họ Tên / Tên Doanh Nghiệp</th>
        <th>Vai Trò</th>
        <th>Trạng Thái Hoạt Động</th>
        <th>Trạng Thái GPKD (NTD)</th>
      </tr>
    </thead>
    <tbody>
      ${users.map((u, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${u._id}</td>
          <td>${u.email}</td>
          <td>${u.role === 'employer' ? (u.profile?.company_name || 'Doanh nghiệp') : (u.profile?.full_name || u.full_name || 'Sinh viên')}</td>
          <td>${u.role === 'employer' ? 'Nhà Tuyển Dụng' : (u.role === 'admin' ? 'Quản Trị Viên' : 'Sinh Viên')}</td>
          <td>${u.is_banned ? '<span class="badge-banned">Bị khóa tài khoản</span>' : '<span class="badge-active">Đang hoạt động</span>'}</td>
          <td>${u.role === 'employer' ? (u.employer_record?.approval_status || 'approved') : 'Không áp dụng'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;

        const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `BaoCao_ThongKe_PARTIME_${dateOnly}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        notify('Đã xuất báo cáo thống kê định dạng Excel hoàn chỉnh thành công! Dữ liệu hiển thị đúng chuẩn bảng tính biểu mẫu web.', 'success');
      } else {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Báo Cáo Thống Kê Hệ Thống PARTIME.VN</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #1e293b; }
                  h1 { color: #1e3a8a; font-size: 20px; margin-bottom: 4px; }
                  p.sub { color: #64748b; font-size: 12px; margin-bottom: 20px; }
                  h2 { color: #0f172a; font-size: 14px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px; }
                  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
                  th { background: #f1f5f9; padding: 8px; text-align: left; border: 1px solid #cbd5e1; font-weight: bold; }
                  td { padding: 8px; border: 1px solid #cbd5e1; }
                  @media print { button { display: none; } }
                </style>
              </head>
              <body>
                <h1>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>
                <p class="sub">HỆ THỐNG TUYỂN DỤNG PARTIME.VN - BÁO CÁO THỐNG KÊ TỔNG THỂ<br/>Thời gian: ${nowStr} | Hệ thống PARTIME.VN</p>
                <h2>1. TỔNG QUAN CHỈ SỐ HỆ THỐNG</h2>
                <table>
                  <tr><th>Chỉ số</th><th>Số lượng</th><th>Ghi chú</th></tr>
                  <tr><td>Tổng số người dùng</td><td>${users.length}</td><td>Sinh viên & Doanh nghiệp</td></tr>
                  <tr><td>Sinh viên</td><td>${users.filter(u => u.role === 'student').length}</td><td>Đã đăng ký</td></tr>
                  <tr><td>Doanh nghiệp</td><td>${users.filter(u => u.role === 'employer').length}</td><td>Đã kích hoạt</td></tr>
                  <tr><td>Tổng tin tuyển dụng</td><td>${jobs.length}</td><td>Bán thời gian</td></tr>
                  <tr><td>Tin đang hoạt động</td><td>${jobs.filter(j => !j.is_hidden).length}</td><td>Công khai</td></tr>
                  <tr><td>Số lượt đánh giá</td><td>${reviews.length}</td><td>Hai chiều</td></tr>
                  <tr><td>Báo cáo vi phạm</td><td>${reports.length}</td><td>Phiếu khiếu nại</td></tr>
                </table>
                <h2>2. DANH SÁCH TIN TUYỂN DỤNG TIÊU BIỂU</h2>
                <table>
                  <tr><th>STT</th><th>Tiêu đề</th><th>Doanh nghiệp</th><th>Mức lương</th><th>Trạng thái</th></tr>
                  ${jobs.slice(0, 30).map((j, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${j.title}</td>
                      <td>${j.company_name || 'Doanh nghiệp'}</td>
                      <td>${j.is_negotiable ? 'Thỏa thuận' : `${j.salary_min?.toLocaleString()}đ - ${j.salary_max?.toLocaleString()}đ`}</td>
                      <td>${j.is_hidden ? 'Bị ẩn vi phạm' : 'Công khai'}</td>
                    </tr>
                  `).join('')}
                </table>
                <div style="margin-top: 30px; text-align: right;">
                  <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">In / Lưu PDF</button>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
        notify('Đã mở cửa sổ in và kết xuất báo cáo định dạng PDF hoàn tất!', 'success');
      }
    }, 600);
  };

  // Non-admin real users & employers (đồng bộ 100% giữa Sidebar và Main Content)
  const nonAdminUsers = users.filter(u => {
    if (u.role === 'admin' || (u.email && u.email.toLowerCase().includes('lethithuyngan'))) return false;
    if (u.email && u.email.toLowerCase() === 'eadeedc@gmail.com') return false;
    if (u._id === 'user_student_486c9bf4') return false;
    return true;
  });
  const employerUsers = nonAdminUsers.filter(u => u.role === 'employer');

  useEffect(() => {
    setUserPage(1);
  }, [userSearch, userRoleFilter, userStatusFilter, userUniFilter, userRiskFilter, userIdentityFilter]);

  // Filtered Users (FR 3.4 & FR-QTV-04.10)
  const filteredUsers = nonAdminUsers.filter(u => {
    const userSearchObj = {
      ...u,
      full_name: u.profile?.full_name || u.full_name || '',
      company_name: u.profile?.company_name || u.company_name || '',
      branch_name: u.profile?.branch_name || u.branch_name || '',
      address: u.profile?.address || u.address || u.profile?.residence_address || '',
      phone: u.profile?.phone || u.phone || '',
      university: u.profile?.university || u.university || ''
    };
    const emailMatch = matchKeywordFlexible(userSearchObj, userSearch, ['email', '_id', 'full_name', 'company_name', 'branch_name', 'phone', 'university']);
    const roleMatch = !userRoleFilter || u.role === userRoleFilter;
    const statusMatch = !userStatusFilter || 
      (userStatusFilter === 'banned' && u.is_banned) || 
      (userStatusFilter === 'active' && !u.is_banned && u.status !== 'pending') ||
      (userStatusFilter === 'pending' && u.status === 'pending');

    // FR-QTV-04.10: Lọc theo Trường Đại học / Chi nhánh (Bỏ dấu tiếng Việt)
    const uniMatch = !userUniFilter || userUniFilter === 'all' || userUniFilter === 'Tất cả các trường đại học / chi nhánh' ||
      matchKeywordFlexible(userSearchObj, userUniFilter, ['university', 'branch_name', 'company_name', 'address']);

    // FR-QTV-04.10: Mức độ rủi ro vi phạm (Khớp chuẩn option high_risk >= 1 report, complaints >= 3 khiếu nại, safe = an toàn)
    let riskMatch = true;
    const repCount = Number(u.reports_count || 0);
    if (userRiskFilter === 'high_risk' || userRiskFilter === 'reported') {
      riskMatch = repCount >= 1 || Boolean(u.is_reported);
    } else if (userRiskFilter === 'complaints') {
      riskMatch = repCount >= 3 || Boolean(u.is_banned);
    } else if (userRiskFilter === 'safe') {
      riskMatch = repCount === 0 && !u.is_reported && !u.is_banned;
    }

    // FR-QTV-04.10: Tình trạng định danh (Khớp chuẩn option verified_otp, has_gpkd, incomplete)
    let idMatch = true;
    const hasName = Boolean(userSearchObj.full_name || userSearchObj.company_name);
    if (userIdentityFilter === 'verified_otp' || userIdentityFilter === 'verified_email') {
      idMatch = u.status === 'active' || Boolean(u.is_email_verified);
    } else if (userIdentityFilter === 'has_gpkd') {
      idMatch = u.role === 'employer' && Boolean(u.license_url || u.profile?.business_license_url || u.employer_record?.license_url || u.business_license || u.has_gpkd);
    } else if (userIdentityFilter === 'incomplete') {
      idMatch = u.status === 'pending' || !hasName;
    }

    return emailMatch && roleMatch && statusMatch && uniMatch && riskMatch && idMatch;
  });

  const totalUserPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE) || 1;
  const paginatedUsers = filteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);

  // Danh sách quận/huyện tương ứng với Tỉnh/Thành được chọn trong Thẩm định GPKD
  const gpkdAvailableDistricts = gpkdProvinceFilter && gpkdProvinceFilter !== 'all'
    ? getDistrictsByProvince(gpkdProvinceFilter)
    : [
        "Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5", "Quận 7", "Quận 10", "Quận Bình Thạnh", "Quận Gò Vấp", "TP. Thủ Đức",
        "Quận Cầu Giấy", "Quận Đống Đa", "Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Hai Bà Trưng", "Quận Thanh Xuân",
        "Quận Hải Châu", "Quận Ninh Kiều"
      ];

  // Filtered GPKD Employers (FR-QTV-04.11: MST 10/13 số, Tỉnh thành, Quận huyện, Hồ sơ tồn đọng)
  const filteredGpkdEmployers = employerUsers
    .filter(u => {
      let matchMst = true;
      const mst = (u.business_license || u.profile?.business_license || u.company_profile?.business_license || '').replace(/\D/g, '');
      if (gpkdMstFilter === '10') matchMst = mst.length === 10;
      else if (gpkdMstFilter === '13') matchMst = mst.length === 13;

      // Gộp toàn diện địa chỉ, chi nhánh, tên doanh nghiệp để nhận diện chính xác vị trí cơ sở
      const locationTokens = [
        u.address,
        u.profile?.address,
        u.company_profile?.address,
        u.employer_record?.address,
        u.branch_name,
        u.profile?.branch_name,
        u.company_profile?.branch_name,
        u.employer_record?.branch_name,
        u.district,
        u.profile?.district,
        u.company_profile?.district,
        u.province,
        u.profile?.province,
        u.company_profile?.province,
        u.residence_address,
        u.company_name,
        u.profile?.company_name,
        u.company_profile?.company_name
      ].filter(Boolean).map(s => String(s).trim());
      const fullLocationStr = locationTokens.join(' ');
      const gpkdLocObj = {
        location: fullLocationStr,
        address: u.profile?.address || u.address || u.company_profile?.address || '',
        branch_name: u.profile?.branch_name || u.branch_name || u.company_profile?.branch_name || '',
        district: u.profile?.district || u.district || '',
        province: u.profile?.province || u.province || ''
      };

      // So khớp Tỉnh / Thành Phố (chuẩn hóa không dấu + nhận diện qua tên tỉnh & danh sách quận/huyện thuộc tỉnh)
      let matchProv = true;
      if (gpkdProvinceFilter && gpkdProvinceFilter !== 'all') {
        matchProv = matchLocationFlexible(gpkdLocObj, gpkdProvinceFilter, [], '');
        if (!matchProv) {
          const distList = PROVINCE_DISTRICTS_MAP[gpkdProvinceFilter] || [];
          matchProv = distList.some(dist => matchLocationFlexible(gpkdLocObj, '', [dist], ''));
        }
        if (!matchProv && gpkdProvinceFilter === 'TP. Hồ Chí Minh') {
          const locUnaccent = removeVietnameseTones(fullLocationStr);
          matchProv = ['ben nghe', 'sai gon', 'tphcm', 'tp hcm'].some(alias => locUnaccent.includes(alias));
        }
      }

      // So khớp Quận / Huyện linh hoạt (hỗ trợ cả không dấu, Q1/Quận 1, Cầu Giấy/Cau Giay, ranh giới số)
      let matchDistrict = true;
      if (gpkdDistrictFilter && gpkdDistrictFilter.trim()) {
        matchDistrict = matchLocationFlexible(gpkdLocObj, '', [gpkdDistrictFilter.trim()], '');
      }

      let matchAge = true;
      if (gpkdAgeFilter !== 'all' && u.created_at) {
        const ageHours = (Date.now() - new Date(u.created_at).getTime()) / 3600000;
        if (gpkdAgeFilter === 'overdue') matchAge = ageHours > 24;
        else if (gpkdAgeFilter === 'today') matchAge = ageHours <= 24;
      }

      return matchMst && matchProv && matchDistrict && matchAge;
    })
    .sort((a, b) => {
      const rank = { pending: 0, rejected: 1, approved: 2 };
      const sa = a.employer_record?.approval_status || a.approval_status || 'pending';
      const sb = b.employer_record?.approval_status || b.approval_status || 'pending';
      if ((rank[sa] ?? 3) !== (rank[sb] ?? 3)) {
        return (rank[sa] ?? 3) - (rank[sb] ?? 3);
      }
      const ta = String(a.license_uploaded_at || a.employer_record?.license_uploaded_at || a.created_at || '');
      const tb = String(b.license_uploaded_at || b.employer_record?.license_uploaded_at || b.created_at || '');
      return tb.localeCompare(ta);
    });

  // Filtered Jobs (FR 3.5 & FR-QTV-05.07)
  const filteredJobs = jobs.filter(j => {
    // 1. Tìm kiếm linh hoạt đa từ & bỏ dấu tiếng Việt
    const matchSearch = matchKeywordFlexible(j, jobSearch, ['title', 'company_name', 'description', 'location', 'address', 'branch_name', 'category_name', 'district', 'province']);
    const jSt = normalizeJobStatus(j);
    let matchStatus = true;
    if (jobStatusFilter === 'open') {
      matchStatus = !j.is_hidden && jSt === 'open';
    } else if (jobStatusFilter === 'closed') {
      matchStatus = !j.is_hidden && jSt === 'closed';
    } else if (jobStatusFilter === 'filled') {
      matchStatus = !j.is_hidden && jSt === 'filled';
    } else if (jobStatusFilter === 'completed') {
      matchStatus = !j.is_hidden && jSt === 'completed';
    } else if (jobStatusFilter === 'hidden') {
      matchStatus = j.is_hidden === true;
    }

    // FR-QTV-05.07: Bộ lọc Tin vi phạm Lương 4 Vùng, Vi phạm giờ làm & Dấu hiệu lừa đảo
    let matchViolation = true;
    if (jobViolationFilter === 'under_min_wage') {
      const sMin = parseSalaryNumber(j.salary_min);
      const sMax = parseSalaryNumber(j.salary_max);
      matchViolation = (sMin > 0 && sMin < 20000) || (sMax > 0 && sMax < 20000);
    } else if (jobViolationFilter === 'over_8h') {
      const wt = removeVietnameseTones(j.work_time || '');
      const hoursMatch = wt.match(/(\d+(?:\.\d+)?)\s*(?:tieng|gio|h\b)/);
      const rangeMatch = wt.match(/(\d{1,2}):\d{2}\s*[-–]\s*(\d{1,2}):\d{2}/);
      let spanHours = 0;
      if (rangeMatch) {
        const startH = Number(rangeMatch[1]);
        let endH = Number(rangeMatch[2]);
        if (endH <= startH) endH += 24;
        spanHours = endH - startH;
      }
      matchViolation = (hoursMatch && Number(hoursMatch[1]) > 8) || spanHours > 8 ||
        wt.includes('10 tieng') || wt.includes('12 tieng') || wt.includes('10h') || wt.includes('12h');
    } else if (jobViolationFilter === 'scam_keywords') {
      const desc = removeVietnameseTones((j.title || '') + ' ' + (j.description || ''));
      matchViolation = desc.includes('coc') || desc.includes('dat coc') || desc.includes('nap tien') || desc.includes('telegram') || desc.includes('thu phi');
    } else if (jobViolationFilter === 'high_reports') {
      matchViolation = (j.report_count || 0) >= 2 || (j.violation_reports || 0) >= 2;
    }

    return matchSearch && matchStatus && matchViolation;
  });

  // Filtered Reviews (FR 3.6 & FR-QTV-06.07)
  const filteredReviews = reviews.filter(r => {
    const matchSearch = matchKeywordFlexible(r, reviewSearch, ['reviewer_name', 'user_name', 'student_name', 'company_name', 'comment', 'target_name', 'job_title']);
      
    let matchStatus = true;
    if (reviewStatusFilter === 'public') {
      matchStatus = !r.is_hidden;
    } else if (reviewStatusFilter === 'hidden') {
      matchStatus = r.is_hidden === true;
    }

    // FR-QTV-06.07: Chiều tương tác 2 Chiều (SV -> NTD vs NTD -> SV)
    let matchDirection = true;
    const isEmployerReviewer = r.direction === 'employer_to_student' || 
                               r.reviewer_role === 'employer' || 
                               r.type === 'employer_review' || 
                               (r.reviewer_name && (r.reviewer_name.toLowerCase().includes('nhà tuyển dụng') || r.reviewer_name.toLowerCase().includes('doanh nghiệp'))) ||
                               r.target_role === 'student';

    const isStudentReviewer = r.direction === 'student_to_employer' || 
                              r.reviewer_role === 'student' || 
                              r.type === 'student_review' || 
                              (!isEmployerReviewer);

    if (reviewDirectionFilter === 'stu_to_emp') {
      matchDirection = isStudentReviewer;
    } else if (reviewDirectionFilter === 'emp_to_stu') {
      matchDirection = isEmployerReviewer;
    }

    // FR-QTV-06.07: Thang điểm sao (Tiêu cực 1-2, Trung bình 3, Tích cực 4-5)
    let matchStars = true;
    const starScore = Number(r.rating || r.score || 5);
    if (reviewStarsFilter === 'negative') {
      matchStars = starScore <= 2;
    } else if (reviewStarsFilter === 'neutral') {
      matchStars = starScore === 3;
    } else if (reviewStarsFilter === 'positive') {
      matchStars = starScore >= 4;
    }

    return matchSearch && matchStatus && matchDirection && matchStars;
  });

  // Filtered Tickets (FR 3.8 & FR-QTV-08.02)
  const filteredTickets = reports.filter(r => {
    const matchSearch = matchKeywordFlexible(r, ticketSearch, ['ticket_code', 'reason', 'reporter_name', 'target_name', 'type', 'report_type', 'notes', 'description']);
    const matchType = !ticketTab || ticketTab === 'all' || r.type === ticketTab || r.report_type === ticketTab;
    const matchStatus = ticketStatusFilter === 'all' || r.status === ticketStatusFilter || (ticketStatusFilter === 'pending' && (!r.status || r.status === 'chờ xử lý'));
    return matchSearch && matchType && matchStatus;
  });

  // Admin Fixed Menu Items (8 Phân hệ Quản trị viên chuẩn - Khớp 100% với Main Content)
  const adminMenuItems = [
    { id: 'dashboard', label: 'Trung tâm chỉ huy (Analytics Dashboard)', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'users', label: 'Quản lý người dùng & Phân quyền', icon: <Users className="w-4 h-4" />, count: nonAdminUsers.length },
    { id: 'gpkd', label: 'Bàn thẩm định doanh nghiệp & Giấy phép kinh doanh', icon: <FileCheck className="w-4 h-4" />, count: employerUsers.length },
    { id: 'jobs', label: 'Kiểm duyệt tin tuyển dụng', icon: <Briefcase className="w-4 h-4" />, count: jobs.length },
    { id: 'keywords', label: 'Kiểm duyệt từ khoá cấm', icon: <ShieldCheck className="w-4 h-4" />, count: bannedKeywords.length },
    { id: 'reviews', label: 'Quản lý đánh giá chéo 2 chiều', icon: <Star className="w-4 h-4" />, count: reviews.length },
    { id: 'categories', label: 'Quản trị danh mục Master Data', icon: <Tag className="w-4 h-4" />, count: categories.length },
    { id: 'reports', label: 'Xử lý Khiếu nại & Báo cáo vi phạm', icon: <AlertTriangle className="w-4 h-4" />, count: reports.length }
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#F8FAFC] text-slate-800 min-h-[calc(100vh-80px)]">
      
      {/* ======================= LEFT SIDEBAR QUẢN TRỊ VIÊN (CÓ NÚT THU GỌN / MỞ RỘNG) ======================= */}
      <aside className={`${
        mobileSidebarOpen
          ? 'fixed inset-y-0 left-0 z-50 w-80 shadow-2xl flex'
          : `hidden md:flex ${isSidebarCollapsed ? 'md:w-20' : 'md:w-80'}`
      } bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-sm flex-col shrink-0 transition-all duration-300`}>
        <div className={`p-4 border-b border-slate-100 flex items-center ${isSidebarCollapsed && !mobileSidebarOpen ? 'justify-center' : 'justify-between'} gap-2`}>
          {(!isSidebarCollapsed || mobileSidebarOpen) && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
              <span className="text-sm sm:text-base font-black tracking-wider text-slate-900 uppercase truncate">Cổng Quản Trị Hệ Thống</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            title={isSidebarCollapsed ? 'Mở rộng thanh danh mục' : 'Thu gọn thanh danh mục'}
            className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-all cursor-pointer shrink-0"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button 
            type="button" 
            onClick={onToggleMobileSidebar} 
            className="md:hidden p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 8 Mục Menu Cố Định */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {adminMenuItems.map((item) => {
            const isActive = activeMenu === item.id;
            const collapsedDesktop = isSidebarCollapsed && !mobileSidebarOpen;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                onClick={() => {
                  handleMenuSwitch(item.id);
                  if (mobileSidebarOpen && onToggleMobileSidebar) onToggleMobileSidebar();
                }}
                className={`w-full flex items-center ${collapsedDesktop ? 'justify-center px-2 py-3' : 'justify-between px-4 py-3 gap-2'} rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-black'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/90'
                }`}
              >
                <div className={`relative flex items-center ${collapsedDesktop ? 'justify-center' : 'gap-3 min-w-0'}`}>
                  <span className={`shrink-0 ${isActive ? 'text-white' : 'text-blue-600'}`}>{item.icon}</span>
                  {collapsedDesktop && item.count !== undefined && item.count > 0 && (
                    <span className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center whitespace-nowrap ring-2 shadow-xs ${
                      isActive ? 'bg-white text-blue-700 ring-indigo-600' : 'bg-blue-600 text-white ring-white'
                    }`}>
                      {item.count >= 100 ? '99+' : item.count}
                    </span>
                  )}
                  {!collapsedDesktop && <span className="leading-snug">{item.label}</span>}
                </div>
                {!collapsedDesktop && item.count !== undefined && item.count > 0 && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black shrink-0 whitespace-nowrap ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {item.count >= 100 ? '99+' : item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ======================= MAIN CONTENT AREA ======================= */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto transition-all duration-300">

        {/* 1. TRANG CHỦ QUẢN TRỊ VIÊN */}
        {activeMenu === 'home' && (
          <div className="w-full max-w-full mx-auto space-y-8">
            <div className="p-6 sm:p-10 lg:p-12 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 shadow-xl text-white min-h-[240px] sm:min-h-[270px] flex flex-col justify-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-sm font-bold w-fit whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bảng Quản Trị Hệ Thống PARTIME.VN</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight text-white">
                Bảng Điều Khiển Quản Trị Hệ Thống Sàn Tuyển Dụng PARTIME.VN
              </h2>
              <p className="text-xs sm:text-sm text-blue-50 leading-relaxed max-w-3xl mt-2">
                Xin chào <strong className="text-white font-black">{currentUser?.profile?.full_name || currentUser?.full_name || "Quản trị viên"}</strong>. 
                Bạn có toàn quyền kiểm duyệt người dùng, phê duyệt Giấy phép kinh doanh, giám sát tin đăng, xử lý khiếu nại vi phạm và cấu hình bộ lọc từ cấm tự động.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => handleMenuSwitch('dashboard')}
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-sm sm:text-base font-bold shadow-xl cursor-pointer flex items-center gap-2.5 whitespace-nowrap"
                >
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Xem Dashboard Thống Kê</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuSwitch('gpkd')}
                  className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm sm:text-base font-bold shadow-xl cursor-pointer flex items-center gap-2.5 whitespace-nowrap"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Duyệt Hồ Sơ Doanh Nghiệp ({users.filter(u => u.role === 'employer').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuSwitch('users')}
                  className="px-6 py-3.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm sm:text-base font-bold cursor-pointer flex items-center gap-2.5 backdrop-blur-md whitespace-nowrap"
                >
                  <Users className="w-4 h-4 text-white" />
                  <span>Quản Lý Người Dùng</span>
                </button>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-sm hover:shadow-md transition-all min-h-[140px]">
                <p className="text-xs text-slate-600 font-bold uppercase">Tổng Người Dùng</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900">{users.length}</p>
                <p className="text-xs text-blue-700 font-semibold">{users.filter(u => u.role === 'student').length} SV | {users.filter(u => u.role === 'employer').length} NTD</p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-sm hover:shadow-md transition-all min-h-[140px]">
                <p className="text-xs text-slate-600 font-bold uppercase">Tin Tuyển Dụng</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900">{jobs.length}</p>
                <p className="text-xs text-emerald-700 font-semibold">{jobs.filter(j => !j.is_hidden).length} tin công khai</p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-sm hover:shadow-md transition-all min-h-[140px]">
                <p className="text-xs text-slate-600 font-bold uppercase">Phiếu Cần Xử Lý</p>
                <p className="text-2xl font-black text-amber-600">{reports.filter(r => r.status === 'pending').length}</p>
                <p className="text-xs text-slate-600 font-medium">Đơn khiếu nại & tố cáo</p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-sm hover:shadow-md transition-all min-h-[140px]">
                <p className="text-xs text-slate-600 font-bold uppercase">Từ Khóa Cấm</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900">{bannedKeywords.length}</p>
                <p className="text-xs text-blue-700 font-semibold">Bộ lọc tự động toàn hệ thống</p>
              </div>
            </div>
          </div>
        )}

        {/* 1.1 MÀN HÌNH KIỂM DUYỆT HỒ SƠ DOANH NGHIỆP & GPKD */}
        {activeMenu === 'gpkd' && (
          <div className="w-full max-w-full mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-black text-slate-900">Kiểm Duyệt Hồ Sơ & Giấy Phép Kinh Doanh (GPKD)</h3>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Thẩm định hồ sơ pháp lý doanh nghiệp (tệp PDF ≤ 10MB) và cấp quyền đăng tin tuyển dụng không giới hạn
                </p>
              </div>
            </div>

            {/* Quick KPI for Employers GPKD */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-600 uppercase">Tổng Doanh Nghiệp</span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900">{users.filter(u => u.role === 'employer').length}</p>
                <p className="text-xs text-blue-700 font-semibold">Đăng ký tham gia sàn PARTIME.VN</p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-600 uppercase">Đã Phê Duyệt Hợp Lệ</span>
                <p className="text-2xl font-black text-emerald-600">
                  {users.filter(u => u.role === 'employer' && (u.employer_record?.approval_status === 'approved' || u.approval_status === 'approved')).length}
                </p>
                <p className="text-xs text-emerald-700 font-semibold">Được phép đăng tin tuyển dụng</p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-600 uppercase">Chờ Xét Duyệt GPKD</span>
                <p className="text-2xl font-black text-amber-600">
                  {users.filter(u => u.role === 'employer' && (u.employer_record?.approval_status === 'pending' || u.approval_status === 'pending')).length}
                </p>
                <p className="text-xs text-amber-700 font-semibold">Hồ sơ mới nộp cần xử lý</p>
              </div>
            </div>

            {/* Bảng danh sách Doanh nghiệp & GPKD */}
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-md overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-2">
                <h4 className="text-base font-bold text-slate-900 uppercase tracking-wider">Danh Sách Doanh Nghiệp Tuyển Dụng</h4>
                <span className="text-xs text-slate-700 font-bold whitespace-nowrap">
                  {filteredGpkdEmployers.length} / {employerUsers.length} đối tác
                </span>
              </div>

              {/* FR-QTV-04.11: Bộ lọc Bàn thẩm định GPKD (MST 10/13 số, Tỉnh thành, Quận huyện, Hồ sơ tồn đọng) */}
              <div className="p-4 bg-slate-50/50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã Số Thuế (MST):</label>
                  <select
                    value={gpkdMstFilter}
                    onChange={(e) => setGpkdMstFilter(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-blue-600 shadow-xs cursor-pointer"
                  >
                    <option value="all">Tất cả định dạng MST</option>
                    <option value="10">MST 10 số của doanh nghiệp</option>
                    <option value="13">MST 13 số của chi nhánh, đơn vị phụ thuộc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Khu Vực Tỉnh / Thành Phố:</label>
                  <select
                    value={gpkdProvinceFilter}
                    onChange={(e) => {
                      setGpkdProvinceFilter(e.target.value);
                      setGpkdDistrictFilter('');
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-blue-600 shadow-xs cursor-pointer"
                  >
                    <option value="all">Toàn quốc</option>
                    {VIETNAM_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lọc Theo Quận / Huyện:</label>
                  <input
                    type="text"
                    list="gpkd-districts-datalist"
                    value={gpkdDistrictFilter}
                    onChange={(e) => setGpkdDistrictFilter(e.target.value)}
                    placeholder={
                      gpkdProvinceFilter === 'Hà Nội'
                        ? 'Gợi ý: Cầu Giấy, Đống Đa, Ba Đình...'
                        : (gpkdProvinceFilter === 'TP. Hồ Chí Minh'
                          ? 'Gợi ý: Quận 1, Quận 2, Quận 3, Bình Thạnh...'
                          : (gpkdProvinceFilter !== 'all' ? `Gợi ý: quận/huyện tại ${gpkdProvinceFilter}...` : 'Nhập Quận 1, Cầu Giấy,...'))
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-blue-600 shadow-xs"
                  />
                  <datalist id="gpkd-districts-datalist">
                    {gpkdAvailableDistricts.map((d, i) => (
                      <option key={`${d}-${i}`} value={d} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thời Hạn Hồ Sơ Tồn Đọng:</label>
                  <select
                    value={gpkdAgeFilter}
                    onChange={(e) => setGpkdAgeFilter(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-blue-600 shadow-xs cursor-pointer"
                  >
                    <option value="all">Tất cả thời hạn hồ sơ</option>
                    <option value="overdue">Chờ duyệt quá 24 giờ</option>
                    <option value="today">Nộp trong ngày</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/90 text-slate-800 border-b border-slate-200 uppercase font-bold text-xs sm:text-sm tracking-wider">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">Doanh Nghiệp & Chi Nhánh</th>
                      <th className="px-6 py-4 whitespace-nowrap">Người Đại Diện</th>
                      <th className="px-6 py-4 whitespace-nowrap">Email / SĐT</th>
                      <th className="px-6 py-4 whitespace-nowrap">Mã Số GPKD</th>
                      <th className="px-6 py-4 whitespace-nowrap">Tài Liệu Đính Kèm</th>
                      <th className="px-6 py-4 whitespace-nowrap">Trạng Thái</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Thao Tác Phê Duyệt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredGpkdEmployers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-slate-500 text-sm">
                          Không tìm thấy hồ sơ doanh nghiệp nào phù hợp với bộ lọc đã chọn.
                        </td>
                      </tr>
                    ) : (
                      filteredGpkdEmployers.map((emp) => {
                      const status = emp.employer_record?.approval_status || emp.approval_status || 'pending';
                      const gpkdUrl = emp.profile?.business_license_url || emp.license_url || emp.employer_record?.license_url || '';
                      const gpkdName = emp.profile?.business_license_name || emp.license_name || '';

                      return (
                        <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900 text-base">{emp.profile?.company_name || emp.company_name || 'Doanh nghiệp'}</p>
                            <p className="text-sm text-slate-600 mt-1">{emp.profile?.branch_name || ''}</p>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800 text-sm sm:text-base whitespace-nowrap">
                            {emp.profile?.representative_name || emp.representative_name || 'Người đại diện'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-slate-800 font-mono text-xs sm:text-sm">{emp.email}</p>
                            <p className="text-xs text-slate-600 font-mono">{emp.profile?.phone || ''}</p>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                            {emp.profile?.business_license || 'Chưa cập nhật'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {gpkdUrl ? (
                              <button
                                type="button"
                                onClick={() => setAdminGpkdViewer({
                                  company_name: emp.profile?.company_name || emp.company_name || 'Doanh nghiệp',
                                  representative_name: emp.profile?.representative_name || 'Người đại diện',
                                  business_license: emp.profile?.business_license || 'Chưa cập nhật',
                                  business_license_url: gpkdUrl,
                                  business_license_name: gpkdName
                                })}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs text-xs whitespace-nowrap"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Xem File GPKD (PDF)</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Chưa tải lên PDF</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap gap-1.5 ${
                              status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : status === 'rejected'
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${status === 'approved' ? 'bg-emerald-600' : status === 'rejected' ? 'bg-rose-600' : 'bg-amber-600 animate-pulse'}`} />
                              <span>{status === 'approved' ? 'Đã Phê Duyệt' : (status === 'rejected' ? 'Bị Từ Chối' : 'Chờ Thẩm Định')}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleReviewGpkd(emp._id, 'approved', '')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap transition-all"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Duyệt</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Từ Chối Giấy Phép Kinh Doanh',
                                    message: `Xác nhận từ chối GPKD của "${emp.profile?.company_name || emp.company_name || 'Doanh nghiệp'}"? Lý do: "Tài liệu mờ hoặc thông tin không trùng khớp".`,
                                    type: 'danger',
                                    confirmText: 'Từ chối',
                                    cancelText: 'Hủy',
                                    onConfirm: () => {
                                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                      handleReviewGpkd(emp._id, 'rejected', 'Tài liệu GPKD mờ hoặc không hợp lệ theo quy định.');
                                    }
                                  });
                                }}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Từ chối</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. MÀN HÌNH DASHBOARD THỐNG KÊ & BÁO CÁO TĂNG TRƯỞNG */}
        {activeMenu === 'dashboard' && (
          <div className="w-full max-w-full mx-auto space-y-6">
            {(() => {
              const parseRecordDate = (item) => {
                const raw = item?.created_at || item?.applied_at || item?.updated_at || '';
                if (!raw) return null;
                const str = String(raw).trim();
                const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
                if (isoMatch) {
                  return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
                }
                const vnMatch = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (vnMatch) {
                  return new Date(Number(vnMatch[3]), Number(vnMatch[2]) - 1, Number(vnMatch[1]));
                }
                const parsed = new Date(str);
                return Number.isNaN(parsed.getTime()) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
              };

              const parseDateInput = (dateStr) => {
                if (!dateStr) return null;
                const parts = String(dateStr).trim().split('-');
                if (parts.length !== 3) return null;
                const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                return Number.isNaN(dt.getTime()) ? null : dt;
              };

              const fmtDM = (dt) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
              const fmtDMY = (dt) => `${fmtDM(dt)}/${dt.getFullYear()}`;

              const allRealApps = Array.isArray(stats?.applications_list) ? stats.applications_list : [];

              // Danh sách năm: 2024 & 2025 (dữ liệu lịch sử) + 2026 (dữ liệu thực tế CSDL)
              const yearSet = new Set([2026, 2025, 2024]);
              [...nonAdminUsers, ...jobs, ...allRealApps].forEach((doc) => {
                const d = parseRecordDate(doc);
                if (d) yearSet.add(d.getFullYear());
              });
              const availableYears = Array.from(yearSet).sort((a, b) => b - a);

              const selYearNum = filterYear ? Number(filterYear) : null;
              const selMonthNum = filterMonth ? Number(filterMonth) : null;

              // Xác định khoảng ngày kiểm tra [rangeStart .. rangeEnd]
              let rangeStart = null;
              let rangeEnd = null;
              if (filterFromDate || filterToDate) {
                const fDt = parseDateInput(filterFromDate) || new Date(2024, 0, 1);
                const tDt = parseDateInput(filterToDate) || new Date(2026, 11, 31);
                rangeStart = fDt.getTime() <= tDt.getTime() ? fDt : tDt;
                rangeEnd = fDt.getTime() <= tDt.getTime() ? tDt : fDt;
              } else if (selYearNum && selMonthNum) {
                const maxD = new Date(selYearNum, selMonthNum, 0).getDate();
                rangeStart = new Date(selYearNum, selMonthNum - 1, 1);
                rangeEnd = new Date(selYearNum, selMonthNum - 1, maxD);
              } else if (selYearNum) {
                rangeStart = new Date(selYearNum, 0, 1);
                rangeEnd = new Date(selYearNum, 11, 31);
              }

              const isAllTime = !rangeStart && !rangeEnd;
              const isFullYearRange = Boolean(
                rangeStart && rangeEnd &&
                rangeStart.getFullYear() === rangeEnd.getFullYear() &&
                rangeStart.getMonth() === 0 && rangeStart.getDate() === 1 &&
                rangeEnd.getMonth() === 11 && rangeEnd.getDate() === 31
              );
              const isFullMonthRange = Boolean(
                rangeStart && rangeEnd &&
                rangeStart.getFullYear() === rangeEnd.getFullYear() &&
                rangeStart.getMonth() === rangeEnd.getMonth() &&
                rangeStart.getDate() === 1 &&
                rangeEnd.getDate() === new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() + 1, 0).getDate()
              );
              const isSingleDayRange = Boolean(
                rangeStart && rangeEnd && rangeStart.getTime() === rangeEnd.getTime()
              );
              const isPure2026 = Boolean(
                rangeStart && rangeEnd &&
                rangeStart.getFullYear() === 2026 && rangeEnd.getFullYear() === 2026
              );

              // Dữ liệu lịch sử 2024 - 2025 (Năm 2026 hoàn toàn bằng 0 trong bộ lịch sử này)
              const matchedHistBuckets = isAllTime
                ? HISTORICAL_2024_2025_BUCKETS
                : HISTORICAL_2024_2025_BUCKETS.filter(
                    (b) => b.timestamp >= rangeStart.getTime() && b.timestamp <= rangeEnd.getTime()
                  );

              // Bộ lọc địa điểm & ngành nghề dùng chung cho Dashboard (tránh trùng lặp logic)
              const matchesDashGeoAndCat = (rawDoc) => {
                const linkedJob = rawDoc?.job_id ? jobs.find(j => j._id === rawDoc.job_id) : null;
                const doc = linkedJob ? { ...linkedJob, ...rawDoc } : rawDoc;
                if (dashProvinceFilter) {
                  const locObj = {
                    location: [doc.province, doc.location, doc.address, doc.profile?.address, doc.company_profile?.address, doc.branch_name, doc.profile?.branch_name].filter(Boolean).join(' '),
                    province: doc.province || doc.profile?.province || '',
                    district: doc.district || doc.profile?.district || '',
                    address: doc.address || doc.profile?.address || doc.company_profile?.address || '',
                    branch_name: doc.branch_name || doc.profile?.branch_name || ''
                  };
                  let provOk = matchLocationFlexible(locObj, dashProvinceFilter, [], '');
                  if (!provOk) {
                    const dists = PROVINCE_DISTRICTS_MAP[dashProvinceFilter] || [];
                    provOk = dists.some(d => matchLocationFlexible(locObj, '', [d], ''));
                  }
                  if (!provOk) return false;
                }
                if (dashCategoryFilter) {
                  if (!matchCategoryFlexible(doc, dashCategoryFilter, categories)) return false;
                }
                return true;
              };

              // Dữ liệu thực tế từ CSDL (cho năm 2026 và toàn thời gian)
              const matchesRealDoc = (doc) => {
                if (!isAllTime) {
                  const d = parseRecordDate(doc);
                  if (!d) {
                    if (!(isFullYearRange && rangeStart.getFullYear() === 2026)) return false;
                  } else if (d.getTime() < rangeStart.getTime() || d.getTime() > rangeEnd.getTime()) {
                    return false;
                  }
                }
                return matchesDashGeoAndCat(doc);
              };

              const hasGeoOrCatFilter = Boolean(dashProvinceFilter || dashCategoryFilter);
              const filteredDashStudents = nonAdminUsers.filter(u => u.role === 'student' && matchesRealDoc(u));
              const filteredDashEmployers = nonAdminUsers.filter(u => u.role === 'employer' && matchesRealDoc(u));
              const filteredDashJobs = jobs.filter(j => matchesRealDoc(j));
              const filteredDashActiveJobs = filteredDashJobs.filter(j => !j.is_hidden);
              const filteredDashApps = (isAllTime && !hasGeoOrCatFilter)
                ? allRealApps
                : allRealApps.filter(a => matchesRealDoc(a));

              const histStudents = matchedHistBuckets.reduce((s, b) => s + b.students, 0);
              const histEmployers = matchedHistBuckets.reduce((s, b) => s + b.employers, 0);
              const histApprovedEmployers = matchedHistBuckets.reduce((s, b) => s + b.approvedEmployers, 0);
              const histJobs = matchedHistBuckets.reduce((s, b) => s + b.jobs, 0);
              const histActiveJobs = matchedHistBuckets.reduce((s, b) => s + b.activeJobs, 0);
              const histApps = matchedHistBuckets.reduce((s, b) => s + b.apps, 0);
              const histAcceptedApps = matchedHistBuckets.reduce((s, b) => s + b.acceptedApps, 0);

              const studentCount = histStudents + filteredDashStudents.length;
              const employerCount = histEmployers + filteredDashEmployers.length;
              const approvedEmployersCount = histApprovedEmployers + filteredDashEmployers.filter(
                u => (u.employer_record?.approval_status || u.approval_status || 'approved') === 'approved'
              ).length;
              const jobCount = histJobs + filteredDashJobs.length;
              const activeJobCount = histActiveJobs + filteredDashActiveJobs.length;
              const appCount = histApps + (
                (isAllTime && !hasGeoOrCatFilter)
                  ? (allRealApps.length || stats?.metrics?.total_applications || 0)
                  : filteredDashApps.length
              );
              const acceptedAppCount = histAcceptedApps + filteredDashApps.filter(
                a => ['accepted', 'completed', 'approved'].includes(a.application_status || a.status)
              ).length;

              let periodBadge = 'Toàn thời gian';
              if (isFullYearRange) {
                periodBadge = `Năm ${rangeStart.getFullYear()}`;
              } else if (isFullMonthRange) {
                periodBadge = `Tháng ${rangeStart.getMonth() + 1}/${rangeStart.getFullYear()}`;
              } else if (isSingleDayRange) {
                periodBadge = `Ngày ${fmtDMY(rangeStart)}`;
              } else if (rangeStart && rangeEnd) {
                periodBadge = rangeStart.getFullYear() === rangeEnd.getFullYear()
                  ? `${fmtDM(rangeStart)} - ${fmtDMY(rangeEnd)}`
                  : `${fmtDMY(rangeStart)} - ${fmtDMY(rangeEnd)}`;
              }

              const dataSourceBadge = isPure2026
                ? 'Số liệu thực tế CSDL (2026)'
                : (rangeEnd && rangeEnd.getFullYear() <= 2025 ? 'Dữ liệu thống kê lịch sử' : 'Tổng hợp 2024 - 2026');

              // Hàm tính tổng trong 1 cửa sổ thời gian bất kỳ [winStart .. winEnd]
              const sumWindow = (winStart, winEnd, includeUndated2026 = false) => {
                const wStartMs = winStart.getTime();
                const wEndMs = winEnd.getTime();
                const hBuckets = HISTORICAL_2024_2025_BUCKETS.filter(
                  (b) => b.timestamp >= wStartMs && b.timestamp <= wEndMs
                );
                const hSv = hBuckets.reduce((s, b) => s + b.students, 0);
                const hJb = hBuckets.reduce((s, b) => s + b.jobs, 0);
                const hAp = hBuckets.reduce((s, b) => s + b.apps, 0);

                const inWin = (doc) => {
                  const d = parseRecordDate(doc);
                  if (!d) {
                    if (!includeUndated2026) return false;
                  } else if (d.getTime() < wStartMs || d.getTime() > wEndMs) {
                    return false;
                  }
                  return matchesDashGeoAndCat(doc);
                };
                const rSv = nonAdminUsers.filter(u => u.role === 'student' && inWin(u)).length;
                const rJb = jobs.filter(j => inWin(j)).length;
                const rAp = allRealApps.filter(a => inWin(a)).length;

                return {
                  students: hSv + rSv,
                  jobs: hJb + rJb,
                  apps: hAp + rAp
                };
              };

              // Dữ liệu cho Biểu đồ cột (Bar Chart) và Biểu đồ đường (Line Chart)
              let chartTitle = 'Thống Kê Tin Tuyển Dụng & Đơn Ứng Tuyển Theo Năm (2024 - 2026)';
              let bars = [];
              let rawGrowth = [];

              if (isAllTime) {
                const orderedYears = availableYears.slice().reverse();
                bars = orderedYears.map((yr) => {
                  const w = sumWindow(new Date(yr, 0, 1), new Date(yr, 11, 31), yr === 2026);
                  return { label: `Năm ${yr}`, val: w.jobs + w.apps, jobs: w.jobs, apps: w.apps };
                });
                rawGrowth = orderedYears.map((yr) => {
                  const w = sumWindow(new Date(yr, 0, 1), new Date(yr, 11, 31), yr === 2026);
                  return { label: `Năm ${yr}`, sv: w.students, jb: w.jobs };
                });
              } else if (isFullYearRange) {
                const yr = rangeStart.getFullYear();
                chartTitle = yr === 2026
                  ? 'Thống Kê Hoạt Động Thực Tế Qua 4 Quý - Năm 2026'
                  : `Thống Kê Hoạt Động Qua 4 Quý - Năm ${yr}`;
                const curQuarter = Math.floor(new Date().getMonth() / 3) + 1;
                const qStats = [1, 2, 3, 4].map((q) => {
                  const qStart = new Date(yr, (q - 1) * 3, 1);
                  const qEnd = new Date(yr, q * 3, 0);
                  const w = sumWindow(qStart, qEnd, yr === 2026 && q === curQuarter);
                  return { q, ...w };
                });
                bars = qStats.map((qs) => ({
                  label: `Quý ${qs.q}`,
                  val: qs.jobs + qs.apps,
                  jobs: qs.jobs,
                  apps: qs.apps
                }));
                rawGrowth = qStats.map((qs) => ({
                  label: `Quý ${qs.q}/${yr}`,
                  sv: qs.students,
                  jb: qs.jobs
                }));
              } else if (isFullMonthRange) {
                const yr = rangeStart.getFullYear();
                const mNum = rangeStart.getMonth() + 1;
                const pm = String(mNum).padStart(2, '0');
                const lastD = rangeEnd.getDate();
                chartTitle = yr === 2026
                  ? `Thống Kê Hoạt Động Thực Tế Trong Tháng ${mNum}/2026`
                  : `Thống Kê Hoạt Động Trong Tháng ${mNum}/${yr}`;
                const intervals = [
                  { label: `01-07/${pm}`, d1: 1, d2: 7 },
                  { label: `08-14/${pm}`, d1: 8, d2: 14 },
                  { label: `15-21/${pm}`, d1: 15, d2: 21 },
                  { label: `22-${String(lastD).padStart(2, '0')}/${pm}`, d1: 22, d2: lastD }
                ];
                bars = intervals.map((iv) => {
                  const w = sumWindow(new Date(yr, mNum - 1, iv.d1), new Date(yr, mNum - 1, iv.d2), false);
                  return { label: iv.label, val: w.jobs + w.apps, jobs: w.jobs, apps: w.apps };
                });
                rawGrowth = intervals.map((iv) => {
                  const w = sumWindow(new Date(yr, mNum - 1, iv.d1), new Date(yr, mNum - 1, iv.d2), false);
                  return { label: iv.label, sv: w.students, jb: w.jobs };
                });
              } else {
                chartTitle = isPure2026
                  ? `Thống Kê Thực Tế Trong Kỳ Đã Chọn (${periodBadge})`
                  : `Thống Kê Trong Khoảng Ngày Đã Chọn (${periodBadge})`;
                bars = [
                  { label: 'Sinh viên', val: studentCount, jobs: studentCount, apps: 0 },
                  { label: 'Doanh nghiệp', val: employerCount, jobs: employerCount, apps: 0 },
                  { label: 'Tin tuyển dụng', val: jobCount, jobs: jobCount, apps: 0 },
                  { label: 'Đơn ứng tuyển', val: appCount, jobs: 0, apps: appCount }
                ];

                const diffDays = Math.max(1, Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1);
                if (diffDays === 1) {
                  rawGrowth = [
                    { label: fmtDMY(rangeStart), sv: studentCount, jb: jobCount },
                    { label: 'Trong ngày', sv: studentCount, jb: jobCount }
                  ];
                } else if (diffDays <= 7) {
                  rawGrowth = Array.from({ length: diffDays }, (_, idx) => {
                    const dayDt = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + idx);
                    const w = sumWindow(dayDt, dayDt, false);
                    return { label: fmtDM(dayDt), sv: w.students, jb: w.jobs };
                  });
                } else {
                  const stepMs = (rangeEnd.getTime() - rangeStart.getTime()) / 4;
                  rawGrowth = [0, 1, 2, 3].map((idx) => {
                    const sMs = rangeStart.getTime() + Math.round(idx * stepMs);
                    const eMs = idx === 3 ? rangeEnd.getTime() : (rangeStart.getTime() + Math.round((idx + 1) * stepMs) - 86400000);
                    const sDt = new Date(sMs);
                    const eDt = new Date(Math.max(sMs, eMs));
                    const w = sumWindow(
                      new Date(sDt.getFullYear(), sDt.getMonth(), sDt.getDate()),
                      new Date(eDt.getFullYear(), eDt.getMonth(), eDt.getDate()),
                      false
                    );
                    return { label: `${fmtDM(sDt)}-${fmtDM(eDt)}`, sv: w.students, jb: w.jobs };
                  });
                }
              }

              const chartMax = Math.max(1, ...bars.map(b => b.val));

              const maxLineVal = Math.max(1, ...rawGrowth.map(p => Math.max(p.sv, p.jb)));
              const lineCheckpoints = rawGrowth.map((pt, idx) => {
                const xPos = rawGrowth.length === 1 ? 200 : Math.round(25 + (idx * 350) / (rawGrowth.length - 1));
                const ySv = Math.round(130 - (pt.sv / maxLineVal) * 100);
                const yJb = Math.round(130 - (pt.jb / maxLineVal) * 100);
                return { label: pt.label, x: xPos, ySv, yJb, sv: pt.sv, jb: pt.jb };
              });

              // Dữ liệu cho Biểu đồ tròn (Donut Chart) từ Master Data Categories + Tin tuyển dụng
              const slicePalette = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];
              const realJobCats = categories.filter(c => c.type === 'job' || !c.type);
              const baseCats = realJobCats.length > 0
                ? realJobCats
                : [{ _id: 'default', name: 'Ngành nghề tuyển dụng' }];
              let matchedJobIds = new Set();
              const donutSlices = baseCats.map((cat, idx) => {
                const catJobs = filteredDashJobs.filter((j) => {
                  const byId = j.category_id && j.category_id === cat._id;
                  const byName = j.category_name && String(j.category_name).trim().toLowerCase() === String(cat.name).trim().toLowerCase();
                  if (byId || byName) {
                    matchedJobIds.add(j._id);
                    return true;
                  }
                  return false;
                });
                const histCatCnt = baseCats.length === 1
                  ? histJobs
                  : matchedHistBuckets.reduce((sum, b) => {
                      let slotSum = 0;
                      for (let k = idx; k < 6; k += baseCats.length) {
                        slotSum += (b.jobsBySlot[k] || 0);
                      }
                      return sum + slotSum;
                    }, 0);
                const cnt = histCatCnt + catJobs.length;
                const pct = jobCount > 0 ? Math.round((cnt / jobCount) * 100) : 0;
                return {
                  id: cat._id || `cat_${idx}`,
                  name: cat.name,
                  count: cnt,
                  pct,
                  color: slicePalette[idx % slicePalette.length]
                };
              });
              const unmatchedJobsCount = filteredDashJobs.filter(j => !matchedJobIds.has(j._id)).length;
              if (unmatchedJobsCount > 0) {
                donutSlices.push({
                  id: 'other_cats',
                  name: 'Ngành nghề khác',
                  count: unmatchedJobsCount,
                  pct: jobCount > 0 ? Math.max(1, Math.round((unmatchedJobsCount / jobCount) * 100)) : 0,
                  color: '#64748b'
                });
              }

              const syncYearMonthFromRange = (nextFrom, nextTo) => {
                if (!nextFrom && !nextTo) {
                  setFilterYear('');
                  setFilterMonth('');
                  return;
                }
                const fStr = nextFrom || nextTo;
                const tStr = nextTo || nextFrom;
                const fParts = fStr.split('-');
                const tParts = tStr.split('-');
                if (fParts.length === 3 && tParts.length === 3 && fParts[0] === tParts[0]) {
                  setFilterYear(fParts[0]);
                  if (fParts[1] === tParts[1]) {
                    setFilterMonth(String(Number(fParts[1])));
                  } else {
                    setFilterMonth('');
                  }
                } else {
                  setFilterYear('');
                  setFilterMonth('');
                }
              };

              const hasActiveDateFilter = Boolean(filterYear || filterMonth || filterFromDate || filterToDate || dashProvinceFilter || dashCategoryFilter);

              return (
                <>
                  {/* Header & Xuất báo cáo Excel */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-blue-600 shrink-0" />
                          <span>Dashboard Thống Kê & Báo Cáo Tăng Trưởng</span>
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Thống kê dữ liệu lịch sử 2024 - 2025 và đồng bộ số liệu thực tế năm 2026 từ cơ sở dữ liệu hệ thống
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleExportReport('excel')}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm transition-all whitespace-nowrap"
                        >
                          <Download className="w-4 h-4 shrink-0" />
                          <span>Xuất Báo Cáo Excel</span>
                        </button>
                      </div>
                    </div>

                    {/* BỘ LỌC TỐI ƯU: 1. CHỌN NĂM -> 2. CHỌN THÁNG -> CHỌN TRỰC TIẾP TỪ NGÀY - ĐẾN NGÀY -> 3. KHU VỰC & NGÀNH */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Filter className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Bộ lọc thống kê & phân tích đa chiều (Thời gian, Tỉnh/Thành, Ngành nghề):</span>
                        </span>
                        {hasActiveDateFilter && (
                          <button
                            type="button"
                            onClick={() => {
                              setFilterYear('');
                              setFilterMonth('');
                              setFilterFromDate('');
                              setFilterToDate('');
                              setDashProvinceFilter('');
                              setDashCategoryFilter('');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shadow-xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Xem tất cả dữ liệu</span>
                          </button>
                        )}
                      </div>

                      {/* 2 Cột: 1. Chọn Năm | 2. Chọn Tháng */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Bước 1: Chọn Năm */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">1. Chọn Năm</label>
                          <select
                            value={filterYear}
                            onChange={(e) => {
                              const yr = e.target.value;
                              setFilterYear(yr);
                              if (yr) {
                                const m = filterMonth || '';
                                if (m) {
                                  const pm = String(m).padStart(2, '0');
                                  const maxD = new Date(Number(yr), Number(m), 0).getDate();
                                  setFilterFromDate(`${yr}-${pm}-01`);
                                  setFilterToDate(`${yr}-${pm}-${String(maxD).padStart(2, '0')}`);
                                } else {
                                  setFilterFromDate(`${yr}-01-01`);
                                  setFilterToDate(`${yr}-12-31`);
                                }
                              } else {
                                setFilterMonth('');
                                setFilterFromDate('');
                                setFilterToDate('');
                              }
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 cursor-pointer shadow-xs"
                          >
                            <option value="">Tất cả các năm</option>
                            {availableYears.map((yr) => (
                              <option key={yr} value={String(yr)}>Năm {yr}</option>
                            ))}
                          </select>
                        </div>

                        {/* Bước 2: Chọn Tháng trong năm đã chọn */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">2. Chọn Tháng (trong năm đã chọn)</label>
                          <select
                            value={filterMonth}
                            disabled={!filterYear}
                            onChange={(e) => {
                              const m = e.target.value;
                              const targetYr = filterYear || '2026';
                              if (!filterYear && m) {
                                setFilterYear(targetYr);
                              }
                              setFilterMonth(m);
                              if (m) {
                                const pm = String(m).padStart(2, '0');
                                const maxD = new Date(Number(targetYr), Number(m), 0).getDate();
                                setFilterFromDate(`${targetYr}-${pm}-01`);
                                setFilterToDate(`${targetYr}-${pm}-${String(maxD).padStart(2, '0')}`);
                              } else if (filterYear) {
                                setFilterFromDate(`${filterYear}-01-01`);
                                setFilterToDate(`${filterYear}-12-31`);
                              } else {
                                setFilterFromDate('');
                                setFilterToDate('');
                              }
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 cursor-pointer shadow-xs disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                          >
                            <option value="">{filterYear ? `Cả năm ${filterYear}` : 'Vui lòng chọn năm trước'}</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                              <option key={m} value={String(m)}>
                                Tháng {m} {filterYear ? `/ ${filterYear}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Hàng chọn ngày trực tiếp: Từ ngày ... Đến ngày ... (đúng 100% như ảnh bộ lọc người dùng cung cấp) */}
                      <div className="pt-2.5 border-t border-slate-200 flex flex-wrap items-center gap-3 sm:gap-4">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 whitespace-nowrap">Từ ngày:</span>
                        <input
                          type="date"
                          min="2024-01-01"
                          max="2026-12-31"
                          value={filterFromDate}
                          onChange={(e) => {
                            const nextFrom = e.target.value;
                            const nextTo = (!filterToDate || (nextFrom && nextFrom > filterToDate))
                              ? nextFrom
                              : filterToDate;
                            setFilterFromDate(nextFrom);
                            if (nextTo !== filterToDate) setFilterToDate(nextTo);
                            syncYearMonthFromRange(nextFrom, nextTo);
                          }}
                          className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 shadow-xs cursor-pointer"
                        />

                        <span className="text-xs sm:text-sm font-bold text-slate-800 whitespace-nowrap sm:ml-2">Đến ngày:</span>
                        <input
                          type="date"
                          min={filterFromDate || '2024-01-01'}
                          max="2026-12-31"
                          value={filterToDate}
                          onChange={(e) => {
                            const nextTo = e.target.value;
                            const nextFrom = (!filterFromDate || (nextTo && nextTo < filterFromDate))
                              ? nextTo
                              : filterFromDate;
                            setFilterToDate(nextTo);
                            if (nextFrom !== filterFromDate) setFilterFromDate(nextFrom);
                            syncYearMonthFromRange(nextFrom, nextTo);
                          }}
                          className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 shadow-xs cursor-pointer"
                        />
                      </div>

                      {/* FR-QTV-03.07: Báo cáo phân bổ theo Tỉnh/Thành phố & Nhóm ngành Master Data */}
                      <div className="pt-2.5 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Khu vực Tỉnh / Thành phố (Toàn quốc):</span>
                          </label>
                          <select
                            value={dashProvinceFilter}
                            onChange={(e) => setDashProvinceFilter(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 shadow-xs cursor-pointer"
                          >
                            <option value="">Toàn quốc (Tất cả Tỉnh/Thành phố)</option>
                            {VIETNAM_PROVINCES.map((prov) => (
                              <option key={prov} value={prov}>
                                {prov}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-blue-600" />
                            <span>Tất cả nhóm ngành nghề (Master Data):</span>
                          </label>
                          <select
                            value={dashCategoryFilter}
                            onChange={(e) => setDashCategoryFilter(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 shadow-xs cursor-pointer"
                          >
                            <option value="">Tất cả nhóm ngành nghề</option>
                            {categories
                              .filter((cat) => {
                                const n = (cat.name || '').toLowerCase();
                                const isLoc = ['hồ chí minh', 'bình thạnh', 'gò vấp', 'quận', 'huyện', 'tp.', 'tỉnh'].some(l => n.includes(l));
                                const isUnwanted = n.includes('bảo hành') || n.includes('thời trang');
                                return !isLoc && !isUnwanted && (cat.type === 'job' || !cat.type);
                              })
                              .map((cat) => (
                                <option key={cat._id || cat.name} value={cat.name || cat._id}>
                                  {cat.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isPure2026 && !isFullYearRange && studentCount === 0 && jobCount === 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Khoảng thời gian này trong năm 2026 chưa có bản ghi mới trong CSDL. Bạn có thể chọn <strong>Tháng 11</strong> hoặc bấm nút để xem dữ liệu thực tế cả năm.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterMonth('');
                          setFilterFromDate('2026-01-01');
                          setFilterToDate('2026-12-31');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold whitespace-nowrap cursor-pointer transition-all shrink-0"
                      >
                        Xem Cả Năm 2026
                      </button>
                    </div>
                  )}

                  {/* 4 Thẻ chỉ số */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 space-y-2 shadow-sm hover:border-blue-400 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Tổng Số Sinh Viên</span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200 whitespace-nowrap shrink-0">{periodBadge}</span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {studentCount.toLocaleString('vi-VN')}
                      </p>
                      <p className="text-xs text-blue-700 font-semibold">Tài khoản @gmail.com đã xác thực</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 space-y-2 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Tổng Doanh Nghiệp</span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 whitespace-nowrap shrink-0">{periodBadge}</span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {employerCount.toLocaleString('vi-VN')}
                      </p>
                      <p className="text-xs text-emerald-700 font-semibold">{approvedEmployersCount.toLocaleString('vi-VN')}/{employerCount.toLocaleString('vi-VN')} doanh nghiệp đã duyệt GPKD</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 space-y-2 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Tin Tuyển Dụng</span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 font-bold border border-indigo-200 whitespace-nowrap shrink-0">{periodBadge}</span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {jobCount.toLocaleString('vi-VN')}
                      </p>
                      <p className="text-xs text-indigo-700 font-semibold">{activeJobCount.toLocaleString('vi-VN')} tin đang hiển thị công khai</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 space-y-2 shadow-sm hover:border-amber-400 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Đơn Ứng Tuyển</span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200 whitespace-nowrap shrink-0">{periodBadge}</span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {appCount.toLocaleString('vi-VN')}
                      </p>
                      <p className="text-xs text-amber-700 font-semibold">{acceptedAppCount.toLocaleString('vi-VN')} hồ sơ đã được tiếp nhận</p>
                    </div>
                  </div>

                  {/* 1. BIỂU ĐỒ CỘT (BAR CHART) */}
                  <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{chartTitle}</span>
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-700 font-semibold">Rê chuột vào cột để xem chi tiết:</span>
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200 whitespace-nowrap">
                          {dataSourceBadge}
                        </span>
                      </div>
                    </div>

                    {/* Khung thông tin cố định chiều cao chống giật */}
                    <div className="h-12 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs overflow-hidden">
                      {hoveredBar ? (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0 truncate">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                            <span className="text-slate-800 font-bold whitespace-nowrap">{hoveredBar.label}:</span>
                            <span className="text-slate-950 font-black text-sm whitespace-nowrap">{hoveredBar.val.toLocaleString('vi-VN')} bản ghi</span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 whitespace-nowrap shrink-0">
                            {dataSourceBadge}
                          </span>
                        </>
                      ) : (
                        <div className="text-slate-600 italic text-xs flex items-center gap-2 truncate">
                          <Activity className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span className="truncate">Rê chuột lên cột bất kỳ trên biểu đồ để xem số lượng chi tiết</span>
                        </div>
                      )}
                    </div>

                    <div className={`grid ${bars.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'} gap-4 pt-4 pb-2 items-end h-56 border-b border-slate-200`}>
                      {bars.map((bar, idx) => {
                        const pct = bar.val > 0 ? Math.round((bar.val / chartMax) * 100) : 0;
                        const isHovered = hoveredBar?.idx === idx;
                        return (
                          <div 
                            key={idx} 
                            onMouseEnter={() => setHoveredBar({ idx, label: bar.label, val: bar.val, pct })}
                            onMouseLeave={() => setHoveredBar(null)}
                            className="flex flex-col items-center gap-2 h-full justify-end group cursor-pointer relative"
                          >
                            <span className={`text-xs font-mono font-bold transition-all px-2.5 py-0.5 rounded-lg whitespace-nowrap ${
                              isHovered 
                                ? 'bg-blue-600 text-white font-black shadow-md' 
                                : 'text-slate-800 bg-slate-100'
                            }`}>
                              {bar.val.toLocaleString('vi-VN')}
                            </span>
                            
                            <div 
                              className={`w-full max-w-[52px] rounded-t-xl transition-colors duration-200 shadow-sm relative ${
                                isHovered 
                                  ? 'bg-gradient-to-t from-blue-700 via-blue-600 to-sky-400 ring-2 ring-blue-300' 
                                  : 'bg-gradient-to-t from-blue-600 via-sky-500 to-cyan-400'
                              }`}
                              style={{ height: `${bar.val === 0 ? 8 : Math.min(100, Math.max(16, pct))}%` }}
                            ></div>
                            <span className={`text-xs font-bold transition-colors whitespace-nowrap ${
                              isHovered ? 'text-blue-700 font-black' : 'text-slate-700'
                            }`}>
                              {bar.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. BIỂU ĐỒ ĐƯỜNG (LINE CHART) VÀ BIỂU ĐỒ TRÒN (DONUT CHART) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* BIỂU ĐỒ ĐƯỜNG (ĐÃ TRIỆT TIÊU HIỆN TƯỢNG GIẬT KHI RÊ CHUỘT) */}
                    <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Xu Hướng Tăng Trưởng (Line Chart)</span>
                        </h4>
                        <div className="flex items-center gap-3 text-xs whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-blue-700 font-bold">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Sinh viên
                          </span>
                          <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Việc làm
                          </span>
                        </div>
                      </div>

                      {/* Khung Tooltip khóa cứng chiều cao h-12 & overflow-hidden để tuyệt đối không giật bảng */}
                      <div className="h-12 px-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs overflow-hidden">
                        {hoveredLinePoint ? (
                          <>
                            <span className="font-bold text-slate-900 flex items-center gap-1.5 whitespace-nowrap shrink-0">
                              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{hoveredLinePoint.label}</span>
                            </span>
                            <div className="flex items-center gap-2.5 font-mono whitespace-nowrap overflow-hidden">
                              <span className="text-blue-700 font-bold">Sinh viên: {hoveredLinePoint.svVal.toLocaleString('vi-VN')}</span>
                              <span className="text-emerald-700 font-bold">Việc làm: {hoveredLinePoint.jobVal.toLocaleString('vi-VN')}</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-600 italic text-xs flex items-center gap-2 truncate">
                            <span className="truncate">Rê chuột vào biểu đồ đường để xem tương quan Sinh viên / Việc làm thực tế</span>
                          </div>
                        )}
                      </div>

                      <div className="h-48 w-full pt-2 flex items-center justify-center">
                        <svg
                          viewBox="0 0 400 150"
                          className="w-full h-full select-none"
                          onMouseLeave={() => setHoveredLinePoint(null)}
                        >
                          <defs>
                            <linearGradient id="lineGradBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#2563eb" />
                              <stop offset="100%" stopColor="#0284c7" />
                            </linearGradient>
                            <linearGradient id="lineGradGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#059669" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                          </defs>
                          <line x1="0" y1="30" x2="400" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" pointerEvents="none" />
                          <line x1="0" y1="80" x2="400" y2="80" stroke="#e2e8f0" strokeDasharray="3 3" pointerEvents="none" />
                          <line x1="0" y1="130" x2="400" y2="130" stroke="#e2e8f0" strokeDasharray="3 3" pointerEvents="none" />

                          {hoveredLinePoint && lineCheckpoints[hoveredLinePoint.idx] && (
                            <line 
                              x1={lineCheckpoints[hoveredLinePoint.idx].x} 
                              y1="15" 
                              x2={lineCheckpoints[hoveredLinePoint.idx].x} 
                              y2="138" 
                              stroke="#2563eb" 
                              strokeDasharray="3 3" 
                              strokeWidth="1.5"
                              pointerEvents="none"
                            />
                          )}

                          <polyline
                            fill="none"
                            stroke="url(#lineGradBlue)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={lineCheckpoints.map(p => `${p.x},${p.ySv}`).join(' ')}
                            pointerEvents="none"
                          />
                          <polyline
                            fill="none"
                            stroke="url(#lineGradGreen)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={lineCheckpoints.map(p => `${p.x},${p.yJb}`).join(' ')}
                            pointerEvents="none"
                          />

                          {lineCheckpoints.map((p, i) => {
                            const isPtHovered = hoveredLinePoint?.idx === i;
                            const colWidth = 400 / Math.max(1, lineCheckpoints.length);
                            const colX = Math.max(0, p.x - colWidth / 2);
                            return (
                              <g key={`pt_${i}`}>
                                <circle 
                                  cx={p.x} 
                                  cy={p.ySv} 
                                  r={isPtHovered ? 6 : 4} 
                                  fill={isPtHovered ? '#ffffff' : '#2563eb'} 
                                  stroke={isPtHovered ? '#1d4ed8' : '#0f172a'} 
                                  strokeWidth={isPtHovered ? 3 : 2}
                                  pointerEvents="none"
                                />
                                <circle 
                                  cx={p.x} 
                                  cy={p.yJb} 
                                  r={isPtHovered ? 6 : 4} 
                                  fill={isPtHovered ? '#ffffff' : '#059669'} 
                                  stroke={isPtHovered ? '#047857' : '#0f172a'} 
                                  strokeWidth={isPtHovered ? 3 : 2}
                                  pointerEvents="none"
                                />
                                {/* Cột vùng bắt chuột liền mạch suốt chiều cao SVG chống nhấp nháy tuyệt đối */}
                                <rect
                                  x={colX}
                                  y="0"
                                  width={colWidth}
                                  height="150"
                                  fill="transparent"
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredLinePoint({ idx: i, label: p.label, svVal: p.sv, jobVal: p.jb })}
                                />
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      <div className="flex justify-between gap-1 text-xs text-slate-600 font-mono pt-2 border-t border-slate-200">
                        {lineCheckpoints.map((pt, idx) => (
                          <span 
                            key={idx} 
                            onMouseEnter={() => setHoveredLinePoint({ idx, label: pt.label, svVal: pt.sv, jobVal: pt.jb })}
                            className={`cursor-pointer transition-colors whitespace-nowrap ${
                              hoveredLinePoint?.idx === idx ? 'text-blue-700 font-bold' : 'hover:text-slate-900'
                            }`}
                          >
                            {pt.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* BIỂU ĐỒ TRÒN (DONUT CHART - CHỮ ĐEN RÕ NÉT KHI HOVER, KHÔNG GÃY DÒNG) */}
                    <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Cơ Cấu Ngành Nghề (Donut Chart)</span>
                        </h4>
                        <span className="text-xs text-slate-700 font-bold font-mono whitespace-nowrap">Tổng: {jobCount} tin việc làm</span>
                      </div>

                      <div className="h-12 px-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs overflow-hidden">
                        {hoveredDonutSlice ? (
                          <>
                            <div className="flex items-center gap-2 min-w-0 truncate">
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: hoveredDonutSlice.color }}></span>
                              <span className="font-bold text-slate-900 truncate">{hoveredDonutSlice.name}:</span>
                            </div>
                            <span className="font-black text-blue-700 font-mono whitespace-nowrap shrink-0">
                              {hoveredDonutSlice.count} tin ({hoveredDonutSlice.pct}%)
                            </span>
                          </>
                        ) : (
                          <div className="text-slate-600 italic text-xs flex items-center gap-2 truncate">
                            <span className="truncate">Rê chuột vào lát cắt hoặc tên danh mục để xem tỷ trọng việc làm</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
                        {/* SVG Donut */}
                        <div className="relative w-36 h-36 sm:w-40 sm:h-40 shrink-0 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="14" />
                            {(() => {
                              const circumference = 2 * Math.PI * 38;
                              let accumulated = 0;
                              return donutSlices.filter(s => s.count > 0).map((slice) => {
                                const segLen = (slice.count / Math.max(1, jobCount)) * circumference;
                                const offset = -accumulated;
                                accumulated += segLen;
                                const isActiveSlice = hoveredDonutSlice?.id === slice.id;
                                return (
                                  <circle
                                    key={slice.id}
                                    cx="50"
                                    cy="50"
                                    r="38"
                                    fill="none"
                                    stroke={slice.color}
                                    strokeWidth={isActiveSlice ? 17 : 14}
                                    strokeDasharray={`${segLen} ${circumference}`}
                                    strokeDashoffset={offset}
                                    className="cursor-pointer transition-all duration-200"
                                    onMouseEnter={() => setHoveredDonutSlice(slice)}
                                    onMouseLeave={() => setHoveredDonutSlice(null)}
                                  />
                                );
                              });
                            })()}
                          </svg>

                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
                            {hoveredDonutSlice ? (
                              <>
                                <span className="text-base font-black text-slate-900 whitespace-nowrap">{hoveredDonutSlice.pct}%</span>
                                <span className="text-xs font-bold text-blue-700 whitespace-nowrap">
                                  {hoveredDonutSlice.count} tin
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-xs font-black text-slate-900 whitespace-nowrap">{donutSlices.length} Nhóm</span>
                                <span className="text-xs text-slate-600 whitespace-nowrap">Ngành nghề</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Danh mục ngành nghề bên cạnh: Chữ đen đậm khi hover, không xuống dòng xấu */}
                        <div className="space-y-1.5 text-xs flex-1 min-w-0 w-full">
                          {donutSlices.map((slice) => {
                            const isSliceHovered = hoveredDonutSlice?.id === slice.id;
                            return (
                              <div 
                                key={slice.id} 
                                onMouseEnter={() => setHoveredDonutSlice(slice)}
                                onMouseLeave={() => setHoveredDonutSlice(null)}
                                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer border ${
                                  isSliceHovered 
                                    ? 'bg-blue-50 border-blue-300 shadow-xs' 
                                    : 'bg-transparent border-transparent hover:bg-slate-50'
                                }`}
                              >
                                <span className={`flex items-center gap-2 min-w-0 ${
                                  isSliceHovered ? 'text-slate-950 font-black' : 'text-slate-800 font-semibold'
                                }`}>
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                                  <span className="truncate">{slice.name}</span>
                                </span>
                                <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                                  <span className={`text-xs font-mono whitespace-nowrap ${isSliceHovered ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                                    ({slice.count} tin)
                                  </span>
                                  <strong className="font-mono font-bold whitespace-nowrap" style={{ color: slice.color }}>
                                    {slice.pct}%
                                  </strong>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* 3. MÀN HÌNH QUẢN LÝ & PHÊ DUYỆT NGƯỜI DÙNG */}
        {activeMenu === 'users' && (
          <div className="w-full max-w-full mx-auto space-y-8">
            
            {/* Thanh tìm kiếm & lọc */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>Quản Lý & Phê Duyệt Người Dùng ({filteredUsers.length}/{nonAdminUsers.length} tài khoản)</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">Kiểm soát tài khoản Sinh viên, Doanh nghiệp (@gmail.com) và duyệt GPKD</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="relative min-w-0">
                  <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Tìm theo ID, Email..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-base sm:text-sm text-slate-900 outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>

                <div className="min-w-0">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="w-full min-w-0 truncate bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-base sm:text-sm text-slate-900 outline-none cursor-pointer shadow-sm"
                  >
                    <option value="">Tất cả vai trò</option>
                    <option value="student">Sinh viên</option>
                    <option value="employer">Nhà tuyển dụng</option>
                  </select>
                </div>

                <div className="min-w-0">
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="w-full min-w-0 truncate bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-base sm:text-sm text-slate-900 outline-none cursor-pointer shadow-sm"
                  >
                    <option value="">Tất cả trạng thái tài khoản</option>
                    <option value="active">Đang hoạt động bình thường</option>
                    <option value="banned">Bị khóa tài khoản</option>
                  </select>
                </div>
              </div>

              {/* FR-QTV-04.10: Bộ lọc nâng cao Người dùng (Trường ĐH, Mức độ rủi ro, Tình trạng hồ sơ) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div className="min-w-0 relative">
                  <input
                    type="text"
                    list="admin-uni-branch-suggestions"
                    value={userUniFilter === 'all' ? '' : userUniFilter}
                    onChange={(e) => setUserUniFilter(e.target.value || 'all')}
                    placeholder="Tất cả các trường đại học / chi nhánh..."
                    className="w-full min-w-0 truncate bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 outline-none shadow-xs focus:border-blue-600"
                  />
                  <datalist id="admin-uni-branch-suggestions">
                    {Array.from(new Set([
                      ...nonAdminUsers.map(u => u.profile?.university || u.student_profile?.university || u.university || ''),
                      ...nonAdminUsers.map(u => u.profile?.branch_name || u.employer_profile?.branch_name || u.branch_name || ''),
                      ...nonAdminUsers.map(u => u.profile?.company_name || u.company_name || '')
                    ])).filter(Boolean).sort().map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>

                <div className="min-w-0">
                  <select
                    value={userRiskFilter}
                    onChange={(e) => setUserRiskFilter(e.target.value)}
                    className="w-full min-w-0 truncate bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 outline-none cursor-pointer shadow-xs"
                  >
                    <option value="all">Tất cả mức độ rủi ro</option>
                    <option value="high_risk">Tài khoản có &gt;= 1 lần bị report</option>
                    <option value="complaints">Tài khoản có &gt;= 3 lần bị khiếu nại (đưa vào diện giám sát khẩn cấp)</option>
                    <option value="safe">An toàn / Chưa vi phạm</option>
                  </select>
                </div>

                <div className="min-w-0">
                  <select
                    value={userIdentityFilter}
                    onChange={(e) => setUserIdentityFilter(e.target.value)}
                    className="w-full min-w-0 truncate bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 outline-none cursor-pointer shadow-xs"
                  >
                    <option value="all">Tất cả tình trạng định danh</option>
                    <option value="verified_otp">Đã xác thực OTP Email</option>
                    <option value="has_gpkd">Đã có file GPKD nhị phân thật</option>
                    <option value="incomplete">Tài khoản ảo chưa cập nhật thông tin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bảng danh sách người dùng */}
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/90 text-slate-800 border-b border-slate-200 uppercase font-bold text-xs sm:text-sm tracking-wider">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">Email / ID</th>
                      <th className="px-6 py-4 whitespace-nowrap">Họ Tên / Doanh Nghiệp</th>
                      <th className="px-6 py-4 whitespace-nowrap">Vai Trò</th>
                      <th className="px-6 py-4 whitespace-nowrap">Trạng Thái GPKD (NTD)</th>
                      <th className="px-6 py-4 whitespace-nowrap">Trạng Thái Khóa</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedUsers.map((u) => {
                      const isEmp = u.role === 'employer';
                      const empApproval = u.employer_record?.approval_status || u.approval_status || 'pending';

                      return (
                        <tr
                          key={u._id}
                          onClick={() => setSelectedUserDetail(u)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900 text-base hover:text-blue-600">{u.email}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{u._id}</p>
                          </td>

                          <td className="px-6 py-4">
                            {isEmp ? (
                              <div>
                                <p className="font-bold text-slate-900">{u.profile?.company_name || u.company_name || 'Doanh nghiệp'}</p>
                                <p className="text-xs text-slate-600">{u.profile?.representative_name || u.representative_name || 'Người đại diện'}</p>
                              </div>
                            ) : (
                              <div>
                                <p className="font-bold text-slate-900">{u.profile?.full_name || u.full_name || 'Sinh viên'}</p>
                                <p className="text-xs text-slate-600">{u.profile?.university || ''}</p>
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                              u.role === 'employer' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                            }`}>
                              {u.role === 'employer' ? 'Nhà Tuyển Dụng' : 'Sinh Viên'}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEmp ? (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                                empApproval === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : (empApproval === 'rejected' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-100 text-amber-800 border-amber-200')
                              }`}>
                                {empApproval === 'approved' ? 'Đã duyệt GPKD' : (empApproval === 'rejected' ? 'Bị từ chối GPKD' : 'Chờ duyệt GPKD')}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs font-medium">Không áp dụng</span>
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                              u.is_banned ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}>
                              {u.is_banned ? 'Bị khóa tài khoản' : 'Đang hoạt động bình thường'}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              {u.is_banned ? (
                                <button
                                  type="button"
                                  onClick={() => handleUnbanUser(u._id)}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                                  title="Mở khóa tài khoản"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                  <span>Mở Khóa</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBanModalUser(u);
                                    setBanReason('');
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                                  title="Khóa tài khoản vi phạm"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Khóa</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteUserAccount(u)}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                                title="Xóa vĩnh viễn tài khoản người dùng"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phân trang 15 dòng */}
              {totalUserPages > 1 && (
                <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Trang {userPage} / {totalUserPages}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={userPage === 1}
                      onClick={() => setUserPage(p => Math.max(1, p - 1))}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold transition-all disabled:opacity-40 cursor-pointer"
                    >
                      Trước
                    </button>
                    <button
                      type="button"
                      disabled={userPage === totalUserPages}
                      onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold transition-all disabled:opacity-40 cursor-pointer"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 4. MÀN HÌNH QUẢN LÝ TIN TUYỂN DỤNG TOÀN HỆ THỐNG */}
        {activeMenu === 'jobs' && (
          <div className="w-full max-w-full mx-auto space-y-8">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <span>Quản Lý Tin Tuyển Dụng Toàn Hệ Thống</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">Kiểm duyệt, ẩn tin vi phạm hoặc xóa cứng tin chưa có người nộp</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
                <div className="relative sm:col-span-4 min-w-0">
                  <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    placeholder="Tìm tên công ty, tiêu đề..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-base sm:text-sm text-slate-900 outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>

                <div className="sm:col-span-3 min-w-0">
                  <select
                    value={jobStatusFilter}
                    onChange={(e) => setJobStatusFilter(e.target.value)}
                    className="w-full min-w-0 truncate bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-base sm:text-sm text-slate-900 outline-none cursor-pointer shadow-sm"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="open">Đang tuyển</option>
                    <option value="closed">Tạm đóng</option>
                    <option value="filled">Đã nhận người</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="hidden">Bị ẩn do vi phạm</option>
                  </select>
                </div>

                {/* FR-QTV-05.07: Bộ lọc Tin vi phạm */}
                <div className="sm:col-span-5 min-w-0">
                  <select
                    value={jobViolationFilter}
                    onChange={(e) => setJobViolationFilter(e.target.value)}
                    className="w-full min-w-0 truncate bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-base sm:text-sm text-slate-900 outline-none cursor-pointer shadow-sm"
                  >
                    <option value="all">Tất cả tin tuyển dụng</option>
                    <option value="under_min_wage">Tin có mức lương &lt; Lương tối thiểu vùng (&lt; 20.000đ/h)</option>
                    <option value="over_8h">Tin yêu cầu ca làm kéo dài bất thường (&gt; 8 tiếng/ngày)</option>
                    <option value="scam_keywords">Tin quét dính Từ khóa nhạy cảm thu phí cọc / giữ chân</option>
                    <option value="high_reports">Tin có &gt;= 2 lượt phản ánh vi phạm từ sinh viên</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bảng tin toàn hệ thống */}
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/90 text-slate-800 border-b border-slate-200 uppercase font-bold text-xs sm:text-sm tracking-wider">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">Tiêu Đề Công Việc</th>
                      <th className="px-6 py-4 whitespace-nowrap">Doanh Nghiệp</th>
                      <th className="px-6 py-4 whitespace-nowrap">Mức Lương</th>
                      <th className="px-6 py-4 whitespace-nowrap">Trạng Thái Vận Hành</th>
                      <th className="px-6 py-4 whitespace-nowrap">Trạng Thái Kiểm Duyệt</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                          Chưa có tin tuyển dụng thực tế nào khớp điều kiện tìm kiếm.
                        </td>
                      </tr>
                    ) : filteredJobs.map((job) => (
                      <tr 
                        key={job._id}
                        onClick={() => setSelectedJobDetail(job)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 text-base hover:text-blue-600">{job.title}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{job._id}</p>
                        </td>

                        <td className="px-6 py-4 font-semibold text-emerald-700 whitespace-nowrap">
                          {job.company_name}
                        </td>

                        <td className="px-6 py-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {job.is_negotiable ? 'Thỏa thuận' : `${job.salary_min?.toLocaleString()}đ - ${job.salary_max?.toLocaleString()}đ`}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const normSt = normalizeJobStatus(job);
                            return (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                                normSt === 'open'
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : (normSt === 'filled'
                                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                                    : (normSt === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-300'))
                              }`}>
                                {normSt === 'open' ? 'Đang tuyển' : (normSt === 'filled' ? 'Đã nhận người' : (normSt === 'completed' ? 'Hoàn thành' : 'Tạm đóng'))}
                              </span>
                            );
                          })()}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                            job.is_hidden 
                              ? 'bg-rose-100 text-rose-800 border-rose-200' 
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}>
                            {job.is_hidden ? 'Đã Ẩn (Vi phạm)' : 'Công Khai'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {job.is_hidden ? (
                              <button
                                type="button"
                                onClick={() => handleUnhideJob(job._id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                                title="Bỏ ẩn tin"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Hiện</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setHideJobModal(job);
                                  setHideReason('');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-300 hover:border-amber-300 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                                title="Ẩn tin vi phạm"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Ẩn</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteJobAdmin(job._id)}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-900 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                              title="Xóa vĩnh viễn tin chưa có đơn"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 5. MÀN HÌNH QUẢN LÝ ĐÁNH GIÁ CHÉO */}
        {activeMenu === 'reviews' && (
          <div className="w-full max-w-full mx-auto space-y-8">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                  <span>Quản Lý Đánh Giá Chéo</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">Kiểm duyệt các bài đánh giá của Sinh viên & Doanh nghiệp</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                <div className="relative min-w-0">
                  <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    placeholder="Tìm tên hoặc nội dung..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-base sm:text-sm text-slate-900 outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>

                <div className="min-w-0">
                  <select
                    value={reviewStatusFilter}
                    onChange={(e) => setReviewStatusFilter(e.target.value)}
                    className="w-full min-w-0 truncate bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-base sm:text-sm text-slate-900 outline-none cursor-pointer shadow-sm"
                  >
                    <option value="all">Tất cả đánh giá</option>
                    <option value="public">Đang hiển thị công khai</option>
                    <option value="hidden">Bị ẩn do vi phạm</option>
                  </select>
                </div>

                {/* FR-QTV-06.07: Chiều tương tác 2 chiều */}
                <div className="min-w-0">
                  <select
                    value={reviewDirectionFilter}
                    onChange={(e) => setReviewDirectionFilter(e.target.value)}
                    className="w-full min-w-0 truncate bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-base sm:text-sm text-slate-900 outline-none cursor-pointer shadow-sm"
                  >
                    <option value="all">Tất cả chiều tương tác</option>
                    <option value="stu_to_emp">Sinh viên đánh giá Doanh nghiệp</option>
                    <option value="emp_to_stu">Doanh nghiệp đánh giá Sinh viên</option>
                  </select>
                </div>

                {/* FR-QTV-06.07: Lọc theo số sao tiêu cực */}
                <div className="min-w-0">
                  <select
                    value={reviewStarsFilter}
                    onChange={(e) => setReviewStarsFilter(e.target.value)}
                    className="w-full min-w-0 truncate bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-base sm:text-sm text-slate-900 outline-none cursor-pointer shadow-sm"
                  >
                    <option value="all">Tất cả số sao</option>
                    <option value="negative">Đánh giá tiêu cực (1 - 2 sao)</option>
                    <option value="neutral">Trung bình (3 sao)</option>
                    <option value="positive">Tích cực (4 - 5 sao)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bảng Reviews */}
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/90 text-slate-800 border-b border-slate-200 uppercase font-bold text-xs sm:text-sm tracking-wider">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">Người Đánh Giá</th>
                      <th className="px-6 py-4 whitespace-nowrap">Điểm Sao</th>
                      <th className="px-6 py-4">Nội Dung Nhận Xét</th>
                      <th className="px-6 py-4 whitespace-nowrap">Trạng Thái</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredReviews.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                          Chưa có bài đánh giá nào trong danh mục này.
                        </td>
                      </tr>
                    ) : filteredReviews.map((rev) => (
                      <tr 
                        key={rev._id}
                        onClick={() => setSelectedReviewDetail(rev)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 text-sm whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{rev.reviewer_name || 'Người đánh giá'}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                              rev.direction === 'employer_to_student' || rev.reviewer_role === 'employer'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {rev.direction === 'employer_to_student' || rev.reviewer_role === 'employer' ? 'NTD → SV' : 'SV → NTD'}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                            ))}
                            <span className="ml-1.5 text-xs font-bold text-slate-800">({rev.rating})</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-700 max-w-md truncate">
                          "{rev.comment}"
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                            rev.is_hidden ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}>
                            {rev.is_hidden ? 'Bị ẩn do vi phạm tiêu chuẩn cộng đồng' : 'Đang hiển thị công khai'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleHideReview(rev._id)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs ${
                                rev.is_hidden ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
                              }`}
                              title="Ẩn / Hiện đánh giá"
                            >
                              {rev.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              <span>{rev.is_hidden ? 'Hiện' : 'Ẩn'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteReview(rev._id)}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-900 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                              title="Xóa đánh giá vi phạm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 6. MÀN HÌNH QUẢN LÝ DANH MỤC GỐC - MASTER DATA (ĐỒNG BỘ SỐ LIỆU THẬT) */}
        {activeMenu === 'categories' && (
          <div className="w-full max-w-full mx-auto space-y-6">
            
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  <span>Quản Lý Danh Mục Gốc (Master Data) — Tổng: {categories.length} danh mục</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">Thiết lập dữ liệu danh mục Ngành nghề & Địa điểm làm việc thực tế trên hệ thống</p>
              </div>

              {/* 3 Tabs đồng bộ chính xác với tổng số lượng thực tế */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setCategoryTab('all')}
                  className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                    categoryTab === 'all' ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  Tất Cả ({categories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryTab('job')}
                  className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                    categoryTab === 'job' ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  Ngành Nghề ({categories.filter(c => c.type !== 'location').length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryTab('location')}
                  className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                    categoryTab === 'location' ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  Địa Điểm ({categories.filter(c => c.type === 'location').length})
                </button>
              </div>
            </div>

            {/* Ô tìm kiếm danh mục */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Tìm kiếm danh mục theo tên..."
                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 shadow-sm"
              />
            </div>

            {/* Form thêm danh mục mới */}
            <form onSubmit={handleAddCategory} className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shadow-sm">
              {categoryTab === 'all' && (
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 cursor-pointer shrink-0"
                >
                  <option value="job">Loại: Ngành Nghề</option>
                  <option value="location">Loại: Địa Điểm</option>
                </select>
              )}
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder={`Nhập tên ${(categoryTab === 'location' || (categoryTab === 'all' && newCatType === 'location')) ? 'địa điểm mới' : 'ngành nghề mới'} và nhấn Enter...`}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-sm shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Danh Mục</span>
              </button>
            </form>

            {/* Bảng danh sách danh mục */}
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/90 text-slate-800 border-b border-slate-200 uppercase font-bold text-xs sm:text-sm tracking-wider">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">STT</th>
                      <th className="px-6 py-4">Tên Danh Mục</th>
                      <th className="px-6 py-4 whitespace-nowrap">Loại Danh Mục</th>
                      <th className="px-6 py-4 whitespace-nowrap">Trạng Thái Hiển Thị</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(() => {
                      const visibleCats = categories
                        .filter(c => categoryTab === 'all' ? true : (categoryTab === 'job' ? c.type !== 'location' : c.type === 'location'))
                        .filter(c => matchKeywordFlexible(c, categorySearch, ['name', 'type']));

                      if (visibleCats.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-sm">
                              Chưa có danh mục nào trong phân nhóm này.
                            </td>
                          </tr>
                        );
                      }

                      return visibleCats.map((cat, idx) => (
                        <tr key={cat._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-600 whitespace-nowrap">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4">
                            {editingCatId === cat._id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingCatName}
                                  onChange={(e) => setEditingCatName(e.target.value)}
                                  className="bg-white border border-blue-500 rounded-lg px-3 py-1.5 text-sm text-slate-900 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCategoryInline(cat._id)}
                                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer whitespace-nowrap"
                                >
                                  Lưu
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCatId(null)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs cursor-pointer whitespace-nowrap"
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-base">{cat.name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCatId(cat._id);
                                    setEditingCatName(cat.name);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer transition-colors"
                                  title="Chỉnh sửa tên danh mục"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4 text-slate-700 font-semibold whitespace-nowrap">
                            {cat.type === 'location' ? 'Địa Điểm' : 'Ngành Nghề'}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleCategoryActive(cat)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                                cat.is_active ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {cat.is_active ? 'Đang Áp Dụng' : 'Tạm Ẩn'}
                            </button>
                          </td>

                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat._id)}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-900 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                              title="Xóa danh mục"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 7. MÀN HÌNH QUẢN LÝ BÁO CÁO VI PHẠM */}
        {activeMenu === 'reports' && (
          <div className="w-full max-w-full mx-auto space-y-8">
            
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <span>Quản Lý Báo Cáo Vi Phạm — Tổng: {reports.length} phiếu</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">Tiếp nhận và xử lý đơn khiếu nại từ Sinh viên và Doanh nghiệp</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100 items-center">
                <div className="relative sm:col-span-4 min-w-0">
                  <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="Tìm mã phiếu hoặc lý do..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>

                <div className="sm:col-span-5 min-w-0 overflow-x-auto">
                  <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs w-max min-w-full">
                    <button
                      type="button"
                      onClick={() => setTicketTab('all')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                        ticketTab === 'all' ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      Tất Cả ({reports.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTicketTab('job')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                        ticketTab === 'job' ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      Tin Tuyển Dụng ({reports.filter(r => (r.type || r.report_type) === 'job').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTicketTab('applicant')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                        ticketTab === 'applicant' ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      Ứng Viên ({reports.filter(r => (r.type || r.report_type) === 'applicant').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTicketTab('chat')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                        ticketTab === 'chat' ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      Hội Thoại ({reports.filter(r => (r.type || r.report_type) === 'chat').length})
                    </button>
                  </div>
                </div>

                {/* FR-QTV-08.02: Bộ lọc 4 trạng thái chuẩn hóa */}
                <div className="sm:col-span-3 min-w-0">
                  <select
                    value={ticketStatusFilter}
                    onChange={(e) => setTicketStatusFilter(e.target.value)}
                    className="w-full min-w-0 truncate bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 outline-none cursor-pointer shadow-sm"
                  >
                    <option value="all">Tất cả trạng thái khiếu nại</option>
                    <option value="pending">Chờ tiếp nhận xử lý</option>
                    <option value="investigating">Đang điều tra xác minh</option>
                    <option value="resolved">Đã xử lý thỏa đáng</option>
                    <option value="dismissed">Bị bác bỏ do không căn cứ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Danh sách Báo cáo */}
            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-sm text-slate-600 shadow-xs">
                  Hiện không có báo cáo vi phạm nào trong danh mục này.
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setTicketStatusSelect(ticket.status || 'pending');
                      setTicketNote(ticket.admin_note || '');
                    }}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-mono font-bold text-xs whitespace-nowrap">
                          {ticket.ticket_code || ticket._id}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{ticket.target_title}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap ${
                          ticket.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : (ticket.status === 'investigating'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : (ticket.status === 'dismissed'
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'))
                        }`}>
                          {ticket.status === 'resolved'
                            ? 'Đã xử lý thỏa đáng'
                            : (ticket.status === 'investigating'
                              ? 'Đang điều tra xác minh'
                              : (ticket.status === 'dismissed' ? 'Bị bác bỏ do không căn cứ' : 'Chờ tiếp nhận xử lý'))}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800">
                        <strong>Lý do:</strong> {ticket.reason}
                      </p>
                      <p className="text-xs text-slate-600">
                        Người gửi: <strong className="text-slate-800">{ticket.reporter_name}</strong> • Ngày gửi: {ticket.created_at}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {(ticket.type === 'chat' || ticket.report_type === 'chat') && (
                        <button
                          type="button"
                          onClick={() => handleViewTicketChatHistory(ticket)}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 cursor-pointer inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem Chat Gốc</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setTicketStatusSelect(ticket.status || 'pending');
                          setTicketNote(ticket.admin_note || '');
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Xem chi tiết</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteReport(ticket)}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-900 text-xs font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                        title="Xóa báo cáo vi phạm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* 8. MÀN HÌNH CÀI ĐẶT BỘ LỌC TỪ KHÓA CẤM */}
        {activeMenu === 'keywords' && (
          <div className="w-full max-w-full mx-auto space-y-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>Cài Đặt Bộ Lọc Từ Khóa Cấm Toàn Hệ Thống</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Các từ ngữ trong danh sách này sẽ được tự động che thành *** trên toàn bộ tin nhắn trò chuyện giữa Sinh viên và Nhà tuyển dụng.
                </p>
              </div>

              <form onSubmit={handleSaveKeywords} className="space-y-4">
                <div>
                  <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">
                    Danh Sách Từ Khóa Cấm / Lừa Đảo (Phân tách bằng dấu phẩy) *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={keywordsText}
                    onChange={(e) => setKeywordsText(e.target.value)}
                    placeholder="đặt cọc, nạp tiền, hoa hồng khủng, telegram, chuyển khoản trước, cờ bạc..."
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-900 outline-none focus:border-blue-500 leading-relaxed font-mono"
                  />
                </div>

                {keywordSaveMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{keywordSaveMsg}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu & Áp Dụng Bộ Lọc Ngay</span>
                  </button>
                </div>
              </form>

              {/* BẢNG THỐNG KÊ TỪ KHÓA CẤM ĐANG ÁP DỤNG TRONG CSDL */}
              <div className="pt-6 border-t border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Bảng Thống Kê Từ Khóa Cấm Đang Hoạt Động ({bannedKeywords.length})</span>
                  </h4>
                  <span className="text-xs text-slate-600">Tự động chặn & ẩn ký tự trên hệ thống Chat</span>
                </div>

                {bannedKeywords.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
                    Chưa có từ khóa cấm nào trong cơ sở dữ liệu. Vui lòng nhập từ khóa ở khung phía trên và nhấn lưu.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-800 font-bold uppercase text-sm tracking-wider">
                          <tr>
                            <th className="py-3.5 px-4 whitespace-nowrap min-w-[70px] text-center">STT</th>
                            <th className="py-3.5 px-4 min-w-[200px]">Từ Khóa / Cụm Từ Cấm</th>
                            <th className="py-3.5 px-4 whitespace-nowrap min-w-[170px]">Mức Độ Cảnh Báo</th>
                            <th className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">Ngày Cập Nhật</th>
                            <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {bannedKeywords.map((item, idx) => (
                            <tr key={item._id || idx} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3.5 px-4 text-center font-mono text-slate-500 font-bold whitespace-nowrap">
                                {idx + 1}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold">
                                {editingKwId === item._id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editingKwText}
                                      onChange={(e) => setEditingKwText(e.target.value)}
                                      className="bg-white border border-blue-500 rounded-lg px-3 py-1.5 text-sm text-slate-900 outline-none font-mono"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBannedKeyword(item._id)}
                                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer whitespace-nowrap"
                                    >
                                      Lưu
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingKwId(null);
                                        setEditingKwText('');
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs cursor-pointer whitespace-nowrap"
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-block px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold">
                                      {item.keyword}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingKwId(item._id);
                                        setEditingKwText(item.keyword);
                                      }}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer transition-colors"
                                      title="Chỉnh sửa từ khóa cấm"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>Lừa đảo / Nhạy cảm</span>
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                                {item.created_at || 'Mặc định hệ thống'}
                              </td>
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBannedKeyword(item._id, item.keyword)}
                                  className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-900 text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 mx-auto shadow-xs whitespace-nowrap"
                                  title={`Xóa từ cấm "${item.keyword}"`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Xóa</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          )}

      </main>

      {/* ======================= MODAL CHI TIẾT USER & DUYỆT GPKD ======================= */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-black text-lg">
                  {selectedUserDetail.role === 'employer' ? <Building2 className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedUserDetail.role === 'employer'
                      ? (selectedUserDetail.profile?.company_name || 'Hồ Sơ Doanh Nghiệp')
                      : (selectedUserDetail.profile?.full_name || selectedUserDetail.full_name || 'Hồ Sơ Sinh Viên')}
                  </h3>
                  <p className="text-xs text-blue-700 font-mono font-semibold mt-0.5">{selectedUserDetail.email}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedUserDetail(null)} 
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin cơ bản */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 block mb-0.5 text-xs">Vai Trò:</span>
                <span className="font-bold text-slate-900">{selectedUserDetail.role === 'employer' ? 'Nhà Tuyển Dụng' : 'Sinh Viên'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 block mb-0.5 text-xs">Mã ID:</span>
                <span className="font-mono text-slate-800 font-semibold truncate block">{selectedUserDetail._id}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 block mb-0.5 text-xs">Trạng Thái:</span>
                <span className={`font-bold ${selectedUserDetail.is_banned ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {selectedUserDetail.is_banned ? 'Bị Khóa' : 'Hoạt Động'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 block mb-0.5 text-xs">Đánh Giá:</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  {selectedUserDetail.rating_avg || 5.0}/5
                </span>
              </div>
            </div>

            {/* CHI TIẾT CHO SINH VIÊN */}
            {selectedUserDetail.role === 'student' && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  <span>Thông Tin Học Vấn & Cá Nhân Sinh Viên</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 block text-xs">Họ và tên:</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedUserDetail.profile?.full_name || selectedUserDetail.full_name || 'Chưa cập nhật'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Mã số sinh viên (MSSV):</span>
                    <span className="font-mono font-bold text-blue-700 text-sm">{selectedUserDetail.profile?.mssv || selectedUserDetail.mssv || 'Chưa cập nhật'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Trường Đại học:</span>
                    <span className="text-slate-800 font-medium text-xs sm:text-sm">{selectedUserDetail.profile?.university || 'Chưa cập nhật'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Địa chỉ cư trú:</span>
                    <span className="text-slate-800 font-medium text-xs sm:text-sm">{selectedUserDetail.profile?.residence_address || selectedUserDetail.profile?.address || selectedUserDetail.residence_address || 'Chưa cập nhật'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Số điện thoại:</span>
                    <span className="text-slate-800 font-mono font-medium text-xs sm:text-sm">{selectedUserDetail.profile?.phone || 'Chưa cập nhật'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Kỹ năng nổi bật:</span>
                    <span className="text-slate-800 font-medium text-xs sm:text-sm">{selectedUserDetail.profile?.skills || 'Chưa cập nhật'}</span>
                  </div>
                </div>
                {selectedUserDetail.profile?.bio && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-slate-500 block text-xs">Giới thiệu bản thân:</span>
                    <p className="text-slate-700 italic mt-0.5">{selectedUserDetail.profile?.bio}</p>
                  </div>
                )}
              </div>
            )}

            {/* CHI TIẾT CHO NHÀ TUYỂN DỤNG */}
            {selectedUserDetail.role === 'employer' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>Hồ Sơ Doanh Nghiệp Tuyển Dụng</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-slate-500 block text-xs">Tên Công ty / Thương hiệu:</span>
                      <span className="font-bold text-slate-900 text-sm">{selectedUserDetail.profile?.company_name || selectedUserDetail.company_name || 'Doanh nghiệp'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Người đại diện:</span>
                      <span className="text-slate-800 font-medium text-xs sm:text-sm">{selectedUserDetail.profile?.representative_name || selectedUserDetail.representative_name || 'Người đại diện'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Mã số thuế (MST):</span>
                      <span className="font-mono font-bold text-blue-700 text-sm">{selectedUserDetail.profile?.business_license || 'Chưa cập nhật'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Số điện thoại:</span>
                      <span className="text-slate-800 font-mono font-medium text-xs sm:text-sm">{selectedUserDetail.profile?.phone || 'Chưa cập nhật'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Địa chỉ trụ sở / chi nhánh:</span>
                      <span className="text-slate-800 font-medium text-xs sm:text-sm">{selectedUserDetail.profile?.address || 'Chưa cập nhật'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Trang web doanh nghiệp:</span>
                      {selectedUserDetail.profile?.website ? (
                        <a href={selectedUserDetail.profile.website} target="_blank" rel="noreferrer" className="text-blue-700 font-semibold hover:underline">
                          {selectedUserDetail.profile.website}
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">Chưa cập nhật</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* KHU VỰC PHÊ DUYỆT GPKD */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>Giấy Phép Kinh Doanh (GPKD)</span>
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                      selectedUserDetail.employer_record?.approval_status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : (selectedUserDetail.employer_record?.approval_status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200')
                    }`}>
                      {selectedUserDetail.employer_record?.approval_status === 'approved'
                        ? 'Đã Phê Duyệt'
                        : (selectedUserDetail.employer_record?.approval_status === 'rejected'
                          ? 'Bị Từ Chối'
                          : 'Chờ Duyệt')}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-6 h-6 text-rose-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {selectedUserDetail.profile?.business_license_name ||
                            selectedUserDetail.license_name ||
                            (() => {
                              const uUrl = selectedUserDetail.profile?.business_license_url || selectedUserDetail.license_url || selectedUserDetail.employer_record?.license_url || '';
                              if (!uUrl) return 'Chưa có tệp GPKD';
                              return uUrl.toLowerCase().endsWith('.pdf') ? uUrl.split('/').pop() : 'GPKD_DoanhNghiep.pdf';
                            })()}
                        </p>
                        <p className="text-xs text-slate-600">Tài liệu pháp lý đã tải lên hệ thống</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminGpkdViewer(selectedUserDetail)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Bản In GPKD</span>
                    </button>
                  </div>

                  {selectedUserDetail.employer_record?.reject_reason && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                      <strong>Lý do từ chối trước đó:</strong> {selectedUserDetail.employer_record.reject_reason}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleReviewEmployerGpkd(selectedUserDetail._id, 'rejected')}
                      className="px-5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold shadow-xs cursor-pointer transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Từ chối</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewEmployerGpkd(selectedUserDetail._id, 'approved')}
                      className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm cursor-pointer transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Duyệt</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= MODAL TỪ CHỐI GPKD KÈM LÝ DO ======================= */}
      {gpkdRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">Từ Chối Phê Duyệt GPKD</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setGpkdRejectModal(null)} 
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-700">
              Doanh nghiệp: <strong className="text-slate-900">{gpkdRejectModal.companyName}</strong>
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await executeGpkdReview(gpkdRejectModal.userId, 'rejected', gpkdRejectModal.reason);
                setGpkdRejectModal(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Nhập lý do từ chối phê duyệt (gửi thông báo trực tiếp cho NTD) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={gpkdRejectModal.reason}
                  onChange={(e) => setGpkdRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ví dụ: Giấy phép kinh doanh bị mờ, hết hạn hoặc thông tin không trùng khớp..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGpkdRejectModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Xác Nhận Từ Chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL XEM CHI TIẾT TIN TUYỂN DỤNG ======================= */}
      {selectedJobDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {selectedJobDetail.category_name || (selectedJobDetail.category_id === 'cat_1' ? 'Bán lẻ / Phục vụ' : selectedJobDetail.category_id) || 'Ngành nghề'}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1.5">{selectedJobDetail.title}</h3>
                <p className="text-xs text-emerald-700 font-bold mt-0.5">{selectedJobDetail.company_name}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedJobDetail(null)} 
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 block text-xs mb-0.5">Mức Lương:</span>
                <span className="font-bold text-blue-700 font-mono">
                  {selectedJobDetail.is_negotiable ? 'Thỏa thuận' : `${selectedJobDetail.salary_min?.toLocaleString()}đ - ${selectedJobDetail.salary_max?.toLocaleString()}đ`}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 block text-xs mb-0.5">Địa Điểm:</span>
                <span className="font-semibold text-slate-900 truncate block">{selectedJobDetail.location || 'TP.HCM'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 block text-xs mb-0.5">Trạng Thái Vận Hành:</span>
                <span className="font-bold text-slate-900">
                  {selectedJobDetail.job_status === 'open' || selectedJobDetail.is_open ? 'Đang tuyển' : (selectedJobDetail.job_status === 'filled' ? 'Đã nhận người' : (selectedJobDetail.job_status === 'completed' ? 'Hoàn thành' : 'Tạm đóng'))}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 block text-xs mb-0.5">Kiểm Duyệt:</span>
                <span className={`font-bold ${selectedJobDetail.is_hidden ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {selectedJobDetail.is_hidden ? 'Bị Ẩn (Vi phạm)' : 'Công Khai'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Mô tả công việc:</span>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{selectedJobDetail.description || 'Không có mô tả chi tiết.'}</p>
              </div>
              {selectedJobDetail.requirements && (
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Yêu cầu ứng viên:</span>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{selectedJobDetail.requirements}</p>
                </div>
              )}
              {selectedJobDetail.benefits && (
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Quyền lợi:</span>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{selectedJobDetail.benefits}</p>
                </div>
              )}
              {selectedJobDetail.hidden_reason && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <strong>Lý do bị ẩn:</strong> {selectedJobDetail.hidden_reason}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-600 font-mono">Mã tin: {selectedJobDetail._id}</span>
              <div className="flex items-center gap-2">
                {selectedJobDetail.is_hidden ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleUnhideJob(selectedJobDetail._id);
                      setSelectedJobDetail(prev => ({ ...prev, is_hidden: false, hidden_reason: '' }));
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Khôi Phục Hiển Thị</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setHideJobModal(selectedJobDetail);
                      setHideReason('');
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ẩn Tin Vi Phạm</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL XEM CHI TIẾT NỘI DUNG ĐÁNH GIÁ ======================= */}
      {selectedReviewDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <h3 className="text-base font-black text-slate-900">Chi Tiết Bài Đánh Giá</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedReviewDetail(null)} 
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 block text-xs mb-0.5">Người Đánh Giá:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedReviewDetail.reviewer_name || selectedReviewDetail.user_name || 'Người dùng'}</span>
                <span className="text-xs text-slate-600 block mt-0.5">{selectedReviewDetail.created_at || 'Thời gian gửi'}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 block text-xs mb-0.5">Đối Tượng Được Đánh Giá:</span>
                <span className="font-bold text-blue-700 text-sm">{selectedReviewDetail.target_name || selectedReviewDetail.student_name || 'Đối tác'}</span>
                <span className="text-xs text-slate-600 block mt-0.5">{selectedReviewDetail.job_title || 'Công việc bán thời gian'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Điểm đánh giá:</span>
                <div className="flex items-center text-amber-500 gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= (selectedReviewDetail.rating || 5) ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                  ))}
                  <span className="font-bold text-xs text-slate-900 ml-1">({selectedReviewDetail.rating || 5}/5 sao)</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Toàn bộ văn bản nhận xét:</span>
                <p className="text-slate-800 text-xs sm:text-sm leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200 whitespace-pre-wrap">
                  "{selectedReviewDetail.comment}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                <span className="text-slate-600 font-semibold">Trạng thái hiển thị:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap ${
                  selectedReviewDetail.is_hidden ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  {selectedReviewDetail.is_hidden ? 'Đã Ẩn Do Vi Phạm' : 'Công Khai'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await handleToggleHideReview(selectedReviewDetail._id);
                  setSelectedReviewDetail(prev => ({ ...prev, is_hidden: !prev.is_hidden }));
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                  selectedReviewDetail.is_hidden
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {selectedReviewDetail.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{selectedReviewDetail.is_hidden ? 'Khôi Phục Hiển Thị Công Khai' : 'Ẩn Đánh Giá Vi Phạm'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL XEM CHI TIẾT BÁO CÁO VI PHẠM & CẬP NHẬT TRẠNG THÁI ======================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-black text-slate-900">Chi Tiết Phiếu Khiếu Nại / Báo Cáo Vi Phạm</h3>
                  <p className="text-xs text-blue-700 font-mono font-semibold mt-0.5">{selectedTicket.ticket_code || selectedTicket._id}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedTicket(null)} 
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-600 block text-xs">Người Khiếu Nại (Báo Cáo):</span>
                <span className="font-bold text-slate-900 text-sm">{selectedTicket.reporter_name || 'Người dùng'}</span>
                <span className="text-xs text-slate-700 block">{selectedTicket.reporter_email || selectedTicket.reporter_id}</span>
                <span className="text-xs text-slate-500 font-mono block">Ngày gửi: {selectedTicket.created_at}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-600 block text-xs">Đối Tượng Bị Báo Cáo:</span>
                <span className="font-bold text-rose-700 text-sm">{selectedTicket.target_title || 'Đối tượng vi phạm'}</span>
                <span className="text-xs text-slate-700 block font-mono">Mã đối tượng: {selectedTicket.target_id}</span>
                <span className="text-xs text-slate-600 block">Loại vi phạm: {selectedTicket.type || selectedTicket.report_type || 'Vi phạm'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Lý do khiếu nại:</span>
                <p className="text-slate-900 font-semibold leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  {selectedTicket.reason}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Bằng chứng liên quan đối chiếu:</span>
                <div className="flex flex-wrap items-center gap-3">
                  {(selectedTicket.type === 'chat' || selectedTicket.report_type === 'chat') && (
                    <button
                      type="button"
                      onClick={() => handleViewTicketChatHistory(selectedTicket)}
                      className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Lịch Sử Trò Chuyện Gốc</span>
                    </button>
                  )}
                  {selectedTicket.evidence && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-800 w-full">
                      <strong>Bằng chứng đính kèm:</strong> {selectedTicket.evidence}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* FORM CẬP NHẬT TRẠNG THÁI XỬ LÝ BÁO CÁO */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await handleUpdateTicketStatus(selectedTicket._id, ticketStatusSelect);
              }}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs"
            >
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Cập Nhật Tiến Độ & Trạng Thái Xử Lý Khiếu Nại</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Chuyển trạng thái xử lý *</label>
                  <select
                    value={ticketStatusSelect}
                    onChange={(e) => setTicketStatusSelect(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-blue-500 cursor-pointer font-bold"
                  >
                    <option value="pending">Chờ tiếp nhận xử lý</option>
                    <option value="investigating">Đang điều tra xác minh</option>
                    <option value="resolved">Đã xử lý thỏa đáng</option>
                    <option value="dismissed">Bị bác bỏ do không căn cứ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Ghi chú của Quản trị viên (gửi kèm thông báo)</label>
                  <input
                    type="text"
                    value={ticketNote}
                    onChange={(e) => setTicketNote(e.target.value)}
                    placeholder="Nhập ghi chú xử lý gửi người báo cáo..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu Trạng Thái & Gửi Thông Báo Kết Quả</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL XEM LỊCH SỬ CHAT GỐC ======================= */}
      {ticketChatHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Bằng Chứng: Lịch Sử Chat Gốc Nguyên Bản
                </h3>
                <p className="text-xs text-blue-700 font-semibold mt-0.5">Trích xuất tin nhắn trực tiếp từ cơ sở dữ liệu hệ thống</p>
              </div>
              <button 
                type="button" 
                onClick={() => setTicketChatHistory(null)} 
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
              {ticketChatHistory.length === 0 ? (
                <div className="p-10 text-center text-xs sm:text-sm text-slate-600">
                  Chưa ghi nhận lịch sử tin nhắn liên quan đến phiếu báo cáo này.
                </div>
              ) : ticketChatHistory.map((m, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm space-y-1 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-700">{m.sender || m.sender_name}</span>
                    <span className="text-xs text-slate-500 font-mono">{m.created_at}</span>
                  </div>
                  <p className={`text-slate-900 ${m.is_banned_keyword ? 'text-rose-800 font-bold bg-rose-50 border border-rose-200 p-2 rounded-lg' : ''}`}>
                    {m.content}
                  </p>
                  {m.is_banned_keyword && (
                    <span className="text-xs text-rose-700 font-bold flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Phát hiện từ cấm vi phạm: "{m.content}"</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL KHÓA USER ======================= */}
      {banModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <Lock className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">Khóa Tài Khoản Người Dùng</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setBanModalUser(null)} 
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-700">
              Khóa tài khoản: <strong className="text-slate-900">{banModalUser.email}</strong>
            </p>

            <form onSubmit={handleBanUserSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Nhập lý do khóa tài khoản *
                </label>
                <textarea
                  required
                  rows={3}
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Vi phạm quy định bảo mật hoặc bị báo cáo lừa đảo..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBanModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Xác Nhận Khóa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL ẨN TIN TUYỂN DỤNG ======================= */}
      {hideJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-amber-600">
                <EyeOff className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">Ẩn Tin Tuyển Dụng Vi Phạm</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setHideJobModal(null)} 
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-700">
              Công việc: <strong className="text-slate-900">{hideJobModal.title}</strong>
            </p>

            <form onSubmit={handleHideJobSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Nhập lý do ẩn tin (tin sẽ tự động rút khỏi trang tìm kiếm của Sinh viên) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={hideReason}
                  onChange={(e) => setHideReason(e.target.value)}
                  placeholder="Tin đăng có dấu hiệu thu phí cọc..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setHideJobModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Xác Nhận Ẩn Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL XEM CHI TIẾT GPKD DOANH NGHIỆP DÀNH CHO ADMIN ======================= */}
      <DocumentViewerModal
        isOpen={!!adminGpkdViewer}
        onClose={() => setAdminGpkdViewer(null)}
        type="gpkd"
        data={{
          companyName: adminGpkdViewer?.profile?.company_name || adminGpkdViewer?.company_name || 'DOANH NGHIỆP',
          repName: adminGpkdViewer?.profile?.representative_name || adminGpkdViewer?.representative_name || 'Người đại diện',
          licenseNumber: adminGpkdViewer?.profile?.business_license || adminGpkdViewer?.business_license || 'Chưa cập nhật',
          address: adminGpkdViewer?.profile?.address || adminGpkdViewer?.address || 'Chưa cập nhật',
          fileName: (() => {
            const url = adminGpkdViewer?.business_license_url || adminGpkdViewer?.profile?.business_license_url || adminGpkdViewer?.license_url || adminGpkdViewer?.employer_record?.license_url || '';
            const explicitName = adminGpkdViewer?.business_license_name || adminGpkdViewer?.profile?.business_license_name || adminGpkdViewer?.license_name;
            if (explicitName) return explicitName;
            return (url && url.toLowerCase().endsWith('.pdf')) ? url.split('/').pop() : 'GPKD_DoanhNghiep.pdf';
          })(),
          fileUrl: adminGpkdViewer?.business_license_url || adminGpkdViewer?.profile?.business_license_url || adminGpkdViewer?.license_url || adminGpkdViewer?.employer_record?.license_url || ''
        }}
        onDownloadSuccess={(msg) => notify(msg, 'success')}
      />

      {/* CONFIRMATION DIALOG (REPLACES ALL BROWSER CONFIRMS/ALERTS) */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
