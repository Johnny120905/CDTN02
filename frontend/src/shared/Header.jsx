import React, { useState, useRef, useEffect } from 'react';
import BrandLogo from './BrandLogo';
import MediaAvatar from './MediaAvatar';
import {
  LogOut, UserCheck, ChevronDown, User, ShieldCheck,
  GraduationCap, Briefcase, Settings, Trash2, AlertTriangle, X,
  Search, Bell, MessageSquare, Plus, Menu, ExternalLink,
  CheckCircle2, Clock, ChevronRight, AlertCircle, Building2
} from 'lucide-react';
import { getStatusBadge } from './professionSuggestions';
import { getRoleToken } from './searchAndFilterHelper';
import { getSocket } from './webrtcSocketService';
import { emitSync, subscribeSync, SYNC_EVENTS } from './syncEventHub';

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
  activeSectionTitle = 'Trang chủ',
  guestRole = 'student',
  onNavigateAuth,
  onShowBanner
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
  const seenNotifIdsRef = useRef(new Set());
  const notiOpenRef = useRef(false);
  const markAllInFlightRef = useRef(false);

  const isGuest = !currentUser;
  const role = currentUser?.role || guestRole;
  const token = isGuest ? null : getRoleToken(currentUser?.role);
  const currentUserId = currentUser?._id || currentUser?.id;
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
    (isEmployer ? 'Doanh nghiệp' : '');

  const branchName = currentUser?.profile?.branch_name ||
    currentUser?.profile?.address ||
    '';

  const studentName = currentUser?.profile?.full_name ||
    currentUser?.full_name ||
    'Sinh viên';

  const adminName = currentUser?.profile?.full_name ||
    'Ban quản trị';

  const userStatus = currentUser?.profile?.status || currentUser?.status || 'active';
  const statusBadge = getStatusBadge(userStatus);

  const employerApprovalStatus = currentUser?.employer_record?.approval_status ||
    currentUser?.approval_status ||
    'approved';

  const [profileAvatar, setProfileAvatar] = useState(
    currentUser?.avatar_url ||
    currentUser?.profile?.avatar_url ||
    currentUser?.profile?.logo_url ||
    currentUser?.profile?.logo ||
    currentUser?.profile?.company_logo ||
    currentUser?.company_info?.logo_url ||
    currentUser?.company_profile?.logo_url ||
    ''
  );

  // 1. Lắng nghe sự kiện đồng bộ avatar tức thì từ toàn bộ ứng dụng (khi chỉnh sửa ở hồ sơ sinh viên hoặc hồ sơ doanh nghiệp)
  useEffect(() => {
    const handleAvatarUpdateEvent = (e) => {
      const detail = e.detail;
      if (!detail) return;
      const targetRole = detail.role;
      const currentRole = isEmployer ? 'employer' : (isStudent ? 'student' : 'admin');
      if (!targetRole || targetRole === currentRole) {
        const nextUrl = detail.avatar_url || detail.logo_url || '';
        setProfileAvatar(nextUrl);
      }
    };
    window.addEventListener('partime-avatar-updated', handleAvatarUpdateEvent);

    const handleStorageEvent = (e) => {
      if (e.key === 'partime_student_user' || e.key === 'partime_employer_user' || e.key === 'partime_user') {
        try {
          const u = JSON.parse(e.newValue || '{}');
          const currentRole = isEmployer ? 'employer' : (isStudent ? 'student' : 'admin');
          const incomingId = u._id || u.id;
          const incomingEmail = (u.email || '').toLowerCase();
          const currentEmail = (currentUser?.email || '').toLowerCase();
          const isSameUser =
            (incomingId && currentUserId && String(incomingId) === String(currentUserId)) ||
            (incomingEmail && currentEmail && incomingEmail === currentEmail);
          if (u.role === currentRole && isSameUser) {
            const nextUrl = u.avatar_url || u.logo_url || u.profile?.avatar_url || u.profile?.logo_url || '';
            if (nextUrl) setProfileAvatar(nextUrl);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('partime-avatar-updated', handleAvatarUpdateEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [isEmployer, isStudent, currentUserId, currentUser?.email]);

  // 2. Tải avatar từ server để đảm bảo dữ liệu luôn tươi mới ngay khi tải trang
  useEffect(() => {
    const rawAvatar = currentUser?.avatar_url ||
      currentUser?.profile?.avatar_url ||
      currentUser?.profile?.logo_url ||
      currentUser?.profile?.logo ||
      currentUser?.profile?.company_logo ||
      currentUser?.company_info?.logo_url ||
      currentUser?.company_profile?.logo_url ||
      '';
    if (rawAvatar) {
      setProfileAvatar(rawAvatar);
    }

    if (!isGuest) {
      const activeToken = token ||
        (isEmployer ? localStorage.getItem('partime_employer_token') : (isStudent ? localStorage.getItem('partime_student_token') : null)) ||
        localStorage.getItem('partime_token');
      const fetchHeaders = activeToken ? { Authorization: `Bearer ${activeToken}` } : {};

      const loadAvatar = async () => {
        try {
          if (isStudent) {
            const res = await fetch('/api/student/profile', { headers: fetchHeaders });
            const data = await res.json();
            if (data.success && data.data?.avatar_url) {
              setProfileAvatar(data.data.avatar_url);
            }
          } else if (isEmployer) {
            const res = await fetch('/api/employer/company', { headers: fetchHeaders });
            const data = await res.json();
            if (data.success && data.data?.logo_url) {
              setProfileAvatar(data.data.logo_url);
            }
          }
        } catch (e) {}
      };
      loadAvatar();

      // Lắng nghe sự kiện PROFILES_SYNC từ Universal Sync Event Hub để làm mới avatar ngay lập tức
      const unsubProfileSync = subscribeSync(SYNC_EVENTS.PROFILES, () => {
        loadAvatar();
      });

      return () => {
        unsubProfileSync();
      };
    }
  }, [currentUser, token, isGuest, isStudent, isEmployer]);

  const userAvatarUrl = profileAvatar ||
    currentUser?.avatar_url ||
    currentUser?.profile?.avatar_url ||
    currentUser?.profile?.logo_url ||
    currentUser?.profile?.logo ||
    currentUser?.profile?.company_logo ||
    '';
  const fallbackInitial = (isEmployer ? (companyName || representativeName) : (isStudent ? studentName : adminName)).charAt(0).toUpperCase();

  // Fetch notifications according to role
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const endpoint = isEmployer
        ? '/api/employer/notifications'
        : (isStudent ? '/api/student/notifications' : (isAdmin ? '/api/notifications' : null));
      if (!endpoint) return;
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        if (markAllInFlightRef.current) {
          setNotifications(data.data.map(n => ({ ...n, is_read: true })));
          setUnreadCount(0);
        } else {
          setNotifications(data.data);
          const unread = data.data.filter(n => !n.is_read).length;
          setUnreadCount(unread);
        }
      }
    } catch (err) {
      console.warn('Could not fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (!token || isGuest) return;
    fetchNotifications();
    // Đồng bộ nền dự phòng 15 giây (đã có Socket.IO đẩy realtime tức thì)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchNotifications();
    }, 15000);

    // Kích hoạt nhận thông báo tức thời qua WebRTC Socket.IO (3 role thông nhau)
    const socket = getSocket();
    const registerIdentity = () => {
      const allIds = [
        currentUserId,
        currentUser?._id,
        currentUser?.id,
        currentUser?.employer_id,
        currentUser?.student_id,
        currentUser?.employer_record?._id,
        currentUser?.student_profile?._id,
        currentUser?.profile?._id,
        currentUser?.profile?.user_id,
        currentUser?.profile?.student_id,
        currentUser?.profile?.employer_id,
      ].filter(Boolean);
      if (allIds.length > 0 || role) {
        socket.emit('register-user', {
          user_id: currentUserId,
          role,
          aliases: allIds
        });
      }
    };
    registerIdentity();

    const handleSocketUpdate = () => {
      fetchNotifications();
    };

    const handleNewNotification = (notif) => {
      if (!notif) {
        fetchNotifications();
        return;
      }
      const myIdList = [
        currentUserId,
        currentUser?._id,
        currentUser?.id,
        currentUser?.employer_id,
        currentUser?.student_id,
        currentUser?.employer_record?._id,
        currentUser?.student_profile?._id,
        currentUser?.profile?._id,
        currentUser?.profile?.user_id,
        currentUser?.profile?.student_id,
        currentUser?.profile?.employer_id,
      ].filter(Boolean).map(String);

      const notifTargetIds = [
        notif.user_id,
        notif.target_id,
        notif.related_id,
        ...(Array.isArray(notif.user_aliases) ? notif.user_aliases : [])
      ].filter(Boolean).map(String);

      const hasIdMatch = myIdList.some(id => notifTargetIds.includes(id));
      const hasRoleMatch =
        (isAdmin && (notif.role === 'admin' || notif.user_id === 'role_admin')) ||
        (isEmployer && (notif.user_id === 'role_employer' || notif.target === 'all_employers')) ||
        (isStudent && (notif.user_id === 'role_student' || notif.target === 'all_students')) ||
        notif.user_id === 'all' || notif.user_id === 'broadcast';

      const isTarget = hasIdMatch || hasRoleMatch;
      if (!isTarget) return;

      fetchNotifications();
      if (notif._id && !seenNotifIdsRef.current.has(notif._id)) {
        seenNotifIdsRef.current.add(notif._id);
        if (onShowBanner && notif.title) {
          onShowBanner(`${notif.title}: ${notif.message || ''}`, 'info');
        }
      }
    };

    socket.on('connect', registerIdentity);
    socket.on('new-notification', handleNewNotification);
    socket.on('applicant-withdrawn', handleSocketUpdate);
    socket.on('application-status-updated', handleSocketUpdate);
    socket.on('gpkd-status-updated', handleSocketUpdate);
    socket.on('gpkd-reupload', handleSocketUpdate);
    socket.on('new-application', handleSocketUpdate);
    socket.on('new-report', handleSocketUpdate);
    socket.on('report-updated', handleSocketUpdate);
    socket.on('new-job', handleSocketUpdate);
    socket.on('job-updated', handleSocketUpdate);
    socket.on('shift-status-updated', handleSocketUpdate);
    socket.on('new-review', handleSocketUpdate);
    socket.on('review-updated', handleSocketUpdate);
    socket.on('user-status-updated', handleSocketUpdate);
    socket.on('system-announcement', handleSocketUpdate);
    socket.on('announcement-deleted', handleSocketUpdate);
    socket.on('notifications-updated', handleSocketUpdate);

    // Đăng ký Universal Sync Event Hub: Tự động cập nhật chuông thông báo khi có bất kỳ thay đổi nào trong hệ thống
    const unsubNotifSync = subscribeSync([
      SYNC_EVENTS.SYSTEM,
      SYNC_EVENTS.APPLICATIONS,
      SYNC_EVENTS.SHIFTS,
      SYNC_EVENTS.REVIEWS,
      SYNC_EVENTS.JOBS
    ], () => {
      fetchNotifications();
    });

    return () => {
      clearInterval(interval);
      unsubNotifSync();
      socket.off('connect', registerIdentity);
      socket.off('new-notification', handleNewNotification);
      socket.off('applicant-withdrawn', handleSocketUpdate);
      socket.off('application-status-updated', handleSocketUpdate);
      socket.off('gpkd-status-updated', handleSocketUpdate);
      socket.off('gpkd-reupload', handleSocketUpdate);
      socket.off('new-application', handleSocketUpdate);
      socket.off('new-report', handleSocketUpdate);
      socket.off('report-updated', handleSocketUpdate);
      socket.off('new-job', handleSocketUpdate);
      socket.off('job-updated', handleSocketUpdate);
      socket.off('shift-status-updated', handleSocketUpdate);
      socket.off('new-review', handleSocketUpdate);
      socket.off('review-updated', handleSocketUpdate);
      socket.off('user-status-updated', handleSocketUpdate);
      socket.off('system-announcement', handleSocketUpdate);
      socket.off('announcement-deleted', handleSocketUpdate);
      socket.off('notifications-updated', handleSocketUpdate);
    };
  }, [token, role, currentUserId, isGuest]);

  // Handle Mark as Read on Hover
  const handleNotiHover = async (noti) => {
    if (noti.is_read) return;
    setNotifications(prev => prev.map(n => n._id === noti._id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const endpoint = isEmployer
        ? `/api/employer/notifications/${noti._id}/read`
        : (isStudent ? `/api/student/notifications/${noti._id}/read` : `/api/notifications/${noti._id}/read`);
      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      emitSync(SYNC_EVENTS.SYSTEM, { action: 'notifications_read_all' });
    } catch (e) {
      console.warn('Error marking noti as read:', e);
    }
  };

  // Handle Delete Notification permanently + toast
  const handleDeleteNoti = async (notiId, e) => {
    e.stopPropagation();
    const targetNoti = notifications.find(n => n._id === notiId);
    setNotifications(prev => prev.filter(n => n._id !== notiId));
    if (targetNoti && !targetNoti.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    try {
      const endpoint = isEmployer
        ? `/api/employer/notifications/${notiId}`
        : (isStudent ? `/api/student/notifications/${notiId}` : `/api/notifications/${notiId}`);
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && onShowBanner) {
        onShowBanner(data.message || 'Đã xóa thông báo thành công!', 'success');
      }
      if (data.success) {
        emitSync(SYNC_EVENTS.SYSTEM, { action: 'notification_deleted', notiId });
      }
    } catch (err) {
      console.warn('Error deleting noti:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    const hasUnread = unreadCount > 0 || notifications.some(n => !n.is_read);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    if (!token || !hasUnread) return;
    markAllInFlightRef.current = true;
    try {
      const endpoint = isEmployer
        ? '/api/employer/notifications/read-all'
        : (isStudent ? '/api/student/notifications/read-all' : '/api/notifications/read-all');
      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      emitSync(SYNC_EVENTS.SYSTEM, { action: 'notifications_read_all' });
    } catch (e) {
      console.warn('Error marking all notifications as read:', e);
    } finally {
      markAllInFlightRef.current = false;
    }
  };

  const closeNotificationsPanel = () => {
    if (!notiOpenRef.current) return;
    notiOpenRef.current = false;
    setNotiOpen(false);
    markAllNotificationsRead();
  };

  const handleToggleNoti = () => {
    if (notiOpenRef.current) {
      closeNotificationsPanel();
    } else {
      notiOpenRef.current = true;
      setNotiOpen(true);
    }
  };

  // Handle Notification Click (Gán đúng link & menu cho cả 3 vai trò)
  const handleNotiClick = (n) => {
    handleNotiHover(n);
    closeNotificationsPanel();

    // 1. Kiểm tra nếu có target_menu hoặc link được gán sẵn
    let explicitMenu = n.target_menu || '';
    if (!explicitMenu && n.link) {
      const hashPart = n.link.split('#')[1];
      if (hashPart) {
        explicitMenu = hashPart.split('?')[0];
      } else {
        explicitMenu = n.link.replace(/^\/(?:student|employer|admin)\/?#?/, '').split('?')[0];
      }
    }

    const type = (n.type || '').toLowerCase();
    const title = (n.title || '').toLowerCase();
    const targetId = (n.target_id || n.related_id || '').toLowerCase();

    // Luôn ưu tiên tuyệt đối: Bất kỳ thông báo đánh giá nào (review / đánh giá) đều chuyển hướng đến menu 'reviews'
    if (type.includes('review') || title.includes('đánh giá')) {
      if (onNavigateMenu) onNavigateMenu('reviews', n.related_id || '');
      return;
    }

    // 2. Điều hướng chính xác theo vai trò (Role-based Navigation)
    if (isAdmin) {
      if (explicitMenu && ['dashboard', 'home', 'gpkd', 'users', 'jobs', 'keywords', 'reviews', 'categories', 'reports', 'audit_logs', 'announcements'].includes(explicitMenu)) {
        if (onNavigateMenu) onNavigateMenu(explicitMenu);
        return;
      }
      if (type.includes('gpkd') || type.includes('license') || title.includes('giấy phép') || title.includes('gpkd')) {
        if (onNavigateMenu) onNavigateMenu('gpkd');
      } else if (type.includes('job') || title.includes('việc làm') || title.includes('tuyển dụng') || title.includes('tin')) {
        if (onNavigateMenu) onNavigateMenu('jobs');
      } else if (type.includes('report') || type.includes('ticket') || title.includes('khiếu nại') || title.includes('báo cáo')) {
        if (onNavigateMenu) onNavigateMenu('reports');
      } else if (type.includes('user') || type.includes('account') || type.includes('banned') || title.includes('tài khoản')) {
        if (onNavigateMenu) onNavigateMenu('users');
      } else if (type.includes('review') || title.includes('đánh giá')) {
        if (onNavigateMenu) onNavigateMenu('reviews');
      } else if (type.includes('announcement') || title.includes('hệ thống') || title.includes('hàng loạt')) {
        if (onNavigateMenu) onNavigateMenu('announcements');
      } else {
        if (onNavigateMenu) onNavigateMenu('dashboard');
      }
    } else if (isEmployer) {
      if (explicitMenu && ['home', 'company', 'post_job', 'jobs', 'applicants', 'interviews', 'job_completion', 'reviews', 'my_reports', 'chat'].includes(explicitMenu)) {
        if (onNavigateMenu) onNavigateMenu(explicitMenu, n.related_id || '');
        return;
      }
      if (type.includes('call') || title.includes('cuộc gọi')) {
        if (onNavigateMenu) onNavigateMenu('chat', n.related_id || '');
        else if (onToggleChatDrawer) onToggleChatDrawer();
      } else if (type.includes('chat') || title.includes('tin nhắn')) {
        if (onNavigateMenu) onNavigateMenu('chat', n.related_id || '');
        else if (onToggleChatDrawer) onToggleChatDrawer();
      } else if (type.includes('interview') || title.includes('phỏng vấn') || title.includes('lịch hẹn')) {
        if (onNavigateMenu) onNavigateMenu('interviews');
      } else if (type.includes('shift') || title.includes('ca làm') || title.includes('chấm công')) {
        if (onNavigateMenu) onNavigateMenu('job_completion');
      } else if (type.includes('application') || type.includes('applicant') || targetId.startsWith('app_') || title.includes('ứng tuyển') || title.includes('hồ sơ') || title.includes('ứng viên')) {
        if (onNavigateMenu) onNavigateMenu('applicants');
      } else if (type.includes('gpkd') || type.includes('license') || title.includes('giấy phép') || title.includes('gpkd')) {
        if (onNavigateMenu) onNavigateMenu('company');
      } else if (type.includes('review') || title.includes('đánh giá')) {
        if (onNavigateMenu) onNavigateMenu('reviews');
      } else if (type.includes('report') || type.includes('ticket') || title.includes('khiếu nại') || title.includes('báo cáo')) {
        if (onNavigateMenu) onNavigateMenu('my_reports');
      } else if (type.includes('job') || title.includes('việc làm') || title.includes('tuyển dụng') || title.includes('tin')) {
        if (onNavigateMenu) onNavigateMenu('jobs');
      } else {
        if (onNavigateMenu) onNavigateMenu('home');
      }
    } else {
      // isStudent
      if (explicitMenu && ['home', 'jobs', 'saved_jobs', 'applications', 'my_shifts', 'profile_cv', 'student_profile', 'reviews', 'my_reports', 'chat'].includes(explicitMenu)) {
        if (onNavigateMenu) onNavigateMenu(explicitMenu, n.related_id || '');
        return;
      }
      if (type.includes('call') || title.includes('cuộc gọi')) {
        if (onNavigateMenu) onNavigateMenu('chat', n.related_id || '');
        else if (onToggleChatDrawer) onToggleChatDrawer();
      } else if (type.includes('chat') || title.includes('tin nhắn')) {
        if (onNavigateMenu) onNavigateMenu('chat', n.related_id || '');
        else if (onToggleChatDrawer) onToggleChatDrawer();
      } else if (type.includes('shift') || title.includes('chốt nhận người') || title.includes('chấm công') || title.includes('ca làm')) {
        if (onNavigateMenu) onNavigateMenu('my_shifts');
      } else if (type.includes('job_completed') || title.includes('hoàn thành')) {
        if (onNavigateMenu) onNavigateMenu('reviews');
      } else if (type.includes('interview') || title.includes('phỏng vấn') || title.includes('lịch hẹn')) {
        if (onNavigateMenu) onNavigateMenu('applications');
      } else if (type.includes('application') || targetId.startsWith('app_') || title.includes('ứng tuyển') || title.includes('hồ sơ') || title.includes('trúng tuyển')) {
        if (onNavigateMenu) onNavigateMenu('applications');
      } else if (type.includes('review') || title.includes('đánh giá')) {
        if (onNavigateMenu) onNavigateMenu('reviews');
      } else if (type.includes('report') || type.includes('ticket') || title.includes('khiếu nại') || title.includes('báo cáo')) {
        if (onNavigateMenu) onNavigateMenu('my_reports');
      } else if (type.includes('job') || title.includes('việc làm') || title.includes('tuyển dụng')) {
        if (onNavigateMenu) onNavigateMenu('jobs');
      } else {
        if (onNavigateMenu) onNavigateMenu('home');
      }
    }
  };

  // Close dropdowns on outside click / Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notiRef.current && !notiRef.current.contains(event.target) && notiOpenRef.current) {
        closeNotificationsPanel();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && notiOpenRef.current) {
        closeNotificationsPanel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [token, role, notifications, unreadCount]);

  // Search Input Debounce (300ms)
  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (onSearchChange) onSearchChange(val);
    }, 300);
  };

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
        if (onShowBanner) onShowBanner('Đã hủy tài khoản thành công.', 'success');
        onLogout();
      } else {
        setDeleteModalOpen(false);
        if (onShowBanner) onShowBanner(data.message || 'Không thể hủy tài khoản lúc này.', 'error');
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
          title: 'Sinh viên',
          badgeColor: 'bg-blue-50 text-slate-900 border-blue-200',
          icon: <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
        };
      case 'employer':
        return {
          title: 'Nhà tuyển dụng',
          badgeColor: 'bg-indigo-50 text-slate-900 border-indigo-200',
          icon: <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
        };
      case 'admin':
        return {
          title: 'Quản trị viên hệ thống',
          badgeColor: 'bg-blue-50 text-slate-900 border-blue-300 font-semibold',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
        };
      default:
        return {
          title: 'Thành viên',
          badgeColor: 'bg-slate-100 text-slate-900 border-slate-200',
          icon: <User className="w-3.5 h-3.5 text-slate-500" />
        };
    }
  };

  const roleConfig = getRoleConfig(currentUser?.role);

  return (
    <div className="sticky top-0 z-40 w-full flex flex-col shadow-sm">

      {/* 1. BANNER CẢNH BÁO GPKD DÀNH CHO NHÀ TUYỂN DỤNG */}
      {isEmployer && employerApprovalStatus !== 'approved' && (
        <div className={`w-full py-2 px-4 flex items-center justify-between text-xs font-semibold ${employerApprovalStatus === 'rejected'
          ? 'bg-red-50 text-red-700 border-b border-red-200'
          : 'bg-amber-50 text-amber-800 border-b border-amber-200'
          }`}>
          <div className="flex items-center gap-2 w-full max-w-full mx-auto">
            <AlertTriangle className={`w-4 h-4 shrink-0 ${employerApprovalStatus === 'rejected' ? 'text-red-600' : 'text-amber-600'}`} />
            <span>
              {employerApprovalStatus === 'rejected' ? (
                <>Hồ sơ Giấy phép kinh doanh (GPKD) bị từ chối phê duyệt. Nút đăng tin tạm khóa. Vui lòng tải lại GPKD hợp lệ trong phần Hồ sơ doanh nghiệp.</>
              ) : (
                <>Giấy phép kinh doanh (GPKD) đang trong quá trình chờ Quản trị viên phê duyệt. Tính năng đăng tin mới đang tạm khóa.</>
              )}
            </span>
          </div>
        </div>
      )}

      {/* 2. THANH HEADER CHÍNH (LIGHT GLASS DIMENSION) */}
      <header className="w-full max-w-full glass-header-dimension text-slate-800 h-20 px-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-1.5 sm:gap-2">

        {/* ===================== CỤM TRÁI ===================== */}
        <div className="flex items-center gap-1.5 sm:gap-4 min-w-0 shrink">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title="Đóng / Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-95 transition-opacity text-left shrink-0"
            title="Quay về trang chủ"
          >
            <BrandLogo size="md" />
          </button>
        </div>

        {/* ===================== CỤM GIỮA ===================== */}
        {isStudent && (
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchInputChange}
                placeholder="Tìm nhanh việc làm, chức danh, kỹ năng..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl pl-11 pr-4 py-2.5 text-sm sm:text-base font-medium text-slate-900 placeholder-slate-400 outline-none transition-all shadow-inner h-11 sm:h-12"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    if (onSearchChange) onSearchChange('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===================== CỤM PHẢI ===================== */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">

          {/* Quick Post Job button for Employer */}
          {isEmployer && (
            <button
              type="button"
              onClick={isGuest ? () => onNavigateAuth && onNavigateAuth('login', 'employer') : onCreateJobClick}
              className="hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold shadow-sm cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Đăng tin mới</span>
            </button>
          )}

          {/* Icon Tin nhắn (Chat) - Chỉ khi đã đăng nhập */}
          {!isGuest && (isStudent || isEmployer) && (
            <button
              type="button"
              onClick={onToggleChatDrawer}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all cursor-pointer relative"
              title="Mở thanh trò chuyện & phỏng vấn"
            >
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
            </button>
          )}

          {/* Icon Chuông Thông Báo - Hiển thị cho tất cả 3 vai trò khi đã đăng nhập */}
          {!isGuest && (isStudent || isEmployer || isAdmin) && (
            <div className="relative" ref={notiRef}>
              <button
                type="button"
                onClick={handleToggleNoti}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all cursor-pointer relative overflow-visible"
                title="Thông báo hệ thống"
              >
                <Bell className={`w-4 h-4 text-slate-700 ${unreadCount > 0 ? 'animate-bounce text-blue-600' : ''}`} />
                {unreadCount > 0 && (
                  <span className="pointer-events-none absolute -top-2 -right-2 px-1 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] leading-none font-bold rounded-full bg-red-600 text-white border border-white shadow-sm">
                    {unreadCount >= 100 ? '99+' : `+${unreadCount}`}
                  </span>
                )}
              </button>

              {/* DROPDOWN THÔNG BÁO */}
              {notiOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 shadow-2xl py-3 z-[99999] bg-white text-slate-800 animate-in fade-in duration-200">
                  <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-slate-900">Thông báo hệ thống</h4>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {unreadCount} chưa đọc
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Chưa có thông báo mới nào.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleNotiClick(n)}
                          onMouseEnter={() => handleNotiHover(n)}
                          className={`p-3.5 transition-all group flex items-start justify-between gap-3 cursor-pointer ${!n.is_read
                            ? 'bg-blue-50/70 border-l-4 border-l-blue-600 hover:bg-blue-100/60'
                            : 'hover:bg-slate-50'
                            }`}
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-slate-300'}`}></span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-bold truncate ${!n.is_read ? 'text-blue-900' : 'text-slate-800'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                                {n.message || n.content}
                              </p>
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <span className="text-xs text-slate-400 block">
                                  {n.created_at || 'Vừa xong'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteNoti(n._id, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                            title="Xóa thông báo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 pt-2.5 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">
                      Rê chuột vào để tự động đánh dấu đã đọc • Nhấp X để xóa
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Badge vai trò riêng cho Admin */}
          {isAdmin && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-100 text-slate-900 border border-blue-200 text-xs font-semibold shadow-sm whitespace-nowrap shrink-0">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Quản trị viên hệ thống</span>
            </div>
          )}

          {/* Text block tóm tắt tài khoản - Chỉ khi đã đăng nhập */}
          {!isGuest && (
            <div className="hidden sm:flex flex-col text-right items-end">
              {isEmployer ? (
                <>
                  <div className="flex items-center gap-1.5 line-clamp-1 max-w-[280px]">
                    <span className="text-xs font-bold text-slate-900 truncate">{companyName}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium truncate max-w-[260px]">
                    {representativeName}
                  </div>
                </>
              ) : isStudent ? (
                <>
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[240px]">
                    {studentName}
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-[220px]">
                    {currentUser?.email}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[240px]">
                    {adminName}
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-[220px]">
                    {currentUser?.email}
                  </div>
                </>
              )}

              {/* Trạng thái hoạt động tự động */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${(currentUser?.is_banned || userStatus === 'inactive' || userStatus === 'cancelled')
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : (userStatus === 'paused'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${(currentUser?.is_banned || userStatus === 'inactive' || userStatus === 'cancelled')
                    ? 'bg-red-500'
                    : (userStatus === 'paused'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500 animate-pulse')
                    }`} />
                  <span>
                    {(currentUser?.is_banned || userStatus === 'inactive' || userStatus === 'cancelled')
                      ? 'Ngưng hoạt động'
                      : (userStatus === 'paused' ? 'Tạm dừng' : 'Đang hoạt động')}
                  </span>
                </span>
              </div>
            </div>
          )}

          {isGuest ? (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateAuth && onNavigateAuth('login', isEmployer ? 'employer' : 'student')}
                className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-[11px] sm:text-sm font-semibold cursor-pointer shadow-sm whitespace-nowrap shrink-0"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => onNavigateAuth && onNavigateAuth('register', isEmployer ? 'employer' : 'student')}
                className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white text-[11px] sm:text-sm font-semibold cursor-pointer shadow-sm whitespace-nowrap shrink-0"
              >
                {isEmployer ? 'Đăng ký doanh nghiệp' : 'Đăng ký sinh viên'}
              </button>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer group shadow-sm"
                title="Tài khoản cá nhân"
              >
                <MediaAvatar
                  src={userAvatarUrl}
                  alt={isEmployer ? (companyName || representativeName) : (isStudent ? studentName : adminName)}
                  fallbackText={fallbackInitial}
                  className="w-10 h-10 rounded-xl shadow-md overflow-hidden shrink-0"
                  fallbackClassName="bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-sm"
                  imgClassName="w-full h-full object-cover"
                />
                <ChevronDown className={`w-3.5 h-3.5 mr-1 text-slate-400 group-hover:text-slate-700 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* DROPDOWN MENU NỘI DUNG */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-200 shadow-2xl py-2 z-[99999] bg-white text-slate-800 animate-in fade-in duration-200">

                  {/* Thông tin tài khoản */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 mx-2 rounded-xl mb-1.5">
                    {isEmployer ? (
                      <>
                        <p className="text-xs font-bold text-slate-900 truncate">{companyName}</p>
                        <p className="text-xs text-blue-700 font-semibold truncate mt-0.5">Người đại diện: {representativeName}</p>
                        {branchName && <p className="text-xs text-slate-500 truncate mt-0.5">{branchName}</p>}
                      </>
                    ) : (
                      <p className="text-xs font-bold text-slate-900 truncate">{isStudent ? studentName : adminName}</p>
                    )}
                    <p className="text-xs text-slate-500 truncate mt-0.5">{currentUser?.email}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${roleConfig.badgeColor}`}>
                        {roleConfig.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${(currentUser?.is_banned || userStatus === 'inactive' || userStatus === 'cancelled')
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : (userStatus === 'paused'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${(currentUser?.is_banned || userStatus === 'inactive' || userStatus === 'cancelled')
                          ? 'bg-red-500'
                          : (userStatus === 'paused' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse')
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
                  <div className="p-1.5 space-y-1">

                    {/* Cập nhật hồ sơ & đổi mật khẩu */}
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          if (onOpenAccountModal) onOpenAccountModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-all text-left cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Cập nhật tài khoản cá nhân & đổi mật khẩu</span>
                      </button>

                    {/* Nút Hủy tài khoản (Dành cho Sinh viên & Nhà tuyển dụng) */}
                    {!isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          setDeleteModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-all text-left cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
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
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-all text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>

      </header>

      {/* CONFIRM DELETE ACCOUNT MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-rose-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-slate-900">Xác nhận hủy tài khoản</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Bạn có chắc chắn muốn <strong className="text-rose-700 font-bold">hủy tài khoản ({currentUser?.email})</strong>?
              Toàn bộ dữ liệu hồ sơ cá nhân và phiên đăng nhập sẽ bị vô hiệu hóa hoàn toàn theo chính sách bảo vệ dữ liệu.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 cursor-pointer whitespace-nowrap"
              >
                Không, giữ lại tài khoản
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteAccountSubmit}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md cursor-pointer transition-colors whitespace-nowrap"
              >
                {deleteLoading ? 'Đang xử lý...' : 'Xác nhận hủy tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
