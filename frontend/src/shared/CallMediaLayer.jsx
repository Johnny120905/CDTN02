import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Camera, CameraOff, Phone, MessageSquare } from 'lucide-react';

/**
 * Lớp media dùng chung cho cuộc gọi WebRTC (cả Sinh viên & Nhà tuyển dụng):
 *  1. <audio> luôn được mount -> luôn phát âm thanh của đối phương dù đang ở menu nào
 *     (khắc phục lỗi chỉ 1 chiều nghe được do <video> chưa mount khi nhận stream).
 *  2. Thanh điều khiển nổi (Mic / Camera / Kết thúc) khi người dùng đang gọi nhưng không ở màn hình Chat.
 */
export default function CallMediaLayer({
  isVideoCalling,
  callType,
  callStatus,
  isMuted,
  isCameraOff,
  callDuration,
  remoteStreamRef,
  showFloatingControls,
  onToggleMic,
  onToggleCamera,
  onEndCall,
  onOpenChat
}) {
  const audioRef = useRef(null);

  // Chạy sau mỗi lần render: gắn luồng remote vào <audio> (rẻ, chỉ gán khi khác)
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const stream = isVideoCalling ? remoteStreamRef?.current || null : null;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
    if (stream && el.paused) {
      const p = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  });

  const mm = Math.floor((callDuration || 0) / 60);
  const ss = ((callDuration || 0) % 60).toString().padStart(2, '0');

  return (
    <>
      <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />

      {isVideoCalling && showFloatingControls && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-sky-500/60 rounded-full px-4 py-2.5 shadow-2xl flex items-center gap-3 text-white">
          <span className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {callStatus === 'calling' ? 'Đang đổ chuông...' : `${mm}:${ss}`}
          </span>
          <button
            type="button"
            onClick={onToggleMic}
            className={`p-2.5 rounded-full cursor-pointer transition-all ${isMuted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            title={isMuted ? 'Bật Mic' : 'Tắt Mic'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          {callType === 'video' && (
            <button
              type="button"
              onClick={onToggleCamera}
              className={`p-2.5 rounded-full cursor-pointer transition-all ${isCameraOff ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
              title={isCameraOff ? 'Mở Camera' : 'Tắt Camera'}
            >
              {isCameraOff ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={onOpenChat}
            className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            title="Mở khung cuộc gọi"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onEndCall}
            className="p-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-lg shadow-red-950/60"
            title="Kết thúc cuộc gọi"
          >
            <Phone className="w-4 h-4 rotate-[135deg]" />
          </button>
        </div>
      )}
    </>
  );
}

