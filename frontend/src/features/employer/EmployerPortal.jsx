import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, PlusCircle, Users, FileText, CheckCircle2, 
  XCircle, Clock, DollarSign, MapPin, Eye, Star, AlertCircle, 
  Edit, Trash2, Video, Search, Filter, ShieldCheck, RefreshCw,
  Phone, Mic, MicOff, Camera, CameraOff, Bell, KeyRound, 
  ChevronRight, Send, Paperclip, AlertTriangle, Menu, Check,
  Upload, Download, Image as ImageIcon, ArrowLeft, ArrowUpDown, Home,
  Sparkles, Briefcase, PhoneIncoming, MessageSquare, Flag,
  MoreVertical, FileCheck, CheckSquare, X, ChevronDown, Lock, Link, MessageSquarePlus
} from 'lucide-react';
import DocumentViewerModal from '../../shared/DocumentViewerModal';
import ConfirmDialog from '../../shared/ConfirmDialog';
import { 
  PROFESSION_SUGGESTIONS, filterSuggestions, getStatusBadge, 
  HCM_DISTRICTS, HCM_BRANCH_SUGGESTIONS, JOB_STATUS_OPTIONS, JOB_CATEGORIES 
} from '../../shared/professionSuggestions';

const DEFAULT_COVER_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022c22"/>
      <stop offset="50%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <pattern id="pat" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="1.5" fill="#10b981" opacity="0.15"/>
    </pattern>
  </defs>
  <rect width="1200" height="400" fill="url(#g1)"/>
  <rect width="1200" height="400" fill="url(#pat)"/>
  <circle cx="950" cy="200" r="160" fill="#047857" opacity="0.2"/>
  <circle cx="1050" cy="180" r="100" fill="#10b981" opacity="0.2"/>
  <text x="80" y="190" fill="#34d399" font-family="system-ui, sans-serif" font-size="34" font-weight="900" letter-spacing="2">PHÚC LONG COFFEE &amp; TEA</text>
  <text x="80" y="235" fill="#a7f3d0" font-family="system-ui, sans-serif" font-size="18" font-weight="600">ĐỐI TÁC DOANH NGHIỆP TUYỂN DỤNG LINH HOẠT • TP. HỒ CHÍ MINH</text>
  <text x="80" y="270" fill="#6ee7b7" font-family="system-ui, sans-serif" font-size="14" opacity="0.9">Xác thực Giấy phép kinh doanh • Hỗ trợ xếp ca theo lịch học sinh viên</text>
