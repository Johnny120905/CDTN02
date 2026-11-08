import { io } from 'socket.io-client';

// Cấu hình STUN Server miễn phí của Google để giải mã IP qua mạng NAT/Wifi
export const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
};

// Tự động nhận diện URL Backend Socket.IO phù hợp với cả môi trường dev (Vite) lẫn production (Unified Server)
export const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const port = window.location.port;
    // Nếu chạy Vite dev server (3000 -> 3003) thì trỏ về cổng backend 8002
    if (['3000', '3001', '3002', '3003', '5173'].includes(port)) {
      return `${window.location.protocol}//${window.location.hostname}:8002`;
    }
    return window.location.origin;
  }
  return 'http://localhost:8002';
};

let socketInstance = null;

// Lấy đối tượng Socket.IO duy nhất (Singleton)
export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    socketInstance.on('connect', () => {
      // console.log('[Socket.IO] Connected successfully:', socketInstance.id);
    });

    socketInstance.on('connect_error', (err) => {
      // console.warn('[Socket.IO] Connection error (using polling fallback):', err.message);
    });
  }
  return socketInstance;
};

// Lấy Camera và Micro của máy
export const getLocalMediaStream = async (callType = 'video') => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Trình duyệt không hỗ trợ truy cập MediaDevices (Camera/Micro).');
  }

  const constraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    video: callType === 'video' ? {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user'
    } : false
  };

  return await navigator.mediaDevices.getUserMedia(constraints);
};

// Tạo kết nối WebRTC RTCPeerConnection chuẩn
export const createPeerConnection = ({ onRemoteStream, onIceCandidate, onConnectionStateChange }) => {
  const pc = new RTCPeerConnection(RTC_CONFIG);

  // Khi có luồng Audio/Video từ đối phương truyền tới
  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      if (onRemoteStream) {
        onRemoteStream(event.streams[0]);
      }
    }
  };

  // Khi máy mình tìm ra địa chỉ mạng (ICE Candidate)
  pc.onicecandidate = (event) => {
    if (event.candidate && onIceCandidate) {
      onIceCandidate(event.candidate);
    }
  };

  // Theo dõi trạng thái kết nối P2P
  pc.onconnectionstatechange = () => {
    if (onConnectionStateChange) {
      onConnectionStateChange(pc.connectionState);
    }
  };

  return pc;
};

// Đóng kết nối WebRTC an toàn
export const closePeerConnection = (pc) => {
  if (!pc) return;
  try {
    pc.ontrack = null;
    pc.onicecandidate = null;
    pc.onconnectionstatechange = null;
    pc.close();
  } catch (e) {
    // ignore
  }
};

// Tắt toàn bộ luồng Camera/Mic của máy
export const stopMediaStream = (stream) => {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  } catch (e) {
    // ignore
  }
};


// So sánh nhanh 2 danh sách tin nhắn để tránh setState/re-render khi dữ liệu không đổi (chống giật khung chat)
export const isSameChatList = (a, b) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i];
    const y = b[i];
    if (
      x._id !== y._id ||
      x.content !== y.content ||
      x.is_read !== y.is_read ||
      x.call_status !== y.call_status ||
      x.duration !== y.duration ||
      x.is_flagged !== y.is_flagged
    ) {
      return false;
    }
  }
  return true;
};
