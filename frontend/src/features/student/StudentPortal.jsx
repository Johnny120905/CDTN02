import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase, Search, Filter, Bookmark, Send, Clock,
  CheckCircle, CheckCircle2, XCircle, AlertCircle, FileText, Upload, Download,
  Trash2, Eye, Star, MessageSquare, Video, Bell, User,
  KeyRound, ChevronRight, ChevronLeft, Check, AlertTriangle, RefreshCw,
  Phone, Mic, MicOff, Camera, CameraOff, Paperclip, Menu,
  ArrowUpDown, X, Home, Activity, Flag, Edit,
  MoreVertical, FileCheck, Building, HelpCircle, ChevronDown, Heart,
  Calendar, CalendarDays, CheckSquare, Layers, MapPin, DollarSign,
  ShieldCheck, ExternalLink, ArrowLeft, ArrowRight, CornerDownRight,
  Coffee, ShoppingCart, GraduationCap, Package, Laptop, PartyPopper,
  Play
} from 'lucide-react';
import {
  PROFESSION_SUGGESTIONS,
  filterSuggestions,
  getStatusBadge,
  HCM_DISTRICTS,
  HCM_BRANCH_SUGGESTIONS,
  JOB_CATEGORIES,
  UNIVERSITY_SUGGESTIONS
} from '../../shared/professionSuggestions';
import { exportTablesToExcelHtml } from '../../shared/excelExportHelper';
import {
  VIETNAM_PROVINCES,
  PROVINCE_DISTRICTS_MAP,
  getDistrictsByProvince,
  SALARY_BRACKETS,
  WORK_SHIFTS
} from '../../shared/vietnamLocations';
import DocumentViewerModal from '../../shared/DocumentViewerModal';
import ConfirmDialog from '../../shared/ConfirmDialog';
import SearchableDropdownInput from '../../shared/SearchableDropdownInput';
import BannedKeywordWarning from '../../shared/BannedKeywordWarning';
import MediaAvatar from '../../shared/MediaAvatar';
import {
  getSocket,
  createPeerConnection,
  closePeerConnection,
  getLocalMediaStream,
  stopMediaStream,
  isSameChatList
} from '../../shared/webrtcSocketService';
import CallMediaLayer from '../../shared/CallMediaLayer';
import {
  removeVietnameseTones,
  parseSalaryNumber,
  matchKeywordFlexible,
  matchCategoryFlexible,
  matchShiftFlexible,
  matchSalaryBracketFlexible,
  matchLocationFlexible,
  matchPaymentTypeFlexible,
  normalizeJobStatus,
  getRoleToken,
  maskBannedWordsClient,
  buildApplicationChatRoomId,
  doesRoomMatchApplication,
  extractApplicationIdFromRoomId,
  normalizeShiftStatus,
  parseShiftHoursFromRecord,
  resolveShiftHourlyWage,
  getWeekBounds,
  doesShiftMatchWeek,
  doesShiftMatchDay,
  resolveShiftTimeMeta,
  computeAcceptedShiftsSummary
} from '../../shared/searchAndFilterHelper';

