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

// Tạo luồng Media ảo dự phòng (Audio tĩnh / Canvas video) khi máy không có Camera/Mic hoặc bị xung đột thiết bị
export const createFallbackMediaStream = (callType = 'video') => {
  const tracks = [];

  // 1. Luồng Audio ảo tĩnh (Silent Audio Track qua Web Audio API)
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const dst = ctx.createMediaStreamDestination();
      const gain = ctx.createGain();
      gain.gain.value = 0; // Hoàn toàn im lặng
      osc.connect(gain);
      gain.connect(dst);
      osc.start();
      const audioTrack = dst.stream.getAudioTracks()[0];
      if (audioTrack) tracks.push(audioTrack);
    }
  } catch (e) {
    console.warn('[WebRTC] Virtual audio fallback error:', e);
  }

  // 2. Luồng Video ảo qua Canvas (Tránh NotReadableError khi test 2 tab trên cùng 1 máy tính)
  if (callType === 'video') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PARTIME.VN WEBRTC', 320, 220);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.fillText('Kết nối phỏng vấn trực tuyến 1-1', 320, 260);
      }
      const canvasStream = canvas.captureStream ? canvas.captureStream(15) : null;
      if (canvasStream) {
        const videoTrack = canvasStream.getVideoTracks()[0];
        if (videoTrack) tracks.push(videoTrack);
      }
    } catch (e) {
      console.warn('[WebRTC] Virtual video fallback error:', e);
    }
  }

  return new MediaStream(tracks);
};

// Lấy Camera và Micro của máy (có cơ chế Fallback tự động chống crash khi gọi 2 tab trên 1 máy tính)
export const getLocalMediaStream = async (callType = 'video') => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.warn('[WebRTC] mediaDevices not supported, using fallback stream');
    return createFallbackMediaStream(callType);
  }

  const audioConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  };

  // 1. Thử xin quyền Camera & Micro đầy đủ
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
      video: callType === 'video' ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      } : false
    });
  } catch (err) {
    console.warn('[WebRTC] Primary getUserMedia failed (likely in use or device missing):', err.name);
  }

  // 2. Nếu cuộc gọi Video bị lỗi (do webcam bị tab đối phương chiếm), thử audio thật + video canvas
  if (callType === 'video') {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const fallback = createFallbackMediaStream('video');
      const videoTrack = fallback.getVideoTracks()[0];
      if (videoTrack) audioStream.addTrack(videoTrack);
      return audioStream;
    } catch (err2) {
      console.warn('[WebRTC] Audio-only fallback with canvas video failed:', err2.name);
    }
  }

  // 3. Nếu là cuộc gọi Audio, thử xin quyền Audio đơn giản
  if (callType === 'audio') {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err3) {
      console.warn('[WebRTC] Audio getUserMedia failed:', err3.name);
    }
  }

  // 4. Nếu máy tính hoàn toàn không có Mic/Camera (PC bàn không cắm tai nghe), dùng luồng ảo để P2P không bao giờ bị đứt
  console.warn('[WebRTC] Using virtual fallback media stream for call resilience');
  return createFallbackMediaStream(callType);
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