</svg>
`);

const DEFAULT_LOGO_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="40" fill="url(#lg)"/>
  <circle cx="100" cy="100" r="68" fill="none" stroke="#d1fae5" stroke-width="6"/>
  <path d="M75 135 V65 H105 A28 28 0 0 1 105 105 H75" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M110 75 Q125 65 135 80 Q125 95 110 85 Z" fill="#a7f3d0"/>
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
  onShowBanner
}) {
  const notify = (msg, type = 'success') => {
    if (onShowBanner) {
      onShowBanner(msg, type);
    }
  };
  // Navigation State
  const [activeMenu, setActiveMenu] = useState('home'); // 'home' | 'jobs' | 'applicants' | 'company' | 'reviews' | 'chat'
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

  // Phân biệt: Tài khoản mẫu demo của nhóm (Bảo Ngọc - Phúc Long) vs Tài khoản Nhà tuyển dụng mới tạo
  const isPhucLongDemo = currentUser?.email === 'huynhnguyenbaongoc2k5@gmail.com' || currentUser?.email === 'huỳnhnguyenbaongoc2k5@gmail.com';

  // REAL Contacts for Employer Chat: Phúc Long giữ liên hệ demo; Nhà tuyển dụng mới khởi tạo danh bạ RỖNG []
  const [contacts, setContacts] = useState(() => {
    if (isPhucLongDemo) {
      return [
        { 
          id: 'user_student_long', 
          name: 'Vũ Thế Long', 
          subtitle: 'Ứng tuyển: Pha chế Barista & Thu ngân', 
          role: 'student', 
          email: 'vuthelong@vlu.edu.vn', 
          online: true, 
          lastMsg: 'Dạ em chào chị Bảo Ngọc ạ! Em sẵn sàng tham gia phỏng vấn trực tuyến.', 
          time: '10:05', 
          unread: 1 
        }
      ];
    }
    return [];
  });
  const [selectedContact, setSelectedContact] = useState(() => isPhucLongDemo ? { 
    id: 'user_student_long', 
    name: 'Vũ Thế Long', 
    subtitle: 'Ứng tuyển: Pha chế Barista & Thu ngân', 
    role: 'student', 
    email: 'vuthelong@vlu.edu.vn', 
    online: true, 
    lastMsg: 'Dạ em chào chị Bảo Ngọc ạ! Em sẵn sàng tham gia phỏng vấn trực tuyến.', 
    time: '10:05', 
    unread: 1 
  } : null);
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
    company_name: currentUser?.profile?.company_name || currentUser?.company_name || 'Phúc Long Coffee & Tea',
    representative_name: currentUser?.profile?.representative_name || currentUser?.representative_name || 'Huỳnh Nguyễn Bảo Ngọc',
    branch_name: currentUser?.profile?.branch_name || 'Chi nhánh Bến Nghé, Quận 1, TP.HCM',
    description: currentUser?.profile?.description || 'Chuỗi cửa hàng trà & cà phê Phúc Long hàng đầu tại Việt Nam. Môi trường năng động, thân thiện và tạo điều kiện tối đa cho sinh viên làm việc linh hoạt theo ca học.',
    scale: currentUser?.profile?.scale || '50-200 nhân viên',
    address: currentUser?.profile?.address || '42 Ngô Đức Kế, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    business_license: currentUser?.profile?.business_license || '0314567890',
    business_license_url: currentUser?.profile?.business_license_url || '/uploads/GPKD_PhucLong_0314567890.pdf',
    logo_url: currentUser?.profile?.logo_url || DEFAULT_LOGO_SVG,
    cover_image_url: currentUser?.profile?.cover_image_url || DEFAULT_COVER_SVG
  });
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

  // Job Search & Filters
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [jobPage, setJobPage] = useState(1);
  const JOBS_PER_PAGE = 10;

  // Kanban Filter
  const [kanbanSearch, setKanbanSearch] = useState('');
  const [kanbanJobFilter, setKanbanJobFilter] = useState('');

  // Dual-Pane Modal for Viewing Applicant (UI-NTD-CAND-02 - 2.5.4, 2.5.5)
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // Job Form State (UI-NTD-JOB-03)
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    category_id: 'cat_1',
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
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  // Document Viewer Modals (CV & GPKD)
  const [applicantCvViewer, setApplicantCvViewer] = useState(null);
  const [showCompanyGpkdViewer, setShowCompanyGpkdViewer] = useState(false);
  const [selectedReviewDetail, setSelectedReviewDetail] = useState(null); // FR 2.6.3: Chi tiết bài đánh giá
  const [newChatModalOpen, setNewChatModalOpen] = useState(false); // FR 2.7.1: Tạo tin nhắn mới
  const [newChatSelectedAppId, setNewChatSelectedAppId] = useState('');
  const [newChatMessageText, setNewChatMessageText] = useState('');
  const [newChatType, setNewChatType] = useState('text'); // 'text' | 'interview'
  const [reportReasonType, setReportReasonType] = useState('Bùng việc / Không đến nhận việc không lý do'); // FR 2.5.6
  const [candidateViewMode, setCandidateViewMode] = useState('kanban'); // 'kanban' | 'table' (FR 2.5.1)
  const gpkdFileInputRef = useRef(null);

  // Chat State: Phúc Long demo giữ tin nhắn mẫu; Nhà tuyển dụng mới khởi tạo tin nhắn RỖNG []
  const [chatMessages, setChatMessages] = useState(() => {
    if (isPhucLongDemo) {
      return [
        {
          _id: 'msg_emp_1',
          sender_id: currentUser?._id || 'user_employer_ngoc',
          sender_role: 'employer',
          sender_email: currentUser?.email || 'huynhnguyenbaongoc2k5@gmail.com',
          sender_name: 'Huỳnh Nguyễn Bảo Ngọc (Phúc Long)',
          content: 'Chào Long! Quán nhận được hồ sơ của bạn cho vị trí Pha chế Barista ca linh hoạt. Thứ Hai tuần tới bạn có thể phỏng vấn trực tuyến qua WebRTC không?',
          created_at: '10:00'
        },
        {
          _id: 'msg_emp_2',
          sender_id: 'user_student_long',
          sender_role: 'student',
          sender_email: 'vuthelong@vlu.edu.vn',
          sender_name: 'Vũ Thế Long',
          content: 'Dạ em chào chị Bảo Ngọc ạ! Dạ thứ Hai em rảnh cả buổi chiều, em sẵn sàng tham gia phỏng vấn qua cuộc gọi video trên website ạ.',
          created_at: '10:05'
        }
      ];
    }
    return [];
  });

  const empId = currentUser?._id || currentUser?.id || 'emp_default';
  const getRoomId = (targetContact = selectedContact) => {
    if (isPhucLongDemo) return 'room_main';
    const cId = targetContact?.id || (targetContact?.student_user_id || targetContact?.student_id);
    if (!cId) return `room_emp_${empId}_empty`;
    return `room_emp_${empId}_stu_${cId}`;
  };
  const [newMsgText, setNewMsgText] = useState('');
  const [chatAttachment, setChatAttachment] = useState(null); // { file, name, size, type, base64, sizeStr }
  const [chatPreviewDoc, setChatPreviewDoc] = useState(null);
  const chatFileInputRef = useRef(null);

  const token = localStorage.getItem('partime_token');
  const headers = token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' };

  // Sync title
  const sectionTitleMap = {
    home: 'Trang Chủ Doanh Nghiệp',
    company: 'Hồ Sơ Doanh Nghiệp & GPKD',
    jobs: 'Quản Lý Tin Tuyển Dụng',
    applicants: 'Quản Lý Ứng Viên',
    reviews: 'Đánh Giá Sinh Viên',
    chat: 'Tin Nhắn & Phỏng Vấn Video'
  };

  const handleMenuSwitch = (menuId) => {
    setActiveMenu(menuId);
    if (onSectionChange) onSectionChange(sectionTitleMap[menuId] || 'Trang Chủ Doanh Nghiệp');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          category_id: 'cat_1',
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

  // Initial & Auto-Refresh Data (every 8s)
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 8000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchAllData = () => {
    fetchCategories();
    if (token) {
      fetchMyJobs();
      fetchApplicants();
      fetchCompanyProfile();
      fetchReviews();
      fetchChatMessages();
    }
  };

  // WebRTC Stream Handler
  useEffect(() => {
    let timer = null;
    if (isVideoCalling) {
      timer = setInterval(() => setCallDuration(d => d + 1), 1000);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then((stream) => {
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          })
          .catch((err) => {
            console.warn('[WebRTC] Camera access:', err);
          });
      }
    } else {
      setCallDuration(0);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    }
    return () => {
      if (timer) clearInterval(timer);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isVideoCalling]);

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

        // Với nhà tuyển dụng mới: CHỈ sinh viên nào THỰC SỰ nộp hồ sơ vào công việc của NTD này mới xuất hiện trong contacts!
        if (!isPhucLongDemo) {
          const uniqueStudents = [];
          const seen = new Set();
          data.data.forEach(app => {
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
                lastMsg: `Đơn ứng tuyển: ${app.job_title}`,
                time: 'Mới ứng tuyển',
                unread: 0,
                application_status: app.application_status,
                is_cancelled: app.is_cancelled,
                application_id: app._id,
                job_title: app.job_title
              });
            }
          });

          setContacts(uniqueStudents);
          if (uniqueStudents.length > 0) {
            setSelectedContact(prev => {
              if (prev && uniqueStudents.some(u => u.id === prev.id)) return prev;
              return uniqueStudents[0];
            });
          } else {
            setSelectedContact(null);
            setChatMessages([]);
          }
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

  const fetchCompanyProfile = async () => {
    try {
      const res = await fetch('/api/employer/company', { headers });
      const data = await res.json();
      if (data.success && data.data) {
        setCompanyInfo(data.data);
        setCompanyForm(data.data);
        if (data.data.employer_record) {
          setEmployerRecord(data.data.employer_record);
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

  const fetchChatMessages = async (targetContact = selectedContact) => {
    const contactToFetch = targetContact || selectedContact;
    if (!contactToFetch) {
      if (!isPhucLongDemo) setChatMessages([]);
      return;
    }
    const roomId = getRoomId(contactToFetch);
    try {
      const res = await fetch(`/api/chat/messages?room_id=${roomId}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        if (data.data.length > 0 || !isPhucLongDemo) {
          setChatMessages(data.data);
        }
      }
    } catch (err) {
      console.warn('Chat fetch fallback:', err);
      if (!isPhucLongDemo) setChatMessages([]);
    }
  };

  // Tự động tải lại tin nhắn khi người dùng chọn một ứng viên khác
  useEffect(() => {
    if (selectedContact) {
      fetchChatMessages(selectedContact);
    } else if (!isPhucLongDemo) {
      setChatMessages([]);
    }
  }, [selectedContact]);

  // Tải lên tệp GPKD mới từ máy tính (FR 2.3.2)
  const handleGpkdFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      notify('Dung lượng tệp Giấy phép kinh doanh (GPKD) không được vượt quá 10MB.', 'error');
      return;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf') {
      notify('Tệp Giấy phép kinh doanh (GPKD) chỉ chấp nhận định dạng .pdf!', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target.result;
      setCompanyForm(prev => ({
        ...prev,
        business_license_url: base64Url,
        new_gpkd_name: file.name,
        new_gpkd_uploaded: true
      }));
      notify(`Đã chọn tệp GPKD mới: "${file.name}". Nhấn "Lưu Hồ Sơ Doanh Nghiệp" để gửi xét duyệt lại!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  // Helper tải tệp PDF CV ứng viên an toàn không bị lỗi file (FR 2.5.3, 2.5.4)
  const handleDownloadApplicantCv = (app) => {
    const fileName = app.application_snapshot?.cv_name || `CV_${(app.application_snapshot?.student_name || 'VuTheLong').replace(/\s+/g, '_')}.pdf`;
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

  // Toggle Job is_open status (FR 2.4.7)
  const handleToggleJobStatus = async (jobId) => {
    try {
      const res = await fetch(`/api/employer/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers
      });
      const data = await res.json();
      if (data.success) {
        fetchMyJobs();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // Advance Job Lifecycle: "filled" ("Đã nhận người") -> "completed" ("Hoàn thành") (FR 2.4.7)
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
      } else {
        notify(data.message || 'Lỗi cập nhật vòng đời công việc.', 'error');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // Delete Job with constraint: disabled if applicants > 0 or reports > 0 (FR 2.4.8)
  const handleDeleteJob = async (job) => {
    if ((job.applicant_count || 0) > 0) {
      notify('Không thể xóa tin tuyển dụng này vì đã có sinh viên nộp hồ sơ ứng tuyển!', 'error');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Xóa Tin Tuyển Dụng',
      message: `Bạn có chắc chắn muốn xóa tin tuyển dụng "${job.title}" vĩnh viễn khỏi hệ thống?`,
      type: 'danger',
      confirmText: 'Xóa Vĩnh Viễn',
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

  // ATS Kanban Status Update (FR 2.5.4 & 2.5.5)
  const handleUpdateApplicantStatus = async (appId, newStatus, note = '') => {
    try {
      const res = await fetch(`/api/employer/applicants/${appId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus, note })
      });
      const data = await res.json();
      if (data.success) {
        fetchApplicants();
        if (selectedApplicant && selectedApplicant._id === appId) {
          setSelectedApplicant(prev => ({ ...prev, application_status: newStatus }));
        }
      } else {
        notify(data.message || 'Cập nhật trạng thái ứng viên thất bại.', 'error');
      }
    } catch (err) {
      console.warn(err);
    }
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
    const studentName = app.application_snapshot?.student_name || 'Vũ Thế Long';
    const studentEmail = app.student_email || 'vuthelong@vlu.edu.vn';
    const studentUserId = app.student_user_id || app.student_id || 'user_student_long';

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
      notify('Đơn ứng tuyển của ứng viên này đã bị Từ chối hoặc Đã hủy. Theo quy định FR-NTD-08, cuộc trò chuyện chỉ mở ở chế độ CHỈ ĐỌC, không được phép gửi thêm tin nhắn!', 'error');
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
    setNewMsgText(`Phúc Long trân trọng gửi liên kết phỏng vấn trực tuyến tới bạn: ${meetUrl}. Vui lòng chuẩn bị và tham gia đúng giờ.`);
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

    const optimisticMsg = {
      _id: `msg_tmp_${Date.now()}`,
      sender_id: currentUser?._id || 'user_employer_ngoc',
      sender_role: 'employer',
      sender_email: currentUser?.email || 'huynhnguyenbaongoc2k5@gmail.com',
      sender_name: isPhucLongDemo ? 'Huỳnh Nguyễn Bảo Ngọc (Phúc Long)' : (companyInfo?.representative_name || currentUser?.name || 'Nhà tuyển dụng'),
      content: textContent,
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
        setChatMessages(prev => prev.map(m => m._id === optimisticMsg._id ? data.data : m));
      } else if (!data.success) {
        notify(data.message || 'Không thể gửi tin nhắn.', 'error');
      }
    } catch (err) {
      console.warn('Send message error:', err);
    }
  };

  // Call signaling poll (every 2.5s) for Employer Two-Way Calling
  useEffect(() => {
    if (!token) return;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/call/status?room_id=${getRoomId()}`, { headers });
        const data = await res.json();
        if (data.success && data.call) {
          const call = data.call;
          if (call.status === 'ringing' && call.target_role === 'employer' && !isVideoCalling && !incomingCall) {
            setIncomingCall(call);
          } else if (callStatus === 'calling' && call.status === 'connected') {
            setCallStatus('connected');
            if (onShowBanner) onShowBanner(null);
            notify('Đã kết nối cuộc gọi phỏng vấn thành công!', 'success');
          } else if (isVideoCalling && (call.status === 'ended' || call.status === 'declined')) {
            handleEndCall(false);
            if (onShowBanner) onShowBanner(null);
            notify('Cuộc gọi đã kết thúc.', 'success');
          }
        }
      } catch (e) {}
    }, 2500);
    return () => clearInterval(pollInterval);
  }, [token, isVideoCalling, callStatus, incomingCall, selectedContact]);

  const handleStartCall = async (type = 'video') => {
    setCallType(type);
    setIsVideoCalling(true);
    setCallStatus('calling');
    try {
      await fetch('/api/chat/call/initiate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ room_id: getRoomId(), call_type: type })
      });
      notify(`Đang đổ chuông cuộc gọi ${type === 'video' ? 'Video' : 'Thoại'} tới Ứng viên ${selectedContact?.name || 'Vũ Thế Long'}...`, 'loading');
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAnswerIncomingCall = async () => {
    if (!incomingCall) return;
    try {
      await fetch('/api/chat/call/respond', {
        method: 'POST',
        headers,
        body: JSON.stringify({ room_id: getRoomId(), action: 'accept' })
      });
      setCallType(incomingCall.call_type || 'video');
      setIncomingCall(null);
      setIsVideoCalling(true);
      setCallStatus('connected');
      notify('Đã kết nối cuộc gọi phỏng vấn thành công!', 'success');
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDeclineIncomingCall = async () => {
    if (!incomingCall) return;
    try {
      await fetch('/api/chat/call/respond', {
        method: 'POST',
        headers,
        body: JSON.stringify({ room_id: getRoomId(), action: 'decline' })
      });
      setIncomingCall(null);
      if (onShowBanner) onShowBanner(null);
      notify('Đã từ chối cuộc gọi.', 'error');
    } catch (e) {
      console.warn(e);
    }
  };

  const handleEndCall = async (notifyBackend = true) => {
    if (notifyBackend) {
      try {
        await fetch('/api/chat/call/end', {
          method: 'POST',
          headers,
          body: JSON.stringify({ room_id: getRoomId() })
        });
      } catch (e) {}
    }
    setIsVideoCalling(false);
    setCallStatus('idle');
    setCallDuration(0);
    if (onShowBanner) onShowBanner(null);
    notify('Cuộc gọi phỏng vấn đã kết thúc.', 'success');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    fetchChatMessages();
  };

  // WebRTC Camera / Audio stream handler for Employer
  useEffect(() => {
    let timer = null;
    if (isVideoCalling && callStatus === 'connected') {
      timer = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    if (isVideoCalling) {
      if (callType === 'video' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: !isCameraOff, audio: !isMuted })
          .then((stream) => {
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          })
          .catch((err) => console.warn('Media stream error:', err));
      }
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isVideoCalling, callStatus, callType, isCameraOff, isMuted]);

  // Periodic poll for chat messages when activeMenu === 'chat'
  useEffect(() => {
    if (!token || activeMenu !== 'chat') return;
    fetchChatMessages();
    const chatPoll = setInterval(() => {
      fetchChatMessages();
    }, 2000);
    return () => clearInterval(chatPoll);
  }, [token, activeMenu]);

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

  // Filter Jobs Table (FR 2.4.2: Đang tuyển, Tạm đóng, Đã nhận người, Hoàn thành)
  const filteredJobs = myJobs.filter(j => {
    const matchesSearch = !jobSearch || 
      j.title.toLowerCase().includes(jobSearch.toLowerCase()) || 
      (j.description && j.description.toLowerCase().includes(jobSearch.toLowerCase()));
    const matchesStatus = !jobStatusFilter || 
      (jobStatusFilter === 'open' && (j.job_status === 'open' || (j.is_open && j.approval_status === 'approved'))) || 
      (jobStatusFilter === 'closed' && (j.job_status === 'closed' || j.job_status === 'paused' || !j.is_open)) ||
      (jobStatusFilter === 'filled' && j.job_status === 'filled') ||
      (jobStatusFilter === 'completed' && j.job_status === 'completed') ||
      (j.job_status === jobStatusFilter);
    return matchesSearch && matchesStatus;
  });

  const totalJobPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE) || 1;
  const paginatedJobs = filteredJobs.slice((jobPage - 1) * JOBS_PER_PAGE, jobPage * JOBS_PER_PAGE);

  // Tự động ẩn đi các đơn ứng tuyển mà sinh viên đã chủ động hủy trước đó (FR 2.5.1 / 1.6.4)
  const validApplicants = applicants.filter(a => 
    a.application_status !== 'cancelled' && 
    a.application_status !== 'withdrawn' && 
    !a.is_cancelled
  );

  // Filter Kanban Candidates
  const filteredKanbanApplicants = validApplicants.filter(a => {
    const studentName = a.application_snapshot?.student_name || 'Vũ Thế Long';
    const matchesSearch = !kanbanSearch || 
      studentName.toLowerCase().includes(kanbanSearch.toLowerCase()) ||
      (a.job_title && a.job_title.toLowerCase().includes(kanbanSearch.toLowerCase()));
    const matchesJob = !kanbanJobFilter || a.job_id === kanbanJobFilter;
    return matchesSearch && matchesJob;
  });

  // Kanban Columns
  const pendingApps = filteredKanbanApplicants.filter(a => a.application_status === 'pending');
  const acceptedApps = filteredKanbanApplicants.filter(a => a.application_status === 'accepted' || a.application_status === 'interview');
  const rejectedApps = filteredKanbanApplicants.filter(a => a.application_status === 'rejected');

  // Sidebar Menu Items for Employer (5 Chức năng chính)
  const employerMenuItems = [
    { id: 'home', label: 'Trang Chủ', icon: <Home className="w-4 h-4" /> },
    { id: 'company', label: 'Hồ Sơ Doanh Nghiệp', icon: <Building2 className="w-4 h-4" /> },
    { id: 'jobs', label: 'Quản Lý Tin Tuyển Dụng', icon: <Briefcase className="w-4 h-4" />, count: myJobs.length },
    { id: 'applicants', label: 'Quản Lý Ứng Viên', icon: <Users className="w-4 h-4" />, count: applicants.length },
    { id: 'reviews', label: 'Đánh Giá Sinh Viên', icon: <Star className="w-4 h-4" />, count: reviews.length },
    { id: 'chat', label: 'Tin Nhắn & Phỏng Vấn', icon: <MessageSquare className="w-4 h-4" />, count: 1 }
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#030712] text-slate-100 min-h-[calc(100vh-80px)]">
      
      {/* ======================= LEFT SIDEBAR DOANH NGHIỆP ======================= */}
      <aside className={`w-64 bg-slate-950 border-r border-blue-900/30 flex flex-col shrink-0 transition-all ${
        mobileSidebarOpen ? 'fixed inset-y-0 left-0 z-50 shadow-2xl block' : 'hidden md:flex'
      }`}>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
            <span className="text-xs font-black tracking-wide text-white uppercase">Cổng Doanh Nghiệp</span>
          </div>
          <button 
            type="button" 
            onClick={onToggleMobileSidebar} 
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {employerMenuItems.map((item) => {
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  handleMenuSwitch(item.id);
                  if (item.id === 'jobs') setJobViewMode('list');
                  if (mobileSidebarOpen && onToggleMobileSidebar) onToggleMobileSidebar();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-lg shadow-blue-950/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-sky-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-sky-300 border border-slate-700'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ======================= WIDGET CHAT SIDEBAR DRAWER (UI-NTD-CHAT-01) ======================= */}
      {chatDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border-l border-blue-900/50 flex flex-col shadow-2xl h-full animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white uppercase">Hội Thoại Ứng Viên</h3>
              </div>
              <button 
                type="button" 
                onClick={onCloseChatDrawer} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thanh tìm kiếm hội thoại theo tên Sinh viên (FR 2.7.1) */}
            <div className="p-3 border-b border-slate-800/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên Sinh viên..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Danh sách các cuộc hội thoại với SV thật đã ứng tuyển (FR 2.7.2 & 2.9.1) */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
              {contacts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="font-semibold text-slate-400">Chưa có cuộc trò chuyện nào</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Danh bạ sẽ tự động xuất hiện khi có sinh viên ứng tuyển vào công việc của bạn.
                  </p>
                </div>
              ) : (
                contacts
                  .filter(c => !chatSearchQuery || c.name.toLowerCase().includes(chatSearchQuery.toLowerCase()))
                  .map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => {
                        setSelectedContact(contact);
                        handleMenuSwitch('chat');
                        if (onCloseChatDrawer) onCloseChatDrawer();
                      }}
                      className="w-full p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 transition-all text-left flex items-start gap-3 cursor-pointer group"
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                          {contact.name.charAt(0)}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                          contact.online ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}></span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white truncate group-hover:text-sky-300">{contact.name}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{contact.time}</span>
                        </div>
                        <p className="text-[11px] text-sky-400 font-medium truncate mt-0.5">{contact.subtitle}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{contact.lastMsg}</p>
                      </div>
                    </button>
                  ))
              )}
            </div>

            <div className="p-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => {
                  handleMenuSwitch('chat');
                  if (onCloseChatDrawer) onCloseChatDrawer();
                }}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-950/50"
              >
                Mở Toàn Màn Hình Chat & Video Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MAIN CONTENT AREA ======================= */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">

        {/* 1. MÀN HÌNH TRANG CHỦ DOANH NGHIỆP */}
        {activeMenu === 'home' && (
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Banner Doanh nghiệp */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-sky-950/60 border border-blue-900/40 p-6 sm:p-8 shadow-2xl">
              <div className="max-w-2xl relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Cổng Tuyển Dụng Doanh Nghiệp CDTN02</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {companyInfo.company_name}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Người đại diện: <strong className="text-sky-300">{companyInfo.representative_name}</strong> • Chi nhánh: {companyInfo.branch_name}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (employerRecord?.approval_status !== 'approved') {
                        notify('Hồ sơ GPKD của bạn chưa được Quản trị viên duyệt (hoặc bị từ chối). Vui lòng cập nhật GPKD hợp lệ để mở khóa chức năng đăng tin!', 'error');
                        setActiveMenu('company');
                        return;
                      }
                      setActiveMenu('jobs');
                      setJobViewMode('create');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-blue-950/60 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Đăng Tin Tuyển Dụng Mới</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMenuSwitch('applicants')}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Bảng Ứng Viên Tuyển Dụng ({applicants.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-blue-900/30 flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-400 font-bold uppercase">Tin Đang Tuyển Dụng</p>
                  <p className="text-2xl font-black text-white">{myJobs.filter(j => j.is_open).length}</p>
                  <p className="text-[10px] text-sky-400">{myJobs.length} tổng tin đã khởi tạo</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-sky-400 flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-blue-900/30 flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-400 font-bold uppercase">Tổng Hồ Sơ Ứng Tuyển</p>
                  <p className="text-2xl font-black text-white">{applicants.length}</p>
                  <p className="text-[10px] text-amber-400">
                    {applicants.filter(a => a.application_status === 'pending').length} hồ sơ đang chờ xét duyệt
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-blue-900/30 flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-400 font-bold uppercase">Đánh Giá Sinh Viên</p>
                  <p className="text-2xl font-black text-white">{reviews.length}</p>
                  <p className="text-[10px] text-yellow-400">Đánh giá 2 chiều sau hoàn thành</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center justify-center">
                  <Star className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Kanban Preview */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-blue-900/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>Ứng Viên Mới Cần Xử Lý Nhanh</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleMenuSwitch('applicants')}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Mở Bảng Ứng Viên</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingApps.slice(0, 2).map((app) => (
                  <div
                    key={app._id}
                    onClick={() => setSelectedApplicant(app)}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-amber-500/30 hover:border-amber-500/60 transition-all cursor-pointer flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{app.application_snapshot?.student_name || 'Vũ Thế Long'}</p>
                      <p className="text-[11px] text-sky-400">{app.job_title}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Nộp: {app.applied_at}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      Chờ duyệt
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 2. MÀN HÌNH HỒ SƠ DOANH NGHIỆP & GPKD (UI-NTD-PRO-01, 02 - 2.3.1 -> 2.3.5) */}
        {activeMenu === 'company' && (
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Khu vực Nhận diện thương hiệu: Cover & Logo (FR 2.3.3 - 2.3.5) */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-blue-900/30 shadow-2xl">
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
                className="relative h-48 sm:h-64 w-full bg-slate-950 group overflow-hidden"
              >
                <img
                  src={companyInfo.cover_image_url || DEFAULT_COVER_SVG}
                  alt="Ảnh bìa doanh nghiệp"
                  onError={(e) => { e.currentTarget.src = DEFAULT_COVER_SVG; }}
                  className="w-full h-full object-cover"
                />
                {isDraggingCover && (
                  <div className="absolute inset-0 z-20 bg-sky-950/80 border-4 border-dashed border-sky-400 flex flex-col items-center justify-center text-white">
                    <Upload className="w-10 h-10 text-sky-400 animate-bounce mb-2" />
                    <span className="font-bold text-sm">Thả ảnh bìa JPG/PNG vào đây ngay!</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <label className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg">
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
                    className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white cursor-pointer"
                    title="Xóa về Placeholder mặc định"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Logo công ty chồng lên góc ảnh bìa có hỗ trợ kéo thả */}
              <div className="px-6 pb-6 pt-4 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 relative z-10">
                <div className="flex items-end gap-4">
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingLogo(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingLogo(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingLogo(false);
                      if (e.dataTransfer.files?.[0]) handleMediaFileProcess('logo_url', e.dataTransfer.files[0]);
                    }}
                    className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-950 border-4 border-slate-900 shadow-2xl overflow-hidden group ${
                      isDraggingLogo ? 'ring-4 ring-sky-400 scale-105' : ''
                    }`}
                  >
                    <img
                      src={companyInfo.logo_url || DEFAULT_LOGO_SVG}
                      alt="Logo công ty"
                      onError={(e) => { e.currentTarget.src = DEFAULT_LOGO_SVG; }}
                      className="w-full h-full object-cover"
                    />
                    {isDraggingLogo && (
                      <div className="absolute inset-0 z-20 bg-sky-950/90 flex flex-col items-center justify-center text-white">
                        <Upload className="w-6 h-6 text-sky-400 animate-bounce" />
                        <span className="text-[10px] font-bold">Thả Logo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
                        className="p-2 rounded-xl bg-red-600 text-white cursor-pointer"
                        title="Xóa logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-2">
                    <h3 className="text-xl font-black text-white">{companyInfo.company_name}</h3>
                    <p className="text-xs text-sky-400 font-semibold">{companyInfo.branch_name}</p>
                    <p className="text-[11px] text-slate-400">Người đại diện: {companyInfo.representative_name}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingCompany(!isEditingCompany)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Edit className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isEditingCompany ? 'Hủy Sửa' : 'Chỉnh Sửa Thông Tin'}</span>
                </button>
              </div>

              {/* Progress bar upload media */}
              {isUploadingMedia && (
                <div className="px-6 pb-4 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Đang tải lên hình ảnh định dạng JPG/PNG...</span>
                    <span className="font-mono text-sky-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-sky-400 transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Khu vực Thông tin định danh & GPKD (FR 2.3.1, 2.3.2) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-blue-900/30 shadow-2xl space-y-6">
              
              {/* Trạng thái duyệt GPKD */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    GPKD
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Giấy Phép Kinh Doanh: {companyInfo.business_license}</p>
                    <p className="text-[11px] text-slate-400 font-mono">Tài liệu: {companyInfo.business_license_url}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCompanyGpkdViewer(true)}
                    className="ml-3 px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-sky-300 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem Bản In GPKD</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    employerRecord.approval_status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : (employerRecord.approval_status === 'rejected'
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40')
                  }`}>
                    {employerRecord.approval_status === 'approved' ? '✓ Đã Phê Duyệt Hợp Lệ' : (employerRecord.approval_status === 'rejected' ? '✕ Bị Từ Chối GPKD' : '⏳ Chờ Admin Duyệt')}
                  </span>
                </div>
              </div>

              {/* Form chỉnh sửa hoặc View chi tiết */}
              {isEditingCompany ? (
                <form onSubmit={handleSaveCompanyProfile} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Tên Doanh Nghiệp *</label>
                      <input
                        type="text"
                        required
                        value={companyForm.company_name}
                        onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Họ Tên Người Đại Diện *</label>
                      <input
                        type="text"
                        required
                        value={companyForm.representative_name}
                        onChange={(e) => setCompanyForm({ ...companyForm, representative_name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Tên Chi Nhánh Làm Việc *</label>
                      <input
                        type="text"
                        required
                        list="hcm-branches-company"
                        value={companyForm.branch_name}
                        onChange={(e) => setCompanyForm({ ...companyForm, branch_name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-sky-500"
                        placeholder="Chọn hoặc nhập chi nhánh..."
                      />
                      <datalist id="hcm-branches-company">
                        {HCM_BRANCH_SUGGESTIONS.map(b => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Mã Số GPKD *</label>
                      <input
                        type="text"
                        required
                        value={companyForm.business_license}
                        onChange={(e) => setCompanyForm({ ...companyForm, business_license: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-sky-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Quy Mô Công Ty *</label>
                      <select
                        value={companyForm.scale}
                        onChange={(e) => setCompanyForm({ ...companyForm, scale: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-sky-500"
                      >
                        <option value="10-50 nhân viên">10-50 nhân viên</option>
                        <option value="50-200 nhân viên">50-200 nhân viên</option>
                        <option value="200-500 nhân viên">200-500 nhân viên</option>
                        <option value="500+ nhân viên">500+ nhân viên</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Địa Chỉ Trụ Sở / Chi Nhánh (24 Quận Huyện TP.HCM) *</label>
                      <input
                        type="text"
                        required
                        list="hcm-districts-company"
                        value={companyForm.address}
                        onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-sky-500"
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
                    <label className="block font-bold text-slate-300 mb-1">Giới Thiệu Môi Trường Làm Việc *</label>
                    <textarea
                      rows={4}
                      value={companyForm.description}
                      onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-sky-500 leading-relaxed"
                    />
                  </div>

                  {/* Tải lại Giấy phép kinh doanh mới (FR 2.3.2) */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-200">
                        Tệp Giấy Phép Kinh Doanh Mới (.pdf ≤ 10MB)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCompanyGpkdViewer(true)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-sky-300 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-blue-600/40"
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
                      className="p-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-sky-500/60 bg-slate-900/60 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                    >
                      <Upload className="w-6 h-6 text-sky-400 mb-1.5 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-white">
                        {companyForm.new_gpkd_name 
                          ? `✓ Đã chọn: ${companyForm.new_gpkd_name}`
                          : (companyForm.business_license_url ? 'Nhấn để tải lại tệp GPKD mới thay thế' : 'Nhấn để chọn tệp GPKD (.pdf) từ thiết bị')}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Định dạng chấp nhận: PDF (kích thước tối đa 10MB)</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p>
                        <strong>Lưu ý quan trọng (FR 2.3.2):</strong> Khi bạn tải lại Giấy phép kinh doanh mới, hệ thống sẽ tự động chuyển trạng thái tài khoản về <strong>"Chờ duyệt"</strong> và đẩy yêu cầu duyệt hồ sơ sang Quản trị viên để kiểm tra tính hợp lệ.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingCompany(false)}
                      className="px-4 py-2 text-slate-400 hover:text-white"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-950/60 cursor-pointer"
                    >
                      Lưu Hồ Sơ Doanh Nghiệp
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-medium">Tên Doanh Nghiệp:</span>
                    <p className="text-sm font-bold text-white">{companyInfo.company_name}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-medium">Người Đại Diện Pháp Luật:</span>
                    <p className="text-sm font-bold text-sky-400">{companyInfo.representative_name}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-medium">Chi Nhánh Cửa Hàng:</span>
                    <p className="text-sm font-bold text-white">{companyInfo.branch_name}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-medium">Địa Chỉ Tuyển Dụng:</span>
                    <p className="text-sm font-bold text-white">{companyInfo.address}</p>
                  </div>
                  <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-medium">Giới Thiệu Doanh Nghiệp:</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{companyInfo.description}</p>
                  </div>
                  <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Giấy Phép Đăng Ký Kinh Doanh: {companyInfo.business_license || '0314567890'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">Tệp lưu trữ: {companyInfo.business_license_url ? companyInfo.business_license_url.split('/').pop() : 'GPKD_PhucLong_0314567890.pdf'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCompanyGpkdViewer(true)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Xem Nội Dung Chi Tiết GPKD</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* 3. MÀN HÌNH QUẢN LÝ TIN TUYỂN DỤNG & FORM ĐĂNG TIN (UI-NTD-JOB-01 -> 03 - 2.4.1 -> 2.4.8) */}
        {activeMenu === 'jobs' && (
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* SUBVIEW 1: FORM TẠO / SỬA TIN (UI-NTD-JOB-03) */}
            {(jobViewMode === 'create' || jobViewMode === 'edit') ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-blue-900/30 shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setJobViewMode('list')}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h3 className="text-base font-black text-white">
                        {jobViewMode === 'create' ? '+ Đăng Tin Tuyển Dụng Mới' : 'Chỉnh Sửa Tin Tuyển Dụng'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Áp dụng cho doanh nghiệp Phúc Long Coffee & Tea</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveJobSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Tiêu Đề Công Việc (Gợi ý ngành nghề linh hoạt) *</label>
                    <input
                      type="text"
                      required
                      list="hcm-professions-list"
                      placeholder="Ví dụ: Nhân viên Pha chế Barista & Phục vụ ca linh hoạt"
                      value={jobForm.title}
                      onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-sky-500"
                    />
                    <datalist id="hcm-professions-list">
                      {PROFESSION_SUGGESTIONS.map((p, idx) => (
                        <option key={idx} value={p} />
                      ))}
                    </datalist>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-300">Ngành Nghề Tuyển Dụng *</label>
                        <span className="text-[11px] text-sky-400 font-medium">Nhập tay hoặc chọn gợi ý dropdown</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          list="job-industry-suggestions"
                          value={jobForm.category_id}
                          onChange={(e) => setJobForm({ ...jobForm, category_id: e.target.value })}
                          placeholder="Nhập hoặc chọn ngành nghề tuyển dụng..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-sky-500 placeholder:text-slate-600"
                        />
                        <datalist id="job-industry-suggestions">
                          {categories.filter(c => c.type === 'job' || !c.type).map(c => (
                            <option key={c._id} value={c.name} />
                          ))}
                          {PROFESSION_SUGGESTIONS.map((p, idx) => (
                            <option key={`p-${idx}`} value={p} />
                          ))}
                        </datalist>
                      </div>
                      {/* Gợi ý chọn nhanh ngành nghề */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {categories.filter(c => c.type === 'job' || !c.type).slice(0, 6).map(c => (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => setJobForm({ ...jobForm, category_id: c.name })}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                              jobForm.category_id === c.name || jobForm.category_id === c._id
                                ? 'bg-sky-500 text-white shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Địa Điểm Làm Việc / Chi Nhánh (24 Quận Huyện TP.HCM) *</label>
                      <input
                        type="text"
                        required
                        list="hcm-job-branches"
                        placeholder="Chọn chi nhánh hoặc nhập địa chỉ quận..."
                        value={jobForm.location}
                        onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-sky-500"
                      />
                      <datalist id="hcm-job-branches">
                        {HCM_BRANCH_SUGGESTIONS.map((b, idx) => (
                          <option key={idx} value={b} />
                        ))}
                        {HCM_DISTRICTS.map((d, idx) => (
                          <option key={`d-${idx}`} value={`${d}, TP.HCM`} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Lương Tối Thiểu (VNĐ/giờ) *</label>
                      <input
                        type="number"
                        min={20000}
                        max={100000}
                        required
                        value={jobForm.salary_min}
                        onChange={(e) => setJobForm({ ...jobForm, salary_min: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-sky-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Lương Tối Đa (VNĐ/giờ) *</label>
                      <input
                        type="number"
                        min={20000}
                        max={100000}
                        required
                        value={jobForm.salary_max}
                        onChange={(e) => setJobForm({ ...jobForm, salary_max: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Ca làm việc linh hoạt có Dropdown gợi ý */}
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Ca Làm Việc Linh Hoạt (Chọn gợi ý hoặc tự điền) *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={jobForm.work_time}
                        onChange={(e) => setJobForm({ ...jobForm, work_time: e.target.value })}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-sky-500"
                      />
                      <select
                        onChange={(e) => e.target.value && setJobForm({ ...jobForm, work_time: e.target.value })}
                        className="w-44 bg-slate-800 border border-slate-700 rounded-xl px-2 text-white outline-none cursor-pointer"
                      >
                        <option value="">-- Gợi ý ca mẫu --</option>
                        {POPULAR_SHIFTS.map((s, idx) => (
                          <option key={idx} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Mô Tả Chi Tiết Công Việc & Yêu Cầu *</label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Mô tả công việc pha chế, phục vụ khách hàng, bảo quản nguyên vật liệu..."
                      value={jobForm.description}
                      onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-sky-500 leading-relaxed"
                    />
                  </div>

                  {jobFormMsg && (
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
                      {jobFormMsg}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setJobViewMode('list')}
                      className="px-4 py-2 text-slate-400 hover:text-white"
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-950/60 cursor-pointer"
                    >
                      {editingJob ? 'Lưu Cập Nhật Tin' : 'Đăng Tin Ngay'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* SUBVIEW 2: BẢNG DANH SÁCH TIN (UI-NTD-JOB-01 & 02) */
              <div className="space-y-4">
                
                {/* Thanh công cụ tìm kiếm, lọc & nút + Tạo tin */}
                <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/90 border border-blue-900/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={jobSearch}
                        onChange={(e) => setJobSearch(e.target.value)}
                        placeholder="Tìm tin tuyển dụng..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                      />
                    </div>

                    <select
                      value={jobStatusFilter}
                      onChange={(e) => setJobStatusFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                    >
                      {JOB_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value === 'all' ? '' : opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (employerRecord?.approval_status !== 'approved') {
                        notify('Hồ sơ GPKD của bạn chưa được Quản trị viên duyệt (hoặc bị từ chối). Vui lòng kiểm tra tại mục Hồ Sơ Doanh Nghiệp!', 'error');
                        setActiveMenu('company');
                        return;
                      }
                      setJobViewMode('create');
                      setEditingJob(null);
                      setJobForm({
                        title: '',
                        category_id: 'cat_1',
                        location: companyInfo.address || 'Quận 1, TP.HCM',
                        description: '',
                        salary_min: 28000,
                        salary_max: 35000,
                        is_negotiable: false,
                        work_time: 'Ca sáng: 07:00 - 11:30 (4.5 tiếng)'
                      });
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-blue-950/60 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Tạo Tin Tuyển Dụng</span>
                  </button>
                </div>

                {/* Bảng danh sách tin (Phân trang 10 dòng/trang - FR 2.4.3) - Nền Đậm Rõ Nét */}
                <div className="rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs bg-slate-900">
                      <thead className="bg-slate-950 text-slate-200 border-b border-slate-700 uppercase font-bold text-[10px]">
                        <tr>
                          <th className="p-4">Tiêu Đề Công Việc</th>
                          <th className="p-4">Mức Lương / Giờ</th>
                          <th className="p-4">Hồ Sơ Nộp</th>
                          <th className="p-4">Bật/Tắt Tuyển Dụng</th>
                          <th className="p-4">Tiến Độ Tuyển Dụng</th>
                          <th className="p-4 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {paginatedJobs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 bg-slate-900">
                              Chưa có tin tuyển dụng nào phù hợp.
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
                                className="bg-slate-900 hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-800"
                              >
                                <td className="p-4">
                                  <p className="font-bold text-white hover:text-sky-300">{job.title}</p>
                                  <p className="text-[11px] text-slate-400 mt-0.5">{job.work_time}</p>
                                </td>

                                <td className="p-4 font-mono font-bold text-sky-400">
                                  {job.is_negotiable ? 'Thỏa thuận' : `${job.salary_min?.toLocaleString()}đ - ${job.salary_max?.toLocaleString()}đ`}
                                </td>

                                <td className="p-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setKanbanJobFilter(job._id);
                                      setActiveMenu('applicants');
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-sky-300 border border-blue-500/40 font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
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
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                      job.is_open 
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                                        : 'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}
                                  >
                                    {job.is_open ? '🟢 Đang tuyển' : '⚪ Tạm đóng'}
                                  </button>
                                </td>

                                {/* Nút chuyển vòng đời: Đã nhận người -> Hoàn thành (FR 2.4.7) */}
                                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center gap-1.5">
                                    {job.job_status === 'active' && (
                                      <button
                                        type="button"
                                        onClick={() => handleAdvanceJobLifecycle(job, 'filled')}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                          approvedAppsCount >= 1
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-md'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                        }`}
                                        title={approvedAppsCount >= 1 ? 'Chuyển sang Đã nhận người' : 'Nhấp để xem điều kiện chuyển trạng thái'}
                                      >
                                        Đã nhận người
                                      </button>
                                    )}

                                    {job.job_status === 'filled' && (
                                      <button
                                        type="button"
                                        onClick={() => handleAdvanceJobLifecycle(job, 'completed')}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold border border-emerald-500 cursor-pointer"
                                        title="Chuyển sang Hoàn thành công việc"
                                      >
                                        ✓ Hoàn thành
                                      </button>
                                    )}

                                    {job.job_status === 'completed' && (
                                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/40">
                                        Đã Hoàn Thành
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Nút Xem chi tiết, Sửa & Xóa (FR 2.4.3, 2.4.6, 2.4.8) */}
                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedJobDetail(job)}
                                      className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-sky-300 border border-blue-500/30 cursor-pointer"
                                      title="Xem chi tiết tin tuyển dụng"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingJob(job);
                                        setJobForm({
                                          title: job.title,
                                          category_id: job.category_id || 'cat_1',
                                          location: job.location,
                                          description: job.description,
                                          salary_min: job.salary_min,
                                          salary_max: job.salary_max,
                                          is_negotiable: job.is_negotiable,
                                          work_time: job.work_time
                                        });
                                        setJobViewMode('edit');
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 cursor-pointer"
                                      title="Sửa tin"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteJob(job)}
                                       className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                        hasApps 
                                          ? 'bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border-slate-700' 
                                          : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400 cursor-pointer'
                                      }`}
                                       title={hasApps ? 'Tin đã có sinh viên ứng tuyển (Nhấp để xem chi tiết)' : 'Xóa tin tuyển dụng'}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
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
                    <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Trang {jobPage} / {totalJobPages}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={jobPage === 1}
                          onClick={() => setJobPage(p => Math.max(1, p - 1))}
                          className="px-3 py-1 rounded-lg bg-slate-800 text-xs disabled:opacity-40"
                        >
                          Trước
                        </button>
                        <button
                          type="button"
                          disabled={jobPage === totalJobPages}
                          onClick={() => setJobPage(p => Math.min(totalJobPages, p + 1))}
                          className="px-3 py-1 rounded-lg bg-slate-800 text-xs disabled:opacity-40"
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
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header thanh tìm kiếm & lọc theo tin tuyển dụng */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-blue-900/30 shadow-2xl space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-sky-400" />
                    <span>Bảng Quản Lý Ứng Viên (ATS)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Sàng lọc hồ sơ sinh viên, xem CV & Thư giới thiệu trực tiếp (Tự động ẩn đơn đã hủy - FR 2.5.1)</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCandidateViewMode('kanban')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      candidateViewMode === 'kanban' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Bảng Kanban
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateViewMode('table')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      candidateViewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>

                <select
                  value={kanbanJobFilter}
                  onChange={(e) => setKanbanJobFilter(e.target.value)}
                  className="w-full sm:w-72 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="">Tất cả tin tuyển dụng ({validApplicants.length} hồ sơ)</option>
                  {myJobs.map(j => {
                    const count = validApplicants.filter(a => a.job_id === j._id).length;
                    return (
                      <option key={j._id} value={j._id}>{j.title} ({count} hồ sơ)</option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* DẠNG BẢNG DANH SÁCH ỨNG VIÊN (FR 2.5.1 / 2.5.2) */}
            {candidateViewMode === 'table' && (
              <div className="rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-slate-900">
                    <thead className="bg-slate-950 text-slate-200 border-b border-slate-700 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-4">Ứng Viên Sinh Viên</th>
                        <th className="p-4">Vị Trí Tuyển Dụng</th>
                        <th className="p-4">Trường Đại Học</th>
                        <th className="p-4">Trạng Thái</th>
                        <th className="p-4">Ngày Nộp</th>
                        <th className="p-4 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredKanbanApplicants.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            Chưa có hồ sơ ứng viên nào phù hợp tiêu chí tìm kiếm.
                          </td>
                        </tr>
                      ) : (
                        filteredKanbanApplicants.map((app) => (
                          <tr key={app._id} className="bg-slate-900 hover:bg-slate-800/80 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-white text-xs">{app.application_snapshot?.student_name || 'Vũ Thế Long'}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{app.application_snapshot?.phone || '0987654321'}</p>
                            </td>
                            <td className="p-4 font-semibold text-sky-400">{app.job_title}</td>
                            <td className="p-4 text-slate-300">{app.application_snapshot?.university || 'Đại học Văn Lang'}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                app.application_status === 'accepted'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : (app.application_status === 'rejected'
                                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40')
                              }`}>
                                {app.application_status === 'accepted' ? '✓ Đã Duyệt' : (app.application_status === 'rejected' ? '✕ Từ Chối' : '⏳ Chờ Duyệt')}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400 font-mono text-[11px]">{app.applied_at || 'Mới nộp'}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedApplicant(app)}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-sky-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                  title="Xem chi tiết CV & Thư giới thiệu"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Xem CV</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartChatWithApplicant(app)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 cursor-pointer"
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
                                        target_title: `Ứng viên ${app.application_snapshot?.student_name || 'Vũ Thế Long'} (${app.job_title})`,
                                        application_id: app._id
                                      });
                                    }}
                                    className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                    title="Báo cáo vi phạm (Chỉ cho phép khi Đã duyệt)"
                                  >
                                    <Flag className="w-3 h-3 text-red-400" />
                                    <span>Báo cáo</span>
                                  </button>
                                ) : (
                                  <span 
                                    className="px-2 py-1 rounded-lg bg-slate-800/40 text-slate-600 text-[10px] font-medium border border-slate-800 cursor-not-allowed"
                                    title="Chỉ cho phép báo cáo đối với ứng viên đã có trạng thái 'Đã duyệt' theo quy định BR-NTD-06"
                                  >
                                    Báo cáo (Khóa)
                                  </span>
                                )}
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

            {/* BẢNG KANBAN 3 CỘT (Chờ duyệt, Đã duyệt, Từ chối) (FR 2.5.3) */}
            {candidateViewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* CỘT 1: CHỜ DUYỆT (PENDING) */}
              <div className="rounded-3xl bg-slate-900/80 border border-amber-500/30 p-4 space-y-3 flex flex-col shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">Chờ Duyệt</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black font-mono">
                    {pendingApps.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto min-h-[300px]">
                  {pendingApps.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Không có hồ sơ chờ duyệt.
                    </div>
                  ) : (
                    pendingApps.map((app) => (
                      <div
                        key={app._id}
                        onClick={() => setSelectedApplicant(app)}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer shadow-lg space-y-2 group"
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-xs font-bold text-white group-hover:text-sky-300">{app.application_snapshot?.student_name || 'Vũ Thế Long'}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{app.applied_at}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{app.job_title}</p>
                        <p className="text-[10px] text-slate-500">{app.application_snapshot?.university || 'Đại học Văn Lang'}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartChatWithApplicant(app);
                            }}
                            className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Nhắn tin</span>
                          </button>
                          <span 
                            className="text-[10px] text-slate-600 cursor-not-allowed"
                            title="Chỉ cho phép báo cáo ứng viên đã có trạng thái 'Đã duyệt' theo quy định BR-NTD-06"
                          >
                            Báo cáo (Khóa)
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CỘT 2: ĐÃ DUYỆT (ACCEPTED) */}
              <div className="rounded-3xl bg-slate-900/80 border border-emerald-500/30 p-4 space-y-3 flex flex-col shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">Đã Duyệt</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black font-mono">
                    {acceptedApps.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto min-h-[300px]">
                  {acceptedApps.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Chưa có hồ sơ được duyệt.
                    </div>
                  ) : (
                    acceptedApps.map((app) => (
                      <div
                        key={app._id}
                        onClick={() => setSelectedApplicant(app)}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer shadow-lg space-y-2 group relative"
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-xs font-bold text-white group-hover:text-emerald-300">{app.application_snapshot?.student_name || 'Vũ Thế Long'}</p>
                          <span className="text-emerald-400 font-bold text-[10px]">✓ Đã Phê Duyệt</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{app.job_title}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                          <span>{app.application_snapshot?.phone || '0987654321'}</span>
                          <span>{app.application_snapshot?.university || 'Đại học Văn Lang'}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartChatWithApplicant(app);
                            }}
                            className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Nhắn tin</span>
                          </button>
                          
                          {/* Nút Báo cáo ứng viên vi phạm nghiêm ngặt theo FR 2.5.6 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportModalData({
                                type: 'applicant',
                                target_id: app.student_user_id || app.student_id,
                                target_title: `Ứng viên ${app.application_snapshot?.student_name || 'Vũ Thế Long'} (${app.job_title})`,
                                application_id: app._id
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Báo cáo vi phạm đối với ứng viên đã duyệt (ví dụ: bùng việc, vô trách nhiệm)"
                          >
                            <Flag className="w-3 h-3 text-red-400" />
                            <span>Báo Cáo Vi Phạm</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CỘT 3: TỪ CHỐI (REJECTED) */}
              <div className="rounded-3xl bg-slate-900/80 border border-red-500/30 p-4 space-y-3 flex flex-col shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-red-500/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                    <h4 className="text-xs font-bold text-red-300 uppercase tracking-wide">Từ Chối</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs font-black font-mono">
                    {rejectedApps.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto min-h-[300px]">
                  {rejectedApps.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Không có hồ sơ bị từ chối.
                    </div>
                  ) : (
                    rejectedApps.map((app) => (
                      <div
                        key={app._id}
                        onClick={() => setSelectedApplicant(app)}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 transition-all cursor-pointer opacity-70 hover:opacity-100 space-y-2"
                      >
                        <p className="text-xs font-bold text-white">{app.application_snapshot?.student_name || 'Vũ Thế Long'}</p>
                        <p className="text-[11px] text-slate-400">{app.job_title}</p>
                        {app.reject_reason && (
                          <p className="text-[10px] text-red-300 italic">Lý do: {app.reject_reason}</p>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartChatWithApplicant(app);
                            }}
                            className="text-[11px] text-slate-400 hover:text-white font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Xem lịch sử chat (Chỉ đọc)</span>
                          </button>
                          <span 
                            className="text-[10px] text-slate-600 cursor-not-allowed"
                            title="Chỉ cho phép báo cáo ứng viên đã có trạng thái 'Đã duyệt' theo quy định BR-NTD-06"
                          >
                            Báo cáo (Khóa)
                          </span>
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

        {/* 5. MÀN HÌNH ĐÁNH GIÁ SINH VIÊN (UI-NTD-REV-01 -> 03 - 2.6.1 -> 2.6.4) */}
        {activeMenu === 'reviews' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-blue-900/30 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span>Đánh Giá Hiệu Suất Sinh Viên</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Đánh giá và cấp điểm uy tín cho sinh viên sau khi hoàn thành công việc</p>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewTab('pending')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reviewTab === 'pending' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sinh Viên Chờ Đánh Giá ({acceptedApps.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewTab('history')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reviewTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lịch Sử Đánh Giá ({reviews.length})
                </button>
              </div>
            </div>

            {/* TAB CHỜ ĐÁNH GIÁ (2.6.1, 2.6.2) */}
            {reviewTab === 'pending' && (
              <div className="space-y-4">
                {acceptedApps.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-500">
                    Chưa có sinh viên nào trong danh sách đã hoàn thành công việc cần đánh giá.
                  </div>
                ) : (
                  acceptedApps.map((app) => (
                    <div
                      key={app._id}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-blue-900/30 flex items-center justify-between gap-4 shadow-xl"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-white">{app.application_snapshot?.student_name || 'Vũ Thế Long'}</h4>
                        <p className="text-xs font-semibold text-sky-400 mt-0.5">Vị trí: {app.job_title}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">SĐT: {app.application_snapshot?.phone || '0987654321'}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setReviewModalApp(app);
                          setReviewScore(5);
                          setReviewNote('');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-yellow-950/60 cursor-pointer flex items-center gap-1.5"
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
                  <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-500">
                    Chưa có đánh giá nào được gửi đi.
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-blue-900/30 shadow-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-yellow-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${s <= rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-700'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-white">({rev.rating}/5 sao)</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{rev.created_at}</span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        "{rev.comment}"
                      </p>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        {/* Nút Xem Chi Tiết Đánh Giá (FR 2.6.3) */}
                        <button
                          type="button"
                          onClick={() => setSelectedReviewDetail(rev)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem Chi Tiết Đánh Giá</span>
                        </button>

                        {rev.is_hidden ? (
                          <span className="text-red-400 font-bold text-xs bg-red-950/60 px-3 py-1.5 rounded-xl border border-red-800/50">
                            ✕ Đánh giá bị Quản trị viên ẩn do vi phạm (Không thể chỉnh sửa)
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
                                application_snapshot: { student_name: rev.student_name || 'Vũ Thế Long' }
                              });
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-sky-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Chỉnh Sửa Đánh Giá</span>
                          </button>
                        )}
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
          <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col rounded-3xl bg-slate-900 border border-blue-900/40 shadow-2xl overflow-hidden">
            {!selectedContact ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/80">
                <div className="w-20 h-20 rounded-3xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5 shadow-xl">
                  <MessageSquare className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Chưa Có Cuộc Trò Chuyện Nào
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
                  Tài khoản của bạn hiện chưa có sinh viên nào nộp hồ sơ ứng tuyển. Khi có sinh viên ứng tuyển vào công việc bạn đăng, danh bạ và tin nhắn sẽ tự động xuất hiện tại đây.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveMenu('applicants')}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>Xem Danh Sách Ứng Viên ({applicants.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMenu('jobs_create')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-900/40 flex items-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Đăng Tin Tuyển Dụng Mới</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
            {/* Header chat: Tên sinh viên, Trạng thái, Nút Tạo tin nhắn mới, Camera WebRTC, Cờ báo cáo */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    {selectedContact?.name?.charAt(0) || 'V'}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                    selectedContact?.online ? 'bg-emerald-500' : 'bg-slate-500'
                  }`}></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{selectedContact?.name || 'Vũ Thế Long'}</h4>
                    {isChatReadOnly && (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>CHỈ ĐỌC</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-emerald-400 font-medium">
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
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
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
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-sky-400 border border-slate-700 hover:border-sky-500/50 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  title={isChatReadOnly ? 'Chỉ đọc: Không thể gọi khi đơn ứng tuyển đã bị từ chối/hủy' : 'Gọi thoại trực tiếp với Ứng viên'}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Gọi Thoại</span>
                </button>

                <button
                  type="button"
                  disabled={isChatReadOnly}
                  onClick={() => handleStartCall('video')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-blue-950/60 flex items-center gap-1.5 cursor-pointer"
                  title={isChatReadOnly ? 'Chỉ đọc: Không thể gọi khi đơn ứng tuyển đã bị từ chối/hủy' : 'Bắt đầu gọi phỏng vấn trực tuyến qua WebRTC'}
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Gọi Video Phỏng Vấn</span>
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
                      target_title: `Hội thoại với ${selectedContact?.name || 'Vũ Thế Long'}`
                    });
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Báo cáo ứng viên vi phạm tiêu chuẩn hội thoại"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* GIAO DIỆN PHỎNG VẤN TRỰC TUYẾN 2 CHIỀU (UI-NTD-CALL-01) */}
            {isVideoCalling ? (
              <div className="flex-1 bg-black relative flex flex-col items-center justify-center p-4">
                <div className="w-full h-full max-w-4xl max-h-[70vh] rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden shadow-2xl">
                  {callStatus === 'calling' ? (
                    <div className="text-center space-y-4">
                      <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                        <span className="absolute inset-0 rounded-full bg-sky-500/20 animate-ping"></span>
                        <div className="w-20 h-20 rounded-full bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-2xl">
                          {callType === 'video' ? <Video className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">Đang đổ chuông tới Ứng viên ({selectedContact?.name || 'Vũ Thế Long'})...</h3>
                        <p className="text-xs text-slate-400 mt-1">Vui lòng chờ ứng viên kết nối vào phòng phỏng vấn</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="w-24 h-24 rounded-full bg-blue-600/30 border border-blue-500/50 text-sky-300 font-black text-3xl flex items-center justify-center mx-auto animate-pulse">
                        {selectedContact?.name ? selectedContact.name.split(' ').map(n=>n[0]).slice(-2).join('').toUpperCase() : 'VL'}
                      </div>
                      <p className="text-sm font-bold text-white">
                        {callType === 'video' ? `Đang phỏng vấn Video trực tuyến: ${selectedContact?.name || 'Vũ Thế Long'}` : `Đang thực hiện cuộc gọi Thoại phỏng vấn: ${selectedContact?.name || 'Vũ Thế Long'}`}
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Thời lượng: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                  )}

                  {/* Local Camera stream nếu là Video Call */}
                  {callType === 'video' && !isCameraOff && (
                    <div className="absolute bottom-4 right-4 w-44 h-32 rounded-2xl bg-slate-950 border-2 border-sky-400/80 overflow-hidden shadow-2xl">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-2 text-[9px] font-bold text-white bg-black/60 px-1 rounded">
                        {isPhucLongDemo ? 'Bạn (Huỳnh Nguyễn Bảo Ngọc)' : `Bạn (${companyInfo?.representative_name || 'Nhà tuyển dụng'})`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Nút điều khiển cuộc gọi */}
                <div className="flex items-center gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3.5 rounded-full cursor-pointer transition-all ${
                      isMuted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                    title={isMuted ? 'Bật Mic' : 'Tắt Mic'}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {callType === 'video' && (
                    <button
                      type="button"
                      onClick={() => setIsCameraOff(!isCameraOff)}
                      className={`p-3.5 rounded-full cursor-pointer transition-all ${
                        isCameraOff ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                      title={isCameraOff ? 'Mở Camera' : 'Tắt Camera'}
                    >
                      {isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleEndCall(true)}
                    className="p-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-lg shadow-red-950/60"
                    title="Kết thúc phỏng vấn"
                  >
                    <Phone className="w-5 h-5 rotate-[135deg]" />
                  </button>
                </div>
              </div>
            ) : (
              /* KHUNG TIN NHẮN TRÒ CHUYỆN (FR 2.7.3 & 2.9.2 - 2.9.3) */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((m) => {
                    if (m.type === 'call_record') {
                      const isOutgoing = m.caller_role === 'employer' || m.caller_id === currentUser?._id;
                      const isMissed = m.call_status === 'missed';
                      const callTypeLabel = m.call_type === 'video' ? 'Video' : 'Thoại';

                      if (isMissed) {
                        return (
                          <div key={m._id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} my-2.5`}>
                            <div className="bg-[#181d2f] border border-red-500/40 rounded-2xl p-3 shadow-xl max-w-sm flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/40 shadow-inner">
                                  <Phone className="w-5 h-5 rotate-[135deg]" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white">
                                    {isOutgoing ? `Bạn đã gọi ${callTypeLabel} (Không trả lời)` : `Đã nhỡ cuộc gọi ${callTypeLabel}`}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{m.created_at}</p>
                                </div>
                              </div>
                              {!isOutgoing && (
                                <button
                                  type="button"
                                  onClick={() => handleStartCall(m.call_type || 'video')}
                                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-950/60 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 hover:scale-105 active:scale-95"
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
                              ? 'bg-blue-900/30 text-sky-300 border-sky-500/40 rounded-br-sm' 
                              : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 rounded-bl-sm'
                          }`}>
                            <Phone className={`w-3.5 h-3.5 ${isOutgoing ? 'text-sky-400' : 'text-emerald-400'}`} />
                            <span>
                              {isOutgoing ? `Cuộc gọi đi (${callTypeLabel})` : `Cuộc gọi đến (${callTypeLabel})`} • {m.duration_str || '0:00'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono ml-1">({m.created_at})</span>
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
                          <span className="text-[10px] font-bold text-slate-400">
                            {isMe ? 'Bạn (Huỳnh Nguyễn Bảo Ngọc)' : 'Vũ Thế Long (Ứng viên)'}
                          </span>
                          <span className="text-[9px] text-slate-600 font-mono">{m.created_at}</span>
                        </div>

                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isMe 
                              ? 'bg-blue-600 text-white rounded-br-sm shadow-md shadow-blue-950/50' 
                              : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content || m.clean_content}</p>
                          {m.is_flagged && (
                            <div className="mt-2 p-2 rounded-xl bg-red-950/80 border border-red-500/50 text-[11px] text-red-200 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold flex items-center gap-1 text-red-400">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  Cảnh báo từ ngữ cấm:
                                </span>
                                {!isMe && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const words = m.flagged_words && m.flagged_words.length > 0 ? m.flagged_words.join(', ') : 'đặt cọc';
                                      setReportReason(`Phát hiện tin nhắn vi phạm chứa từ cấm [${words}]: "${m.original_content || m.content}"`);
                                      setReportModalData({
                                        type: 'chat',
                                        target_id: m.sender_id || 'emp_user_employer_ngoc',
                                        target_title: `Báo cáo tin nhắn từ ${m.sender_name || 'Doanh nghiệp'}`
                                      });
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-[10px] shadow cursor-pointer transition-colors"
                                  >
                                    Báo cáo vi phạm
                                  </button>
                                )}
                              </div>
                              <p className="text-[10px] text-red-300 font-mono">
                                Từ khóa phát hiện: <span className="bg-red-900/80 px-1 py-0.5 rounded text-white font-bold">{m.flagged_words && m.flagged_words.length > 0 ? m.flagged_words.join(', ') : 'đặt cọc'}</span>
                              </p>
                            </div>
                          )}

                          {/* Render Tệp Hình Ảnh Đính Kèm Thực Tế */}
                          {m.media_url && (m.file_name?.match(/\.(png|jpe?g|webp)$/i) || m.media_url?.startsWith('data:image')) && (
                            <div 
                              onClick={() => setChatPreviewDoc({ fileUrl: m.media_url, fileName: m.file_name || 'Hinh_Anh.jpg', title: 'Tệp Hình Ảnh Đính Kèm' })}
                              className="mt-2 rounded-xl overflow-hidden border border-white/20 max-w-[260px] cursor-pointer hover:opacity-95 transition-opacity shadow-md"
                            >
                              <img src={m.media_url} alt={m.file_name || 'Ảnh đính kèm'} className="w-full max-h-[180px] object-cover bg-black" />
                              <div className="p-1.5 bg-black/70 text-[10px] text-white flex items-center justify-between">
                                <span className="truncate max-w-[180px]">{m.file_name || 'Ảnh đính kèm'}</span>
                                <Eye className="w-3.5 h-3.5 text-sky-300" />
                              </div>
                            </div>
                          )}

                          {/* Render Tệp PDF Đính Kèm Thực Tế */}
                          {m.media_url && (m.file_name?.toLowerCase().endsWith('.pdf') || m.media_url?.includes('pdf') || m.media_url?.startsWith('data:application/pdf')) && (
                            <div className="mt-2 p-2.5 rounded-xl bg-slate-950/90 border border-red-500/40 flex items-center justify-between gap-3 text-xs max-w-[280px]">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white truncate text-[11px]">{m.file_name || 'TaiLieu.pdf'}</p>
                                  <span className="text-[10px] text-slate-400 font-mono">Tài liệu PDF (≤10MB)</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setChatPreviewDoc({ fileUrl: m.media_url, fileName: m.file_name || 'TaiLieu.pdf', title: 'Tài Liệu PDF Đính Kèm' })}
                                  className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  Xem
                                </button>
                                <a
                                  href={m.media_url}
                                  download={m.file_name || 'TaiLieu.pdf'}
                                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                  title="Tải về máy tính"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          )}

                          {m.is_flagged && (
                            <span className="inline-block mt-2 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                              ⚠️ Tin nhắn chứa từ khóa vi phạm: {Array.isArray(m.flagged_words) ? m.flagged_words.join(', ') : 'Cấm'}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5 px-1">Đã gửi</span>
                      </div>
                    );
                  })}
                </div>

                {/* Chip Preview Tệp Đính Kèm Trước Khi Gửi */}
                {chatAttachment && (
                  <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 text-xs text-sky-300">
                      <Paperclip className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="font-bold text-white truncate max-w-xs">{chatAttachment.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({chatAttachment.sizeStr})</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold uppercase">Sẵn sàng gửi</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChatAttachment(null)}
                      className="p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Hủy đính kèm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Chế độ Chỉ Đọc (Read-Only) hoặc Form gửi tin nhắn (FR 2.7.1 & 2.7.2) */}
                {isChatReadOnly ? (
                  <div className="p-4 bg-slate-950 border-t border-red-500/40 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-red-300">Cuộc trò chuyện đang ở chế độ CHỈ ĐỌC (Read-Only)</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Đơn ứng tuyển của sinh viên đã bị "Từ chối" hoặc "Đã hủy" (hoặc tài khoản đang bị khóa). Theo quy định ràng buộc FR 2.7.1, hệ thống không cho phép gửi thêm tin nhắn hay gọi điện.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
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
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-400 hover:text-purple-300 border border-slate-800 transition-colors cursor-pointer shrink-0"
                      title="Đính kèm tệp PDF hoặc ảnh (≤ 10MB)"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    {/* Nút chèn nhanh link phỏng vấn trực tuyến (FR 2.7.1) */}
                    <button
                      type="button"
                      onClick={handleInsertInterviewLink}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-sky-300 border border-slate-800 transition-colors cursor-pointer shrink-0"
                      title="Gửi liên kết phỏng vấn trực tuyến (Meet / WebRTC)"
                    >
                      <Link className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={newMsgText}
                      onChange={(e) => setNewMsgText(e.target.value)}
                      placeholder="Nhập phản hồi tới ứng viên hoặc gửi link phỏng vấn... (Hệ thống tự lọc từ cấm ***)"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMsgText.trim() && !chatAttachment}
                      className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-blue-950/50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </>
            )}
              </>
            )}

          </div>
        )}

      </main>

      {/* ======================= MODAL XEM ĐÔI CV & THƯ GIỚI THIỆU (UI-NTD-CAND-02 - 2.5.4, 2.5.5) ======================= */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-900/50 rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">
                  Hồ Sơ Ứng Viên: {selectedApplicant.application_snapshot?.student_name || 'Vũ Thế Long'}
                </h3>
                <p className="text-xs text-sky-400 font-semibold mt-0.5">Vị trí: {selectedApplicant.job_title}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedApplicant(null)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thân Modal chia 2 nửa màn hình (Trái: Chi Tiết CV Ứng Viên | Phải: Thư giới thiệu) (FR 2.5.3 & 2.5.4) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden">
              
              {/* NỬA TRÁI: HỒ SƠ CV ỨNG VIÊN TRỰC DIỆN (FR 2.5.3, 2.5.4) */}
              <div className="p-6 bg-slate-950 flex flex-col space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-600/20 text-sky-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Hồ Sơ Năng Lực & Tệp CV Gốc</h4>
                      <p className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">
                        {selectedApplicant.application_snapshot?.cv_name || 'CV_VuTheLong_CNTT.pdf'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadApplicantCv(selectedApplicant)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                      title="Tải tệp PDF CV về máy tính"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải Về Máy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplicantCvViewer(selectedApplicant)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 cursor-pointer"
                      title="Xem toàn màn hình"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Khung nội dung chi tiết bản trích xuất CV cố định lưu tại thời điểm nộp (FR 1.5.6) */}
                <div className="flex-1 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 text-xs text-slate-200">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white font-black text-lg flex items-center justify-center shadow-md">
                      {(selectedApplicant.application_snapshot?.student_name || 'V').charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{selectedApplicant.application_snapshot?.student_name || 'Vũ Thế Long'}</h3>
                      <p className="text-sky-400 text-[11px] font-semibold">{selectedApplicant.application_snapshot?.major || 'Công nghệ thông tin'}</p>
                      <p className="text-[11px] text-slate-400">{selectedApplicant.application_snapshot?.university || 'Trường Đại học Văn Lang'}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thông Tin Liên Hệ</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Số điện thoại:</span>
                        <span className="font-mono font-bold text-white">{selectedApplicant.application_snapshot?.phone || '0987654321'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Email sinh viên:</span>
                        <span className="font-mono font-bold text-white truncate block">{selectedApplicant.student_email || 'vuthelong@vlu.edu.vn'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mục Tiêu & Điểm Mạnh</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-950 border border-slate-800">
                      Sinh viên năm cuối năng nổ, có tinh thần trách nhiệm cao, sẵn sàng làm việc xoay ca linh hoạt và cam kết gắn bó lâu dài tại môi trường F&B chuyên nghiệp.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kỹ Năng Thực Tế</span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-sky-300 border border-blue-500/30 text-[10px]">Giao tiếp & Phục vụ</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-sky-300 border border-blue-500/30 text-[10px]">Thao tác máy POS</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-sky-300 border border-blue-500/30 text-[10px]">Đúng giờ & Kỷ luật</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-sky-300 border border-blue-500/30 text-[10px]">Tiếng Anh giao tiếp cơ bản</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* NỬA PHẢI: NỘI DUNG THƯ GIỚI THIỆU (COVER LETTER) (2.5.4) */}
              <div className="p-6 bg-slate-900 flex flex-col space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <span>Lời Nhắn & Thư Giới Thiệu Của Sinh Viên</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Bản sao cố định lúc nộp đơn</span>
                </div>
                
                <div className="flex-1 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line shadow-inner">
                  {selectedApplicant.application_snapshot?.cover_note || 
                   'Kính gửi Quý Doanh nghiệp! Em tên là Vũ Thế Long, sinh viên năm 4 khoa Công nghệ Thông tin - Trường Đại học Văn Lang. Em có tinh thần trách nhiệm cao, có thể sắp xếp ca làm linh hoạt và mong muốn được cống hiến lâu dài tại Phúc Long.'}
                </div>
              </div>

            </div>

            {/* DƯỚI LÀ CÁC NÚT THAO TÁC: DUYỆT / TỪ CHỐI / NHẮN TIN / BÁO CÁO (2.5.5, 2.5.6) */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">
                  Trạng thái: <strong className="text-white uppercase">
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
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Nhắn Tin Tuyển Dụng</span>
                </button>

                {/* Báo cáo vi phạm: Ràng buộc nghiêm ngặt chỉ mở khi application_status === 'accepted' */}
                {selectedApplicant.application_status === 'accepted' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReportModalData({
                        type: 'applicant',
                        target_id: selectedApplicant.student_user_id || selectedApplicant.student_id,
                        target_title: `Ứng viên ${selectedApplicant.application_snapshot?.student_name || 'Vũ Thế Long'} (${selectedApplicant.job_title})`,
                        application_id: selectedApplicant._id
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    title="Báo cáo vi phạm đối với ứng viên đã duyệt (ví dụ: bùng việc, vô trách nhiệm)"
                  >
                    <Flag className="w-3.5 h-3.5 text-red-400" />
                    <span>Báo Cáo Vi Phạm</span>
                  </button>
                ) : (
                  <span 
                    className="px-2.5 py-1 rounded-xl bg-slate-800/40 text-slate-600 text-xs font-medium border border-slate-800 cursor-not-allowed flex items-center gap-1"
                    title="Chỉ cho phép báo cáo đối với ứng viên đã có trạng thái 'Đã duyệt' theo quy định BR-NTD-06"
                  >
                    <Flag className="w-3.5 h-3.5 text-slate-600" />
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
                      message: `Xác nhận từ chối hồ sơ của ứng viên "${selectedApplicant.application_snapshot?.student_name || 'Vũ Thế Long'}"? Lý do mặc định: "Chưa phù hợp với yêu cầu ca làm hiện tại".`,
                      type: 'danger',
                      confirmText: 'Từ Chối Hồ Sơ',
                      cancelText: 'Hủy Bỏ',
                      onConfirm: () => {
                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        handleUpdateApplicantStatus(selectedApplicant._id, 'rejected', 'Chưa phù hợp với yêu cầu ca làm hiện tại');
                      }
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-950/60 cursor-pointer flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Từ Chối (Đỏ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleUpdateApplicantStatus(selectedApplicant._id, 'accepted', 'Nhà tuyển dụng phê duyệt trúng tuyển');
                  }}
                  className="px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-950/60 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Duyệt Hồ Sơ (Xanh)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================= MODAL BÁO CÁO VI PHẠM (FR 2.5.6 & 2.7.5) ======================= */}
      {reportModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-black text-white">Báo Cáo Vi Phạm (Ticket)</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setReportModalData(null)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Đối tượng: <strong className="text-white">{reportModalData.target_title}</strong>
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-3">
              {reportModalData.type === 'applicant' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Lý do khiếu nại vi phạm (FR 2.5.6) *
                  </label>
                  <select
                    value={reportReasonType}
                    onChange={(e) => setReportReasonType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500 mb-2 font-medium"
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
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mô tả chi tiết nội dung khiếu nại gửi Quản trị viên (FR 3.8.2) *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Mô tả cụ thể vi phạm của sinh viên..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-red-500 leading-relaxed"
                />
              </div>

              {reportSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs">
                  {reportSuccessMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalData(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-950/60 cursor-pointer"
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
          <div className="bg-slate-900 border border-blue-900/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-white">Đánh Giá Năng Lực Sinh Viên</h3>
                <p className="text-xs text-sky-400 font-semibold mt-0.5">{reviewModalApp.application_snapshot?.student_name || 'Vũ Thế Long'}</p>
                <p className="text-[11px] text-slate-400">{reviewModalApp.job_title}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setReviewModalApp(null)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewStudentSubmit} className="space-y-4">
              <div className="space-y-1 text-center py-2">
                <label className="block text-xs font-bold text-slate-300 mb-2">Chấm Điểm Đánh Giá</label>
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
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-yellow-400 block mt-1">
                  {reviewScore}/5 sao
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">Nhận xét tác phong làm việc (&lt; 1.000 ký tự) *</label>
                  <span className={`text-[10px] font-mono ${reviewNote.length >= 1000 ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-sky-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalApp(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-black shadow-lg shadow-yellow-950/60 cursor-pointer"
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
          studentName: applicantCvViewer?.application_snapshot?.student_name || 'Vũ Thế Long',
          major: applicantCvViewer?.application_snapshot?.major || 'Công nghệ thông tin',
          university: applicantCvViewer?.application_snapshot?.university || 'Trường Đại học Văn Lang',
          phone: applicantCvViewer?.application_snapshot?.phone || '0987654321',
          email: applicantCvViewer?.student_email || 'vuthelong@vlu.edu.vn',
          fileName: applicantCvViewer?.application_snapshot?.cv_name || 'CV_VuTheLong_CNTT.pdf',
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
          companyName: companyInfo.company_name || 'CÔNG TY CỔ PHẦN PHÚC LONG HERITAGE',
          repName: companyInfo.representative_name || 'Huỳnh Nguyễn Bảo Ngọc',
          licenseNumber: companyInfo.business_license || '0314567890',
          address: companyInfo.address || '42 Ngô Đức Kế, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
          fileUrl: companyInfo.business_license_url,
          fileName: 'GPKD_PhucLong_0314567890.pdf'
        }}
        onDownloadSuccess={(msg) => onShowBanner && onShowBanner(msg, 'success')}
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
              <h3 className="text-lg font-black text-white">{incomingCall.caller_name || 'Sinh viên Vũ Thế Long'}</h3>
              <p className="text-xs text-slate-400 mt-1">
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
                <span>Từ Chối</span>
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

      {/* ======================= MODAL XEM CHI TIẾT TIN TUYỂN DỤNG (FR 2.4.3) ======================= */}
      {selectedJobDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    selectedJobDetail.status === 'open' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    selectedJobDetail.status === 'closed' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    selectedJobDetail.status === 'filled' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {selectedJobDetail.status === 'open' ? 'Đang tuyển' :
                     selectedJobDetail.status === 'closed' ? 'Tạm đóng' :
                     selectedJobDetail.status === 'filled' ? 'Đã nhận người' : 'Hoàn thành'}
                  </span>
                  <span className="text-xs text-sky-400 font-semibold">{selectedJobDetail.category_name || selectedJobDetail.job_type || 'Dịch vụ & F&B'}</span>
                </div>
                <h3 className="text-lg font-black text-white">{selectedJobDetail.title}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedJobDetail.address || 'Chi nhánh Quận 1'}, {selectedJobDetail.district || 'Quận 1'}, TP. Hồ Chí Minh</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedJobDetail(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mức Lương</span>
                  <p className="text-xs font-black text-emerald-400 mt-0.5">
                    {selectedJobDetail.salary_display || (selectedJobDetail.hourly_rate ? `${selectedJobDetail.hourly_rate.toLocaleString('vi-VN')} đ/h` : 'Lương thỏa thuận')}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Số Lượng Tuyển</span>
                  <p className="text-xs font-black text-sky-400 mt-0.5">
                    {selectedJobDetail.vacancies_count || 3} nhân sự
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hồ Sơ Hợp Lệ</span>
                  <p className="text-xs font-black text-indigo-400 mt-0.5">
                    {validApplicants.filter(a => a.job_id === selectedJobDetail._id || a.job_title === selectedJobDetail.title).length} ứng viên
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hình Thức Ca</span>
                  <p className="text-xs font-black text-amber-400 mt-0.5">
                    {selectedJobDetail.working_time || 'Ca linh hoạt 4h-6h'}
                  </p>
                </div>
              </div>

              {/* Ca làm việc */}
              {selectedJobDetail.shifts && selectedJobDetail.shifts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <span>Lịch & Khung Giờ Ca Làm Việc</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJobDetail.shifts.map((s, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sky-300 text-xs font-medium">
                        {typeof s === 'string' ? s : `${s.name || 'Ca'}: ${s.start_time || '08:00'} - ${s.end_time || '14:00'}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mô tả công việc */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">Mô Tả Chi Tiết Công Việc (FR 2.4.3)</h4>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedJobDetail.description || 'Thực hiện pha chế đồ uống theo tiêu chuẩn của Phúc Long, phục vụ và tư vấn menu cho khách hàng, dọn dẹp vệ sinh khu vực quầy bar và bàn khách, phối hợp làm việc theo ca.'}
                </div>
              </div>

              {/* Yêu cầu ứng viên */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">Yêu Cầu Năng Lực & Trách Nhiệm</h4>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedJobDetail.requirements || '- Sinh viên các trường Đại học / Cao đẳng, có tinh thần trách nhiệm cao.\n- Nhanh nhẹn, trung thực, giao tiếp niềm nở với khách hàng.\n- Có thể làm việc ít nhất 4 ca/tuần (bao gồm Thứ Bảy hoặc Chủ Nhật).'}
                </div>
              </div>

              {/* Quyền lợi */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">Chế Độ Đãi Ngộ & Quyền Lợi</h4>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedJobDetail.benefits || '- Mức lương cạnh tranh từ 25.000đ - 35.000đ/giờ + Phụ cấp chuyên cần.\n- Đào tạo kỹ năng pha chế chuyên nghiệp và quản lý ca.\n- Giảm 30% khi dùng nước tại chuỗi cửa hàng Phúc Long.'}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setKanbanJobFilter(selectedJobDetail._id || '');
                  setSelectedJobDetail(null);
                  setActiveMenu('applicants');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Users className="w-4 h-4" />
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
                      category_id: job.category_id || 'cat_1',
                      location: job.location || '',
                      description: job.description || '',
                      salary_min: job.salary_min || 25000,
                      salary_max: job.salary_max || 35000,
                      is_negotiable: !!job.is_negotiable,
                      work_time: job.work_time || job.working_time || ''
                    });
                    setActiveMenu('post_job');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                >
                  Chỉnh Sửa Tin
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedJobDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL XEM CHI TIẾT ĐÁNH GIÁ (FR 2.6.3) ======================= */}
      {selectedReviewDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-sky-400 block mb-1">
                  Đánh Giá 2 Chiều Doanh Nghiệp (FR 2.6.3)
                </span>
                <h3 className="text-base font-black text-white">Chi Tiết Bài Nhận Xét Của Sinh Viên</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReviewDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Sinh viên & Điểm số */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white font-black text-sm flex items-center justify-center shadow-md">
                    {(selectedReviewDetail.reviewer_name || selectedReviewDetail.student_name || 'L')[0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">
                      {selectedReviewDetail.reviewer_name || selectedReviewDetail.student_name || 'Vũ Thế Long'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
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
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    {selectedReviewDetail.created_at || '01/11/2026'}
                  </span>
                </div>
              </div>

              {/* Nội dung đầy đủ */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>Toàn Bộ Nội Dung Văn Bản Nhận Xét</span>
                </h5>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line shadow-inner min-h-[120px]">
                  {selectedReviewDetail.comment || selectedReviewDetail.review_note || selectedReviewDetail.content || 
                   'Môi trường làm việc tại Phúc Long rất chuyên nghiệp, anh chị quản lý hỗ trợ sinh viên nhiệt tình, ca làm linh hoạt và thanh toán lương đúng hạn theo cam kết. Trải nghiệm làm việc rất tốt!'}
                </div>
              </div>

              {/* Trạng thái xác thực */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                <span className="text-slate-400">Trạng thái hiển thị:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã công khai trên hồ sơ doanh nghiệp
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReviewDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL TẠO TIN NHẮN MỚI & MỜI PHỎNG VẤN (FR 2.7.1 - 2.7.3) ======================= */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                    <MessageSquarePlus className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-sky-400">
                    Giao Tiếp Tuyển Dụng Trực Tiếp (FR 2.7.1)
                  </span>
                </div>
                <h3 className="text-base font-black text-white">Tạo Tin Nhắn Mới / Mời Phỏng Vấn</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewChatModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNewChatSubmit} className="p-6 space-y-4">
              {/* Chọn Ứng Viên / Đơn Ứng Tuyển */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Chọn Sinh Viên Đang Ứng Tuyển *
                </label>
                <select
                  value={newChatSelectedAppId}
                  onChange={(e) => {
                    setNewChatSelectedAppId(e.target.value);
                    const chosen = applicants.find(a => a._id === e.target.value);
                    if (chosen && newChatType === 'interview') {
                      const meetUrl = `https://meet.partime.vn/interview-${Date.now().toString().slice(-6)}`;
                      const sName = chosen.application_snapshot?.student_name || 'bạn';
                      setNewChatMessageText(`Kính gửi ${sName}, Phúc Long trân trọng mời bạn tham gia buổi phỏng vấn trực tuyến cho vị trí "${chosen.job_title}" tại phòng họp: ${meetUrl}. Vui lòng tham gia đúng giờ.`);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-sky-500 font-medium"
                >
                  <option value="">-- Chọn hồ sơ ứng viên ({applicants.length} hồ sơ) --</option>
                  {applicants.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.application_snapshot?.student_name || 'Vũ Thế Long'} - {a.job_title} ({
                        a.application_status === 'accepted' ? 'Đã duyệt' :
                        a.application_status === 'pending' ? 'Chờ duyệt' :
                        a.application_status === 'rejected' ? 'Từ chối' : 'Đã hủy'
                      })
                    </option>
                  ))}
                </select>
              </div>

              {/* RÀNG BUỘC KIỂM TRA TRẠNG THÁI (FR 2.7.2): BỊ KHÓA NẾU TỪ CHỐI HOẶC ĐÃ HỦY */}
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
                    <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/50 flex items-start gap-3 text-red-200">
                      <Lock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white uppercase tracking-wider">
                          Cuộc trò chuyện ở chế độ CHỈ ĐỌC (FR 2.7.2)
                        </p>
                        <p className="text-[11px] leading-relaxed text-red-300">
                          Đơn ứng tuyển của sinh viên này đã ở trạng thái <strong>"{targetApp.application_status === 'rejected' ? 'Đã từ chối' : 'Đã hủy'}"</strong>.
                          Theo quy chuẩn bảo mật và quyền riêng tư, hệ thống khóa chiều gửi tin nhắn mới và chỉ cho phép xem lại lịch sử hội thoại trước đó.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            handleStartChatWithApplicant(targetApp);
                            setNewChatModalOpen(false);
                          }}
                          className="mt-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
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
                      <label className="block text-xs font-bold text-slate-300">
                        Mục Đích Khởi Tạo Cuộc Trò Chuyện
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewChatType('text');
                            if (targetApp) {
                              const sName = targetApp.application_snapshot?.student_name || 'bạn';
                              setNewChatMessageText(`Chào ${sName}, Phúc Long đã tiếp nhận hồ sơ ứng tuyển của bạn cho vị trí "${targetApp.job_title}". Chúng tôi muốn trao đổi nhanh về lịch học và ca làm của bạn.`);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                            newChatType === 'text'
                              ? 'bg-blue-600/20 border-blue-500 text-sky-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
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
                            const sName = targetApp?.application_snapshot?.student_name || 'bạn';
                            const jTitle = targetApp?.job_title || 'Nhân viên';
                            setNewChatMessageText(`Kính gửi ${sName}, Phúc Long trân trọng mời bạn tham gia buổi phỏng vấn trực tuyến cho vị trí "${jTitle}" tại phòng họp trực tuyến: ${meetUrl}. Vui lòng tham gia đúng giờ.`);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                            newChatType === 'interview'
                              ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
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
                        <label className="block text-xs font-bold text-slate-300">
                          Nội Dung Tin Nhắn Gửi Đến Sinh Viên (1.8.3 & 1.9.1) *
                        </label>
                        {newChatType === 'interview' && (
                          <span className="text-[10px] text-purple-400 font-mono font-bold flex items-center gap-1">
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-sky-500 leading-relaxed"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] leading-relaxed">
                      💡 Khi gửi, tin nhắn sẽ lập tức xuất hiện trong hộp thoại của sinh viên và kích hoạt chuông thông báo đẩy theo thời gian thực (FR 1.9.1).
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setNewChatModalOpen(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950/60 cursor-pointer flex items-center gap-2"
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
