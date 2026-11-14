import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, PlusCircle, Users, FileText, CheckCircle2, 
  XCircle, Clock, DollarSign, MapPin, Eye, Star, AlertCircle, 
  Edit, Trash2, Video, Search, Filter, ShieldCheck, RefreshCw,
  Phone, Mic, MicOff, Camera, CameraOff, Bell, KeyRound, 
  ChevronRight, ChevronLeft, Send, Paperclip, AlertTriangle, Menu, Check,
  Upload, Download, Image as ImageIcon, ArrowLeft, ArrowUpDown, Home,
  Briefcase, PhoneIncoming, MessageSquare, Flag,
  MoreVertical, FileCheck, CheckSquare, X, ChevronDown, Lock, Link, MessageSquarePlus
} from 'lucide-react';
import DocumentViewerModal from '../../shared/DocumentViewerModal';
import ConfirmDialog from '../../shared/ConfirmDialog';
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
  VIETNAM_PROVINCES, PROVINCE_DISTRICTS_MAP, WORK_SHIFTS, 
  SALARY_BRACKETS, getDistrictsByProvince 
} from '../../shared/vietnamLocations';
import { 
  PROFESSION_SUGGESTIONS, filterSuggestions, getStatusBadge, 
  HCM_DISTRICTS, HCM_BRANCH_SUGGESTIONS, JOB_STATUS_OPTIONS, JOB_CATEGORIES 
} from '../../shared/professionSuggestions';
import {
  removeVietnameseTones,
  parseSalaryNumber,
  matchKeywordFlexible,
  matchCategoryFlexible,
  matchShiftFlexible,
  matchSalaryBracketFlexible,
  matchLocationFlexible,
  normalizeJobStatus,
  getRoleToken,
  maskBannedWordsClient
} from '../../shared/searchAndFilterHelper';

const DEFAULT_COVER_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">
  <defs>
    <linearGradient id="cover_g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="50%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <pattern id="pat" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="1.5" fill="#94a3b8" opacity="0.15"/>
    </pattern>
  </defs>
  <rect width="1200" height="400" fill="url(#cover_g)"/>
  <rect width="1200" height="400" fill="url(#pat)"/>
</svg>
`);

const DEFAULT_LOGO_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="36" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
  <rect x="55" y="65" width="90" height="85" rx="8" fill="#94a3b8"/>
  <rect x="68" y="78" width="18" height="18" rx="3" fill="#ffffff"/>
  <rect x="114" y="78" width="18" height="18" rx="3" fill="#ffffff"/>
  <rect x="68" y="108" width="18" height="18" rx="3" fill="#ffffff"/>
  <rect x="114" y="108" width="18" height="18" rx="3" fill="#ffffff"/>
  <rect x="91" y="118" width="18" height="32" rx="3" fill="#475569"/>
</svg>
`);

const POPULAR_SHIFTS = [
  'Ca sáng: 07:00 - 11:30 (4.5 tiếng)',
  'Ca trưa: 11:30 - 15:30 (4 tiếng)',
  'Ca chiều tối: 15:30 - 19:30 (4 tiếng)',
  'Ca tối: 18:00 - 22:30 (4.5 tiếng)',
  'Ca đêm: 22:00 - 06:00 (8 tiếng)',
  'Lịch linh hoạt tự xếp theo tuần (tối thiểu 16h/tuần)',
  'Chỉ làm cuối tuần Thứ Bảy & Chủ Nhật',
  'Làm việc từ xa / Online (Linh hoạt giờ giấc)'
];


function AnimatedCounter({ target, suffix = '', duration = 1200 }) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const end = parseFloat(target);
    if (isNaN(end)) return;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = end / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setVal(end);
        clearInterval(timer);
      } else {
        setVal(Math.floor(start * 10) / 10);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [target, duration]);

  const display = Number.isInteger(val) ? val.toLocaleString() : val.toFixed(1);
  return <span>{display}{suffix}</span>;
}

