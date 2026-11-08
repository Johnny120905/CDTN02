import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase, Search, Filter, Bookmark, Send, Clock,
  CheckCircle2, XCircle, AlertCircle, FileText, Upload, Download,
  Trash2, Eye, Star, MessageSquare, Video, Bell, User,
  KeyRound, ChevronRight, ChevronLeft, Check, AlertTriangle, RefreshCw,
  Phone, Mic, MicOff, Camera, CameraOff, Paperclip, Menu,
  ArrowUpDown, X, Home, Activity, Flag, Edit,
  MoreVertical, FileCheck, Building, HelpCircle, ChevronDown, Heart,
  Calendar, CalendarDays, CheckSquare, Layers, MapPin, DollarSign,
  ShieldCheck, ExternalLink, ArrowRight, CornerDownRight,
  Coffee, ShoppingCart, GraduationCap, Package, Laptop, PartyPopper
} from 'lucide-react';
import { PROFESSION_SUGGESTIONS, filterSuggestions, getStatusBadge, HCM_DISTRICTS, HCM_BRANCH_SUGGESTIONS, JOB_CATEGORIES } from '../../shared/professionSuggestions';
import {
  VIETNAM_PROVINCES,
  PROVINCE_DISTRICTS_MAP,
  getDistrictsByProvince,
  SALARY_BRACKETS,
  WORK_SHIFTS
} from '../../shared/vietnamLocations';
import DocumentViewerModal from '../../shared/DocumentViewerModal';
import ConfirmDialog from '../../shared/ConfirmDialog';
import {
  getSocket,
  createPeerConnection,
  closePeerConnection,
  getLocalMediaStream,
  stopMediaStream
} from '../../shared/webrtcSocketService';

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
  // Navigation State
  const [activeMenu, setActiveMenu] = useState(() => localStorage.getItem('partime_active_menu_student') || 'home'); // 'home' | 'jobs' | 'saved_jobs' | 'applications' | 'profile_cv' | 'reviews' | 'chat'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('partime_sidebar_collapsed_student') === 'true');
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('partime_sidebar_collapsed_student', String(next));
      return next;
    });
  };
  const [reviewTab, setReviewTab] = useState('pending'); // 'pending' | 'history'
  const [userStatus, setUserStatus] = useState(currentUser?.profile?.status || currentUser?.status || 'active');

  // Slide-over pane for Job Detail
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);

  // Confetti Animation Trigger State
  const [showConfetti, setShowConfetti] = useState(false);

  // Contacts List for Student (Khởi tạo rỗng, tự động tải từ CSDL thật khi có đơn ứng tuyển)
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  const getRoomId = (targetContact = selectedContact) => {
    if (!targetContact) return 'room_main';
    const empId = targetContact.employer_id || targetContact.id;
    const stuId = currentUser?._id || currentUser?.id || 'student';
    return `room_emp_${empId}_stu_${stuId}`;
  };

  // Data States
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [savedJobs, setSavedJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [myResumes, setMyResumes] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [profile, setProfile] = useState({
    full_name: isGuestMode ? '' : (currentUser?.profile?.full_name || currentUser?.full_name || ''),
    phone: isGuestMode ? '' : (currentUser?.profile?.phone || ''),
    university: isGuestMode ? '' : (currentUser?.profile?.university || ''),
    major: isGuestMode ? '' : (currentUser?.profile?.major || '')
  });

  // Sync profile when currentUser or isGuestMode changes
  useEffect(() => {
    if (isGuestMode || !currentUser) {
      setProfile({
        full_name: '',
        phone: '',
        university: '',
        major: ''
      });
    } else {
      setProfile({
        full_name: currentUser?.profile?.full_name || currentUser?.full_name || '',
        phone: currentUser?.profile?.phone || '',
        university: currentUser?.profile?.university || '',
        major: currentUser?.profile?.major || ''
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
  const [jobPage, setJobPage] = useState(1);
  const JOBS_PER_PAGE = 10;
  const [heroKeyword, setHeroKeyword] = useState('');
  const [heroProvince, setHeroProvince] = useState('');

  // Lịch ca làm đã nhận (my_shifts) States
  const [shiftFilterWeek, setShiftFilterWeek] = useState('current'); // 'current' | 'next' | 'all'
  const [shiftFilterTime, setShiftFilterTime] = useState('all'); // 'all' | 'morning' | 'afternoon' | 'evening'
  const [shiftStatuses, setShiftStatuses] = useState({
    'shift_demo_1': 'in_progress',
    'shift_demo_2': 'upcoming'
  });

  // Applications Filter
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusTab, setAppStatusTab] = useState('all'); // 'all' | 'pending' | 'accepted' | 'rejected' | 'cancelled'
  const [selectedAppTimeline, setSelectedAppTimeline] = useState(null);

  // Profile Edit State with 10-Digit Phone Validator & Weekly Free Matrix
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    university: '',
    major: ''
  });
  const [phoneError, setPhoneError] = useState('');
  const [profileSaveMsg, setProfileSaveMsg] = useState('');

  // Weekly Free Schedule Matrix (Thứ 2 - CN x Sáng, Chiều, Tối)
  const [freeSchedule, setFreeSchedule] = useState(() => {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const init = {};
    days.forEach(d => {
      init[d] = { morning: false, afternoon: false, evening: false };
    });
    return init;
  });

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

  // Chat State (Khởi tạo rỗng, tự động tải lịch sử thực tế từ CSDL)
  const [chatMessages, setChatMessages] = useState([]);
  const [newMsgText, setNewMsgText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatAttachment, setChatAttachment] = useState(null); // { file, name, size, type, base64, sizeStr }
  const [chatPreviewDoc, setChatPreviewDoc] = useState(null);
  const chatFileInputRef = useRef(null);

  const token = isGuestMode ? null : localStorage.getItem('partime_token');
  const headers = token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' };

  // Sync section title with parent - 9 Mục Sinh Viên chuẩn
  const sectionTitleMap = {
    home: 'Trang chủ',
    jobs: 'Khám việc làm',
    saved_jobs: 'Việc làm đã lưu',
    applications: 'Tiến độ ứng tuyển',
    my_shifts: 'Lịch ca làm đã nhận',
    profile_cv: 'Quản lý CV',
    student_profile: 'Hồ sơ cá nhân & Lịch rảnh',
    reviews: 'Doanh nghiệp chờ đánh giá',
    chat: 'Tin nhắn & Phỏng vấn'
  };

  useEffect(() => {
    localStorage.setItem('partime_active_menu_student', activeMenu);
  }, [activeMenu]);

  const handleMenuSwitch = (menuId) => {
    setActiveMenu(menuId);
    if (onSectionChange) onSectionChange(sectionTitleMap[menuId] || 'Trang chủ');
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
  }, [token, isGuestMode, currentUser]);

  // Reset toàn bộ dữ liệu nội bộ sinh viên khi đăng xuất hoặc ở chế độ khách
  useEffect(() => {
    if (isGuestMode || !token || !currentUser) {
      setBookmarkedIds(new Set());
      setSavedJobs([]);
      setMyApplications([]);
      setMyResumes([]);
      setMyReviews([]);
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
    if (!isGuestMode && token && currentUser) {
      fetchBookmarks();
      fetchApplications();
      fetchResumes();
      fetchReviews();
      fetchProfile();
      fetchChatMessages();
    } else if (isGuestMode || !currentUser) {
      setBookmarkedIds(new Set());
      setSavedJobs([]);
      setMyApplications([]);
      setMyResumes([]);
      setMyReviews([]);
      setContacts([]);
      setSelectedContact(null);
      setChatMessages([]);
    }
  };

  // Socket.IO Room Joining & WebRTC P2P Signaling Listeners (FR 1.10.4)
  useEffect(() => {
    if (!token) return;
    const socket = getSocket();
    const currentRoomId = getRoomId();
    const stuId = currentUser?._id || currentUser?.id || 'student';
    if (currentRoomId) {
      socket.emit('join-room', {
        room_id: currentRoomId,
        user_id: stuId,
        role: 'student'
      });
    }

    const onIncomingCall = (data) => {
      if (data.caller_role === 'employer' && !isVideoCalling) {
        setIncomingCall(data);
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
      handleEndCall(false);
      if (onShowBanner) onShowBanner('Nhà tuyển dụng đã kết thúc cuộc gọi.', 'success');
    };

    const onCallRejected = () => {
      handleEndCall(false);
      if (onShowBanner) onShowBanner('Nhà tuyển dụng đã từ chối cuộc gọi.', 'error');
    };

    socket.on('incoming-call', onIncomingCall);
    socket.on('answer-made', onAnswerMade);
    socket.on('receive-candidate', onReceiveCandidate);
    socket.on('call-ended', onCallEnded);
    socket.on('call-rejected', onCallRejected);

    // Fallback polling phụ trợ (mỗi 3 giây)
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/call/status?room_id=${currentRoomId}`, { headers });
        const data = await res.json();
        if (data.success && data.call) {
          const call = data.call;
          if (call.status === 'ringing' && call.target_role === 'student' && !isVideoCalling && !incomingCall) {
            setIncomingCall(call);
          } else if (callStatus === 'calling' && call.status === 'connected') {
            setCallStatus('connected');
          } else if (isVideoCalling && (call.status === 'ended' || call.status === 'declined')) {
            handleEndCall(false);
          }
        }
      } catch (e) { }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      socket.off('incoming-call', onIncomingCall);
      socket.off('answer-made', onAnswerMade);
      socket.off('receive-candidate', onReceiveCandidate);
      socket.off('call-ended', onCallEnded);
      socket.off('call-rejected', onCallRejected);
    };
  }, [token, isVideoCalling, callStatus, incomingCall, selectedContact, currentUser]);

  // Periodic poll for chat messages when activeMenu === 'chat'
  useEffect(() => {
    if (!token || activeMenu !== 'chat') return;
    fetchChatMessages(selectedContact);
    const chatPoll = setInterval(() => {
      fetchChatMessages(selectedContact);
    }, 2000);
    return () => clearInterval(chatPoll);
  }, [token, activeMenu, selectedContact]);

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
        body: JSON.stringify({ room_id: currentRoomId, call_type: type })
      });
      if (onShowBanner) onShowBanner(`Đang đổ chuông cuộc gọi ${type === 'video' ? 'Video' : 'Thoại'} tới Doanh nghiệp...`, 'loading');
    } catch (e) {
      console.warn('[WebRTC Call Error]', e);
      notify('Không thể truy cập Camera/Micro.', 'error');
    }
  };

  const handleAnswerIncomingCall = async () => {
    if (!incomingCall) return;
    const socket = getSocket();
    const currentRoomId = incomingCall.room_id || getRoomId();
    const type = incomingCall.call_type || 'video';

    setCallType(type);
    setIncomingCall(null);
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

      if (incomingCall.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
        while (pendingIceCandidatesRef.current.length > 0) {
          const cand = pendingIceCandidatesRef.current.shift();
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('make-answer', {
        room_id: currentRoomId,
        answer: answer
      });

      // REST persistence
      await fetch('/api/chat/call/respond', {
        method: 'POST',
        headers,
        body: JSON.stringify({ room_id: currentRoomId, action: 'accept' })
      });
      if (onShowBanner) onShowBanner('Đã kết nối cuộc gọi phỏng vấn thành công!', 'success');
    } catch (e) {
      console.warn('[WebRTC Answer Error]', e);
      notify('Lỗi kết nối WebRTC.', 'error');
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
  };

  const handleEndCall = async (notifyBackend = true) => {
    const socket = getSocket();
    const currentRoomId = getRoomId();

    socket.emit('end-call', { room_id: currentRoomId });

    if (peerConnectionRef.current) {
      closePeerConnection(peerConnectionRef.current);
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      stopMediaStream(localStreamRef.current);
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    pendingIceCandidatesRef.current = [];
    setHasRemoteVideo(false);

    if (notifyBackend) {
      try {
        await fetch('/api/chat/call/end', {
          method: 'POST',
          headers,
          body: JSON.stringify({ room_id: currentRoomId })
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
    fetchChatMessages();
  };

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

        // Đồng bộ danh bạ hội thoại với các Nhà tuyển dụng mà sinh viên đã nộp hồ sơ ứng tuyển
        const contactList = [];
        const seenEmp = new Set();

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
        if (data.data.free_schedule && typeof data.data.free_schedule === 'object') {
          setFreeSchedule(prev => ({ ...prev, ...data.data.free_schedule }));
        }
      }
    } catch (err) {
      console.warn('Could not fetch profile:', err);
    }
  };

  const fetchChatMessages = async (targetContact = selectedContact) => {
    if (isGuestMode || !token || !currentUser) {
      setChatMessages([]);
      return;
    }
    const contactToFetch = targetContact || selectedContact;
    if (!contactToFetch) {
      setChatMessages([]);
      return;
    }
    const roomId = getRoomId(contactToFetch);
    try {
      const res = await fetch(`/api/chat/messages?room_id=${roomId}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setChatMessages(data.data);
      } else {
        setChatMessages([]);
      }
    } catch (err) {
      console.warn('Chat message fetch fallback:', err);
      setChatMessages([]);
    }
  };

  // Tự động tải lại tin nhắn khi sinh viên chọn nhà tuyển dụng khác
  useEffect(() => {
    if (selectedContact) {
      fetchChatMessages(selectedContact);
    } else {
      setChatMessages([]);
    }
  }, [selectedContact]);

  // Open Apply Modal helper with Guest check
  const handleOpenApplyModal = (job) => {
    if (isGuestMode || !token) {
      if (onShowBanner) onShowBanner('Bạn cần Đăng ký hoặc Đăng nhập tài khoản Sinh viên để nộp hồ sơ ứng tuyển công việc này!', 'error');
      if (onNavigateAuth) onNavigateAuth('login', 'student');
      return;
    }
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
        setApplyMsg({ text: 'Nộp hồ sơ ứng tuyển thành công! Thông báo đã gửi tới Nhà tuyển dụng.', type: 'success' });
        setShowConfetti(true);
        fetchApplications();
        setTimeout(() => {
          setShowConfetti(false);
          setApplyModalJob(null);
          setApplyMsg({ text: '', type: '' });
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

  // Cancel Application
  const handleCancelApplication = async (appId) => {
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
    }
  };

  // Permanently Delete Application
  const handleDeleteApplication = (app) => {
    setConfirmDialogConfig({
      isOpen: true,
      title: 'Xóa Đơn Ứng Tuyển Vĩnh Viễn',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn đơn ứng tuyển vị trí "${app.job_title || 'Công việc'}" tại "${app.company_name || 'Doanh nghiệp'}" khỏi hệ thống?`,
      type: 'danger',
      confirmText: 'Xóa Vĩnh Viễn',
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
        body: JSON.stringify({
          ...profileForm,
          free_schedule: freeSchedule
        })
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

  // Persist Weekly Free Schedule Matrix to Backend
  const handleSaveFreeSchedule = async () => {
    if (isGuestMode || !token) {
      notify('Vui lòng đăng nhập tài khoản Sinh viên để lưu lịch rảnh!', 'info');
      if (onNavigateAuth) onNavigateAuth('login', 'student');
      return;
    }
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          full_name: profileForm.full_name || profile.full_name || '',
          phone: profileForm.phone || profile.phone || '',
          university: profileForm.university || profile.university || '',
          major: profileForm.major || profile.major || '',
          free_schedule: freeSchedule
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.data) setProfile(data.data);
        notify('Đã lưu khung giờ rảnh theo tuần thành công!', 'success');
      } else {
        notify(data.message || 'Không thể lưu lịch rảnh.', 'error');
      }
    } catch (err) {
      notify('Lỗi kết nối máy chủ khi lưu lịch rảnh.', 'error');
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
      confirmText: 'Xóa Đánh Giá',
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
      sender_id: currentUser?._id || 'student',
      sender_role: 'student',
      sender_email: currentUser?.email || '',
      sender_name: profile.full_name || currentUser?.profile?.full_name || currentUser?.full_name || 'Sinh viên',
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

  // Available districts when province selected
  const availableDistricts = selectedProvince ? getDistrictsByProvince(selectedProvince) : [];

  const handleToggleDistrict = (dist) => {
    setSelectedDistricts(prev =>
      prev.includes(dist) ? prev.filter(d => d !== dist) : [...prev, dist]
    );
  };

  // Danh sách việc làm đang mở công khai (đồng bộ 100% giữa Sidebar và Main Content)
  const activeOpenJobs = jobs.filter(
    j => !j.is_hidden && j.status !== 'banned' && j.status !== 'closed' && j.job_status !== 'closed'
  );

  // Filter Jobs (63 Tỉnh Thành, Đa Quận Huyện, Nhập tay, Khung ca, Khoảng lương theo giờ)
  const filteredJobs = activeOpenJobs.filter(j => {

    // 1. Tìm kiếm theo từ khóa Chức danh công việc / công ty
    const jTitle = (j.title || '').toLowerCase();
    const jCompany = (j.company_name || '').toLowerCase();
    const jDesc = (j.description || '').toLowerCase();
    const sQuery = searchQuery.trim().toLowerCase();
    const matchesSearch = !sQuery ||
      jTitle.includes(sQuery) ||
      jCompany.includes(sQuery) ||
      jDesc.includes(sQuery);

    // 2. Ngành nghề: Lấy từ nguồn danh mục Master Data
    const matchesCat = !selectedCategory || j.category_id === selectedCategory || j.category === selectedCategory;

    // 3. Địa điểm: Tỉnh/Thành phố -> Chọn nhiều Quận/Huyện -> Ô nhập tay tùy chỉnh
    let matchesLoc = true;
    const jobLoc = ((j.location || '') + ' ' + (j.address || '')).toLowerCase();
    if (selectedProvince) {
      const pLower = selectedProvince.toLowerCase();
      const matchProv = jobLoc.includes(pLower) || (selectedProvince === 'TP. Hồ Chí Minh' && (jobLoc.includes('hồ chí minh') || jobLoc.includes('tp.hcm') || jobLoc.includes('tphcm')));
      if (!matchProv) {
        matchesLoc = false;
      } else if (selectedDistricts.length > 0) {
        matchesLoc = selectedDistricts.some(d => jobLoc.includes(d.toLowerCase()));
      }
    }
    if (customLocationText.trim()) {
      matchesLoc = matchesLoc && jobLoc.includes(customLocationText.trim().toLowerCase());
    }

    // 4. Ca làm việc: Ca sáng, Ca chiều, Ca tối, Ca linh hoạt
    let matchesShift = true;
    if (selectedShift) {
      const wt = ((j.work_time || '') + ' ' + (j.shift_schedule || '')).toLowerCase();
      if (selectedShift === 'morning') matchesShift = wt.includes('sáng');
      else if (selectedShift === 'afternoon') matchesShift = wt.includes('chiều');
      else if (selectedShift === 'evening') matchesShift = wt.includes('tối');
      else if (selectedShift === 'flexible') matchesShift = wt.includes('linh hoạt') || wt.includes('tự chọn');
    }

    // 5. Khoảng lương theo giờ: Dưới 20k/h, 20k-25k, 25k-30k, 30k-40k, Trên 40k/h (đối chiếu cả thỏa thuận hoặc giao thoa)
    let matchesSal = true;
    if (salaryFilter) {
      const isNegotiable = j.is_negotiable === true || (!j.salary_min && !j.salary_max);
      if (salaryFilter === 'negotiable') {
        matchesSal = isNegotiable;
      } else if (isNegotiable) {
        matchesSal = true;
      } else {
        const bracket = SALARY_BRACKETS.find(b => b.id === salaryFilter);
        if (bracket && bracket.min !== undefined) {
          const jMin = Number(j.salary_min) || 0;
          const jMax = Number(j.salary_max) || jMin;
          matchesSal = (jMax >= bracket.min && jMin <= bracket.max);
        }
      }
    }

    return matchesSearch && matchesCat && matchesLoc && matchesShift && matchesSal;
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

  // Completed jobs ready for review (loại trừ các đơn đã gửi đánh giá để khớp 100% với danh sách chờ đánh giá)
  const reviewedStudentAppIds = new Set(myReviews.map(r => String(r.application_id || '')));
  const completedJobsForReview = isGuestMode
    ? []
    : myApplications.filter(a => a.application_status === 'accepted' && !reviewedStudentAppIds.has(String(a._id)));

  // Đơn ứng tuyển đã đạt trạng thái Đã duyệt cho Lịch ca làm đã nhận (my_shifts)
  const acceptedApplications = isGuestMode ? [] : myApplications.filter(a => a.application_status === 'accepted' || a.status === 'accepted');

  // Sidebar Menu Items for Student (Đúng 9 Danh mục chuẩn - Khớp 100% với Main Content)
  const studentMenuItems = [
    { id: 'home', label: 'Trang chủ', icon: <Home className="w-4 h-4" /> },
    { id: 'jobs', label: 'Khám việc làm', icon: <Search className="w-4 h-4" />, count: isGuestMode ? undefined : activeOpenJobs.length },
    { id: 'saved_jobs', label: 'Việc làm đã lưu', icon: <Heart className="w-4 h-4" />, count: isGuestMode ? undefined : savedJobs.length },
    { id: 'applications', label: 'Tiến độ ứng tuyển', icon: <Clock className="w-4 h-4" />, count: isGuestMode ? undefined : myApplications.length },
    { id: 'my_shifts', label: 'Lịch ca làm đã nhận', icon: <CalendarDays className="w-4 h-4" />, count: isGuestMode ? undefined : acceptedApplications.length },
    { id: 'profile_cv', label: 'Quản lý CV', icon: <Upload className="w-4 h-4" />, count: isGuestMode ? undefined : myResumes.length },
    { id: 'student_profile', label: 'Hồ sơ cá nhân & Lịch rảnh', icon: <User className="w-4 h-4" /> },
    { id: 'reviews', label: 'Doanh nghiệp chờ đánh giá', icon: <Star className="w-4 h-4" />, count: isGuestMode ? undefined : completedJobsForReview.length },
    { id: 'chat', label: 'Tin nhắn & Phỏng vấn', icon: <MessageSquare className="w-4 h-4" />, count: isGuestMode ? undefined : contacts.length }
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#F8FAFC] text-slate-800 min-h-[calc(100vh-80px)]">

      {/* CONFETTI CELEBRATION OVERLAY */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[2px] animate-pulse"></div>
          <div className="relative text-center p-8 rounded-3xl bg-white border border-blue-300 shadow-2xl shadow-blue-500/20 animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-xl font-black text-slate-900">Ứng Tuyển Thành Công!</h3>
            <p className="text-xs text-blue-600 mt-2">Hồ sơ CV của bạn đã được chuyển thẳng tới Nhà tuyển dụng.</p>
          </div>
        </div>
      )}

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
                      {item.count > 99 ? '99+' : item.count}
                    </span>
                  )}
                  {!collapsedDesktop && <span className="leading-snug">{item.label}</span>}
                </div>
                {!collapsedDesktop && item.count !== undefined && item.count > 0 && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black shrink-0 whitespace-nowrap ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-800 border border-blue-200'
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

            {/* Tìm kiếm hội thoại theo tên NTD (FR 1.8.1) */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên Doanh nghiệp..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Danh sách Room Chat với NTD (FR 1.8.2 & Chấm xanh/xám 1.10.1) */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {contacts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="font-semibold text-slate-600">Chưa có cuộc trò chuyện nào</p>
                  <p className="text-xs text-slate-400 mt-1">
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
                      className="w-full p-3 rounded-xl bg-white hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 transition-all text-left flex items-start gap-3 cursor-pointer group shadow-2xs"
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                          {contact.name.charAt(0)}
                        </div>
                        {/* Chấm tròn xanh lá Online / xám Offline (FR 1.10.1) */}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${contact.online ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : 'bg-slate-400'
                          }`}></span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600">{contact.name}</p>
                          <span className="text-xs text-slate-400 font-mono">{contact.time}</span>
                        </div>
                        <p className="text-xs text-blue-600 font-medium truncate mt-0.5">{contact.subtitle}</p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{contact.lastMsg}</p>
                      </div>
                    </button>
                  ))
              )}
            </div>

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
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto transition-all duration-300">

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
                            if (heroProvince) setSelectedProvince(heroProvince);
                            handleMenuSwitch('jobs');
                          }
                        }}
                        placeholder="Vị trí tuyển dụng, pha chế, thu ngân, gia sư..."
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
                        if (heroProvince) setSelectedProvince(heroProvince);
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
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-h-[130px]">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Việc Làm Đang Tuyển</p>
                      <p className="text-2xl font-black text-slate-900">{jobs.filter(j => j.is_open && !j.is_hidden).length}</p>
                      <p className="text-xs font-semibold text-emerald-600">100% Đã xác minh GPKD</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                      <Briefcase className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-h-[130px]">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Hồ Sơ Đã Nộp</p>
                      <p className="text-2xl font-black text-slate-900">{myApplications.length}</p>
                      <p className="text-xs font-semibold text-sky-600">
                        {myApplications.filter(a => a.application_status === 'accepted').length} đơn đã được duyệt
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-h-[130px]">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Kho Hồ Sơ CV</p>
                      <p className="text-2xl font-black text-slate-900">{myResumes.length} CV</p>
                      <p className="text-xs font-semibold text-purple-600">Định dạng PDF chuẩn ≤ 10MB</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
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
                {jobs.slice(0, 6).map((job) => {
                  const isSaved = bookmarkedIds.has(job._id);
                  return (
                    <div
                      key={job._id}
                      onClick={() => setSelectedJobDetail(job)}
                      className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between min-h-[250px] relative"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                                HOT
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                                {job.category || 'Part-time'}
                              </span>
                            </div>
                            <h4 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
                              {job.title}
                            </h4>
                            <p className="text-sm sm:text-base font-semibold text-emerald-700 mt-1.5 line-clamp-1">
                              {job.company_name}
                            </p>
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="truncate">{job.location}</span>
                            </p>
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
                            setSelectedJobDetail(job);
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
                    Công nghệ ghép ca tự động theo lịch rảnh giúp bạn làm việc linh hoạt, bảo đảm hoàn toàn không ảnh hưởng việc học.
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

              {/* Bộ lọc đa tiêu chí chuẩn (1.5.1 & 1.5.2) */}
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* 1. Từ khóa Chức danh */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Chức danh, từ khóa..."
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium"
                    />
                  </div>

                  {/* 2. Ngành nghề (Master Data) */}
                  <div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="">Tất cả ngành nghề</option>
                      {JOB_CATEGORIES.filter(c => c !== 'Tất cả ngành nghề').map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                      {categories.filter(c => c.type === 'job' || !c.type).map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Chọn Tỉnh / Thành phố (63 Tỉnh Thành) */}
                  <div>
                    <select
                      value={selectedProvince}
                      onChange={(e) => {
                        setSelectedProvince(e.target.value);
                        setSelectedDistricts([]);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="">Toàn quốc (63 Tỉnh/Thành)</option>
                      {VIETNAM_PROVINCES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Ca làm việc */}
                  <div>
                    <select
                      value={selectedShift}
                      onChange={(e) => setSelectedShift(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="">Mọi ca làm việc</option>
                      {WORK_SHIFTS.filter(s => s.id !== 'all').map((s) => (
                        <option key={s.id} value={s.id}>{s.label} ({s.time})</option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Khoảng lương theo giờ */}
                  <div>
                    <select
                      value={salaryFilter}
                      onChange={(e) => setSalaryFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="">Mọi mức lương</option>
                      {SALARY_BRACKETS.filter(b => b.id !== 'all').map((b) => (
                        <option key={b.id} value={b.id}>{b.label}</option>
                      ))}
                      
                    </select>
                  </div>
                </div>

                {/* Ô nhập tay tùy chỉnh (Custom Input) & Bảng tích chọn nhiều Quận/Huyện */}
                <div className="space-y-3">
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customLocationText}
                      onChange={(e) => setCustomLocationText(e.target.value)}
                      placeholder="Ô nhập tay tùy chỉnh: Gõ tên đường, phường/xã, tòa nhà, địa điểm làm việc cụ thể..."
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium"
                    />
                  </div>

                  {/* Danh sách Quận/Huyện hiển thị khi đã chọn Tỉnh/Thành phố */}
                  {availableDistricts.length > 0 && (
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
                  )}
                </div>
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
                  const isSaved = bookmarkedIds.has(job._id);
                  return (
                    <div
                      key={job._id}
                      onClick={() => setSelectedJobDetail(job)}
                      className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group shadow-sm relative min-h-[260px] flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {job.title}
                          </h4>
                          <p className="text-base font-semibold text-emerald-700 mt-1">{job.company_name}</p>
                          <p className="text-sm text-slate-500 mt-1">{job.location}</p>
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

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenApplyModal(job);
                          }}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-md cursor-pointer"
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
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
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
                          <div className="min-w-0 flex-1">
                            <h5 className="text-sm font-bold text-slate-900 line-clamp-1">{job.title}</h5>
                            <p className="text-xs font-semibold text-emerald-600 mt-0.5">{job.company_name}</p>
                            <p className="text-sm text-slate-500 mt-1">{job.location}</p>
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
                {savedJobs.length === 0 ? (
                  <div className="col-span-2 py-16 text-center text-slate-500 text-xs bg-white rounded-3xl border border-slate-200 shadow-sm">
                    Bạn chưa lưu công việc nào. Hãy nhấp vào icon Trái tim tại trang Khám phá việc làm để lưu lại.
                  </div>
                ) : (
                  savedJobs.map((job) => {
                    const isGreyedOut = !job.is_open || job.job_status === 'filled' || job.job_status === 'completed';

                    return (
                      <div
                        key={job._id}
                        onClick={() => !isGreyedOut && setSelectedJobDetail(job)}
                        className={`p-5 rounded-2xl bg-white border transition-all relative ${isGreyedOut
                          ? 'border-slate-200 opacity-60 grayscale cursor-not-allowed'
                          : 'border-slate-200/80 hover:border-blue-400 cursor-pointer shadow-sm hover:shadow-md'
                          }`}
                      >
                        {isGreyedOut && (
                          <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                            <AlertCircle className="w-3 h-3" />
                            <span>
                              {job.job_status === 'filled' ? 'Đã nhận đủ người' : (job.job_status === 'completed' ? 'Đã hoàn thành' : 'Tạm đóng tuyển dụng')}
                            </span>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{job.title}</h4>
                            <p className="text-xs font-semibold text-emerald-600 mt-1">{job.company_name}</p>
                            <p className="text-sm text-slate-500 mt-1">{job.location}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBookmark(job._id);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="Xóa việc làm khỏi danh sách đã lưu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa lưu</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                          <span className="text-xs font-bold text-blue-600">
                            {job.is_negotiable ? 'Thỏa thuận' : `${job.salary_min?.toLocaleString()}đ - ${job.salary_max?.toLocaleString()}đ/h`}
                          </span>
                          {!isGreyedOut && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenApplyModal(job);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs font-bold shadow-sm"
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
              </div>
            </div>

            {/* Thanh tìm kiếm & Tabs lọc trạng thái (Chỉ hiển thị khi đã đăng nhập) */}
            {!isGuestMode && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm công việc đã nộp..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Tabs lọc trạng thái kèm ApplicationStatusBadge */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${appStatusTab === 'all' ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                  >
                    Tất cả ({myApplications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${appStatusTab === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                  >
                    Chờ duyệt ({myApplications.filter(a => a.application_status === 'pending').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('accepted')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${appStatusTab === 'accepted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                  >
                    Đã duyệt ({myApplications.filter(a => a.application_status === 'accepted').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('rejected')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${appStatusTab === 'rejected' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                  >
                    Từ chối ({myApplications.filter(a => a.application_status === 'rejected').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppStatusTab('cancelled')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${appStatusTab === 'cancelled' ? 'bg-slate-200 text-slate-800 border border-slate-300' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                  >
                    Đã hủy ({myApplications.filter(a => a.application_status === 'cancelled').length})
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
                        <p className="text-xs text-slate-500 leading-relaxed">Đính kèm CV PDF và tự động gửi thông tin lịch rảnh tới nhà tuyển dụng.</p>
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
                    interview: 'bg-orange-50 text-orange-800 border-orange-200',
                    accepted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    rejected: 'bg-red-50 text-red-800 border-red-200',
                    cancelled: 'bg-slate-100 text-slate-600 border-slate-200'
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

                      {/* Snapshot CV & Cover note */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="font-semibold">CV đã đính kèm:</span>
                          <span className="text-blue-600 font-mono font-bold">{app.application_snapshot?.cv_name || 'CV_UngVien.pdf'}</span>
                        </div>
                        {app.application_snapshot?.cover_note && (
                          <div className="text-slate-500 text-xs leading-relaxed border-t border-slate-200/60 pt-1.5">
                            <span className="font-semibold text-slate-700">Lời nhắn ứng tuyển:</span> "{app.application_snapshot.cover_note}"
                          </div>
                        )}
                        {app.reject_reason && (
                          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                            <strong>Lý do từ chối:</strong> {app.reject_reason}
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
                            onClick={() => handleCancelApplication(app._id)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all cursor-pointer"
                          >
                            Rút hồ sơ / Hủy ứng tuyển
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteApplication(app)}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa đơn</span>
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
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  <span>Thời Khóa Biểu & Lịch Ca Làm Đã Nhận</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Đồng bộ tự động từ các công việc đã đạt trạng thái <strong>Đã duyệt trúng tuyển</strong>.
                </p>
              </div>

              {/* Lọc theo Tuần & Khung Ca */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={shiftFilterWeek}
                  onChange={(e) => setShiftFilterWeek(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="current">Tuần này (Hiện tại)</option>
                  <option value="next">Tuần tới</option>
                  <option value="all">Tất cả các tuần</option>
                </select>

                <select
                  value={shiftFilterTime}
                  onChange={(e) => setShiftFilterTime(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Tất cả khung ca</option>
                  <option value="morning">Ca sáng (06:00 - 12:00)</option>
                  <option value="afternoon">Ca chiều (12:00 - 18:00)</option>
                  <option value="evening">Ca tối (18:00 - 23:00)</option>
                </select>
              </div>
            </div>

            {/* Bảng Thời Khóa Biểu Tuần (Thứ 2 đến Chủ Nhật) */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Thời Khóa Biểu Ca Làm Trong Tuần</span>
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {acceptedApplications.length} ca làm đã được duyệt
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                {[
                  { day: 'Thứ 2', date: 'Đầu tuần' },
                  { day: 'Thứ 3', date: 'Trong tuần' },
                  { day: 'Thứ 4', date: 'Trong tuần' },
                  { day: 'Thứ 5', date: 'Trong tuần' },
                  { day: 'Thứ 6', date: 'Trong tuần' },
                  { day: 'Thứ 7', date: 'Cuối tuần' },
                  { day: 'Chủ Nhật', date: 'Cuối tuần' }
                ].map((item, idx) => {
                  const hasShift = acceptedApplications.length > 0 && idx < acceptedApplications.length;
                  const assignedApp = hasShift ? acceptedApplications[idx] : null;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        hasShift
                          ? 'bg-blue-50/80 border-blue-200 shadow-sm'
                          : 'bg-slate-50/50 border-slate-100 text-slate-400'
                      }`}
                    >
                      <p className="text-xs font-black text-slate-800">{item.day}</p>
                      <p className="text-xs text-slate-500 font-mono mb-2">{item.date}</p>
                      {hasShift && assignedApp ? (
                        <div className="p-2 rounded-xl bg-white border border-blue-200 text-left shadow-xs">
                          <span className="inline-block px-1.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 mb-1">
                            Đã nhận ca
                          </span>
                          <p className="text-xs font-bold text-slate-800 leading-snug">
                            {assignedApp.job_title || 'Ca làm'} ({assignedApp.company_name || 'Doanh nghiệp'})
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic py-2">Trống ca</p>
                      )}
                    </div>
                  );
                })}
              </div>
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
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <span>Chống Trùng Lịch Học</span>
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">Thuật toán tự động ngăn chặn đăng ký ca làm nếu trùng với thời khóa biểu trường ĐH.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 text-xs">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>Điểm Danh GPS</span>
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">Check-in/out chuẩn xác vị trí địa lý tại cơ sở doanh nghiệp để tính giờ công minh bạch.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 text-xs">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4 text-purple-600" />
                        <span>Đổi Ca Linh Hoạt</span>
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">Báo bận đột xuất hoặc xin đổi ca có phép nhanh chóng qua hệ thống trước 24 giờ.</p>
                    </div>
                  </div>

                  {/* Guest Callout */}
                  <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-3">
                    <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="text-base font-bold text-slate-900">Chưa có ca làm nào được nhận</h4>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                      Bạn đang xem ở chế độ khách. Đăng nhập hoặc tạo tài khoản Sinh viên để bắt đầu nhận ca làm việc và đồng bộ thời khóa biểu tự động.
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
                    Hãy nộp hồ sơ tại mục "Khám việc làm" để nhận ca làm việc phù hợp.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {acceptedApplications
                    .filter((app) => {
                      if (!shiftFilterTime || shiftFilterTime === 'all') return true;
                      const wt = (app.work_time || '').toLowerCase();
                      if (shiftFilterTime === 'morning') return wt.includes('sáng') || wt.includes('06:') || wt.includes('07:');
                      if (shiftFilterTime === 'afternoon') return wt.includes('chiều') || wt.includes('12:') || wt.includes('13:');
                      if (shiftFilterTime === 'evening') return wt.includes('tối') || wt.includes('18:');
                      return true;
                    })
                    .map((app, idx) => {
                    const shiftKey = `shift_${app._id || idx}`;
                    const currentStatus = app.shift_status || shiftStatuses[shiftKey] || 'upcoming';
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
                          className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer border border-blue-200"
                          title="Xem trước PDF trực tiếp"
                        >
                          <Eye className="w-4 h-4 text-blue-700" />
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
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-colors cursor-pointer"
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

        {/* 5.5. MÀN HÌNH HỒ SƠ CÁ NHÂN & LỊCH RẢNH (student_profile) (1.3.1, 1.3.2, 1.3.3) */}
        {activeMenu === 'student_profile' && (
          <div className="w-full max-w-full mx-auto space-y-8 animate-in fade-in duration-300">
            {isGuestMode ? (
              <div className="space-y-6">
                

                

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
                      <span>Xác Thực Trường ĐH</span>
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">Hồ sơ sinh viên được chứng thực qua Thẻ sinh viên, giúp nâng cao độ tin cậy và tỷ lệ được chọn.</p>
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
              /* Thẻ Thông Tin Cá Nhân Cho Sinh Viên Đã Đăng Nhập */
              <div className="form-card-col2 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-blue-200/60">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                      {profile.full_name?.charAt(0) || 'V'}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{profile.full_name || 'Sinh viên'}</h4>
                      <p className="text-xs text-blue-600 font-mono">{currentUser?.email || ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {profileSaveMsg && (
                      <span className="text-xs font-bold text-emerald-600">{profileSaveMsg}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(!isEditingProfile);
                        setPhoneError('');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isEditingProfile ? 'Hủy Sửa' : 'Chỉnh Sửa Hồ Sơ'}</span>
                    </button>
                  </div>
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleProfileSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
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
                        <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">Trường Đại Học *</label>
                        <input
                          type="text"
                          required
                          value={profileForm.university}
                          onChange={(e) => setProfileForm({ ...profileForm, university: e.target.value })}
                          className="w-full bg-white border border-blue-200/80 rounded-xl px-4 py-3 text-sm sm:text-base text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">Chuyên Ngành Học *</label>
                        <input
                          type="text"
                          required
                          value={profileForm.major}
                          onChange={(e) => setProfileForm({ ...profileForm, major: e.target.value })}
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
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl btn-primary-dimension text-sm sm:text-base font-bold shadow-md cursor-pointer"
                      >
                        Lưu Thông Tin
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 text-sm sm:text-base">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-slate-500 font-medium text-sm">Họ và Tên Sinh Viên:</p>
                      <p className="text-base sm:text-lg font-bold text-slate-900">{profile.full_name || 'Sinh viên'}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-slate-500 font-medium text-sm">Số Điện Thoại:</p>
                      <p className="text-base sm:text-lg font-bold text-blue-600 font-mono">{profile.phone || 'Chưa cập nhật'}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-slate-500 font-medium text-sm">Trường Đào Tạo:</p>
                      <p className="text-base sm:text-lg font-bold text-slate-900">{profile.university || 'Chưa cập nhật'}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-slate-500 font-medium text-sm">Chuyên Ngành Học:</p>
                      <p className="text-base sm:text-lg font-bold text-slate-900">{profile.major || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BẢNG THIẾT LẬP LỊCH RẢNH THEO TUẦN (1.3.3) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span>Thiết Lập Khung Giờ Rảnh Theo Tuần (Thứ 2 – CN × Sáng, Chiều, Tối)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nhấp vào từng ô để chuyển đổi giữa <strong>Trống (Chưa chọn)</strong> ↔ <strong>Sẵn sàng nhận việc (Đã kích hoạt)</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveFreeSchedule}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-bold text-sm shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu Lịch Rảnh</span>
                </button>
              </div>

              {/* Matrix Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="p-3 text-left font-bold text-slate-700">Khung Ca \ Thứ</th>
                      {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map((d, i) => (
                        <th key={i} className="p-3 font-bold text-slate-800">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { shiftKey: 'morning', label: 'Ca sáng', time: '06:00 - 12:00' },
                      { shiftKey: 'afternoon', label: 'Ca chiều', time: '12:00 - 18:00' },
                      { shiftKey: 'evening', label: 'Ca tối', time: '18:00 - 23:00' }
                    ].map((shiftRow) => (
                      <tr key={shiftRow.shiftKey}>
                        <td className="p-3 text-left font-bold text-slate-800 bg-slate-50/50">
                          <div>{shiftRow.label}</div>
                          <span className="text-xs text-slate-400 font-mono">{shiftRow.time}</span>
                        </td>
                        {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((dayKey) => {
                          const isAvailable = freeSchedule[dayKey]?.[shiftRow.shiftKey] || false;
                          return (
                            <td key={dayKey} className="p-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setFreeSchedule(prev => ({
                                    ...prev,
                                    [dayKey]: {
                                      ...prev[dayKey],
                                      [shiftRow.shiftKey]: !isAvailable
                                    }
                                  }));
                                }}
                                className={`w-full py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                  isAvailable
                                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border border-slate-200'
                                }`}
                              >
                                {isAvailable ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span className="text-xs">Sẵn sàng</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3.5 h-3.5 text-slate-300" />
                                    <span className="text-xs text-slate-400">Trống</span>
                                  </>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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

              {/* Tabs: Chờ đánh giá | Lịch sử đánh giá (Chỉ hiển thị khi đã đăng nhập) */}
              {!isGuestMode && (
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setReviewTab('pending')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${reviewTab === 'pending' ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Công Ty Chờ Đánh Giá ({completedJobsForReview.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewTab('history')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${reviewTab === 'history' ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Lịch Sử Đánh Giá ({myReviews.length})
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
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReviewDetail({ ...rev, company_name: compName, job_title: jTitle });
                              }}
                              className="text-xs font-semibold text-slate-600 hover:text-blue-600 cursor-pointer flex items-center gap-1.5 transition-colors"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                              <span>Xem chi tiết đánh giá</span>
                            </button>

                            <div className="flex items-center gap-2">
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
                                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold cursor-pointer flex items-center gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Sửa đánh giá</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStudentReview(rev);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa đánh giá</span>
                              </button>
                            </div>
                          </div>
                        )}
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

        {/* 7. MÀN HÌNH CHAT CHI TIẾT & GỌI VIDEO WEBRTC (UI-SV-CHAT-02, UI-SV-CALL-01 - 1.8 & 1.10) */}
        {activeMenu === 'chat' && (
          <div className="w-full max-w-full mx-auto h-[calc(100vh-140px)] flex flex-col rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
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
                <div className="w-20 h-20 rounded-3xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5 shadow-xl">
                  <MessageSquare className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Chưa Có Cuộc Trò Chuyện Nào
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
                  Bạn chưa ứng tuyển vào công việc nào. Khi bạn nộp hồ sơ ứng tuyển, bạn có thể trò chuyện và trao đổi trực tiếp với nhà tuyển dụng tại đây.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveMenu('jobs')}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs font-bold transition-all shadow-lg shadow-blue-900/40 flex items-center gap-2 cursor-pointer"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Tìm Việc Ngay ({activeOpenJobs.length} việc làm)</span>
                </button>
              </div>
            ) : (
              <>
            {/* Thanh chuyển đổi danh bạ doanh nghiệp khớp với số đếm Sidebar */}
            {contacts.length > 0 && (
              <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-bold text-slate-600 shrink-0">
                  Danh bạ doanh nghiệp ({contacts.length}):
                </span>
                {contacts.map((c) => {
                  const activeContact = selectedContact?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedContact(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                        activeContact
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${c.online ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Khung Header Chat: Tên NTD, Online/Offline, Icon Camera WebRTC, Icon 3 chấm -> Báo cáo */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    {selectedContact?.name?.charAt(0) || 'P'}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${selectedContact?.online ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}></span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{selectedContact?.name || 'Doanh nghiệp'}</h4>
                  <p className="text-xs text-emerald-700 font-bold">
                    {selectedContact?.online ? '● Đang trực tuyến' : '○ Ngoại tuyến'}
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
                  <span className="hidden sm:inline">Gọi Thoại</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartCall('video')}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Gọi video phỏng vấn trực tuyến qua WebRTC"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Phỏng Vấn Video</span>
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
                      target_id: selectedContact?.id || 'emp_user',
                      target_title: `Hội thoại với ${selectedContact?.name || 'Doanh nghiệp'}`
                    });
                  }}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-colors cursor-pointer"
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
                        <h3 className="text-base font-black text-white">Đang đổ chuông tới {selectedContact?.name || 'Doanh nghiệp'}...</h3>
                        <p className="text-xs text-slate-400 mt-1">Vui lòng chờ Nhà tuyển dụng nhấc máy phỏng vấn</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Remote Video Stream if received */}
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover ${callType === 'video' && hasRemoteVideo ? 'block' : 'hidden'}`}
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
                  {callType === 'video' && !isCameraOff && (
                    <div className="absolute bottom-4 right-4 w-44 h-32 rounded-2xl bg-slate-950 border-2 border-sky-400/80 overflow-hidden shadow-2xl">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-2 text-xs font-bold text-white bg-black/60 px-1 rounded">
                        Bạn ({currentUser?.profile?.full_name || currentUser?.full_name || 'Tôi'})
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
                                  <p className="text-xs text-slate-400 font-mono mt-0.5">{m.created_at}</p>
                                </div>
                              </div>
                              {!isOutgoing && (
                                <button
                                  type="button"
                                  onClick={() => handleStartCall(m.call_type || 'video')}
                                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs font-bold shadow-md shadow-blue-950/60 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 hover:scale-105 active:scale-95"
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
                            ? 'bg-blue-50 text-blue-800 border-blue-200 rounded-br-sm'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 rounded-bl-sm'
                            }`}>
                            <Phone className={`w-3.5 h-3.5 ${isOutgoing ? 'text-blue-600' : 'text-emerald-600'}`} />
                            <span>
                              {isOutgoing ? `Cuộc gọi đi (${callTypeLabel})` : `Cuộc gọi đến (${callTypeLabel})`} • {m.duration_str || '0:00'}
                            </span>
                            <span className="text-xs text-slate-500 font-mono ml-1">({m.created_at})</span>
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
                          <span className="text-xs font-bold text-slate-700">
                            {isMe ? `Bạn (${currentUser?.profile?.full_name || currentUser?.full_name || 'Tôi'})` : (m.sender_name || selectedContact?.name || 'Doanh nghiệp')}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">{m.created_at}</span>
                        </div>

                        {/* Bong bóng tin nhắn kèm cảnh báo từ cấm & tệp đính kèm */}
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${isMe
                            ? 'bg-blue-600 text-white rounded-br-sm shadow-sm'
                            : 'bg-slate-100 text-slate-900 rounded-bl-sm border border-slate-200'
                            }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content || m.clean_content}</p>
                          {m.is_flagged && (
                            <div className="mt-2 p-2 rounded-xl bg-red-950/80 border border-red-500/50 text-xs text-red-200 space-y-1">
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
                                    className="px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow cursor-pointer transition-colors"
                                  >
                                    Báo cáo vi phạm
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-red-300 font-mono">
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
                              <div className="p-1.5 bg-black/70 text-xs text-white flex items-center justify-between">
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
                                  <p className="font-bold text-white truncate text-xs">{m.file_name || 'TaiLieu.pdf'}</p>
                                  <span className="text-xs text-slate-400 font-mono">Tài liệu PDF (≤10MB)</span>
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
                                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                  title="Tải về máy tính"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          )}

                          {m.is_flagged && (
                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                              <span>Tin nhắn chứa từ khóa vi phạm: {Array.isArray(m.flagged_words) ? m.flagged_words.join(', ') : 'Cấm'}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 font-mono mt-0.5 px-1">Đã gửi</span>
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
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
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
                    className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer shrink-0"
                    title="Đính kèm tệp PDF hoặc ảnh (≤ 10MB)"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={newMsgText}
                    onChange={(e) => setNewMsgText(e.target.value)}
                    placeholder="Nhập tin nhắn... (Hệ thống tự động lọc từ ngữ cấm ***)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMsgText.trim() && !chatAttachment}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-40 transition-all cursor-pointer shadow-sm"
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

      {/* ======================= SLIDE-OVER PANE CHI TIẾT JD ======================= */}
      {selectedJobDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white border-l border-slate-200 flex flex-col shadow-2xl h-full text-slate-800 animate-in slide-in-from-right duration-300 p-6 overflow-y-auto space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                  {selectedJobDetail.work_time || 'Ca làm linh hoạt'}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1.5">{selectedJobDetail.title}</h3>
                <p className="text-xs sm:text-sm font-semibold text-emerald-700 mt-0.5">{selectedJobDetail.company_name}</p>
                <p className="text-xs text-slate-600">{selectedJobDetail.location}</p>
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
                <span>Báo Cáo Vi Phạm</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const jobToApply = selectedJobDetail;
                  setSelectedJobDetail(null);
                  handleOpenApplyModal(jobToApply);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-bold shadow-md cursor-pointer whitespace-nowrap"
              >
                Ứng Tuyển Ngay
              </button>
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
          major: currentUser?.profile?.major || 'Công nghệ thông tin',
          university: currentUser?.profile?.university || 'Trường Đại học',
          phone: currentUser?.profile?.phone || '',
          email: currentUser?.email || '',
          fileName: previewCvPdf?.file_name || 'CV_UngVien.pdf',
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
                <h3 className="text-base font-black text-slate-900">Đánh Giá Nhà Tuyển Dụng</h3>
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
