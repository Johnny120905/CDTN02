import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase, Search, Filter, Bookmark, Send, Clock,
  CheckCircle2, XCircle, AlertCircle, FileText, Upload, Download,
  Trash2, Eye, Star, MessageSquare, Video, Bell, User,
  KeyRound, ChevronRight, Check, AlertTriangle, RefreshCw,
  Phone, Mic, MicOff, Camera, CameraOff, Paperclip, Menu,
  ArrowUpDown, X, Home, Sparkles, Activity, Flag, Edit,
  MoreVertical, FileCheck, Building, HelpCircle, ChevronDown, Heart
} from 'lucide-react';
import { PROFESSION_SUGGESTIONS, filterSuggestions, getStatusBadge, HCM_DISTRICTS, HCM_BRANCH_SUGGESTIONS, JOB_CATEGORIES } from '../../shared/professionSuggestions';
import DocumentViewerModal from '../../shared/DocumentViewerModal';
import ConfirmDialog from '../../shared/ConfirmDialog';

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
  onShowBanner
}) {
  const notify = (msg, type = 'success') => {
    if (onShowBanner) {
      onShowBanner(msg, type);
    }
  };
  // Navigation State
  const [activeMenu, setActiveMenu] = useState(() => localStorage.getItem('partime_active_menu_student') || 'home'); // 'home' | 'jobs' | 'saved_jobs' | 'applications' | 'profile_cv' | 'reviews' | 'chat'
  const [profileCvTab, setProfileCvTab] = useState('personal'); // 'personal' | 'cover_letter' | 'resumes'
  const [reviewTab, setReviewTab] = useState('pending'); // 'pending' | 'history'
  const [userStatus, setUserStatus] = useState(currentUser?.profile?.status || currentUser?.status || 'active');

  // Slide-over pane for Job Detail
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);

  // Confetti Animation Trigger State
  const [showConfetti, setShowConfetti] = useState(false);

  // REAL Contacts List for Student: Long demo giữ Phúc Long; SV mới khởi tạo rỗng []
  const isLongDemo = currentUser?.email === 'vuthelong@vlu.edu.vn';
  const [contacts, setContacts] = useState(() => {
    if (isLongDemo) {
      return [
        {
          id: 'emp_user_employer_ngoc',
          employer_id: 'emp_user_employer_ngoc',
          name: 'Phúc Long Coffee & Tea',
          subtitle: 'Người đại diện: Huỳnh Nguyễn Bảo Ngọc',
          role: 'employer',
          email: 'huynhnguyenbaongoc2k5@gmail.com',
          online: true,
          lastMsg: 'Chào Long! Phúc Long đã tiếp nhận hồ sơ của bạn cho ca làm việc linh hoạt.',
          time: '10:15',
          unread: 1
        }
      ];
    }
    return [];
  });
  const [selectedContact, setSelectedContact] = useState(() => isLongDemo ? {
    id: 'emp_user_employer_ngoc',
    employer_id: 'emp_user_employer_ngoc',
    name: 'Phúc Long Coffee & Tea',
    subtitle: 'Người đại diện: Huỳnh Nguyễn Bảo Ngọc',
    role: 'employer',
    email: 'huynhnguyenbaongoc2k5@gmail.com',
    online: true,
    lastMsg: 'Chào Long! Phúc Long đã tiếp nhận hồ sơ của bạn cho ca làm việc linh hoạt.',
    time: '10:15',
    unread: 1
  } : null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  const getRoomId = (targetContact = selectedContact) => {
    if (!targetContact || targetContact.id === 'emp_user_employer_ngoc' || targetContact.employer_id === 'emp_user_employer_ngoc') {
      return 'room_main';
    }
    const empId = targetContact.employer_id || targetContact.id;
    const stuId = currentUser?._id || currentUser?.id || 'user_student_long';
    return `room_emp_${empId}_stu_${stuId}`;
  };

  // Data States
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [myApplications, setMyApplications] = useState([]);
  const [myResumes, setMyResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [profile, setProfile] = useState({
    full_name: currentUser?.profile?.full_name || currentUser?.full_name || 'Vũ Thế Long',
    phone: currentUser?.profile?.phone || '0987654321',
    university: currentUser?.profile?.university || 'Trường Đại học Văn Lang',
    major: currentUser?.profile?.major || 'Công nghệ thông tin'
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('');
  const [jobPage, setJobPage] = useState(1);
  const JOBS_PER_PAGE = 10;

  // Applications Filter
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusTab, setAppStatusTab] = useState('all'); // 'all' | 'pending' | 'accepted' | 'rejected' | 'cancelled'
  const [selectedAppTimeline, setSelectedAppTimeline] = useState(null);

  // Profile Edit State with 10-Digit Phone Validator
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    university: '',
    major: ''
  });
  const [phoneError, setPhoneError] = useState('');
  const [profileSaveMsg, setProfileSaveMsg] = useState('');

  // Cover Letter Form
  const [newCoverTitle, setNewCoverTitle] = useState('');
  const [newCoverContent, setNewCoverContent] = useState('');
  const [editingCoverId, setEditingCoverId] = useState(null);

  // CV Upload & Preview States
  const [newCvName, setNewCvName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [isDraggingCv, setIsDraggingCv] = useState(false);
  const [previewCvPdf, setPreviewCvPdf] = useState(null);
  const [replaceCvTarget, setReplaceCvTarget] = useState(null);

  // Application Modal
  const [applyModalJob, setApplyModalJob] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState('');
  const [customCoverNote, setCustomCoverNote] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
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
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  // Chat State: Long demo giữ tin nhắn mẫu; SV mới khởi tạo tin nhắn rỗng []
  const [chatMessages, setChatMessages] = useState(() => {
    if (isLongDemo) {
      return [
        {
          _id: 'msg_init_1',
          sender_id: 'user_employer_ngoc',
          sender_role: 'employer',
          sender_email: 'huynhnguyenbaongoc2k5@gmail.com',
          sender_name: 'Huỳnh Nguyễn Bảo Ngọc (Phúc Long)',
          content: 'Chào Long! Quán nhận được hồ sơ của bạn cho vị trí Pha chế Barista ca linh hoạt. Thứ Hai tuần tới bạn có thể phỏng vấn trực tuyến qua WebRTC không?',
          created_at: '10:00'
        },
        {
          _id: 'msg_init_2',
          sender_id: currentUser?._id || 'user_student_long',
          sender_role: 'student',
          sender_email: currentUser?.email || 'vuthelong@vlu.edu.vn',
          sender_name: 'Vũ Thế Long',
          content: 'Dạ em chào chị Bảo Ngọc ạ! Dạ thứ Hai em rảnh cả buổi chiều, em sẵn sàng tham gia phỏng vấn qua cuộc gọi video trên website ạ.',
          created_at: '10:05'
        }
      ];
    }
    return [];
  });
  const [newMsgText, setNewMsgText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatAttachment, setChatAttachment] = useState(null); // { file, name, size, type, base64, sizeStr }
  const [chatPreviewDoc, setChatPreviewDoc] = useState(null);
  const chatFileInputRef = useRef(null);

  const token = localStorage.getItem('partime_token');
  const headers = token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' };

  // Sync section title with parent
  const sectionTitleMap = {
    home: 'Trang Chủ Sinh Viên',
    jobs: 'Khám Phá Việc Làm',
    saved_jobs: 'Việc Làm Đã Lưu',
    applications: 'Tiến Độ Ứng Tuyển',
    profile_cv: 'Hồ Sơ & CV Năng Lực',
    reviews: 'Công Ty Chờ Đánh Giá',
    chat: 'Tin Nhắn & Phỏng Vấn'
  };

  useEffect(() => {
    localStorage.setItem('partime_active_menu_student', activeMenu);
  }, [activeMenu]);

  const handleMenuSwitch = (menuId) => {
    setActiveMenu(menuId);
    if (onSectionChange) onSectionChange(sectionTitleMap[menuId] || 'Trang Chủ Sinh Viên');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      if (targetMenu === 'account' && onOpenAccountModal) {
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
    fetchJobs();
    fetchCategories();
    if (token) {
      fetchBookmarks();
      fetchApplications();
      fetchResumes();
      fetchCoverLetters();
      fetchReviews();
      fetchProfile();
      fetchChatMessages();
    }
  };

  // Call signaling poll (every 2.5s) for Two-Way Calling
  useEffect(() => {
    if (!token) return;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/call/status?room_id=${getRoomId()}`, { headers });
        const data = await res.json();
        if (data.success && data.call) {
          const call = data.call;
          if (call.status === 'ringing' && call.target_role === 'student' && !isVideoCalling && !incomingCall) {
            setIncomingCall(call);
          } else if (callStatus === 'calling' && call.status === 'connected') {
            setCallStatus('connected');
            if (onShowBanner) { onShowBanner(null); setTimeout(() => onShowBanner('Đã kết nối cuộc gọi thành công!', 'success', 3000), 50); }
          } else if (isVideoCalling && (call.status === 'ended' || call.status === 'declined')) {
            handleEndCall(false);
            if (onShowBanner) { onShowBanner(null); setTimeout(() => onShowBanner('Cuộc gọi đã kết thúc.', 'success', 2500), 50); }
          }
        }
      } catch (e) { }
    }, 2500);
    return () => clearInterval(pollInterval);
  }, [token, isVideoCalling, callStatus, incomingCall, selectedContact]);

  // Periodic poll for chat messages when activeMenu === 'chat'
  useEffect(() => {
    if (!token || activeMenu !== 'chat') return;
    fetchChatMessages(selectedContact);
    const chatPoll = setInterval(() => {
      fetchChatMessages(selectedContact);
    }, 2000);
    return () => clearInterval(chatPoll);
  }, [token, activeMenu, selectedContact]);

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
      if (onShowBanner) onShowBanner(`Đang đổ chuông cuộc gọi ${type === 'video' ? 'Video' : 'Thoại'} tới Doanh nghiệp...`, 'loading');
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
      if (onShowBanner) onShowBanner('Đã kết nối cuộc gọi thành công!', 'success');
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
      if (onShowBanner) onShowBanner('Đã từ chối cuộc gọi.', 'error');
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
      } catch (e) { }
    }
    setIsVideoCalling(false);
    setCallStatus('idle');
    setCallDuration(0);
    if (onShowBanner) {
      onShowBanner(null);
      setTimeout(() => onShowBanner('Cuộc gọi đã kết thúc.', 'success', 2500), 50);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    fetchChatMessages();
  };

  // WebRTC Camera / Audio stream handler
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
          .catch((err) => {
            console.warn('[WebRTC] Media access warning:', err);
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
  }, [isVideoCalling, callStatus, callType, isCameraOff, isMuted]);

  // API Calls
  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setJobs(data.data);
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

  const fetchBookmarks = async () => {
    try {
      const res = await fetch('/api/student/bookmarks', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
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

        // Đồng bộ danh bạ hội thoại với các Nhà tuyển dụng mà sinh viên đã nộp hồ sơ ứng tuyển
        const contactList = [];
        const seenEmp = new Set();

        if (isLongDemo) {
          seenEmp.add('emp_user_employer_ngoc');
          contactList.push({
            id: 'emp_user_employer_ngoc',
            employer_id: 'emp_user_employer_ngoc',
            name: 'Phúc Long Coffee & Tea',
            subtitle: 'Người đại diện: Huỳnh Nguyễn Bảo Ngọc',
            role: 'employer',
            email: 'huynhnguyenbaongoc2k5@gmail.com',
            online: true,
            lastMsg: 'Chào Long! Phúc Long đã tiếp nhận hồ sơ của bạn cho ca làm việc linh hoạt.',
            time: '10:15',
            unread: 1
          });
        }

        data.data.forEach(app => {
          const empId = app.employer_id;
          if (empId && !seenEmp.has(empId)) {
            seenEmp.add(empId);
            contactList.push({
              id: empId,
              employer_id: empId,
              name: app.company_name || 'Nhà tuyển dụng',
              subtitle: `Ứng tuyển: ${app.job_title}`,
              role: 'employer',
              email: '',
              online: true,
              lastMsg: `Đơn ứng tuyển: ${app.job_title}`,
              time: 'Mới ứng tuyển',
              unread: 0,
              application_status: app.application_status
            });
          }
        });

        if (contactList.length > 0) {
          setContacts(contactList);
          setSelectedContact(prev => {
            if (prev && contactList.some(c => c.id === prev.id)) return prev;
            return contactList[0];
          });
        } else if (!isLongDemo) {
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

  const fetchCoverLetters = async () => {
    try {
      const res = await fetch('/api/student/cover-letters', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCoverLetters(data.data);
      }
    } catch (err) {
      console.warn('Could not fetch cover letters:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/student/reviews', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMyReviews(data.data);
      }
    } catch (err) {
      console.warn('Could not fetch reviews:', err);
    }
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
          major: data.data.major || ''
        });
      }
    } catch (err) {
      console.warn('Could not fetch profile:', err);
    }
  };

  const fetchChatMessages = async (targetContact = selectedContact) => {
    const contactToFetch = targetContact || selectedContact;
    if (!contactToFetch) {
      if (!isLongDemo) setChatMessages([]);
      return;
    }
    const roomId = getRoomId(contactToFetch);
    try {
      const res = await fetch(`/api/chat/messages?room_id=${roomId}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        if (data.data.length > 0 || !isLongDemo) {
          setChatMessages(data.data);
        }
      }
    } catch (err) {
      console.warn('Chat message fetch fallback:', err);
      if (!isLongDemo) setChatMessages([]);
    }
  };

  // Tự động tải lại tin nhắn khi sinh viên chọn nhà tuyển dụng khác
  useEffect(() => {
    if (selectedContact) {
      fetchChatMessages(selectedContact);
    } else if (!isLongDemo) {
      setChatMessages([]);
    }
  }, [selectedContact]);

  // Toggle Bookmark with pulsating heart (FR 1.5.4, 1.5.5)
  const handleToggleBookmark = async (jobId) => {
    const isSaved = bookmarkedIds.has(jobId);
    // Optimistic
    const next = new Set(bookmarkedIds);
    if (isSaved) next.delete(jobId);
    else next.add(jobId);
    setBookmarkedIds(next);

    try {
      const method = isSaved ? 'DELETE' : 'POST';
      await fetch(`/api/student/bookmarks/${jobId}`, { method, headers });
    } catch (err) {
      console.warn('Bookmark error:', err);
    }
  };

  // Submit Application with Confetti Effect (FR 1.5.6 & UI-SV-APP-01)
  const handleApplyJobSubmit = async (e) => {
    e.preventDefault();
    if (!applyModalJob) return;
    if (customCoverNote.length > 5000) {
      setApplyMsg({ text: "Lời nhắn / thư giới thiệu không được vượt quá 5.000 ký tự theo quy định.", type: "error" });
      return;
    }
    setApplyLoading(true);
    setApplyMsg({ text: '', type: '' });

    try {
      const res = await fetch(`/api/student/applications/${applyModalJob._id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          resume_id: selectedResumeId,
          cover_letter: customCoverNote
        })
      });
      const data = await res.json();
      if (data.success) {
        setApplyMsg({ text: 'Nộp hồ sơ ứng tuyển thành công! Thông báo đã gửi tới Nhà tuyển dụng.', type: 'success' });
        setShowConfetti(true);
        fetchApplications();
        setTimeout(() => {
          setShowConfetti(false);
          setApplyModalJob(null);
          setApplyMsg({ text: '', type: '' });
          setCustomCoverNote('');
        }, 2200);
      } else {
        setApplyMsg({ text: data.message || 'Ứng tuyển không thành công.', type: 'error' });
      }
    } catch (err) {
      setApplyMsg({ text: 'Lỗi kết nối máy chủ.', type: 'error' });
    } finally {
      setApplyLoading(false);
    }
  };

  // Cancel Application (FR 1.6.4)
  const handleCancelApplication = async (appId) => {
    try {
      const res = await fetch(`/api/student/applications/${appId}/cancel`, {
        method: 'PUT',
        headers
      });
      const data = await res.json();
      notify(data.message || 'Đã rút hồ sơ thành công.', data.success ? 'success' : 'error');
      fetchApplications();
    } catch (err) {
      console.error(err);
    }
  };

  // Profile Save with 10-Digit Phone Validator (FR 1.3.1 & 1.3.2)
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
        setTimeout(() => setProfileSaveMsg(''), 3000);
      } else {
        setPhoneError(data.message || 'Lỗi cập nhật hồ sơ.');
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
              file_url: `/uploads/${newCvName}.pdf`,
              is_default: myResumes.length === 0
            })
          }).then(res => res.json()).then(d => {
            if (d.success) {
              setNewCvName('');
              fetchResumes();
            }
          });
          return 100;
        }
        return prev + 30;
      });
    }, 200);
  };

  // Set Default CV (FR 1.4.5)
  const handleSetDefaultCv = async (cvId) => {
    try {
      const res = await fetch(`/api/student/resumes/${cvId}/default`, {
        method: 'PUT',
        headers
      });
      const data = await res.json();
      if (data.success) fetchResumes();
    } catch (err) {
      console.warn(err);
    }
  };

  // Delete CV (FR 1.4.6) with ConfirmDialog
  const handleDeleteCv = (cvId) => {
    setConfirmDialogConfig({
      isOpen: true,
      title: 'Xóa Tệp CV Khỏi Kho Lưu Trữ',
      message: 'Bạn có chắc chắn muốn xóa vĩnh viễn tệp CV này khỏi hệ thống? Thao tác không thể hoàn tác.',
      type: 'danger',
      confirmText: 'Xóa CV Ngay',
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

  // Cover Letter CRUD (FR 1.3.3 - 1.3.5)
  const handleSaveCoverLetter = async (e) => {
    e.preventDefault();
    if (!newCoverTitle.trim() || !newCoverContent.trim()) return;

    try {
      if (editingCoverId) {
        await fetch(`/api/student/cover-letters/${editingCoverId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ title: newCoverTitle, content: newCoverContent })
        });
      } else {
        await fetch('/api/student/cover-letters', {
          method: 'POST',
          headers,
          body: JSON.stringify({ title: newCoverTitle, content: newCoverContent })
        });
      }
      setNewCoverTitle('');
      setNewCoverContent('');
      setEditingCoverId(null);
      fetchCoverLetters();
    } catch (err) {
      console.warn(err);
    }
  };

  const handleDeleteCoverLetter = (clId) => {
    setConfirmDialogConfig({
      isOpen: true,
      title: 'Xóa Thư Giới Thiệu',
      message: 'Bạn có chắc chắn muốn xóa thư giới thiệu này? Thao tác này sẽ gỡ bỏ thư khỏi hồ sơ ứng tuyển của bạn.',
      type: 'danger',
      confirmText: 'Xóa Thư',
      onConfirm: async () => {
        setConfirmDialogConfig(null);
        try {
          await fetch(`/api/student/cover-letters/${clId}`, { method: 'DELETE', headers });
          notify('Đã xóa thư giới thiệu thành công!', 'success');
          fetchCoverLetters();
        } catch (err) {
          notify('Lỗi khi xóa thư giới thiệu.', 'error');
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

  // Xem chi tiết đánh giá (FR-SV-07.03) - Nhấn vào mục lịch sử để tải và hiển thị đầy đủ nội dung văn bản nhận xét
  const handleOpenReviewDetail = async (rev) => {
    const matchedApp = myApplications.find(a => a._id === rev.application_id);
    const enrichedRev = {
      ...rev,
      company_name: rev.company_name || matchedApp?.company_name || 'Phúc Long Coffee & Tea',
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
          target_title: reportModalData.target_title,
          reason: reportReason.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setReportMsg(`Báo cáo đã được gửi tới Ban Quản trị hệ thống (Mã Ticket: ${data.data?.ticket_code || 'TK-2026'}). Chúng tôi sẽ điều tra và xử lý ngay.`);
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

    const optimisticMsg = {
      _id: `msg_tmp_${Date.now()}`,
      sender_id: currentUser?._id || 'user_student_long',
      sender_role: 'student',
      sender_email: currentUser?.email || 'vuthelong@vlu.edu.vn',
      sender_name: 'Vũ Thế Long',
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
          employer_id: selectedContact?.employer_id || selectedContact?.id
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setChatMessages(prev => prev.map(m => m._id === optimisticMsg._id ? data.data : m));
      }
    } catch (err) {
      console.warn('Send message error:', err);
    }
  };

  // Filter Jobs (FR-SV-05.02: Lọc việc làm theo Ngành nghề, Địa điểm và Khoảng lương)
  const filteredJobs = jobs.filter(j => {
    const matchesSearch = !searchQuery ||
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.description && j.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = !selectedCategory || j.category_id === selectedCategory;
    const matchesLoc = !selectedLocation || (j.location && j.location.toLowerCase().includes(selectedLocation.toLowerCase()));

    // Tiêu chí khoảng lương: tự động đối chiếu để trả về các công việc cho phép thỏa thuận hoặc có mức lương giao thoa
    let matchesSal = true;
    if (salaryFilter) {
      const isNegotiable = j.is_negotiable === true || (!j.salary_min && !j.salary_max);
      if (salaryFilter === 'negotiable') {
        matchesSal = isNegotiable;
      } else {
        if (isNegotiable) {
          matchesSal = true;
        } else {
          let minSal = Number(j.salary_min) || 0;
          let maxSal = Number(j.salary_max) || minSal;
          // Nếu lưu theo giờ (< 100.000đ/h), quy đổi ước tính tháng (~100 giờ/tháng làm thêm)
          if (maxSal < 100000) {
            minSal = minSal * 100;
            maxSal = maxSal * 100;
          }
          if (salaryFilter === 'under_2m') {
            // Dưới 2 triệu: giao thoa với khoảng dưới 2.000.000
            matchesSal = minSal < 2000000;
          } else if (salaryFilter === '2m_5m') {
            // Từ 2 đến 5 triệu: giao thoa với khoảng [2.000.000 - 5.000.000]
            matchesSal = minSal <= 5000000 && maxSal >= 2000000;
          } else if (salaryFilter === 'above_5m') {
            // Trên 5 triệu: giao thoa với khoảng trên 5.000.000
            matchesSal = maxSal > 5000000;
          }
        }
      }
    }
    return matchesSearch && matchesCat && matchesLoc && matchesSal;
  });

  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE) || 1;
  const paginatedJobs = filteredJobs.slice((jobPage - 1) * JOBS_PER_PAGE, jobPage * JOBS_PER_PAGE);

  // Filter Applications
  const filteredApplications = myApplications.filter(app => {
    const matchesSearch = !appSearchQuery ||
      (app.job_title && app.job_title.toLowerCase().includes(appSearchQuery.toLowerCase())) ||
      (app.company_name && app.company_name.toLowerCase().includes(appSearchQuery.toLowerCase()));
    const matchesStatus = appStatusTab === 'all' || app.application_status === appStatusTab;
    return matchesSearch && matchesStatus;
  });

  // Completed jobs ready for review (FR 1.7.1)
  const completedJobsForReview = myApplications.filter(a => a.application_status === 'accepted');

  // Sidebar Menu Items for Student (6 Chức năng chính)
  const studentMenuItems = [
    { id: 'home', label: 'Trang Chủ', icon: <Home className="w-4 h-4" /> },
    { id: 'jobs', label: 'Khám Phá Việc Làm', icon: <Search className="w-4 h-4" />, count: jobs.length },
    { id: 'saved_jobs', label: 'Việc Làm Đã Lưu', icon: <Heart className="w-4 h-4" />, count: bookmarkedIds.size },
    { id: 'applications', label: 'Tiến Độ Ứng Tuyển', icon: <Clock className="w-4 h-4" />, count: myApplications.length },
    { id: 'profile_cv', label: 'Hồ Sơ & CV Năng Lực', icon: <User className="w-4 h-4" />, count: myResumes.length },
    { id: 'reviews', label: 'Công Ty Chờ Đánh Giá', icon: <Star className="w-4 h-4" />, count: completedJobsForReview.length },
    { id: 'chat', label: 'Tin Nhắn & Phỏng Vấn', icon: <MessageSquare className="w-4 h-4" />, count: 1 }
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#030712] text-slate-100 min-h-[calc(100vh-80px)]">

      {/* CONFETTI CELEBRATION OVERLAY */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[2px] animate-pulse"></div>
          <div className="relative text-center p-8 rounded-3xl bg-slate-900/90 border border-sky-400/50 shadow-2xl shadow-sky-500/40 animate-in zoom-in-75 duration-300">
            <Sparkles className="w-16 h-16 text-yellow-400 mx-auto animate-bounce mb-3" />
            <h3 className="text-xl font-black text-white">🎉 Ứng Tuyển Thành Công!</h3>
            <p className="text-xs text-sky-200 mt-2">Hồ sơ CV của bạn đã được chuyển thẳng tới Phúc Long Coffee & Tea.</p>
          </div>
        </div>
      )}

      {/* ======================= LEFT SIDEBAR ======================= */}
      <aside className={`w-64 bg-slate-950 border-r border-blue-900/30 flex flex-col shrink-0 transition-all ${mobileSidebarOpen ? 'fixed inset-y-0 left-0 z-50 shadow-2xl block' : 'hidden md:flex'
        }`}>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-xs font-black tracking-wide text-white uppercase">Cổng Sinh Viên</span>
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
          {studentMenuItems.map((item) => {
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  handleMenuSwitch(item.id);
                  if (mobileSidebarOpen && onToggleMobileSidebar) onToggleMobileSidebar();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${isActive
                  ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-lg shadow-blue-950/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-sky-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-sky-300 border border-slate-700'
                    }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ======================= WIDGET CHAT SIDEBAR DRAWER (UI-SV-CHAT-01) ======================= */}
      {chatDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border-l border-blue-900/50 flex flex-col shadow-2xl h-full animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white uppercase">Widget Chat Nhanh</h3>
              </div>
              <button
                type="button"
                onClick={onCloseChatDrawer}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tìm kiếm hội thoại theo tên NTD (FR 1.8.1) */}
            <div className="p-3 border-b border-slate-800/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên Doanh nghiệp..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Danh sách Room Chat với NTD (FR 1.8.2 & Chấm xanh/xám 1.10.1) */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
              {contacts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="font-semibold text-slate-400">Chưa có cuộc trò chuyện nào</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Danh bạ sẽ tự động xuất hiện khi bạn nộp hồ sơ ứng tuyển vào một công việc.
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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                          {contact.name.charAt(0)}
                        </div>
                        {/* Chấm tròn xanh lá Online / xám Offline (FR 1.10.1) */}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${contact.online ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : 'bg-slate-500'
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

        {/* 1. MÀN HÌNH TRANG CHỦ (HOME OVERVIEW) */}
        {activeMenu === 'home' && (
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Hero Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-sky-950/60 border border-blue-900/40 p-6 sm:p-8 shadow-2xl">
              <div className="max-w-2xl relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-sky-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cổng Tuyển Dụng Sinh Viên CDTN02</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  Chào mừng trở lại, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-300">{profile.full_name || 'Vũ Thế Long'}</span>!
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Khám phá hàng ngàn cơ hội việc làm bán thời gian uy tín từ các doanh nghiệp và thương hiệu hàng đầu. Hệ thống kết nối việc làm linh hoạt theo lịch học sinh viên, cam kết minh bạch thu nhập và bảo vệ quyền lợi tối đa cho ứng viên.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleMenuSwitch('jobs')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950/60 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Khám Phá Việc Làm Ngay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMenuSwitch('applications')}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-sky-400" />
                    <span>Xem Tiến Độ Đơn ({myApplications.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-blue-900/30 flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-400 font-bold uppercase">Việc Làm Đang Tuyển</p>
                  <p className="text-2xl font-black text-white">{jobs.filter(j => j.is_open && !j.is_hidden).length}</p>
                  <p className="text-[10px] text-emerald-400">100% Đã xác minh GPKD</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-sky-400 flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-blue-900/30 flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-400 font-bold uppercase">Hồ Sơ Đã Nộp</p>
                  <p className="text-2xl font-black text-white">{myApplications.length}</p>
                  <p className="text-[10px] text-sky-400">
                    {myApplications.filter(a => a.application_status === 'accepted').length} đơn đã được duyệt
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-blue-900/30 flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-400 font-bold uppercase">Kho CV & Giới Thiệu</p>
                  <p className="text-2xl font-black text-white">{myResumes.length} CV</p>
                  <p className="text-[10px] text-purple-400">{coverLetters.length} Thư giới thiệu đính kèm</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Việc làm đề xuất mới nhất */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Việc Làm Part-Time Nổi Bật Dành Cho Bạn</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleMenuSwitch('jobs')}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem tất cả</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.slice(0, 4).map((job) => {
                  const isSaved = bookmarkedIds.has(job._id);
                  return (
                    <div
                      key={job._id}
                      onClick={() => setSelectedJobDetail(job)}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-blue-900/30 hover:border-sky-500/50 transition-all cursor-pointer group shadow-xl relative"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-1">
                            {job.title}
                          </h4>
                          <p className="text-xs font-semibold text-emerald-400 mt-1">{job.company_name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{job.location}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleBookmark(job._id);
                          }}
                          className={`p-2 rounded-xl border transition-all ${isSaved
                            ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-red-400'
                            }`}
                          title={isSaved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sky-300 text-[11px] font-bold">
                          {job.is_negotiable ? 'Lương thỏa thuận' : `${job.salary_min?.toLocaleString()}đ - ${job.salary_max?.toLocaleString()}đ/h`}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px]">
                          {job.work_time || 'Ca linh hoạt'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* 2. MÀN HÌNH KHÁM PHÁ VIỆC LÀM & BỘ LỌC (FR 1.5.1 - 1.5.3) */}
        {activeMenu === 'jobs' && (
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Header & Filter Controls (FR 1.5.2) */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-blue-900/30 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-sky-400" />
                    <span>Tìm Kiếm Việc Làm Part-Time</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Tìm thấy {filteredJobs.length} vị trí phù hợp với lịch học sinh viên</p>
                </div>
              </div>

              {/* Bộ lọc đa tiêu chí */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                {/* 1. Từ khóa */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Chức danh, kỹ năng..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>

                {/* 2. Ngành nghề */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="">Tất cả ngành nghề ({JOB_CATEGORIES.length})</option>
                    {JOB_CATEGORIES.filter(c => c !== 'Tất cả ngành nghề').map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                    {categories.filter(c => c.type === 'job' || !c.type).map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Địa điểm / Khu vực (Tất cả 24 quận huyện TP.HCM) */}
                <div>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="">Tất cả 24 quận huyện TP.HCM</option>
                    {HCM_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}, TP.HCM</option>
                    ))}
                  </select>
                </div>

                {/* 4. Khoảng lương (FR-SV-05.02) */}
                <div>
                  <select
                    value={salaryFilter}
                    onChange={(e) => setSalaryFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="">Mọi mức lương</option>
                    <option value="under_2m">Dưới 2 triệu</option>
                    <option value="2m_5m">Từ 2 đến 5 triệu</option>
                    <option value="above_5m">Trên 5 triệu</option>
                    <option value="negotiable">Lương thỏa thuận</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lưới thẻ việc làm - Phân trang 10 dòng/trang (FR 1.5.3) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedJobs.length === 0 ? (
                <div className="col-span-2 py-16 text-center text-slate-500 text-xs">
                  Không tìm thấy việc làm phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                paginatedJobs.map((job) => {
                  const isSaved = bookmarkedIds.has(job._id);
                  return (
                    <div
                      key={job._id}
                      onClick={() => setSelectedJobDetail(job)}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-blue-900/30 hover:border-sky-500/60 transition-all cursor-pointer group shadow-xl relative"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-1">
                            {job.title}
                          </h4>
                          <p className="text-xs font-semibold text-emerald-400 mt-1">{job.company_name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{job.location}</p>
                        </div>
                        {/* Trái tim lưu/bỏ lưu việc làm kèm hiệu ứng nhịp tim đập (FR 1.5.4, 1.5.5) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleBookmark(job._id);
                          }}
                          className={`p-2 rounded-xl border transition-all ${isSaved
                            ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-red-400'
                            }`}
                          title={isSaved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sky-300 text-[11px] font-bold">
                            {job.is_negotiable ? 'Thỏa thuận' : `${job.salary_min?.toLocaleString()}đ - ${job.salary_max?.toLocaleString()}đ/h`}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px]">
                            {job.work_time}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setApplyModalJob(job);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-950/50 cursor-pointer"
                        >
                          Ứng tuyển
                        </button>
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
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Trang trước
                </button>
                <span className="text-xs text-slate-400 font-mono px-2">
                  Trang {jobPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={jobPage === totalPages}
                  onClick={() => setJobPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Trang sau
                </button>
              </div>
            )}

          </div>
        )}

        {/* 3. MÀN HÌNH VIỆC LÀM ĐÃ LƯU (UI-SV-JOB-04 - 1.5.8) */}
        {activeMenu === 'saved_jobs' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-blue-900/30 shadow-2xl flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400 fill-red-400" />
                  <span>Danh Sách Việc Làm Đã Lưu</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Bạn đang theo dõi {bookmarkedIds.size} việc làm yêu thích</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.filter(j => bookmarkedIds.has(j._id)).length === 0 ? (
                <div className="col-span-2 py-16 text-center text-slate-500 text-xs">
                  Bạn chưa lưu công việc nào. Hãy nhấp vào icon Trái tim tại trang Khám phá việc làm để lưu lại.
                </div>
              ) : (
                jobs.filter(j => bookmarkedIds.has(j._id)).map((job) => {
                  // RÀNG BUỘC 1.5.8: Các tin ở trạng thái Tạm đóng, Đã nhận người, Hoàn thành sẽ tự động làm mờ (Greyed out)
                  const isGreyedOut = !job.is_open || job.job_status === 'filled' || job.job_status === 'completed';

                  return (
                    <div
                      key={job._id}
                      onClick={() => !isGreyedOut && setSelectedJobDetail(job)}
                      className={`p-5 rounded-2xl bg-slate-900/90 border transition-all relative ${isGreyedOut
                        ? 'border-slate-800 opacity-60 grayscale cursor-not-allowed'
                        : 'border-blue-900/30 hover:border-sky-500/60 cursor-pointer shadow-xl'
                        }`}
                    >
                      {/* Greyed Out Badge */}
                      {isGreyedOut && (
                        <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                          <AlertCircle className="w-3 h-3" />
                          <span>
                            {job.job_status === 'filled' ? 'Đã nhận đủ người' : (job.job_status === 'completed' ? 'Đã hoàn thành' : 'Tạm đóng tuyển dụng')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white line-clamp-1">{job.title}</h4>
                          <p className="text-xs font-semibold text-emerald-400 mt-1">{job.company_name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{job.location}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleBookmark(job._id);
                          }}
                          className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 cursor-pointer"
                          title="Bỏ lưu việc làm"
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80">
                        <span className="text-xs font-bold text-sky-300">
                          {job.is_negotiable ? 'Thỏa thuận' : `${job.salary_min?.toLocaleString()}đ - ${job.salary_max?.toLocaleString()}đ/h`}
                        </span>
                        {!isGreyedOut && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setApplyModalJob(job);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                          >
                            Ứng tuyển
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 4. MÀN HÌNH QUẢN LÝ TIẾN ĐỘ ỨNG TUYỂN (UI-SV-APP-02 & 03 - 1.6.1 -> 1.6.4) */}
        {activeMenu === 'applications' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-blue-900/30 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-sky-400" />
                    <span>Quản Lý Tiến Độ Ứng Tuyển</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Theo dõi thời gian thực kết quả duyệt hồ sơ từ Phúc Long Coffee & Tea</p>
                </div>
              </div>

              {/* Thanh tìm kiếm đơn đã nộp (1.6.1) và các Tab lọc trạng thái (1.6.2) */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm công việc đã nộp..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>

                {/* Tabs lọc trạng thái kèm ApplicationStatusBadge (Vàng, Xanh, Đỏ, Xám) */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${appStatusTab === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                  >
                    Tất cả ({myApplications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${appStatusTab === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                  >
                    🟡 Chờ duyệt ({myApplications.filter(a => a.application_status === 'pending').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('accepted')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${appStatusTab === 'accepted' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                  >
                    🟢 Đã duyệt ({myApplications.filter(a => a.application_status === 'accepted').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('rejected')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${appStatusTab === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/50' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                  >
                    🔴 Từ chối ({myApplications.filter(a => a.application_status === 'rejected').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('cancelled')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${appStatusTab === 'cancelled' ? 'bg-slate-700 text-slate-300 border border-slate-600' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                  >
                    ⚪ Đã hủy ({myApplications.filter(a => a.application_status === 'cancelled').length})
                  </button>
                </div>
              </div>
            </div>

            {/* Danh sách đơn ứng tuyển */}
            <div className="space-y-4">
              {filteredApplications.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-500">
                  Không có đơn ứng tuyển nào trong mục này.
                </div>
              ) : (
                filteredApplications.map((app) => {
                  const statusColors = {
                    pending: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
                    interview: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
                    accepted: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
                    rejected: 'bg-red-500/15 text-red-300 border-red-500/40',
                    cancelled: 'bg-slate-700/40 text-slate-400 border-slate-600'
                  };

                  const statusLabels = {
                    pending: 'Chờ Doanh Nghiệp Duyệt',
                    interview: 'Mời Phỏng Vấn Trực Tuyến',
                    accepted: 'Đã Được Phê Duyệt Trúng Tuyển',
                    rejected: 'Bị Từ Chối',
                    cancelled: 'Đã Hủy / Rút Hồ Sơ'
                  };

                  return (
                    <div
                      key={app._id}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-blue-900/30 shadow-xl space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-white">{app.job_title}</h4>
                          <p className="text-xs font-semibold text-emerald-400 mt-0.5">{app.company_name}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">Ngày nộp: {app.applied_at}</p>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[app.application_status] || statusColors.pending}`}>
                            {statusLabels[app.application_status] || app.application_status}
                          </span>
                        </div>
                      </div>

                      {/* Snapshot CV & Cover note */}
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="font-semibold">CV đã đính kèm:</span>
                          <span className="text-sky-400 font-mono">{app.application_snapshot?.cv_name || 'CV_VuTheLong_CNTT.pdf'}</span>
                        </div>
                        {app.application_snapshot?.cover_note && (
                          <div className="text-slate-400 text-[11px] leading-relaxed border-t border-slate-800/80 pt-1.5">
                            <span className="font-semibold text-slate-300">Lời nhắn ứng tuyển:</span> "{app.application_snapshot.cover_note}"
                          </div>
                        )}
                        {app.reject_reason && (
                          <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-900/40 text-red-300 text-[11px]">
                            <strong>Lý do từ chối:</strong> {app.reject_reason}
                          </div>
                        )}
                      </div>

                      {/* Trục thời gian tiến độ ứng tuyển 4 bước cụ thể (Đã gỡ bỏ hiệu ứng nhấp nháy / ẩn hiện ở số 1) */}
                      <div className="pt-3 pb-1 border-t border-slate-800/80 mt-3">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-sky-400" />
                            <span>Tiến Độ Tuyển Dụng (Quy Trình 4 Bước Chuẩn)</span>
                          </p>
                          {(() => {
                            const viStatusMap = {
                              pending: { label: '⏳ Đang Chờ Xét Duyệt', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/40' },
                              reviewed: { label: '👁️ Đã Tiếp Nhận Hồ Sơ', color: 'text-sky-300', bg: 'bg-sky-500/20 border-sky-500/40' },
                              interview: { label: '📞 Mời Phỏng Vấn Trực Tuyến', color: 'text-purple-300', bg: 'bg-purple-500/20 border-purple-500/40' },
                              accepted: { label: '🎉 Trúng Tuyển Chính Thức', color: 'text-emerald-300', bg: 'bg-emerald-500/20 border-emerald-500/40' },
                              rejected: { label: '✕ Chưa Phù Hợp Lần Này', color: 'text-rose-300', bg: 'bg-rose-500/20 border-rose-500/40' },
                              cancelled: { label: '🚫 Đã Rút Hồ Sơ', color: 'text-slate-400', bg: 'bg-slate-700 border-slate-600' }
                            };
                            const stInfo = viStatusMap[app.application_status] || { label: app.application_status, color: 'text-slate-300', bg: 'bg-slate-800 border-slate-700' };
                            return (
                              <span className={`px-3 py-1 rounded-full text-[11px] font-bold border shadow-sm ${stInfo.bg} ${stInfo.color}`}>
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
                                { num: 1, title: 'Bước 1: Nộp Hồ Sơ', desc: 'Đã gửi CV & Lời nhắn' },
                                { num: 2, title: 'Bước 2: Tiếp Nhận', desc: 'Nhà tuyển dụng xem xét' },
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
                                  <div className="absolute top-5 left-10 right-10 h-1 bg-slate-800 rounded-full z-0">
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

                                      let circleClass = 'bg-slate-900 border-slate-700 text-slate-500';
                                      let titleClass = 'text-slate-500';
                                      let badgeStatus = null;

                                      if (isPassed) {
                                        circleClass = 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-500/20';
                                        titleClass = 'text-sky-300 font-bold';
                                        badgeStatus = '✓ Đã xong';
                                      } else if (isCurrent) {
                                        if (app.application_status === 'accepted') {
                                          circleClass = 'bg-emerald-500 border-emerald-400 text-white shadow-md';
                                          titleClass = 'text-emerald-300 font-black';
                                          badgeStatus = '🎉 Trúng tuyển';
                                        } else if (app.application_status === 'rejected') {
                                          circleClass = 'bg-rose-600 border-rose-400 text-white shadow-md';
                                          titleClass = 'text-rose-400 font-black';
                                          badgeStatus = '✕ Chưa phù hợp';
                                        } else if (st.num === 1) {
                                          // TĨNH HOÀN TOÀN: Bỏ animate-pulse và bỏ ring-4 nhấp nháy ẩn hiện
                                          circleClass = 'bg-blue-600 border-sky-300 text-white shadow-md';
                                          titleClass = 'text-sky-300 font-black';
                                          badgeStatus = '⚡ Đang xử lý';
                                        } else if (st.num === 2) {
                                          circleClass = 'bg-amber-500 border-amber-300 text-slate-950 shadow-md';
                                          titleClass = 'text-amber-300 font-black';
                                          badgeStatus = '⚡ Đang xem xét';
                                        } else if (st.num === 3) {
                                          circleClass = 'bg-purple-600 border-purple-300 text-white shadow-md';
                                          titleClass = 'text-purple-300 font-black';
                                          badgeStatus = '📞 Đang phỏng vấn';
                                        }
                                      } else {
                                        badgeStatus = 'Chưa tới';
                                      }

                                      return (
                                        <div key={st.num} className="flex flex-col items-center text-center px-1">
                                          {/* Circle icon */}
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-black text-sm transition-all duration-300 ${circleClass}`}>
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
                                          <p className={`text-xs mt-2.5 leading-snug transition-colors ${titleClass}`}>
                                            {st.title}
                                          </p>

                                          {/* Huy hiệu trạng thái bước */}
                                          {badgeStatus && (
                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                              isCurrent 
                                                ? (app.application_status === 'accepted' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                                   app.application_status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                                                   'bg-sky-500/20 text-sky-300 border border-sky-500/40')
                                                : (isPassed ? 'text-emerald-400/80' : 'text-slate-600')
                                            }`}>
                                              {badgeStatus}
                                            </span>
                                          )}

                                          {/* Thời gian cập nhật */}
                                          {timeStr && (
                                            <span className="text-[10px] text-slate-400 font-mono mt-1">
                                              {timeStr}
                                            </span>
                                          )}

                                          {/* Mô tả bước */}
                                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
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

                      {/* Action buttons: Nút Rút hồ sơ / Hủy ứng tuyển (FR 1.6.4) */}
                      {app.application_status === 'pending' && (
                        <div className="flex items-center justify-end pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => handleCancelApplication(app._id)}
                            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition-all cursor-pointer"
                          >
                            Rút hồ sơ / Hủy ứng tuyển
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 5. MÀN HÌNH HỒ SƠ CÁ NHÂN, THƯ GIỚI THIỆU & KHO CV (UI-SV-PRO-01 -> 03, UI-SV-CV-01 -> 02) */}
        {activeMenu === 'profile_cv' && (
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Tab navigation: 1. Thông tin cá nhân | 2. Thư giới thiệu | 3. Quản lý kho CV */}
            <div className="p-4 rounded-3xl bg-slate-900/90 border border-blue-900/30 shadow-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProfileCvTab('personal')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${profileCvTab === 'personal'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                  <User className="w-4 h-4" />
                  <span>Thông Tin Cá Nhân</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileCvTab('cover_letter')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${profileCvTab === 'cover_letter'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Thư Giới Thiệu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileCvTab('resumes')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${profileCvTab === 'resumes'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Quản Lý Kho CV</span>
                </button>
              </div>

              {profileSaveMsg && (
                <span className="text-xs font-semibold text-emerald-400 animate-fade-in">
                  ✓ {profileSaveMsg}
                </span>
              )}
            </div>

            {/* TAB 1: THÔNG TIN CÁ NHÂN VỚI VALIDATOR SĐT 10 SỐ (1.3.1, 1.3.2) */}
            {profileCvTab === 'personal' && (
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-blue-900/30 shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white font-black text-lg flex items-center justify-center shadow-md">
                      {profile.full_name?.charAt(0) || 'V'}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{profile.full_name || 'Vũ Thế Long'}</h4>
                      <p className="text-xs text-sky-400 font-mono">{currentUser?.email || 'vuthelong@vlu.edu.vn'}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(!isEditingProfile);
                      setPhoneError('');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
                  >
                    <Edit className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isEditingProfile ? 'Hủy Sửa' : 'Chỉnh Sửa Hồ Sơ'}</span>
                  </button>
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleProfileSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Họ và Tên *</label>
                        <input
                          type="text"
                          required
                          value={profileForm.full_name}
                          onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Số Điện Thoại (Đúng 10 chữ số) *
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="0987654321"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-sky-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Trường Đại Học *</label>
                        <input
                          type="text"
                          required
                          value={profileForm.university}
                          onChange={(e) => setProfileForm({ ...profileForm, university: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Chuyên Ngành *</label>
                        <input
                          type="text"
                          required
                          value={profileForm.major}
                          onChange={(e) => setProfileForm({ ...profileForm, major: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    {phoneError && (
                      <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{phoneError}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950/60 cursor-pointer"
                      >
                        Lưu Thông Tin
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                      <p className="text-slate-400 font-medium">Họ và Tên Sinh Viên:</p>
                      <p className="text-sm font-bold text-white">{profile.full_name || 'Vũ Thế Long'}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                      <p className="text-slate-400 font-medium">Số Điện Thoại:</p>
                      <p className="text-sm font-bold text-sky-400 font-mono">{profile.phone || '0987654321'}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                      <p className="text-slate-400 font-medium">Trường Đào Tạo:</p>
                      <p className="text-sm font-bold text-white">{profile.university || 'Trường Đại học Văn Lang'}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                      <p className="text-slate-400 font-medium">Chuyên Ngành Học:</p>
                      <p className="text-sm font-bold text-white">{profile.major || 'Công nghệ thông tin'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: THƯ GIỚI THIỆU - COVER LETTER ĐẾM KÝ TỰ (1.3.3 - 1.3.5) */}
            {profileCvTab === 'cover_letter' && (
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-blue-900/30 shadow-2xl space-y-6">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-sky-400" />
                    <span>Quản Lý Thư Giới Thiệu (Cover Letter)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Tạo các mẫu thư giới thiệu ngắn gọn để đính kèm khi ứng tuyển công việc</p>
                </div>

                {/* Form Soạn thảo Thư với đếm ký tự (Max 5.000 ký tự - FR 1.3.3) */}
                <form onSubmit={handleSaveCoverLetter} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Tiêu Đề Thư Giới Thiệu *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Thư ứng tuyển vị trí Nhân viên Pha chế ca linh hoạt"
                      value={newCoverTitle}
                      onChange={(e) => setNewCoverTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300">Nội Dung Thư *</label>
                      <span className={`text-[11px] font-mono ${newCoverContent.length > 5000 ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                        {newCoverContent.length} / 5.000 ký tự
                      </span>
                    </div>
                    <textarea
                      required
                      rows={5}
                      maxLength={5000}
                      placeholder="Kính gửi Quý Doanh nghiệp, em tên là Vũ Thế Long, sinh viên năm 4 khoa CNTT Trường ĐH Văn Lang..."
                      value={newCoverContent}
                      onChange={(e) => setNewCoverContent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-sky-500 leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {editingCoverId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCoverId(null);
                          setNewCoverTitle('');
                          setNewCoverContent('');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                      >
                        Hủy Chỉnh Sửa
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={newCoverContent.length > 5000}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950/60 cursor-pointer disabled:opacity-40"
                    >
                      {editingCoverId ? 'Cập Nhật Thư' : '+ Thêm Thư Mới'}
                    </button>
                  </div>
                </form>

                {/* Danh sách Thư giới thiệu đã lưu (1.3.4, 1.3.5) */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Danh Sách Thư Của Bạn ({coverLetters.length})</h5>
                  {coverLetters.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">Chưa có thư giới thiệu nào.</p>
                  ) : (
                    coverLetters.map((cl) => (
                      <div
                        key={cl._id}
                        className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <h6 className="text-xs font-bold text-white">{cl.title}</h6>
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">"{cl.content}"</p>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Ngày tạo: {cl.created_at}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCoverId(cl._id);
                              setNewCoverTitle(cl.title);
                              setNewCoverContent(cl.content);
                            }}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 cursor-pointer"
                            title="Chỉnh sửa thư"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoverLetter(cl._id)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                            title="Xóa thư"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: KHO CV PDF & 4 NÚT THAO TÁC (FR 1.4.1 - 1.4.6) */}
            {profileCvTab === 'resumes' && (
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-blue-900/30 shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Upload className="w-5 h-5 text-sky-400" />
                      <span>Kho Quản Lý CV PDF (Tối đa 10MB)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Tải lên các mẫu CV định dạng PDF để nộp hồ sơ nhanh chóng</p>
                  </div>
                </div>

                {/* Upload Form có Hỗ Trợ Kéo Thả (Drag & Drop) và Progress bar (1.4.2) */}
                <div
                  onDragOver={handleCvDragOver}
                  onDragLeave={handleCvDragLeave}
                  onDrop={handleCvDrop}
                  className={`p-6 rounded-2xl border-2 border-dashed transition-all ${isDraggingCv
                    ? 'border-sky-400 bg-sky-500/20 scale-[1.01] shadow-2xl shadow-sky-950/60'
                    : 'border-slate-800 hover:border-sky-500/50 bg-slate-950'
                    }`}
                >
                  <label className="flex flex-col items-center justify-center cursor-pointer mb-3">
                    <Upload className={`w-8 h-8 mb-2 transition-transform ${isDraggingCv ? 'text-sky-300 scale-125 animate-bounce' : 'text-sky-400'}`} />
                    <span className="text-sm font-bold text-white text-center">
                      {isDraggingCv ? 'Thả tệp CV PDF vào đây để tải lên ngay!' : 'Kéo thả tệp CV từ máy tính vào đây hoặc nhấp để chọn tệp'}
                    </span>
                    <span className="text-[11px] text-sky-400 mt-1 font-semibold">Chỉ nhận .pdf (application/pdf), dung lượng ≤ 10MB</span>
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
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Đang xử lý tài liệu PDF...</span>
                        <span className="font-mono text-sky-400">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all duration-200"
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
                      className={`p-5 rounded-2xl bg-slate-950/80 border transition-all ${cv.is_default ? 'border-sky-500/60 shadow-xl shadow-sky-950/40' : 'border-slate-800'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center font-bold text-xs shrink-0">
                            PDF
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{cv.file_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Tải lên: {cv.created_at}</p>
                          </div>
                        </div>

                        {/* Badge CV mặc định phát sáng */}
                        {cv.is_default && (
                          <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-[10px] font-bold flex items-center gap-1 shrink-0 animate-pulse">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>Mặc định</span>
                          </span>
                        )}
                      </div>

                      {/* 4 Nút thao tác trên Card CV (FR 1.4.3 - 1.4.6) */}
                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800/80">
                        {/* 1. Icon Con mắt: Mở Modal xem trước PDF trực tiếp trên web (1.4.3) */}
                        <button
                          type="button"
                          onClick={() => setPreviewCvPdf(cv)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Xem trước PDF trực tiếp"
                        >
                          <Eye className="w-4 h-4 text-sky-400" />
                        </button>

                        {/* 2. Icon Ngôi sao: Đặt làm CV mặc định phát sáng vàng (1.4.5) */}
                        <button
                          type="button"
                          onClick={() => handleSetDefaultCv(cv._id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${cv.is_default
                            ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-yellow-400'
                            }`}
                          title="Đặt làm CV mặc định"
                        >
                          <Star className={`w-4 h-4 ${cv.is_default ? 'fill-yellow-400' : ''}`} />
                        </button>

                        {/* 3. Icon Đính kèm: Thay thế file CV từ máy tính (1.4.4) */}
                        <button
                          type="button"
                          onClick={() => {
                            setReplacingCvId(cv._id);
                            replaceCvInputRef.current?.click();
                          }}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Chọn tệp PDF từ máy tính để thay thế CV"
                        >
                          <Paperclip className="w-4 h-4 text-purple-400" />
                        </button>

                        {/* 4. Icon Thùng rác: Xóa CV (1.4.6) */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCv(cv._id)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors cursor-pointer"
                          title="Xóa CV"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>
        )}

        {/* 6. MÀN HÌNH ĐÁNH GIÁ NHÀ TUYỂN DỤNG (UI-SV-REV-01 -> 03 - 1.7.1 -> 1.7.4) */}
        {activeMenu === 'reviews' && (
          <div className="max-w-6xl mx-auto space-y-6">

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-blue-900/30 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span>Đánh Giá Doanh Nghiệp (Phúc Long Coffee & Tea)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Đánh giá 2 chiều minh bạch sau khi hoàn thành công việc</p>
              </div>

              {/* Tabs: Chờ đánh giá | Lịch sử đánh giá */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewTab('pending')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${reviewTab === 'pending' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Công Ty Chờ Đánh Giá ({completedJobsForReview.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewTab('history')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${reviewTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Lịch Sử Đánh Giá ({myReviews.length})
                </button>
              </div>
            </div>

            {/* TAB CHỜ ĐÁNH GIÁ (1.7.1, 1.7.2) */}
            {reviewTab === 'pending' && (
              <div className="space-y-4">
                {completedJobsForReview.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-500">
                    Hiện chưa có công việc hoàn thành nào chờ đánh giá. Sau khi được duyệt trúng tuyển và hoàn tất ca làm, bạn sẽ có thể viết đánh giá tại đây.
                  </div>
                ) : (
                  completedJobsForReview.map((app) => (
                    <div
                      key={app._id}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-blue-900/30 flex items-center justify-between gap-4 shadow-xl"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-white">{app.job_title}</h4>
                        <p className="text-xs font-semibold text-emerald-400 mt-0.5">{app.company_name}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">Trạng thái: Hoàn thành tuyển dụng</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setReviewModalJob(app);
                          setReviewScore(5);
                          setReviewContent('');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-yellow-950/60 cursor-pointer flex items-center gap-1.5"
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
                  <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-500">
                    Bạn chưa gửi đánh giá nào.
                  </div>
                ) : (
                  myReviews.map((rev) => {
                    const matchedApp = myApplications.find(a => a._id === rev.application_id);
                    const compName = rev.company_name || matchedApp?.company_name || 'Phúc Long Coffee & Tea';
                    const jTitle = rev.job_title || matchedApp?.job_title || 'Việc làm bán thời gian';

                    return (
                      <div
                        key={rev._id}
                        onClick={() => handleOpenReviewDetail({ ...rev, company_name: compName, job_title: jTitle })}
                        className="p-5 rounded-2xl bg-slate-900/90 border border-blue-900/30 hover:border-sky-500/60 transition-all cursor-pointer shadow-xl space-y-3 group"
                        title="Nhấn vào để xem đầy đủ nội dung bài nhận xét chi tiết"
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
                            <span className="text-xs font-bold text-sky-400 ml-2">
                              • {compName}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{rev.created_at}</span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                          "{rev.comment}"
                        </p>

                        {/* RÀNG BUỘC 1.7.4: Nút Sửa đánh giá bị ẩn nếu Admin khóa is_hidden = true */}
                        {rev.is_hidden ? (
                          <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-[11px]">
                            ⚠️ Đánh giá này đã bị Quản trị viên ẩn do vi phạm tiêu chuẩn cộng đồng.
                          </div>
                        ) : (
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReviewDetail({ ...rev, company_name: compName, job_title: jTitle });
                              }}
                              className="text-xs font-semibold text-slate-400 hover:text-sky-300 cursor-pointer flex items-center gap-1.5 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-sky-400" />
                              <span>Xem chi tiết đánh giá</span>
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
                              className="text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Sửa đánh giá</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        )}

        {/* 7. MÀN HÌNH CHAT CHI TIẾT & GỌI VIDEO WEBRTC (UI-SV-CHAT-02, UI-SV-CALL-01 - 1.8 & 1.10) */}
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
                  Bạn chưa ứng tuyển vào công việc nào. Khi bạn nộp hồ sơ ứng tuyển, bạn có thể trò chuyện và trao đổi trực tiếp với nhà tuyển dụng tại đây.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveMenu('jobs')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-900/40 flex items-center gap-2 cursor-pointer"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Tìm Việc Ngay ({jobs.length} việc làm)</span>
                </button>
              </div>
            ) : (
              <>
            {/* Khung Header Chat: Tên NTD, Online/Offline, Icon Camera WebRTC, Icon 3 chấm -> Báo cáo */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    {selectedContact?.name?.charAt(0) || 'P'}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${selectedContact?.online ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}></span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{selectedContact?.name || 'Phúc Long Coffee & Tea'}</h4>
                  <p className="text-[10px] text-emerald-400 font-medium">
                    {selectedContact?.online ? '● Đang trực tuyến' : '○ Ngoại tuyến'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 2 Nút Gọi Trực Tuyến: Gọi Thoại & Gọi Video (FR 1.10.4) */}
                <button
                  type="button"
                  onClick={() => handleStartCall('audio')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 hover:border-sky-500/50 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  title="Gọi thoại trực tiếp với Doanh nghiệp"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Gọi Thoại</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartCall('video')}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-bold transition-all shadow-md shadow-blue-950/60 flex items-center gap-1.5 cursor-pointer"
                  title="Gọi video phỏng vấn trực tuyến qua WebRTC"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Phỏng Vấn Video</span>
                </button>

                {/* Icon Cờ Báo Cáo Vi Phạm (FR 1.8.5) */}
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
                      target_id: selectedContact?.id || 'emp_user_employer_ngoc',
                      target_title: `Hội thoại với ${selectedContact?.name || 'Doanh nghiệp'}`
                    });
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Báo cáo quấy rối hoặc vi phạm quy định cộng đồng"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* MÀN HÌNH GỌI TRỰC TUYẾN 2 CHIỀU (UI-SV-CALL-01) */}
            {isVideoCalling ? (
              <div className="flex-1 bg-black relative flex flex-col items-center justify-center p-4">
                {/* Khung hình chính cuộc gọi */}
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
                        <h3 className="text-base font-black text-white">Đang đổ chuông tới Phúc Long Coffee & Tea...</h3>
                        <p className="text-xs text-slate-400 mt-1">Vui lòng chờ Nhà tuyển dụng nhấc máy phỏng vấn</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="w-24 h-24 rounded-full bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-black text-3xl flex items-center justify-center mx-auto animate-pulse">
                        PL
                      </div>
                      <p className="text-sm font-bold text-white">
                        {callType === 'video' ? 'Cuộc gọi Video phỏng vấn với Phúc Long Coffee & Tea' : 'Cuộc gọi Thoại Audio với Phúc Long Coffee & Tea'}
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Thời lượng: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                  )}

                  {/* Khung hình camera phụ nếu là cuộc gọi Video */}
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
                        Bạn (Vũ Thế Long)
                      </span>
                    </div>
                  )}
                </div>

                {/* Các nút điều khiển cuộc gọi: Mic, Camera (nếu video), Cúp máy */}
                <div className="flex items-center gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3.5 rounded-full cursor-pointer transition-all ${isMuted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                    title={isMuted ? 'Bật Mic' : 'Tắt Mic'}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {callType === 'video' && (
                    <button
                      type="button"
                      onClick={() => setIsCameraOff(!isCameraOff)}
                      className={`p-3.5 rounded-full cursor-pointer transition-all ${isCameraOff ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
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
                    title="Kết thúc cuộc gọi"
                  >
                    <Phone className="w-5 h-5 rotate-[135deg]" />
                  </button>
                </div>
              </div>
            ) : (
              /* KHUNG TIN NHẮN CHAT NGUYÊN BẢN (FR 1.8.2 & 1.10.3) */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((m) => {
                    if (m.type === 'call_record') {
                      const isOutgoing = m.caller_role === 'student' || m.caller_id === currentUser?._id;
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
                          <div className={`px-4 py-2 rounded-2xl text-xs font-bold border flex items-center gap-2 shadow-sm ${isOutgoing
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

                    const isMe = m.sender_role === 'student' || m.sender_email === currentUser?.email;
                    return (
                      <div
                        key={m._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[10px] font-bold text-slate-400">
                            {isMe ? 'Bạn (Vũ Thế Long)' : (m.sender_name || 'Phúc Long Coffee & Tea')}
                          </span>
                          <span className="text-[9px] text-slate-600 font-mono">{m.created_at}</span>
                        </div>

                        {/* Bong bóng tin nhắn kèm cảnh báo từ cấm & tệp đính kèm */}
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${isMe
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

                {/* Form nhập tin nhắn kèm nút đính kèm tệp */}
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

                  <input
                    type="text"
                    value={newMsgText}
                    onChange={(e) => setNewMsgText(e.target.value)}
                    placeholder="Nhập tin nhắn... (Hệ thống tự động lọc từ ngữ cấm ***)"
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
              </>
            )}
              </>
            )}

          </div>
        )}

      </main>

      {/* ======================= SLIDE-OVER PANE CHI TIẾT JD (1.5.3) ======================= */}
      {selectedJobDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-slate-900 border-l border-blue-900/50 flex flex-col shadow-2xl h-full animate-in slide-in-from-right duration-300 p-6 overflow-y-auto space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-sky-300 text-[10px] font-bold">
                  {selectedJobDetail.work_time || 'Ca làm linh hoạt'}
                </span>
                <h3 className="text-lg font-black text-white mt-1.5">{selectedJobDetail.title}</h3>
                <p className="text-xs font-semibold text-emerald-400 mt-0.5">{selectedJobDetail.company_name}</p>
                <p className="text-[11px] text-slate-400">{selectedJobDetail.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông số việc làm */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Mức Lương Theo Giờ</span>
                <span className="text-sm font-bold text-sky-400">
                  {selectedJobDetail.is_negotiable ? 'Thỏa thuận' : `${selectedJobDetail.salary_min?.toLocaleString()}đ - ${selectedJobDetail.salary_max?.toLocaleString()}đ/h`}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Độ Tin Cậy Doanh Nghiệp</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Đã xác thực GPKD</span>
                </span>
              </div>
            </div>

            {/* Mô tả chi tiết JD */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Mô Tả Chi Tiết Công Việc (JD)</h4>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedJobDetail.description}
              </div>
            </div>

            {/* Footer Buttons: Ứng tuyển & Báo cáo lừa đảo (FR 1.5.7) */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setReportModalData({
                    type: 'job',
                    target_id: selectedJobDetail._id,
                    target_title: selectedJobDetail.title
                  });
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Báo cáo tin tuyển dụng vi phạm quy định"
              >
                <Flag className="w-4 h-4" />
                <span>Báo Cáo Vi Phạm</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedJobDetail(null);
                  setApplyModalJob(selectedJobDetail);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-blue-950/60 cursor-pointer"
              >
                Ứng Tuyển Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= POPUP MODAL ỨNG TUYỂN (UI-SV-APP-01 - 1.5.6) ======================= */}
      {applyModalJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-900/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-blue-950/80 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white">Nộp Hồ Sơ Ứng Tuyển</h3>
                <p className="text-xs text-sky-400 font-semibold mt-0.5">{applyModalJob.title}</p>
                <p className="text-[11px] text-slate-400">{applyModalJob.company_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyModalJob(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyJobSubmit} className="space-y-4">
              {/* Tự động chọn sẵn "CV Mặc định" (FR 1.5.6) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Chọn CV Ứng Tuyển (Tự động chọn CV Mặc định) *
                </label>
                <select
                  required
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-sky-500"
                >
                  {myResumes.length === 0 ? (
                    <option value="">Chưa có CV nào - Hãy tải CV lên trước</option>
                  ) : (
                    myResumes.map(r => (
                      <option key={r._id} value={r._id}>
                        {r.file_name} {r.is_default ? '(⭐ CV Mặc Định)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Đính kèm Thư giới thiệu (FR 1.5.6: Bộ đếm ký tự <= 5.000) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    Lời Nhắn / Thư Giới Thiệu Đến Doanh Nghiệp
                  </label>
                  <span className={`text-[10px] font-mono ${customCoverNote.length > 5000 ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                    {customCoverNote.length} / 5.000 ký tự
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={5000}
                  placeholder="Giới thiệu nhanh về khung giờ rảnh và mong muốn làm việc của bạn (tối đa 5.000 ký tự)..."
                  value={customCoverNote}
                  onChange={(e) => setCustomCoverNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-sky-500 leading-relaxed"
                />
              </div>

              {applyMsg.text && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${applyMsg.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/60 border border-red-500/50 text-red-300'
                  }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{applyMsg.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalJob(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={applyLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-black shadow-lg shadow-blue-950/60 cursor-pointer disabled:opacity-50"
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
          studentName: currentUser?.profile?.full_name || currentUser?.full_name || 'Vũ Thế Long',
          major: currentUser?.profile?.major || 'Công nghệ thông tin',
          university: currentUser?.profile?.university || 'Trường Đại học Văn Lang',
          phone: currentUser?.profile?.phone || '0987654321',
          email: currentUser?.email || 'vuthelong@vlu.edu.vn',
          fileName: previewCvPdf?.file_name || 'CV_VuTheLong_CNTT.pdf',
          fileUrl: previewCvPdf?.file_url
        }}
        onDownloadSuccess={(msg) => onShowBanner && onShowBanner(msg, 'success')}
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
              <h3 className="text-lg font-black text-white">{incomingCall.caller_name || 'Phúc Long Coffee & Tea'}</h3>
              <p className="text-xs text-slate-400 mt-1">
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
                <span>Từ Chối</span>
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

      {/* ======================= MODAL BÁO CÁO VI PHẠM (FR 1.5.7 & 1.8.5) ======================= */}
      {reportModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-red-950/60 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-red-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-black text-white">Báo Cáo Vi Phạm Tới Admin</h3>
              </div>
              <button
                type="button"
                onClick={() => setReportModalData(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Đối tượng bị báo cáo: <strong className="text-white">{reportModalData.target_title}</strong>
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Lý do vi phạm (ví dụ: yêu cầu nạp tiền, thu cọc đồng phục, quấy rối) *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Mô tả cụ thể hành vi vi phạm..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-red-500 leading-relaxed"
                />
              </div>

              {reportMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs">
                  {reportMsg}
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

      {/* ======================= MODAL VIẾT ĐÁNH GIÁ CÔNG TY (1.7.2) ======================= */}
      {reviewModalJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-900/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-white">Đánh Giá Nhà Tuyển Dụng</h3>
                <p className="text-xs text-emerald-400 font-semibold">{reviewModalJob.company_name}</p>
                <p className="text-[11px] text-slate-400">{reviewModalJob.job_title}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalJob(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* 1 - 5 sao phát sáng khi rê chuột (FR 1.7.2) */}
              <div className="space-y-1 text-center py-2">
                <label className="block text-xs font-bold text-slate-300 mb-2">Số Điểm Đánh Giá</label>
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
                          : 'text-slate-700'
                          }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-yellow-400 block mt-1">
                  {reviewScore === 5 ? 'Tuyệt vời (5/5 sao)' : (reviewScore === 4 ? 'Rất tốt (4/5 sao)' : `${reviewScore}/5 sao`)}
                </span>
              </div>

              {/* Nhận xét (< 1.000 ký tự - FR 1.7.2) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">Nhận xét trải nghiệm làm việc *</label>
                  <span className="text-[10px] text-slate-400 font-mono">{reviewContent.length}/1.000 ký tự</span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  placeholder="Chia sẻ về môi trường làm việc, quản lý, xếp ca học..."
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-sky-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalJob(null)}
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

      {/* ======================= MODAL XEM CHI TIẾT BÀI ĐÁNH GIÁ (FR-SV-07.03 - 1.7.3) ======================= */}
      {viewReviewDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0b1329] border border-blue-500/40 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 bg-[#090f20] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                  <Star className="w-5 h-5 fill-yellow-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Chi Tiết Bài Đánh Giá</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Đánh giá 2 chiều minh bạch sau khi hoàn thành công việc
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewReviewDetailModal(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Doanh nghiệp & Vị trí */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400">Doanh Nghiệp Được Đánh Giá</span>
                  <h4 className="text-sm font-bold text-white">
                    {viewReviewDetailModal.company_name || 'Phúc Long Coffee & Tea'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {viewReviewDetailModal.job_title || 'Mẫu ảnh thời trang Lookbook / Việc làm Part-time'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono block">Ngày nhận xét</span>
                  <span className="text-xs font-mono text-slate-300 font-semibold">{viewReviewDetailModal.created_at}</span>
                </div>
              </div>

              {/* Số sao đánh giá */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Điểm đánh giá:</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-yellow-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${s <= viewReviewDetailModal.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-700'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-black text-yellow-300">
                    ({viewReviewDetailModal.rating}/5 sao)
                  </span>
                </div>
              </div>

              {/* Trạng thái kiểm duyệt */}
              {viewReviewDetailModal.is_hidden ? (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>Đánh giá này đã bị Quản trị viên ẩn do vi phạm tiêu chuẩn cộng đồng.</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Đánh giá đã được xác thực và hiển thị công khai trên hệ thống.</span>
                </div>
              )}

              {/* Nội dung đầy đủ bài nhận xét văn bản */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nội Dung Văn Bản Nhận Xét Đầy Đủ (1.7.3)
                </label>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 text-sm text-slate-200 leading-relaxed whitespace-pre-line shadow-inner min-h-[90px]">
                  {viewReviewDetailModal.comment ? `"${viewReviewDetailModal.comment}"` : 'Không có nội dung văn bản.'}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#090f20] border-t border-slate-800 flex items-center justify-between">
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
                        company_name: cur.company_name || 'Phúc Long Coffee & Tea'
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Sửa Đánh Giá Này</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewReviewDetailModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL SỬA ĐÁNH GIÁ (FR 1.7.4) ======================= */}
      {editingReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-900/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-white">Chỉnh Sửa Đánh Giá</h3>
                <p className="text-xs text-sky-400 font-semibold mt-0.5">{editingReviewModal.company_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingReviewModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Đánh giá số sao (1-5 sao)</label>
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
                          : 'text-slate-700 hover:text-yellow-500'
                          }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-400 ml-2">
                    {editingReviewModal.rating}/5 sao
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nội dung nhận xét (&lt; 1000 ký tự) *
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  placeholder="Nhập nội dung nhận xét chi tiết..."
                  value={editingReviewModal.comment}
                  onChange={(e) => setEditingReviewModal(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-sky-500 leading-relaxed"
                />
                <div className="text-right text-[10px] text-slate-500 mt-1">
                  {editingReviewModal.comment?.length || 0}/1000 ký tự
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReviewModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-950/60 cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
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