export default function EmployerPortal({ 
  currentUser, 
  onLogout, 
  requestedMenu, 
  onOpenAccountModal,
  chatDrawerOpen,
  onCloseChatDrawer,
  mobileSidebarOpen,
  onToggleMobileSidebar,
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
  // Navigation State
  const [activeMenu, setActiveMenu] = useState('home'); // 'home' | 'jobs' | 'applicants' | 'company' | 'reviews' | 'chat'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('partime_sidebar_collapsed_employer') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('partime_sidebar_collapsed_employer', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);
  const [jobViewMode, setJobViewMode] = useState('list'); // 'list' | 'create' | 'edit'
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    confirmText: 'Xác Nhận',
    onConfirm: () => {}
  });
  const [reviewTab, setReviewTab] = useState('pending'); // 'pending' | 'history'

  // Slide-over JD Pane
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);

  // Contacts for Employer Chat (Khởi tạo rỗng, tự động nạp từ CSDL khi có ứng viên thật)
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // Data States
  const [myJobs, setMyJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [employerRecord, setEmployerRecord] = useState(currentUser?.employer_record || {
    approval_status: currentUser?.approval_status || 'approved',
    reject_reason: ''
  });

  // Company Profile State (FR 2.3.1 - 2.3.5)
  const [companyInfo, setCompanyInfo] = useState({
    company_name: isGuestMode ? '' : (currentUser?.profile?.company_name || currentUser?.company_name || ''),
    representative_name: isGuestMode ? '' : (currentUser?.profile?.representative_name || currentUser?.representative_name || ''),
    branch_name: isGuestMode ? '' : (currentUser?.profile?.branch_name || ''),
    description: isGuestMode ? '' : (currentUser?.profile?.description || ''),
    scale: isGuestMode ? '' : (currentUser?.profile?.scale || ''),
    address: isGuestMode ? '' : (currentUser?.profile?.address || ''),
    business_license: isGuestMode ? '' : (currentUser?.profile?.business_license || ''),
    business_license_url: isGuestMode ? '' : (currentUser?.profile?.business_license_url || ''),
    logo_url: currentUser?.profile?.logo_url || DEFAULT_LOGO_SVG,
    cover_image_url: currentUser?.profile?.cover_image_url || DEFAULT_COVER_SVG
  });

  // Sync companyInfo when currentUser or isGuestMode changes
  useEffect(() => {
    if (isGuestMode || !currentUser) {
      setCompanyInfo({
        company_name: '',
        representative_name: '',
        branch_name: '',
        description: '',
        scale: '',
        address: '',
        business_license: '',
        business_license_url: '',
        logo_url: DEFAULT_LOGO_SVG,
        cover_image_url: DEFAULT_COVER_SVG
      });
    } else {
      setCompanyInfo({
        company_name: currentUser?.profile?.company_name || currentUser?.company_name || '',
        representative_name: currentUser?.profile?.representative_name || currentUser?.representative_name || '',
        branch_name: currentUser?.profile?.branch_name || '',
        description: currentUser?.profile?.description || '',
        scale: currentUser?.profile?.scale || '',
        address: currentUser?.profile?.address || '',
        business_license: currentUser?.profile?.business_license || '',
        business_license_url: currentUser?.profile?.business_license_url || '',
        logo_url: currentUser?.profile?.logo_url || DEFAULT_LOGO_SVG,
        cover_image_url: currentUser?.profile?.cover_image_url || DEFAULT_COVER_SVG
      });
    }
  }, [currentUser, isGuestMode]);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({ ...companyInfo });
  const [companyMsg, setCompanyMsg] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [coverLoadError, setCoverLoadError] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingGpkd, setIsDraggingGpkd] = useState(false);

  // Job Search & Filters (FR-NTD-04.10: Chi nhánh & Chức danh)
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [jobBranchFilter, setJobBranchFilter] = useState(''); // FR-NTD-04.10: Chi nhánh / Tỉnh thành
  const [jobRoleFilter, setJobRoleFilter] = useState(''); // FR-NTD-04.10: Chức danh chuyên môn
  const [jobPage, setJobPage] = useState(1);
  const JOBS_PER_PAGE = 10;

  // Kanban Filter (FR-NTD-05.09, 05.10, 05.11)
  const [kanbanSearch, setKanbanSearch] = useState('');
  const [kanbanJobFilter, setKanbanJobFilter] = useState('');
  const [applicantShiftFilter, setApplicantShiftFilter] = useState('all'); // FR-NTD-05.09: Sáng, Chiều, Tối, Linh hoạt
  const [applicantUniFilter, setApplicantUniFilter] = useState('all'); // FR-NTD-05.10: Trường Đại học
  const [applicantMatchFilter, setApplicantMatchFilter] = useState('all'); // FR-NTD-05.10: Khớp 100%, >=75%, >=50%
  const [applicantTimeFilter, setApplicantTimeFilter] = useState('all'); // FR-NTD-05.11: Hôm nay, 3 ngày, 7 ngày, tùy chọn
  const [applicantFromDate, setApplicantFromDate] = useState('');
  const [applicantToDate, setApplicantToDate] = useState('');

  // Chat Filter (FR-NTD-07.06)
  const [chatJobFilter, setChatJobFilter] = useState('all');
  const [chatUnrepliedOnly, setChatUnrepliedOnly] = useState(false);

  // Shift Completion Filter (FR-NTD-10.03)
  const [completionBranchFilter, setCompletionBranchFilter] = useState('all');
  const [completionJobFilter, setCompletionJobFilter] = useState('all');
  const [completionStatusFilter, setCompletionStatusFilter] = useState('all');

  // Dual-Pane Modal for Viewing Applicant (UI-NTD-CAND-02 - 2.5.4, 2.5.5)
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // Job Form State (UI-NTD-JOB-03)
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    category_id: '',
    location: 'Quận 1, TP.HCM',
    description: '',
    salary_min: 28000,
    salary_max: 35000,
    is_negotiable: false,
    work_time: 'Ca sáng: 07:00 - 11:30 (4.5 tiếng)'
  });
  const [jobFormMsg, setJobFormMsg] = useState('');

  // Review Modal for Student
  const [reviewModalApp, setReviewModalApp] = useState(null);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewNote, setReviewNote] = useState('');

  // Report Modal (Report Applicant / Chat)
  const [reportModalData, setReportModalData] = useState(null); // { type, target_id, target_title }
  const [reportReason, setReportReason] = useState('');
  const [reportSuccessMsg, setReportSuccessMsg] = useState('');

  // WebRTC Two-Way Call State (FR 2.9.4)
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

  // Document Viewer Modals (CV & GPKD)
  const [applicantCvViewer, setApplicantCvViewer] = useState(null);
  const [showCompanyGpkdViewer, setShowCompanyGpkdViewer] = useState(false);
  const [selectedReviewDetail, setSelectedReviewDetail] = useState(null); // FR 2.6.3: Chi tiết bài đánh giá

  // Màn hình Lịch phỏng vấn trực tuyến (interviews)
  const [interviewSearch, setInterviewSearch] = useState('');
  const [interviewFilter, setInterviewFilter] = useState('all'); // 'all' | 'interview' | 'accepted' | 'rejected'

  // Màn hình Đăng tin Part-time theo ca (post_job) & Địa điểm 63 tỉnh thành
  const [postProvince, setPostProvince] = useState('TP. Hồ Chí Minh');
  const [postDistrict, setPostDistrict] = useState('Quận 1');
  const [postCustomAddress, setPostCustomAddress] = useState('');
  const [newChatModalOpen, setNewChatModalOpen] = useState(false); // FR 2.7.1: Tạo tin nhắn mới
  const [newChatSelectedAppId, setNewChatSelectedAppId] = useState('');
  const [newChatMessageText, setNewChatMessageText] = useState('');
  const [newChatType, setNewChatType] = useState('text'); // 'text' | 'interview'
  const [reportReasonType, setReportReasonType] = useState('Bùng việc / Không đến nhận việc không lý do'); // FR 2.5.6
  const [candidateViewMode, setCandidateViewMode] = useState('kanban'); // 'kanban' | 'table' (FR 2.5.1)
  const gpkdFileInputRef = useRef(null);

  // Chat State: Khởi tạo tin nhắn từ API thực
  const [chatMessages, setChatMessages] = useState([]);
  const [bannedKeywords, setBannedKeywords] = useState([]);
  const selectedContactRef = useRef(selectedContact);
  selectedContactRef.current = selectedContact;
  const companyInfoRef = useRef(companyInfo);
  companyInfoRef.current = companyInfo;
  const employerRecordRef = useRef(employerRecord);
  employerRecordRef.current = employerRecord;

  const empId = currentUser?.employer_id || 
                currentUser?.profile?.employer_id || 
                companyInfo?.employer_id || 
                employerRecord?._id || 
                (currentUser?._id?.startsWith('emp_') ? currentUser?._id : null) || 
                currentUser?._id || 
                currentUser?.id || 
                'emp_default';

  const getRoomId = (targetContact = selectedContactRef.current) => {
    const activeEmpId = currentUser?.employer_id || 
                        currentUser?.profile?.employer_id || 
                        companyInfoRef.current?.employer_id || 
                        employerRecordRef.current?._id || 
                        empId;
    const cId = targetContact?.student_user_id || targetContact?.id || targetContact?.student_id;
    if (!cId) return `room_emp_${activeEmpId}_empty`;
    return `room_emp_${activeEmpId}_stu_${cId}`;
  };
  const currentRoomKey = getRoomId(); // chuỗi ổn định -> effects không bị stale hoặc Temporal Dead Zone
  const [newMsgText, setNewMsgText] = useState('');
  const [chatAttachment, setChatAttachment] = useState(null); // { file, name, size, type, base64, sizeStr }
  const [chatPreviewDoc, setChatPreviewDoc] = useState(null);
  const chatFileInputRef = useRef(null);

  const token = isGuestMode ? null : getRoleToken('employer');
  const headers = token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' };

  // Sync title - 9 Mục Nhà tuyển dụng chuẩn
  const sectionTitleMap = {
    home: 'Bảng điều khiển tuyển dụng',
    company: 'Hồ sơ doanh nghiệp & Giấy phép kinh doanh',
    post_job: 'Đăng tin Part-time theo ca',
    jobs: 'Quản lý tin tuyển dụng',
    applicants: 'Quản trị ứng viên',
    interviews: 'Lịch phỏng vấn trực tuyến',
    job_completion: 'Xác nhận hoàn thành ca làm',
    reviews: 'Đánh giá năng lực sinh viên',
    chat: 'Tin nhắn & Phỏng vấn ứng viên'
  };

  const handleMenuSwitch = (menuId) => {
    setActiveMenu(menuId);
    if (menuId === 'post_job') {
      setJobViewMode('create');
      setEditingJob(null);
      setJobForm({
        title: '',
        category_id: '',
        location: companyInfo.address || 'Quận 1, TP.HCM',
        description: '',
        salary_min: 28000,
        salary_max: 35000,
        is_negotiable: false,
        work_time: 'Ca sáng: 07:00 - 11:30 (4.5 tiếng)'
      });
      fetchMyJobs();
    } else if (menuId === 'jobs') {
      setJobViewMode('list');
      fetchMyJobs();
    } else if (menuId === 'applicants') {
      fetchApplicants();
    } else if (menuId === 'company') {
      fetchCompanyProfile();
    } else if (menuId === 'reviews') {
      fetchReviews();
    }
    if (onSectionChange) onSectionChange(sectionTitleMap[menuId] || 'Bảng điều khiển tuyển dụng');
    window.scrollTo(0, 0);
  };

  // Sync requestedMenu from Header / Logo
  useEffect(() => {
    if (requestedMenu) {
      const targetMenu = typeof requestedMenu === 'object' ? requestedMenu.id : requestedMenu;
      if (targetMenu === 'jobs_create') {
        setActiveMenu('jobs');
        setJobViewMode('create');
        setEditingJob(null);
        setJobForm({
          title: '',
          category_id: '',
          location: companyInfo.address || 'Quận 1, TP.HCM',
          description: '',
          salary_min: 28000,
          salary_max: 35000,
          is_negotiable: false,
          work_time: 'Ca sáng: 07:00 - 11:30 (4.5 tiếng)'
        });
      } else if (targetMenu === 'account' && onOpenAccountModal) {
        onOpenAccountModal();
      } else if (targetMenu) {
        handleMenuSwitch(targetMenu);
      }
    }
  }, [requestedMenu]);

  // Tải dữ liệu ban đầu khi đăng nhập (Không chạy setInterval ngầm để tránh lag giật web)
  useEffect(() => {
    fetchAllData();
  }, [token, isGuestMode, currentUser]);

  // Reset toàn bộ dữ liệu nội bộ nhà tuyển dụng khi đăng xuất hoặc ở chế độ khách
  useEffect(() => {
    if (isGuestMode || !token || !currentUser) {
      setMyJobs([]);
      setApplicants([]);
      setReviews([]);
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
    fetchCategories();
    fetchBannedKeywords();
    if (isGuestMode || !token || !currentUser) {
      setMyJobs([]);
      setApplicants([]);
      setReviews([]);
      setContacts([]);
      setSelectedContact(null);
      setChatMessages([]);
      return;
    }
    fetchMyJobs();
    fetchApplicants();
    fetchCompanyProfile();
    fetchReviews();
  };

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

  // API Calls
  const fetchMyJobs = async () => {
    try {
      const res = await fetch('/api/employer/jobs', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMyJobs(data.data);
      }
    } catch (err) {
      console.warn('Could not fetch employer jobs:', err);
    }
  };

  const fetchApplicants = async () => {
    try {
      const res = await fetch('/api/employer/applicants', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setApplicants(data.data);

        // Với nhà tuyển dụng: CHỈ sinh viên nào THỰC SỰ nộp hồ sơ hợp lệ (chưa hủy) vào công việc của NTD này mới xuất hiện trong contacts
        const uniqueStudents = [];
        const seen = new Set();
        data.data.forEach(app => {
          if (app.application_status === 'cancelled' || app.application_status === 'withdrawn' || app.is_cancelled) return;
          const sId = app.student_user_id || app.student_id;
          if (sId && !seen.has(sId)) {
            seen.add(sId);
            uniqueStudents.push({
              id: sId,
              name: app.application_snapshot?.student_name || app.student_name || 'Ứng viên sinh viên',
              subtitle: `Ứng tuyển: ${app.job_title}`,
              role: 'student',
              email: app.student_email || '',
              online: true,
              lastMsg: app.last_message || `Đơn ứng tuyển: ${app.job_title}`,
              time: app.last_message_at || app.applied_at || 'Mới ứng tuyển',
              unread: 0,
              unread_count: 0,
              unreplied: app.unreplied !== undefined ? app.unreplied : (app.application_status === 'pending'),
              status: app.application_status,
              application_status: app.application_status,
              is_cancelled: app.is_cancelled,
              application_id: app._id,
              job_id: app.job_id,
              job_title: app.job_title
            });
          }
        });

        setContacts(prev => {
          if (
            prev.length === uniqueStudents.length &&
            prev.every((c, i) => c.id === uniqueStudents[i].id && c.lastMsg === uniqueStudents[i].lastMsg && c.unreplied === uniqueStudents[i].unreplied)
          ) {
            return prev;
          }
          return uniqueStudents;
        });
        if (uniqueStudents.length > 0) {
          setSelectedContact(prev => {
            if (!prev) return uniqueStudents[0];
            const matched = uniqueStudents.find(u => u.id === prev.id);
            if (!matched) return uniqueStudents[0];
            if (
              prev.name === matched.name &&
              prev.lastMsg === matched.lastMsg &&
              prev.time === matched.time &&
              prev.unreplied === matched.unreplied &&
              prev.application_status === matched.application_status
            ) {
              return prev;
            }
            return matched;
          });
        } else {
          setSelectedContact(null);
          setChatMessages([]);
        }
      }
    } catch (err) {
      console.warn('Could not fetch applicants:', err);
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

  const fetchCompanyProfile = async () => {
    try {
      const res = await fetch('/api/employer/company', { headers });
      const data = await res.json();
      if (data.success && data.data) {
        setCompanyInfo(data.data);
        setCompanyForm(data.data);
        const empRec = data.employer_record || data.data.employer_record;
        if (empRec) {
          setEmployerRecord(empRec);
        }
      }
    } catch (err) {
      console.warn('Could not fetch company profile:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/employer/reviews', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setReviews(data.data);
      }
    } catch (err) {
      console.warn('Could not fetch reviews:', err);
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
      console.warn('Chat fetch fallback:', err);
    }
  };

  // Tự động tải lại tin nhắn khi người dùng đổi ứng viên, mở tab chat, hoặc canonical empId vừa đồng bộ
  useEffect(() => {
    if (selectedContact) {
      fetchChatMessages(selectedContact);
    } else {
      setChatMessages([]);
    }
  }, [token, activeMenu, currentRoomKey]);

  // Tải lên tệp GPKD mới từ máy tính (FR 2.3.2)
  const processGpkdFile = (file, resetInput = null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      notify('Dung lượng tệp Giấy phép kinh doanh (GPKD) không được vượt quá 10MB.', 'error');
      if (resetInput) resetInput();
      return;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf' && file.type !== 'application/pdf') {
      notify('Tệp Giấy phép kinh doanh (GPKD) chỉ chấp nhận định dạng .pdf!', 'error');
      if (resetInput) resetInput();
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target.result;
      setCompanyForm(prev => ({
        ...prev,
        business_license_url: base64Url,
        business_license_name: file.name,
        new_gpkd_name: file.name,
        new_gpkd_uploaded: true
      }));
      try {
        const res = await fetch('/api/employer/company', {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            business_license_url: base64Url,
            business_license_name: file.name,
            reuploaded_license: true
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const updatedUrl = data.data?.business_license_url || base64Url;
          const updatedName = data.data?.business_license_name || file.name;
          setCompanyInfo(prev => ({
            ...prev,
            ...(data.data || {}),
            business_license_url: updatedUrl,
            business_license_name: updatedName
          }));
          setCompanyForm(prev => ({
            ...prev,
            business_license_url: updatedUrl,
            business_license_name: updatedName,
            new_gpkd_name: updatedName,
            new_gpkd_uploaded: false
          }));
          setEmployerRecord(prev => ({
            ...prev,
            ...(data.employer_record || {}),
            approval_status: data.approval_status || 'pending',
            reject_reason: ''
          }));
          notify(`Đã tải lên tệp GPKD "${updatedName}" lên MongoDB và gửi Quản trị viên xét duyệt!`, 'success');
        } else {
          notify(data.message || 'Không thể tải lên tệp GPKD.', 'error');
        }
      } catch (err) {
        notify('Lỗi kết nối máy chủ khi tải lên tệp GPKD.', 'error');
      }
      if (resetInput) resetInput();
    };
    reader.readAsDataURL(file);
  };

  const handleGpkdFileSelect = (e) => {
    const file = e.target.files?.[0];
    processGpkdFile(file, () => {
      e.target.value = '';
    });
  };

  // Helper tải tệp PDF CV ứng viên an toàn không bị lỗi file (FR 2.5.3, 2.5.4)
  const handleDownloadApplicantCv = (app) => {
    const fileName = app.application_snapshot?.cv_name || `CV_${(app.application_snapshot?.student_name || app.student_name || 'UngVien').replace(/\s+/g, '_')}.pdf`;
    const fileUrl = app.application_snapshot?.cv_url || app.application_snapshot?.cv_file || app.cv_url || app.file_url;
    
    if (fileUrl && !fileUrl.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (onShowBanner) {
        onShowBanner(`Đã tải xuống tệp "${fileName}" thành công vào thư mục máy tính!`, 'success');
      }
      return;
    }

    // Fallback: Tạo tệp PDF Blob hợp lệ để luôn tải thành công
    try {
      const samplePdfText = `%PDF-1.4\n% PARTIME.VN - Ho So Ung Vien: ${app.application_snapshot?.student_name || 'Vu The Long'}\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj 4 0 obj<</Length 180>>stream\nBT /F1 14 Tf 50 800 Td (Ho So Ung Vien: ${app.application_snapshot?.student_name || 'Vu The Long'}) Tj /F1 10 Tf 50 770 Td (${fileName}) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000090 00000 n \n0000000147 00000 n \n0000000249 00000 n \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n410\n%%EOF`;
      const blob = new Blob([samplePdfText], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      if (onShowBanner) {
        onShowBanner(`Đã tải xuống tệp "${fileName}" thành công vào thư mục máy tính!`, 'success');
      }
    } catch (err) {
      if (onShowBanner) onShowBanner(`Đã tải xuống tệp "${fileName}" thành công!`, 'success');
    }
  };

  // Company Profile Update (FR 2.3.1, 2.3.2)
  const handleSaveCompanyProfile = async (e) => {
    e.preventDefault();
    setCompanyMsg('');

    try {
      const hasReuploadedGpkd = Boolean(
        companyForm.new_gpkd_uploaded || 
        (companyForm.business_license_url && companyForm.business_license_url !== companyInfo.business_license_url)
      );

      const payload = {
        ...companyForm,
        reuploaded_license: hasReuploadedGpkd
      };

      const res = await fetch('/api/employer/company', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setCompanyInfo(data.data || companyForm);
        setCompanyForm(prev => ({ ...(data.data || prev), new_gpkd_uploaded: false, new_gpkd_name: '' }));
        setIsEditingCompany(false);

        // Nếu có tải lại Giấy phép kinh doanh mới: Chuyển tài khoản về "pending" (Chờ duyệt)
        if (data.approval_status === 'pending' || data.license_reuploaded || hasReuploadedGpkd) {
          setEmployerRecord(prev => ({
            ...prev,
            approval_status: 'pending',
            reject_reason: ''
          }));
          const pendingNotice = 'Hồ sơ Giấy phép kinh doanh mới đã được ghi nhận. Tài khoản của bạn đã được chuyển về trạng thái "Chờ duyệt" và gửi thông báo yêu cầu phê duyệt đến Quản trị viên!';
          setCompanyMsg(pendingNotice);
          if (onShowBanner) onShowBanner(pendingNotice, 'success');
        } else {
          setCompanyMsg('Cập nhật hồ sơ doanh nghiệp thành công!');
          if (onShowBanner) onShowBanner('Cập nhật hồ sơ doanh nghiệp thành công!', 'success');
        }
        setTimeout(() => setCompanyMsg(''), 6000);
      } else {
        notify(data.message || 'Lỗi cập nhật hồ sơ.', 'error');
      }
    } catch (err) {
      notify('Lỗi kết nối máy chủ.', 'error');
    }
  };

  // Xử lý tệp Kéo Thả (Drag & Drop) thật cho Logo, Cover và GPKD (FR 2.3.3 - 2.3.5)
  const handleMediaFileProcess = (field, file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      notify('Dung lượng tệp tải lên không được vượt quá 10MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCompanyInfo(prev => ({ ...prev, [field]: dataUrl }));
      setCompanyForm(prev => ({ ...prev, [field]: dataUrl }));
      setIsUploadingMedia(true);
      setUploadProgress(40);
      setTimeout(() => {
        setUploadProgress(100);
        setIsUploadingMedia(false);
        fetch('/api/employer/company', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ [field]: dataUrl })
        }).catch(() => {});
      }, 350);
    };
    reader.readAsDataURL(file);
  };

  // Upload Simulation for Logo & Cover (FR 2.3.3 - 2.3.5)
  const handleMediaUploadSimulation = (field) => {
    setIsUploadingMedia(true);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploadingMedia(false);
          const sampleUrl = field === 'logo_url' 
            ? 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=120&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80';
          
          setCompanyInfo(prevInfo => ({ ...prevInfo, [field]: sampleUrl }));
          setCompanyForm(prevForm => ({ ...prevForm, [field]: sampleUrl }));
          // Save to backend
          fetch('/api/employer/company', {
            method: 'PUT',
            headers,
            body: JSON.stringify({ [field]: sampleUrl })
          });
          return 100;
        }
        return prev + 30;
      });
    }, 200);
  };

  const handleResetMediaToDefault = (field) => {
    const placeholderUrl = field === 'logo_url'
      ? 'https://via.placeholder.com/120?text=PhucLong'
      : 'https://via.placeholder.com/800x300?text=CoverImage';
    setCompanyInfo(prev => ({ ...prev, [field]: placeholderUrl }));
    setCompanyForm(prev => ({ ...prev, [field]: placeholderUrl }));
    fetch('/api/employer/company', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ [field]: placeholderUrl })
    });
  };

  // Toggle Job is_open status
  const handleToggleJobStatus = async (jobId) => {
    try {
      const res = await fetch(`/api/employer/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || 'Đã cập nhật trạng thái tin tuyển dụng thành công!', 'success');
        fetchMyJobs();
      } else {
        notify(data.message || 'Không thể cập nhật trạng thái tin tuyển dụng.', 'error');
      }
    } catch (err) {
      notify('Lỗi kết nối máy chủ khi cập nhật trạng thái tin.', 'error');
    }
  };

  // Advance Job Lifecycle: "filled" ("Đã nhận người") -> "completed" ("Hoàn thành")
  const handleAdvanceJobLifecycle = async (job, targetStatus) => {
    const approvedCount = applicants.filter(a => a.job_id === job._id && (a.application_status === 'accepted' || a.application_status === 'interview')).length;
    if (targetStatus === 'filled' && approvedCount === 0) {
      notify('Cần ít nhất 1 hồ sơ Đã duyệt (trúng tuyển hoặc mời phỏng vấn) trước khi chuyển sang "Đã nhận người".', 'warning');
      return;
    }
    try {
      const res = await fetch(`/api/employer/jobs/${job._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ job_status: targetStatus })
      });
      const data = await res.json();
      if (data.success) {
        notify(`Đã chuyển trạng thái công việc sang: ${targetStatus === 'filled' ? 'Đã nhận người' : 'Hoàn thành'}`, 'success');
        fetchMyJobs();
        fetchApplicants();
      } else {
        notify(data.message || 'Lỗi cập nhật vòng đời công việc.', 'error');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // Delete Job permanently with ConfirmDialog
  const handleDeleteJob = async (job) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Xóa Tin Tuyển Dụng',
      message: `Bạn có chắc chắn muốn xóa tin tuyển dụng "${job.title}" vĩnh viễn khỏi hệ thống? Toàn bộ hồ sơ ứng tuyển liên quan của tin này cũng sẽ được gỡ bỏ.`,
      type: 'danger',
      confirmText: 'Xóa',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/employer/jobs/${job._id}`, {
            method: 'DELETE',
            headers
          });
          const data = await res.json();
          if (data.success) {
            notify(data.message || 'Đã xóa tin tuyển dụng thành công!', 'success');
            fetchMyJobs();
            fetchApplicants();
          } else {
            notify(data.message || 'Lỗi khi xóa tin.', 'error');
          }
        } catch (err) {
          notify('Lỗi máy chủ khi xóa tin tuyển dụng.', 'error');
        }
      }
    });
  };

  // Save / Update Job Form (UI-NTD-JOB-03)
  const handleSaveJobSubmit = async (e) => {
    e.preventDefault();
    if (isGuestMode) {
      notify('Vui lòng đăng nhập tài khoản Doanh nghiệp để đăng tin tuyển dụng!', 'info');
      if (onNavigateAuth) onNavigateAuth('login', 'employer');
      return;
    }
    if (isGuestMode || !token) {
      if (onShowBanner) onShowBanner('Vui lòng đăng nhập tài khoản Doanh nghiệp để đăng tin mới!', 'info');
      if (onNavigateAuth) onNavigateAuth('login', 'employer');
      return;
    }
    setJobFormMsg('');

    try {
      if (editingJob) {
        const res = await fetch(`/api/employer/jobs/${editingJob._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(jobForm)
        });
        const data = await res.json();
        if (data.success) {
          notify('Cập nhật tin tuyển dụng thành công!', 'success');
          setJobViewMode('list');
          setEditingJob(null);
          fetchMyJobs();
        } else {
          setJobFormMsg(data.message || 'Lỗi cập nhật tin.');
        }
      } else {
        const res = await fetch('/api/employer/jobs', {
          method: 'POST',
          headers,
          body: JSON.stringify(jobForm)
        });
        const data = await res.json();
        if (data.success) {
          notify('Đăng tin tuyển dụng thành công!', 'success');
          setActiveMenu('jobs');
          setJobViewMode('list');
          fetchMyJobs();
        } else {
          setJobFormMsg(data.message || 'Lỗi đăng tin.');
        }
      }
    } catch (err) {
      setJobFormMsg('Lỗi kết nối máy chủ.');
    }
  };

  // ATS Kanban Status Update & Delete Applicant
  const handleUpdateApplicantStatus = async (appId, newStatus, note = '') => {
    try {
      const res = await fetch(`/api/employer/applicants/${appId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus, note })
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || 'Đã cập nhật trạng thái hồ sơ ứng viên thành công!', 'success');
        fetchApplicants();
        fetchMyJobs();
        if (selectedApplicant && selectedApplicant._id === appId) {
          setSelectedApplicant(prev => ({ ...prev, application_status: newStatus }));
        }
      } else {
        notify(data.message || 'Cập nhật trạng thái ứng viên thất bại.', 'error');
      }
    } catch (err) {
      notify('Lỗi kết nối máy chủ khi cập nhật trạng thái ứng viên.', 'error');
    }
  };

  const handleDeleteApplicant = (app) => {
    const stuName = app.application_snapshot?.student_name || app.student_name || 'Ứng viên';
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa Hồ Sơ Ứng Tuyển',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ ứng tuyển của "${stuName}" (${app.job_title || 'Việc làm'}) khỏi hệ thống?`,
      type: 'danger',
      confirmText: 'Xóa',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/employer/applicants/${app._id}`, {
            method: 'DELETE',
            headers
          });
          const data = await res.json();
          if (data.success) {
            notify(data.message || 'Đã xóa hồ sơ ứng viên thành công!', 'success');
            if (selectedApplicant && selectedApplicant._id === app._id) {
              setSelectedApplicant(null);
            }
            fetchApplicants();
            fetchMyJobs();
          } else {
            notify(data.message || 'Không thể xóa hồ sơ ứng viên.', 'error');
          }
        } catch (err) {
          notify('Lỗi máy chủ khi xóa hồ sơ ứng viên.', 'error');
        }
      }
    });
  };

  // Handle File Selection for Chat (FR 2.9.3: Chỉ nhận .pdf, .png, .jpg <= 10MB)
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

  // Chế độ Chỉ Đọc (Read-Only) trong Chat theo FR 2.7.1 & 2.7.2
  const isChatReadOnly = Boolean(
    selectedContact?.application_status === 'rejected' ||
    selectedContact?.application_status === 'cancelled' ||
    selectedContact?.is_cancelled ||
    currentUser?.is_banned
  );

  // Mở đoạn chat trực tiếp với ứng viên được chọn
  const handleStartChatWithApplicant = (app) => {
    const studentName = app.application_snapshot?.student_name || app.student_name || 'Ứng viên sinh viên';
    const studentEmail = app.student_email || '';
    const studentUserId = app.student_user_id || app.student_id || app._id;

    const newContact = { 
      id: studentUserId, 
      name: studentName, 
      subtitle: `Ứng tuyển: ${app.job_title}`, 
      role: 'student', 
      email: studentEmail, 
      online: true, 
      lastMsg: `Đơn ứng tuyển: ${app.job_title}`, 
      time: 'Vừa xong', 
      unread: 0,
      application_status: app.application_status,
      is_cancelled: app.is_cancelled,
      application_id: app._id,
      job_title: app.job_title
    };

    setContacts(prev => {
      const exists = prev.find(c => c.id === studentUserId);
      if (exists) {
        return prev.map(c => c.id === studentUserId ? { ...c, ...newContact } : c);
      }
      return [newContact, ...prev];
    });

    setSelectedContact(newContact);
    setActiveMenu('chat');
  };

  // Tạo tin nhắn mới hoặc gửi liên kết phỏng vấn (FR 2.7.1)
  const handleCreateNewChatSubmit = async (e) => {
    e.preventDefault();
    if (!newChatSelectedAppId) {
      notify('Vui lòng chọn sinh viên / ứng viên cần nhắn tin!', 'error');
      return;
    }

    const app = applicants.find(a => a._id === newChatSelectedAppId);
    if (!app) return;

    // Ràng buộc kiểm tra trạng thái đơn: Chặn gửi nếu đã bị từ chối hoặc đã hủy
    if (app.application_status === 'rejected' || app.application_status === 'cancelled' || app.is_cancelled) {
      notify('Đơn ứng tuyển của ứng viên này đã bị Từ chối hoặc Đã hủy. Cuộc trò chuyện chỉ mở ở chế độ CHỈ ĐỌC, không được phép gửi thêm tin nhắn!', 'error');
      handleStartChatWithApplicant(app);
      setNewChatModalOpen(false);
      return;
    }

    const meetUrl = `https://meet.partime.vn/interview-${Date.now().toString().slice(-6)}`;
    const studentName = app.application_snapshot?.student_name || 'bạn';
    const companyDisplayName = companyInfo?.company_name || 'Doanh nghiệp';
    const content = newChatMessageText.trim() || (
      newChatType === 'interview'
        ? `Kính gửi ${studentName}, ${companyDisplayName} trân trọng mời bạn tham gia buổi phỏng vấn trực tuyến cho vị trí "${app.job_title}" tại liên kết: ${meetUrl}. Vui lòng tham gia đúng giờ.`
        : `Chào ${studentName}, ${companyDisplayName} đã tiếp nhận hồ sơ ứng tuyển của bạn cho vị trí "${app.job_title}". Bạn có thể phản hồi tin nhắn này để trao đổi thêm ca làm.`
    );

    handleStartChatWithApplicant(app);
    setNewChatModalOpen(false);
    setNewChatMessageText('');

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          room_id: getRoomId(app),
          content,
          student_id: app.student_user_id || app.student_id,
          application_id: app._id
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchChatMessages();
        if (onShowBanner) onShowBanner(`Đã khởi tạo hội thoại và gửi tin nhắn tới ứng viên ${studentName}!`, 'success');
      } else {
        notify(data.message || 'Lỗi gửi tin nhắn.', 'error');
      }
    } catch (err) {
      notify('Lỗi kết nối máy chủ.', 'error');
    }
  };

  // Nhanh chóng chèn liên kết phỏng vấn trực tuyến vào ô nhập
  const handleInsertInterviewLink = () => {
    const meetUrl = `https://meet.partime.vn/interview-${Date.now().toString().slice(-6)}`;
    setNewMsgText(`${companyInfo?.company_name || 'Doanh nghiệp'} trân trọng gửi liên kết phỏng vấn trực tuyến tới bạn: ${meetUrl}. Vui lòng chuẩn bị và tham gia đúng giờ.`);
  };

  // Send Chat Message with Media Attachment (FR 2.7.3 & 2.9.3)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isChatReadOnly) {
      notify('Cuộc trò chuyện đang ở chế độ CHỈ ĐỌC (Read-Only) do đơn ứng tuyển đã bị từ chối hoặc đã hủy!', 'error');
      return;
    }
    if (!newMsgText.trim() && !chatAttachment) return;

    const textContent = newMsgText.trim() || `[Tệp đính kèm: ${chatAttachment?.name}]`;
    const attachmentToSend = chatAttachment;
    setNewMsgText('');
    setChatAttachment(null);

    const { cleanText, isFlagged, matchedWords } = maskBannedWordsClient(textContent, bannedKeywords);
    const optimisticMsg = {
      _id: `msg_tmp_${Date.now()}`,
      sender_id: currentUser?._id || currentUser?.id || 'emp_user',
      sender_role: 'employer',
      sender_email: currentUser?.email || '',
      sender_name: companyInfo?.representative_name || companyInfo?.company_name || currentUser?.name || 'Doanh nghiệp',
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
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          room_id: getRoomId(),
          content: textContent,
          media_url: attachmentToSend?.base64 || '',
          file_name: attachmentToSend?.name || '',
          file_size: attachmentToSend?.size || 0,
          student_id: selectedContact?.id,
          application_id: selectedContact?.application_id
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
      } else if (!data.success) {
        notify(data.message || 'Không thể gửi tin nhắn.', 'error');
      }
    } catch (err) {
      console.warn('Send message error:', err);
    }
  };

  // Socket.IO Room Joining & WebRTC P2P Signaling Listeners (FR 2.9.4)
  useEffect(() => {
    if (!token) return;
    const socket = getSocket();
    const currentRoomId = currentRoomKey;
    if (empId) {
      socket.emit('register-user', { user_id: empId, role: 'employer' });
    }
    if (currentRoomId) {
      socket.emit('join-room', {
        room_id: currentRoomId,
        user_id: empId,
        role: 'employer'
      });
    }

    const onIncomingCall = (data) => {
      if (data.caller_role === 'student' && !callActiveRef.current) {
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
          if (onShowBanner) onShowBanner(null);
          notify('Đã kết nối WebRTC P2P thành công!', 'success');
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
      if (onShowBanner) onShowBanner(null);
      notify('Ứng viên đã kết thúc cuộc gọi.', 'success');
      fetchChatMessages();
    };

    const onCallRejected = () => {
      if (callActiveRef.current) {
        handleEndCall(false);
      }
      if (onShowBanner) onShowBanner(null);
      notify('Ứng viên đã từ chối cuộc gọi.', 'error');
      fetchChatMessages();
    };

    const onNewChatMessage = (msg) => {
      if (!msg) return;
      setChatMessages(prev => (prev.some(m => m._id === msg._id) ? prev : [...prev, msg]));
      const partnerId = msg.sender_role === 'student' ? (msg.sender_id || msg.student_id) : msg.receiver_id;
      if (partnerId) {
        setContacts(prev => prev.map(c => c.id === partnerId ? {
          ...c,
          lastMsg: msg.content || c.lastMsg,
          unreplied: msg.sender_role === 'student'
        } : c));
      }
    };

    const onApplicantChanged = () => {
      fetchApplicants();
      fetchMyJobs();
    };
    const onRealtimeSync = () => {
      fetchApplicants();
      fetchMyJobs();
      fetchCompanyProfile();
    };
    socket.on('incoming-call', onIncomingCall);
    socket.on('answer-made', onAnswerMade);
    socket.on('receive-candidate', onReceiveCandidate);
    socket.on('call-ended', onCallEnded);
    socket.on('call-rejected', onCallRejected);
    socket.on('new-chat-message', onNewChatMessage);

    socket.on('applicant-withdrawn', onApplicantChanged);
    socket.on('new-application', onApplicantChanged);
    socket.on('application-status-updated', onApplicantChanged);
    socket.on('shift-status-updated', onApplicantChanged);
    socket.on('job-updated', onRealtimeSync);
    socket.on('gpkd-status-updated', onRealtimeSync);
    socket.on('new-review', onRealtimeSync);
    socket.on('review-updated', onRealtimeSync);
    socket.on('categories-updated', fetchCategories);
    socket.on('banned-keywords-updated', fetchBannedKeywords);

    // KHÔNG polling lặp /api/chat/call/status hay /api/chat/messages nữa:
    // toàn bộ tín hiệu cuộc gọi và tin nhắn đi qua Socket.IO thời gian thực,
    // chỉ phát sinh request khi người dùng bấm nút gọi / nhấc máy / kết thúc hoặc gửi tin nhắn.
    return () => {
      socket.off('incoming-call', onIncomingCall);
      socket.off('answer-made', onAnswerMade);
      socket.off('receive-candidate', onReceiveCandidate);
      socket.off('call-ended', onCallEnded);
      socket.off('call-rejected', onCallRejected);
      socket.off('new-chat-message', onNewChatMessage);
      socket.off('applicant-withdrawn', onApplicantChanged);
      socket.off('new-application', onApplicantChanged);
      socket.off('application-status-updated', onApplicantChanged);
      socket.off('shift-status-updated', onApplicantChanged);
      socket.off('job-updated', onRealtimeSync);
      socket.off('gpkd-status-updated', onRealtimeSync);
      socket.off('new-review', onRealtimeSync);
      socket.off('review-updated', onRealtimeSync);
      socket.off('categories-updated', fetchCategories);
      socket.off('banned-keywords-updated', fetchBannedKeywords);
    };
  }, [token, isVideoCalling, currentRoomKey, empId]);

  // Kiểm tra cuộc gọi đến dự phòng (3s - chỉ kiểm tra khi rảnh, đọc nhanh từ RAM máy chủ để chắc chắn 100% hiện popup bắt máy)
  useEffect(() => {
    if (!token) return;
    const checkCallStatus = async () => {
      try {
        const res = await fetch(`/api/chat/call/status?room_id=${getRoomId()}`, { headers });
        const data = await res.json();
        if (data.success && data.call && data.call.status === 'ringing') {
          if (data.call.caller_role === 'student' && !callActiveRef.current) {
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
    const timer = setInterval(checkCallStatus, 3000);
    return () => clearInterval(timer);
  }, [token, isVideoCalling, incomingCall]);

  // Chuẩn hóa tương tác ≤ 3s: Polling tự động làm mới dữ liệu theo tab đang mở (không dùng stale closure)
  useEffect(() => {
    if (!token || isGuestMode) return;
    if (['home', 'company', 'applicants', 'jobs', 'job_completion', 'interviews', 'reviews', 'chat'].includes(activeMenu)) {
      const timer = setInterval(() => {
        if (activeMenu === 'chat') {
          if (selectedContactRef.current) {
            fetchChatMessages(selectedContactRef.current);
          }
          fetchApplicants();
        } else {
          fetchApplicants();
          fetchMyJobs();
        }
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [token, isGuestMode, activeMenu, currentRoomKey]);

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
        caller_name: companyInfo?.company_name || 'Doanh nghiệp',
        caller_role: 'employer',
        target_user_id: selectedContact?.student_user_id || selectedContact?.id,
        call_type: type,
        offer: offer
      });

      // REST persistence
      await fetch('/api/chat/call/initiate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ room_id: currentRoomId, call_type: type, offer: offer })
      });
      notify(`Đang đổ chuông cuộc gọi ${type === 'video' ? 'Video' : 'Thoại'} tới ứng viên ${selectedContact?.name || ''}...`, 'loading');
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

    // Chuyển sang màn hình Tin nhắn & chọn đúng ứng viên đang gọi để hiện đủ nút Mic / Camera / Kết thúc
    const callerContact = contacts.find(c => currentRoomId.endsWith(`_stu_${c.student_user_id || c.id || c.student_id}`));
    if (callerContact) {
      setSelectedContact(callerContact);
    } else if (!selectedContact && contacts.length > 0) {
      setSelectedContact(contacts[0]);
    } else if (!selectedContact) {
      setSelectedContact({
        id: incomingCall.caller_id || 'student_partner',
        student_user_id: incomingCall.caller_id,
        name: incomingCall.caller_name || 'Ứng viên sinh viên',
        online: true,
        subtitle: 'Ứng viên sinh viên'
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
          caller_name: companyInfo?.company_name || 'Doanh nghiệp',
          caller_role: 'employer',
          target_user_id: selectedContact?.student_user_id || selectedContact?.id,
          call_type: type,
          offer: newOffer
        });
        await fetch('/api/chat/call/respond', {
          method: 'POST',
          headers,
          body: JSON.stringify({ room_id: currentRoomId, action: 'accept' })
        });
      }

      notify('Đã kết nối cuộc gọi phỏng vấn WebRTC thành công!', 'success');
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
    } catch (e) {}
    setIncomingCall(null);
    if (onShowBanner) onShowBanner(null);
    notify('Đã từ chối cuộc gọi.', 'error');
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
      } catch (e) {}
    }
    setIsVideoCalling(false);
    setCallStatus('idle');
    setCallDuration(0);
    if (wasActive && !silent) {
      if (onShowBanner) onShowBanner(null);
      notify('Cuộc gọi phỏng vấn đã kết thúc.', 'success');
    }
    fetchChatMessages();
  };

  // (Đã bỏ effect xin lại getUserMedia mỗi lần bật/tắt mic-cam: nó tạo stream mới không được gửi đi
  //  nên mic/cam vẫn hoạt động dù giao diện báo đã tắt. Việc bật/tắt giờ áp dụng trực tiếp lên track đang gửi.)

  // Chỉ tải tin nhắn khi người dùng vào menu Chat hoặc đổi liên hệ (Không polling lặp để tránh lag web)
  useEffect(() => {
    if (!token || activeMenu !== 'chat') return;
    fetchChatMessages();
  }, [token, activeMenu, currentRoomKey]);

  // Submit Report (FR 2.5.6 & 2.7.5)
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportModalData || !reportReason.trim()) return;

    const fullReason = reportModalData.type === 'applicant'
      ? `[${reportReasonType}] ${reportReason.trim()}`
      : reportReason.trim();

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          report_type: reportModalData.type,
          target_id: reportModalData.target_id,
          target_title: reportModalData.target_title,
          reason: fullReason,
          application_id: reportModalData.application_id
        })
      });
      const data = await res.json();
      if (data.success) {
        setReportSuccessMsg(`Đã tạo phiếu khiếu nại (Mã: ${data.data?.ticket_code || 'TK-2026'}) và chuyển trực tiếp sang Quản trị viên xử lý!`);
        setTimeout(() => {
          setReportModalData(null);
          setReportReason('');
          setReportSuccessMsg('');
        }, 2200);
      } else {
        notify(data.message || 'Lỗi gửi báo cáo.', 'error');
      }
    } catch (err) {
      notify('Lỗi máy chủ.', 'error');
    }
  };

  // Submit Student Review (FR 2.6.1 - 2.6.4)
  const handleReviewStudentSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModalApp) return;

    try {
      const endpoint = editingReviewId ? `/api/employer/reviews/${editingReviewId}` : '/api/employer/reviews';
      const method = editingReviewId ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify({
          application_id: reviewModalApp._id,
          rating: reviewScore,
          comment: reviewNote.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || 'Đã lưu đánh giá năng lực sinh viên thành công!', 'success');
        setReviewModalApp(null);
        setEditingReviewId(null);
        setReviewNote('');
        fetchReviews();
      } else {
        notify(data.message || 'Lỗi gửi đánh giá.', 'error');
      }
    } catch (err) {
      notify('Lỗi kết nối máy chủ.', 'error');
    }
  };

  // Delete Employer Review permanently
  const handleDeleteEmployerReview = (rev) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa Đánh Giá Năng Lực Sinh Viên',
      message: 'Bạn có chắc chắn muốn xóa vĩnh viễn bài đánh giá năng lực sinh viên này khỏi hệ thống?',
      type: 'danger',
      confirmText: 'Xóa',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/employer/reviews/${rev._id}`, {
            method: 'DELETE',
            headers
          });
          const data = await res.json();
          if (data.success) {
            notify(data.message || 'Đã xóa đánh giá năng lực sinh viên thành công!', 'success');
            fetchReviews();
          } else {
            notify(data.message || 'Không thể xóa đánh giá.', 'error');
          }
        } catch (err) {
          notify('Lỗi máy chủ khi xóa đánh giá.', 'error');
        }
      }
    });
  };

  useEffect(() => {
    setJobPage(1);
  }, [jobSearch, jobStatusFilter, jobBranchFilter, jobRoleFilter]);

  // Filter Jobs Table (FR-NTD-04.10: Chi nhánh & Chức danh)
  const filteredJobs = myJobs.filter(j => {
    // 1. Tìm kiếm theo từ khóa (Tiêu đề, mô tả, chi nhánh, ngành nghề)
    const matchesSearch = matchKeywordFlexible(j, jobSearch, ['title', 'description', 'location', 'address', 'branch_name', 'category_name']);

    const jSt = normalizeJobStatus(j);
    const matchesStatus = !jobStatusFilter || jobStatusFilter === 'all' ||
      (jobStatusFilter === 'active' ? jSt === 'open' : jSt === jobStatusFilter);

    // 2. FR-NTD-04.10: Lọc theo Chi nhánh / Cơ sở (Tỉnh/Thành) linh hoạt đa từ
    const matchesBranch = matchKeywordFlexible(j, jobBranchFilter, ['location', 'branch_name', 'address', 'district', 'province']);

    // 3. Lọc theo Chức danh chuyên môn linh hoạt đa từ
    const matchesRole = matchKeywordFlexible(j, jobRoleFilter, ['title', 'description', 'category_name', 'category']);

    return matchesSearch && matchesStatus && matchesBranch && matchesRole;
  });

  const totalJobPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE) || 1;
  const paginatedJobs = filteredJobs.slice((jobPage - 1) * JOBS_PER_PAGE, jobPage * JOBS_PER_PAGE);

  // Danh sách ứng viên (Bao gồm đầy đủ các hồ sơ, kể cả khi sinh viên chủ động rút đơn để Doanh nghiệp nắm bắt)
  const validApplicants = isGuestMode ? [] : applicants;

  // Filter Kanban Candidates (FR-NTD-05.09, FR-NTD-05.10, FR-NTD-05.11)
  const filteredKanbanApplicants = validApplicants.filter(a => {
    // 1. Tìm kiếm ứng viên (Tên, Trường ĐH, Chức danh, SĐT, Email - Bỏ dấu tiếng Việt)
    const applicantObj = {
      ...a,
      student_name: a.application_snapshot?.student_name || a.student_name || '',
      university: a.application_snapshot?.university || a.university || '',
      phone: a.application_snapshot?.phone || a.phone || '',
      email: a.application_snapshot?.email || a.email || ''
    };
    const matchesSearch = matchKeywordFlexible(applicantObj, kanbanSearch, ['student_name', 'job_title', 'university', 'phone', 'email']);

    // 2. Lọc theo Tin tuyển dụng (khớp ID hoặc Tên bài đăng)
    const matchesJob = !kanbanJobFilter || kanbanJobFilter === '' || kanbanJobFilter === 'all' ||
      a.job_id === kanbanJobFilter ||
      matchKeywordFlexible(a, kanbanJobFilter, ['job_title', 'job_id']);

    // 3. FR-NTD-05.09: Lọc theo Ca làm việc đăng ký (khớp cả từ khóa lẫn mốc giờ 07:00, 13:00, 18:00...)
    const matchesShift = matchShiftFlexible(a, applicantShiftFilter);

    // 4. FR-NTD-05.10: Lọc theo Trường Đại học (khớp không dấu)
    const matchesUni = !applicantUniFilter || applicantUniFilter === 'all' || applicantUniFilter === 'Mọi trường đại học' ||
      matchKeywordFlexible(applicantObj, applicantUniFilter, ['university']);

    // 5. FR-NTD-05.10: Lọc theo Mức độ khớp lịch rảnh (100%, >=75%, >=50%)
    const computeScheduleMatch = () => {
      const fs = a.free_schedule || a.student_free_schedule || a.application_snapshot?.free_schedule;
      if (!fs || typeof fs !== 'object') return null;
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      const shiftText = `${a.shift_applied || ''} ${a.shift_registered || ''} ${a.work_time || ''}`.toLowerCase();
      const targetShifts = [];
      if (shiftText.includes('sáng') || shiftText.includes('morning') || shiftText.includes('07:') || shiftText.includes('08:')) targetShifts.push('morning');
      if (shiftText.includes('chiều') || shiftText.includes('afternoon') || shiftText.includes('13:') || shiftText.includes('14:')) targetShifts.push('afternoon');
      if (shiftText.includes('tối') || shiftText.includes('evening') || shiftText.includes('18:') || shiftText.includes('17:')) targetShifts.push('evening');
      const matchedDays = days.filter(d => {
        if (!fs[d] || typeof fs[d] !== 'object') return false;
        if (targetShifts.length > 0) return targetShifts.some(s => fs[d][s]);
        return fs[d].morning || fs[d].afternoon || fs[d].evening;
      }).length;
      return Math.round((matchedDays / days.length) * 100);
    };
    let matchesSchedule = true;
    if (applicantMatchFilter && applicantMatchFilter !== 'all') {
      const score = computeScheduleMatch();
      const threshold = Number(applicantMatchFilter) || 0;
      matchesSchedule = score !== null && score >= threshold;
    }

    // 6. FR-NTD-05.11: Lọc Thời gian nộp hồ sơ ứng viên
    let matchesDate = true;
    if (applicantTimeFilter !== 'all' && a.applied_at) {
      const appTime = new Date(a.applied_at).getTime();
      const now = Date.now();
      if (applicantTimeFilter === 'today') {
        matchesDate = (now - appTime) <= 86400000;
      } else if (applicantTimeFilter === '7days') {
        matchesDate = (now - appTime) <= 7 * 86400000;
      } else if (applicantTimeFilter === '30days') {
        matchesDate = (now - appTime) <= 30 * 86400000;
      } else if (applicantTimeFilter === 'custom') {
        if (applicantFromDate) matchesDate = matchesDate && appTime >= new Date(applicantFromDate).getTime();
        if (applicantToDate) matchesDate = matchesDate && appTime <= (new Date(applicantToDate).getTime() + 86400000);
      }
    }

    return matchesSearch && matchesJob && matchesShift && matchesUni && matchesSchedule && matchesDate;
  });

  // Kanban Columns (4 Cột chuẩn: Chờ duyệt / Đã tiếp nhận, Đã duyệt, Chưa phù hợp, Sinh viên chủ động rút đơn)
  const pendingApps = filteredKanbanApplicants.filter(a => ['pending', 'reviewed', 'received'].includes(a.application_status) || !a.application_status);
  const acceptedApps = filteredKanbanApplicants.filter(a => a.application_status === 'accepted' || a.application_status === 'interview');
  const rejectedApps = filteredKanbanApplicants.filter(a => a.application_status === 'rejected');
  const withdrawnApps = filteredKanbanApplicants.filter(a => a.application_status === 'cancelled' || a.application_status === 'withdrawn' || a.is_cancelled);

  // Filled jobs for shift completion (FR-NTD-10.03: Lọc theo Chi nhánh, Tin tuyển dụng & Đầy đủ trạng thái)
  const baseFilledJobs = myJobs;
  const filledJobsForCompletion = baseFilledJobs.filter(j => {
    const matchB = (!completionBranchFilter || completionBranchFilter === 'all' || completionBranchFilter === 'Tất cả chi nhánh')
      ? true
      : matchKeywordFlexible(j, completionBranchFilter, ['location', 'branch_name', 'address', 'district', 'province']);

    const matchJ = (!completionJobFilter || completionJobFilter === 'all' || completionJobFilter === 'Tất cả tin tuyển dụng')
      ? true
      : (j._id === completionJobFilter || matchKeywordFlexible(j, completionJobFilter, ['title', '_id']));

    let matchS = true;
    const jSt = normalizeJobStatus(j);
    const hasAcceptedApps = (j.accepted_count > 0) || validApplicants.some(a => a.job_id === j._id && (a.application_status === 'accepted' || a.application_status === 'interview'));
    if (completionStatusFilter === 'open') {
      matchS = jSt === 'open';
    } else if (completionStatusFilter === 'filled' || completionStatusFilter === 'waiting') {
      matchS = jSt === 'filled' || (hasAcceptedApps && jSt !== 'completed');
    } else if (completionStatusFilter === 'working') {
      matchS = jSt === 'working' || jSt === 'in_progress' || jSt === 'filled';
    } else if (completionStatusFilter === 'completed') {
      matchS = jSt === 'completed';
    } else if (completionStatusFilter === 'closed') {
      matchS = jSt === 'closed';
    }
    return matchB && matchJ && matchS;
  });

  // Sinh viên chờ đánh giá (loại trừ sinh viên đã gửi đánh giá cho đơn đó)
  const reviewedEmployerAppIds = new Set(reviews.map(r => String(r.application_id || '')));
  const pendingEmployerReviews = validApplicants.filter(
    a => (a.application_status === 'accepted' || a.application_status === 'interview') && !reviewedEmployerAppIds.has(String(a._id))
  );

  // Sidebar Menu Items for Employer (9 Danh mục chuẩn - Khớp 100% với Main Content)
  // Khi ở chế độ Khách (isGuestMode), toàn bộ count = undefined để không hiển thị badge đếm ảo
  const employerMenuItems = [
    { id: 'home', label: 'Bảng điều khiển tuyển dụng', icon: <Home className="w-4 h-4" /> },
    { id: 'company', label: 'Hồ sơ doanh nghiệp & Giấy phép kinh doanh', icon: <Building2 className="w-4 h-4" /> },
    { id: 'post_job', label: 'Đăng tin Part-time theo ca', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'jobs', label: 'Quản lý tin tuyển dụng', icon: <Briefcase className="w-4 h-4" />, count: isGuestMode ? undefined : myJobs.length },
    { id: 'applicants', label: 'Quản trị ứng viên', icon: <Users className="w-4 h-4" />, count: isGuestMode ? undefined : validApplicants.length },
    { id: 'interviews', label: 'Lịch phỏng vấn trực tuyến', icon: <Video className="w-4 h-4" />, count: isGuestMode ? undefined : validApplicants.length },
    { id: 'job_completion', label: 'Xác nhận hoàn thành ca làm', icon: <FileCheck className="w-4 h-4" />, count: isGuestMode ? undefined : baseFilledJobs.length },
    { id: 'reviews', label: 'Đánh giá năng lực sinh viên', icon: <Star className="w-4 h-4" />, count: isGuestMode ? undefined : reviews.length },
    { id: 'chat', label: 'Tin nhắn & Phỏng vấn ứng viên', icon: <MessageSquare className="w-4 h-4" />, count: isGuestMode ? undefined : contacts.length }
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#F8FAFC] text-slate-800 min-h-[calc(100vh-80px)]">
      
      {/* ======================= LEFT SIDEBAR DOANH NGHIỆP (CÓ NÚT THU GỌN / MỞ RỘNG) ======================= */}
      <aside className={`${
        mobileSidebarOpen
          ? 'fixed inset-y-0 left-0 z-50 w-80 shadow-2xl flex'
          : `hidden md:flex ${isSidebarCollapsed ? 'md:w-20' : 'md:w-80'}`
      } bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-sm flex-col shrink-0 transition-all duration-300`}>
        <div className={`p-4 border-b border-slate-100 flex items-center ${isSidebarCollapsed && !mobileSidebarOpen ? 'justify-center' : 'justify-between'} gap-2`}>
          {(!isSidebarCollapsed || mobileSidebarOpen) && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
              <span className="text-sm sm:text-base font-black tracking-wider text-slate-900 uppercase truncate">Cổng Doanh Nghiệp</span>
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

        {/* 9 Mục Menu Cố Định */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {employerMenuItems.map((item) => {
            const isActive = activeMenu === item.id;
            const collapsedDesktop = isSidebarCollapsed && !mobileSidebarOpen;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                onClick={() => {
                  handleMenuSwitch(item.id);
                  if (item.id === 'jobs') setJobViewMode('list');
                  if (item.id === 'reviews' && pendingEmployerReviews.length === 0 && reviews.length > 0) {
                    setReviewTab('history');
                  }
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

      {/* ======================= WIDGET CHAT SIDEBAR DRAWER ======================= */}
      {chatDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border-l border-slate-200 flex flex-col shadow-2xl h-full text-slate-800 animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase">Hội Thoại Ứng Viên</h3>
              </div>
              <button 
                type="button" 
                onClick={onCloseChatDrawer} 
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <EmployerChatContactsPanel
              contacts={contacts}
              selectedContact={selectedContact}
              chatSearchQuery={chatSearchQuery}
              onSearchChange={setChatSearchQuery}
              chatJobFilter={chatJobFilter}
              onJobFilterChange={setChatJobFilter}
              myJobs={myJobs}
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
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                Mở Toàn Màn Hình Chat & Video Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MAIN CONTENT AREA ======================= */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">

        {/* 1. MÀN HÌNH TRANG CHỦ DOANH NGHIỆP */}
        {activeMenu === 'home' && (
          <div className="w-full max-w-full mx-auto space-y-8">
            
            {/* Banner Doanh nghiệp */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-8 sm:p-12 lg:p-14 shadow-xl text-white min-h-[240px] sm:min-h-[270px] flex flex-col justify-center">
              <div className="max-w-3xl relative z-10 space-y-3">
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight text-white">
                  {isGuestMode ? (
                    <>Tuyển Dụng Sinh Viên Part-time <span className="text-sky-100">Linh Hoạt Theo Ca Làm</span></>
                  ) : (
                    companyInfo.company_name || 'Doanh Nghiệp Tuyển Dụng'
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-blue-50 leading-relaxed max-w-3xl mt-2">
                  {isGuestMode ? (
                    <>Lấp đầy ca làm việc trống nhanh chóng. Kết nối trực tiếp sinh viên các trường Đại học, Cao đẳng với chi phí tuyển dụng tối ưu và thẩm định Giấy phép kinh doanh 100%.</>
                  ) : (
                    <>Người đại diện: <strong className="text-white font-black">{companyInfo.representative_name}</strong> • Chi nhánh: {companyInfo.branch_name}</>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isGuestMode) {
                        setActiveMenu('post_job');
                        return;
                      }
                      if (employerRecord?.approval_status !== 'approved') {
                        notify('Hồ sơ GPKD của bạn chưa được Quản trị viên duyệt (hoặc bị từ chối). Vui lòng cập nhật GPKD hợp lệ để mở khóa chức năng đăng tin!', 'error');
                        setActiveMenu('company');
                        return;
                      }
                      setActiveMenu('jobs');
                      setJobViewMode('create');
                    }}
                    className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white hover:bg-slate-100 text-blue-700 text-xs sm:text-sm font-bold shadow-xl transition-all cursor-pointer flex items-center gap-2.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{isGuestMode ? 'Trải Nghiệm Đăng Tin Tuyển Dụng' : 'Đăng Tin Tuyển Dụng Mới'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMenuSwitch('applicants')}
                    className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-bold shadow-sm text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2.5"
                  >
                    <Users className="w-4 h-4 text-slate-900" />
                    <span>{isGuestMode ? 'Xem Bảng Quản Trị ATS Ứng Viên' : `Bảng Ứng Viên Tuyển Dụng (${applicants.length})`}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Value Pillars for Guest / Metric Cards for Logged-In Employer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {isGuestMode ? (
                <>
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-h-[130px]">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Xác Thực GPKD</p>
                      <p className="text-xl sm:text-2xl font-black text-slate-900">Bảo Vệ Thương Hiệu</p>
                      <p className="text-sm sm:text-base font-semibold text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Thẩm định 100% bởi Ban Quản Trị
                      </p>
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-h-[130px]">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Khớp Lịch Theo Ca</p>
                      <p className="text-xl sm:text-2xl font-black text-slate-900">Linh Hoạt Thông Minh</p>
                      <p className="text-sm sm:text-base font-semibold text-sky-600 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Đối soát thời khóa biểu rảnh SV
                      </p>
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                      <Clock className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-h-[130px]">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Phỏng Vấn & Nghiệm Thu</p>
                      <p className="text-xl sm:text-2xl font-black text-slate-900">ATS Đa Giai Đoạn</p>
                      <p className="text-sm sm:text-base font-semibold text-indigo-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Video 1-1 & Điểm danh GPS
                      </p>
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Users className="w-8 h-8" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-h-[130px]">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Tin Đang Tuyển Dụng</p>
                      <p className="text-2xl font-black text-slate-900">{myJobs.filter(j => j.is_open).length}</p>
                      <p className="text-xs text-sky-600 font-medium">{myJobs.length} tổng tin đã khởi tạo</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                      <Briefcase className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-h-[130px]">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Tổng Hồ Sơ Ứng Tuyển</p>
                      <p className="text-2xl font-black text-slate-900">{applicants.length}</p>
                      <p className="text-xs text-amber-600 font-medium">
                        {applicants.filter(a => a.application_status === 'pending').length} hồ sơ đang chờ xét duyệt
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Users className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-h-[130px]">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Đánh Giá Sinh Viên</p>
                      <p className="text-2xl font-black text-slate-900">{reviews.length}</p>
                      <p className="text-xs text-yellow-600 font-medium">Đánh giá 2 chiều sau hoàn thành</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-yellow-50 border border-yellow-100 text-yellow-600 flex items-center justify-center">
                      <Star className="w-6 h-6" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quy trình tuyển dụng B2B 3 bước tinh gọn */}
            {isGuestMode && (
              <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-md space-y-5">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-wider">Quy Trình Tuyển Dụng Sinh Viên 3 Bước Tinh Gọn:</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-xs">
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 min-h-[160px] sm:min-h-[170px]">
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md">1</span>
                    <p className="text-base sm:text-lg font-bold text-slate-900">Đăng Tin Tuyển Dụng Theo Ca</p>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">Chỉ mất 2 phút khởi tạo tin: chọn ca sáng/chiều/tối, mức lương theo giờ và địa điểm chi nhánh trên toàn quốc.</p>
                  </div>
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 min-h-[160px] sm:min-h-[170px]">
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md">2</span>
                    <p className="text-base sm:text-lg font-bold text-slate-900">Tự Động Khớp Lịch & Phỏng Vấn Video</p>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">Thuật toán đối soát lịch rảnh của sinh viên với ca làm việc. Mời và gọi video phỏng vấn 1-1 trực tiếp trên web.</p>
                  </div>
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 min-h-[160px] sm:min-h-[170px]">
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-md">3</span>
                    <p className="text-base sm:text-lg font-bold text-slate-900">Nghiệm Thu Ca Làm & Chấm Điểm 5 Sao</p>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">Sinh viên check-in GPS tại cơ sở. Quản lý bấm xác nhận hoàn thành ca trong 1 chạm và đánh giá năng lực 2 chiều.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Kanban Preview */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <Users className="w-6 h-6 text-blue-600" />
                  <span>{isGuestMode ? 'Quản Trị Ứng Viên Tuyển Dụng (ATS Pipeline)' : 'Ứng Viên Mới Cần Xử Lý Nhanh'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleMenuSwitch('applicants')}
                  className="text-sm sm:text-base font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Mở Bảng Ứng Viên ATS</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {isGuestMode ? (
                <div className="p-8 sm:p-10 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-300 text-slate-800 flex items-center justify-center mx-auto shadow-sm">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">Quy Trình Quản Trị Hồ Sơ Ứng Viên Chuẩn ATS</h4>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                      Bạn đang xem ở chế độ khách. Đăng ký hoặc đăng nhập tài khoản Doanh nghiệp để phát hành tin tuyển dụng theo ca và tiếp nhận hồ sơ ứng tuyển trực tiếp từ sinh viên.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onNavigateAuth && onNavigateAuth('login', 'employer')}
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm font-bold shadow-sm cursor-pointer"
                    >
                      Đăng Nhập
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateAuth && onNavigateAuth('register', 'employer')}
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm font-bold shadow-sm cursor-pointer"
                    >
                      Đăng Ký Doanh Nghiệp
                    </button>
                  </div>
                </div>
              ) : pendingApps.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <Users className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-600 font-semibold">Chưa có ứng viên mới chờ duyệt</p>
                  <p className="text-xs text-slate-500">Các hồ sơ ứng tuyển mới từ sinh viên sẽ hiển thị tại đây.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingApps.slice(0, 2).map((app) => (
                    <div
                      key={app._id}
                      onClick={() => setSelectedApplicant(app)}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{app.application_snapshot?.student_name || 'Ứng viên'}</p>
                        <p className="text-xs text-blue-600 font-medium">{app.job_title}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">Nộp: {app.applied_at}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                        Chờ duyệt
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* 2. MÀN HÌNH HỒ SƠ DOANH NGHIỆP & GPKD (UI-NTD-PRO-01, 02 - 2.3.1 -> 2.3.5) */}
        {activeMenu === 'company' && (
          <div className="w-full max-w-full mx-auto space-y-8">
            {isGuestMode ? (
              /* GIAO DIỆN XEM TRƯỚC HỒ SƠ DOANH NGHIỆP & GPKD (CHẾ ĐỘ KHÁCH - KHÔNG CHỨA DỮ LIỆU CÁ NHÂN / GPKD ẢO) */
              <div className="space-y-8 animate-in fade-in duration-300">
                
                {/* 1. Banner Giới Thiệu Tính Năng Hồ Sơ Doanh Nghiệp */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-8 sm:p-12 lg:p-14 shadow-xl text-white min-h-[220px] flex flex-col justify-center">
                  <div className="max-w-3xl relative z-10 space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white">
                      <Building2 className="w-3.5 h-3.5" /> Tính Năng Hồ Sơ Doanh Nghiệp & Thẩm Định GPKD
                    </span>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
                      Xây Dựng Thương Hiệu Tuyển Dụng <span className="text-sky-200">Được Xác Thực Uy Tín</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-blue-100 leading-relaxed max-w-2xl">
                      Thiết lập hồ sơ doanh nghiệp chuẩn chuyên nghiệp với Logo, Ảnh bìa, Địa chỉ chi nhánh và nộp Giấy phép kinh doanh để được Quản trị viên cấp tích xanh thẩm định hợp lệ 100%.
                    </p>
                  </div>
                </div>

                {/* 2. Ba Trụ Cột Thẩm Định & Quyền Lợi Doanh Nghiệp */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                  <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">100% Thẩm Định GPKD Hợp Lệ</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Mọi doanh nghiệp tuyển dụng đều được Ban Quản Trị đối soát mã số thuế và thẩm định Giấy phép kinh doanh có dấu mộc đỏ, đảm bảo môi trường tuyển dụng minh bạch.
                    </p>
                  </div>

                  <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">Trang Thương Hiệu Chuyên Nghiệp</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Tự do tùy chỉnh Logo thương hiệu, Ảnh bìa, Giới thiệu công ty và Địa chỉ các cơ sở chi nhánh để thu hút hàng ngàn ứng viên sinh viên nộp hồ sơ.
                    </p>
                  </div>

                  <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">Cam Kết Bảo Vệ Quyền Lợi Tuyển Dụng</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Nền tảng cam kết hỗ trợ đối soát lịch học sinh viên, tính công minh bạch và cung cấp hệ thống phỏng vấn video WebRTC 1-1 miễn phí.
                    </p>
                  </div>
                </div>

                {/* 3. Quy Trình 3 Bước Kích Hoạt Quyền Đăng Tin Tuyển Dụng */}
                <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-md space-y-5">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-blue-600" />
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-wider">
                      Quy Trình 3 Bước Để Mở Khóa Đăng Tin Tuyển Dụng:
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <span className="w-9 h-9 rounded-xl bg-white border border-slate-300 text-slate-900 font-black text-sm flex items-center justify-center shadow-xs">1</span>
                      <p className="text-base font-bold text-slate-900">Đăng Ký Tài Khoản</p>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                        Tạo tài khoản Doanh nghiệp với email chính thức, số điện thoại liên hệ và mã số thuế 10-13 chữ số.
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <span className="w-9 h-9 rounded-xl bg-white border border-slate-300 text-slate-900 font-black text-sm flex items-center justify-center shadow-xs">2</span>
                      <p className="text-base font-bold text-slate-900">Tải Lên Giấy Phép Kinh Doanh</p>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                        Gửi tệp scan GPKD có dấu mộc đỏ để Quản trị viên tiến hành thẩm định và cấp tích xanh hợp lệ trong 24h.
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <span className="w-9 h-9 rounded-xl bg-white border border-slate-300 text-slate-900 font-black text-sm flex items-center justify-center shadow-xs">3</span>
                      <p className="text-base font-bold text-slate-900">Phát Hành Tin & Tuyển Dụng</p>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                        Sau khi hồ sơ được duyệt, doanh nghiệp bắt đầu phát hành tin part-time theo ca và tiếp nhận ứng viên sinh viên.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Hộp Giới Thiệu Chế Độ Xem Trước */}
                <div className="p-8 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-300 text-slate-800 flex items-center justify-center mx-auto shadow-sm">
                    <Building2 className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">
                      Bạn Đang Ở Chế Độ Xem Trước (Khách)
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                      Để cập nhật hồ sơ thương hiệu, tải lên ảnh bìa, logo và nộp Giấy phép kinh doanh của công ty bạn, vui lòng sử dụng nút Đăng Nhập hoặc Đăng Ký Doanh Nghiệp ở thanh tiêu đề trên cùng.
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              /* GIAO DIỆN TOÀN VẸN CHO DOANH NGHIỆP ĐÃ ĐĂNG NHẬP */
              <>
                {/* Khu vực Nhận diện thương hiệu: Cover & Logo (FR 2.3.3 - 2.3.5) */}
                <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200/80 shadow-md">
                  {/* Ảnh bìa (Cover Image) với Hover upload, kéo thả file & delete */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingCover(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingCover(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingCover(false);
                      if (e.dataTransfer.files?.[0]) handleMediaFileProcess('cover_image_url', e.dataTransfer.files[0]);
                    }}
                    className="relative h-48 sm:h-64 w-full bg-slate-100 group overflow-hidden"
                  >
                    <img
                      src={companyInfo.cover_image_url || DEFAULT_COVER_SVG}
                      alt="Ảnh bìa doanh nghiệp"
                      onError={(e) => { e.currentTarget.src = DEFAULT_COVER_SVG; }}
                      className="w-full h-full object-cover"
                    />
                    {isDraggingCover && (
                      <div className="absolute inset-0 z-20 bg-blue-950/80 border-4 border-dashed border-sky-400 flex flex-col items-center justify-center text-white">
                        <Upload className="w-10 h-10 text-sky-400 animate-bounce mb-2" />
                        <span className="font-bold text-sm">Thả ảnh bìa JPG/PNG vào đây ngay!</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg">
                        <Upload className="w-4 h-4" />
                        <span>Thay Ảnh Bìa (Kéo thả hoặc Chọn)</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => e.target.files?.[0] && handleMediaFileProcess('cover_image_url', e.target.files[0])} 
                          className="hidden" 
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleResetMediaToDefault('cover_image_url')}
                        className="px-2.5 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white cursor-pointer text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                        title="Xóa ảnh bìa về mặc định"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>

                  {/* Logo công ty và Thông tin Doanh Nghiệp (Logo nổi trên cạnh dưới bìa, text đặt trang nhã trên nền trắng) */}
                  <div className="px-6 sm:px-8 pb-6 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 bg-white">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div 
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingLogo(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingLogo(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDraggingLogo(false);
                          if (e.dataTransfer.files?.[0]) handleMediaFileProcess('logo_url', e.dataTransfer.files[0]);
                        }}
                        className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden group shrink-0 -mt-12 sm:-mt-14 ${
                          isDraggingLogo ? 'ring-4 ring-blue-500 scale-105' : ''
                        }`}
                      >
                        <img
                          src={companyInfo.logo_url || DEFAULT_LOGO_SVG}
                          alt="Logo công ty"
                          onError={(e) => { e.currentTarget.src = DEFAULT_LOGO_SVG; }}
                          className="w-full h-full object-cover"
                        />
                        {isDraggingLogo && (
                          <div className="absolute inset-0 z-20 bg-blue-950/90 flex flex-col items-center justify-center text-white">
                            <Upload className="w-6 h-6 text-sky-400 animate-bounce" />
                            <span className="text-xs font-bold">Thả Logo</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="p-2 rounded-xl bg-blue-600 text-white cursor-pointer" title="Upload Logo">
                            <Upload className="w-3.5 h-3.5" />
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => e.target.files?.[0] && handleMediaFileProcess('logo_url', e.target.files[0])} 
                              className="hidden" 
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleResetMediaToDefault('logo_url')}
                            className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                            title="Xóa logo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-1">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                          {isGuestMode ? 'Hồ Sơ Doanh Nghiệp (Xem Trước)' : (companyInfo.company_name || 'Doanh Nghiệp Tuyển Dụng')}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-0.5">
                          {isGuestMode ? 'Chế độ khách - Chưa đăng nhập tài khoản' : companyInfo.branch_name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isGuestMode ? 'Đăng nhập hoặc đăng ký tài khoản để cập nhật hồ sơ chính thức' : `Người đại diện: ${companyInfo.representative_name}`}
                        </p>
                      </div>
                    </div>

                    {!isEditingCompany && (
                      <button
                        type="button"
                        onClick={() => setIsEditingCompany(true)}
                        className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold border border-slate-300 transition-all cursor-pointer flex items-center gap-2 shadow-xs shrink-0"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                        <span>Chỉnh sửa thông tin</span>
                      </button>
                    )}
                  </div>

                  {/* Progress bar upload media */}
                  {isUploadingMedia && (
                    <div className="px-6 pb-4 space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Đang tải lên hình ảnh định dạng JPG/PNG...</span>
                        <span className="font-mono text-blue-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Khu vực Thông tin định danh & GPKD (FR 2.3.1, 2.3.2) */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-6">
                  
                  {/* Trạng thái duyệt GPKD */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        GPKD
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Giấy Phép Kinh Doanh: {companyInfo.business_license || 'Chưa cập nhật'}</p>
                        <p className="text-xs text-slate-500 font-mono">
                          Tài liệu: {companyInfo.business_license_name || (companyInfo.business_license_url ? (companyInfo.business_license_url.toLowerCase().endsWith('.pdf') ? companyInfo.business_license_url.split('/').pop() : 'GPKD_DoanhNghiep.pdf') : 'Chưa tải lên tệp PDF')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        isGuestMode
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : (employerRecord.approval_status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : (employerRecord.approval_status === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'))
                      }`}>
                        {isGuestMode ? 'Chế độ xem trước (Chưa liên kết tài khoản)' : (employerRecord.approval_status === 'approved' ? 'Đã Phê Duyệt Hợp Lệ' : (employerRecord.approval_status === 'rejected' ? 'Bị Từ Chối GPKD' : 'Chờ Admin Duyệt'))}
                      </span>
                    </div>
                  </div>

                  {/* Form chỉnh sửa hoặc View chi tiết */}
                  {isEditingCompany ? (
                    <form onSubmit={handleSaveCompanyProfile} className="space-y-6 text-sm sm:text-base">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Tên Doanh Nghiệp *</label>
                          <input
                            type="text"
                            required
                            value={companyForm.company_name}
                            onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm sm:text-base text-slate-900 outline-none focus:border-blue-600 focus:bg-white shadow-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Họ Tên Người Đại Diện *</label>
                          <input
                            type="text"
                            required
                            value={companyForm.representative_name}
                            onChange={(e) => setCompanyForm({ ...companyForm, representative_name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm sm:text-base text-slate-900 outline-none focus:border-blue-600 focus:bg-white shadow-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Tên Chi Nhánh Làm Việc *</label>
                          <input
                            type="text"
                            required
                            list="hcm-branches-company"
                            value={companyForm.branch_name}
                            onChange={(e) => setCompanyForm({ ...companyForm, branch_name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm sm:text-base text-slate-900 outline-none focus:border-blue-600 focus:bg-white shadow-xs"
                            placeholder="Chọn hoặc nhập chi nhánh..."
                          />
                          <datalist id="hcm-branches-company">
                            {HCM_BRANCH_SUGGESTIONS.map(b => (
                              <option key={b} value={b} />
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Mã Số GPKD *</label>
                          <input
                            type="text"
                            required
                            value={companyForm.business_license}
                            onChange={(e) => setCompanyForm({ ...companyForm, business_license: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Quy Mô Công Ty *</label>
                          <select
                            value={companyForm.scale}
                            onChange={(e) => setCompanyForm({ ...companyForm, scale: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                          >
                            <option value="10-50 nhân viên">10-50 nhân viên</option>
                            <option value="50-200 nhân viên">50-200 nhân viên</option>
                            <option value="200-500 nhân viên">200-500 nhân viên</option>
                            <option value="500+ nhân viên">500+ nhân viên</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Địa Chỉ Trụ Sở / Chi Nhánh (24 Quận Huyện TP.HCM) *</label>
                          <input
                            type="text"
                            required
                            list="hcm-districts-company"
                            value={companyForm.address}
                            onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm sm:text-base text-slate-900 outline-none focus:border-blue-600 focus:bg-white shadow-xs"
                            placeholder="Chọn hoặc nhập địa chỉ quận..."
                          />
                          <datalist id="hcm-districts-company">
                            {HCM_DISTRICTS.map((d) => (
                              <option key={d} value={`${d}, TP.HCM`} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Giới Thiệu Môi Trường Làm Việc *</label>
                        <textarea
                          rows={4}
                          value={companyForm.description}
                          onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm sm:text-base text-slate-900 outline-none focus:border-blue-600 focus:bg-white leading-relaxed min-h-[140px] shadow-xs"
                        />
                      </div>

                      {/* Tải lại Giấy phép kinh doanh mới (FR 2.3.2) */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block font-bold text-slate-800">
                            Tệp Giấy Phép Kinh Doanh Mới (.pdf ≤ 10MB)
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowCompanyGpkdViewer(true)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-blue-100"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem Nội Dung Chi Tiết GPKD</span>
                          </button>
                        </div>

                        <input
                          type="file"
                          ref={gpkdFileInputRef}
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={handleGpkdFileSelect}
                        />

                        <div 
                          onClick={() => gpkdFileInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setIsDraggingGpkd(true); }}
                          onDragLeave={() => setIsDraggingGpkd(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingGpkd(false);
                            const dropped = e.dataTransfer.files?.[0];
                            if (dropped) processGpkdFile(dropped);
                          }}
                          className={`p-4 rounded-xl border-2 border-dashed ${isDraggingGpkd ? 'border-blue-600 bg-blue-50/50' : 'border-slate-300 hover:border-blue-500 bg-white'} flex flex-col items-center justify-center text-center cursor-pointer transition-all group`}
                        >
                          <Upload className="w-6 h-6 text-blue-600 mb-1.5 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-bold text-slate-800">
                            {companyForm.new_gpkd_name || companyForm.business_license_name
                              ? `Đã tải lên: ${companyForm.new_gpkd_name || companyForm.business_license_name}`
                              : (companyForm.business_license_url ? 'Nhấn hoặc kéo thả tệp GPKD mới thay thế' : 'Nhấn hoặc kéo thả tệp GPKD (.pdf) từ thiết bị')}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">Định dạng chấp nhận: PDF (kích thước tối đa 10MB)</p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p>
                            <strong>Lưu ý quan trọng:</strong> Khi bạn tải lại Giấy phép kinh doanh mới, hệ thống sẽ tự động chuyển trạng thái tài khoản về <strong>"Chờ duyệt"</strong> và đẩy yêu cầu duyệt hồ sơ sang Quản trị viên để kiểm tra tính hợp lệ.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingCompany(false)}
                          className="px-4 py-2 text-slate-600 hover:text-slate-900 cursor-pointer font-semibold"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="px-8 py-3 rounded-xl btn-primary-dimension text-sm sm:text-base font-bold shadow-lg cursor-pointer transition-all"
                        >
                          Lưu Hồ Sơ Doanh Nghiệp
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-slate-500 font-medium">Tên Doanh Nghiệp:</span>
                        <p className="text-sm font-bold text-slate-900">{companyInfo.company_name}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-slate-500 font-medium">Người Đại Diện Pháp Luật:</span>
                        <p className="text-sm font-bold text-blue-600">{companyInfo.representative_name}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-slate-500 font-medium">Chi Nhánh Cửa Hàng:</span>
                        <p className="text-sm font-bold text-slate-900">{companyInfo.branch_name}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-slate-500 font-medium">Địa Chỉ Tuyển Dụng:</span>
                        <p className="text-sm font-bold text-slate-900">{companyInfo.address}</p>
                      </div>
                      <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-slate-500 font-medium">Giới Thiệu Doanh Nghiệp:</span>
                        <p className="text-xs text-slate-700 leading-relaxed">{companyInfo.description}</p>
                      </div>
                      <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">Giấy Phép Đăng Ký Kinh Doanh: {companyInfo.business_license || 'Chưa cập nhật'}</p>
                            <p className="text-xs text-slate-500 font-mono">Tệp lưu trữ: {companyInfo.business_license_name || (companyInfo.business_license_url ? (companyInfo.business_license_url.toLowerCase().endsWith('.pdf') ? companyInfo.business_license_url.split('/').pop() : 'GPKD_DoanhNghiep.pdf') : 'Chưa đính kèm tệp')}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCompanyGpkdViewer(true)}
                          className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Xem Nội Dung Chi Tiết GPKD</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}
          </div>
        )}

        {/* 3. MÀN HÌNH QUẢN LÝ TIN TUYỂN DỤNG & FORM ĐĂNG TIN PART-TIME THEO CA (UI-NTD-JOB-01 -> 03 - 2.4.1 -> 2.4.8) */}
                {/* 3. MÀN HÌNH QUẢN LÝ TIN TUYỂN DỤNG & FORM ĐĂNG TIN PART-TIME THEO CA (UI-NTD-JOB-01 -> 03 - 2.4.1 -> 2.4.8) */}
                {/* 3. MÀN HÌNH QUẢN LÝ TIN TUYỂN DỤNG & FORM ĐĂNG TIN PART-TIME THEO CA (UI-NTD-JOB-01 -> 03 - 2.4.1 -> 2.4.8) */}
        {(activeMenu === 'jobs' || activeMenu === 'post_job') && (
          <div className="w-full max-w-full mx-auto space-y-8">
            
            {/* SUBVIEW 1: FORM TẠO / SỬA TIN (UI-NTD-JOB-03) */}
            {(activeMenu === 'post_job' || jobViewMode === 'create' || jobViewMode === 'edit') ? (
              <div className="form-card-col2 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-blue-200/60">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-blue-600" />
                        <span>{activeMenu === 'post_job' ? 'Đăng Tin Part-Time Theo Ca Mới' : jobViewMode === 'create' ? 'Đăng Tin Tuyển Dụng Mới' : 'Chỉnh Sửa Tin Tuyển Dụng'}</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">Phân bổ ca làm việc, mức lương theo giờ và địa điểm theo chuẩn 63 Tỉnh/Thành phố</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveJobSubmit} className="space-y-5 text-xs sm:text-sm">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">Tiêu Đề Công Việc (Gợi ý ngành nghề linh hoạt) *</label>
                    <input
                      type="text"
                      required
                      list="hcm-professions-list"
                      placeholder="Ví dụ: Nhân viên Pha chế Barista & Phục vụ ca linh hoạt"
                      value={jobForm.title}
                      onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                      className="w-full bg-white border border-blue-200/80 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 shadow-xs text-xs sm:text-sm"
                    />
                    <datalist id="hcm-professions-list">
                      {PROFESSION_SUGGESTIONS.map((p, idx) => (
                        <option key={idx} value={p} />
                      ))}
                    </datalist>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-bold text-slate-800">Ngành Nghề Tuyển Dụng *</label>
                        <span className="text-xs text-blue-700 font-semibold">Nhập tay hoặc chọn gợi ý dropdown</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          list="job-industry-suggestions"
                          value={jobForm.category_id}
                          onChange={(e) => setJobForm({ ...jobForm, category_id: e.target.value })}
                          placeholder="Nhập hoặc chọn ngành nghề tuyển dụng..."
                          className="w-full bg-white border border-blue-200/80 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 shadow-xs text-xs sm:text-sm placeholder:text-slate-400"
                        />
                        <datalist id="job-industry-suggestions">
                          {categories
                            .filter(c => (c.type === 'job' || !c.type) && !['bảo hành', 'thời trang', 'quận', 'huyện', 'tp.', 'tỉnh'].some(w => (c.name || '').toLowerCase().includes(w)))
                            .map(c => (
                              <option key={c._id} value={c.name} />
                            ))}
                          {PROFESSION_SUGGESTIONS.map((p, idx) => (
                            <option key={`p-${idx}`} value={p} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block font-bold text-slate-800">Địa Điểm Làm Việc (63 Tỉnh/Thành phố & Quận/Huyện) *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                          value={postProvince}
                          onChange={(e) => {
                            const newProv = e.target.value;
                            setPostProvince(newProv);
                            const districts = getDistrictsByProvince(newProv);
                            const newDist = districts[0] || '';
                            setPostDistrict(newDist);
                            setJobForm(prev => ({
                              ...prev,
                              location: `${postCustomAddress ? postCustomAddress + ', ' : ''}${newDist}, ${newProv}`
                            }));
                          }}
                          className="bg-white border border-blue-200/80 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 shadow-xs text-xs sm:text-sm cursor-pointer"
                        >
                          {VIETNAM_PROVINCES.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        <select
                          value={postDistrict}
                          onChange={(e) => {
                            const newDist = e.target.value;
                            setPostDistrict(newDist);
                            setJobForm(prev => ({
                              ...prev,
                              location: `${postCustomAddress ? postCustomAddress + ', ' : ''}${newDist}, ${postProvince}`
                            }));
                          }}
                          className="bg-white border border-blue-200/80 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 shadow-xs text-xs sm:text-sm cursor-pointer"
                        >
                          {getDistrictsByProvince(postProvince).map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-bold text-slate-800">Khoảng Lương Theo Giờ (VNĐ/giờ) *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="text-xs text-slate-600 font-semibold block mb-1">Lương tối thiểu (VNĐ/giờ):</span>
                        <input
                          type="number"
                          min={15000}
                          max={200000}
                          required
                          value={jobForm.salary_min}
                          onChange={(e) => setJobForm({ ...jobForm, salary_min: Number(e.target.value) })}
                          className="w-full bg-white border border-blue-200/80 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 shadow-xs font-mono text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-slate-600 font-semibold block mb-1">Lương tối đa (VNĐ/giờ):</span>
                        <input
                          type="number"
                          min={15000}
                          max={200000}
                          required
                          value={jobForm.salary_max}
                          onChange={(e) => setJobForm({ ...jobForm, salary_max: Number(e.target.value) })}
                          className="w-full bg-white border border-blue-200/80 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 shadow-xs font-mono text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ca làm việc Part-Time theo ca */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-800">Ca Làm Việc Part-Time Theo Ca *</label>
                      <span className="text-xs text-blue-700 font-semibold">Hỗ trợ 4 khung ca: Sáng, Chiều, Tối, Linh hoạt</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'morning', label: 'Ca sáng (7:00-12:00)', value: 'Ca sáng (7:00-12:00)' },
                        { id: 'afternoon', label: 'Ca chiều (13:00-18:00)', value: 'Ca chiều (13:00-18:00)' },
                        { id: 'evening', label: 'Ca tối (18:00-23:00)', value: 'Ca tối (18:00-23:00)' },
                        { id: 'flexible', label: 'Ca linh hoạt (Tự chọn theo lịch học)', value: 'Ca linh hoạt (Tự chọn theo lịch học)' }
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setJobForm({ ...jobForm, work_time: s.value })}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            jobForm.work_time === s.value || (jobForm.work_time && jobForm.work_time.includes(s.label))
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'bg-white text-slate-700 border border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">Mô Tả Chi Tiết Công Việc & Yêu Cầu *</label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Mô tả công việc pha chế, phục vụ khách hàng, bảo quản nguyên vật liệu..."
                      value={jobForm.description}
                      onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                      className="w-full bg-white border border-blue-200/80 rounded-xl p-4 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 shadow-xs leading-relaxed text-xs sm:text-sm"
                    />
                  </div>

                  {jobFormMsg && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                      {jobFormMsg}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenu('jobs');
                        setJobViewMode('list');
                      }}
                      className="px-5 py-2.5 text-slate-700 hover:text-slate-950 font-bold cursor-pointer"
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 rounded-xl btn-primary-dimension text-xs sm:text-sm font-bold shadow-lg cursor-pointer transition-all"
                    >
                      {activeMenu === 'post_job' || jobViewMode === 'create' ? 'Đăng Tin Ngay' : 'Lưu Thay Đổi'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* SUBVIEW 2: BẢNG DANH SÁCH TIN (UI-NTD-JOB-01 & 02) */
              <div className="space-y-4">
                
                {/* Thanh công cụ tìm kiếm, lọc & nút + Tạo tin */}
                <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-md flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 flex-1 min-w-0">
                    <div className="relative min-w-0">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={jobSearch}
                        onChange={(e) => setJobSearch(e.target.value)}
                        placeholder="Tìm tin tuyển dụng..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white truncate"
                      />
                    </div>

                    <div className="min-w-0">
                      <select
                        value={jobStatusFilter}
                        onChange={(e) => setJobStatusFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white cursor-pointer truncate"
                      >
                        {JOB_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value === 'all' ? '' : opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* FR-NTD-04.10: Bộ lọc theo Chi nhánh & Chức danh (Hỗ trợ nhập tay hoặc chọn gợi ý dropdown) */}
                    <div className="min-w-0">
                      <input
                        type="text"
                        list="emp-job-branch-list"
                        value={jobBranchFilter}
                        onChange={(e) => setJobBranchFilter(e.target.value)}
                        placeholder="Tất cả chi nhánh..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white truncate"
                        title="Lọc theo chi nhánh / Cơ sở cửa hàng (nhập tay hoặc chọn gợi ý)"
                      />
                      <datalist id="emp-job-branch-list">
                        {Array.from(new Set([
                          ...myJobs.flatMap(j => [j.branch_name, j.location]).filter(Boolean),
                          'Quận 1, TP.HCM',
                          'Quận 3, TP.HCM',
                          'Bình Thạnh, TP.HCM',
                          'TP. Thủ Đức, TP.HCM',
                          'Quận 10, TP.HCM',
                          'Cầu Giấy, Hà Nội',
                          'Hải Châu, Đà Nẵng'
                        ])).map((b, i) => (
                          <option key={i} value={b} />
                        ))}
                      </datalist>
                    </div>

                    <div className="min-w-0">
                      <input
                        type="text"
                        list="emp-job-role-list"
                        value={jobRoleFilter}
                        onChange={(e) => setJobRoleFilter(e.target.value)}
                        placeholder="Tất cả chức danh..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white truncate"
                        title="Lọc theo chức danh chuyên môn (nhập tay hoặc chọn gợi ý)"
                      />
                      <datalist id="emp-job-role-list">
                        {Array.from(new Set([
                          ...myJobs.map(j => j.title).filter(Boolean),
                          ...myJobs.map(j => j.category_name).filter(Boolean),
                          'Phục vụ bàn',
                          'Thu ngân',
                          'Pha chế (Barista)',
                          'Bán hàng',
                          'Phụ kho'
                        ])).map((r, i) => (
                          <option key={i} value={r} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {!isGuestMode && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isGuestMode) {
                        setJobViewMode('create');
                        setEditingJob(null);
                        setJobForm({
                          title: '',
                          category_id: '',
                          location: companyInfo.address || 'Quận 1, TP.HCM',
                          description: '',
                          salary_min: 28000,
                          salary_max: 35000,
                          is_negotiable: false,
                          work_time: 'Ca sáng: 07:00 - 11:30 (4.5 tiếng)'
                        });
                        return;
                      }
                      if (employerRecord?.approval_status !== 'approved') {
                        notify('Hồ sơ GPKD của bạn chưa được Quản trị viên duyệt (hoặc bị từ chối). Vui lòng kiểm tra tại mục Hồ Sơ Doanh Nghiệp!', 'error');
                        setActiveMenu('company');
                        return;
                      }
                      setJobViewMode('create');
                      setEditingJob(null);
                      setJobForm({
                        title: '',
                        category_id: '',
                        location: companyInfo.address || 'Quận 1, TP.HCM',
                        description: '',
                        salary_min: 28000,
                        salary_max: 35000,
                        is_negotiable: false,
                        work_time: 'Ca sáng: 07:00 - 11:30 (4.5 tiếng)'
                      });
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Tạo Tin Tuyển Dụng</span>
                  </button>
                  )}
                </div>

                <div className="rounded-3xl bg-white border border-slate-200/80 shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-white">
                        <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-bold text-xs">
                          <tr>
                            <th className="p-4">Tiêu Đề Công Việc</th>
                            <th className="p-4">Mức Lương / Giờ</th>
                            <th className="p-4">Hồ Sơ Nộp</th>
                            <th className="p-4">Bật/Tắt Tuyển Dụng</th>
                            <th className="p-4">Tiến Độ Tuyển Dụng</th>
                            <th className="p-4 text-right">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedJobs.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-500">
                                {isGuestMode ? (
                                  <div className="py-8 space-y-3">
                                    <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
                                    <p className="text-base font-bold text-slate-800">Chưa có tin tuyển dụng nào</p>
                                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                                      Bạn đang xem ở chế độ khách. Vui lòng đăng nhập hoặc đăng ký tài khoản Doanh nghiệp để phát hành tin tuyển dụng theo ca và quản lý hồ sơ ứng viên.
                                    </p>
                                    <div className="flex items-center justify-center gap-3 pt-2">
                                      <button
                                        type="button"
                                        onClick={() => onNavigateAuth && onNavigateAuth('login', 'employer')}
                                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold shadow-sm cursor-pointer"
                                      >
                                        Đăng Nhập
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onNavigateAuth && onNavigateAuth('register', 'employer')}
                                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold shadow-sm cursor-pointer"
                                      >
                                        Đăng Ký Doanh Nghiệp
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  'Chưa có tin tuyển dụng nào phù hợp.'
                                )}
                              </td>
                            </tr>
                          ) : (
                            paginatedJobs.map((job) => {
                              const approvedAppsCount = applicants.filter(a => a.job_id === job._id && (a.application_status === 'accepted' || a.application_status === 'interview')).length;
                              const hasApps = (job.applicant_count || 0) > 0;

                              return (
                                <tr 
                                  key={job._id}
                                  onClick={() => setSelectedJobDetail(job)}
                                  className="hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100"
                                >
                                  <td className="p-4">
                                    <p className="font-bold text-slate-900 hover:text-blue-600">{job.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{job.work_time}</p>
                                  </td>

                                  <td className="p-4 font-mono font-bold text-blue-600">
                                    {job.is_negotiable ? 'Thỏa thuận' : `${job.salary_min?.toLocaleString()}đ - ${job.salary_max?.toLocaleString()}đ`}
                                  </td>

                                  <td className="p-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setKanbanJobFilter(job.title || '');
                                        setActiveMenu('applicants');
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                                      title="Mở bảng xem danh sách ứng viên đã nộp vào tin này"
                                    >
                                      <Users className="w-3.5 h-3.5" />
                                      <span>Xem ứng viên ({job.applicant_count || 0})</span>
                                    </button>
                                  </td>

                                  {/* Nút gạt Toggle (is_open): Đang tuyển <-> Tạm đóng (FR 2.4.7) */}
                                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleJobStatus(job._id)}
                                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                                        job.is_open 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                          : 'bg-slate-100 text-slate-600 border-slate-200'
                                      }`}
                                    >
                                      {job.is_open ? 'Đang tuyển' : 'Tạm đóng'}
                                    </button>
                                  </td>

                                  {/* Nút chuyển vòng đời: Đã nhận người -> Hoàn thành (FR 2.4.7) */}
                                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                    {(() => {
                                      const normalizedJobSt = normalizeJobStatus(job);
                                      return (
                                        <div className="flex items-center gap-1.5">
                                          {(normalizedJobSt === 'open' || normalizedJobSt === 'closed') && (
                                            <button
                                              type="button"
                                              onClick={() => handleAdvanceJobLifecycle(job, 'filled')}
                                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                                approvedAppsCount >= 1
                                                  ? 'btn-primary-dimension text-white shadow-sm'
                                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                              }`}
                                              title={approvedAppsCount >= 1 ? 'Chuyển sang Đã nhận người' : 'Nhấp để xem điều kiện chuyển trạng thái'}
                                            >
                                              Đã nhận người
                                            </button>
                                          )}

                                          {normalizedJobSt === 'filled' && (
                                            <button
                                              type="button"
                                              onClick={() => handleAdvanceJobLifecycle(job, 'completed')}
                                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border border-emerald-500 cursor-pointer shadow-sm"
                                              title="Chuyển sang Hoàn thành công việc"
                                            >
                                              Hoàn thành
                                            </button>
                                          )}

                                          {normalizedJobSt === 'completed' && (
                                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                                              Đã Hoàn Thành
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </td>

                                  <td className="p-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedJobDetail(job)}
                                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                                        title="Xem chi tiết tin tuyển dụng"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Xem</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingJob(job);
                                          setJobForm({
                                            title: job.title,
                                            category_id: (job.category_id && job.category_id !== 'cat_1') ? job.category_id : '',
                                            location: job.location,
                                            description: job.description,
                                            salary_min: job.salary_min,
                                            salary_max: job.salary_max,
                                            is_negotiable: job.is_negotiable,
                                            work_time: job.work_time
                                          });
                                          setJobViewMode('edit');
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                                        title="Chỉnh sửa tin"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                        <span>Chỉnh sửa</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteJob(job)}
                                        className="px-3 py-1.5 rounded-xl border bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                                        title="Xóa vĩnh viễn tin tuyển dụng"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Xóa</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Phân trang 10 dòng */}
                    {totalJobPages > 1 && (
                      <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Trang {jobPage} / {totalJobPages}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={jobPage === 1}
                            onClick={() => setJobPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs disabled:opacity-40"
                          >
                            Trước
                          </button>
                          <button
                            type="button"
                            disabled={jobPage === totalJobPages}
                            onClick={() => setJobPage(p => Math.min(totalJobPages, p + 1))}
                            className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs disabled:opacity-40"
                          >
                            Sau
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

              </div>
            )}

          </div>
        )}

                {/* 4. MÀN HÌNH BẢNG KANBAN QUẢN LÝ ỨNG VIÊN (UI-NTD-CAND-01 -> 03 - 2.5.1 -> 2.5.6) */}
        {activeMenu === 'applicants' && (
          <div className="w-full max-w-full mx-auto space-y-8">
            {/* Header thanh tìm kiếm & lọc theo tin tuyển dụng */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span>Bảng Quản Lý Ứng Viên (ATS)</span>
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">Sàng lọc hồ sơ sinh viên, xem CV ứng viên trực tiếp (Tự động ẩn đơn đã hủy)</p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setCandidateViewMode('kanban')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          candidateViewMode === 'kanban' ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Bảng Kanban
                      </button>
                      <button
                        type="button"
                        onClick={() => setCandidateViewMode('table')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          candidateViewMode === 'table' ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Danh Sách (Dạng Bảng)
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    <div className="relative flex-1 w-full">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={kanbanSearch}
                        onChange={(e) => setKanbanSearch(e.target.value)}
                        placeholder="Tìm tên sinh viên, trường đại học..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div className="relative w-full sm:w-72">
                      <input
                        type="text"
                        list="emp-kanban-job-list"
                        value={kanbanJobFilter}
                        onChange={(e) => setKanbanJobFilter(e.target.value)}
                        placeholder="Lọc theo tin tuyển dụng..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white truncate"
                        title="Lọc theo tin tuyển dụng (nhập tay hoặc chọn gợi ý dropdown)"
                      />
                      <datalist id="emp-kanban-job-list">
                        {myJobs.map(j => (
                          <option key={j._id} value={j.title}>{j.title}</option>
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Thanh lọc nâng cao ứng viên (Hỗ trợ nhập tay hoặc chọn gợi ý) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                    {/* 1. FR-NTD-05.09: Lọc theo Ca làm việc đăng ký */}
                    <div className="min-w-0">
                      <select
                        value={applicantShiftFilter}
                        onChange={(e) => setApplicantShiftFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 cursor-pointer truncate"
                        title="Lọc theo ca làm việc đăng ký"
                      >
                        <option value="all">Mọi ca làm việc đăng ký</option>
                        <option value="morning">Ca sáng (07:00 – 12:00)</option>
                        <option value="afternoon">Ca chiều (13:00 – 18:00)</option>
                        <option value="evening">Ca tối (18:00 – 22:30)</option>
                        <option value="flexible">Ca linh hoạt</option>
                      </select>
                    </div>

                    {/* 2. FR-NTD-05.10: Lọc theo Trường Đại học (Hỗ trợ nhập tay hoặc gợi ý dropdown) */}
                    <div className="min-w-0">
                      <input
                        type="text"
                        list="emp-applicant-uni-list"
                        value={applicantUniFilter === 'all' ? '' : applicantUniFilter}
                        onChange={(e) => setApplicantUniFilter(e.target.value || 'all')}
                        placeholder="Mọi trường đại học / cao đẳng..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 truncate"
                        title="Lọc theo trường đại học / cao đẳng (nhập tay hoặc chọn gợi ý)"
                      />
                      <datalist id="emp-applicant-uni-list">
                        {Array.from(new Set([
                          ...validApplicants.map(a => a.application_snapshot?.university || a.university).filter(Boolean),
                          'Đại học Văn Lang',
                          'ĐH Bách Khoa TP.HCM',
                          'ĐH Kinh Tế TP.HCM (UEH)',
                          'ĐH Khoa Học Tự Nhiên',
                          'ĐH Công Nghệ Thông Tin (UIT)',
                          'Đại học FPT',
                          'ĐH Công Nghệ TP.HCM (HUTECH)',
                          'ĐH Sư Phạm Kỹ Thuật',
                          'ĐH Tôn Đức Thắng'
                        ])).map((u, i) => (
                          <option key={i} value={u} />
                        ))}
                      </datalist>
                    </div>

                    {/* 3. FR-NTD-05.11: Thời gian nộp hồ sơ */}
                    <div className="min-w-0">
                      <select
                        value={applicantTimeFilter}
                        onChange={(e) => setApplicantTimeFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 cursor-pointer truncate"
                        title="Lọc theo thời gian nộp hồ sơ"
                      >
                        <option value="all">Tất cả thời gian nộp</option>
                        <option value="today">Nộp hôm nay</option>
                        <option value="7days">7 ngày qua</option>
                        <option value="30days">30 ngày qua</option>
                        <option value="custom">Khoảng ngày tùy chọn</option>
                      </select>
                    </div>

                    {/* 4. FR-NTD-05.10: Lọc theo mức độ khớp lịch rảnh sinh viên */}
                    <div className="min-w-0">
                      <select
                        value={applicantMatchFilter}
                        onChange={(e) => setApplicantMatchFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 cursor-pointer truncate"
                        title="Lọc theo mức độ khớp lịch rảnh"
                      >
                        <option value="all">Mọi mức độ khớp lịch rảnh</option>
                        <option value="100">Khớp hoàn toàn (100%)</option>
                        <option value="75">Khớp cao (≥ 75%)</option>
                        <option value="50">Khớp cơ bản (≥ 50%)</option>
                      </select>
                    </div>

                    {applicantTimeFilter === 'custom' && (
                      <div className="col-span-full flex flex-wrap items-center justify-end gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Chọn khoảng ngày nộp hồ sơ:</span>
                        <input
                          type="date"
                          value={applicantFromDate}
                          onChange={(e) => setApplicantFromDate(e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-blue-500 shadow-xs"
                          title="Từ ngày"
                        />
                        <span>-</span>
                        <input
                          type="date"
                          value={applicantToDate}
                          onChange={(e) => setApplicantToDate(e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-blue-500 shadow-xs"
                          title="Đến ngày"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* DẠNG BẢNG DANH SÁCH ỨNG VIÊN (FR 2.5.1 / 2.5.2) */}
                {candidateViewMode === 'table' && (
                  <div className="rounded-3xl bg-white border border-slate-200/80 shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-white">
                        <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-bold text-xs">
                          <tr>
                            <th className="p-4">Ứng Viên Sinh Viên</th>
                            <th className="p-4">Vị Trí Tuyển Dụng</th>
                            <th className="p-4">Trường Đại Học</th>
                            <th className="p-4">Trạng Thái</th>
                            <th className="p-4">Ngày Nộp</th>
                            <th className="p-4 text-right">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredKanbanApplicants.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-500">
                                {isGuestMode ? (
                                  <div className="py-8 space-y-3">
                                    <Users className="w-10 h-10 text-slate-300 mx-auto" />
                                    <p className="text-base font-bold text-slate-800">Chưa có hồ sơ ứng viên nào</p>
                                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                                      Bạn đang xem ở chế độ khách. Đăng ký hoặc đăng nhập tài khoản Doanh nghiệp để tiếp nhận và quản lý hồ sơ sinh viên trực tiếp.
                                    </p>
                                    <div className="flex items-center justify-center gap-3 pt-2">
                                      <button
                                        type="button"
                                        onClick={() => onNavigateAuth && onNavigateAuth('login', 'employer')}
                                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold shadow-sm cursor-pointer"
                                      >
                                        Đăng Nhập
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onNavigateAuth && onNavigateAuth('register', 'employer')}
                                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold shadow-sm cursor-pointer"
                                      >
                                        Đăng Ký Doanh Nghiệp
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  'Chưa có hồ sơ ứng viên nào phù hợp tiêu chí tìm kiếm.'
                                )}
                              </td>
                            </tr>
                          ) : (
                            filteredKanbanApplicants.map((app) => (
                              <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                  <p className="font-bold text-slate-900 text-xs">{app.application_snapshot?.student_name || 'Ứng viên'}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{app.application_snapshot?.phone || 'Chưa cung cấp'}</p>
                                </td>
                                <td className="p-4 font-semibold text-blue-600">{app.job_title}</td>
                                <td className="p-4 text-slate-700">{app.application_snapshot?.university || 'Chưa cập nhật'}</td>
                                <td className="p-4">
                                  {(() => {
                                    const appStatusMap = {
                                      pending: { label: 'Đang chờ xét duyệt', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                                      reviewed: { label: 'Đã tiếp nhận', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                                      received: { label: 'Đã tiếp nhận', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                                      interview: { label: 'Mời phỏng vấn', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                                      accepted: { label: 'Trúng tuyển', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                                      rejected: { label: 'Chưa phù hợp', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                                      cancelled: { label: 'Sinh viên chủ động rút đơn', color: 'bg-slate-100 text-slate-700 border-slate-300' },
                                      withdrawn: { label: 'Sinh viên chủ động rút đơn', color: 'bg-slate-100 text-slate-700 border-slate-300' }
                                    };
                                    const st = appStatusMap[app.application_status] || { label: app.application_status, color: 'bg-amber-50 text-amber-700 border-amber-200' };
                                    return (
                                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${st.color}`}>
                                        {st.label}
                                      </span>
                                    );
                                  })()}
                                </td>
                                <td className="p-4 text-slate-500 font-mono text-xs">{app.applied_at || 'Mới nộp'}</td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedApplicant(app)}
                                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                      title="Xem chi tiết hồ sơ CV"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Xem CV</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStartChatWithApplicant(app)}
                                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                      title="Nhắn tin với ứng viên này"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>
                                    {app.application_status === 'accepted' ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReportModalData({
                                            type: 'applicant',
                                            target_id: app.student_user_id || app.student_id,
                                            target_title: `Ứng viên ${app.application_snapshot?.student_name || 'Ứng viên'} (${app.job_title})`,
                                            application_id: app._id
                                          });
                                        }}
                                        className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                        title="Báo cáo vi phạm (Chỉ cho phép khi Đã duyệt)"
                                      >
                                        <Flag className="w-3 h-3 text-red-600" />
                                        <span>Báo cáo</span>
                                      </button>
                                    ) : (
                                      <span 
                                        className="px-2 py-1 rounded-lg bg-slate-100 text-slate-400 text-xs font-medium border border-slate-200 cursor-not-allowed"
                                        title="Chỉ cho phép báo cáo đối với ứng viên đã có trạng thái 'Đã duyệt'"
                                      >
                                        Báo cáo (Khóa)
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteApplicant(app)}
                                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                      title="Xóa vĩnh viễn hồ sơ ứng viên này"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Xóa</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* BẢNG KANBAN 4 CỘT (Chờ duyệt, Đã duyệt, Chưa phù hợp, Sinh viên chủ động rút đơn) */}
                {candidateViewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  
                  {/* CỘT 1: ĐANG CHỜ XÉT DUYỆT (PENDING) */}
                  <div className="rounded-3xl bg-slate-50/80 border border-amber-200 p-4 space-y-3 flex flex-col shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide">Đang Chờ Xét Duyệt</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black font-mono">
                        {pendingApps.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto min-h-[300px]">
                      {pendingApps.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-500">
                          Không có hồ sơ đang chờ xét duyệt.
                        </div>
                      ) : (
                        pendingApps.map((app) => (
                          <div
                            key={app._id}
                            onClick={() => setSelectedApplicant(app)}
                            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 transition-all cursor-pointer shadow-sm space-y-2 group"
                          >
                            <div className="flex items-start justify-between">
                              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600">{app.application_snapshot?.student_name || 'Ứng viên'}</p>
                              <span className="text-xs text-slate-500 font-mono">{app.applied_at}</span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-1">{app.job_title}</p>
                            <p className="text-xs text-slate-500">{app.application_snapshot?.university || 'Chưa cập nhật'}</p>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartChatWithApplicant(app);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Nhắn tin</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteApplicant(app);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                title="Xóa hồ sơ ứng viên"
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

                  {/* CỘT 2: TRÚNG TUYỂN (ACCEPTED) */}
                  <div className="rounded-3xl bg-slate-50/80 border border-emerald-200 p-4 space-y-3 flex flex-col shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Trúng Tuyển</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black font-mono">
                        {acceptedApps.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto min-h-[300px]">
                      {acceptedApps.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-500">
                          Chưa có hồ sơ trúng tuyển.
                        </div>
                      ) : (
                        acceptedApps.map((app) => (
                          <div
                            key={app._id}
                            onClick={() => setSelectedApplicant(app)}
                            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer shadow-sm space-y-2 group relative"
                          >
                            <div className="flex items-start justify-between">
                              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">{app.application_snapshot?.student_name || 'Ứng viên'}</p>
                              <span className="text-emerald-700 font-bold text-xs">Đã Phê Duyệt</span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-1">{app.job_title}</p>
                            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                              <span>{app.application_snapshot?.phone || 'Chưa cung cấp'}</span>
                              <span>{app.application_snapshot?.university || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartChatWithApplicant(app);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Nhắn tin</span>
                              </button>
                              
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReportModalData({
                                      type: 'applicant',
                                      target_id: app.student_user_id || app.student_id,
                                      target_title: `Ứng viên ${app.application_snapshot?.student_name || 'Ứng viên'} (${app.job_title})`,
                                      application_id: app._id
                                    });
                                  }}
                                  className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Báo cáo vi phạm đối với ứng viên đã duyệt"
                                >
                                  <Flag className="w-3 h-3 text-red-600" />
                                  <span>Báo Cáo</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteApplicant(app);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                  title="Xóa hồ sơ ứng viên"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Xóa</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* CỘT 3: CHƯA PHÙ HỢP (REJECTED) */}
                  <div className="rounded-3xl bg-slate-50/80 border border-slate-200 p-4 space-y-3 flex flex-col shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Chưa Phù Hợp</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-black font-mono">
                        {rejectedApps.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto min-h-[300px]">
                      {rejectedApps.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-500">
                          Không có hồ sơ chưa phù hợp.
                        </div>
                      ) : (
                        rejectedApps.map((app) => (
                          <div
                            key={app._id}
                            onClick={() => setSelectedApplicant(app)}
                            className="p-4 rounded-2xl bg-white border border-slate-200 transition-all cursor-pointer opacity-80 hover:opacity-100 space-y-2"
                          >
                            <p className="text-xs font-bold text-slate-900">{app.application_snapshot?.student_name || 'Ứng viên'}</p>
                            <p className="text-xs text-slate-500">{app.job_title}</p>
                            {app.reject_reason && (
                              <p className="text-xs text-red-600 italic">Lý do: {app.reject_reason}</p>
                            )}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartChatWithApplicant(app);
                                }}
                                className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Xem lịch sử chat (Chỉ đọc)</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteApplicant(app);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                title="Xóa hồ sơ ứng viên"
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

                  {/* CỘT 4: SINH VIÊN CHỦ ĐỘNG RÚT ĐƠN (WITHDRAWN) */}
                  <div className="rounded-3xl bg-slate-50/80 border border-slate-300 p-4 space-y-3 flex flex-col shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide truncate">Sinh Viên Rút Đơn</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-black font-mono">
                        {withdrawnApps.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto min-h-[300px]">
                      {withdrawnApps.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-500">
                          Không có hồ sơ nào bị rút.
                        </div>
                      ) : (
                        withdrawnApps.map((app) => (
                          <div
                            key={app._id}
                            onClick={() => setSelectedApplicant(app)}
                            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 transition-all cursor-pointer opacity-85 hover:opacity-100 space-y-2 shadow-xs"
                          >
                            <div className="flex items-start justify-between">
                              <p className="text-xs font-bold text-slate-900">{app.application_snapshot?.student_name || app.student_name || 'Ứng viên'}</p>
                              <span className="text-[10px] text-slate-400 font-mono">{app.applied_at || ''}</span>
                            </div>
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                              Sinh viên chủ động rút đơn
                            </span>
                            <p className="text-xs text-slate-600 line-clamp-1">{app.job_title}</p>
                            <p className="text-xs text-slate-500">{app.application_snapshot?.university || app.university || 'Chưa cập nhật'}</p>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <span className="text-[10px] text-slate-500 italic">Đã hủy ứng tuyển</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteApplicant(app);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                title="Xóa bản ghi ứng viên này"
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

                </div>
                )}

          </div>
        )}

        {/* 6. MÀN HÌNH LỊCH PHỎNG VẤN TRỰC TUYẾN */}
        {activeMenu === 'interviews' && (
          <div className="w-full max-w-full mx-auto space-y-8">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Video className="w-5 h-5 text-blue-600" />
                      <span>Lịch Phỏng Vấn Trực Tuyến (WebRTC Realtime)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lên lịch hẹn và thực hiện cuộc gọi Video / Thoại trực tuyến theo thời gian thực với ứng viên Part-time
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setInterviewFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        interviewFilter === 'all' ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tất Cả ({validApplicants.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterviewFilter('interview')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        interviewFilter === 'interview' ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Mời Phỏng Vấn ({validApplicants.filter(a => a.application_status === 'interview').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterviewFilter('accepted')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        interviewFilter === 'accepted' ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Đã Trúng Tuyển ({validApplicants.filter(a => a.application_status === 'accepted').length})
                    </button>
                  </div>
                </div>

                {/* Thanh tìm kiếm & lọc nhanh */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={interviewSearch}
                    onChange={(e) => setInterviewSearch(e.target.value)}
                    placeholder="Tìm kiếm ứng viên theo tên, trường đại học, số điện thoại, vị trí tuyển dụng..."
                    className="w-full bg-white border border-slate-300 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>

                {/* Danh sách thẻ ứng viên phỏng vấn */}
                {validApplicants.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 mx-auto">
                      <Video className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base sm:text-lg font-bold text-slate-900">
                        {isGuestMode ? 'Lịch Phỏng Vấn Trực Tuyến (Xem Trước)' : 'Chưa Có Lịch Hẹn Phỏng Vấn Nào'}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                        {isGuestMode 
                          ? 'Bạn đang xem ở chế độ khách. Đăng ký hoặc đăng nhập tài khoản Doanh nghiệp để lên lịch hẹn và gọi video phỏng vấn trực tiếp với sinh viên.'
                          : 'Các ứng viên được mời phỏng vấn hoặc đang chờ phỏng vấn sẽ hiển thị tại đây.'}
                      </p>
                    </div>
                    {isGuestMode && (
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => onNavigateAuth && onNavigateAuth('login', 'employer')}
                          className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold shadow-sm cursor-pointer"
                        >
                          Đăng Nhập
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateAuth && onNavigateAuth('register', 'employer')}
                          className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold shadow-sm cursor-pointer"
                        >
                          Đăng Ký Doanh Nghiệp
                        </button>
                      </div>
                    )}
                  </div>
                ) : (() => {
                  const filteredInterviewApps = validApplicants
                    .filter(app => {
                      if (interviewFilter === 'interview') return app.application_status === 'interview';
                      if (interviewFilter === 'accepted') return app.application_status === 'accepted';
                      if (interviewFilter === 'rejected') return app.application_status === 'rejected';
                      return true;
                    })
                    .filter(app => {
                      const interviewObj = {
                        ...app,
                        student_name: app.application_snapshot?.student_name || app.student_name || '',
                        university: app.application_snapshot?.university || app.university || '',
                        phone: app.application_snapshot?.phone || app.phone || ''
                      };
                      return matchKeywordFlexible(interviewObj, interviewSearch, ['student_name', 'university', 'phone', 'job_title']);
                    });

                  if (filteredInterviewApps.length === 0) {
                    return (
                      <div className="p-10 text-center rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2">
                        <Video className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-sm font-bold text-slate-900">Không tìm thấy ứng viên phù hợp với bộ lọc</p>
                        <p className="text-xs text-slate-500">Thử xóa từ khóa tìm kiếm hoặc chọn "Tất cả ứng viên" để xem đầy đủ danh sách.</p>
                      </div>
                    );
                  }

                  return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredInterviewApps.map((app) => {
                      const studentName = app.application_snapshot?.student_name || 'Ứng viên';
                      return (
                        <div
                          key={app._id}
                          className="p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-blue-400 shadow-md transition-all space-y-4 flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white font-black text-lg flex items-center justify-center shadow-md">
                                  {studentName.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <span>{studentName}</span>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Trực tuyến" />
                                  </h4>
                                  <p className="text-xs text-blue-600 font-semibold">{app.job_title}</p>
                                  <p className="text-xs text-slate-500">{app.application_snapshot?.university || 'Trường ĐH Văn Lang'}</p>
                                </div>
                              </div>

                              <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase shrink-0 ${
                                app.application_status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                app.application_status === 'interview' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                                app.application_status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                                'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {app.application_status === 'accepted' ? 'Đã trúng tuyển' :
                                 app.application_status === 'interview' ? 'Mời phỏng vấn' :
                                 app.application_status === 'rejected' ? 'Đã từ chối' : 'Chờ xét duyệt'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                              <div>
                                <span className="text-slate-500 block text-xs">Số điện thoại:</span>
                                <span className="text-slate-900 font-mono font-bold">{app.application_snapshot?.phone || 'Chưa cung cấp'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-xs">Thời gian nộp:</span>
                                <span className="text-slate-900 font-mono">{app.applied_at || 'Mới nộp'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Các nút hành động: Gọi Video WebRTC, Gọi Thoại, Chat, Xem CV, Đổi trạng thái */}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedContact({ id: app.student_id, name: studentName });
                                  handleStartCall('video');
                                }}
                                className="w-full py-2.5 px-3 rounded-xl btn-primary-dimension text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                                title="Bắt đầu gọi Video trực tuyến với ứng viên"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Gọi Video Call</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedContact({ id: app.student_id, name: studentName });
                                  handleStartCall('audio');
                                }}
                                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer transition-all"
                                title="Bắt đầu cuộc gọi thoại trực tuyến"
                              >
                                <Phone className="w-3.5 h-3.5 text-blue-600" />
                                <span>Gọi Thoại</span>
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                              <button
                                type="button"
                                onClick={() => setSelectedApplicant(app)}
                                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-blue-700 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Xem CV</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartChatWithApplicant(app)}
                                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3 h-3 text-blue-600" />
                                <span>Nhắn tin</span>
                              </button>

                              {app.application_status !== 'accepted' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateApplicantStatus(app._id, 'accepted', 'Vượt qua phỏng vấn trực tuyến')}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-pointer"
                                >
                                  Duyệt Vào Làm
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                  );
                })()}
          </div>
        )}

        {/* 7. MÀN HÌNH XÁC NHẬN HOÀN THÀNH CA LÀM (UI-NTD-COMP-01 - 2.4.7 / 2.7) */}
        {activeMenu === 'job_completion' && (
          <div className="w-full max-w-full mx-auto space-y-8">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                      <span>Xác Nhận Hoàn Thành Ca Làm & Bàn Giao</span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Xác nhận kết thúc công việc/ca làm việc đối với các tin đã nhận đủ người để tự động mở quyền Đánh giá năng lực sinh viên 2 chiều
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenu('reviews');
                        setReviewTab('pending');
                      }}
                      className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all whitespace-nowrap"
                    >
                      <Star className="w-4 h-4 fill-slate-950" />
                      <span>Chuyển Sang Bảng Đánh Giá</span>
                    </button>
                  </div>
                </div>

                {/* Banner hướng dẫn luồng hoàn thành ca làm */}
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-blue-950">Quy Trình Hoàn Thành Ca Làm Chuẩn:</p>
                    <p className="text-xs text-blue-800 mt-0.5">
                      1. Tin tuyển dụng đạt đủ nhân sự và chuyển trạng thái "Đã nhận người" (Filled) → 
                      2. Sinh viên đi làm và hoàn thành các ca làm việc được giao → 
                      3. Quản lý doanh nghiệp bấm nút <strong>"Xác nhận hoàn thành ca làm"</strong> bên dưới → 
                      4. Tin chuyển sang trạng thái "Hoàn thành" (Completed) và tự động kích hoạt quyền Đánh giá năng lực 2 chiều giữa Doanh nghiệp và Sinh viên.
                    </p>
                  </div>
                </div>

                {/* Bộ lọc Xác nhận hoàn thành ca (FR-NTD-10.03: Chi nhánh, Tin tuyển dụng & Trạng thái) */}
                <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-md grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Bộ lọc ca làm:</span>
                  </span>

                  <div className="min-w-0">
                    <input
                      type="text"
                      list="emp-completion-branch-list"
                      value={completionBranchFilter === 'all' ? '' : completionBranchFilter}
                      onChange={(e) => setCompletionBranchFilter(e.target.value || 'all')}
                      placeholder="Tất cả chi nhánh..."
                      className="w-full min-w-0 truncate bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-600"
                      title="Lọc theo chi nhánh / Cơ sở cửa hàng (nhập tay hoặc chọn gợi ý)"
                    />
                    <datalist id="emp-completion-branch-list">
                      {Array.from(new Set([
                        ...baseFilledJobs.flatMap(j => [j.branch_name, j.location]).filter(Boolean),
                        'Quận 1, TP.HCM',
                        'Quận 3, TP.HCM',
                        'Bình Thạnh, TP.HCM',
                        'TP. Thủ Đức, TP.HCM'
                      ])).map((b, i) => (
                        <option key={i} value={b} />
                      ))}
                    </datalist>
                  </div>

                  <div className="min-w-0">
                    <input
                      type="text"
                      list="emp-completion-job-list"
                      value={completionJobFilter === 'all' ? '' : completionJobFilter}
                      onChange={(e) => setCompletionJobFilter(e.target.value || 'all')}
                      placeholder="Tất cả tin tuyển dụng..."
                      className="w-full min-w-0 truncate bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-600"
                      title="Lọc theo tin tuyển dụng (nhập tay hoặc chọn gợi ý)"
                    />
                    <datalist id="emp-completion-job-list">
                      {baseFilledJobs.map(j => (
                        <option key={j._id} value={j.title} />
                      ))}
                    </datalist>
                  </div>

                  <select
                    value={completionStatusFilter}
                    onChange={(e) => setCompletionStatusFilter(e.target.value)}
                    className="w-full min-w-0 truncate bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                    title="Lọc theo Trạng thái ca làm (FR-NTD-10.03)"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="open">Đang mở tuyển</option>
                    <option value="waiting">Đã nhận người – chờ xác nhận</option>
                    <option value="completed">Đã hoàn thành ca làm</option>
                    <option value="closed">Tạm đóng</option>
                  </select>
                </div>

                {/* Danh sách các tin tuyển dụng cần xác nhận hoàn thành hoặc đã hoàn thành */}
                <div className="space-y-4">
                  {filledJobsForCompletion.length === 0 ? (
                    <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 mx-auto">
                        <FileCheck className="w-7 h-7 text-emerald-600" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base sm:text-lg font-bold text-slate-900">
                          {isGuestMode ? 'Xác Nhận Hoàn Thành Ca Làm (Xem Trước)' : 'Chưa Có Ca Làm Việc Nào Cần Xác Nhận'}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                          {isGuestMode 
                            ? 'Bạn đang xem ở chế độ khách. Đăng ký hoặc đăng nhập tài khoản Doanh nghiệp để nghiệm thu ca làm và xác nhận giờ công thực tế cho sinh viên.'
                            : 'Hiện chưa có tin tuyển dụng nào ở trạng thái "Đã nhận người" hoặc có sinh viên trúng tuyển ca làm.'}
                        </p>
                      </div>
                      {isGuestMode && (
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => onNavigateAuth && onNavigateAuth('login', 'employer')}
                            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold shadow-sm cursor-pointer"
                          >
                            Đăng Nhập
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigateAuth && onNavigateAuth('register', 'employer')}
                            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold shadow-sm cursor-pointer"
                          >
                            Đăng Ký Doanh Nghiệp
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    filledJobsForCompletion
                      .map((job) => {
                        const isFilled = job.status === 'filled' || job.job_status === 'filled';
                        const isCompleted = job.status === 'completed' || job.job_status === 'completed';
                        const jobApps = applicants.filter(a => a.job_id === job._id && (a.application_status === 'accepted' || a.application_status === 'interview'));

                        return (
                          <div
                            key={job._id}
                            className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-base font-black text-slate-900">{job.title}</h4>
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                                    isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    isFilled ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                    'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {isCompleted ? 'Đã Hoàn Thành Ca Làm' : isFilled ? 'Đã Nhận Người (Đang Chạy Ca)' : 'Đang Mở Tuyển'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                                  <span><Clock className="w-3.5 h-3.5 inline mr-1 text-blue-600" />{job.work_time}</span>
                                  <span><MapPin className="w-3.5 h-3.5 inline mr-1 text-blue-600" />{job.location}</span>
                                  <span className="font-mono font-bold text-blue-600">{job.salary_min?.toLocaleString()}đ - {job.salary_max?.toLocaleString()}đ/giờ</span>
                                </p>
                              </div>

                              {/* Nút thao tác hoàn thành ca làm */}
                              <div>
                                {isFilled ? (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceJobLifecycle(job, 'completed')}
                                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
                                  >
                                    <CheckSquare className="w-4 h-4" />
                                    <span>Xác Nhận Hoàn Thành Ca Làm</span>
                                  </button>
                                ) : isCompleted ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenu('reviews');
                                      setReviewTab('pending');
                                    }}
                                    className="px-4 py-2 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                                  >
                                    <Star className="w-3.5 h-3.5 fill-slate-950" />
                                    <span>Đánh Giá Năng Lực Sinh Viên</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceJobLifecycle(job, 'filled')}
                                    className="px-4 py-2 rounded-2xl btn-primary-dimension text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Chốt Nhận Người (Khóa Tin)</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Danh sách sinh viên nhận ca làm việc */}
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                Danh Sách Sinh Viên Tham Gia Ca Làm ({jobApps.length} sinh viên):
                              </span>
                              {jobApps.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">Chưa có ứng viên nào được duyệt trúng tuyển cho tin này.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {jobApps.map((a) => (
                                    <div key={a._id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                                      <div>
                                        <p className="font-bold text-slate-900 text-xs">{a.application_snapshot?.student_name || 'Ứng viên'}</p>
                                        <p className="text-xs text-slate-500 font-mono mt-0.5">{a.application_snapshot?.phone || 'Chưa cung cấp'}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleStartChatWithApplicant(a)}
                                        className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 cursor-pointer shadow-sm"
                                        title="Nhắn tin với sinh viên này"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
          </div>
        )}

                {/* 8. MÀN HÌNH ĐÁNH GIÁ SINH VIÊN (UI-NTD-REV-01 -> 03 - 2.6.1 -> 2.6.4) */}
        {activeMenu === 'reviews' && (
          <div className="w-full max-w-full mx-auto space-y-8">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span>Đánh Giá Hiệu Suất Sinh Viên</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Đánh giá và cấp điểm uy tín cho sinh viên sau khi hoàn thành công việc</p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setReviewTab('pending')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        reviewTab === 'pending' ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Ca làm chờ gửi đánh giá ({pendingEmployerReviews.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewTab('history')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        reviewTab === 'history' ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Ca làm đã hoàn tất đánh giá ({reviews.length})
                    </button>
                  </div>
                </div>

                {/* TAB CHỜ ĐÁNH GIÁ */}
                {reviewTab === 'pending' && (
                  <div className="space-y-4">
                    {pendingEmployerReviews.length === 0 ? (
                      <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">
                        {isGuestMode ? (
                          <div className="space-y-3 py-4">
                            <Star className="w-10 h-10 text-slate-300 mx-auto" />
                            <p className="text-base font-bold text-slate-800">Chưa có sinh viên nào cần đánh giá</p>
                            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                              Bạn đang xem ở chế độ khách. Đăng ký hoặc đăng nhập tài khoản Doanh nghiệp để chấm điểm uy tín và đánh giá năng lực 2 chiều sau ca làm.
                            </p>
                            <div className="flex items-center justify-center gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => onNavigateAuth && onNavigateAuth('login', 'employer')}
                                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold shadow-sm cursor-pointer"
                              >
                                Đăng Nhập
                              </button>
                              <button
                                type="button"
                                onClick={() => onNavigateAuth && onNavigateAuth('register', 'employer')}
                                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold shadow-sm cursor-pointer"
                              >
                                Đăng Ký Doanh Nghiệp
                              </button>
                            </div>
                          </div>
                        ) : (
                          'Chưa có sinh viên nào trong danh sách chờ đánh giá.'
                        )}
                      </div>
                    ) : (
                      pendingEmployerReviews.map((app) => (
                        <div
                          key={app._id}
                          className="p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                        >
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{app.application_snapshot?.student_name || 'Ứng viên'}</h4>
                            <p className="text-xs font-semibold text-blue-600 mt-0.5">Vị trí: {app.job_title}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">SĐT: {app.application_snapshot?.phone || 'Chưa cung cấp'}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setReviewModalApp(app);
                              setReviewScore(5);
                              setReviewNote('');
                            }}
                            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
                          >
                            <Star className="w-4 h-4 fill-slate-950" />
                            <span>Chấm Điểm & Đánh Giá</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB LỊCH SỬ ĐÁNH GIÁ (2.6.3, 2.6.4) */}
                {reviewTab === 'history' && (
                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">
                        Chưa có đánh giá nào được gửi đi.
                      </div>
                    ) : (
                      reviews.map((rev) => (
                        <div
                          key={rev._id}
                          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center text-amber-500">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-4 h-4 ${s <= rev.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs font-bold text-slate-900">({rev.rating}/5 sao)</span>
                            </div>
                            <span className="text-xs text-slate-500 font-mono">{rev.created_at}</span>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed">
                            "{rev.comment}"
                          </p>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            {/* Nút Xem Chi Tiết Đánh Giá (FR 2.6.3) */}
                            <button
                              type="button"
                              onClick={() => setSelectedReviewDetail(rev)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem chi tiết</span>
                            </button>

                            {rev.is_hidden ? (
                              <span className="text-red-700 font-bold text-xs bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 inline-flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>Đánh giá bị Quản trị viên ẩn do vi phạm (Không thể chỉnh sửa)</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingReviewId(rev._id);
                                  setReviewScore(rev.rating || 5);
                                  setReviewNote(rev.comment || '');
                                  setReviewModalApp({
                                    _id: rev.application_id,
                                    job_title: 'Đánh giá đã gửi',
                                    application_snapshot: { student_name: rev.student_name || 'Ứng viên' }
                                  });
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Chỉnh sửa</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteEmployerReview(rev)}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
          </div>
        )}

        {/* 6. MÀN HÌNH CHAT & GỌI VIDEO PHỎNG VẤN (UI-NTD-CHAT-02, 03, UI-NTD-CALL-01 - 2.7 & 2.9) */}
        {activeMenu === 'chat' && (
          <div className="w-full max-w-full h-[calc(100vh-112px)] sm:h-[calc(100vh-128px)] lg:h-[calc(100vh-144px)] min-h-[540px] flex flex-col lg:flex-row rounded-3xl bg-white border border-slate-200/80 shadow-md overflow-hidden text-slate-900">
            {/* Cột trái: Danh sách hội thoại ứng viên + Tìm kiếm + Lọc tin tuyển dụng & Chưa phản hồi */}
            {!isGuestMode && (
              <aside className={`${selectedContact ? 'hidden lg:flex' : 'flex flex-1 lg:flex-none'} w-full lg:w-[320px] xl:w-[360px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/70 flex-col min-h-0 overflow-hidden`}>
                <div className="px-4 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />
                    <h3 className="text-sm font-black text-slate-900 truncate">Hội Thoại Ứng Viên</h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                      {contacts.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewChatModalOpen(true)}
                      className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                      title="Tạo tin nhắn mới / Mời phỏng vấn"
                    >
                      <MessageSquarePlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <EmployerChatContactsPanel
                  contacts={contacts}
                  selectedContact={selectedContact}
                  chatSearchQuery={chatSearchQuery}
                  onSearchChange={setChatSearchQuery}
                  chatJobFilter={chatJobFilter}
                  onJobFilterChange={setChatJobFilter}
                  myJobs={myJobs}
                  chatUnrepliedOnly={chatUnrepliedOnly}
                  onToggleUnreplied={() => setChatUnrepliedOnly(!chatUnrepliedOnly)}
                  onSelectContact={(contact) => setSelectedContact(contact)}
                  onCreateNewChat={() => setNewChatModalOpen(true)}
                />
              </aside>
            )}

            {/* Khung phải: Hội thoại chi tiết, WebRTC Video/Audio & Nhập tin nhắn */}
            <div className={`${!isGuestMode && !selectedContact ? 'hidden lg:flex' : 'flex'} flex-1 min-w-0 min-h-0 flex-col bg-white overflow-hidden`}>
            {!selectedContact || isGuestMode ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-5 shadow-sm">
                  <MessageSquare className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Chưa Chọn Cuộc Trò Chuyện Nào
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                  Khi có sinh viên nộp hồ sơ ứng tuyển, danh bạ và tin nhắn sẽ tự động xuất hiện tại đây. Bạn có thể xem danh sách ứng viên để bắt đầu nhắn tin.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {isGuestMode ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onNavigateAuth && onNavigateAuth('login', 'employer')}
                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold transition-all border border-slate-300 shadow-sm cursor-pointer"
                      >
                        Đăng Nhập
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateAuth && onNavigateAuth('register', 'employer')}
                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold transition-all border border-slate-300 shadow-sm cursor-pointer"
                      >
                        Đăng Ký Doanh Nghiệp
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveMenu('applicants')}
                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all border border-slate-300 flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Users className="w-4 h-4" />
                        <span>Xem Danh Sách Ứng Viên ({validApplicants.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenu('jobs');
                          setJobViewMode('create');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4 text-slate-900" />
                        <span>Đăng Tin Tuyển Dụng Mới</span>
                      </button>
                    </>
                  )}
                </div>
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
                {/* Header chat: Tên sinh viên, Trạng thái, Nút Tạo tin nhắn mới, Camera WebRTC, Cờ báo cáo */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                        {selectedContact?.name?.charAt(0) || 'U'}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        selectedContact?.online ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}></span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{selectedContact?.name || 'Ứng viên'}</h4>
                        {isChatReadOnly && (
                          <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>CHỈ ĐỌC</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-600 font-medium">
                        {selectedContact?.online ? '● Đang trực tuyến' : '○ Ngoại tuyến'} • {selectedContact?.subtitle || 'Ứng viên sinh viên'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* NÚT TẠO TIN NHẮN MỚI (FR 2.7.1) */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewChatModalOpen(true);
                        setNewChatSelectedAppId(validApplicants[0]?._id || '');
                        setNewChatMessageText('');
                      }}
                      className="px-3 py-1.5 rounded-xl btn-primary-dimension text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      title="Khởi tạo cuộc hội thoại mới với ứng viên"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Tạo Tin Nhắn Mới</span>
                    </button>

                    {/* 2 Nút Gọi Trực Tuyến: Gọi Thoại & Gọi Video (FR 2.9.4) */}
                    <button
                      type="button"
                      disabled={isChatReadOnly}
                      onClick={() => handleStartCall('audio')}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 border border-slate-300 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      title={isChatReadOnly ? 'Chỉ đọc: Không thể gọi khi đơn ứng tuyển đã bị từ chối/hủy' : 'Gọi thoại trực tiếp với Ứng viên'}
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">Gọi thoại</span>
                    </button>

                    <button
                      type="button"
                      disabled={isChatReadOnly}
                      onClick={() => handleStartCall('video')}
                      className="px-3.5 py-1.5 rounded-xl btn-primary-dimension disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      title={isChatReadOnly ? 'Chỉ đọc: Không thể gọi khi đơn ứng tuyển đã bị từ chối/hủy' : 'Bắt đầu gọi phỏng vấn trực tuyến qua WebRTC'}
                    >
                      <Video className="w-4 h-4" />
                      <span className="hidden sm:inline">Gọi video</span>
                    </button>

                    {/* Icon Cờ báo cáo hội thoại vi phạm (FR 2.7.5) */}
                    <button
                      type="button"
                      onClick={() => {
                        const flagged = chatMessages.filter(m => m.is_flagged).flatMap(m => m.flagged_words || []);
                        const uniqueFlagged = [...new Set(flagged)];
                        const reason = uniqueFlagged.length > 0
                          ? `Phát hiện từ ngữ vi phạm quy định trong tin nhắn: [${uniqueFlagged.join(', ')}]. Chi tiết: `
                          : '';
                        setReportReason(reason);
                        setReportModalData({
                          type: 'chat',
                          target_id: selectedContact?.id || 'user_student_long',
                          target_title: `Hội thoại với ${selectedContact?.name || 'Ứng viên'}`
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-red-600 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      title="Báo cáo ứng viên vi phạm tiêu chuẩn hội thoại"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-xs font-bold">Báo cáo</span>
                    </button>
                  </div>
                </div>

                {/* GIAO DIỆN PHỎNG VẤN TRỰC TUYẾN 2 CHIỀU (UI-NTD-CALL-01) */}
                {isVideoCalling ? (
                  <div className="flex-1 min-h-0 bg-black relative flex flex-col items-center justify-center p-3 sm:p-4">
                    <div className="w-full flex-1 min-h-0 max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden shadow-2xl">
                      {/* Badge thông tin & thời lượng cuộc gọi nổi ở góc trên */}
                      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-white text-xs shadow-lg font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="font-mono font-bold text-emerald-300">
                          {callStatus === 'calling' ? 'Đang đổ chuông...' : `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}`}
                        </span>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-200 truncate max-w-[200px]">
                          {callType === 'video' ? 'Phỏng vấn Video' : 'Cuộc gọi Thoại'}: {selectedContact?.name || 'Ứng viên'}
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
                            <h3 className="text-base font-black text-white">Đang đổ chuông tới Ứng viên ({selectedContact?.name || 'Ứng viên'})...</h3>
                            <p className="text-xs text-slate-400 mt-1">Vui lòng chờ ứng viên kết nối vào phòng phỏng vấn</p>
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
                              <div className="w-24 h-24 rounded-full bg-blue-600/30 border border-blue-500/50 text-sky-300 font-black text-3xl flex items-center justify-center mx-auto animate-pulse">
                                {selectedContact?.name ? selectedContact.name.split(' ').map(n=>n[0]).slice(-2).join('').toUpperCase() : 'VL'}
                              </div>
                              <p className="text-sm font-bold text-white">
                                {callType === 'video' ? `Đang phỏng vấn Video trực tuyến: ${selectedContact?.name || 'Ứng viên'}` : `Đang thực hiện cuộc gọi Thoại phỏng vấn: ${selectedContact?.name || 'Ứng viên'}`}
                              </p>
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>Thời lượng: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Local Camera stream nếu là Video Call */}
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
                                {`Bạn (${companyInfo?.representative_name || 'Doanh nghiệp'})`}
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
                          title="Kết thúc phỏng vấn"
                        >
                          <Phone className="w-5 h-5 rotate-[135deg]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* KHUNG TIN NHẮN TRÒ CHUYỆN (FR 2.7.3 & 2.9.2 - 2.9.3) */
                  <>
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                          <MessageSquare className="w-10 h-10 mb-2 text-blue-300" />
                          <p className="text-sm font-bold text-slate-700">Chưa có tin nhắn trong cuộc trò chuyện này</p>
                          <p className="text-xs text-slate-500 mt-1 max-w-md">
                            Hãy gửi lời chào hoặc bấm chèn liên kết phỏng vấn để trao đổi trực tiếp với ứng viên {selectedContact?.name}.
                          </p>
                        </div>
                      ) : chatMessages.map((m) => {
                        if (m.type === 'call_record') {
                          const isOutgoing = m.caller_role === 'employer' || m.caller_id === currentUser?._id;
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
                              <div className={`px-4 py-2 rounded-2xl text-xs font-bold border flex items-center gap-2 shadow-sm ${
                                isOutgoing 
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

                        const isMe = m.sender_role === 'employer' || m.sender_email === currentUser?.email;
                        return (
                          <div
                            key={m._id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-2 mb-1 px-1">
                              <span className="text-xs font-bold text-slate-500">
                                {isMe ? `Bạn (${companyInfo?.representative_name || 'Doanh nghiệp'})` : `${selectedContact?.name || 'Ứng viên'} (Sinh viên)`}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">{m.created_at}</span>
                            </div>

                            <div
                              className={`max-w-[85%] sm:max-w-[75%] xl:max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                isMe 
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
                                    <div className={`flex items-center justify-between gap-2 pt-1.5 border-t text-xs ${isMe ? 'border-white/25 text-white/90' : 'border-slate-200 text-slate-600'}`}>
                                      <span className="italic flex items-center gap-1">
                                        <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isMe ? 'text-white' : 'text-amber-600'}`} />
                                        Từ ngữ nhạy cảm đã được che (***)
                                      </span>
                                      {!isMe && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReportReason(`Báo cáo tin nhắn vi phạm tiêu chuẩn cộng đồng: "${m.original_content || m.content}"`);
                                            setReportModalData({
                                              type: 'chat',
                                              target_id: m.sender_id || 'stu_user_student',
                                              target_title: `Báo cáo tin nhắn từ ${m.sender_name || 'Ứng viên'}`
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
                                      className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs font-bold cursor-pointer transition-colors"
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
                      <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-xs text-blue-700">
                          <Paperclip className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="font-bold text-slate-900 truncate max-w-xs">{chatAttachment.name}</span>
                          <span className="text-xs text-slate-500 font-mono">({chatAttachment.sizeStr})</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold uppercase">Sẵn sàng gửi</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setChatAttachment(null)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Hủy đính kèm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Chế độ Chỉ Đọc (Read-Only) hoặc Form gửi tin nhắn */}
                    {isChatReadOnly ? (
                      <div className="p-4 bg-rose-50 border-t border-rose-200 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-rose-800">Cuộc trò chuyện đang ở chế độ CHỈ ĐỌC</p>
                          <p className="text-xs text-slate-700 mt-0.5">
                            Đơn ứng tuyển của sinh viên đã bị "Từ chối" hoặc "Đã hủy" (hoặc tài khoản đang bị khóa). Hệ thống không cho phép gửi thêm tin nhắn hay gọi điện.
                          </p>
                        </div>
                      </div>
                    ) : (
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

                        {/* Nút chèn nhanh link phỏng vấn trực tuyến (FR 2.7.1) */}
                        <button
                          type="button"
                          onClick={handleInsertInterviewLink}
                          className="p-3 rounded-xl bg-white hover:bg-slate-100 text-blue-600 border border-slate-300 transition-colors cursor-pointer shrink-0 shadow-sm"
                          title="Gửi liên kết phỏng vấn trực tuyến (Meet / WebRTC)"
                        >
                          <Link className="w-[18px] h-[18px]" />
                        </button>

                        <input
                          type="text"
                          value={newMsgText}
                          onChange={(e) => setNewMsgText(e.target.value)}
                          placeholder="Nhập phản hồi tới ứng viên hoặc gửi link phỏng vấn... (Hệ thống tự lọc từ cấm ***)"
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
                    )}
                  </>
                )}
              </>
            )}
            </div>
          </div>
        )}
      </main>

      {/* ======================= MODAL XEM HỒ SƠ ỨNG VIÊN & CV ======================= */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-7xl w-full h-[90vh] flex flex-col text-slate-800 shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Hồ Sơ Ứng Viên: {selectedApplicant.application_snapshot?.student_name || selectedApplicant.student_name || 'Ứng viên'}
                </h3>
                <p className="text-xs text-blue-700 font-bold mt-0.5">Vị trí: {selectedApplicant.job_title}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedApplicant(null)} 
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thân Modal: Chi Tiết Ứng Viên & Tệp CV Đính Kèm */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden">
              
              {/* NỬA TRÁI: HỒ SƠ CV ỨNG VIÊN TRỰC DIỆN */}
              <div className="p-6 bg-slate-50 flex flex-col space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hồ Sơ Năng Lực Ứng Viên</h4>
                      <p className="text-xs text-slate-600 font-mono truncate max-w-[220px]">
                        {selectedApplicant.application_snapshot?.cv_name || 'CV_UngVien.pdf'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownloadApplicantCv(selectedApplicant)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer transition-all whitespace-nowrap"
                      title="Tải tệp PDF CV về máy tính"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải Về Máy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplicantCvViewer(selectedApplicant)}
                      className="p-2 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-slate-300 cursor-pointer"
                      title="Xem toàn màn hình"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Khung nội dung chi tiết bản trích xuất CV */}
                <div className="flex-1 rounded-2xl bg-white border border-slate-200 p-5 space-y-4 text-xs text-slate-800 shadow-xs">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white font-black text-lg flex items-center justify-center shadow-sm shrink-0">
                      {(selectedApplicant.application_snapshot?.student_name || selectedApplicant.student_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{selectedApplicant.application_snapshot?.student_name || selectedApplicant.student_name || 'Ứng viên'}</h3>
                      <p className="text-blue-700 text-xs font-bold">{selectedApplicant.application_snapshot?.university || 'Trường Đại học/Cao đẳng'}</p>
                      {selectedApplicant.application_snapshot?.residence_address && (
                        <p className="text-xs text-slate-600">{selectedApplicant.application_snapshot.residence_address}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Thông Tin Liên Hệ</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-600 block text-xs">Số điện thoại:</span>
                        <span className="font-mono font-bold text-slate-900">{selectedApplicant.application_snapshot?.phone || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-600 block text-xs">Email sinh viên:</span>
                        <span className="font-mono font-bold text-slate-900 truncate block">{selectedApplicant.student_email || selectedApplicant.application_snapshot?.email || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mục Tiêu & Điểm Mạnh</span>
                    <p className="text-xs text-slate-800 leading-relaxed p-3 rounded-xl bg-slate-50 border border-slate-200">
                      Sinh viên năng nổ, có tinh thần trách nhiệm cao, sẵn sàng làm việc xoay ca linh hoạt và cam kết gắn bó lâu dài tại môi trường chuyên nghiệp.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kỹ Năng Thực Tế</span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-xs">Giao tiếp & Phục vụ</span>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-xs">Thao tác máy POS</span>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-xs">Đúng giờ & Kỷ luật</span>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-xs">Tiếng Anh giao tiếp cơ bản</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* NỬA PHẢI: KHUNG XEM TÀI LIỆU CV & THÔNG TIN ỨNG TUYỂN */}
              <div className="p-6 bg-white flex flex-col space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Tài Liệu CV & Cam Kết Ứng Tuyển</span>
                  </h4>
                  <span className="text-xs text-slate-600 font-mono">Định dạng .PDF hợp lệ (≤ 10MB)</span>
                </div>
                
                <div className="flex-1 flex flex-col space-y-4">
                  {/* Card CV info */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs border border-rose-200 shrink-0">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                            {selectedApplicant.application_snapshot?.cv_name || 'CV_UngVien_PartTime.pdf'}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Bản sao hồ sơ cố định lưu tại thời điểm nộp đơn
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setApplicantCvViewer(selectedApplicant)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem Toàn Màn Hình</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-600 text-xs block">Thời gian nộp đơn:</span>
                        <span className="text-slate-900 font-semibold font-mono">{selectedApplicant.applied_at || 'Gần đây'}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 text-xs block">Xác thực tệp:</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã kiểm duyệt PDF
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cam kết của ứng viên */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Cam Kết Nhận Ca & Kỷ Luật Sinh Viên</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Cam kết tuân thủ đúng khung giờ ca làm đã đăng ký, không đi muộn hoặc về sớm.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Chấp hành nghiêm chỉnh nội quy an toàn lao động, văn hóa phục vụ của doanh nghiệp.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Sẵn sàng tham gia đánh giá chất lượng 2 chiều minh bạch sau khi hoàn thành ca làm.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Khung xem nhanh tài liệu */}
                  <div className="flex-1 min-h-[160px] rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col items-center justify-center text-center">
                    <FileText className="w-10 h-10 text-blue-600 mb-2" />
                    <p className="text-xs font-bold text-slate-900">Tệp Hồ Sơ Ứng Tuyển Sẵn Sàng</p>
                    <p className="text-xs text-slate-600 max-w-xs mt-1">
                      Nhấn vào nút "Xem Toàn Màn Hình" hoặc "Tải Về Máy" để đọc toàn bộ nội dung PDF chi tiết của sinh viên.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* DƯỚI LÀ CÁC NÚT THAO TÁC: DUYỆT / TỪ CHỐI / NHẮN TIN / BÁO CÁO */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs text-slate-700 font-mono">
                  Trạng thái: <strong className="text-slate-900 uppercase">
                    {selectedApplicant.application_status === 'accepted' ? 'ĐÃ TRÚNG TUYỂN' :
                     selectedApplicant.application_status === 'rejected' ? 'ĐÃ TỪ CHỐI' :
                     selectedApplicant.application_status === 'interview' ? 'MỜI PHỎNG VẤN' : 'CHỜ XÉT DUYỆT'}
                  </strong>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    handleStartChatWithApplicant(selectedApplicant);
                    setSelectedApplicant(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Nhắn Tin Tuyển Dụng</span>
                </button>

                {selectedApplicant.application_status === 'accepted' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReportModalData({
                        type: 'applicant',
                        target_id: selectedApplicant.student_user_id || selectedApplicant.student_id,
                        target_title: `Ứng viên ${selectedApplicant.application_snapshot?.student_name || selectedApplicant.student_name || 'Ứng viên'} (${selectedApplicant.job_title})`,
                        application_id: selectedApplicant._id
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title="Báo cáo vi phạm đối với ứng viên đã duyệt"
                  >
                    <Flag className="w-3.5 h-3.5 text-rose-600" />
                    <span>Báo cáo</span>
                  </button>
                ) : (
                  <span 
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-300 cursor-not-allowed inline-flex items-center gap-1.5 whitespace-nowrap"
                    title="Chỉ cho phép báo cáo đối với ứng viên đã có trạng thái 'Đã duyệt'"
                  >
                    <Flag className="w-3.5 h-3.5 text-slate-500" />
                    <span>Báo Cáo (Khóa)</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Từ Chối Hồ Sơ Ứng Viên',
                      message: `Xác nhận từ chối hồ sơ của ứng viên "${selectedApplicant.application_snapshot?.student_name || selectedApplicant.student_name || 'Ứng viên'}"? Lý do mặc định: "Chưa phù hợp với yêu cầu ca làm hiện tại".`,
                      type: 'danger',
                      confirmText: 'Từ Chối Hồ Sơ',
                      cancelText: 'Hủy Bỏ',
                      onConfirm: () => {
                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        handleUpdateApplicantStatus(selectedApplicant._id, 'rejected', 'Chưa phù hợp với yêu cầu ca làm hiện tại');
                      }
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <X className="w-4 h-4" />
                  <span>Từ chối</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleUpdateApplicantStatus(selectedApplicant._id, 'accepted', 'Doanh nghiệp phê duyệt trúng tuyển');
                  }}
                  className="px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <Check className="w-4 h-4" />
                  <span>Duyệt</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================= MODAL BÁO CÁO VI PHẠM ======================= */}
      {reportModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-black text-slate-900">Báo Cáo Vi Phạm</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setReportModalData(null)} 
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-700">
              Đối tượng: <strong className="text-slate-900">{reportModalData.target_title}</strong>
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-3">
              {reportModalData.type === 'applicant' && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                    Lý do khiếu nại vi phạm *
                  </label>
                  <select
                    value={reportReasonType}
                    onChange={(e) => setReportReasonType(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-rose-500 mb-2 font-medium"
                  >
                    <option value="Bùng việc không lý do / Không đến nhận việc">Bùng việc không lý do / Không đến nhận việc</option>
                    <option value="Vô trách nhiệm / Tự ý bỏ ca">Vô trách nhiệm / Tự ý bỏ ca làm việc giữa chừng</option>
                    <option value="Gian lận thông tin hồ sơ">Gian lận thông tin hồ sơ năng lực / Thiếu trung thực</option>
                    <option value="Thái độ không chuẩn mực">Thái độ làm việc không chuẩn mực / Quấy rối / Vi phạm nội quy</option>
                    <option value="Khác">Lý do khác (mô tả chi tiết)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                  Mô tả chi tiết nội dung khiếu nại gửi Quản trị viên *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Mô tả cụ thể vi phạm của sinh viên..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>

              {reportSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs">
                  {reportSuccessMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalData(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Gửi Báo Cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL ĐÁNH GIÁ SINH VIÊN (2.6.2) ======================= */}
      {reviewModalApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Đánh Giá Năng Lực Sinh Viên</h3>
                <p className="text-xs text-blue-600 font-bold mt-0.5">{reviewModalApp.application_snapshot?.student_name || reviewModalApp.student_name || 'Ứng viên'}</p>
                <p className="text-xs text-slate-600 font-medium">{reviewModalApp.job_title}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setReviewModalApp(null)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewStudentSubmit} className="space-y-4">
              <div className="space-y-1 text-center py-2">
                <label className="block text-xs font-bold text-slate-800 mb-2">Chấm Điểm Đánh Giá</label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewScore(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= reviewScore
                            ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-600 block mt-1">
                  {reviewScore}/5 sao
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">Nhận xét tác phong làm việc (&lt; 1.000 ký tự) *</label>
                  <span className={`text-xs font-mono ${reviewNote.length >= 1000 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                    {reviewNote.length} / 1.000 ký tự
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  placeholder="Nhận xét về tinh thần trách nhiệm, thái độ phục vụ khách hàng, đúng giờ..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalApp(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
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

      {/* ======================= MODAL XEM CV CHI TIẾT (A4) ======================= */}
      <DocumentViewerModal
        isOpen={!!applicantCvViewer}
        onClose={() => setApplicantCvViewer(null)}
        type="cv"
        data={{
          studentName: applicantCvViewer?.application_snapshot?.student_name || applicantCvViewer?.student_name || 'Ứng viên',
          university: applicantCvViewer?.application_snapshot?.university || 'Trường Đại học/Cao đẳng',
          phone: applicantCvViewer?.application_snapshot?.phone || 'Chưa cập nhật',
          email: applicantCvViewer?.student_email || applicantCvViewer?.application_snapshot?.email || '',
          fileName: applicantCvViewer?.application_snapshot?.cv_name || 'CV_UngVien.pdf',
          fileUrl: applicantCvViewer?.application_snapshot?.cv_url || applicantCvViewer?.application_snapshot?.cv_file || applicantCvViewer?.cv_url || applicantCvViewer?.file_url
        }}
        onDownloadSuccess={(msg) => onShowBanner && onShowBanner(msg, 'success')}
      />

      {/* ======================= MODAL XEM GPKD DOANH NGHIỆP ======================= */}
      <DocumentViewerModal
        isOpen={showCompanyGpkdViewer}
        onClose={() => setShowCompanyGpkdViewer(false)}
        type="gpkd"
        data={{
          companyName: companyInfo.company_name || 'Doanh nghiệp',
          repName: companyInfo.representative_name || '',
          licenseNumber: companyInfo.business_license || '',
          address: companyInfo.address || '',
          fileUrl: companyInfo.business_license_url || companyForm.business_license_url || '',
          fileName: companyInfo.business_license_name || companyForm.new_gpkd_name || ((companyInfo.business_license_url && companyInfo.business_license_url.toLowerCase().endsWith('.pdf')) ? companyInfo.business_license_url.split('/').pop() : 'GPKD_DoanhNghiep.pdf')
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

      {/* ======================= MODAL CUỘC GỌI ĐẾN (INCOMING CALL PHÍA NTD) ======================= */}
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
                Cuộc Gọi Phỏng Vấn Đến
              </p>
              <h3 className="text-lg font-black text-white">{incomingCall.caller_name || 'Ứng viên sinh viên'}</h3>
              <p className="text-xs text-slate-200 mt-1">
                Ứng viên đang gọi {incomingCall.call_type === 'video' ? 'Video phỏng vấn' : 'Thoại trực tiếp'}
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
                <span>Nhấc Máy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM TRƯỚC TỆP ĐÍNH KÈM CHAT */}
      {chatPreviewDoc && (
        <DocumentViewerModal
          isOpen={!!chatPreviewDoc}
          onClose={() => setChatPreviewDoc(null)}
          type={chatPreviewDoc.fileUrl?.match(/\.(png|jpe?g|webp)$/i) || chatPreviewDoc.fileUrl?.startsWith('data:image') ? 'image' : 'cv'}
          data={chatPreviewDoc}
          onDownloadSuccess={(msg) => notify(msg, 'success')}
        />
      )}

      {/* ======================= MODAL XEM CHI TIẾT TIN TUYỂN DỤNG ======================= */}
      {selectedJobDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] flex text-slate-800 flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap ${
                    selectedJobDetail.status === 'open' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    selectedJobDetail.status === 'closed' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    selectedJobDetail.status === 'filled' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                    'bg-slate-100 text-slate-800 border border-slate-300'
                  }`}>
                    {selectedJobDetail.status === 'open' ? 'Đang tuyển' :
                     selectedJobDetail.status === 'closed' ? 'Tạm đóng' :
                     selectedJobDetail.status === 'filled' ? 'Đã nhận người' : 'Hoàn thành'}
                  </span>
                  <span className="text-xs text-blue-700 font-bold">{selectedJobDetail.category_name || selectedJobDetail.job_type || 'Dịch vụ & F&B'}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">{selectedJobDetail.title}</h3>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{selectedJobDetail.address || 'Chi nhánh Quận 1'}, {selectedJobDetail.district || 'Quận 1'}, TP. Hồ Chí Minh</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedJobDetail(null)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Mức Lương</span>
                  <p className="text-xs sm:text-sm font-black text-emerald-700 mt-0.5">
                    {selectedJobDetail.salary_display || (selectedJobDetail.hourly_rate ? `${selectedJobDetail.hourly_rate.toLocaleString('vi-VN')} đ/h` : 'Lương thỏa thuận')}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Số Lượng Tuyển</span>
                  <p className="text-xs sm:text-sm font-black text-blue-700 mt-0.5">
                    {selectedJobDetail.vacancies_count || 3} nhân sự
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Hồ Sơ Hợp Lệ</span>
                  <p className="text-xs sm:text-sm font-black text-indigo-700 mt-0.5">
                    {validApplicants.filter(a => a.job_id === selectedJobDetail._id || a.job_title === selectedJobDetail.title).length} ứng viên
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Hình Thức Ca</span>
                  <p className="text-xs sm:text-sm font-black text-amber-700 mt-0.5">
                    {selectedJobDetail.working_time || 'Ca linh hoạt 4h-6h'}
                  </p>
                </div>
              </div>

              {/* Ca làm việc */}
              {selectedJobDetail.shifts && selectedJobDetail.shifts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Lịch & Khung Giờ Ca Làm Việc</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJobDetail.shifts.map((s, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
                        {typeof s === 'string' ? s : `${s.name || 'Ca'}: ${s.start_time || '08:00'} - ${s.end_time || '14:00'}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mô tả công việc */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">Mô Tả Chi Tiết Công Việc</h4>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line shadow-xs font-medium">
                  {selectedJobDetail.description || 'Chưa có thông tin mô tả chi tiết công việc.'}
                </div>
              </div>

              {/* Yêu cầu ứng viên */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">Yêu Cầu Năng Lực & Trách Nhiệm</h4>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line shadow-xs font-medium">
                  {selectedJobDetail.requirements || 'Yêu cầu ứng viên theo thỏa thuận khi phỏng vấn.'}
                </div>
              </div>

              {/* Quyền lợi */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">Chế Độ Đãi Ngộ & Quyền Lợi</h4>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line shadow-xs font-medium">
                  {selectedJobDetail.benefits || 'Mức lương và chế độ đãi ngộ theo thỏa thuận hợp đồng.'}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setKanbanJobFilter(selectedJobDetail.title || '');
                  setSelectedJobDetail(null);
                  setActiveMenu('applicants');
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Users className="w-4 h-4 text-blue-600" />
                <span>Xem Hồ Sơ Ứng Viên ({validApplicants.filter(a => a.job_id === selectedJobDetail._id || a.job_title === selectedJobDetail.title).length})</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const job = selectedJobDetail;
                    setSelectedJobDetail(null);
                    setEditingJob(job);
                    setJobForm({
                      title: job.title || '',
                      category_id: (job.category_id && job.category_id !== 'cat_1') ? job.category_id : '',
                      location: job.location || '',
                      description: job.description || '',
                      salary_min: job.salary_min || 25000,
                      salary_max: job.salary_max || 35000,
                      is_negotiable: !!job.is_negotiable,
                      work_time: job.work_time || job.working_time || ''
                    });
                    setActiveMenu('post_job');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-xs whitespace-nowrap"
                >
                  Chỉnh Sửa Tin
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedJobDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL XEM CHI TIẾT ĐÁNH GIÁ ======================= */}
      {selectedReviewDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-800 animate-in zoom-in-95">
            {/* Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-blue-700 block mb-1">
                  Đánh Giá 2 Chiều Doanh Nghiệp
                </span>
                <h3 className="text-base font-black text-slate-900">Chi Tiết Bài Nhận Xét Của Sinh Viên</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReviewDetail(null)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Sinh viên & Điểm số */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white font-black text-sm flex items-center justify-center shadow-md">
                    {(selectedReviewDetail.reviewer_name || selectedReviewDetail.student_name || 'L')[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      {selectedReviewDetail.reviewer_name || selectedReviewDetail.student_name || 'Sinh viên'}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      {selectedReviewDetail.job_title || 'Nhân viên Phục vụ Part-time'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (selectedReviewDetail.rating || selectedReviewDetail.score || 5)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                    {selectedReviewDetail.created_at || '01/11/2026'}
                  </span>
                </div>
              </div>

              {/* Nội dung đầy đủ */}
              <div className="space-y-2">
                <h5 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Toàn Bộ Nội Dung Văn Bản Nhận Xét</span>
                </h5>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line shadow-xs min-h-[120px] font-medium">
                  {selectedReviewDetail.comment || selectedReviewDetail.review_note || selectedReviewDetail.content || 
                   'Môi trường làm việc rất chuyên nghiệp, quản lý hỗ trợ sinh viên nhiệt tình, ca làm linh hoạt và thanh toán lương đúng hạn theo cam kết. Trải nghiệm làm việc rất tốt!'}
                </div>
              </div>

              {/* Trạng thái xác thực */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-slate-700 font-semibold">Trạng thái hiển thị:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã công khai trên hồ sơ doanh nghiệp
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReviewDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs sm:text-sm font-bold cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL TẠO TIN NHẮN MỚI & MỜI PHỎNG VẤN ======================= */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-800 animate-in zoom-in-95">
            {/* Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                    <MessageSquarePlus className="w-4 h-4" />
                  </div>
                  <span className="text-xs uppercase tracking-wider font-bold text-blue-700">
                    Giao Tiếp Tuyển Dụng Trực Tiếp
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900">Tạo Tin Nhắn Mới / Mời Phỏng Vấn</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewChatModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNewChatSubmit} className="p-6 space-y-4">
              {/* Chọn Ứng Viên / Đơn Ứng Tuyển */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Chọn Sinh Viên Đang Ứng Tuyển *
                </label>
                <select
                  value={newChatSelectedAppId}
                  onChange={(e) => {
                    setNewChatSelectedAppId(e.target.value);
                    const chosen = applicants.find(a => a._id === e.target.value);
                    if (chosen && newChatType === 'interview') {
                      const meetUrl = `https://meet.partime.vn/interview-${Date.now().toString().slice(-6)}`;
                      const sName = chosen.application_snapshot?.student_name || chosen.student_name || 'bạn';
                      setNewChatMessageText(`Kính gửi ${sName}, ${companyInfo?.company_name || 'Doanh nghiệp'} trân trọng mời bạn tham gia buổi phỏng vấn trực tuyến cho vị trí "${chosen.job_title}" tại phòng họp: ${meetUrl}. Vui lòng tham gia đúng giờ.`);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">-- Chọn hồ sơ ứng viên ({applicants.length} hồ sơ) --</option>
                  {applicants.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.application_snapshot?.student_name || a.student_name || 'Ứng viên'} - {a.job_title} ({
                        a.application_status === 'accepted' ? 'Đã duyệt' :
                        a.application_status === 'pending' ? 'Chờ duyệt' :
                        a.application_status === 'rejected' ? 'Từ chối' : 'Đã hủy'
                      })
                    </option>
                  ))}
                </select>
              </div>

              {/* RÀNG BUỘC KIỂM TRA TRẠNG THÁI: BỊ KHÓA NẾU TỪ CHỐI HOẶC ĐÃ HỦY */}
              {(() => {
                const targetApp = applicants.find(a => a._id === newChatSelectedAppId);
                const isBlocked = targetApp && (
                  targetApp.application_status === 'rejected' ||
                  targetApp.application_status === 'cancelled' ||
                  targetApp.application_status === 'withdrawn' ||
                  targetApp.is_cancelled
                );

                if (isBlocked) {
                  return (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900">
                      <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                          Cuộc trò chuyện ở chế độ CHỈ ĐỌC
                        </p>
                        <p className="text-xs leading-relaxed text-rose-800">
                          Đơn ứng tuyển của sinh viên này đã ở trạng thái <strong>"{targetApp.application_status === 'rejected' ? 'Đã từ chối' : 'Đã hủy'}"</strong>.
                          Theo quy chuẩn bảo mật và quyền riêng tư, hệ thống khóa chiều gửi tin nhắn mới và chỉ cho phép xem lại lịch sử hội thoại trước đó.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            handleStartChatWithApplicant(targetApp);
                            setNewChatModalOpen(false);
                          }}
                          className="mt-2 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-rose-300 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem Lịch Sử Trò Chuyện Cũ</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <>
                    {/* Loại hình tin nhắn */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Mục Đích Khởi Tạo Cuộc Trò Chuyện
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewChatType('text');
                            if (targetApp) {
                              const sName = targetApp.application_snapshot?.student_name || targetApp.student_name || 'bạn';
                              setNewChatMessageText(`Chào ${sName}, ${companyInfo?.company_name || 'Doanh nghiệp'} đã tiếp nhận hồ sơ ứng tuyển của bạn cho vị trí "${targetApp.job_title}". Chúng tôi muốn trao đổi nhanh về lịch học và ca làm của bạn.`);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                            newChatType === 'text'
                              ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Trao Đổi Chung</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setNewChatType('interview');
                            const meetUrl = `https://meet.partime.vn/interview-${Date.now().toString().slice(-6)}`;
                            const sName = targetApp?.application_snapshot?.student_name || targetApp?.student_name || 'bạn';
                            const jTitle = targetApp?.job_title || 'Nhân viên';
                            setNewChatMessageText(`Kính gửi ${sName}, ${companyInfo?.company_name || 'Doanh nghiệp'} trân trọng mời bạn tham gia buổi phỏng vấn trực tuyến cho vị trí "${jTitle}" tại phòng họp trực tuyến: ${meetUrl}. Vui lòng tham gia đúng giờ.`);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                            newChatType === 'interview'
                              ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <Video className="w-4 h-4" />
                          <span>Mời Phỏng Vấn (Link)</span>
                        </button>
                      </div>
                    </div>

                    {/* Nội dung tin nhắn */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-800">
                          Nội Dung Tin Nhắn Gửi Đến Sinh Viên *
                        </label>
                        {newChatType === 'interview' && (
                          <span className="text-xs text-purple-700 font-mono font-bold flex items-center gap-1">
                            <Link className="w-3 h-3" />
                            Đã đính kèm liên kết họp trực tuyến
                          </span>
                        )}
                      </div>
                      <textarea
                        required
                        rows={4}
                        value={newChatMessageText}
                        onChange={(e) => setNewChatMessageText(e.target.value)}
                        placeholder="Nhập nội dung trao đổi hoặc liên kết phòng phỏng vấn..."
                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-blue-500 leading-relaxed"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed font-medium">
                      Khi gửi, tin nhắn sẽ lập tức xuất hiện trong hộp thoại của sinh viên và kích hoạt chuông thông báo đẩy theo thời gian thực.
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setNewChatModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Khởi Tạo & Gửi Tin</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL (REPLACES BROWSER CONFIRM/ALERT) */}
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

/**
 * Shared contacts search/filter & conversation list used by both the slide-over
 * chat drawer and the inline left sidebar of the Employer full chat workspace.
 */
function EmployerChatContactsPanel({
  contacts,
  selectedContact,
  chatSearchQuery,
  onSearchChange,
  chatJobFilter,
  onJobFilterChange,
  myJobs,
  chatUnrepliedOnly,
  onToggleUnreplied,
  onSelectContact,
  onCreateNewChat,
  isDrawer = false,
}) {
  const filteredContacts = contacts.filter(c => {
    const matchName = matchKeywordFlexible(c, chatSearchQuery, ['name', 'subtitle', 'lastMsg', 'job_title']);
    const selectedFilterJob = myJobs.find(j => j._id === chatJobFilter);
    const matchJob = chatJobFilter === 'all' || !chatJobFilter || c.job_id === chatJobFilter ||
      (selectedFilterJob ? matchKeywordFlexible(c, selectedFilterJob.title, ['job_title', 'subtitle', 'lastMsg']) : false);
    const matchUnreplied = !chatUnrepliedOnly || c.unreplied || c.unread_count > 0 || c.status === 'pending';
    return matchName && matchJob && matchUnreplied;
  });

  return (
    <>
      {/* Thanh tìm kiếm & Lọc hội thoại (FR-NTD-07.06: Tin tuyển dụng & Chưa phản hồi) */}
      <div className="p-3 border-b border-slate-200 space-y-2 shrink-0 bg-white/90">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={chatSearchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên Sinh viên..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-500 outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>

        <div className="space-y-1.5">
          <select
            value={chatJobFilter}
            onChange={(e) => onJobFilterChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-600 cursor-pointer"
            title="Lọc hội thoại theo Tin tuyển dụng (FR-NTD-07.06)"
          >
            <option value="all">Tất cả tin tuyển dụng</option>
            {myJobs.map(j => (
              <option key={j._id} value={j._id}>{j.title}</option>
            ))}
          </select>

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
              title="Chỉ hiển thị hội thoại chưa phản hồi (FR-NTD-07.06)"
            >
              {chatUnrepliedOnly ? '✓ Chưa phản hồi' : 'Chưa phản hồi'}
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách các cuộc hội thoại */}
      <div className={`flex-1 overflow-y-auto p-2.5 space-y-1.5 min-h-0 ${isDrawer ? 'divide-y divide-slate-100' : ''}`}>
        {contacts.length === 0 ? (
          <div className="p-6 text-center text-slate-600 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
            <p className="font-bold text-slate-800">Chưa có cuộc trò chuyện nào</p>
            <p className="text-xs text-slate-600 mt-1">
              Danh bạ sẽ tự động xuất hiện khi có sinh viên ứng tuyển vào công việc của bạn.
            </p>
            {onCreateNewChat && (
              <button
                type="button"
                onClick={onCreateNewChat}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>Tạo Tin Nhắn Mới</span>
              </button>
            )}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-6 text-center text-slate-600 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
            <p className="font-bold text-slate-800">Không tìm thấy hội thoại phù hợp</p>
            <p className="text-xs text-slate-500 mt-1">Thử bỏ chọn "Chưa phản hồi" hoặc đổi bộ lọc tin tuyển dụng.</p>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isSelected = selectedContact?.id === contact.id;
            const hasUnreplied = Boolean(contact.unreplied || contact.unread_count > 0);
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => onSelectContact(contact)}
                className={`w-full p-3 rounded-xl border transition-all text-left flex items-start gap-3 cursor-pointer group ${
                  isSelected
                    ? 'bg-blue-50 border-blue-400 shadow-xs ring-1 ring-blue-300/60'
                    : 'bg-white hover:bg-blue-50/60 border-slate-200/80 hover:border-blue-300'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {contact.name.charAt(0)}
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
