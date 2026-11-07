import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Lock, Mail, User, Phone, Building, GraduationCap, AlertCircle, 
  CheckCircle2, Clock, KeyRound, ArrowRight, RefreshCw,
  Smartphone, Laptop, Tablet, Monitor, Briefcase, ShieldCheck, Check
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  if (!isOpen) return null;

  // Tabs & Modes: 'login' | 'register' | 'otp'
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'employer' | 'admin'
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'otp'
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [extraField, setExtraField] = useState('');
  
  // OTP States
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [receivedOtp, setReceivedOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes = 600s
  const [isOtpTimerActive, setIsOtpTimerActive] = useState(false);
  const [autoFillEnabled, setAutoFillEnabled] = useState(true);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [otpNotification, setOtpNotification] = useState(null); // Simulated incoming email toast
  const otpInputRefs = useRef([]);

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Countdown Timer for OTP (10 Minutes = 600 seconds)
  useEffect(() => {
    let interval = null;
    if (isOtpTimerActive && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && isOtpTimerActive) {
      setIsOtpTimerActive(false);
      setErrorMsg('Mã OTP đã hết hiệu lực sau 10 phút. Vui lòng bấm "Gửi lại mã mới".');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOtpTimerActive, otpTimer]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 2. Request OTP (10 Minutes Expiry)
  const handleRequestOtp = async (purpose = 'forgot_password') => {
    if (!email || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ Email thật trước khi nhận mã OTP.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Không thể tạo mã OTP.');
      } else {
        const code = data.otp || '849201';
        setReceivedOtp(code);
        setOtpTimer(600); // 10 minutes = 600 seconds
        setIsOtpTimerActive(true);
        setAuthMode('otp');
        setOtpDigits(['', '', '', '', '', '']);

        // Display incoming simulated Email notification
        setOtpNotification({
          email,
          code,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        });

        setSuccessMsg('Mã OTP đã được gửi đến email! Hiệu lực trong đúng 10 phút.');

        // 3. AUTO-FILL OTP (Tự động điền không cần nhập tay)
        if (autoFillEnabled) {
          triggerAutoFillAnimation(code);
        }
      }
    } catch (err) {
      // Fallback offline mock OTP in case of local offline
      const mockCode = `${Math.floor(100000 + Math.random() * 900000)}`;
      setReceivedOtp(mockCode);
      setOtpTimer(600);
      setIsOtpTimerActive(true);
      setAuthMode('otp');
      setOtpDigits(['', '', '', '', '', '']);
      setOtpNotification({
        email,
        code: mockCode,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      });
      setSuccessMsg('Mã OTP thử nghiệm (10 phút): ' + mockCode);
      if (autoFillEnabled) {
        triggerAutoFillAnimation(mockCode);
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Typewriter Auto-Fill Animation Function (Không cần gõ tay)
  const triggerAutoFillAnimation = (code) => {
    setIsAutoFilling(true);
    const chars = code.split('').slice(0, 6);
    chars.forEach((digit, index) => {
      setTimeout(() => {
        setOtpDigits((prev) => {
          const next = [...prev];
          next[index] = digit;
          return next;
        });
        if (index === chars.length - 1) {
          setIsAutoFilling(false);
        }
      }, (index + 1) * 120); // 120ms typewriter step
    });
  };

  // 5. One-Click Instant Auto-Fill Button Handler
  const handleInstantAutoFill = () => {
    if (receivedOtp) {
      triggerAutoFillAnimation(receivedOtp);
      setErrorMsg('');
      setSuccessMsg('Đã tự động điền mã OTP thành công!');
    } else {
      handleRequestOtp('quick_verify');
    }
  };

  // 6. Manual Digit Input & Paste support
  const handleOtpDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = cleanVal;
    setOtpDigits(updated);

    // Auto-focus next input
    if (cleanVal && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      triggerAutoFillAnimation(pasted);
    }
  };

  // 7. Verify OTP & Submit
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      setErrorMsg('Vui lòng nhập hoặc tự động điền đủ 6 chữ số mã OTP.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (newPassword) {
        // Reset password flow
        const res = await fetch('/api/auth/reset-password-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: enteredOtp, new_password: newPassword })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMsg(data.message || 'Mã OTP không đúng hoặc đã hết hạn.');
        } else {
          setSuccessMsg('Đổi mật khẩu thành công! Đang chuyển về đăng nhập...');
          setTimeout(() => {
            setAuthMode('login');
            setPassword(newPassword);
            setNewPassword('');
            setOtpNotification(null);
          }, 1200);
        }
      } else {
        // Quick verification flow
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: enteredOtp })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMsg(data.message || 'Mã OTP không hợp lệ hoặc đã quá 10 phút.');
        } else {
          setSuccessMsg('Xác thực OTP thành công! Hiệu lực 10 phút hoàn tất.');
          setTimeout(() => {
            setAuthMode('login');
            setOtpNotification(null);
          }, 1000);
        }
      }
    } catch (err) {
      setErrorMsg('Không thể kết nối máy chủ xác thực.');
    } finally {
      setLoading(false);
    }
  };

  // 8. Standard Login / Register Submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const isReg = authMode === 'register';
    const endpoint = isReg ? '/api/auth/register' : '/api/auth/login';
    const payload = isReg ? {
      email,
      password,
      role: activeTab,
      full_name: fullName,
      phone,
      extra_field: extraField
    } : {
      email,
      password,
      role: activeTab
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Thao tác không thành công.');
      } else {
        setSuccessMsg(data.message || 'Thành công!');
        localStorage.setItem('partime_token', data.token);
        localStorage.setItem('partime_user', JSON.stringify(data.user));
        setTimeout(() => {
          onAuthSuccess(data.user);
          onClose();
        }, 700);
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ API backend.');
    } finally {
      setLoading(false);
    }
  };

  // Demo account helper
  const handleQuickDemoLogin = (demoRole) => {
    const credentials = {
      student: { email: 'vuthelong1009@gmail.com', pass: 'Long123!' },
      employer: { email: 'huynhnguyenbaongoc2k5@gmail.com', pass: 'Huynh120905!' },
      admin: { email: 'lethithuyngan985@gmail.com', pass: 'Le090805!' }
    };
    const c = credentials[demoRole];
    setActiveTab(demoRole);
    setAuthMode('login');
    setEmail(c.email);
    setPassword(c.pass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Main Modal Card (Laptop, PC, iPad, Mobile Responsive) */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-7 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Đóng modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center shadow-inner">
            {activeTab === 'student' && <GraduationCap className="w-6 h-6" />}
            {activeTab === 'employer' && <Building className="w-6 h-6" />}
            {activeTab === 'admin' && <Lock className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {authMode === 'login' && 'Đăng Nhập Hệ Thống'}
            {authMode === 'register' && 'Tạo Tài Khoản Mới'}
            {authMode === 'otp' && 'Xác Thực OTP 10 Phút'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            PARTIME.VN • Đồng bộ hoàn hảo PC, Laptop, iPad & Mobile
          </p>
        </div>

        {/* Role Segment Tabs (Sinh viên, Nhà tuyển dụng, Quản trị viên) */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('student'); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'student' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sinh Viên
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('employer'); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'employer' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nhà Tuyển Dụng
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setAuthMode('login'); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'admin' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Quản Trị Viên
          </button>
        </div>

        {/* Strict Constraint Alert Banner (BR-AUTH-01) */}
        <div className="bg-emerald-50/80 border border-emerald-200/70 rounded-2xl p-3 mb-4 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-950 font-medium leading-relaxed">
            <span className="font-bold">Ràng buộc định danh:</span> 1 Email thực chỉ được dùng cho đúng 1 Role. Mã xác thực OTP có hiệu lực tối đa 10 phút.
          </p>
        </div>

        {/* Real-time Incoming Simulated Email Notification (Toast on Top) */}
        {otpNotification && (
          <div className="mb-4 p-3 bg-gradient-to-r from-emerald-600 to-brand-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20 animate-in slide-in-from-top-3 duration-300">
            <div className="flex items-center justify-between text-xs opacity-90 mb-1 border-b border-white/20 pb-1">
              <span className="flex items-center gap-1.5 font-semibold">
                <Mail className="w-3.5 h-3.5" /> Hộp thư đến: {otpNotification.email}
              </span>
              <span>{otpNotification.time}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-medium">Mã OTP: <strong className="text-sm font-mono tracking-widest bg-white/20 px-2 py-0.5 rounded-lg">{otpNotification.code}</strong></span>
              <span className="text-xs bg-emerald-700/80 px-2 py-0.5 rounded-full font-bold">10 phút</span>
            </div>
          </div>
        )}

        {/* Error / Success Toast Messages */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl p-3 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl p-3 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ======================= VIEW 1: OTP RECOVERY / VERIFICATION ======================= */}
        {authMode === 'otp' ? (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
            
            {/* Countdown Timer Header */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1.5 text-xs font-bold text-slate-700">
                <Clock className="w-4 h-4 text-brand-600 animate-pulse" />
                <span>Thời gian hiệu lực mã OTP (10 phút):</span>
              </div>
              
              {/* Dynamic Countdown Display */}
              <div className="text-3xl font-black font-mono tracking-wider text-brand-600">
                {formatTimer(otpTimer)}
              </div>

              {/* Progress Bar of 600s */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    otpTimer < 60 ? 'bg-red-500' : (otpTimer < 180 ? 'bg-amber-500' : 'bg-brand-500')
                  }`}
                  style={{ width: `${(otpTimer / 600) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                <span>Email: <strong className="text-slate-800">{email}</strong></span>
                <span className="font-semibold text-emerald-700">Hiệu lực 10:00</span>
              </div>
            </div>

            {/* 6-Digit OTP Boxes with Auto-Fill Feature */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800">
                  Nhập mã 6 chữ số:
                </label>
                
                {/* Instant Auto-fill Action Button */}
                <button
                  type="button"
                  onClick={handleInstantAutoFill}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition-all"
                  title="Tự động điền không cần nhập tay"
                >
                  <KeyRound className="w-3.5 h-3.5 text-brand-600" />
                  <span>Tự động điền OTP</span>
                </button>
              </div>

              <div className="flex justify-between gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-2xl border-2 transition-all focus:outline-none ${
                      digit 
                        ? 'border-brand-500 bg-brand-50/40 text-brand-900 shadow-sm' 
                        : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-brand-500 focus:bg-white'
                    } ${isAutoFilling ? 'animate-pulse' : ''}`}
                  />
                ))}
              </div>

              {/* Auto-fill indicator toggle */}
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoFillEnabled}
                    onChange={(e) => setAutoFillEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>Tự động điền khi nhận OTP</span>
                </label>

                {receivedOtp && (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Đã nhận mã từ hệ thống</span>
                  </span>
                )}
              </div>
            </div>

            {/* Optional New Password Input (If recovering password) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu mới (áp dụng khi khôi phục tài khoản)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={loading || otpTimer === 0}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Đang xác thực...' : 'Xác Nhận Mã OTP & Tiếp Tục'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleRequestOtp('resend')}
                  disabled={otpTimer > 540} // Allow resend after 60s
                  className="text-xs font-bold text-slate-600 hover:text-brand-600 flex items-center gap-1 disabled:opacity-40"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Gửi lại mã OTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            </div>
          </form>
        ) : (

        /* ======================= VIEW 2: LOGIN / REGISTER ======================= */
          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            
            {/* Register Specific Fields */}
            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {activeTab === 'student' ? 'Họ và tên sinh viên' : 'Tên doanh nghiệp / Người đại diện'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={activeTab === 'student' ? 'Nguyễn Văn A' : 'Tên doanh nghiệp / Công ty'}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {activeTab === 'student' ? 'Trường Đại học' : 'Địa chỉ trụ sở'}
                  </label>
                  <input
                    type="text"
                    required
                    value={extraField}
                    onChange={(e) => setExtraField(e.target.value)}
                    placeholder={activeTab === 'student' ? 'Đại học Văn Lang' : 'Quận 1, TP. Hồ Chí Minh'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Địa chỉ Email thực
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sinhvien@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Mật khẩu {authMode === 'register' && '(tối thiểu 6 ký tự)'}
                </label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp('forgot_password')}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Quên mật khẩu? (Nhận OTP 10p)</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Đang xử lý...' : authMode === 'register' ? 'Xác Nhận Đăng Ký' : 'Đăng Nhập Ngay'}
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Switch Mode between Login & Register */}
            {activeTab !== 'admin' && (
              <div className="text-center pt-2 text-xs text-slate-600">
                {authMode === 'login' ? (
                  <span>
                    Chưa có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
                      className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      Đăng ký vai trò {activeTab === 'student' ? 'Sinh viên' : 'Nhà tuyển dụng'}
                    </button>
                  </span>
                ) : (
                  <span>
                    Đã có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                      className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      Đăng nhập ngay
                    </button>
                  </span>
                )}
              </div>
            )}
          </form>
        )}

        {/* Demo Fast Login Shortcuts (Footer of Modal) */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Tài Khoản Mẫu Trải Nghiệm Nhanh
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('student')}
              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors flex items-center justify-center gap-1"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Sinh Viên</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('employer')}
              className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold border border-blue-200 transition-colors flex items-center justify-center gap-1"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Tuyển Dụng</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Quản Trị</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