export default function StudentPortal({
  currentUser,
  onLogout,
  requestedMenu,
  onOpenAccountModal,
  chatDrawerOpen,
  onCloseChatDrawer,
  mobileSidebarOpen,
  onToggleMobileSidebar,
  headerSearchQuery = '',
  onSectionChange,
  onShowBanner,
  isGuestMode = false,
  onNavigateAuth
}) {
  const notify = (msg, type = 'success') => {
    if (onShowBanner) {
      onShowBanner(msg, type);
    }
  };
  // Navigation State - Mặc định luôn là 'home' (Trang chủ) khi mở mới bất kể phiên trước đó
  const [activeMenu, setActiveMenu] = useState('home'); // 'home' | 'jobs' | 'saved_jobs' | 'applications' | 'profile_cv' | 'reviews' | 'chat'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('partime_sidebar_collapsed_student') === 'true');
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('partime_sidebar_collapsed_student', String(next));
      return next;
    });
  };
  const [reviewTab, setReviewTab] = useState('pending'); // 'pending' | 'history' | 'received'
  const [userStatus, setUserStatus] = useState(currentUser?.profile?.status || currentUser?.status || 'active');

  // Slide-over pane for Job Detail & Company Profile Modal
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);
  const [companyProfileModal, setCompanyProfileModal] = useState(null);
  const [loadingCompanyProfile, setLoadingCompanyProfile] = useState(false);

  // Confetti Animation Trigger State
  const [showConfetti, setShowConfetti] = useState(false);

  // Contacts List for Student (Khởi tạo rỗng, tự động tải từ CSDL thật khi có đơn ứng tuyển)
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const selectedContactRef = useRef(selectedContact);
  selectedContactRef.current = selectedContact;
  const pendingRoomSelectRef = useRef('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  const getRoomId = (targetContact = selectedContactRef.current) => {
    if (!targetContact) return 'room_main';
    const stuId = currentUser?._id || currentUser?.id || 'student';
    const empId = targetContact.employer_id || targetContact.id;
    const appId = targetContact.application_id || (targetContact.job_id && targetContact._id && String(targetContact._id).startsWith('app_') ? targetContact._id : '');
    if (targetContact.room_id && String(targetContact.room_id).startsWith('room_emp_')) {
      if (!appId || String(targetContact.room_id).includes(`_app_${appId}`)) {
        return targetContact.room_id;
      }
    }
    return buildApplicationChatRoomId({ employerId: empId, studentUserId: stuId, applicationId: appId }) || `room_emp_${empId}_stu_${stuId}`;
  };

  // Data States
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [savedJobs, setSavedJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [myResumes, setMyResumes] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [profile, setProfile] = useState({
    full_name: isGuestMode ? '' : (currentUser?.profile?.full_name || currentUser?.full_name || ''),
    phone: isGuestMode ? '' : (currentUser?.profile?.phone || ''),
    university: isGuestMode ? '' : (currentUser?.profile?.university || ''),
    address: isGuestMode ? '' : (currentUser?.profile?.address || currentUser?.profile?.residence_address || ''),
    avatar_url: isGuestMode ? '' : (currentUser?.profile?.avatar_url || ''),
    cover_image_url: isGuestMode ? '' : (currentUser?.profile?.cover_image_url || ''),
    rating_avg: currentUser?.profile?.rating_avg || 5.0
  });

  // Sync profile when currentUser or isGuestMode changes
  useEffect(() => {
    if (isGuestMode || !currentUser) {
      setProfile({
        full_name: '',
        phone: '',
        university: '',
        address: '',
        avatar_url: '',
        cover_image_url: '',
        rating_avg: 5.0
      });
    } else {
      setProfile({
        full_name: currentUser?.profile?.full_name || currentUser?.full_name || '',
        phone: currentUser?.profile?.phone || '',
        university: currentUser?.profile?.university || '',
        address: currentUser?.profile?.address || currentUser?.profile?.residence_address || '',
        avatar_url: currentUser?.profile?.avatar_url || '',
        cover_image_url: currentUser?.profile?.cover_image_url || '',
        rating_avg: currentUser?.profile?.rating_avg || 5.0
      });
    }
  }, [currentUser, isGuestMode]);

  // Search & Filter (63 Tỉnh Thành, Đa Quận Huyện, Nhập tay, Ca làm, Khoảng lương theo giờ)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [customLocationText, setCustomLocationText] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState(''); // FR-SV-05.10: sau ca, theo tuần, theo tháng
  const [savedJobStatusFilter, setSavedJobStatusFilter] = useState('all'); // FR-SV-05.11: open, expiring_soon, closed
  const [jobPage, setJobPage] = useState(1);
  const JOBS_PER_PAGE = 10;
  const [heroKeyword, setHeroKeyword] = useState('');
  const [heroProvince, setHeroProvince] = useState('');

  // Lịch ca làm đã nhận (my_shifts) States (FR-SV-11.03)
  const [shiftFilterWeek, setShiftFilterWeek] = useState('current'); // 'prev' | 'current' | 'next'
  const [shiftFilterTime, setShiftFilterTime] = useState('all'); // 'all' | 'morning' | 'afternoon' | 'evening'
  const [shiftFilterBranch, setShiftFilterBranch] = useState('all'); // FR-SV-11.03: Lọc Chi nhánh
  const [shiftFilterStatus, setShiftFilterStatus] = useState('all'); // FR-SV-11.03: Sắp diễn ra, Đang làm việc, Đã hoàn thành, Đã hủy ca
  const [shiftStatuses, setShiftStatuses] = useState({
    'shift_demo_1': 'in_progress',
    'shift_demo_2': 'upcoming'
  });
  const [selectedShiftDetailModal, setSelectedShiftDetailModal] = useState(null);

  // Applications Filter (FR-SV-06.02 & FR-SV-06.06)
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusTab, setAppStatusTab] = useState('all'); // 6 chặng chuẩn: all | pending | reviewed | interview | accepted | rejected | cancelled
  const [appDateFilter, setAppDateFilter] = useState('all'); // FR-SV-06.06: all | 7days | 30days | custom
  const [appFromDate, setAppFromDate] = useState('');
  const [appToDate, setAppToDate] = useState('');
  const [selectedAppTimeline, setSelectedAppTimeline] = useState(null);

  // Profile Edit State with 10-Digit Phone Validator & Weekly Free Matrix
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    university: '',
    address: '',
    avatar_url: '',
    cover_image_url: ''
  });
  const [phoneError, setPhoneError] = useState('');
  const [profileSaveMsg, setProfileSaveMsg] = useState('');
  const [isDraggingStudentCover, setIsDraggingStudentCover] = useState(false);
  const [isDraggingStudentAvatar, setIsDraggingStudentAvatar] = useState(false);
  const [isUploadingStudentMedia, setIsUploadingStudentMedia] = useState(false);
  const [studentMediaProgress, setStudentMediaProgress] = useState(0);

  // CV Upload & Preview States
  const [newCvName, setNewCvName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [isDraggingCv, setIsDraggingCv] = useState(false);
  const [previewCvPdf, setPreviewCvPdf] = useState(null);
  const [replaceCvTarget, setReplaceCvTarget] = useState(null);

  // Application Modal (Nộp CV trực tiếp)
  const [applyModalJob, setApplyModalJob] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [cancellingAppId, setCancellingAppId] = useState(null);
  const [applyMsg, setApplyMsg] = useState({ text: '', type: '' });

  // Review Modal
  const [reviewModalJob, setReviewModalJob] = useState(null);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewHoverScore, setReviewHoverScore] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [replacingCvId, setReplacingCvId] = useState(null);
  const replaceCvInputRef = useRef(null);
  const [editingReviewModal, setEditingReviewModal] = useState(null);
  const [viewReviewDetailModal, setViewReviewDetailModal] = useState(null);
  const [isLoadingReviewDetail, setIsLoadingReviewDetail] = useState(false);
  const [confirmDialogConfig, setConfirmDialogConfig] = useState(null);

  // Report Modal (Violation Report - FR 1.5.7 & FR 1.8.5)
  const [reportModalData, setReportModalData] = useState(null); // { type: 'job' | 'chat', target_id, target_title }
  const [reportReason, setReportReason] = useState('');
  const [reportMsg, setReportMsg] = useState('');

  // WebRTC Two-Way Call State (FR 1.10.4)
  const [isVideoCalling, setIsVideoCalling] = useState(false);
  const [callType, setCallType] = useState('video'); // 'video' | 'audio'
  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'calling' | 'connected'
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const callActiveRef = useRef(false); // true khi đang trong cuộc gọi (đổ chuông hoặc đã kết nối)
  const callRoomIdRef = useRef(null);  // room của cuộc gọi hiện tại

  // Gắn lại luồng Video local/remote vào thẻ <video> sau mỗi lần render
  // (thẻ video bị mount/unmount khi đổi trạng thái gọi hoặc bật/tắt camera)
  useEffect(() => {
    const lv = localVideoRef.current;
    if (lv && localStreamRef.current && lv.srcObject !== localStreamRef.current) {
      lv.srcObject = localStreamRef.current;
    }
    const rv = remoteVideoRef.current;
    if (rv && remoteStreamRef.current && rv.srcObject !== remoteStreamRef.current) {
      rv.srcObject = remoteStreamRef.current;
      const p = rv.play && rv.play();
      if (p && p.catch) p.catch(() => {});
    }
  });

  // Chat State (Khởi tạo rỗng, tự động tải lịch sử thực tế từ CSDL)
  const [chatMessages, setChatMessages] = useState([]);
  const [bannedKeywords, setBannedKeywords] = useState([]);
  const [chatUnrepliedOnly, setChatUnrepliedOnly] = useState(false);
  const [newMsgText, setNewMsgText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatAttachment, setChatAttachment] = useState(null); // { file, name, size, type, base64, sizeStr }
  const [chatPreviewDoc, setChatPreviewDoc] = useState(null);
  const chatFileInputRef = useRef(null);

  const token = isGuestMode ? null : getRoleToken('student');
  const headers = token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' };

  // Sync section title with parent - 9 Mục Sinh Viên chuẩn
  const sectionTitleMap = {
    home: 'Trang chủ',
    jobs: 'Khám phá việc làm',
    saved_jobs: 'Việc làm đã lưu',
    applications: 'Tiến độ ứng tuyển',
    my_shifts: 'Lịch ca làm đã nhận',
    profile_cv: 'Quản lý CV',
    student_profile: 'Hồ sơ cá nhân',
    reviews: 'Đánh giá 2 chiều',
    my_reports: 'Báo cáo vi phạm đã gửi',
    chat: 'Tin nhắn & Phỏng vấn'
  };

  useEffect(() => {
    localStorage.setItem('partime_active_menu_student', activeMenu);
  }, [activeMenu]);

  const handleMenuSwitch = (menuId) => {
    setActiveMenu(menuId);
    if (menuId === 'jobs' || menuId === 'saved_jobs') fetchJobs();
    else if (menuId === 'applications' || menuId === 'my_shifts') fetchApplications();
    else if (menuId === 'profile_cv') fetchResumes();
    else if (menuId === 'student_profile') fetchProfile();
    else if (menuId === 'reviews') fetchReviews();
    else if (menuId === 'my_reports') fetchMyReports();
    if (onSectionChange) onSectionChange(sectionTitleMap[menuId] || 'Trang chủ');
    window.scrollTo(0, 0);
  };

  // Sync header search
  useEffect(() => {
    if (headerSearchQuery !== undefined) {
      setSearchQuery(headerSearchQuery);
      if (headerSearchQuery && activeMenu !== 'jobs') {
        handleMenuSwitch('jobs');
      }
    }
  }, [headerSearchQuery]);

  // Sync requestedMenu from Header dropdown / Logo (Cho phép nhấp logo nhiều lần quay về Trang chủ)
  useEffect(() => {
    if (requestedMenu) {
      const targetMenu = typeof requestedMenu === 'object' ? requestedMenu.id : requestedMenu;
      const requestedRoomId = typeof requestedMenu === 'object' ? String(requestedMenu.roomId || '').trim() : '';
      if (targetMenu === 'account' && onOpenAccountModal) {
        onOpenAccountModal();
      } else if (targetMenu) {
        if (targetMenu === 'chat' && requestedRoomId) {
          pendingRoomSelectRef.current = requestedRoomId;
          const reqAppId = extractApplicationIdFromRoomId(requestedRoomId);
          const matchedContact = contacts.find(c =>
            (c.room_id && c.room_id === requestedRoomId) ||
            (reqAppId && c.application_id === reqAppId) ||
            doesRoomMatchApplication(requestedRoomId, { employerId: c.employer_id, applicationId: c.application_id })
          );
          if (matchedContact) {
            setSelectedContact(matchedContact);
            pendingRoomSelectRef.current = '';
          }
        }
        handleMenuSwitch(targetMenu);
      }
    }
  }, [requestedMenu]);

  // Tải dữ liệu ban đầu khi đăng nhập (Không chạy setInterval ngầm để tránh lag giật web)
  useEffect(() => {
    fetchAllData();
  }, [token, isGuestMode, currentUser?._id || currentUser?.id]);

  // Reset toàn bộ dữ liệu nội bộ sinh viên khi đăng xuất hoặc ở chế độ khách
  useEffect(() => {
    if (isGuestMode || !token || !currentUser) {
      setBookmarkedIds(new Set());
      setSavedJobs([]);
      setMyApplications([]);
      setMyResumes([]);
      setMyReviews([]);
      setReceivedReviews([]);
      setMyReports([]);
      setContacts([]);
      setSelectedContact(null);
      setChatMessages([]);
      setIsVideoCalling(false);
      setIncomingCall(null);
      setCallStatus('idle');
      if (activeMenu === 'chat') {
        setActiveMenu('home');
      }
    }
  }, [isGuestMode, token, currentUser]);

  const fetchAllData = () => {
    fetchJobs();
    fetchCategories();
    fetchBannedKeywords();
    if (!isGuestMode && token && currentUser) {
      fetchBookmarks();
      fetchApplications();
      fetchResumes();
      fetchReviews();
      fetchProfile();
      fetchMyReports();
    } else if (isGuestMode || !currentUser) {
      setBookmarkedIds(new Set());
      setSavedJobs([]);
      setMyApplications([]);
      setMyResumes([]);
      setMyReviews([]);
      setReceivedReviews([]);
      setMyReports([]);
      setReceivedReviews([]);
      setMyReports([]);
      setContacts([]);
      setSelectedContact(null);
      setChatMessages([]);
    }
  };

  // Socket.IO Room Joining & WebRTC P2P Signaling Listeners (FR 1.10.4)
  const currentRoomKey = getRoomId(); // chuỗi ổn định -> effect không chạy lại khi object selectedContact đổi tham chiếu
  useEffect(() => {
    if (!token) return;
    const socket = getSocket();
    const currentRoomId = currentRoomKey;
    const stuId = currentUser?._id || currentUser?.id || 'student';
    const registerStudentIdentity = () => {
      const aliasIds = [
        currentUser?._id,
        currentUser?.id,
        profile?._id,
        profile?.user_id
      ].filter(Boolean);
      socket.emit('register-user', {
        user_id: stuId,
        role: 'student',
        aliases: aliasIds
      });
      if (currentRoomId) {
        socket.emit('join-room', {
          room_id: currentRoomId,
          user_id: stuId,
          role: 'student'
        });
      }
    };
    registerStudentIdentity();
    socket.on('connect', registerStudentIdentity);

    const onIncomingCall = (data) => {
      if (data.caller_role === 'employer' && !callActiveRef.current) {
        setIncomingCall(prev => {
          const mergedOffer = data.offer || prev?.offer;
          return { ...data, offer: mergedOffer };
        });
        setCallType(data.call_type || 'video');
      }
    };

    const onAnswerMade = async (data) => {
      if (peerConnectionRef.current && data.answer) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          while (pendingIceCandidatesRef.current.length > 0) {
            const cand = pendingIceCandidatesRef.current.shift();
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(cand));
          }
          setCallStatus('connected');
          if (onShowBanner) onShowBanner('Đã kết nối WebRTC P2P thành công!', 'success');
        } catch (e) {
          console.warn('[WebRTC] Remote answer error:', e);
        }
      }
    };

    const onReceiveCandidate = async (data) => {
      if (data.candidate) {
        if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.warn('[WebRTC] Candidate error:', e);
          }
        } else {
          pendingIceCandidatesRef.current.push(data.candidate);
        }
      }
    };

    const onCallEnded = () => {
      // Người gọi huỷ khi đang đổ chuông -> tắt popup cuộc gọi đến
      setIncomingCall(null);
      if (callActiveRef.current) {
        handleEndCall(false);
      }
      if (onShowBanner) onShowBanner('Doanh nghiệp đã kết thúc cuộc gọi.', 'success');
      fetchChatMessages();
    };

    const onCallRejected = () => {
      if (callActiveRef.current) {
        handleEndCall(false);
      }
      if (onShowBanner) onShowBanner('Doanh nghiệp đã từ chối cuộc gọi.', 'error');
      fetchChatMessages();
    };

    const onNewChatMessage = (msg) => {
      if (!msg) return;
      const curContact = selectedContactRef.current;
      const activeAppId = curContact?.application_id;
      const msgAppId = extractApplicationIdFromRoomId(msg.room_id);
      const belongsToOpenRoom = curContact && (
        !msg.room_id ||
        msg.room_id === getRoomId(curContact) ||
        (activeAppId && msgAppId && String(activeAppId) === String(msgAppId)) ||
        (!activeAppId && !msgAppId && doesRoomMatchApplication(msg.room_id, { employerId: curContact.employer_id || curContact.id }))
      );
      if (belongsToOpenRoom) {
        setChatMessages(prev => (prev.some(m => m._id === msg._id) ? prev : [...prev, msg]));
      }
      setContacts(prev => prev.map(c => {
        const roomMatches = doesRoomMatchApplication(msg.room_id, {
          employerId: c.employer_id || c.id,
          applicationId: c.application_id
        });
        if (!roomMatches) return c;
        return {
          ...c,
          lastMsg: msg.content || c.lastMsg,
          lastMessage: msg.content || c.lastMessage,
          time: msg.created_at || c.time,
          hasMessages: true,
          unreplied: msg.sender_role === 'employer'
        };
      }));
    };

    socket.on('incoming-call', onIncomingCall);
    socket.on('answer-made', onAnswerMade);
    socket.on('receive-candidate', onReceiveCandidate);
    socket.on('call-ended', onCallEnded);
    socket.on('call-rejected', onCallRejected);
    socket.on('new-chat-message', onNewChatMessage);

    const onAppStatusChanged = () => {
      fetchApplications();
      fetchJobs();
      fetchBookmarks();
    };
    const onGlobalRefresh = () => {
      fetchJobs();
      fetchCategories();
      fetchApplications();
      fetchReviews();
    };
    socket.on('application-status-updated', onAppStatusChanged);
    socket.on('applicant-withdrawn', onAppStatusChanged);
    socket.on('shift-status-updated', onAppStatusChanged);
    socket.on('job-status-updated', onAppStatusChanged);
    socket.on('job-updated', onGlobalRefresh);
    socket.on('employer-profile-updated', onGlobalRefresh);
    socket.on('new-job', onGlobalRefresh);
    socket.on('user-status-updated', onGlobalRefresh);
    socket.on('categories-updated', fetchCategories);
    socket.on('banned-keywords-updated', fetchBannedKeywords);
    const onReportUpdated = () => {
      fetchMyReports();
    };
    const onNotificationSynced = (notif) => {
      if (!notif) return;
      const t = String(notif.type || '').toLowerCase();
      if (t.includes('report')) {
        fetchMyReports();
      } else if (t.includes('review')) {
        fetchReviews();
      }
    };
    socket.on('new-review', fetchReviews);
    socket.on('review-updated', fetchReviews);
    socket.on('report-updated', onReportUpdated);
    socket.on('new-notification', onNotificationSynced);

    return () => {
      socket.off('connect', registerStudentIdentity);
      socket.off('incoming-call', onIncomingCall);
      socket.off('answer-made', onAnswerMade);
      socket.off('receive-candidate', onReceiveCandidate);
      socket.off('call-ended', onCallEnded);
      socket.off('call-rejected', onCallRejected);
      socket.off('new-chat-message', onNewChatMessage);
      socket.off('application-status-updated', onAppStatusChanged);
      socket.off('applicant-withdrawn', onAppStatusChanged);
      socket.off('shift-status-updated', onAppStatusChanged);
      socket.off('job-status-updated', onAppStatusChanged);
      socket.off('job-updated', onGlobalRefresh);
      socket.off('employer-profile-updated', onGlobalRefresh);
      socket.off('new-job', onGlobalRefresh);
      socket.off('user-status-updated', onGlobalRefresh);
      socket.off('categories-updated', fetchCategories);
      socket.off('banned-keywords-updated', fetchBannedKeywords);
      socket.off('new-review', fetchReviews);
      socket.off('review-updated', fetchReviews);
      socket.off('report-updated', onReportUpdated);
      socket.off('new-notification', onNotificationSynced);
    };
  }, [token, isGuestMode, isVideoCalling, currentRoomKey, currentUser?._id]);

  // Kiểm tra cuộc gọi đến dự phòng (3s - chỉ kiểm tra khi rảnh, đọc nhanh từ RAM máy chủ để chắc chắn 100% hiện popup bắt máy)
  useEffect(() => {
    if (!token) return;
    const checkCallStatus = async () => {
      if (typeof document !== 'undefined' && document.hidden && !callActiveRef.current) return;
      try {
        const res = await fetch(`/api/chat/call/status?room_id=${getRoomId()}`, { headers });
        const data = await res.json();
        if (data.success && data.call && data.call.status === 'ringing') {
          if (data.call.caller_role === 'employer' && !callActiveRef.current) {
            setIncomingCall(prev => {
              const mergedOffer = data.call.offer || prev?.offer;
              return { ...data.call, offer: mergedOffer };
            });
            setCallType(data.call.call_type || 'video');
          }
        } else if (callActiveRef.current && peerConnectionRef.current && data?.call?.answer && !peerConnectionRef.current.remoteDescription) {
          try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.call.answer));
            while (pendingIceCandidatesRef.current.length > 0) {
              const cand = pendingIceCandidatesRef.current.shift();
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(cand));
            }
            setCallStatus('connected');
          } catch (e) {}
        }
      } catch (e) {}
    };
    const timer = setInterval(checkCallStatus, 6000);
    return () => clearInterval(timer);
  }, [token, isVideoCalling, incomingCall]);

  // Đồng bộ nền dự phòng 15s (đã có Socket.IO đẩy realtime tức thì)
  useEffect(() => {
    if (!token || isGuestMode) return;
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (['jobs', 'saved_jobs', 'home'].includes(activeMenu)) {
        fetchJobs();
        fetchBookmarks();
        fetchApplications();
        fetchResumes();
      } else if (['applications', 'my_shifts'].includes(activeMenu)) {
        fetchApplications();
      } else if (activeMenu === 'reviews') {
        fetchReviews();
        fetchApplications();
      } else if (activeMenu === 'my_reports') {
        fetchMyReports();
      } else if (activeMenu === 'chat') {
        if (selectedContactRef.current) {
          fetchChatMessages(selectedContactRef.current);
        }
        fetchApplications();
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [token, isGuestMode, activeMenu, currentRoomKey]);

  // Tự động tải tin nhắn ngay khi mở tab Chat hoặc chọn doanh nghiệp khác
  useEffect(() => {
    if (!token || isGuestMode || activeMenu !== 'chat') return;
    if (selectedContactRef.current) {
      fetchChatMessages(selectedContactRef.current);
    } else {
      setChatMessages([]);
    }
  }, [token, isGuestMode, activeMenu, currentRoomKey]);

  // WebRTC Call Timer & Media Toggle Handlers
  useEffect(() => {
    let timer = null;
    if (isVideoCalling && callStatus === 'connected') {
      timer = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else if (!isVideoCalling) {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isVideoCalling, callStatus]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isCameraOff;
      });
    }
  }, [isCameraOff]);

  const handleStartCall = async (type = 'video') => {
    setCallType(type);
    setIsVideoCalling(true);
    setCallStatus('calling');
    setHasRemoteVideo(false);
    pendingIceCandidatesRef.current = [];

    const socket = getSocket();
    const currentRoomId = getRoomId();
    callActiveRef.current = true;
    callRoomIdRef.current = currentRoomId;
    setIsMuted(false);
    setIsCameraOff(false);

    try {
      const stream = await getLocalMediaStream(type);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection({
        onRemoteStream: (remoteStream) => {
          remoteStreamRef.current = remoteStream;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          setHasRemoteVideo(remoteStream.getVideoTracks().length > 0);
          setCallStatus('connected');
        },
        onIceCandidate: (candidate) => {
          socket.emit('send-candidate', {
            room_id: currentRoomId,
            candidate
          });
        },
        onConnectionStateChange: (state) => {
          if (state === 'connected') {
            setCallStatus('connected');
          }
        }
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video'
      });
      await pc.setLocalDescription(offer);

      socket.emit('call-user', {
        room_id: currentRoomId,
        caller_name: currentUser?.profile?.full_name || currentUser?.full_name || 'Sinh viên',
        caller_role: 'student',
        target_user_id: selectedContact?.employer_user_id || selectedContact?.employer_id || selectedContact?.id,
        call_type: type,
        offer: offer
      });

      // REST persistence
      await fetch('/api/chat/call/initiate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ room_id: currentRoomId, call_type: type, offer: offer })
      });
      if (onShowBanner) onShowBanner(`Đang đổ chuông cuộc gọi ${type === 'video' ? 'Video' : 'Thoại'} tới Doanh nghiệp...`, 'loading');
    } catch (e) {
      console.warn('[WebRTC Call Error]', e);
      await handleEndCall(false, true);
      notify('Không thể truy cập Camera/Micro.', 'error');
    }
  };

  const handleAnswerIncomingCall = async () => {
    if (!incomingCall) return;
    const socket = getSocket();
    const currentRoomId = incomingCall.room_id || getRoomId();
    const type = incomingCall.call_type || 'video';
    callActiveRef.current = true;
    callRoomIdRef.current = currentRoomId;

    // Chuyển sang màn hình Tin nhắn & chọn đúng đơn ứng tuyển / doanh nghiệp đang gọi để hiện đủ nút Mic / Camera / Kết thúc
    const incomingAppId = extractApplicationIdFromRoomId(currentRoomId);
    const callerContact =
      contacts.find(c =>
        (c.room_id && c.room_id === currentRoomId) ||
        (incomingAppId && c.application_id && String(c.application_id) === String(incomingAppId)) ||
        doesRoomMatchApplication(currentRoomId, { employerId: c.employer_id || c.id, applicationId: c.application_id })
      ) ||
      contacts.find(c => !incomingAppId && currentRoomId.startsWith(`room_emp_${c.employer_id || c.id}_stu_`));
    if (callerContact) {
      setSelectedContact(callerContact);
    } else if (!selectedContact && contacts.length > 0) {
      setSelectedContact(contacts[0]);
    } else if (!selectedContact) {
      setSelectedContact({
        id: incomingAppId || incomingCall.caller_id || 'emp_partner',
        application_id: incomingAppId || '',
        room_id: currentRoomId,
        employer_id: incomingCall.caller_id,
        name: incomingCall.caller_name || 'Doanh nghiệp',
        online: true,
        subtitle: 'Nhà tuyển dụng'
      });
    }
    setActiveMenu('chat');

    setCallType(type);
    const callToAnswer = { ...incomingCall };
    setIncomingCall(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsVideoCalling(true);
    setCallStatus('connected');
    setHasRemoteVideo(false);

    try {
      const stream = await getLocalMediaStream(type);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection({
        onRemoteStream: (remoteStream) => {
          remoteStreamRef.current = remoteStream;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          setHasRemoteVideo(remoteStream.getVideoTracks().length > 0);
          setCallStatus('connected');
        },
        onIceCandidate: (candidate) => {
          socket.emit('send-candidate', {
            room_id: currentRoomId,
            candidate
          });
        }
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Lấy offer: từ callToAnswer hoặc truy vấn từ server nếu socket bị trễ
      let offer = callToAnswer.offer;
      if (!offer) {
        try {
          const res = await fetch(`/api/chat/call/status?room_id=${encodeURIComponent(currentRoomId)}`, { headers });
          const statusData = await res.json();
          if (statusData?.call?.offer) {
            offer = statusData.call.offer;
          }
        } catch (err) {}
      }

      if (offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        while (pendingIceCandidatesRef.current.length > 0) {
          const cand = pendingIceCandidatesRef.current.shift();
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('make-answer', {
          room_id: currentRoomId,
          answer: answer
        });

        // REST persistence kèm answer để dự phòng
        await fetch('/api/chat/call/respond', {
          method: 'POST',
          headers,
          body: JSON.stringify({ room_id: currentRoomId, action: 'accept', answer: answer })
        });
      } else {
        // Dự phòng: nếu không tìm thấy offer thì tự tạo offer để kết nối thông suốt 2 chiều
        const newOffer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: type === 'video' });
        await pc.setLocalDescription(newOffer);
        socket.emit('call-user', {
          room_id: currentRoomId,
          caller_name: currentUser?.profile?.full_name || currentUser?.full_name || 'Sinh viên',
          caller_role: 'student',
          target_user_id: selectedContact?.employer_user_id || selectedContact?.employer_id || selectedContact?.id,
          call_type: type,
          offer: newOffer
        });
        await fetch('/api/chat/call/respond', {
          method: 'POST',
          headers,
          body: JSON.stringify({ room_id: currentRoomId, action: 'accept' })
        });
      }

      if (onShowBanner) onShowBanner('Đã kết nối cuộc gọi phỏng vấn thành công!', 'success');
    } catch (e) {
      console.warn('[WebRTC Answer Error]', e);
      await handleEndCall(true, true);
      notify('Lỗi kết nối WebRTC hoặc không truy cập được Camera/Micro.', 'error');
    }
  };

  const handleDeclineIncomingCall = async () => {
    if (!incomingCall) return;
    const socket = getSocket();
    const currentRoomId = incomingCall.room_id || getRoomId();
    socket.emit('reject-call', { room_id: currentRoomId });
    try {
      await fetch('/api/chat/call/respond', {
        method: 'POST',
        headers,
        body: JSON.stringify({ room_id: currentRoomId, action: 'decline' })
      });
    } catch (e) { }
    setIncomingCall(null);
    if (onShowBanner) onShowBanner('Đã từ chối cuộc gọi.', 'error');
    fetchChatMessages();
  };

  const handleEndCall = async (notifyBackend = true, silent = false) => {
    const socket = getSocket();
    const currentRoomId = callRoomIdRef.current || getRoomId();

    // Chỉ phát tín hiệu 'end-call' khi CHÍNH MÌNH bấm kết thúc.
    // (Nếu phát lại khi nhận 'call-ended' sẽ tạo vòng lặp vô hạn giữa 2 máy -> gọi liên tục & giật khung chat)
    if (notifyBackend && callActiveRef.current) {
      socket.emit('end-call', { room_id: currentRoomId });
    }
    const wasActive = callActiveRef.current;
    const finalDuration = callDuration;
    const finalType = callType;
    callActiveRef.current = false;
    callRoomIdRef.current = null;

    if (peerConnectionRef.current) {
      closePeerConnection(peerConnectionRef.current);
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      stopMediaStream(localStreamRef.current);
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    pendingIceCandidatesRef.current = [];
    setHasRemoteVideo(false);
    setIncomingCall(null);
    setIsMuted(false);
    setIsCameraOff(false);

    if (notifyBackend) {
      try {
        await fetch('/api/chat/call/end', {
          method: 'POST',
          headers,
          body: JSON.stringify({ room_id: currentRoomId, duration: finalDuration, call_type: finalType })
        });
      } catch (e) { }
    }
    setIsVideoCalling(false);
    setCallStatus('idle');
    setCallDuration(0);
    if (wasActive && !silent) {
      if (onShowBanner) {
        onShowBanner(null);
        setTimeout(() => onShowBanner('Cuộc gọi đã kết thúc.', 'success', 2500), 50);
      }
    }
    fetchChatMessages();
  };

  // API Calls
  const fetchJobs = async (explicitIds = []) => {
    try {
      const mergedIds = new Set([
        ...(Array.isArray(explicitIds) ? explicitIds : []),
        ...myApplications.map(a => a.job_id),
        ...Array.from(bookmarkedIds || [])
      ].filter(Boolean));
      const url = mergedIds.size > 0
        ? `/api/jobs?include_ids=${encodeURIComponent(Array.from(mergedIds).join(','))}`
        : '/api/jobs';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setJobs(data.data);
        setSelectedJobDetail(prev => prev ? (data.data.find(j => j._id === prev._id) || prev) : null);
      }
    } catch (err) {
      console.warn('Could not fetch jobs:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (err) {
      console.warn('Could not fetch categories:', err);
    }
  };

  const fetchBannedKeywords = async () => {
    try {
      const res = await fetch('/api/banned-keywords');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBannedKeywords(data.data);
      }
    } catch (err) {
      console.warn('Could not fetch banned keywords:', err);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const res = await fetch('/api/student/bookmarks', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSavedJobs(data.data);
        setBookmarkedIds(new Set(data.data.map(j => j._id)));
      }
    } catch (err) {
      console.warn('Could not fetch bookmarks:', err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/student/applications', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMyApplications(data.data);

        // Mỗi đơn ứng tuyển sở hữu 1 phòng chat riêng biệt (tách biệt theo application_id)
        const contactList = [];
        const stuUserId = currentUser?._id || currentUser?.id || 'student';

        data.data.forEach(app => {
          const empId = app.employer_id;
          if (!empId) return;
          const compName = (app.company_name && app.company_name !== 'Doanh nghiệp')
            ? app.company_name
            : (app.company_name || 'Doanh nghiệp');
          const isInactiveApp = app.application_status === 'cancelled' || app.application_status === 'withdrawn' || app.is_cancelled;
          const roomId = app.room_id || buildApplicationChatRoomId({ employerId: empId, studentUserId: stuUserId, applicationId: app._id });
          contactList.push({
            id: app._id,
            application_id: app._id,
            room_id: roomId,
            employer_id: empId,
            job_id: app.job_id,
            job_title: app.job_title || '',
            name: compName,
            company_name: compName,
            subtitle: `Ứng tuyển: ${app.job_title}`,
            role: 'employer',
            email: '',
            online: true,
            lastMsg: app.last_message || `Đơn ứng tuyển: ${app.job_title}`,
            lastMessage: app.last_message || `Đơn ứng tuyển: ${app.job_title}`,
            time: app.last_message_at || app.applied_at || 'Mới ứng tuyển',
            hasMessages: Boolean(app.last_message),
            isInactiveApp,
            unread: 0,
            unreplied: app.unreplied ?? (app.application_status === 'pending'),
            application_status: app.application_status
          });
        });

        // Ưu tiên hội thoại đang hoạt động & đã có tin nhắn lên đầu danh sách
        contactList.sort((a, b) => {
          if (a.hasMessages !== b.hasMessages) return a.hasMessages ? -1 : 1;
          if (a.isInactiveApp !== b.isInactiveApp) return a.isInactiveApp ? 1 : -1;
          return 0;
        });

        const appJobIds = data.data.map(a => a.job_id).filter(Boolean);
        const hasMissingAppliedJobs = appJobIds.some(jid => !jobs.some(j => j._id === jid));
        if (appJobIds.length > 0 && hasMissingAppliedJobs && ['home', 'jobs', 'saved_jobs'].includes(activeMenu)) {
          fetchJobs(appJobIds);
        }

        if (contactList.length > 0) {
          setContacts(prev => {
            if (
              prev.length === contactList.length &&
              prev.every((c, i) => c.id === contactList[i].id && c.room_id === contactList[i].room_id && c.lastMsg === contactList[i].lastMsg && c.unreplied === contactList[i].unreplied)
            ) {
              return prev;
            }
            return contactList;
          });
          setSelectedContact(prev => {
            if (pendingRoomSelectRef.current) {
              const reqRoom = pendingRoomSelectRef.current;
              const reqAppId = extractApplicationIdFromRoomId(reqRoom);
              const fromNotif = contactList.find(c =>
                (c.room_id && c.room_id === reqRoom) ||
                (reqAppId && c.application_id === reqAppId) ||
                doesRoomMatchApplication(reqRoom, { employerId: c.employer_id, applicationId: c.application_id })
              );
              if (fromNotif) {
                pendingRoomSelectRef.current = '';
                return fromNotif;
              }
            }
            if (!prev) return contactList[0];
            const matched = contactList.find(c =>
              (c.application_id && prev.application_id && c.application_id === prev.application_id) ||
              (c.room_id && prev.room_id && c.room_id === prev.room_id) ||
              c.id === prev.id
            );
            if (!matched) return contactList[0];
            if (
              prev.name === matched.name &&
              prev.lastMsg === matched.lastMsg &&
              prev.time === matched.time &&
              prev.unreplied === matched.unreplied &&
              prev.subtitle === matched.subtitle &&
              prev.application_status === matched.application_status
            ) {
              return prev;
            }
            return matched;
          });
        } else {
          setContacts([]);
          setSelectedContact(null);
          setChatMessages([]);
        }
      }
    } catch (err) {
      console.warn('Could not fetch applications:', err);
    }
  };

  const fetchResumes = async () => {
    try {
      const res = await fetch('/api/student/resumes', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMyResumes(data.data);
        const def = data.data.find(r => r.is_default);
        if (def) setSelectedResumeId(def._id);
        else if (data.data.length > 0) setSelectedResumeId(data.data[0]._id);
      }
    } catch (err) {
      console.warn('Could not fetch resumes:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/student/reviews', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMyReviews(data.data);
      }
      if (data.success && Array.isArray(data.received_reviews)) {
        setReceivedReviews(data.received_reviews);
      }
    } catch (err) {
      console.warn('Could not fetch reviews:', err);
    }
  };

  const fetchMyReports = async () => {
    if (isGuestMode || !token) return;
    try {
      const res = await fetch('/api/reports/mine', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMyReports(data.data);
      }
    } catch (err) {
      console.warn('Could not fetch my reports:', err);
    }
  };

  const handleOpenCompanyProfile = async (jobOrApp, e) => {
    if (e) e.stopPropagation();
    const ref = jobOrApp?.employer_id || jobOrApp?.company_name;
    if (!ref) return;
    setLoadingCompanyProfile(true);
    setCompanyProfileModal({
      company_name: jobOrApp.company_name || 'Doanh nghiệp',
      logo_url: jobOrApp.company_logo || '',
      cover_image_url: '',
      address: jobOrApp.location || '',
      branch_name: jobOrApp.branch_name || '',
      scale: '',
      rating_avg: 5.0,
      review_count: 0,
      reviews: [],
      jobs: []
    });
    try {
      const res = await fetch(`/api/companies/${encodeURIComponent(ref)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setCompanyProfileModal(data.data);
      }
    } catch (err) {
      console.warn('Could not load company profile:', err);
    } finally {
      setLoadingCompanyProfile(false);
    }
  };

  const handleStudentMediaProcess = (field, file) => {
    if (!file) return;
    const isValidImg = ['image/png', 'image/jpeg', 'image/jpg'].includes((file.type || '').toLowerCase()) || /\.(png|jpe?g)$/i.test(file.name || '');
    if (!isValidImg) {
      notify('Vui lòng chỉ chọn tệp ảnh định dạng .png, .jpg hoặc .jpeg (≤ 10MB)!', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify('Dung lượng ảnh tải lên không được vượt quá 10MB!', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setProfile(prev => ({ ...prev, [field]: dataUrl }));
      setProfileForm(prev => ({ ...prev, [field]: dataUrl }));
      setIsUploadingStudentMedia(true);
      setStudentMediaProgress(45);
      try {
        const res = await fetch('/api/student/profile', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ [field]: dataUrl })
        });
        const data = await res.json();
        setStudentMediaProgress(100);
        if (data.success && data.data) {
          setProfile(data.data);
          setProfileForm(prev => ({ ...prev, [field]: data.data[field] || '' }));
          notify(`Đã cập nhật ${field === 'cover_image_url' ? 'Ảnh bìa' : 'Ảnh đại diện'} thành công!`, 'success');
        } else {
          notify(data.message || 'Lỗi lưu hình ảnh.', 'error');
        }
      } catch (err) {
        notify('Lỗi kết nối khi lưu hình ảnh.', 'error');
      } finally {
        setTimeout(() => {
          setIsUploadingStudentMedia(false);
          setStudentMediaProgress(0);
        }, 300);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetStudentMediaToDefault = async (field) => {
    setProfile(prev => ({ ...prev, [field]: '' }));
    setProfileForm(prev => ({ ...prev, [field]: '' }));
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ [field]: '' })
      });
      const data = await res.json();
      if (data.success) {
        notify(`Đã xóa ${field === 'cover_image_url' ? 'Ảnh bìa' : 'Ảnh đại diện'} về mặc định!`, 'success');
      }
    } catch (err) {}
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/student/profile', { headers });
      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
        setProfileForm({
          full_name: data.data.full_name || '',
          phone: data.data.phone || '',
          university: data.data.university || '',
          address: data.data.address || data.data.residence_address || '',
          avatar_url: data.data.avatar_url || '',
          cover_image_url: data.data.cover_image_url || ''
        });
      }
    } catch (err) {
      console.warn('Could not fetch profile:', err);
    }
  };

  const fetchChatMessages = async (targetContact = null) => {
    if (isGuestMode || !token || !currentUser) {
      setChatMessages([]);
      return;
    }
    const contactToFetch = targetContact || selectedContactRef.current;
    if (!contactToFetch) {
      setChatMessages([]);
      return;
    }
    const roomId = getRoomId(contactToFetch);
    try {
      const res = await fetch(`/api/chat/messages?room_id=${encodeURIComponent(roomId)}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Chỉ cập nhật khi tin nhắn thực sự thay đổi -> không re-render/giật khung chat
        setChatMessages(prev => (isSameChatList(prev, data.data) ? prev : data.data));
      }
    } catch (err) {
      console.warn('Chat message fetch fallback:', err);
    }
  };

  // Tự động tải lại tin nhắn khi sinh viên chọn nhà tuyển dụng khác
  useEffect(() => {
    if (selectedContact) {
      fetchChatMessages(selectedContact);
    } else {
      setChatMessages([]);
    }
  }, [currentRoomKey]);

  // Open Apply Modal helper with Guest check & auto-select default CV
  const handleOpenApplyModal = (job) => {
    if (isGuestMode || !token) {
      if (onShowBanner) onShowBanner('Bạn cần Đăng ký hoặc Đăng nhập tài khoản Sinh viên để nộp hồ sơ ứng tuyển công việc này!', 'error');
      if (onNavigateAuth) onNavigateAuth('login', 'student');
      return;
    }
    const defaultCv = myResumes.find(r => r.is_default) || myResumes[0];
    setSelectedResumeId(defaultCv ? defaultCv._id : '');
    setApplyModalJob(job);
  };

  // Toggle Bookmark with persistent backend sync & toast notification
  const handleToggleBookmark = async (jobId) => {
    if (isGuestMode || !token) {
      if (onShowBanner) onShowBanner('Vui lòng Đăng nhập tài khoản Sinh viên để lưu việc làm yêu thích!', 'error');
      if (onNavigateAuth) onNavigateAuth('login', 'student');
      return;
    }
    const isSaved = bookmarkedIds.has(jobId);
    const next = new Set(bookmarkedIds);
    if (isSaved) {
      next.delete(jobId);
      setSavedJobs(prev => prev.filter(j => j._id !== jobId));
    } else {
      next.add(jobId);
      const foundJob = jobs.find(j => j._id === jobId);
      if (foundJob) {
        setSavedJobs(prev => prev.some(j => j._id === jobId) ? prev : [foundJob, ...prev]);
      }
    }
    setBookmarkedIds(next);

    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const res = await fetch(`/api/student/bookmarks/${jobId}`, { method, headers });
      const data = await res.json();
      if (data.success) {
        notify(
          data.message || (isSaved ? 'Đã xóa việc làm khỏi danh sách đã lưu thành công!' : 'Đã lưu việc làm yêu thích thành công!'),
          'success'
        );
        fetchBookmarks();
      } else {
        notify(data.message || 'Không thể cập nhật danh sách việc làm đã lưu.', 'error');
        fetchBookmarks();
      }
    } catch (err) {
      notify('Lỗi kết nối máy chủ khi cập nhật việc làm đã lưu.', 'error');
    }
  };

  // Submit Application with Confetti Effect (FR 1.5.6 & UI-SV-APP-01) - Tệp CV PDF tiêu chuẩn
  const handleApplyJobSubmit = async (e) => {
    e.preventDefault();
    if (!applyModalJob) return;
    setApplyLoading(true);
    setApplyMsg({ text: '', type: '' });

    try {
      const res = await fetch(`/api/student/applications/${applyModalJob._id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          resume_id: selectedResumeId
        })
      });
      const data = await res.json();
      if (data.success) {
        setApplyMsg({ text: 'Nộp hồ sơ ứng tuyển thành công! Thông báo đã gửi tới Doanh nghiệp.', type: 'success' });
        fetchApplications();
        setTimeout(() => {
          setApplyModalJob(null);
          setApplyMsg({ text: '', type: '' });
        }, 1200);
      } else {
        setApplyMsg({ text: data.message || 'Ứng tuyển không thành công.', type: 'error' });
      }
    } catch (err) {
      setApplyMsg({ text: 'Lỗi kết nối máy chủ.', type: 'error' });
    } finally {
      setApplyLoading(false);
    }
  };

  // Cancel Application
  const handleCancelApplication = async (appId) => {
    setCancellingAppId(appId);
    try {
      const res = await fetch(`/api/student/applications/${appId}/cancel`, {
        method: 'PUT',
        headers
      });
      const data = await res.json();
      notify(data.message || 'Đã rút hồ sơ thành công!', data.success ? 'success' : 'error');
      fetchApplications();
    } catch (err) {
      notify('Lỗi kết nối máy chủ khi rút hồ sơ.', 'error');
    } finally {
      setCancellingAppId(null);
    }
  };

  // Permanently Delete Application
  const handleDeleteApplication = (app) => {
    setConfirmDialogConfig({
      isOpen: true,
      title: 'Xóa Đơn Ứng Tuyển Vĩnh Viễn',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn đơn ứng tuyển vị trí "${app.job_title || 'Công việc'}" tại "${app.company_name || 'Doanh nghiệp'}" khỏi hệ thống?`,
      type: 'danger',
      confirmText: 'Xóa',
      onConfirm: async () => {
        setConfirmDialogConfig(null);
        try {
          const res = await fetch(`/api/student/applications/${app._id}`, {
            method: 'DELETE',
            headers
          });
          const data = await res.json();
          if (data.success) {
            notify(data.message || 'Đã xóa đơn ứng tuyển thành công!', 'success');
            fetchApplications();
            fetchJobs();
          } else {
            notify(data.message || 'Không thể xóa đơn ứng tuyển.', 'error');
          }
        } catch (err) {
          notify('Lỗi máy chủ khi xóa đơn ứng tuyển.', 'error');
        }
      }
    });
  };

  // Persist Shift Status Update
  const handleUpdateShiftStatus = async (appId, nextStatus, customMsg) => {
    const shiftKey = `shift_${appId}`;
    setShiftStatuses(prev => ({ ...prev, [shiftKey]: nextStatus }));
    try {
      const res = await fetch(`/api/student/applications/${appId}/shift-status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ shift_status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        notify(customMsg || data.message || 'Đã cập nhật trạng thái ca làm việc thành công!', 'success');
        fetchApplications();
      } else {
        notify(data.message || 'Lỗi cập nhật trạng thái ca làm.', 'error');
      }
    } catch (err) {
      notify('Lỗi máy chủ khi cập nhật trạng thái ca làm.', 'error');
    }
  };

  // Profile Save with 10-Digit Phone Validator
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setProfileSaveMsg('');

    // Ràng buộc số điện thoại đúng 10 số bắt đầu bằng 0
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(profileForm.phone)) {
      setPhoneError('Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 chữ số (bắt đầu bằng số 0).');
      return;
    }

    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setIsEditingProfile(false);
        setProfileSaveMsg('Cập nhật thông tin cá nhân thành công!');
        notify('Đã cập nhật thông tin cá nhân thành công!', 'success');
        setTimeout(() => setProfileSaveMsg(''), 3000);
      } else {
        setPhoneError(data.message || 'Lỗi cập nhật hồ sơ.');
        notify(data.message || 'Lỗi cập nhật hồ sơ.', 'error');
      }
    } catch (err) {
      setPhoneError('Lỗi kết nối máy chủ.');
    }
  };

  // CV Upload with Drag & Drop and Progress bar (FR 1.4.1 & 1.4.2)
  const handleCvFileSelected = (file) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      notify('Chỉ nhận .pdf (application/pdf), dung lượng ≤ 10MB. Hệ thống chặn mọi tệp không phải PDF!', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify('Dung lượng tệp CV vượt quá giới hạn 10MB. Vui lòng chọn tệp nhỏ hơn!', 'error');
      return;
    }
    const cleanName = file.name;
    setIsUploadingCv(true);
    setUploadProgress(20);

    const reader = new FileReader();
    reader.onload = async () => {
      setUploadProgress(85);
      const base64Data = reader.result;
      try {
        const res = await fetch('/api/student/resumes', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            file_name: cleanName,
            file_url: base64Data,
            file_size: file.size,
            is_default: myResumes.length === 0
          })
        });
        const d = await res.json();
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploadingCv(false);
          setUploadProgress(0);
        }, 300);
        if (d.success) {
          notify(`Đã tải lên tệp CV "${cleanName}" thành công!`, 'success');
          setNewCvName('');
          fetchResumes();
        } else {
          notify(d.message || 'Tải lên CV thất bại.', 'error');
        }
      } catch (err) {
        setIsUploadingCv(false);
        setUploadProgress(0);
        notify('Lỗi kết nối máy chủ khi tải lên tệp CV.', 'error');
      }
    };
    reader.onerror = () => {
      setIsUploadingCv(false);
      setUploadProgress(0);
      notify('Không thể đọc dữ liệu tệp PDF từ thiết bị của bạn.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleCvDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCv(true);
  };

  const handleCvDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCv(false);
  };

  const handleCvDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCv(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleCvFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleCvUploadSimulation = () => {
    if (!newCvName.trim()) {
      notify('Vui lòng chọn tệp kéo thả hoặc nhập tên file CV!', 'error');
      return;
    }
    setIsUploadingCv(true);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploadingCv(false);
          // Submit to backend
          fetch('/api/student/resumes', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              file_name: newCvName.endsWith('.pdf') ? newCvName : `${newCvName}.pdf`,
              file_url: '',
              is_default: myResumes.length === 0
            })
          }).then(res => res.json()).then(d => {
            if (d.success) {
              notify('Đã thêm tệp CV mới thành công!', 'success');
              setNewCvName('');
              fetchResumes();
            } else {
              notify(d.message || 'Không thể thêm CV.', 'error');
            }
          });
          return 100;
        }
        return prev + 30;
      });
    }, 200);
  };

  // Set Default CV
  const handleSetDefaultCv = async (cvId) => {
    try {
      const res = await fetch(`/api/student/resumes/${cvId}/default`, {
        method: 'PUT',
        headers
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || 'Đã đặt tệp CV làm mặc định thành công!', 'success');
        fetchResumes();
      } else {
        notify(data.message || 'Không thể đặt CV mặc định.', 'error');
      }
    } catch (err) {
      notify('Lỗi kết nối máy chủ khi cập nhật CV mặc định.', 'error');
    }
  };

  // Delete CV (FR 1.4.6) with ConfirmDialog
  const handleDeleteCv = (cvId) => {
    setConfirmDialogConfig({
      isOpen: true,
      title: 'Xóa Tệp CV Khỏi Kho Lưu Trữ',
      message: 'Bạn có chắc chắn muốn xóa vĩnh viễn tệp CV này khỏi hệ thống? Thao tác không thể hoàn tác.',
      type: 'danger',
      confirmText: 'Xóa',
      onConfirm: async () => {
        setConfirmDialogConfig(null);
        try {
          const res = await fetch(`/api/student/resumes/${cvId}`, {
            method: 'DELETE',
            headers
          });
          const data = await res.json();
          if (data.success) {
            notify('Đã xóa tệp CV thành công!', 'success');
            fetchResumes();
          } else {
            notify(data.message || 'Lỗi khi xóa CV.', 'error');
          }
        } catch (err) {
          notify('Lỗi máy chủ khi xóa CV.', 'error');
        }
      }
    });
  };

  // Handle real CV file replacement without window.prompt
  const handleReplaceCvFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !replacingCvId) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      notify('Chỉ nhận tệp CV định dạng .pdf (application/pdf). Hệ thống chặn mọi định dạng khác!', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify('Dung lượng tệp CV không được vượt quá 10MB!', 'error');
      e.target.value = '';
      return;
    }

    const cleanName = file.name;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result;
      try {
        const res = await fetch(`/api/student/resumes/${replacingCvId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            file_name: cleanName,
            file_url: base64Url,
            file_size: file.size
          })
        });
        const d = await res.json();
        if (d.success) {
          notify(`Đã thay thế CV thành công bằng tệp "${cleanName}"!`, 'success');
          fetchResumes();
        } else {
          notify(d.message || 'Thay thế CV thất bại.', 'error');
        }
      } catch (err) {
        notify('Lỗi máy chủ khi thay thế CV.', 'error');
      }
      setReplacingCvId(null);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Handle Edit Review Save without window.prompt
  const handleSaveEditReview = async (e) => {
    e.preventDefault();
    if (!editingReviewModal) return;
    const comment = editingReviewModal.comment?.trim() || '';
    if (!comment) {
      notify('Nội dung nhận xét không được để trống.', 'error');
      return;
    }
    if (comment.length >= 1000) {
      notify('Nội dung nhận xét đánh giá phải dưới 1.000 ký tự!', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/student/reviews/${editingReviewModal._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          rating: editingReviewModal.rating,
          comment
        })
      });
      const d = await res.json();
      if (d.success) {
        notify('Cập nhật nhận xét đánh giá thành công!', 'success');
        setEditingReviewModal(null);
        fetchReviews();
      } else {
        notify(d.message || 'Lỗi cập nhật đánh giá.', 'error');
      }
    } catch (err) {
      notify('Lỗi kết nối máy chủ.', 'error');
    }
  };

  // Delete Student Review permanently
  const handleDeleteStudentReview = (rev) => {
    setConfirmDialogConfig({
      isOpen: true,
      title: 'Xóa Đánh Giá Doanh Nghiệp',
      message: 'Bạn có chắc chắn muốn xóa vĩnh viễn bài đánh giá doanh nghiệp này khỏi hệ thống?',
      type: 'danger',
      confirmText: 'Xóa',
      onConfirm: async () => {
        setConfirmDialogConfig(null);
        try {
          const res = await fetch(`/api/student/reviews/${rev._id}`, {
            method: 'DELETE',
            headers
          });
          const d = await res.json();
          if (d.success) {
            notify(d.message || 'Đã xóa đánh giá thành công!', 'success');
            if (viewReviewDetailModal && viewReviewDetailModal._id === rev._id) {
              setViewReviewDetailModal(null);
            }
            fetchReviews();
          } else {
            notify(d.message || 'Không thể xóa đánh giá.', 'error');
          }
        } catch (err) {
          notify('Lỗi kết nối máy chủ khi xóa đánh giá.', 'error');
        }
      }
    });
  };

  // Xem chi tiết đánh giá - Nhấn vào mục lịch sử để tải và hiển thị đầy đủ nội dung văn bản nhận xét
  const handleOpenReviewDetail = async (rev) => {
    const matchedApp = myApplications.find(a => a._id === rev.application_id);
    const enrichedRev = {
      ...rev,
      company_name: rev.company_name || matchedApp?.company_name || 'Doanh nghiệp',
      job_title: rev.job_title || matchedApp?.job_title || 'Việc làm bán thời gian đã hoàn thành'
    };
    setViewReviewDetailModal(enrichedRev);
    setIsLoadingReviewDetail(true);
    try {
      const res = await fetch(`/api/student/reviews/${rev._id}`, { headers });
      const d = await res.json();
      if (d.success && d.data) {
        setViewReviewDetailModal(prev => ({
          ...prev,
          ...d.data,
          company_name: d.data.company_name || prev?.company_name,
          job_title: d.data.job_title || prev?.job_title
        }));
      }
    } catch (err) {
      console.warn('Lỗi tải chi tiết đánh giá:', err);
    } finally {
      setIsLoadingReviewDetail(false);
    }
  };

  // Review Company (FR 1.7.1 - 1.7.4)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModalJob) return;

    try {
      const res = await fetch('/api/student/reviews', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          application_id: reviewModalJob.application_id || reviewModalJob._id,
          rating: reviewScore,
          comment: reviewContent
        })
      });
      const data = await res.json();
      if (data.success) {
        notify('Cảm ơn bạn đã gửi đánh giá công ty!', 'success');
        setReviewModalJob(null);
        setReviewContent('');
        fetchReviews();
      } else {
        notify(data.message || 'Lỗi gửi đánh giá.', 'error');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // Report Submission (FR 1.5.7 & FR 1.8.5)
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportModalData || !reportReason.trim()) return;

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          report_type: reportModalData.type,
          target_id: reportModalData.target_id,
          application_id: reportModalData.application_id || '',
          room_id: reportModalData.room_id || '',
          target_title: reportModalData.target_title,
          reason: reportReason.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setReportMsg(`Báo cáo đã được gửi tới Ban Quản trị hệ thống (Mã Ticket: ${data.data?.ticket_code || 'TK-2026'}). Chúng tôi sẽ điều tra và xử lý ngay.`);
        fetchMyReports();
        setTimeout(() => {
          setReportModalData(null);
          setReportReason('');
          setReportMsg('');
        }, 2500);
      } else {
        notify(data.message || 'Gửi báo cáo thất bại.', 'error');
      }
    } catch (err) {
      notify('Lỗi kết nối máy chủ.', 'error');
    }
  };

  // Handle File Selection for Chat (FR 1.10.3: Chỉ nhận .pdf, .png, .jpg <= 10MB)
  const handleChatFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
      notify('Hệ thống chỉ chấp nhận tệp định dạng .pdf, .png, .jpg (≤ 10MB). Đã chặn tệp thực thi hoặc nén!', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      notify('Dung lượng tệp đính kèm không được vượt quá 10MB!', 'error');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setChatAttachment({
        file,
        name: file.name,
        size: file.size,
        type: ext === 'pdf' ? 'pdf' : 'image',
        base64: reader.result,
        sizeStr: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Send Chat Message with Media Attachment (FR 1.8.2 & FR 1.10.3)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMsgText.trim() && !chatAttachment) return;

    const textContent = newMsgText.trim() || `[Tệp đính kèm: ${chatAttachment?.name}]`;
    const attachmentToSend = chatAttachment;
    setNewMsgText('');
    setChatAttachment(null);

    const { cleanText, isFlagged, matchedWords } = maskBannedWordsClient(textContent, bannedKeywords);
    const optimisticMsg = {
      _id: `msg_tmp_${Date.now()}`,
      sender_id: currentUser?._id || 'student',
      sender_role: 'student',
      sender_email: currentUser?.email || '',
      sender_name: profile.full_name || currentUser?.profile?.full_name || currentUser?.full_name || 'Sinh viên',
      content: cleanText,
      clean_content: cleanText,
      original_content: textContent,
      is_flagged: isFlagged,
      flagged_words: matchedWords,
      media_url: attachmentToSend?.base64 || '',
      file_name: attachmentToSend?.name || '',
      file_size: attachmentToSend?.size || 0,
      created_at: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, optimisticMsg]);

    try {
      const sentRoomId = getRoomId();
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          room_id: sentRoomId,
          content: textContent,
          media_url: attachmentToSend?.base64 || '',
          file_name: attachmentToSend?.name || '',
          file_size: attachmentToSend?.size || 0,
          employer_id: selectedContact?.employer_id || selectedContact?.id,
          application_id: selectedContact?.application_id || ''
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setChatMessages(prev => {
          const replaced = prev.map(m => m._id === optimisticMsg._id ? data.data : m);
          const seen = new Set();
          return replaced.filter(m => {
            if (seen.has(m._id)) return false;
            seen.add(m._id);
            return true;
          });
        });
        setContacts(prev => prev.map(c => (
          doesRoomMatchApplication(sentRoomId, { employerId: c.employer_id || c.id, applicationId: c.application_id })
            ? { ...c, lastMsg: data.data.content || textContent, lastMessage: data.data.content || textContent, time: data.data.created_at || c.time, hasMessages: true, unreplied: false }
            : c
        )));
      }
    } catch (err) {
      console.warn('Send message error:', err);
    }
  };

  // Available districts when province selected
  const availableDistricts = selectedProvince ? getDistrictsByProvince(selectedProvince) : [];

  const handleToggleDistrict = (dist) => {
    setSelectedDistricts(prev =>
      prev.includes(dist) ? prev.filter(d => d !== dist) : [...prev, dist]
    );
  };

  // Tự động quay về Trang 1 mỗi khi người dùng thay đổi bất kỳ bộ lọc / tìm kiếm nào (tránh mất dữ liệu khi đang ở trang >= 2)
  useEffect(() => {
    setJobPage(1);
  }, [searchQuery, selectedCategory, selectedProvince, selectedDistricts, customLocationText, selectedShift, salaryFilter, paymentTypeFilter]);

  // Danh sách việc làm hiển thị trong Khám phá việc làm (giữ cả tin đã ứng tuyển / đã hoàn thành để SV nhận biết)
  const activeOpenJobs = jobs.filter(j => {
    if (j.is_hidden || j.status === 'banned') return false;
    const jSt = normalizeJobStatus(j);
    if (jSt === 'open') return true;
    const isAppliedByMe = !isGuestMode && myApplications.some(
      a => (a.job_id === j._id || a.job?._id === j._id) && a.application_status !== 'cancelled' && a.application_status !== 'withdrawn'
    );
    return isAppliedByMe;
  });

  // Filter Jobs (Chuẩn hóa toàn diện: Đa từ khóa, Không dấu tiếng Việt, Ánh xạ Ngành nghề, Địa lý đa tầng, Parse lương an toàn)
  const filteredJobs = activeOpenJobs.filter(j => {
    // 1. Tìm kiếm theo từ khóa (Tiêu đề công việc; Tên doanh nghiệp)
    const matchesSearch = matchKeywordFlexible(j, searchQuery, [
      'title', 'company_name'
    ]);

    // 2. Ngành nghề: Ánh xạ thông minh giữa Master Data, JOB_CATEGORIES và tiêu đề/mô tả công việc
    const matchesCat = matchCategoryFlexible(j, selectedCategory, categories);

    // 3. Địa điểm: Tỉnh/Thành phố (63 tỉnh) -> Chọn nhiều Quận/Huyện -> Ô nhập tay tùy chỉnh
    const matchesLoc = matchLocationFlexible(j, selectedProvince, selectedDistricts, customLocationText);

    // 4. Ca làm việc: Ca sáng, Ca chiều, Ca tối, Ca linh hoạt (Khớp cả tên ca và mốc giờ 07:00, 13:00, 18:00...)
    const matchesShift = matchShiftFlexible(j, selectedShift);

    // 5. Khoảng lương theo giờ: Parse số tiền Việt Nam ("28.000" -> 28000), khớp giao thoa khoảng lương
    const matchesSal = matchSalaryBracketFlexible(j, salaryFilter, SALARY_BRACKETS);

    // 6. Hình thức chi trả thù lao (Sau ca, theo tuần, theo tháng)
    const matchesPayment = matchPaymentTypeFlexible(j, paymentTypeFilter);

    return matchesSearch && matchesCat && matchesLoc && matchesShift && matchesSal && matchesPayment;
  });

  // Thuật toán ưu tiên hiển thị việc làm lân cận địa chỉ cư trú của sinh viên
  const calculateProximityScore = (job, userAddress) => {
    if (!userAddress || !userAddress.trim()) return 0;
    const userAddrLower = userAddress.toLowerCase();
    const jobLoc = ((job.location || '') + ' ' + (job.address || '')).toLowerCase();
    if (!jobLoc) return 0;

    let score = 0;
    const segments = userAddrLower.split(/[,;\-\/]+/).map(s => s.trim()).filter(s => s.length >= 2);

    for (const seg of segments) {
      if (jobLoc.includes(seg)) {
        if (seg.includes('quận') || seg.includes('huyện') || seg.includes('thị xã') || seg.includes('phường')) {
          score += 100;
        } else if (seg.includes('hồ chí minh') || seg.includes('hà nội') || seg.includes('đà nẵng') || seg.includes('cần thơ') || seg.includes('hải phòng')) {
          score += 40;
        } else {
          score += 25;
        }
      }
    }

    if (job.is_hot || job.hot) score += 20;
    if (job.is_urgent) score += 10;
    return score;
  };

  const studentAddress = profile.address || profile.residence_address || currentUser?.address || '';

  const sortedFilteredJobs = [...filteredJobs].sort((a, b) => {
    if (!isGuestMode && studentAddress) {
      const scoreA = calculateProximityScore(a, studentAddress);
      const scoreB = calculateProximityScore(b, studentAddress);
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Tin có điểm lân cận cao hơn lên hàng đầu
      }
    }
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  const totalPages = Math.ceil(sortedFilteredJobs.length / JOBS_PER_PAGE) || 1;
  const paginatedJobs = sortedFilteredJobs.slice((jobPage - 1) * JOBS_PER_PAGE, jobPage * JOBS_PER_PAGE);

  // Filtered Saved Jobs (FR-SV-05.11: Đang mở nhận hồ sơ, Sắp hết hạn <= 48h, Đã đóng / Đã đủ chỉ tiêu)
  const filteredSavedJobs = savedJobs.filter(job => {
    const jSt = normalizeJobStatus(job);
    const isGreyedOut = !job.is_open || jSt === 'filled' || jSt === 'completed' || jSt === 'closed';
    const isExpiringSoon = !isGreyedOut && (job.is_expiring_soon || (job.created_at && (Date.now() - new Date(job.created_at).getTime()) > 5 * 86400000));
    if (savedJobStatusFilter === 'open') {
      return !isGreyedOut && !isExpiringSoon;
    } else if (savedJobStatusFilter === 'expiring_soon') {
      return isExpiringSoon;
    } else if (savedJobStatusFilter === 'closed') {
      return isGreyedOut;
    }
    return true;
  });

  // Filter Applications (FR-SV-06.02: 6 chặng trạng thái chuẩn & FR-SV-06.06: Lọc theo thời gian nộp)
  const filteredApplications = myApplications.filter(app => {
    const appSearchObj = {
      ...app,
      job_title: app.job_title || app.job?.title || app.title || '',
      company_name: app.company_name || app.job?.company_name || ''
    };
    const matchesSearch = matchKeywordFlexible(appSearchObj, appSearchQuery, ['job_title', 'company_name']);
    
    // 6 chặng chuẩn: pending (Chờ xét duyệt), reviewed (Đã tiếp nhận), interview (Mời phỏng vấn), accepted (Trúng tuyển), rejected (Chưa phù hợp), cancelled (Đã rút hồ sơ)
    let matchesStatus = true;
    if (appStatusTab === 'pending') {
      matchesStatus = app.application_status === 'pending';
    } else if (appStatusTab === 'reviewed') {
      matchesStatus = app.application_status === 'reviewed' || app.application_status === 'received';
    } else if (appStatusTab === 'interview') {
      matchesStatus = app.application_status === 'interview';
    } else if (appStatusTab === 'accepted') {
      matchesStatus = app.application_status === 'accepted';
    } else if (appStatusTab === 'rejected') {
      matchesStatus = app.application_status === 'rejected';
    } else if (appStatusTab === 'cancelled') {
      matchesStatus = app.application_status === 'cancelled' || app.application_status === 'withdrawn';
    }

    // Lọc thời gian nộp (FR-SV-06.06: 7 ngày qua, 30 ngày qua, khoảng ngày tùy chọn)
    let matchesDate = true;
    if (appDateFilter !== 'all' && app.applied_at) {
      const appTime = new Date(app.applied_at).getTime();
      const now = Date.now();
      if (appDateFilter === '7days') {
        matchesDate = (now - appTime) <= 7 * 86400000;
      } else if (appDateFilter === '30days') {
        matchesDate = (now - appTime) <= 30 * 86400000;
      } else if (appDateFilter === 'custom') {
        if (appFromDate) {
          matchesDate = matchesDate && appTime >= new Date(appFromDate).getTime();
        }
        if (appToDate) {
          matchesDate = matchesDate && appTime <= (new Date(appToDate).getTime() + 86400000);
        }
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Completed jobs ready for review (chỉ lấy đơn đã trúng tuyển VÀ đã hoàn thành công việc/ca làm, loại trừ các đơn đã gửi đánh giá)
  const reviewedStudentAppIds = new Set(myReviews.map(r => String(r.application_id || '')));
  const completedJobsForReview = isGuestMode
    ? []
    : myApplications.filter(a => {
        const isAccepted = a.application_status === 'accepted' || a.application_status === 'completed' || a.status === 'accepted' || a.status === 'completed';
        const parentJob = jobs.find(j => j._id === (a.job_id || a.job?._id));
        const isJobOrShiftDone =
          a.shift_status === 'completed' ||
          a.application_status === 'completed' ||
          a.job_status === 'completed' ||
          a.status === 'completed' ||
          (parentJob && normalizeJobStatus(parentJob) === 'completed');
        return isAccepted && isJobOrShiftDone && !reviewedStudentAppIds.has(String(a._id));
      });

  // Đơn ứng tuyển đã đạt trạng thái Đã duyệt / Hoàn thành (chưa hủy) cho Lịch ca làm đã nhận (my_shifts)
  const acceptedApplications = isGuestMode ? [] : myApplications.filter(a => ['accepted', 'completed'].includes(a.application_status || a.status) && !a.is_cancelled);

  // Thống kê cá nhân Sinh viên (Tổng giờ công part-time, Thu nhập dự kiến, Tỷ lệ duyệt đơn) - 100% số liệu thực tế & đồng bộ helper chung
  const studentWorkStats = (() => {
    const shiftSummary = computeAcceptedShiftsSummary(acceptedApplications, jobs, shiftStatuses);
    const nonWithdrawn = myApplications.filter(a => !['cancelled', 'withdrawn'].includes(a.application_status) && !a.is_cancelled);
    const approvedCount = myApplications.filter(a => ['accepted', 'completed'].includes(a.application_status)).length;
    const approvalRate = nonWithdrawn.length > 0 ? Math.round((approvedCount / nonWithdrawn.length) * 100) : 0;

    return {
      ...shiftSummary,
      completedShiftCount: shiftSummary.completedCount,
      approvalRate,
      approvedCount,
      nonWithdrawnCount: nonWithdrawn.length,
      totalSubmitted: myApplications.length,
    };
  })();

  const handleExportStudentShiftsExcel = (mode = 'schedule') => {
    const shiftStatusLabelMap = {
      upcoming: 'Sắp diễn ra',
      in_progress: 'Đang làm việc',
      completed: 'Đã hoàn thành',
      absent: 'Vắng mặt',
      cancelled: 'Đã hủy ca'
    };
    const rows = acceptedApplications.map((app, idx) => {
      const linkedJob = jobs.find(j => j._id === (app?.job_id || app?.job?._id)) || null;
      const st = normalizeShiftStatus(app, shiftStatuses[`shift_${app._id}`] || shiftStatuses[app._id]);
      const isNeg = Boolean(app?.is_negotiable ?? app?.application_snapshot?.is_negotiable ?? linkedJob?.is_negotiable);
      const minSal = Number(app?.salary_min ?? app?.application_snapshot?.salary_min ?? linkedJob?.salary_min ?? 0);
      const maxSal = Number(app?.salary_max ?? app?.application_snapshot?.salary_max ?? linkedJob?.salary_max ?? minSal);
      const sal = isNeg ? 'Thỏa thuận' : (minSal > 0 ? `${minSal.toLocaleString()}đ - ${Math.max(minSal, maxSal).toLocaleString()}đ/giờ` : 'Chưa cập nhật');
      const hrs = (st === 'cancelled' || st === 'absent') ? 0 : parseShiftHoursFromRecord(app, linkedJob);
      const avgSal = resolveShiftHourlyWage(app, linkedJob);
      const estPay = (st === 'cancelled' || st === 'absent') ? 0 : Math.round(hrs * avgSal);
      const workTimeLabel = app.work_time || app.shift_registered || linkedJob?.work_time || 'Ca linh hoạt';
      return mode === 'timesheet'
        ? [
            idx + 1,
            app.job_title || linkedJob?.title || '',
            app.company_name || linkedJob?.company_name || '',
            app.branch_name || app.location || linkedJob?.branch_name || linkedJob?.location || '',
            workTimeLabel,
            `${hrs} giờ`,
            sal,
            `${estPay.toLocaleString()} đ`,
            shiftStatusLabelMap[st] || st
          ]
        : [
            idx + 1,
            app.job_title || linkedJob?.title || '',
            app.company_name || linkedJob?.company_name || '',
            app.branch_name || app.location || linkedJob?.branch_name || linkedJob?.location || '',
            workTimeLabel,
            sal,
            shiftStatusLabelMap[st] || st,
            app.applied_at || ''
          ];
    });
    exportTablesToExcelHtml({
      filename: mode === 'timesheet' ? `Bang_Cham_Cong_Ca_Nhan_${new Date().toISOString().slice(0, 10)}.xls` : `Lich_Ca_Lam_Viec_${new Date().toISOString().slice(0, 10)}.xls`,
      title: mode === 'timesheet' ? 'BẢNG CHẤM CÔNG & THU NHẬP PART-TIME CÁ NHÂN' : 'LỊCH CA LÀM VIỆC ĐÃ NHẬN',
      subtitle: `Sinh viên: ${profile.full_name || 'Sinh viên'} | Tổng giờ công: ${studentWorkStats.totalHours}h | Thu nhập dự kiến: ${studentWorkStats.estimatedIncome.toLocaleString()}đ`,
      tables: [
        {
          title: mode === 'timesheet' ? 'CHI TIẾT CHẤM CÔNG TỪNG CA LÀM' : 'DANH SÁCH CA LÀM ĐÃ ĐƯỢC DUYỆT',
          headers: mode === 'timesheet'
            ? ['STT', 'Công Việc', 'Doanh Nghiệp', 'Chi Nhánh / Địa Điểm', 'Khung Ca', 'Số Giờ', 'Đơn Giá Lương', 'Thu Nhập Dự Kiến', 'Trạng Thái Chấm Công']
            : ['STT', 'Công Việc', 'Doanh Nghiệp', 'Chi Nhánh / Địa Điểm', 'Khung Ca', 'Mức Lương', 'Trạng Thái Ca', 'Ngày Duyệt'],
          rows
        }
      ]
    });
    notify(mode === 'timesheet' ? 'Đã xuất tệp Excel Bảng chấm công cá nhân thành công!' : 'Đã xuất tệp Excel Lịch ca làm việc thành công!', 'success');
  };

  const handleExportStudentApplicationsExcel = () => {
    const statusMap = {
      pending: 'Đang chờ xét duyệt',
      reviewed: 'Đã tiếp nhận',
      received: 'Đã tiếp nhận',
      interview: 'Mời phỏng vấn',
      accepted: 'Trúng tuyển',
      rejected: 'Chưa phù hợp',
      cancelled: 'Đã rút hồ sơ',
      withdrawn: 'Đã rút hồ sơ'
    };
    const rows = myApplications.map((app, idx) => [
      idx + 1,
      app.job_title || '',
      app.company_name || '',
      app.location || '',
      app.work_time || app.shift_registered || 'Ca linh hoạt',
      app.application_snapshot?.cv_name || 'CV_UngVien.pdf',
      statusMap[app.application_status] || app.application_status,
      app.interview_date ? `${app.interview_date} ${app.interview_time || ''} (${app.interview_method || 'Phỏng vấn'})` : '',
      app.reject_reason || '',
      app.applied_at || ''
    ]);
    exportTablesToExcelHtml({
      filename: `Danh_Sach_Don_Ung_Tuyen_${new Date().toISOString().slice(0, 10)}.xls`,
      title: 'DANH SÁCH ĐƠN ỨNG TUYỂN PART-TIME CỦA SINH VIÊN',
      subtitle: `Sinh viên: ${profile.full_name || 'Sinh viên'} | Tổng số đơn: ${myApplications.length} | Tỷ lệ duyệt: ${studentWorkStats.approvalRate}%`,
      tables: [
        {
          title: 'LỊCH SỬ NỘP HỒ SƠ ỨNG TUYỂN',
          headers: ['STT', 'Vị Trí Tuyển Dụng', 'Doanh Nghiệp', 'Địa Điểm', 'Ca Đăng Ký', 'CV Đã Nộp', 'Trạng Thái', 'Lịch Phỏng Vấn', 'Lý Do Từ Chối', 'Ngày Nộp'],
          rows
        }
      ]
    });
    notify('Đã xuất tệp Excel Danh sách đơn ứng tuyển thành công!', 'success');
  };

  // Bộ lọc kết hợp Tuần / Khung ca / Chi nhánh / Trạng thái ca đồng bộ 100% với Lịch nhân sự Nhà tuyển dụng
  const isShiftMatchingDay = (app, item, idx) => {
    const linkedJob = jobs.find(j => j._id === (app?.job_id || app?.job?._id)) || null;
    return doesShiftMatchDay(app, linkedJob, item, idx);
  };

  const filteredAcceptedShifts = acceptedApplications.filter((app) => {
    const linkedJob = jobs.find(j => j._id === (app.job_id || app.job?._id)) || null;
    const enrichedApp = {
      ...(linkedJob || {}),
      ...app,
      work_time: app.work_time || app.shift_registered || app.application_snapshot?.work_time || linkedJob?.work_time || '',
      branch_name: app.branch_name || app.job?.branch_name || linkedJob?.branch_name || '',
      location: app.location || app.job?.location || linkedJob?.location || '',
      address: app.address || app.job?.address || linkedJob?.address || '',
      district: app.district || app.job?.district || linkedJob?.district || '',
      province: app.province || app.job?.province || linkedJob?.province || '',
      company_name: app.company_name || app.job?.company_name || linkedJob?.company_name || '',
      job_title: app.job_title || app.job?.title || linkedJob?.title || app.title || ''
    };
    if (!doesShiftMatchWeek(enrichedApp, linkedJob, shiftFilterWeek)) return false;
    if (!matchShiftFlexible(enrichedApp, shiftFilterTime)) return false;
    if (shiftFilterBranch && shiftFilterBranch !== 'all') {
      if (!matchKeywordFlexible(enrichedApp, shiftFilterBranch, ['branch_name', 'location', 'address', 'district', 'province', 'company_name', 'job_title'])) {
        return false;
      }
    }
    if (shiftFilterStatus && shiftFilterStatus !== 'all') {
      const curStatus = normalizeShiftStatus(app, shiftStatuses[`shift_${app._id || ''}`]);
      if (curStatus !== shiftFilterStatus) return false;
    }
    return true;
  });

  // Sidebar Menu Items for Student (Đúng 9 Danh mục chuẩn - Khớp 100% với Main Content)
  const studentMenuItems = [
    { id: 'home', label: 'Trang chủ', icon: <Home className="w-4 h-4" /> },
    { id: 'jobs', label: 'Khám phá việc làm', icon: <Search className="w-4 h-4" />, count: isGuestMode ? undefined : activeOpenJobs.length },
    { id: 'saved_jobs', label: 'Việc làm đã lưu', icon: <Heart className="w-4 h-4" />, count: isGuestMode ? undefined : savedJobs.length },
    { id: 'applications', label: 'Tiến độ ứng tuyển', icon: <Clock className="w-4 h-4" />, count: isGuestMode ? undefined : myApplications.length },
    { id: 'my_shifts', label: 'Lịch ca làm đã nhận', icon: <CalendarDays className="w-4 h-4" />, count: isGuestMode ? undefined : acceptedApplications.length },
    { id: 'profile_cv', label: 'Quản lý CV', icon: <Upload className="w-4 h-4" />, count: isGuestMode ? undefined : myResumes.length },
    { id: 'student_profile', label: 'Hồ sơ cá nhân', icon: <User className="w-4 h-4" /> },
    { id: 'reviews', label: 'Doanh nghiệp chờ đánh giá', icon: <Star className="w-4 h-4" />, count: isGuestMode ? undefined : completedJobsForReview.length },
    { id: 'my_reports', label: 'Báo cáo vi phạm đã gửi', icon: <Flag className="w-4 h-4" />, count: isGuestMode ? undefined : myReports.length },
    { id: 'chat', label: 'Tin nhắn & Phỏng vấn', icon: <MessageSquare className="w-4 h-4" />, count: isGuestMode ? undefined : contacts.length }
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#F8FAFC] text-slate-800 min-h-[calc(100vh-80px)]">

      {/* ======================= LEFT SIDEBAR SINH VIÊN (ĐỒNG BỘ 100% VỚI NTD & QUẢN TRỊ VIÊN) ======================= */}
      <aside className={`${
        mobileSidebarOpen
          ? 'fixed inset-y-0 left-0 z-50 w-80 shadow-2xl flex'
          : `hidden md:flex ${isSidebarCollapsed ? 'md:w-20' : 'md:w-80'}`
      } bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-sm flex-col shrink-0 transition-all duration-300`}>
        <div className={`p-4 border-b border-slate-100 flex items-center ${isSidebarCollapsed && !mobileSidebarOpen ? 'justify-center' : 'justify-between'} gap-2`}>
          {(!isSidebarCollapsed || mobileSidebarOpen) && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
              <span className="text-sm sm:text-base font-black tracking-wider text-slate-900 uppercase truncate">Cổng Sinh Viên</span>
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebarCollapse}
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

        {/* 9 Mục Menu Cố Định */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {studentMenuItems.map((item) => {
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

      {/* ======================= WIDGET CHAT SIDEBAR DRAWER (UI-SV-CHAT-01) ======================= */}
      {chatDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border-l border-slate-200 flex flex-col shadow-2xl h-full animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase">Widget Chat Nhanh</h3>
              </div>
              <button
                type="button"
                onClick={onCloseChatDrawer}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <StudentChatContactsPanel
              contacts={contacts}
              selectedContact={selectedContact}
              chatSearchQuery={chatSearchQuery}
              onSearchChange={setChatSearchQuery}
              chatUnrepliedOnly={chatUnrepliedOnly}
              onToggleUnreplied={() => setChatUnrepliedOnly(!chatUnrepliedOnly)}
              onSelectContact={(contact) => {
                setSelectedContact(contact);
                handleMenuSwitch('chat');
                if (onCloseChatDrawer) onCloseChatDrawer();
              }}
              isDrawer
            />

            <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
              <button
                type="button"
                onClick={() => {
                  handleMenuSwitch('chat');
                  if (onCloseChatDrawer) onCloseChatDrawer();
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Mở Toàn Màn Hình Chat & Video Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MAIN CONTENT AREA ======================= */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">

        {/* 1. MÀN HÌNH TRANG CHỦ (HOME OVERVIEW) */}
        {activeMenu === 'home' && (
          <div className="w-full max-w-full mx-auto space-y-8">

            {/* Hero Welcome Banner - Digital Light Dimension Style */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-8 sm:p-12 lg:p-14 shadow-xl text-white min-h-[240px] sm:min-h-[270px] flex flex-col justify-center">
              <div className="max-w-3xl relative z-10 space-y-4">
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
                  {isGuestMode ? (
                    <>Khám Phá Việc Làm Part-time <span className="text-slate-900">Linh Hoạt Theo Ca Học</span></>
                  ) : (
                    <>Chào mừng trở lại, <span className="text-slate-900">{profile.full_name || 'Sinh viên'}</span>!</>
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed max-w-3xl mt-2">
                  Khám phá các cơ hội việc làm bán thời gian uy tín từ các thương hiệu đã được xác thực Giấy phép kinh doanh, minh bạch thu nhập và tuyệt đối không thu phí cọc.
                </p>

                {/* Thanh Tìm Kiếm Nhanh Cho Chế Độ Khách */}
                {isGuestMode ? (
                  <div className="bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-3 text-slate-800 mt-4">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={heroKeyword}
                        onChange={(e) => setHeroKeyword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setSearchQuery(heroKeyword);
                            setSelectedProvince(heroProvince);
                            setSelectedDistricts([]);
                            handleMenuSwitch('jobs');
                          }
                        }}
                        placeholder="Vị trí tuyển dụng"
                        className="w-full bg-transparent pl-11 pr-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 outline-none"
                      />
                    </div>
                    <div className="w-full sm:w-52 border-t sm:border-t-0 sm:border-l border-slate-200 pl-0 sm:pl-2">
                      <select
                        value={heroProvince}
                        onChange={(e) => setHeroProvince(e.target.value)}
                        className="w-full bg-transparent py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-slate-700 outline-none cursor-pointer"
                      >
                        <option value="">Tất cả địa điểm</option>
                        {VIETNAM_PROVINCES.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery(heroKeyword);
                        setSelectedProvince(heroProvince);
                        setSelectedDistricts([]);
                        handleMenuSwitch('jobs');
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-sm sm:text-base font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Tìm Việc</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleMenuSwitch('jobs')}
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-blue-700 text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      <span>Khám Phá Việc Làm Ngay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMenuSwitch('applications')}
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4 text-slate-900" />
                      <span>Xem Tiến Độ Đơn ({myApplications.length})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3 Metric Cards - Digital Light Dimension Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {isGuestMode ? (
                <>
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-h-[130px]">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Xác Minh Doanh Nghiệp</p>
                      <p className="text-lg sm:text-xl font-black text-slate-900">Giấy Phép Hợp Lệ</p>
                      <p className="text-xs sm:text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% Đã thẩm định GPKD
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                      <Briefcase className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-h-[130px]">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Cam Kết Bảo Vệ</p>
                      <p className="text-lg sm:text-xl font-black text-slate-900">Không Phí Tuyển Dụng</p>
                      <p className="text-xs sm:text-sm font-semibold text-sky-600 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Tuyệt đối không cọc tiền
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-h-[130px]">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Thời Gian Biểu</p>
                      <p className="text-lg sm:text-xl font-black text-slate-900">Linh Hoạt Theo Ca</p>
                      <p className="text-xs sm:text-sm font-semibold text-indigo-600 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Ca sáng, chiều, tối & cuối tuần
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Clock className="w-8 h-8" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* 3 Thẻ Số Liệu Đơn Giản (Số liệu thực tế từ hệ thống) */}
                  <div
                    onClick={() => handleMenuSwitch('jobs')}
                    className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center justify-between min-h-[130px] cursor-pointer"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Việc Làm Đang Tuyển</p>
                      <p className="text-2xl font-black text-slate-900">{activeOpenJobs.length} vị trí</p>
                      <p className="text-xs font-semibold text-blue-600 truncate">
                        {savedJobs.length} việc làm đã lưu
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Briefcase className="w-6 h-6" />
                    </div>
                  </div>

                  <div
                    onClick={() => handleMenuSwitch('applications')}
                    className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-sky-300 transition-all flex items-center justify-between min-h-[130px] cursor-pointer"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Hồ Sơ Đã Nộp</p>
                      <p className="text-2xl font-black text-slate-900">{myApplications.length} đơn</p>
                      <p className="text-xs font-semibold text-sky-600 truncate">
                        {myApplications.filter(a => a.application_status === 'pending').length} chờ duyệt • {acceptedApplications.length} trúng tuyển
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                      <Send className="w-6 h-6" />
                    </div>
                  </div>

                  <div
                    onClick={() => handleMenuSwitch('profile_cv')}
                    className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex items-center justify-between min-h-[130px] cursor-pointer"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Kho Hồ Sơ CV</p>
                      <p className="text-2xl font-black text-slate-900">{myResumes.length} tệp CV</p>
                      <p className="text-xs font-semibold text-indigo-600 truncate">
                        {(() => {
                          const defCv = myResumes.find(r => r.is_default) || myResumes[0];
                          return defCv ? `Mặc định: ${defCv.file_name || 'CV PDF'}` : 'Chưa tải lên tệp CV PDF';
                        })()}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  </div>

                  {/* 3 Thẻ Thống Kê Kết Quả Part-Time Thực Tế */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-h-[130px]">
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Tổng Giờ Công Part-Time</p>
                      <p className="text-2xl font-black text-slate-900">{studentWorkStats.totalHours} giờ</p>
                      <p className="text-xs font-semibold text-blue-600 truncate">
                        {studentWorkStats.completedShiftCount} ca hoàn thành • {studentWorkStats.activeShiftCount} ca sắp tới
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-h-[130px]">
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Thu Nhập Dự Kiến</p>
                      <p className="text-2xl font-black text-emerald-700">{studentWorkStats.estimatedIncome.toLocaleString()}đ</p>
                      <p className="text-xs font-semibold text-emerald-600 truncate">
                        {studentWorkStats.hasWageData ? 'Tính từ lương & giờ ca thực tế' : 'Chưa phát sinh ca có đơn giá cố định'}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-h-[130px]">
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Tỷ Lệ Duyệt Đơn</p>
                      <p className="text-2xl font-black text-purple-700">{studentWorkStats.approvalRate}%</p>
                      <p className="text-xs font-semibold text-purple-600 truncate">
                        {studentWorkStats.approvedCount}/{studentWorkStats.nonWithdrawnCount} đơn hợp lệ trúng tuyển
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Hot Category Chips for Guest Mode */}
            {isGuestMode && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngành Nghề Sinh Viên Phổ Biến:</p>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: 'F&B / Pha Chế & Phục Vụ', kw: 'Pha chế', icon: <Coffee className="w-3.5 h-3.5 text-amber-700" /> },
                    { label: 'Bán Lẻ / Cửa Hàng Tiện Lợi', kw: 'Thu ngân', icon: <ShoppingCart className="w-3.5 h-3.5 text-blue-700" /> },
                    { label: 'Gia Sư / Trợ Giảng', kw: 'Trợ giảng', icon: <GraduationCap className="w-3.5 h-3.5 text-indigo-700" /> },
                    { label: 'Kho Vận / Soạn Hàng Ca', kw: 'Kho vận', icon: <Package className="w-3.5 h-3.5 text-orange-700" /> },
                    { label: 'IT & Nhập Liệu Online', kw: 'Nhập liệu', icon: <Laptop className="w-3.5 h-3.5 text-cyan-700" /> },
                    { label: 'Sự Kiện & Thời Vụ', kw: 'Sự kiện', icon: <PartyPopper className="w-3.5 h-3.5 text-rose-700" /> }
                  ].map((cat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSearchQuery(cat.kw);
                        handleMenuSwitch('jobs');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {cat.icon}
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Việc làm đề xuất mới nhất - Bố cục 3 Cột chuẩn TopCV */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2.5">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                  <span>Việc Làm Part-Time Nổi Bật Dành Cho Bạn</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleMenuSwitch('jobs')}
                  className="text-sm sm:text-base font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem tất cả</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Lưới 3 cột tràn đều màn hình - Chuẩn TopCV, không để rỗng nửa màn hình */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                {activeOpenJobs.filter(j => normalizeJobStatus(j) === 'open' && j.is_open !== false).slice(0, 6).map((job) => {
                  const isSaved = bookmarkedIds.has(job._id);
                  const isHotJob = Boolean(job.is_hot || job.hot || Number(job.salary_max) >= 30000);
                  return (
                    <div
                      key={job._id}
                      onClick={() => setSelectedJobDetail(job)}
                      className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between min-h-[250px] relative"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <MediaAvatar
                              src={job.company_logo}
                              alt={job.company_name || 'Logo doanh nghiệp'}
                              fallbackIcon={<Building className="w-5 h-5" />}
                              className="w-12 h-12 rounded-2xl mt-0.5"
                              fallbackClassName="bg-emerald-50 border border-emerald-200 text-emerald-700"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                                  {isHotJob ? 'HOT' : 'MỚI'}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                                  {job.category || 'Part-time'}
                                </span>
                              </div>
                              <h4 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
                                {job.title}
                              </h4>
                              <button
                                type="button"
                                onClick={(e) => handleOpenCompanyProfile(job, e)}
                                className="text-sm sm:text-base font-semibold text-emerald-700 hover:text-emerald-800 hover:underline mt-1 line-clamp-1 text-left cursor-pointer flex items-center gap-1"
                                title="Xem trang hồ sơ doanh nghiệp"
                              >
                                <Building className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{job.company_name}</span>
                              </button>
                              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="truncate">{job.location}</span>
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isGuestMode) {
                                notify('Vui lòng đăng nhập hoặc đăng ký tài khoản Sinh viên để lưu việc làm!', 'info');
                                if (onNavigateAuth) onNavigateAuth('login', 'student');
                                return;
                              }
                              handleToggleBookmark(job._id);
                            }}
                            className={`p-2.5 rounded-2xl border transition-all shrink-0 ${isSaved
                              ? 'bg-red-50 border-red-200 text-red-500'
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200'
                              }`}
                            title={isSaved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
                          >
                            <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-bold">
                            {job.is_negotiable ? 'Lương thỏa thuận' : `${job.salary_min?.toLocaleString()}đ - ${job.salary_max?.toLocaleString()}đ/h`}
                          </span>
                          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium">
                            {job.work_time || 'Ca linh hoạt'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isGuestMode) {
                              notify('Vui lòng đăng nhập hoặc đăng ký tài khoản Sinh viên để ứng tuyển!', 'info');
                              if (onNavigateAuth) onNavigateAuth('login', 'student');
                              return;
                            }
                            handleOpenApplyModal(job);
                          }}
                          className="px-5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                          Ứng Tuyển
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3 Cam Kết Vàng Cho Sinh Viên (Typography To Rõ) */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border border-blue-200/80 space-y-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-7 h-7 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-wider">
                  3 Cam Kết Bảo Vệ Quyền Lợi Sinh Viên Tại PARTIME.VN
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2.5">
                  <div className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>100% Xác Minh GPKD</span>
                  </div>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Mọi nhà tuyển dụng đều bắt buộc nộp Giấy phép kinh doanh có dấu mộc đỏ và được Quản trị viên thẩm định kỹ lưỡng.
                  </p>
                </div>
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2.5">
                  <div className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Khớp Lịch Học 100%</span>
                  </div>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Hệ thống ghép ca linh hoạt theo buổi học giúp bạn làm việc chủ động, bảo đảm hoàn toàn không ảnh hưởng việc học.
                  </p>
                </div>
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2.5">
                  <div className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Thu Nhập Minh Bạch</span>
                  </div>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Lương tính tự động theo giờ công thực tế. Đánh giá 2 chiều sau mỗi ca làm việc bảo vệ quyền lợi thù lao của sinh viên.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 2. MÀN HÌNH KHÁM PHÁ VIỆC LÀM & BỘ LỌC (FR 1.5.1 - 1.5.3) */}
        {activeMenu === 'jobs' && (
          <div className="w-full max-w-full mx-auto space-y-8">

            {/* Header & Filter Controls (FR 1.5.2) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    <span>Tìm Kiếm Việc Làm Part-Time</span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Tìm thấy {filteredJobs.length} vị trí phù hợp với lịch học sinh viên</p>
                </div>
              </div>

              {/* Bộ lọc đa tiêu chí chuẩn (1.5.1 & 1.5.2 & 1.5.10) */}
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* 1. Từ khóa Chức danh */}
                  <div className="relative min-w-0">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm (Tiêu đề công việc; Tên doanh nghiệp)"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium truncate"
                    />
                  </div>

                  {/* 2. Ngành nghề (Master Data - khử trùng lặp giữa danh mục mặc định và danh mục từ Admin) */}
                  <div className="min-w-0">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer truncate"
                    >
                      <option value="">Tất cả ngành nghề</option>
                      {Array.from(
                        new Set([
                          ...JOB_CATEGORIES.filter(c => c !== 'Tất cả ngành nghề'),
                          ...categories.filter(c => c.type !== 'location' && c.is_active !== false && c.name).map(c => c.name.trim())
                        ])
                      ).map((catName, i) => (
                        <option key={i} value={catName}>{catName}</option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Chọn Tỉnh / Thành phố (kết hợp danh mục Địa điểm động từ Admin) */}
                  <div className="min-w-0">
                    <select
                      value={selectedProvince}
                      onChange={(e) => {
                        setSelectedProvince(e.target.value);
                        setSelectedDistricts([]);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer truncate"
                    >
                      <option value="">Toàn quốc</option>
                      {Array.from(
                        new Set([
                          ...VIETNAM_PROVINCES,
                          ...categories.filter(c => c.type === 'location' && c.is_active !== false && c.name).map(c => c.name.trim())
                        ])
                      ).map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Ca làm việc */}
                  <div className="min-w-0">
                    <select
                      value={selectedShift}
                      onChange={(e) => setSelectedShift(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer truncate"
                    >
                      <option value="">Mọi ca làm việc</option>
                      {WORK_SHIFTS.filter(s => s.id !== 'all').map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Khoảng lương theo giờ */}
                  <div className="min-w-0">
                    <select
                      value={salaryFilter}
                      onChange={(e) => setSalaryFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer truncate"
                    >
                      <option value="">Tất cả mức lương</option>
                      {SALARY_BRACKETS.filter(b => b.id !== 'all').map((b) => (
                        <option key={b.id} value={b.id}>{b.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bảng tích chọn nhiều Quận/Huyện */}
                {availableDistricts.length > 0 && (
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-blue-700">
                          Tích chọn nhiều Khu vực tại {selectedProvince} ({selectedDistricts.length} đã chọn):
                        </span>
                        {selectedDistricts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedDistricts([])}
                            className="text-red-500 hover:underline text-xs font-bold"
                          >
                            Xóa chọn
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                        {availableDistricts.map((dist) => {
                          const isChecked = selectedDistricts.includes(dist);
                          return (
                            <button
                              key={dist}
                              type="button"
                              onClick={() => handleToggleDistrict(dist)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                isChecked
                                  ? 'bg-blue-50 text-blue-800 font-bold border border-blue-300 shadow-sm'
                                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              {dist}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lưới thẻ việc làm - Phân trang 10 dòng/trang (FR 1.5.3) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {paginatedJobs.length === 0 ? (
                <div className="col-span-2 py-16 text-center text-slate-500 text-sm bg-white rounded-3xl border border-slate-200">
                  Không tìm thấy việc làm phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                paginatedJobs.map((job) => {
                  const isSaved = (!isGuestMode && token && currentUser) ? bookmarkedIds.has(job._id) : false;
                  const userApp = (!isGuestMode && token && currentUser)
                    ? myApplications.find(a => (a.job_id === job._id || a.job?._id === job._id) && a.application_status !== 'cancelled' && a.application_status !== 'withdrawn')
                    : null;
                  const jSt = normalizeJobStatus(job);
                  const isCompleted = Boolean(userApp && (userApp.shift_status === 'completed' || userApp.application_status === 'completed' || jSt === 'completed'));
                  const isApplied = Boolean(userApp && !isCompleted);
                  const isNearMe = !isGuestMode && Boolean(studentAddress) && calculateProximityScore(job, studentAddress) >= 40;
                  return (
                    <div
                      key={job._id}
                      onClick={() => setSelectedJobDetail(job)}
                      className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group shadow-sm relative min-h-[260px] flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <MediaAvatar
                            src={job.company_logo}
                            alt={job.company_name || 'Logo doanh nghiệp'}
                            fallbackIcon={<Building className="w-6 h-6" />}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mt-0.5"
                            fallbackClassName="bg-emerald-50 border border-emerald-200 text-emerald-700"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                {job.title}
                              </h4>
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Đã hoàn thành công việc</span>
                                </span>
                              ) : isApplied ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Đã ứng tuyển</span>
                                </span>
                              ) : null}
                              {isNearMe && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold" title="Việc làm ở khu vực lân cận địa chỉ cư trú của bạn">
                                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Gần bạn</span>
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleOpenCompanyProfile(job, e)}
                              className="text-base font-semibold text-emerald-700 hover:text-emerald-800 hover:underline mt-1 text-left cursor-pointer inline-flex items-center gap-1.5"
                              title="Xem trang hồ sơ doanh nghiệp"
                            >
                              <Building className="w-4 h-4 shrink-0" />
                              <span>{job.company_name}</span>
                            </button>
                            <p className="text-sm text-slate-500 mt-1">{job.location}</p>
                          </div>
                        </div>
                        {/* Trái tim lưu/bỏ lưu việc làm kèm hiệu ứng nhịp tim đập (FR 1.5.4, 1.5.5) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleBookmark(job._id);
                          }}
                          className={`p-2.5 rounded-xl border transition-all ${isSaved
                            ? 'bg-red-50 border-red-200 text-red-500 animate-pulse'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                          title={isSaved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-bold">
                            {job.is_negotiable ? 'Thỏa thuận' : `${job.salary_min?.toLocaleString()}đ - ${job.salary_max?.toLocaleString()}đ/h`}
                          </span>
                          <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium">
                            {job.work_time}
                          </span>
                        </div>

                        {isCompleted ? (
                          <button
                            type="button"
                            disabled
                            className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs sm:text-sm font-bold cursor-not-allowed flex items-center gap-1.5 opacity-90 shadow-none"
                            title="Công việc đã hoàn thành ca làm"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Đã hoàn thành công việc</span>
                          </button>
                        ) : isApplied ? (
                          <button
                            type="button"
                            disabled
                            className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-600 text-xs sm:text-sm font-bold cursor-not-allowed flex items-center gap-1.5 opacity-90 shadow-none"
                            title="Bạn đã nộp đơn ứng tuyển công việc này"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã ứng tuyển</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenApplyModal(job);
                            }}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Ứng tuyển</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Phân trang (10 dòng/trang) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  disabled={jobPage === 1}
                  onClick={() => setJobPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  Trang trước
                </button>
                <span className="text-xs text-slate-500 font-mono px-3">
                  Trang {jobPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={jobPage === totalPages}
                  onClick={() => setJobPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. MÀN HÌNH VIỆC LÀM ĐÃ LƯU (UI-SV-JOB-04 - 1.5.8) */}
        {activeMenu === 'saved_jobs' && (
          <div className="w-full max-w-full mx-auto space-y-8">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  <span>Danh Sách Việc Làm Đã Lưu</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isGuestMode ? 'Chế độ xem trước tính năng theo dõi việc làm yêu thích' : `Bạn đang theo dõi ${bookmarkedIds.size} việc làm yêu thích`}
                </p>
              </div>
            </div>

            {isGuestMode ? (
              <div className="space-y-6">
                

                

                {/* Recommendations to Save */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Gợi ý việc làm nên lưu ngay hôm nay:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {jobs.slice(0, 4).map((job) => (
                      <div
                        key={job._id}
                        onClick={() => setSelectedJobDetail(job)}
                        className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <MediaAvatar
                              src={job.company_logo}
                              alt={job.company_name || 'Logo doanh nghiệp'}
                              fallbackIcon={<Building className="w-5 h-5" />}
                              className="w-11 h-11 rounded-2xl mt-0.5"
                              fallbackClassName="bg-emerald-50 border border-emerald-200 text-emerald-700"
                            />
                            <div className="min-w-0 flex-1">
                              <h5 className="text-sm font-bold text-slate-900 line-clamp-1">{job.title}</h5>
                              <button
                                type="button"
                                onClick={(e) => handleOpenCompanyProfile(job, e)}
                                className="text-xs font-semibold text-emerald-600 hover:underline mt-0.5 text-left cursor-pointer inline-flex items-center gap-1"
                                title="Xem trang hồ sơ doanh nghiệp"
                              >
                                <Building className="w-3 h-3 shrink-0" />
                                <span>{job.company_name}</span>
                              </button>
                              <p className="text-sm text-slate-500 mt-1">{job.location}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              notify('Vui lòng đăng nhập hoặc đăng ký tài khoản Sinh viên để lưu việc làm!', 'info');
                              if (onNavigateAuth) onNavigateAuth('login', 'student');
                            }}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 cursor-pointer"
                            title="Lưu việc làm"
                          >
                            <Heart className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                          <span className="font-bold text-blue-600">
                            {job.is_negotiable ? 'Thỏa thuận' : `${job.salary_min?.toLocaleString()}đ - ${job.salary_max?.toLocaleString()}đ/h`}
                          </span>
                          <span className="text-xs text-slate-500">{job.work_time || 'Ca linh hoạt'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSavedJobs.length === 0 ? (
                  <div className="col-span-2 py-16 text-center text-slate-500 text-xs bg-white rounded-3xl border border-slate-200 shadow-sm">
                    {savedJobs.length === 0
                      ? 'Bạn chưa lưu công việc nào. Hãy nhấp vào icon Trái tim tại trang Khám phá việc làm để lưu lại.'
                      : 'Không tìm thấy việc làm đã lưu phù hợp với bộ lọc trạng thái được chọn.'}
                  </div>
                ) : (
                  filteredSavedJobs.map((job) => {
                    const userApp = (!isGuestMode && token && currentUser)
                      ? myApplications.find(a => (a.job_id === job._id || a.job?._id === job._id) && a.application_status !== 'cancelled' && a.application_status !== 'withdrawn')
                      : null;
                    const jSt = normalizeJobStatus(job);
                    const isCompleted = Boolean(userApp && (userApp.shift_status === 'completed' || userApp.application_status === 'completed' || jSt === 'completed'));
                    const isApplied = Boolean(userApp && !isCompleted);
                    const isGreyedOut = !job.is_open || jSt === 'filled' || jSt === 'completed' || jSt === 'closed';

                    return (
                      <div
                        key={job._id}
                        onClick={() => setSelectedJobDetail(job)}
                        className={`p-5 rounded-2xl bg-white border transition-all relative ${isGreyedOut && !isApplied && !isCompleted
                          ? 'border-slate-200 opacity-60 grayscale cursor-not-allowed'
                          : 'border-slate-200/80 hover:border-blue-400 cursor-pointer shadow-sm hover:shadow-md'
                          }`}
                      >
                        {isCompleted ? (
                          <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                            <CheckCircle className="w-3 h-3" />
                            <span>Đã hoàn thành công việc</span>
                          </div>
                        ) : isApplied ? (
                          <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                            <Check className="w-3 h-3" />
                            <span>Đã ứng tuyển</span>
                          </div>
                        ) : isGreyedOut ? (
                          <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                            <AlertCircle className="w-3 h-3" />
                            <span>
                              {job.job_status === 'filled' ? 'Đã nhận đủ người' : (job.job_status === 'completed' ? 'Đã hoàn thành' : 'Tạm đóng tuyển dụng')}
                            </span>
                          </div>
                        ) : null}

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <MediaAvatar
                              src={job.company_logo}
                              alt={job.company_name || 'Logo doanh nghiệp'}
                              fallbackIcon={<Building className="w-5 h-5" />}
                              className="w-11 h-11 rounded-2xl mt-0.5"
                              fallbackClassName="bg-emerald-50 border border-emerald-200 text-emerald-700"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{job.title}</h4>
                              <button
                                type="button"
                                onClick={(e) => handleOpenCompanyProfile(job, e)}
                                className="text-xs font-semibold text-emerald-600 hover:underline mt-1 text-left cursor-pointer inline-flex items-center gap-1"
                                title="Xem trang hồ sơ doanh nghiệp"
                              >
                                <Building className="w-3 h-3 shrink-0" />
                                <span>{job.company_name}</span>
                              </button>
                              <p className="text-sm text-slate-500 mt-1">{job.location}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBookmark(job._id);
                            }}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-red-500 transition-all cursor-pointer shadow-xs"
                            title="Bỏ lưu việc làm"
                          >
                            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                          <span className="text-xs font-bold text-blue-600">
                            {job.is_negotiable ? 'Thỏa thuận' : `${job.salary_min?.toLocaleString()}đ - ${job.salary_max?.toLocaleString()}đ/h`}
                          </span>
                          {isCompleted ? (
                            <button
                              type="button"
                              disabled
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold text-xs cursor-not-allowed flex items-center gap-1 opacity-90 shadow-none"
                              title="Công việc đã hoàn thành ca làm"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Đã hoàn thành công việc</span>
                            </button>
                          ) : isApplied ? (
                            <button
                              type="button"
                              disabled
                              className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-600 font-bold text-xs cursor-not-allowed flex items-center gap-1 opacity-90 shadow-none"
                              title="Bạn đã nộp đơn ứng tuyển công việc này"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Đã ứng tuyển</span>
                            </button>
                          ) : !isGreyedOut ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenApplyModal(job);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Ứng tuyển</span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. MÀN HÌNH QUẢN LÝ TIẾN ĐỘ ỨNG TUYỂN (UI-SV-APP-02 & 03 - 1.6.1 -> 1.6.4) */}
        {activeMenu === 'applications' && (
          <div className="w-full max-w-full mx-auto space-y-8">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span>Quản Lý Tiến Độ Ứng Tuyển</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Theo dõi thời gian thực kết quả duyệt hồ sơ từ các doanh nghiệp tuyển dụng</p>
                </div>
                {!isGuestMode && (
                  <button
                    type="button"
                    onClick={handleExportStudentApplicationsExcel}
                    className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                    title="Xuất danh sách đơn ứng tuyển ra tệp Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất Excel Đơn Ứng Tuyển</span>
                  </button>
                )}
              </div>
            </div>

            {/* Thanh tìm kiếm & Tabs lọc trạng thái (Chỉ hiển thị khi đã đăng nhập) */}
            {!isGuestMode && (
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3.5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80 min-w-0">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={appSearchQuery}
                      onChange={(e) => setAppSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm (Tiêu đề công việc; Tên doanh nghiệp)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Tabs lọc 6 chặng trạng thái chuẩn (FR-SV-06.02) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${appStatusTab === 'all' ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'}`}
                  >
                    Tất cả ({myApplications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${appStatusTab === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'}`}
                  >
                    Đang chờ xét duyệt ({myApplications.filter(a => a.application_status === 'pending').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('reviewed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${appStatusTab === 'reviewed' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'}`}
                  >
                    Đã tiếp nhận ({myApplications.filter(a => a.application_status === 'reviewed' || a.application_status === 'received').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('interview')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${appStatusTab === 'interview' ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'}`}
                  >
                    Mời phỏng vấn ({myApplications.filter(a => a.application_status === 'interview').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('accepted')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${appStatusTab === 'accepted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'}`}
                  >
                    Trúng tuyển ({myApplications.filter(a => a.application_status === 'accepted').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('rejected')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${appStatusTab === 'rejected' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'}`}
                  >
                    Chưa phù hợp ({myApplications.filter(a => a.application_status === 'rejected').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('cancelled')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${appStatusTab === 'cancelled' ? 'bg-slate-200 text-slate-800 border border-slate-300' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'}`}
                  >
                    Đã rút hồ sơ ({myApplications.filter(a => a.application_status === 'cancelled' || a.application_status === 'withdrawn').length})
                  </button>
                </div>
              </div>
            )}

            {/* Danh sách đơn ứng tuyển */}
            <div className="space-y-4">
              {isGuestMode ? (
                <div className="space-y-6">
                  

                  {/* 4-Step Visual Workflow */}
                  <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quy trình ứng tuyển 4 bước tại PARTIME.VN:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-center sm:text-left">
                        <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center mx-auto sm:mx-0">1</span>
                        <p className="font-bold text-slate-900 text-xs">Nộp Đơn Trực Tuyến</p>
                        <p className="text-xs text-slate-500 leading-relaxed">Đính kèm CV PDF và gửi thông tin hồ sơ ứng tuyển nhanh chóng tới nhà tuyển dụng.</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-center sm:text-left">
                        <span className="w-7 h-7 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center justify-center mx-auto sm:mx-0">2</span>
                        <p className="font-bold text-slate-900 text-xs">Doanh Nghiệp Xét Duyệt</p>
                        <p className="text-xs text-slate-500 leading-relaxed">Nhận phản hồi duyệt hồ sơ hoặc xếp lịch phỏng vấn nhanh trong 24-48 giờ.</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-center sm:text-left">
                        <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mx-auto sm:mx-0">3</span>
                        <p className="font-bold text-slate-900 text-xs">Phỏng Vấn Trực Tuyến</p>
                        <p className="text-xs text-slate-500 leading-relaxed">Trao đổi qua kênh chat hoặc gọi video WebRTC trực tiếp trên trình duyệt.</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-center sm:text-left">
                        <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mx-auto sm:mx-0">4</span>
                        <p className="font-bold text-slate-900 text-xs">Trúng Tuyển & Nhận Ca</p>
                        <p className="text-xs text-slate-500 leading-relaxed">Hệ thống kích hoạt lịch ca làm, hỗ trợ điểm danh và tính thù lao tự động.</p>
                      </div>
                    </div>
                  </div>

                  
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-sm text-xs text-slate-500">
                  Không có đơn ứng tuyển nào trong mục này.
                </div>
              ) : (
                filteredApplications.map((app) => {
                  const statusColors = {
                    pending: 'bg-amber-50 text-amber-800 border-amber-200',
                    reviewed: 'bg-blue-50 text-blue-800 border-blue-200',
                    received: 'bg-blue-50 text-blue-800 border-blue-200',
                    interview: 'bg-orange-50 text-orange-800 border-orange-200',
                    accepted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    rejected: 'bg-rose-50 text-rose-800 border-rose-200',
                    cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
                    withdrawn: 'bg-slate-100 text-slate-600 border-slate-200'
                  };

                  const statusLabels = {
                    pending: 'Đang chờ xét duyệt',
                    reviewed: 'Đã tiếp nhận',
                    received: 'Đã tiếp nhận',
                    interview: 'Mời phỏng vấn',
                    accepted: 'Trúng tuyển',
                    rejected: 'Chưa phù hợp',
                    cancelled: 'Đã rút hồ sơ',
                    withdrawn: 'Đã rút hồ sơ'
                  };

                  return (
                    <div
                      key={app._id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-slate-900">{app.job_title}</h4>
                          <p className="text-xs font-semibold text-emerald-600 mt-0.5">{app.company_name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">Ngày nộp: {app.applied_at}</p>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[app.application_status] || statusColors.pending}`}>
                            {statusLabels[app.application_status] || app.application_status}
                          </span>
                        </div>
                      </div>

                      {/* Snapshot CV */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="font-semibold">CV đã đính kèm:</span>
                          <span className="text-blue-600 font-mono font-bold">{app.application_snapshot?.cv_name || 'CV_UngVien.pdf'}</span>
                        </div>
                        {app.reject_reason && (
                          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                            <strong>Lý do từ chối:</strong> {app.reject_reason}
                          </div>
                        )}
                        {app.application_status === 'interview' && (
                          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-black text-purple-950 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-purple-700" />
                                <span>Lịch Hẹn Phỏng Vấn (Chỉ Xem Trên Đơn)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const stuUid = currentUser?._id || currentUser?.id || 'student';
                                  const contact = contacts.find(c =>
                                    (c.application_id && c.application_id === app._id) ||
                                    c.id === app._id
                                  ) || {
                                    id: app._id,
                                    application_id: app._id,
                                    room_id: app.room_id || buildApplicationChatRoomId({ employerId: app.employer_id, studentUserId: stuUid, applicationId: app._id }),
                                    employer_id: app.employer_id,
                                    job_id: app.job_id,
                                    job_title: app.job_title || '',
                                    subtitle: `Ứng tuyển: ${app.job_title || ''}`,
                                    name: app.company_name || 'Doanh nghiệp',
                                    company_name: app.company_name || 'Doanh nghiệp',
                                    online: true,
                                    application_status: app.application_status
                                  };
                                  setSelectedContact(contact);
                                  handleMenuSwitch('chat');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-100 border border-purple-300 text-purple-700 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Mở Chat Chờ NTD</span>
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                              <div>
                                <span className="text-purple-700 font-semibold block">Ngày hẹn:</span>
                                <span className="font-bold">{app.interview_date || 'Đang chờ NTD ấn định'}</span>
                              </div>
                              <div>
                                <span className="text-purple-700 font-semibold block">Giờ hẹn:</span>
                                <span className="font-bold font-mono">{app.interview_time || 'Trao đổi trong chat'}</span>
                              </div>
                              <div>
                                <span className="text-purple-700 font-semibold block">Hình thức phỏng vấn:</span>
                                <span className="font-bold">{app.interview_method || 'Phỏng vấn trực tuyến (WebRTC)'}</span>
                              </div>
                            </div>
                            {app.interview_location && (
                              <p className="text-[11px] text-purple-800">
                                <strong>Địa điểm / Liên kết:</strong> {app.interview_location}
                              </p>
                            )}
                            {app.interview_note && (
                              <p className="text-[11px] text-purple-800 italic">
                                <strong>Ghi chú từ Doanh nghiệp:</strong> {app.interview_note}
                              </p>
                            )}
                            <p className="text-[11px] text-purple-700/90 pt-0.5">
                              * Vui lòng kiểm tra trạng thái trên đơn và chờ tin nhắn / cuộc gọi từ Nhà tuyển dụng đúng thời gian hẹn.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Trục thời gian tiến độ ứng tuyển 4 bước cụ thể (Đã gỡ bỏ hiệu ứng nhấp nháy / ẩn hiện ở số 1) */}
                      <div className="pt-3 pb-1 border-t border-slate-200 mt-3">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>Tiến Độ Tuyển Dụng (Quy Trình 4 Bước Chuẩn)</span>
                          </p>
                          {(() => {
                            const viStatusMap = {
                              pending: { label: 'Đang Chờ Xét Duyệt', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-300' },
                              reviewed: { label: 'Đã Tiếp Nhận Hồ Sơ', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-300' },
                              interview: { label: 'Mời Phỏng Vấn Trực Tuyến', color: 'text-purple-800', bg: 'bg-purple-50 border-purple-300' },
                              accepted: { label: 'Trúng Tuyển Chính Thức', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-300' },
                              rejected: { label: 'Chưa Phù Hợp Lần Này', color: 'text-rose-800', bg: 'bg-rose-50 border-rose-300' },
                              cancelled: { label: 'Đã Rút Hồ Sơ', color: 'text-slate-800', bg: 'bg-slate-100 border-slate-300' }
                            };
                            const stInfo = viStatusMap[app.application_status] || { label: app.application_status, color: 'text-slate-800', bg: 'bg-slate-100 border-slate-300' };
                            return (
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${stInfo.bg} ${stInfo.color}`}>
                                {stInfo.label}
                              </span>
                            );
                          })()}
                        </div>

                        {/* Thanh Stepper 4 bước cố định */}
                        <div className="overflow-x-auto pb-3">
                          <div className="min-w-[560px] px-4 py-2">
                            {(() => {
                              // Xác định cấp độ bước hiện tại: 1 = Nộp hồ sơ, 2 = Tiếp nhận, 3 = Phỏng vấn, 4 = Kết quả
                              let currentStepNum = 1;
                              if (app.application_status === 'pending') currentStepNum = 1;
                              else if (app.application_status === 'reviewed') currentStepNum = 2;
                              else if (app.application_status === 'interview') currentStepNum = 3;
                              else if (['accepted', 'rejected'].includes(app.application_status)) currentStepNum = 4;

                              const steps = [
                                { num: 1, title: 'Bước 1: Nộp Hồ Sơ', desc: 'Đã gửi CV ứng tuyển' },
                                { num: 2, title: 'Bước 2: Tiếp Nhận', desc: 'Doanh nghiệp xem xét' },
                                { num: 3, title: 'Bước 3: Phỏng Vấn', desc: 'Lên lịch phỏng vấn online' },
                                { 
                                  num: 4, 
                                  title: app.application_status === 'rejected' ? 'Bước 4: Chưa Phù Hợp' : 'Bước 4: Kết Quả', 
                                  desc: app.application_status === 'rejected' ? 'Từ chối ứng tuyển' : (app.application_status === 'accepted' ? 'Trúng tuyển chính thức' : 'Chờ quyết định') 
                                }
                              ];

                              // Tính toán thời gian từng bước từ status_history hoặc applied_at
                              const getStepTimestamp = (sNum) => {
                                if (sNum === 1) return app.applied_at || 'Đã nộp';
                                const hist = app.status_history || [];
                                if (sNum === 2) {
                                  const item = hist.find(h => h.status === 'reviewed');
                                  return item ? item.updated_at : (currentStepNum >= 2 ? 'Đã tiếp nhận' : null);
                                }
                                if (sNum === 3) {
                                  const item = hist.find(h => h.status === 'interview');
                                  return item ? item.updated_at : (currentStepNum >= 3 ? 'Đang phỏng vấn' : null);
                                }
                                if (sNum === 4) {
                                  const item = hist.find(h => ['accepted', 'rejected'].includes(h.status));
                                  return item ? item.updated_at : null;
                                }
                                return null;
                              };

                              return (
                                <div className="relative">
                                  {/* Thanh nối ngang */}
                                  <div className="absolute top-6 left-10 right-10 h-1.5 bg-slate-200 rounded-full z-0">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        app.application_status === 'rejected'
                                          ? 'bg-gradient-to-r from-blue-500 via-amber-500 to-rose-500'
                                          : 'bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-500'
                                      }`}
                                      style={{
                                        width: currentStepNum === 1 ? '15%' :
                                               currentStepNum === 2 ? '45%' :
                                               currentStepNum === 3 ? '75%' : '100%'
                                      }}
                                    />
                                  </div>

                                  {/* 4 Cột hiển thị từng bước */}
                                  <div className="grid grid-cols-4 gap-2 relative z-10">
                                    {steps.map((st) => {
                                      const isPassed = st.num < currentStepNum;
                                      const isCurrent = st.num === currentStepNum;
                                      const isUpcoming = st.num > currentStepNum;
                                      const timeStr = getStepTimestamp(st.num);

                                      let circleClass = 'bg-slate-100 border-slate-300 text-slate-400';
                                      let titleClass = 'text-slate-500';
                                      let badgeStatus = null;

                                      if (isPassed) {
                                        circleClass = 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-500/20';
                                        titleClass = 'text-blue-700 font-bold';
                                        badgeStatus = 'Đã xong';
                                      } else if (isCurrent) {
                                        if (app.application_status === 'accepted') {
                                          circleClass = 'bg-emerald-600 border-emerald-400 text-white shadow-md';
                                          titleClass = 'text-emerald-700 font-black';
                                          badgeStatus = 'Trúng tuyển';
                                        } else if (app.application_status === 'rejected') {
                                          circleClass = 'bg-rose-600 border-rose-400 text-white shadow-md';
                                          titleClass = 'text-rose-700 font-black';
                                          badgeStatus = 'Chưa phù hợp';
                                        } else if (st.num === 1) {
                                          circleClass = 'bg-blue-600 border-blue-400 text-white shadow-md';
                                          titleClass = 'text-blue-700 font-black';
                                          badgeStatus = 'Đang xử lý';
                                        } else if (st.num === 2) {
                                          circleClass = 'bg-amber-500 border-amber-300 text-slate-950 shadow-md';
                                          titleClass = 'text-amber-700 font-black';
                                          badgeStatus = 'Đang xem xét';
                                        } else if (st.num === 3) {
                                          circleClass = 'bg-purple-600 border-purple-300 text-white shadow-md';
                                          titleClass = 'text-purple-700 font-black';
                                          badgeStatus = 'Đang phỏng vấn';
                                        }
                                      } else {
                                        badgeStatus = 'Chưa tới';
                                      }

                                      return (
                                        <div key={st.num} className="flex flex-col items-center text-center px-1">
                                          {/* Circle icon */}
                                          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 font-black text-base transition-all duration-300 shadow-sm ${circleClass}`}>
                                            {isPassed ? (
                                              <CheckCircle2 className="w-5 h-5 text-white" />
                                            ) : isCurrent && app.application_status === 'accepted' ? (
                                              <CheckCircle2 className="w-5 h-5 text-white" />
                                            ) : isCurrent && app.application_status === 'rejected' ? (
                                              <X className="w-5 h-5 text-white" />
                                            ) : (
                                              <span>{st.num}</span>
                                            )}
                                          </div>

                                          {/* Tên bước */}
                                          <p className={`text-sm mt-3 leading-snug transition-colors ${titleClass}`}>
                                            {st.title}
                                          </p>

                                          {/* Huy hiệu trạng thái bước */}
                                          {badgeStatus && (
                                            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                                              isCurrent 
                                                ? (app.application_status === 'accepted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                                   app.application_status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                                   'bg-blue-100 text-blue-800 border border-blue-300')
                                                : (isPassed ? 'text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200' : 'text-slate-500 font-medium')
                                            }`}>
                                              {badgeStatus}
                                            </span>
                                          )}

                                          {/* Thời gian cập nhật */}
                                          {timeStr && (
                                            <span className="text-xs text-slate-400 font-mono mt-1">
                                              {timeStr}
                                            </span>
                                          )}

                                          {/* Mô tả bước */}
                                          <p className="text-sm text-slate-600 mt-1 line-clamp-1">
                                            {st.desc}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons: Nút Rút hồ sơ & Xóa vĩnh viễn đơn ứng tuyển */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        {app.application_status === 'pending' && (
                          <button
                            type="button"
                            disabled={cancellingAppId === app._id}
                            onClick={() => handleCancelApplication(app._id)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {cancellingAppId === app._id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Đang rút...</span>
                              </>
                            ) : (
                              <span>Rút hồ sơ</span>
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteApplication(app)}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 4.5. MÀN HÌNH LỊCH CA LÀM ĐÃ NHẬN (my_shifts) (1.11.1, 1.11.2) */}
        {activeMenu === 'my_shifts' && (
          <div className="w-full max-w-full mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                    <span>Thời Khóa Biểu & Lịch Ca Làm Đã Nhận</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Đồng bộ tự động từ các công việc đã đạt trạng thái <strong>Đã duyệt trúng tuyển</strong>.
                  </p>
                </div>

                {!isGuestMode && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleExportStudentShiftsExcel('schedule')}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Xuất Excel Lịch Ca Làm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportStudentShiftsExcel('timesheet')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Xuất Bảng Chấm Công (.xls)</span>
                    </button>
                  </div>
                )}
              </div>

              {!isGuestMode && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-blue-700 uppercase block">Tổng Giờ Công Part-time</span>
                      <span className="text-lg font-black text-slate-900">{studentWorkStats.totalHours} giờ</span>
                    </div>
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-700 uppercase block">Thu Nhập Dự Kiến</span>
                      <span className="text-lg font-black text-emerald-700">{studentWorkStats.estimatedIncome.toLocaleString()}đ</span>
                    </div>
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-purple-700 uppercase block">Tỷ Lệ Duyệt Đơn</span>
                      <span className="text-lg font-black text-purple-700">{studentWorkStats.approvalRate}% ({studentWorkStats.approvedCount}/{studentWorkStats.nonWithdrawnCount})</span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              )}

              {/* Lọc đa tiêu chí Lịch ca làm đã nhận (FR-SV-11.03: Tuần, Khung ca, Chi nhánh, Trạng thái ca) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full sm:w-auto">
                <select
                  value={shiftFilterWeek}
                  onChange={(e) => setShiftFilterWeek(e.target.value)}
                  className="w-full min-w-0 truncate bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="prev">Tuần trước</option>
                  <option value="current">Tuần hiện tại</option>
                  <option value="next">Tuần sau</option>
                </select>

                <select
                  value={shiftFilterTime}
                  onChange={(e) => setShiftFilterTime(e.target.value)}
                  className="w-full min-w-0 truncate bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Tất cả khung ca</option>
                  <option value="morning">Ca sáng (06:00 - 12:00)</option>
                  <option value="afternoon">Ca chiều (12:00 - 18:00)</option>
                  <option value="evening">Ca tối (18:00 - 23:00)</option>
                </select>

                <div className="relative w-full min-w-0">
                  <SearchableDropdownInput
                    value={shiftFilterBranch === 'all' ? '' : shiftFilterBranch}
                    onChange={(val) => setShiftFilterBranch(val || 'all')}
                    options={[
                      ...acceptedApplications.map(a => a.branch_name || a.location).filter(Boolean),
                      'Quận 1',
                      'Quận 3',
                      'Quận 7',
                      'Quận 10',
                      'Bình Thạnh',
                      'Tân Bình',
                      'Cầu Giấy'
                    ]}
                    placeholder="Tất cả chi nhánh..."
                    className="w-full min-w-0 truncate bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <select
                  value={shiftFilterStatus}
                  onChange={(e) => setShiftFilterStatus(e.target.value)}
                  className="w-full min-w-0 truncate bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái ca</option>
                  <option value="upcoming">Sắp diễn ra</option>
                  <option value="in_progress">Đang làm việc</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="absent">Vắng mặt</option>
                  <option value="cancelled">Đã hủy ca</option>
                </select>
              </div>
            </div>

            {/* Bảng Thời Khóa Biểu Tuần (Thứ 2 đến Chủ Nhật - Đồng bộ 100% số liệu thực tế với Nhà Tuyển Dụng) */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              {(() => {
                const { weekDays, startDateStr, endDateStr } = getWeekBounds(shiftFilterWeek);
                const weekSummary = computeAcceptedShiftsSummary(filteredAcceptedShifts, jobs, shiftStatuses);

                return (
                  <>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                          Thời Khóa Biểu Ca Làm Trong Tuần
                        </span>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                          {shiftFilterWeek === 'prev' ? 'Tuần trước: ' : (shiftFilterWeek === 'next' ? 'Tuần sau: ' : 'Tuần hiện tại: ')}
                          Từ ngày {startDateStr} đến ngày {endDateStr}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="text-slate-600">
                          {filteredAcceptedShifts.length} / {acceptedApplications.length} ca làm tuần này
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          {weekSummary.totalHours} giờ công
                        </span>
                        {weekSummary.hasWageData && (
                          <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                            Dự kiến {weekSummary.estimatedIncome.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {weekDays.map((item, idx) => {
                        const dayApps = filteredAcceptedShifts.filter(app => isShiftMatchingDay(app, item, idx));
                        const hasShift = dayApps.length > 0;

                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-2xl border text-center transition-all flex flex-col justify-between min-h-[190px] ${
                              hasShift
                                ? 'bg-white border-blue-200 shadow-xs'
                                : 'bg-slate-50/50 border-slate-100 text-slate-400'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <p className="text-xs font-black text-slate-900">{item.dayName}</p>
                                {hasShift && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-black text-blue-700">
                                    {dayApps.length}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 font-mono font-semibold mb-2 bg-slate-50 py-0.5 rounded-md border border-slate-200/80">
                                {item.dateStr}
                              </p>
                            </div>

                            {hasShift ? (
                              <div className="space-y-2 flex-1 flex flex-col">
                                {dayApps.map((assignedApp, appIdx) => {
                                  const linkedJob = jobs.find(j => j._id === (assignedApp.job_id || assignedApp.job?._id)) || null;
                                  const shiftInfo = resolveShiftTimeMeta(assignedApp, linkedJob);
                                  const shiftKey = `shift_${assignedApp._id || `${idx}_${appIdx}`}`;
                                  const currentStatus = normalizeShiftStatus(assignedApp, shiftStatuses[shiftKey]);
                                  const isAlreadyReviewed = reviewedStudentAppIds.has(String(assignedApp._id || ''));

                                  return (
                                    <div
                                      key={`${idx}_${assignedApp._id || appIdx}`}
                                      onClick={() => {
                                        if (shiftInfo) {
                                          setSelectedShiftDetailModal({ app: assignedApp, day: item, meta: shiftInfo, status: currentStatus });
                                        }
                                      }}
                                      className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-blue-400 hover:shadow-sm text-left shadow-2xs space-y-1.5 cursor-pointer transition-all"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between gap-1">
                                          <span className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${shiftInfo?.badgeClass || 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                                            {shiftInfo?.shiftName || 'Ca làm'}
                                          </span>
                                          <span className="text-[10px] text-slate-500 font-mono font-bold">
                                            {shiftInfo?.shiftHours || 'Linh hoạt'}
                                          </span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-1" title={assignedApp.job_title}>
                                          {assignedApp.job_title || linkedJob?.title || 'Việc làm part-time'}
                                        </p>
                                        <p className="text-[11px] font-semibold text-emerald-700 line-clamp-1" title={assignedApp.company_name}>
                                          {assignedApp.company_name || linkedJob?.company_name || 'Doanh nghiệp'}
                                        </p>
                                        <p className="text-[10px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200/70 text-center font-semibold">
                                          {shiftInfo?.timeRange || 'Theo lịch ca'}
                                        </p>
                                      </div>

                                      {/* Trạng thái ca làm & Nút bấm tương tác trực tiếp */}
                                      <div className="pt-1.5 border-t border-slate-200/80 space-y-1">
                                        {currentStatus === 'upcoming' && (
                                          <>
                                            <div className="flex items-center justify-between">
                                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5 text-amber-600" />
                                                <span>Sắp tới</span>
                                              </span>
                                              <span className="text-[9px] text-slate-400">Chờ vào ca</span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateShiftStatus(assignedApp._id, 'in_progress', 'Đã bắt đầu vào ca làm việc!');
                                              }}
                                              className="w-full py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-all"
                                              title="Bấm để vào ca làm việc"
                                            >
                                              <Play className="w-2.5 h-2.5 fill-white" />
                                              <span>Vào ca làm</span>
                                            </button>
                                          </>
                                        )}

                                        {currentStatus === 'in_progress' && (
                                          <>
                                            <div className="flex items-center justify-between">
                                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1 animate-pulse">
                                                <Activity className="w-2.5 h-2.5 text-blue-600 animate-spin" />
                                                <span>Đang làm</span>
                                              </span>
                                              <span className="text-[9px] text-blue-600 font-semibold">Trong ca</span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateShiftStatus(assignedApp._id, 'completed', 'Đã xác nhận hoàn thành ca làm việc!');
                                              }}
                                              className="w-full py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-all"
                                              title="Bấm để xác nhận hoàn thành ca"
                                            >
                                              <CheckCircle2 className="w-2.5 h-2.5" />
                                              <span>Xong ca</span>
                                            </button>
                                          </>
                                        )}

                                        {currentStatus === 'completed' && (
                                          <>
                                            <div className="flex items-center justify-between">
                                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                                <span>Đã xong</span>
                                              </span>
                                              <span className="text-[9px] text-emerald-700 font-semibold">Hoàn tất</span>
                                            </div>
                                            {!isAlreadyReviewed ? (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setReviewModalJob(assignedApp);
                                                }}
                                                className="w-full py-1 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                                                title="Đánh giá doanh nghiệp"
                                              >
                                                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                                <span>Đánh giá</span>
                                              </button>
                                            ) : (
                                              <span className="block text-center text-[10px] font-semibold text-emerald-700 py-0.5">
                                                Đã đánh giá
                                              </span>
                                            )}
                                          </>
                                        )}

                                        {currentStatus === 'absent' && (
                                          <div className="py-1 text-center">
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center gap-1">
                                              <XCircle className="w-2.5 h-2.5 text-rose-500" />
                                              <span>Vắng mặt</span>
                                            </span>
                                          </div>
                                        )}

                                        {currentStatus === 'cancelled' && (
                                          <div className="py-1 text-center">
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center gap-1">
                                              <XCircle className="w-2.5 h-2.5 text-rose-500" />
                                              <span>Đã hủy ca</span>
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="py-8 text-center">
                                <p className="text-xs text-slate-400 italic">Trống ca</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Danh Sách Thẻ Ca Làm & Trạng Thái Chuyển Đổi (1.11.2) */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Chi Tiết Lịch Ca & Điểm Danh (Sắp diễn ra ↔ Đang làm việc → Đã hoàn thành hoặc Đã hủy ca)</span>
              </h4>

              {isGuestMode ? (
                <div className="space-y-6">
                  

                  

                  {/* 3 Core Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 text-xs">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4 text-blue-600" />
                        <span>Theo Dõi Ca Theo Tuần</span>
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">Xem lịch ca làm việc trực quan từ Thứ 2 đến Chủ Nhật theo Tuần trước, Tuần hiện tại và Tuần sau.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 text-xs">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Cập Nhật Trạng Thái Ca</span>
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">Xác nhận bắt đầu ca, hoàn thành ca hoặc hủy ca trực tiếp ngay trên từng thẻ ca làm đã nhận.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 text-xs">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-purple-600" />
                        <span>Xuất Excel & Thống Kê</span>
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">Tự động thống kê tổng giờ công, thu nhập dự kiến và hỗ trợ xuất bảng chấm công ra file Excel.</p>
                    </div>
                  </div>

                  {/* Guest Callout */}
                  <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-3">
                    <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="text-base font-bold text-slate-900">Chưa có ca làm nào được nhận</h4>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                      Bạn đang xem ở chế độ khách. Đăng nhập hoặc tạo tài khoản Sinh viên để quản lý lịch ca làm việc theo tuần và xuất bảng chấm công cá nhân.
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => onNavigateAuth && onNavigateAuth('login', 'student')}
                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold shadow-sm cursor-pointer"
                      >
                        Đăng Nhập
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateAuth && onNavigateAuth('register', 'student')}
                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold shadow-sm cursor-pointer"
                      >
                        Đăng Ký Sinh Viên
                      </button>
                    </div>
                  </div>
                </div>
              ) : acceptedApplications.length === 0 ? (
                <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-sm">
                  <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-600 font-semibold">
                    Bạn chưa có đơn ứng tuyển nào đạt trạng thái Đã duyệt.
                  </p>
                  <p className="text-xs text-slate-400">
                    Hãy nộp hồ sơ tại mục "Khám phá việc làm" để nhận ca làm việc phù hợp.
                  </p>
                </div>
              ) : filteredAcceptedShifts.length === 0 ? (
                <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-2 shadow-sm">
                  <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-600 font-semibold">
                    Không tìm thấy ca làm nào phù hợp với bộ lọc (Tuần / Khung ca / Chi nhánh / Trạng thái) hiện tại.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAcceptedShifts.map((app, idx) => {
                    const shiftKey = `shift_${app._id || idx}`;
                    const currentStatus = normalizeShiftStatus(app, shiftStatuses[shiftKey]);
                    return (
                      <div
                        key={app._id || idx}
                        className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Đã Duyệt Nhận Ca
                            </span>
                            <h5 className="text-sm font-bold text-slate-900 mt-2">{app.job_title || 'Việc làm bán thời gian'}</h5>
                            <p className="text-xs font-semibold text-blue-600">{app.company_name || 'Doanh nghiệp'}</p>
                          </div>

                          {/* Badge Trạng Thái Ca Làm */}
                          <div className="shrink-0 text-right">
                            {currentStatus === 'upcoming' && (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Sắp diễn ra</span>
                              </span>
                            )}
                            {currentStatus === 'in_progress' && (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 animate-pulse">
                                <Activity className="w-3.5 h-3.5" />
                                <span>Đang làm việc</span>
                              </span>
                            )}
                            {currentStatus === 'completed' && (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Đã hoàn thành</span>
                              </span>
                            )}
                            {currentStatus === 'absent' && (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Vắng mặt</span>
                              </span>
                            )}
                            {currentStatus === 'cancelled' && (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Đã hủy ca</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-2xl space-y-1 text-xs text-slate-600 border border-slate-100">
                          <p className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Khung ca: <strong>{app.work_time || 'Ca linh hoạt theo lịch học'}</strong></span>
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>Địa điểm: <strong>{app.location || 'TP. Hồ Chí Minh'}</strong></span>
                          </p>
                          <p className="flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Lương theo giờ:{' '}
                              <strong className="text-emerald-600">
                                {app.salary_min || app.salary_max
                                  ? `${(app.salary_min || 0).toLocaleString('vi-VN')}đ - ${(app.salary_max || app.salary_min || 0).toLocaleString('vi-VN')}đ/giờ`
                                  : 'Theo quy định ca làm'}
                              </strong>
                            </span>
                          </p>
                        </div>

                        {/* Nút Điều Khiển Trạng Thái Ca Làm */}
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          {currentStatus === 'upcoming' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateShiftStatus(app._id, 'in_progress', 'Đã bắt đầu vào ca làm việc!')}
                              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs shadow-sm cursor-pointer"
                            >
                              Bắt Đầu Ca Làm
                            </button>
                          )}

                          {currentStatus === 'in_progress' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateShiftStatus(app._id, 'completed', 'Đã xác nhận hoàn thành ca làm việc!')}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm cursor-pointer"
                            >
                              Xác Nhận Xong Ca
                            </button>
                          )}

                          {(currentStatus === 'upcoming' || currentStatus === 'in_progress') && (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDialogConfig({
                                  isOpen: true,
                                  title: 'Xin Nghỉ / Hủy Ca Làm',
                                  message: 'Bạn có chắc chắn muốn hủy ca làm đã nhận này? Việc hủy ca sẽ lưu trên hệ thống và thông báo tới Doanh nghiệp.',
                                  type: 'danger',
                                  confirmText: 'Xác Nhận Hủy Ca',
                                  onConfirm: () => {
                                    setConfirmDialogConfig(null);
                                    handleUpdateShiftStatus(app._id, 'cancelled', 'Đã hủy ca làm việc thành công!');
                                  }
                                });
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold border border-slate-200 cursor-pointer"
                            >
                              Xin Nghỉ / Hủy Ca
                            </button>
                          )}

                          {currentStatus === 'cancelled' && (
                            <span className="text-xs text-slate-400 italic">Ca làm đã kết thúc với trạng thái Hủy.</span>
                          )}

                          {currentStatus === 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleMenuSwitch('reviews')}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 cursor-pointer flex items-center gap-1"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>Đánh Giá Doanh Nghiệp</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. MÀN HÌNH QUẢN LÝ CV (profile_cv) (1.4.1 - 1.4.6, NFR-08) */}
        {activeMenu === 'profile_cv' && (
          <div className="w-full max-w-full mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span>Kho Quản Lý CV Chuẩn ATS (PDF ≤ 10MB)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Định dạng bắt buộc là <strong>.pdf</strong> và dung lượng hợp lệ <strong>≤ 10MB</strong>. Tự động dùng CV mặc định khi nộp hồ sơ.
                </p>
              </div>

              <div className="px-3 py-1.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                {isGuestMode ? 'Định dạng PDF ≤ 10MB' : `${myResumes.length} tệp CV đã lưu`}
              </div>
            </div>

            {isGuestMode ? (
              <div className="space-y-6">
                {/* Guest Mode Notice */}
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs text-blue-900">Kho Quản Lý CV Chuẩn ATS Cho Sinh Viên</p>
                    <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                      PARTIME.VN hỗ trợ sinh viên lưu trữ các mẫu CV định dạng PDF chuẩn ATS. Khi bạn nộp đơn ứng tuyển vào các ca làm việc, hệ thống sẽ tự động sử dụng CV mặc định để gửi thẳng tới Nhà tuyển dụng.
                    </p>
                  </div>
                </div>

                
              </div>
            ) : (
              <div className="form-card-col2 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-blue-600" />
                      <span>Kho Quản Lý CV PDF (Tối đa 10MB)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Tải lên các mẫu CV định dạng PDF để nộp hồ sơ nhanh chóng</p>
                  </div>
                </div>

                {/* Upload Form có Hỗ Trợ Kéo Thả (Drag & Drop) và Progress bar (1.4.2) */}
                <div
                  onDragOver={handleCvDragOver}
                  onDragLeave={handleCvDragLeave}
                  onDrop={handleCvDrop}
                  className={`p-6 rounded-2xl border-2 border-dashed transition-all ${isDraggingCv
                    ? 'border-blue-500 bg-blue-50 scale-[1.01] shadow-md'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50'
                    }`}
                >
                  <label className="flex flex-col items-center justify-center cursor-pointer mb-3">
                    <Upload className={`w-8 h-8 mb-2 transition-transform ${isDraggingCv ? 'text-blue-600 scale-125 animate-bounce' : 'text-slate-400'}`} />
                    <span className="text-sm font-bold text-slate-800 text-center">
                      {isDraggingCv ? 'Thả tệp CV PDF vào đây để tải lên ngay!' : 'Kéo thả tệp CV từ máy tính vào đây hoặc nhấp để chọn tệp'}
                    </span>
                    <span className="text-xs text-blue-600 mt-1 font-semibold">Chỉ nhận .pdf (application/pdf), dung lượng ≤ 10MB</span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={(e) => e.target.files?.[0] && handleCvFileSelected(e.target.files[0])}
                      className="hidden"
                    />
                  </label>

                  {/* Thanh Progress bar khi tải lên */}
                  {isUploadingCv && (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Đang xử lý tài liệu PDF...</span>
                        <span className="font-mono text-blue-600 font-bold">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Danh sách các Card CV có 4 nút thao tác (FR 1.4.3 - 1.4.6) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myResumes.map((cv) => (
                    <div
                      key={cv._id}
                      className={`p-5 rounded-2xl bg-white border transition-all ${cv.is_default ? 'border-blue-400 shadow-md ring-1 ring-blue-200' : 'border-slate-200 shadow-xs'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                            PDF
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{cv.file_name}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">Tải lên: {cv.created_at}</p>
                          </div>
                        </div>

                        {/* Badge CV mặc định phát sáng */}
                        {cv.is_default && (
                          <span className="px-2 py-0.5 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-bold flex items-center gap-1 shrink-0">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            <span>Mặc định</span>
                          </span>
                        )}
                      </div>

                      {/* 4 Nút thao tác trên Card CV */}
                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                        {/* 1. Icon Con mắt: Mở Modal xem trước PDF trực tiếp trên web */}
                        <button
                          type="button"
                          onClick={() => setPreviewCvPdf(cv)}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer border border-blue-200 shadow-xs"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-700" />
                          <span>Xem chi tiết</span>
                        </button>

                        {/* 2. Icon Ngôi sao: Đặt làm CV mặc định */}
                        <button
                          type="button"
                          onClick={() => handleSetDefaultCv(cv._id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${cv.is_default
                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'bg-slate-50 hover:bg-amber-50 border-slate-200 text-slate-600 hover:text-amber-700'
                            }`}
                          title="Đặt làm CV mặc định"
                        >
                          <Star className={`w-4 h-4 ${cv.is_default ? 'fill-amber-400 text-amber-500' : ''}`} />
                        </button>

                        {/* 3. Icon Đính kèm: Thay thế file CV từ máy tính */}
                        <button
                          type="button"
                          onClick={() => {
                            setReplacingCvId(cv._id);
                            replaceCvInputRef.current?.click();
                          }}
                          className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 transition-colors cursor-pointer"
                          title="Chọn tệp PDF từ máy tính để thay thế CV"
                        >
                          <Paperclip className="w-4 h-4 text-purple-700" />
                        </button>

                        {/* 4. Icon Thùng rác: Xóa CV */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCv(cv._id)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                          title="Xóa CV"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5.5. MÀN HÌNH HỒ SƠ CÁ NHÂN (student_profile) (1.3.1, 1.3.2) */}
        {activeMenu === 'student_profile' && (
          <div className="w-full max-w-full mx-auto space-y-8 animate-in fade-in duration-300">
            {isGuestMode || !token || !currentUser ? (
              <div className="space-y-6">
                {/* Guest Mode Banner */}
                <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto shadow-xs">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      Hồ Sơ Cá Nhân Sinh Viên
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Bạn đang ở chế độ xem trước. Vui lòng đăng nhập hoặc đăng ký tài khoản sinh viên để quản lý thông tin và hình ảnh hồ sơ cá nhân.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onNavigateAuth && onNavigateAuth('login', 'student')}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md cursor-pointer transition-all"
                    >
                      Đăng Nhập Ngay
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateAuth && onNavigateAuth('register', 'student')}
                      className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold border border-slate-300 cursor-pointer transition-all"
                    >
                      Đăng Ký Sinh Viên
                    </button>
                  </div>
                </div>

                {/* 3 Privacy & Data Protection Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5 text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Bảo Mật Thông Tin 100%</span>
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">Số điện thoại, email và hồ sơ sinh viên chỉ được gửi tới Doanh nghiệp khi bạn bấm nút ứng tuyển.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5 text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>Thông Tin Trường ĐH &amp; CV</span>
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">Cập nhật đầy đủ trường Đại học/Cao đẳng, khu vực cư trú và tệp CV PDF giúp tăng độ tin cậy khi ứng tuyển.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5 text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-purple-600" />
                      <span>Tuyệt Đối Không Làm Phiền</span>
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">Không có tin nhắn rác hay cuộc gọi tiếp thị, chỉ trao đổi trực tiếp với nhà tuyển dụng bạn đã chọn.</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
              {/* Thẻ Thông Tin Cá Nhân Cho Sinh Viên Đã Đăng Nhập (Kèm Ảnh Bìa & Ảnh Đại Diện Kéo Thả) */}
              <div className="form-card-col2 rounded-3xl shadow-xl overflow-hidden bg-white border border-slate-200/80">
                {/* Ảnh bìa sinh viên có Upload, Kéo thả, Xem trước, Khôi phục mặc định */}
                <div
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingStudentCover(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingStudentCover(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingStudentCover(false);
                    if (e.dataTransfer.files?.[0]) handleStudentMediaProcess('cover_image_url', e.dataTransfer.files[0]);
                  }}
                  className={`h-44 sm:h-52 relative overflow-hidden group transition-all ${
                    isDraggingStudentCover ? 'ring-4 ring-blue-500 bg-blue-950/30' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600'
                  }`}
                >
                  {profile.cover_image_url ? (
                    <img
                      src={profile.cover_image_url}
                      alt="Ảnh bìa sinh viên"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 opacity-95" />
                  )}

                  {isDraggingStudentCover && (
                    <div className="absolute inset-0 z-20 bg-blue-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white border-2 border-dashed border-sky-400">
                      <Upload className="w-9 h-9 text-sky-400 animate-bounce mb-1" />
                      <p className="text-xs font-bold">Thả Ảnh Bìa vào đây (.png, .jpg ≤ 10MB)</p>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
                    <label className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>Thay Ảnh Bìa (Kéo thả / Chọn ảnh)</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={(e) => e.target.files?.[0] && handleStudentMediaProcess('cover_image_url', e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                    {profile.cover_image_url && (
                      <button
                        type="button"
                        onClick={() => handleResetStudentMediaToDefault('cover_image_url')}
                        className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-md"
                        title="Xóa ảnh bìa về mặc định"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa ảnh bìa</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 sm:p-8 pt-4 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-200/60">
                    <div className="flex items-center gap-4">
                      {/* Avatar Sinh Viên Upload / Kéo Thả / Xem Trước / Khôi Phục */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingStudentAvatar(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingStudentAvatar(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDraggingStudentAvatar(false);
                          if (e.dataTransfer.files?.[0]) handleStudentMediaProcess('avatar_url', e.dataTransfer.files[0]);
                        }}
                        className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-xl border-4 border-white overflow-hidden group shrink-0 -mt-12 sm:-mt-14 z-10 ${
                          isDraggingStudentAvatar ? 'ring-4 ring-blue-500 scale-105' : ''
                        }`}
                      >
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt="Ảnh đại diện sinh viên"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{profile.full_name?.charAt(0) || 'V'}</span>
                        )}
                        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                          <label className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold cursor-pointer flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            <span>Đổi ảnh</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg"
                              onChange={(e) => e.target.files?.[0] && handleStudentMediaProcess('avatar_url', e.target.files[0])}
                              className="hidden"
                            />
                          </label>
                          {profile.avatar_url && (
                            <button
                              type="button"
                              onClick={() => handleResetStudentMediaToDefault('avatar_url')}
                              className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              title="Xóa ảnh đại diện về mặc định"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>Xóa</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900">{profile.full_name || 'Sinh viên'}</h4>
                        <p className="text-xs text-blue-600 font-mono">{currentUser?.email || ''}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {profileSaveMsg && (
                        <span className="text-xs font-bold text-emerald-600">{profileSaveMsg}</span>
                      )}
                      {!isEditingProfile && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingProfile(true);
                            setPhoneError('');
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-600" />
                          <span>Chỉnh sửa hồ sơ</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isUploadingStudentMedia && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-blue-600 font-bold">
                        <span>Đang tải hình ảnh hồ sơ...</span>
                        <span>{studentMediaProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${studentMediaProgress}%` }} />
                      </div>
                    </div>
                  )}

                {isEditingProfile ? (
                  <form onSubmit={handleProfileSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">Họ và Tên *</label>
                        <input
                          type="text"
                          required
                          value={profileForm.full_name}
                          onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                          className="w-full bg-white border border-blue-200/80 rounded-xl px-4 py-3 text-sm sm:text-base text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">
                          Số Điện Thoại (Bắt buộc đúng 10 chữ số) *
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="0987654321"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full bg-white border border-blue-200/80 rounded-xl px-4 py-3 text-sm sm:text-base text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 shadow-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">Trường Đại Học / Cao Đẳng *</label>
                        <SearchableDropdownInput
                          required
                          value={profileForm.university}
                          onChange={(val) => setProfileForm({ ...profileForm, university: val })}
                          options={UNIVERSITY_SUGGESTIONS}
                          placeholder="Chọn hoặc nhập tên trường Đại học / Cao đẳng..."
                          className="w-full bg-white border border-blue-200/80 rounded-xl px-4 py-3 text-sm sm:text-base text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">
                          Địa Chỉ Cư Trú (Quận/Huyện, Tỉnh/Thành) *
                        </label>
                        <SearchableDropdownInput
                          required
                          value={profileForm.address || ''}
                          onChange={(val) => setProfileForm({ ...profileForm, address: val })}
                          options={[
                            ...HCM_DISTRICTS.map((d) => `${d}, TP. Hồ Chí Minh`),
                            ...VIETNAM_PROVINCES
                          ]}
                          placeholder="Chọn hoặc nhập địa chỉ cư trú..."
                          className="w-full bg-white border border-blue-200/80 rounded-xl px-4 py-3 text-sm sm:text-base text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 shadow-xs"
                        />
                      </div>
                    </div>

                    {phoneError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{phoneError}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setPhoneError('');
                          setProfileForm({
                            full_name: profile.full_name || '',
                            phone: profile.phone || '',
                            university: profile.university || '',
                            address: profile.address || profile.residence_address || '',
                            avatar_url: profile.avatar_url || '',
                            cover_image_url: profile.cover_image_url || ''
                          });
                        }}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold cursor-pointer transition-all"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl btn-primary-dimension text-xs sm:text-sm font-bold shadow-md cursor-pointer"
                      >
                        Lưu Thông Tin
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-sm sm:text-base">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-slate-500 font-medium text-xs sm:text-sm">Họ và Tên Sinh Viên:</p>
                      <p className="text-sm sm:text-base font-bold text-slate-900">{profile.full_name || 'Sinh viên'}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-slate-500 font-medium text-xs sm:text-sm">Số Điện Thoại:</p>
                      <p className="text-sm sm:text-base font-bold text-blue-600 font-mono">{profile.phone || 'Chưa cập nhật'}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-slate-500 font-medium text-xs sm:text-sm">Trường Đào Tạo:</p>
                      <p className="text-sm sm:text-base font-bold text-slate-900">{profile.university || 'Chưa cập nhật'}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-slate-500 font-medium text-xs sm:text-sm">Địa Chỉ Cư Trú:</p>
                      <p className="text-sm sm:text-base font-bold text-slate-900">{profile.address || profile.residence_address || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                )}
              </div>
              </div>
              </>
            )}
          </div>
        )}

        {/* 6. MÀN HÌNH ĐÁNH GIÁ NHÀ TUYỂN DỤNG (UI-SV-REV-01 -> 03 - 1.7.1 -> 1.7.4) */}
        {activeMenu === 'reviews' && (
          <div className="w-full max-w-full mx-auto space-y-8">

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span>Đánh Giá Doanh Nghiệp 2 Chiều</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Cơ chế đánh giá minh bạch sau khi hoàn thành ca làm việc</p>
              </div>

              {/* Tabs: Chờ đánh giá | Lịch sử đánh giá | Đánh giá từ Nhà tuyển dụng (Chỉ hiển thị khi đã đăng nhập) */}
              {!isGuestMode && (
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setReviewTab('pending')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${reviewTab === 'pending' ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Ca làm chờ gửi đánh giá ({completedJobsForReview.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewTab('history')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${reviewTab === 'history' ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Ca làm đã hoàn tất đánh giá ({myReviews.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewTab('received');
                      fetchReviews();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${reviewTab === 'received' ? 'bg-amber-50 text-amber-800 font-bold border border-amber-300 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <span>Nhà tuyển dụng đánh giá tôi ({receivedReviews.length})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Chế độ xem khách */}
            {isGuestMode ? (
              <div className="space-y-6">
                

                {/* 3 Core Review Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Chi Trả Minh Bạch</span>
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">Đảm bảo thù lao tính chuẩn xác theo giờ công thực tế và trả đúng hạn theo cam kết.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span>Môi Trường Thân Thiện</span>
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">Đánh giá thái độ của quản lý, sự hỗ trợ từ đồng nghiệp và điều kiện làm việc an toàn.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Tạo Điều Kiện Học Tập</span>
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">Ưu tiên các doanh nghiệp tôn trọng lịch học và hỗ trợ sinh viên đổi ca trong các kỳ thi.</p>
                  </div>
                </div>

                
              </div>
            ) : (
              <>
                {/* TAB CHỜ ĐÁNH GIÁ (1.7.1, 1.7.2) */}
                {reviewTab === 'pending' && (
                  <div className="space-y-4">
                    {completedJobsForReview.length === 0 ? (
                      <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-xs text-slate-500 shadow-sm">
                        Hiện chưa có công việc hoàn thành nào chờ đánh giá. Sau khi được duyệt trúng tuyển và hoàn tất ca làm, bạn sẽ có thể viết đánh giá tại đây.
                      </div>
                    ) : (
                  completedJobsForReview.map((app) => (
                    <div
                      key={app._id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{app.job_title}</h4>
                        <p className="text-xs font-semibold text-emerald-600 mt-0.5">{app.company_name}</p>
                        <span className="text-xs text-slate-400 font-mono mt-1 block">Trạng thái: Hoàn thành tuyển dụng</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setReviewModalJob(app);
                          setReviewScore(5);
                          setReviewContent('');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 text-xs font-black transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <Star className="w-4 h-4 fill-slate-950" />
                        <span>Viết Đánh Giá</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB LỊCH SỬ ĐÁNH GIÁ (1.7.3, 1.7.4) */}
            {reviewTab === 'history' && (
              <div className="space-y-4">
                {myReviews.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                    Bạn chưa gửi đánh giá nào.
                  </div>
                ) : (
                  myReviews.map((rev) => {
                    const matchedApp = myApplications.find(a => a._id === rev.application_id);
                    const compName = rev.company_name || matchedApp?.company_name || 'Doanh nghiệp';
                    const jTitle = rev.job_title || matchedApp?.job_title || 'Việc làm bán thời gian';

                    return (
                      <div
                        key={rev._id}
                        onClick={() => handleOpenReviewDetail({ ...rev, company_name: compName, job_title: jTitle })}
                        className="p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer shadow-sm space-y-3 group"
                        title="Nhấn vào để xem đầy đủ nội dung bài nhận xét chi tiết"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center text-yellow-400">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-4 h-4 ${s <= rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-bold text-slate-900">({rev.rating}/5 sao)</span>
                            <span className="text-sm font-bold text-blue-600 ml-2">
                              • {compName}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono">{rev.created_at}</span>
                        </div>

                        <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">
                          "{rev.comment}"
                        </p>

                        {rev.is_hidden ? (
                          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                            <span className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Đánh giá này đã bị Quản trị viên ẩn do vi phạm tiêu chuẩn cộng đồng.</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStudentReview(rev);
                              }}
                              className="px-3 py-1 rounded-lg bg-white hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReviewDetail({ ...rev, company_name: compName, job_title: jTitle });
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 shadow-xs"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-700" />
                              <span>Xem chi tiết</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingReviewModal({
                                  _id: rev._id,
                                  rating: rev.rating || 5,
                                  comment: rev.comment || '',
                                  job_title: jTitle,
                                  company_name: compName
                                });
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Chỉnh sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStudentReview(rev);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 3: Danh sách đánh giá sao & nhận xét Nhà tuyển dụng chấm cho Sinh viên */}
            {reviewTab === 'received' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {receivedReviews.length === 0 ? (
                  <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
                    <Star className="w-10 h-10 text-amber-300 mx-auto" />
                    <p className="text-sm font-black text-slate-900">Chưa có nhận xét nào từ Nhà tuyển dụng</p>
                    <p className="text-xs text-slate-500">Khi bạn hoàn thành ca làm việc, Doanh nghiệp có thể chấm điểm sao và viết nhận xét về tác phong của bạn tại đây.</p>
                  </div>
                ) : (
                  receivedReviews.map((rev) => {
                    const stars = Number(rev.rating || 5);
                    return (
                      <div key={rev._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 hover:border-amber-200 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={(e) => handleOpenCompanyProfile({ company_name: rev.company_name, employer_id: rev.employer_id || rev.reviewer_id }, e)}
                              className="text-sm font-black text-slate-900 hover:text-emerald-700 hover:underline text-left cursor-pointer"
                            >
                              {rev.company_name || rev.reviewer_name || 'Doanh nghiệp'}
                            </button>
                            <p className="text-xs font-bold text-slate-600 mt-0.5 truncate">{rev.job_title || 'Ca làm việc đã hoàn thành'}</p>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= stars ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                            ))}
                            <span className="ml-1 text-xs font-black text-amber-800">{stars}.0</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">
                          "{rev.comment || 'Không có lời nhận xét chi tiết.'}"
                        </p>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span>Đánh giá từ Nhà tuyển dụng</span>
                          <span>{rev.created_at || ''}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    )}

        {/* MÀN HÌNH BÁO CÁO VI PHẠM ĐÃ GỬI & TIẾN ĐỘ XỬ LÝ TỪ ADMIN */}
        {activeMenu === 'my_reports' && (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                  <Flag className="w-5 h-5 text-rose-600" />
                  <span>Báo Cáo Vi Phạm Đã Gửi & Tiến Độ Xử Lý</span>
                </h2>
                <p className="text-xs text-slate-600 font-semibold mt-1">
                  Theo dõi các phiếu khiếu nại tin tuyển dụng, doanh nghiệp hoặc hội thoại chat bạn đã gửi tới Quản trị viên.
                </p>
              </div>
              {!isGuestMode && (
                <button
                  type="button"
                  onClick={fetchMyReports}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Cập nhật tiến độ</span>
                </button>
              )}
            </div>

            {isGuestMode ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Flag className="w-4 h-4 text-rose-600" />
                      <span>Bảo Vệ Quyền Lợi Sinh Viên</span>
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">Báo cáo tin tuyển dụng lừa đảo, thu phí bất hợp pháp hoặc hội thoại quấy rối để được Quản trị viên hỗ trợ kịp thời.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Theo Dõi Tiến Độ Xử Lý</span>
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">Cập nhật trạng thái xử lý theo thời gian thực từ Ban Quản Trị (Chờ xử lý, Đang điều tra, Đã giải quyết).</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Lưu Trữ Kết Quả & Phản Hồi</span>
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">Xem lại toàn bộ lý do, bằng chứng đã gửi kèm nội dung kết luận từ Quản trị viên hệ thống.</p>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-3">
                  <Flag className="w-10 h-10 text-rose-400 mx-auto" />
                  <h4 className="text-base font-bold text-slate-900">Báo cáo vi phạm & Theo dõi xử lý</h4>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    Bạn đang xem ở chế độ khách. Vui lòng đăng nhập hoặc tạo tài khoản Sinh viên để gửi khiếu nại và xem lịch sử báo cáo vi phạm của bạn.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onNavigateAuth && onNavigateAuth('login', 'student')}
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold shadow-sm cursor-pointer"
                    >
                      Đăng Nhập
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateAuth && onNavigateAuth('register', 'student')}
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold shadow-sm cursor-pointer"
                    >
                      Đăng Ký Sinh Viên
                    </button>
                  </div>
                </div>
              </div>
            ) : myReports.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-2">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-black text-slate-900">Bạn chưa gửi báo cáo vi phạm nào</p>
                <p className="text-xs text-slate-500">Nếu phát hiện tin tuyển dụng có dấu hiệu lừa đảo hoặc hành vi bất thường, hãy bấm nút Báo cáo trên thẻ việc làm để được Admin bảo vệ.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myReports.map((rep) => {
                  const st = rep.status || 'pending';
                  const stMeta =
                    st === 'resolved'
                      ? { label: 'Đã giải quyết', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                      : st === 'investigating'
                      ? { label: 'Đang điều tra', cls: 'bg-amber-50 text-amber-800 border-amber-200' }
                      : st === 'dismissed'
                      ? { label: 'Bị bác bỏ', cls: 'bg-slate-100 text-slate-600 border-slate-300' }
                      : { label: 'Chờ Admin xử lý', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
                  return (
                    <div key={rep._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-black text-slate-700">
                              {rep.ticket_code || rep._id}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-700">
                              {rep.report_type === 'chat' ? 'Hội thoại Chat' : rep.report_type === 'user' ? 'Người dùng' : 'Tin tuyển dụng'}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">Gửi lúc: {rep.created_at || ''}</span>
                          </div>
                          <h3 className="text-sm font-black text-slate-900">{rep.target_title || 'Đối tượng vi phạm'}</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-xl border text-xs font-black shrink-0 ${stMeta.cls}`}>
                          {stMeta.label}
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
                        <p><strong className="text-slate-900">Lý do khiếu nại:</strong> {rep.reason}</p>
                        {rep.evidence && <p><strong className="text-slate-900">Bằng chứng đính kèm:</strong> {rep.evidence}</p>}
                      </div>

                      {(rep.admin_note || rep.resolved_at) && (
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 space-y-1">
                          <p className="font-black text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Phản hồi xử lý từ Quản trị viên {rep.resolved_at ? `(${rep.resolved_at})` : ''}:</span>
                          </p>
                          <p className="font-medium text-emerald-900">{rep.admin_note || 'Quản trị viên đã cập nhật trạng thái xử lý phiếu khiếu nại này.'}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 7. MÀN HÌNH CHAT CHI TIẾT & GỌI VIDEO WEBRTC (UI-SV-CHAT-02, UI-SV-CALL-01 - 1.8 & 1.10) */}
        {activeMenu === 'chat' && (
          <div className="w-full max-w-full h-[calc(100vh-112px)] sm:h-[calc(100vh-128px)] lg:h-[calc(100vh-144px)] min-h-[540px] flex flex-col lg:flex-row rounded-3xl bg-white border border-slate-200/80 shadow-md overflow-hidden text-slate-900">
            {/* Cột trái: Danh sách hội thoại với Doanh nghiệp + Tìm kiếm & Lọc chưa phản hồi */}
            {!isGuestMode && (
              <aside className={`${selectedContact ? 'hidden lg:flex' : 'flex flex-1 lg:flex-none'} w-full lg:w-[320px] xl:w-[360px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/70 flex-col min-h-0 overflow-hidden`}>
                <div className="px-4 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />
                    <h3 className="text-sm font-black text-slate-900 truncate">Hội Thoại Doanh Nghiệp</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold shrink-0">
                    {contacts.length}
                  </span>
                </div>
                <StudentChatContactsPanel
                  contacts={contacts}
                  selectedContact={selectedContact}
                  chatSearchQuery={chatSearchQuery}
                  onSearchChange={setChatSearchQuery}
                  chatUnrepliedOnly={chatUnrepliedOnly}
                  onToggleUnreplied={() => setChatUnrepliedOnly(!chatUnrepliedOnly)}
                  onSelectContact={(contact) => setSelectedContact(contact)}
                  onFindJobs={() => handleMenuSwitch('jobs')}
                />
              </aside>
            )}

            {/* Khung phải: Hội thoại chi tiết, WebRTC Video/Audio & Nhập tin nhắn */}
            <div className={`${!isGuestMode && !selectedContact ? 'hidden lg:flex' : 'flex'} flex-1 min-w-0 min-h-0 flex-col bg-white overflow-hidden`}>
            {isGuestMode ? (
              <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-6 overflow-y-auto">
                

                {/* 3 Core Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span>Nhắn Tin Tức Thời</span>
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">Trao đổi nhanh các thông tin về yêu cầu công việc, vị trí làm việc và sắp xếp ca làm phù hợp.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-indigo-600" />
                      <span>Phỏng Vấn WebRTC HD</span>
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">Thực hiện cuộc gọi video chất lượng cao trực tiếp trên trình duyệt, không cần tải ứng dụng bên ngoài.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Bảo Mật Quyền Riêng Tư</span>
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">Kết nối P2P mã hóa đầu cuối, không chia sẻ số điện thoại cá nhân khi chưa được bạn đồng ý.</p>
                  </div>
                </div>

                {/* Guest Action Callout */}
                <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Kênh hội thoại phỏng vấn trực tuyến</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Danh bạ hội thoại sẽ tự động xuất hiện sau khi bạn nộp hồ sơ ứng tuyển vào vị trí của Doanh nghiệp. Vui lòng đăng nhập hoặc đăng ký tài khoản Sinh viên để bắt đầu.
                  </p>
                </div>
              </div>
            ) : !selectedContact ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-5 shadow-sm">
                  <MessageSquare className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {contacts.length > 0 ? 'Chọn Một Cuộc Trò Chuyện' : 'Chưa Có Cuộc Trò Chuyện Nào'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
                  {contacts.length > 0
                    ? 'Hãy chọn một doanh nghiệp từ danh sách bên trái để xem nội dung trao đổi và phỏng vấn trực tuyến.'
                    : 'Bạn chưa ứng tuyển vào công việc nào. Khi bạn nộp hồ sơ ứng tuyển, bạn có thể trò chuyện và trao đổi trực tiếp với nhà tuyển dụng tại đây.'}
                </p>
                {contacts.length === 0 && (
                  <button
                    type="button"
                    onClick={() => handleMenuSwitch('jobs')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Tìm Việc Ngay ({activeOpenJobs.length} việc làm)</span>
                  </button>
                )}
              </div>
            ) : (
              <>
            <div className="lg:hidden px-3.5 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Danh sách hội thoại ({contacts.length})</span>
              </button>
            </div>
            {/* Khung Header Chat: Tên NTD, Online/Offline, Vị trí ứng tuyển, Icon Camera WebRTC, Báo cáo */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    {(selectedContact?.name || 'D').charAt(0)}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${selectedContact?.online ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}></span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{selectedContact?.name || 'Doanh nghiệp'}</h4>
                  <p className="text-xs text-emerald-600 font-medium">
                    {selectedContact?.online ? '● Đang trực tuyến' : '○ Ngoại tuyến'}{selectedContact?.subtitle ? ` • ${selectedContact.subtitle}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 2 Nút Gọi Trực Tuyến: Gọi Thoại & Gọi Video */}
                <button
                  type="button"
                  onClick={() => handleStartCall('audio')}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Gọi thoại trực tiếp với Doanh nghiệp"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Gọi thoại</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartCall('video')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Gọi video phỏng vấn trực tuyến qua WebRTC"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Gọi video</span>
                </button>

                {/* Icon Cờ Báo Cáo Vi Phạm */}
                <button
                  type="button"
                  onClick={() => {
                    const flagged = chatMessages.filter(m => m.is_flagged).flatMap(m => m.flagged_words || []);
                    const uniqueFlagged = [...new Set(flagged)];
                    const reason = uniqueFlagged.length > 0
                      ? `Phát hiện từ ngữ vi phạm quy định trong tin nhắn: [${uniqueFlagged.join(', ')}]. Chi tiết vi phạm: `
                      : '';
                    setReportReason(reason);
                    setReportModalData({
                      type: 'chat',
                      target_id: selectedContact?.employer_id || selectedContact?.id || 'emp_user',
                      application_id: selectedContact?.application_id || '',
                      room_id: getRoomId(),
                      target_title: `Hội thoại với ${selectedContact?.name || 'Doanh nghiệp'}${selectedContact?.subtitle ? ` (${selectedContact.subtitle})` : ''}`
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  title="Báo cáo quấy rối hoặc vi phạm quy định cộng đồng"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Báo cáo</span>
                </button>
              </div>
            </div>

            {/* MÀN HÌNH GỌI TRỰC TUYẾN 2 CHIỀU (UI-SV-CALL-01) */}
            {isVideoCalling ? (
              <div className="flex-1 min-h-0 bg-black relative flex flex-col items-center justify-center p-3 sm:p-4">
                {/* Khung hình chính cuộc gọi */}
                <div className="w-full flex-1 min-h-0 max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden shadow-2xl">
                  {/* Badge thông tin & thời lượng cuộc gọi nổi ở góc trên */}
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-white text-xs shadow-lg font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-mono font-bold text-emerald-300">
                      {callStatus === 'calling' ? 'Đang đổ chuông...' : `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}`}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-200 truncate max-w-[200px]">
                      {callType === 'video' ? 'Phỏng vấn Video' : 'Cuộc gọi Thoại'}: {selectedContact?.name || 'Doanh nghiệp'}
                    </span>
                  </div>

                  {callStatus === 'calling' ? (
                    <div className="text-center space-y-4">
                      <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                        <span className="absolute inset-0 rounded-full bg-sky-500/20 animate-ping"></span>
                        <div className="w-20 h-20 rounded-full bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-2xl">
                          {callType === 'video' ? <Video className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">Đang đổ chuông tới {selectedContact?.name || 'Doanh nghiệp'}...</h3>
                        <p className="text-xs text-slate-400 mt-1">Vui lòng chờ Doanh nghiệp nhấc máy phỏng vấn</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Remote Video Stream if received */}
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`absolute inset-0 w-full h-full object-cover ${callType === 'video' && hasRemoteVideo ? 'block' : 'hidden'}`}
                      />
                      {(!hasRemoteVideo || callType === 'audio') && (
                        <div className="text-center space-y-3">
                          <div className="w-24 h-24 rounded-full bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-black text-3xl flex items-center justify-center mx-auto animate-pulse">
                            {(selectedContact?.name || 'DN')[0]}
                          </div>
                          <p className="text-sm font-bold text-white">
                            {callType === 'video' ? `Cuộc gọi Video phỏng vấn với ${selectedContact?.name || 'Doanh nghiệp'}` : `Cuộc gọi Thoại Audio với ${selectedContact?.name || 'Doanh nghiệp'}`}
                          </p>
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Thời lượng: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Khung hình camera phụ nếu là cuộc gọi Video */}
                  {callType === 'video' && (
                    <div className="absolute bottom-4 right-4 w-36 sm:w-44 h-24 sm:h-32 rounded-2xl bg-slate-950 border-2 border-sky-400/80 overflow-hidden shadow-2xl z-20 flex items-center justify-center">
                      {!isCameraOff ? (
                        <>
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 left-2 text-[11px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                            Bạn ({currentUser?.profile?.full_name || currentUser?.full_name || 'Tôi'})
                          </span>
                        </>
                      ) : (
                        <div className="text-center p-2 text-slate-400">
                          <CameraOff className="w-5 h-5 mx-auto text-rose-400 mb-1" />
                          <span className="text-[10px] font-bold block text-slate-300">Camera đã tắt</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* THANH ĐIỀU KHIỂN NỔI ĐÈ TRỰC TIẾP LÊN MÀN HÌNH GỌI (LUÔN HIỂN THỊ CẢ NGƯỜI GỌI & NGƯỜI NGHE) */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-white/20 shadow-2xl">
                    {/* Nút Mic */}
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-3 rounded-full cursor-pointer transition-all shadow-md flex items-center justify-center ${
                        isMuted ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:scale-105'
                      }`}
                      title={isMuted ? 'Bật Mic (Micro đang tắt)' : 'Tắt Mic (Micro đang bật)'}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    {/* Nút Camera (nếu là cuộc gọi Video) */}
                    {callType === 'video' && (
                      <button
                        type="button"
                        onClick={() => setIsCameraOff(!isCameraOff)}
                        className={`p-3 rounded-full cursor-pointer transition-all shadow-md flex items-center justify-center ${
                          isCameraOff ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:scale-105'
                        }`}
                        title={isCameraOff ? 'Mở Camera (Camera đang tắt)' : 'Tắt Camera (Camera đang bật)'}
                      >
                        {isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                      </button>
                    )}

                    {/* Nút Kết Thúc Cuộc Gọi (Cúp Máy) */}
                    <button
                      type="button"
                      onClick={() => handleEndCall(true)}
                      className="p-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg shadow-rose-950/80 transition-all hover:scale-105 flex items-center justify-center"
                      title="Kết thúc cuộc gọi"
                    >
                      <Phone className="w-5 h-5 rotate-[135deg]" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* KHUNG TIN NHẮN CHAT NGUYÊN BẢN (FR 1.8.2 & 1.10.3) */
              <>
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                      <MessageSquare className="w-10 h-10 mb-2 text-blue-300" />
                      <p className="text-sm font-bold text-slate-700">Chưa có tin nhắn trong cuộc trò chuyện này</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-md">
                        Hãy gửi lời chào hoặc trao đổi lịch phỏng vấn trực tiếp với {selectedContact?.name || 'Doanh nghiệp'}.
                      </p>
                    </div>
                  ) : chatMessages.map((m) => {
                    if (m.type === 'call_record') {
                      const isOutgoing = m.caller_role === 'student' || m.caller_id === currentUser?._id;
                      const isMissed = m.call_status === 'missed';
                      const callTypeLabel = m.call_type === 'video' ? 'Video' : 'Thoại';

                      if (isMissed) {
                        return (
                          <div key={m._id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} my-2.5`}>
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 shadow-sm max-w-sm flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200 shadow-inner">
                                  <Phone className="w-5 h-5 rotate-[135deg]" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-900">
                                    {isOutgoing ? `Bạn đã gọi ${callTypeLabel} (Không trả lời)` : `Đã nhỡ cuộc gọi ${callTypeLabel}`}
                                  </p>
                                  <p className="text-xs text-slate-500 font-mono mt-0.5">{m.created_at && m.created_at.includes(' ') ? m.created_at.split(' ')[1].slice(0, 5) : m.created_at}</p>
                                </div>
                              </div>
                              {!isOutgoing && (
                                <button
                                  type="button"
                                  onClick={() => handleStartCall(m.call_type || 'video')}
                                  className="px-3.5 py-1.5 rounded-xl btn-primary-dimension text-white text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0 flex items-center gap-1.5 hover:scale-105 active:scale-95"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>Gọi lại</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={m._id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} my-2`}>
                          <div className={`px-4 py-2 rounded-2xl text-xs font-bold border flex items-center gap-2 shadow-sm ${isOutgoing
                            ? 'bg-blue-50 text-blue-700 border-blue-200 rounded-br-sm'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 rounded-bl-sm'
                            }`}>
                            <Phone className={`w-3.5 h-3.5 ${isOutgoing ? 'text-blue-600' : 'text-emerald-600'}`} />
                            <span>
                              {isOutgoing ? `Cuộc gọi đi (${callTypeLabel})` : `Cuộc gọi đến (${callTypeLabel})`} • {m.duration_str || '0:00'}
                            </span>
                            <span className="text-xs text-slate-400 font-mono ml-1">({m.created_at && m.created_at.includes(' ') ? m.created_at.split(' ')[1].slice(0, 5) : m.created_at})</span>
                          </div>
                        </div>
                      );
                    }

                    const isMe = m.sender_role === 'student' || m.sender_email === currentUser?.email;
                    return (
                      <div
                        key={m._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-xs font-bold text-slate-500">
                            {isMe ? `Bạn (${currentUser?.profile?.full_name || currentUser?.full_name || 'Tôi'})` : (m.sender_name || selectedContact?.name || 'Doanh nghiệp')}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{m.created_at}</span>
                        </div>

                        {/* Bong bóng tin nhắn kèm cảnh báo từ cấm & tệp đính kèm */}
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] xl:max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${isMe
                            ? 'bg-blue-600 text-white rounded-br-sm shadow-sm'
                            : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200 shadow-sm'
                            }`}
                        >
                          {(() => {
                            const rawText = m.clean_content || m.content || '';
                            const clientMasked = maskBannedWordsClient(rawText, bannedKeywords);
                            const displayContent = clientMasked.cleanText;
                            const showFlagNotice = Boolean(m.is_flagged || clientMasked.isFlagged);
                            return showFlagNotice ? (
                              <div className="space-y-1.5">
                                <p className="whitespace-pre-wrap">{displayContent}</p>
                                <div className={`flex items-center justify-between gap-2 pt-1.5 border-t text-xs opacity-95 ${isMe ? 'border-white/25' : 'border-slate-300 text-slate-600'}`}>
                                  <span className="italic flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                    Từ ngữ nhạy cảm đã được che (***)
                                  </span>
                                  {!isMe && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReportReason(`Báo cáo tin nhắn vi phạm tiêu chuẩn cộng đồng: "${m.original_content || m.content}"`);
                                        setReportModalData({
                                          type: 'chat',
                                          target_id: m.sender_id || 'emp_user_employer_ngoc',
                                          target_title: `Báo cáo tin nhắn từ ${m.sender_name || 'Doanh nghiệp'}`
                                        });
                                      }}
                                      className="px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow cursor-pointer transition-colors"
                                    >
                                      Báo cáo
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap">{displayContent}</p>
                            );
                          })()}

                          {/* Render Tệp Hình Ảnh Đính Kèm Thực Tế */}
                          {m.media_url && (m.file_name?.match(/\.(png|jpe?g|webp)$/i) || m.media_url?.startsWith('data:image')) && (
                            <div
                              onClick={() => setChatPreviewDoc({ fileUrl: m.media_url, fileName: m.file_name || 'Hinh_Anh.jpg', title: 'Tệp Hình Ảnh Đính Kèm' })}
                              className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-w-xs sm:max-w-sm cursor-pointer hover:opacity-95 transition-opacity shadow-sm"
                            >
                              <img 
                                src={m.media_url} 
                                alt={m.file_name || 'Ảnh đính kèm'} 
                                onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                                className="w-full max-h-[220px] object-cover bg-slate-100" 
                              />
                              <div className="p-1.5 bg-black/60 text-xs text-white flex items-center justify-between">
                                <span className="truncate max-w-[220px]">{m.file_name || 'Ảnh đính kèm'}</span>
                                <Eye className="w-3.5 h-3.5 text-blue-300" />
                              </div>
                            </div>
                          )}

                          {/* Render Tệp PDF Đính Kèm Thực Tế */}
                          {m.media_url && (m.file_name?.toLowerCase().endsWith('.pdf') || m.media_url?.includes('pdf') || m.media_url?.startsWith('data:application/pdf')) && (
                            <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-red-200 flex items-center justify-between gap-3 text-xs w-full max-w-xs sm:max-w-sm">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate text-xs">{m.file_name || 'TaiLieu.pdf'}</p>
                                  <span className="text-xs text-slate-500 font-mono">Tài liệu PDF (≤10MB)</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setChatPreviewDoc({ fileUrl: m.media_url, fileName: m.file_name || 'TaiLieu.pdf', title: 'Tài Liệu PDF Đính Kèm' })}
                                  className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs cursor-pointer transition-colors"
                                >
                                  Xem
                                </button>
                                <a
                                  href={m.media_url}
                                  download={m.file_name || 'TaiLieu.pdf'}
                                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                  title="Tải về máy tính"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono mt-0.5 px-1">Đã gửi</span>
                      </div>
                    );
                  })}
                </div>

                {/* Chip Preview Tệp Đính Kèm Trước Khi Gửi */}
                {chatAttachment && (
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-slate-700 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 text-xs text-slate-800">
                      <Paperclip className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="font-bold text-slate-900 truncate max-w-xs">{chatAttachment.name}</span>
                      <span className="text-xs text-slate-500 font-mono">({chatAttachment.sizeStr})</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase whitespace-nowrap">Sẵn sàng gửi</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChatAttachment(null)}
                      className="p-1 text-slate-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hủy đính kèm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Form nhập tin nhắn kèm nút đính kèm tệp */}
                <form onSubmit={handleSendMessage} className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2.5 shrink-0">
                  <input
                    type="file"
                    ref={chatFileInputRef}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleChatFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => chatFileInputRef.current?.click()}
                    className="p-3 rounded-xl bg-white hover:bg-slate-100 text-purple-600 border border-slate-300 transition-colors cursor-pointer shrink-0 shadow-sm"
                    title="Đính kèm tệp PDF hoặc ảnh (≤ 10MB)"
                  >
                    <Paperclip className="w-[18px] h-[18px]" />
                  </button>

                  <input
                    type="text"
                    value={newMsgText}
                    onChange={(e) => setNewMsgText(e.target.value)}
                    placeholder="Nhập tin nhắn... (Hệ thống tự động lọc từ ngữ cấm ***)"
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                  />
                  <button
                    type="submit"
                    disabled={!newMsgText.trim() && !chatAttachment}
                    className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Gửi</span>
                  </button>
                </form>
              </>
            )}
          </>
        )}
            </div>
      </div>
    )}

      </main>

      {/* ======================= SLIDE-OVER PANE CHI TIẾT JD ======================= */}
      {selectedJobDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white border-l border-slate-200 flex flex-col shadow-2xl h-full text-slate-800 animate-in slide-in-from-right duration-300 p-6 overflow-y-auto space-y-6">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <MediaAvatar
                  src={selectedJobDetail.company_logo || selectedJobDetail.company_info?.logo_url}
                  alt={selectedJobDetail.company_name || 'Logo doanh nghiệp'}
                  fallbackIcon={<Building className="w-6 h-6" />}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mt-0.5"
                  fallbackClassName="bg-emerald-50 border border-emerald-200 text-emerald-700"
                />
                <div className="min-w-0 flex-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                    {selectedJobDetail.work_time || 'Ca làm linh hoạt'}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1.5">{selectedJobDetail.title}</h3>
                  <button
                    type="button"
                    onClick={(e) => handleOpenCompanyProfile(selectedJobDetail, e)}
                    className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline mt-0.5 cursor-pointer inline-flex items-center gap-1.5"
                    title="Mở trang hồ sơ doanh nghiệp"
                  >
                    <Building className="w-3.5 h-3.5 shrink-0" />
                    <span>{selectedJobDetail.company_name}</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </button>
                  <p className="text-xs text-slate-600">{selectedJobDetail.location}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobDetail(null)}
                className="text-slate-500 hover:text-slate-900 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông số việc làm */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-700 font-bold block mb-1">Mức Lương Theo Giờ</span>
                <span className="text-sm font-black text-blue-700">
                  {selectedJobDetail.is_negotiable ? 'Thỏa thuận' : `${selectedJobDetail.salary_min?.toLocaleString()}đ - ${selectedJobDetail.salary_max?.toLocaleString()}đ/h`}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-700 font-bold block mb-1">Độ Tin Cậy Doanh Nghiệp</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Đã xác thực GPKD</span>
                </span>
              </div>
            </div>

            {/* Mô tả chi tiết JD */}
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">Mô Tả Chi Tiết Công Việc (JD)</h4>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium shadow-xs">
                {selectedJobDetail.description}
              </div>
            </div>

            {/* Footer Buttons: Ứng tuyển & Báo cáo lừa đảo */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setReportModalData({
                    type: 'job',
                    target_id: selectedJobDetail._id,
                    target_title: selectedJobDetail.title
                  });
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                title="Báo cáo tin tuyển dụng vi phạm quy định"
              >
                <Flag className="w-4 h-4" />
                <span>Báo cáo</span>
              </button>

              {(() => {
                const userAppDetail = (!isGuestMode && token && currentUser)
                  ? myApplications.find(a => (a.job_id === selectedJobDetail._id || a.job?._id === selectedJobDetail._id) && a.application_status !== 'cancelled' && a.application_status !== 'withdrawn')
                  : null;
                const isJobDetailCompleted = Boolean(userAppDetail && (userAppDetail.shift_status === 'completed' || userAppDetail.application_status === 'completed'));
                const isDetailApplied = Boolean(userAppDetail && !isJobDetailCompleted);

                if (isJobDetailCompleted) {
                  return (
                    <button
                      type="button"
                      disabled
                      className="px-6 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-bold cursor-not-allowed flex items-center gap-1.5 opacity-90 shadow-none whitespace-nowrap"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Đã hoàn thành công việc</span>
                    </button>
                  );
                }
                if (isDetailApplied) {
                  return (
                    <button
                      type="button"
                      disabled
                      className="px-6 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-600 text-xs font-bold cursor-not-allowed flex items-center gap-1.5 opacity-90 shadow-none whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" />
                      <span>Đã ứng tuyển</span>
                    </button>
                  );
                }
                const detailStatus = normalizeJobStatus(selectedJobDetail);
                if (selectedJobDetail.is_open === false || ['filled', 'completed', 'closed'].includes(detailStatus)) {
                  return (
                    <button
                      type="button"
                      disabled
                      className="px-6 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-500 text-xs font-bold cursor-not-allowed flex items-center gap-1.5 opacity-90 shadow-none whitespace-nowrap"
                    >
                      <span>{detailStatus === 'filled' ? 'Đã nhận đủ người' : detailStatus === 'completed' ? 'Đã hoàn thành' : 'Tạm đóng nhận hồ sơ'}</span>
                    </button>
                  );
                }
                return (
                  <button
                    type="button"
                    onClick={() => {
                      const jobToApply = selectedJobDetail;
                      setSelectedJobDetail(null);
                      handleOpenApplyModal(jobToApply);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-bold shadow-md cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>Ứng tuyển ngay</span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ======================= POPUP MODAL ỨNG TUYỂN ======================= */}
      {applyModalJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-slate-800 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900">Nộp Hồ Sơ Ứng Tuyển</h3>
                <p className="text-xs text-blue-700 font-bold mt-0.5">{applyModalJob.title}</p>
                <p className="text-xs text-slate-600 font-medium">{applyModalJob.company_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyModalJob(null)}
                className="text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyJobSubmit} className="space-y-4">
              {/* Tự động chọn sẵn "CV Mặc định" */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Chọn CV Ứng Tuyển (Tự động chọn CV Mặc định) *
                </label>
                <select
                  required
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 font-medium"
                >
                  {myResumes.length === 0 ? (
                    <option value="">Chưa có CV nào - Hãy tải CV lên trước</option>
                  ) : (
                    myResumes.map(r => (
                      <option key={r._id} value={r._id}>
                        {r.file_name} {r.is_default ? '(CV Mặc Định)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>


              {applyMsg.text && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${applyMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{applyMsg.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalJob(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={applyLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {applyLoading ? 'Đang gửi...' : 'Gửi Hồ Sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL XEM TRƯỚC PDF CV & TẢI VỀ MÁY TÍNH (A4 CHUẨN) ======================= */}
      {/* MODAL XEM TRƯỚC TỆP ĐÍNH KÈM CHAT */}
      {chatPreviewDoc && (
        <DocumentViewerModal
          isOpen={!!chatPreviewDoc}
          onClose={() => setChatPreviewDoc(null)}
          type={chatPreviewDoc.fileUrl?.match(/\.(png|jpe?g|webp)$/i) || chatPreviewDoc.fileUrl?.startsWith('data:image') ? 'image' : 'cv'}
          data={chatPreviewDoc}
          onDownloadSuccess={(msg) => onShowBanner && onShowBanner(msg, 'success')}
        />
      )}

      <DocumentViewerModal
        isOpen={!!previewCvPdf}
        onClose={() => setPreviewCvPdf(null)}
        type="cv"
        data={{
          studentName: currentUser?.profile?.full_name || currentUser?.full_name || 'Hồ sơ sinh viên',
          university: currentUser?.profile?.university || 'Trường Đại học',
          phone: currentUser?.profile?.phone || '',
          email: currentUser?.email || '',
          fileName: previewCvPdf?.file_name || 'CV_UngVien.pdf',
          fileUrl: previewCvPdf?.file_url
        }}
        onDownloadSuccess={(msg) => onShowBanner && onShowBanner(msg, 'success')}
      />

      {/* Lớp media cuộc gọi: luôn phát âm thanh đối phương + thanh điều khiển nổi khi đang gọi mà không ở màn Chat */}
      <CallMediaLayer
        isVideoCalling={isVideoCalling}
        callType={callType}
        callStatus={callStatus}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        callDuration={callDuration}
        remoteStreamRef={remoteStreamRef}
        showFloatingControls={activeMenu !== 'chat'}
        onToggleMic={() => setIsMuted(m => !m)}
        onToggleCamera={() => setIsCameraOff(c => !c)}
        onEndCall={() => handleEndCall(true)}
        onOpenChat={() => setActiveMenu('chat')}
      />

      {/* ======================= MODAL CUỘC GỌI ĐẾN (INCOMING CALL POPUP) ======================= */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0f1d] border-2 border-sky-500 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-5 animate-in zoom-in-95">
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-sky-500/20 animate-ping"></span>
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center shadow-lg">
                {incomingCall.call_type === 'video' ? <Video className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-sky-400 font-bold mb-1">
                Cuộc Gọi Đến Trực Tuyến
              </p>
              <h3 className="text-lg font-black text-white">{incomingCall.caller_name || 'Doanh nghiệp'}</h3>
              <p className="text-xs text-slate-300 mt-1">
                Mời bạn tham gia {incomingCall.call_type === 'video' ? 'cuộc gọi Video phỏng vấn' : 'cuộc gọi Thoại Audio'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleDeclineIncomingCall}
                className="flex-1 py-3 rounded-2xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/60"
              >
                <X className="w-4 h-4" />
                <span>Từ chối</span>
              </button>
              <button
                type="button"
                onClick={handleAnswerIncomingCall}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/60 animate-pulse"
              >
                <Check className="w-4 h-4" />
                <span>Nghe Máy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL HỒ SƠ DOANH NGHIỆP CÔNG KHAI ======================= */}
      {companyProfileModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={() => setCompanyProfileModal(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cover Banner */}
            <div className="relative h-36 sm:h-44 w-full bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-800 overflow-hidden">
              {companyProfileModal.cover_image_url && (
                <img
                  src={companyProfileModal.cover_image_url}
                  alt="Ảnh bìa doanh nghiệp"
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => setCompanyProfileModal(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center cursor-pointer"
                aria-label="Đóng hồ sơ doanh nghiệp"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 sm:px-7 pb-7">
              {/* Logo + Title */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12 mb-5 relative z-10">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden shrink-0 flex items-center justify-center text-emerald-700 font-black text-2xl">
                  {companyProfileModal.logo_url ? (
                    <img src={companyProfileModal.logo_url} alt={companyProfileModal.company_name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(companyProfileModal.company_name || 'DN').slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate">{companyProfileModal.company_name}</h3>
                    {companyProfileModal.approval_status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-black text-emerald-700">
                        <ShieldCheck className="w-3.5 h-3.5" /> Đã xác thực GPKD
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs font-bold text-slate-600">
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {Number(companyProfileModal.rating_avg || 5).toFixed(1)} ({companyProfileModal.review_count || (companyProfileModal.reviews || []).length} đánh giá)
                    </span>
                    {companyProfileModal.scale && (
                      <span className="inline-flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        Quy mô: {companyProfileModal.scale}
                      </span>
                    )}
                    {companyProfileModal.phone && (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <Phone className="w-3.5 h-3.5" />
                        {companyProfileModal.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {loadingCompanyProfile && (
                <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tải đầy đủ thông tin, đánh giá và việc làm của doanh nghiệp...</span>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Địa chỉ & Cơ sở làm việc</p>
                  <p className="text-xs font-bold text-slate-900 mt-1 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{companyProfileModal.branch_name ? `${companyProfileModal.branch_name} - ` : ''}{companyProfileModal.address || 'TP. Hồ Chí Minh'}</span>
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Đại diện / Liên hệ</p>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {companyProfileModal.representative_name || 'Phòng Nhân Sự'} {companyProfileModal.phone ? `• ${companyProfileModal.phone}` : ''}
                  </p>
                  {companyProfileModal.website && (
                    <a href={companyProfileModal.website} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline font-bold inline-flex items-center gap-1 mt-1">
                      <ExternalLink className="w-3 h-3" /> {companyProfileModal.website}
                    </a>
                  )}
                </div>
              </div>

              {companyProfileModal.description && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6">
                  <p className="text-[11px] font-black text-slate-500 uppercase mb-1">Giới thiệu doanh nghiệp</p>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{companyProfileModal.description}</p>
                </div>
              )}

              {/* Open Jobs */}
              <div className="mb-6">
                <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <span>Tin tuyển dụng đang mở ({(companyProfileModal.jobs || []).length})</span>
                </h4>
                {(companyProfileModal.jobs || []).length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">Doanh nghiệp hiện chưa có tin tuyển dụng mở thêm.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(companyProfileModal.jobs || []).map((job) => (
                      <div
                        key={job._id}
                        onClick={() => {
                          setCompanyProfileModal(null);
                          setSelectedJobDetail({ ...job, company_logo: companyProfileModal.logo_url || job.company_logo });
                        }}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer space-y-1.5"
                      >
                        <p className="text-xs font-black text-slate-900 line-clamp-1">{job.title}</p>
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-emerald-700">{job.salary_display || (job.salary_per_hour ? `${Number(job.salary_per_hour).toLocaleString('vi-VN')}đ/giờ` : 'Thỏa thuận')}</span>
                          <span className="text-slate-500 truncate max-w-[140px]">{job.branch_name || job.location || 'TP.HCM'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reviews from Students */}
              <div>
                <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Đánh giá từ Sinh viên đã làm việc ({(companyProfileModal.reviews || []).length})</span>
                </h4>
                {(companyProfileModal.reviews || []).length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">Chưa có đánh giá chi tiết từ sinh viên cho doanh nghiệp này.</p>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {(companyProfileModal.reviews || []).map((rev, idx) => (
                      <div key={rev._id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-slate-900">{rev.reviewer_name || 'Sinh viên'}</span>
                          <span className="font-black text-amber-600 inline-flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {Number(rev.rating || 5).toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">"{rev.comment || ''}"</p>
                        <p className="text-[10px] font-semibold text-slate-400">{rev.created_at || ''}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL BÁO CÁO VI PHẠM ======================= */}
      {reportModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-rose-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-black text-slate-900">Báo Cáo Vi Phạm Tới Admin</h3>
              </div>
              <button
                type="button"
                onClick={() => setReportModalData(null)}
                className="text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Đối tượng bị báo cáo: <strong className="text-slate-950 font-black">{reportModalData.target_title}</strong>
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Lý do vi phạm (ví dụ: yêu cầu nạp tiền, thu cọc đồng phục, quấy rối) *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Mô tả cụ thể hành vi vi phạm..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>

              {reportMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  {reportMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalData(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Gửi Báo Cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL VIẾT ĐÁNH GIÁ CÔNG TY ======================= */}
      {reviewModalJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Đánh Giá Doanh Nghiệp</h3>
                <p className="text-xs text-emerald-700 font-bold">{reviewModalJob.company_name}</p>
                <p className="text-xs text-slate-600">{reviewModalJob.job_title}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalJob(null)}
                className="text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* 1 - 5 sao phát sáng khi rê chuột */}
              <div className="space-y-1 text-center py-2">
                <label className="block text-xs font-bold text-slate-800 mb-2">Số Điểm Đánh Giá</label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setReviewHoverScore(star)}
                      onMouseLeave={() => setReviewHoverScore(0)}
                      onClick={() => setReviewScore(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${star <= (reviewHoverScore || reviewScore)
                          ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                          : 'text-slate-300'
                          }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-600 block mt-1">
                  {reviewScore === 5 ? 'Tuyệt vời (5/5 sao)' : (reviewScore === 4 ? 'Rất tốt (4/5 sao)' : `${reviewScore}/5 sao`)}
                </span>
              </div>

              {/* Nhận xét (< 1.000 ký tự) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800">Nhận xét trải nghiệm làm việc *</label>
                  <span className="text-xs text-slate-500 font-mono">{reviewContent.length}/1.000 ký tự</span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  placeholder="Chia sẻ về môi trường làm việc, quản lý, xếp ca học..."
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white leading-relaxed"
                />
              </div>

              <BannedKeywordWarning
                text={reviewContent}
                keywords={bannedKeywords}
                contextLabel="nhận xét đánh giá"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalJob(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl btn-primary-dimension text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  Gửi Đánh Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL XEM CHI TIẾT BÀI ĐÁNH GIÁ ======================= */}
      {viewReviewDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col text-slate-800">
            {/* Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Chi Tiết Bài Đánh Giá</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đánh giá 2 chiều minh bạch sau khi hoàn thành công việc
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewReviewDetailModal(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Doanh nghiệp & Vị trí */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800">
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold tracking-wider text-blue-600">Doanh Nghiệp Được Đánh Giá</span>
                  <h4 className="text-base font-bold text-slate-900">
                    {viewReviewDetailModal.company_name || 'Doanh nghiệp'}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium">
                    {viewReviewDetailModal.job_title || 'Việc làm bán thời gian'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-500 font-mono block">Ngày nhận xét</span>
                  <span className="text-xs font-mono text-slate-700 font-bold">{viewReviewDetailModal.created_at}</span>
                </div>
              </div>

              {/* Số sao đánh giá */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-800">
                <span className="text-xs font-bold text-slate-700">Điểm đánh giá:</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${s <= viewReviewDetailModal.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-black text-amber-600">
                    ({viewReviewDetailModal.rating}/5 sao)
                  </span>
                </div>
              </div>

              {/* Trạng thái kiểm duyệt */}
              {viewReviewDetailModal.is_hidden ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Đánh giá này đã bị Quản trị viên ẩn do vi phạm tiêu chuẩn cộng đồng.</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Đánh giá đã được xác thực và hiển thị công khai trên hệ thống.</span>
                </div>
              )}

              {/* Nội dung đầy đủ bài nhận xét văn bản */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Nội Dung Văn Bản Nhận Xét Đầy Đủ
                </label>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-line shadow-xs min-h-[90px] font-medium">
                  {viewReviewDetailModal.comment ? `"${viewReviewDetailModal.comment}"` : 'Không có nội dung văn bản.'}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div>
                {!viewReviewDetailModal.is_hidden && (
                  <button
                    type="button"
                    onClick={() => {
                      const cur = viewReviewDetailModal;
                      setViewReviewDetailModal(null);
                      setEditingReviewModal({
                        _id: cur._id,
                        rating: cur.rating || 5,
                        comment: cur.comment || '',
                        job_title: cur.job_title || 'Công việc',
                        company_name: cur.company_name || 'Doanh nghiệp'
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Sửa Đánh Giá Này</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewReviewDetailModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL SỬA ĐÁNH GIÁ (FR 1.7.4) ======================= */}
      {editingReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Chỉnh Sửa Đánh Giá</h3>
                <p className="text-xs text-blue-700 font-bold mt-0.5">{editingReviewModal.company_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingReviewModal(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">Đánh giá số sao (1-5 sao)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditingReviewModal(prev => ({ ...prev, rating: star }))}
                      className="p-1 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${star <= editingReviewModal.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300 hover:text-yellow-400'
                          }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {editingReviewModal.rating}/5 sao
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nội dung nhận xét (&lt; 1000 ký tự) *
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  placeholder="Nhập nội dung nhận xét chi tiết..."
                  value={editingReviewModal.comment}
                  onChange={(e) => setEditingReviewModal(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-slate-800 outline-none focus:border-blue-500 leading-relaxed font-medium"
                />
                <div className="text-right text-xs text-slate-500 mt-1">
                  {editingReviewModal.comment?.length || 0}/1000 ký tự
                </div>
              </div>

              <BannedKeywordWarning
                text={editingReviewModal.comment || ''}
                keywords={bannedKeywords}
                contextLabel="nhận xét đánh giá"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReviewModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL CHI TIẾT & TƯƠNG TÁC CA LÀM VIỆC ======================= */}
      {selectedShiftDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedShiftDetailModal.day?.dayName}, {selectedShiftDetailModal.day?.dateStr}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-2">
                  {selectedShiftDetailModal.app?.job_title || 'Việc làm part-time'}
                </h3>
                <p className="text-xs font-bold text-emerald-700 mt-0.5">
                  {selectedShiftDetailModal.app?.company_name || 'Doanh nghiệp'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShiftDetailModal(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin chi tiết */}
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Trạng thái ca làm:</span>
                <div>
                  {selectedShiftDetailModal.status === 'upcoming' && (
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Sắp diễn ra</span>
                    </span>
                  )}
                  {selectedShiftDetailModal.status === 'in_progress' && (
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 animate-pulse">
                      <Activity className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      <span>Đang làm việc</span>
                    </span>
                  )}
                  {selectedShiftDetailModal.status === 'completed' && (
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã hoàn thành</span>
                    </span>
                  )}
                  {selectedShiftDetailModal.status === 'absent' && (
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Vắng mặt</span>
                    </span>
                  )}
                  {selectedShiftDetailModal.status === 'cancelled' && (
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Đã hủy ca</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Khung giờ làm việc:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {selectedShiftDetailModal.meta?.shiftName} ({selectedShiftDetailModal.meta?.timeRange}) • {selectedShiftDetailModal.meta?.shiftHours}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Địa điểm / Chi nhánh:</span>
                <span className="font-bold text-slate-800 text-right max-w-[240px] truncate">
                  {selectedShiftDetailModal.app?.location || 'TP. Hồ Chí Minh'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Thù lao theo ca:</span>
                <span className="font-bold text-emerald-600">
                  {selectedShiftDetailModal.app?.salary_min
                    ? `${selectedShiftDetailModal.app.salary_min.toLocaleString('vi-VN')}đ - ${(selectedShiftDetailModal.app.salary_max || selectedShiftDetailModal.app.salary_min).toLocaleString('vi-VN')}đ/h`
                    : 'Theo quy định ca làm'}
                </span>
              </div>
            </div>

            {/* Các nút tương tác trực tiếp */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              {selectedShiftDetailModal.status === 'upcoming' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const appId = selectedShiftDetailModal.app?._id;
                      setSelectedShiftDetailModal(null);
                      setConfirmDialogConfig({
                        isOpen: true,
                        title: 'Xin Nghỉ / Hủy Ca Làm',
                        message: 'Bạn có chắc chắn muốn xin nghỉ hoặc hủy ca làm việc này? Quyết định này sẽ được gửi tới Doanh nghiệp.',
                        type: 'danger',
                        confirmText: 'Xác Nhận Hủy',
                        onConfirm: () => {
                          setConfirmDialogConfig(null);
                          handleUpdateShiftStatus(appId, 'cancelled', 'Đã hủy ca làm việc thành công!');
                        }
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold border border-slate-200 cursor-pointer"
                  >
                    Xin Nghỉ / Hủy Ca
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const appId = selectedShiftDetailModal.app?._id;
                      handleUpdateShiftStatus(appId, 'in_progress', 'Đã bắt đầu vào ca làm việc!');
                      setSelectedShiftDetailModal(prev => prev ? ({ ...prev, status: 'in_progress' }) : null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Bắt Đầu Vào Ca Làm</span>
                  </button>
                </>
              )}

              {selectedShiftDetailModal.status === 'in_progress' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const appId = selectedShiftDetailModal.app?._id;
                      setSelectedShiftDetailModal(null);
                      setConfirmDialogConfig({
                        isOpen: true,
                        title: 'Hủy Ca Đang Làm',
                        message: 'Bạn đang trong ca làm. Bạn có chắc chắn muốn dừng và hủy ca làm này không?',
                        type: 'danger',
                        confirmText: 'Xác Nhận Dừng Ca',
                        onConfirm: () => {
                          setConfirmDialogConfig(null);
                          handleUpdateShiftStatus(appId, 'cancelled', 'Đã hủy ca làm việc thành công!');
                        }
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold border border-slate-200 cursor-pointer"
                  >
                    Hủy Ca
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const appId = selectedShiftDetailModal.app?._id;
                      handleUpdateShiftStatus(appId, 'completed', 'Đã xác nhận hoàn thành ca làm việc!');
                      setSelectedShiftDetailModal(prev => prev ? ({ ...prev, status: 'completed' }) : null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Xác Nhận Xong Ca Làm</span>
                  </button>
                </>
              )}

              {selectedShiftDetailModal.status === 'completed' && (
                <button
                  type="button"
                  onClick={() => {
                    const app = selectedShiftDetailModal.app;
                    setSelectedShiftDetailModal(null);
                    setReviewModalJob(app);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 fill-white" />
                  <span>Đánh Giá Doanh Nghiệp 2 Chiều</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedShiftDetailModal(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden input to replace CV file directly from computer disk (FR 1.4.4) */}
      <input
        ref={replaceCvInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleReplaceCvFile}
      />

      {/* Confirm Dialog for CV deletion, Cover letter deletion, Application cancel (FR 1.4.6, 1.3.4, 1.6.4) */}
      <ConfirmDialog
        isOpen={!!confirmDialogConfig?.isOpen}
        title={confirmDialogConfig?.title || 'Xác Nhận'}
        message={confirmDialogConfig?.message || ''}
        type={confirmDialogConfig?.type || 'danger'}
        confirmText={confirmDialogConfig?.confirmText || 'Xác Nhận'}
        cancelText={confirmDialogConfig?.cancelText || 'Hủy Bỏ'}
        onConfirm={confirmDialogConfig?.onConfirm}
        onCancel={() => setConfirmDialogConfig(null)}
      />

    </div>
  );
}

/**
 * Shared contacts search/filter & conversation list used by both the slide-over
 * chat drawer and the inline left sidebar of the Student full chat workspace.
 */
function StudentChatContactsPanel({
  contacts,
  selectedContact,
  chatSearchQuery,
  onSearchChange,
  chatUnrepliedOnly,
  onToggleUnreplied,
  onSelectContact,
  onFindJobs,
  isDrawer = false,
}) {
  const filteredContacts = contacts
    .filter(c => matchKeywordFlexible(c, chatSearchQuery, ['company_name', 'name', 'job_title', 'subtitle']))
    .filter(c => !chatUnrepliedOnly || c.unreplied || c.unread > 0 || c.time === 'Mới ứng tuyển' || c.application_status === 'pending');

  return (
    <>
      {/* Tìm kiếm hội thoại theo tên NTD (FR 1.8.1) & Lọc chưa phản hồi */}
      <div className="p-3 border-b border-slate-200 bg-white/90 space-y-2 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={chatSearchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm (Vị trí ứng tuyển; Tên doanh nghiệp)"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white font-medium"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-xs text-slate-500 font-medium">
            Bộ lọc ({filteredContacts.length}/{contacts.length}):
          </span>
          <button
            type="button"
            onClick={onToggleUnreplied}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap border ${
              chatUnrepliedOnly
                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                : 'bg-white text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-50'
            }`}
            title="Chỉ hiển thị hội thoại chưa phản hồi"
          >
            {chatUnrepliedOnly ? '✓ Chưa phản hồi' : 'Chưa phản hồi'}
          </button>
        </div>
      </div>

      {/* Danh sách Room Chat với NTD (FR 1.8.2 & Chấm xanh/xám 1.10.1) */}
      <div className={`flex-1 overflow-y-auto p-2.5 space-y-1.5 min-h-0 ${isDrawer ? 'divide-y divide-slate-100' : ''}`}>
        {contacts.length === 0 ? (
          <div className="p-6 text-center text-slate-600 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
            <p className="font-bold text-slate-800">Chưa có cuộc trò chuyện nào</p>
            <p className="text-xs text-slate-500 mt-1">
              Danh bạ sẽ tự động xuất hiện khi bạn nộp hồ sơ ứng tuyển vào một công việc.
            </p>
            {onFindJobs && (
              <button
                type="button"
                onClick={onFindJobs}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Tìm Việc Ngay</span>
              </button>
            )}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-6 text-center text-slate-600 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
            <p className="font-bold text-slate-800">Không tìm thấy hội thoại phù hợp</p>
            <p className="text-xs text-slate-500 mt-1">Thử bỏ chọn "Chưa phản hồi" hoặc đổi từ khóa tìm kiếm.</p>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const contactKey = contact.application_id || contact.id;
            const selectedKey = selectedContact?.application_id || selectedContact?.id;
            const isSelected = Boolean(selectedContact) && (selectedKey === contactKey || (contact.room_id && selectedContact?.room_id === contact.room_id));
            const hasUnreplied = Boolean(contact.unreplied || contact.unread > 0);
            return (
              <button
                key={contactKey}
                type="button"
                onClick={() => onSelectContact(contact)}
                className={`w-full p-3 rounded-xl border transition-all text-left flex items-start gap-3 cursor-pointer group ${
                  isSelected
                    ? 'bg-blue-50 border-blue-400 shadow-xs ring-1 ring-blue-300/60'
                    : 'bg-white hover:bg-blue-50/60 border-slate-200/80 hover:border-blue-300'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {(contact.name || 'D').charAt(0)}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    contact.online ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}></span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs sm:text-sm font-bold truncate ${
                      isSelected ? 'text-blue-800' : 'text-slate-900 group-hover:text-blue-700'
                    }`}>
                      {contact.name}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasUnreplied && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="Chưa phản hồi"></span>
                      )}
                      <span className="text-xs text-slate-500 font-mono">{contact.time}</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 font-semibold truncate mt-0.5">{contact.subtitle}</p>
                  <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{contact.lastMsg}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}
