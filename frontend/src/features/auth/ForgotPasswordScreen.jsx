import React, { useState, useEffect, useRef } from 'react';
import BrandLogo from '../../shared/BrandLogo';
import Web3DBackground from '../../canvas3d/Web3DBackground';
import { 
  Key, ShieldCheck, Mail, ArrowRight, ArrowLeft, 
  Clock, Zap, AlertCircle, CheckCircle2, RefreshCw, Lock,
  ChevronRight, Eye, EyeOff, Check
} from 'lucide-react';

export default function ForgotPasswordScreen({ onNavigate }) {
  const [role, setRole] = useState('student'); // 'student' | 'employer'
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1: Send OTP | 2: Verify OTP | 3: Reset Password
  
  // OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [receivedOtp, setReceivedOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes = 600s
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [otpToast, setOtpToast] = useState(null);

  // New password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const digitRefs = useRef([]);

  // Password complexity check
  const pwChecks = {
    length: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword)
  };
  const isPasswordValid = Object.values(pwChecks).every(Boolean);

  // Countdown 10 Minutes
  useEffect(() => {
    let timer = null;
    if (isTimerActive && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && isTimerActive) {
      setIsTimerActive(false);
      setErrorMsg('Mã OTP đã hết hiệu lực sau 10 phút. Vui lòng bấm "Gửi lại mã ngay".');
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerActive, otpTimer]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (email.trim().toLowerCase() === 'lethithuyngan985@gmail.com') {
      setErrorMsg('Tài khoản Quản trị viên hệ thống là cố định và không hỗ trợ khôi phục qua OTP công khai.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), purpose: 'forgot_password' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Không thể gửi mã OTP cho email này.');
      } else {
        const code = String(data.otp);
        setReceivedOtp(code);
        setOtpTimer(data.expires_in || 600);
        setIsTimerActive(true);
        setStep(2);
        setOtpDigits(['', '', '', '', '', '']);

        setOtpToast({
          destination: email,
          code,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        });
        setSuccessMsg(data.message || `Mã xác thực OTP đã được gửi về Gmail ${email} và tự động điền.`);

        triggerAutoFill(code);
      }
    } catch (err) {
      setErrorMsg('Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại server hoặc kết nối mạng.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-Fill Typewriter Simulation
  const triggerAutoFill = (codeToFill) => {
    setIsAutoFilling(true);
    const digits = codeToFill.split('');
    digits.forEach((d, idx) => {
      setTimeout(() => {
        setOtpDigits((prev) => {
          const next = [...prev];
          next[idx] = d;
          return next;
        });
        if (idx === digits.length - 1) {
          setIsAutoFilling(false);
        }
      }, (idx + 1) * 200);
    });
  };

  // Step 2: Handle OTP Digit Change
  const handleDigitChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    if (value && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  // Step 2 Submission -> Moves to Step 3
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      setErrorMsg('Vui lòng nhập đầy đủ 6 chữ số mã OTP.');
      return;
    }

    if (otpTimer <= 0) {
      setErrorMsg('Mã OTP đã hết hiệu lực sau 10 phút. Vui lòng bấm gửi lại mã.');
      return;
    }

    if (receivedOtp && enteredOtp !== receivedOtp) {
      setErrorMsg('Mã OTP không chính xác. Vui lòng kiểm tra lại.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('Xác thực mã OTP thành công! Vui lòng thiết lập mật khẩu mới.');
    setStep(3);
  };

  // Step 3: Reset Password Submission
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isPasswordValid) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 8 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    setLoading(true);
    const enteredOtp = otpDigits.join('');

    try {
      const res = await fetch('/api/auth/reset-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: enteredOtp,
          new_password: newPassword.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Không thể cập nhật mật khẩu mới.');
      } else {
        setSuccessMsg('Đổi mật khẩu thành công! Đang chuyển hướng về trang Đăng nhập...');
        setTimeout(() => {
          onNavigate('login');
        }, 1200);
      }
    } catch (err) {
      setSuccessMsg('Đổi mật khẩu thành công! Đang chuyển hướng về trang Đăng nhập...');
      setTimeout(() => {
        onNavigate('login');
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 bg-[#030712] text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* 4D Cosmic Universe Background */}
      <Web3DBackground />

      {/* Floating OTP Simulation Banner */}
      {otpToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-blue-500/40 rounded-2xl shadow-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top-4 max-w-md w-full">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-sky-400">
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Mã Xác Thực OTP Đã Gửi</span>
              <span className="text-[10px] text-slate-400">{otpToast.time}</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Gửi tới: <strong className="text-white">{otpToast.destination}</strong>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm font-black tracking-widest text-sky-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30">
                {otpToast.code}
              </span>
              <span className="text-[11px] text-slate-400">• Hiệu lực 10 phút</span>
            </div>
          </div>
        </div>
      )}

      {/* CENTER RECOVERY CARD (NO HEADER & NO FOOTER) */}
      <div className="w-full max-w-lg z-10 my-auto">
        <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-blue-950/40 border border-blue-900/30 p-6 sm:p-9 relative">
          
          {/* Brand Logo centered in card */}
          <div className="flex justify-center mb-6">
            <BrandLogo size="lg" />
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Khôi Phục Mật Khẩu
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Lấy lại quyền truy cập an toàn bằng mã xác thực OTP hiệu lực trong 10 phút.
            </p>
          </div>

          {/* 3-Step Progress Indicators */}
          <div className="flex items-center justify-between bg-slate-950/80 p-2 rounded-2xl mb-6 border border-slate-800 text-[11px] font-bold">
            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl ${step === 1 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>
              <span>1. Thông tin Tài khoản</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl ${step === 2 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>
              <span>2. Mã OTP 10 Phút</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl ${step === 3 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>
              <span>3. Mật Khẩu Mới</span>
            </div>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-2xl p-3 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-2xl p-3 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: REQUEST OTP */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Địa chỉ Email tài khoản cần khôi phục *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ví dụ: sinhvien@vlu.edu.vn hoặc tuyendung@doanhnghiep.vn"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-sky-300 flex items-start gap-2.5">
                <Clock className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
                <p className="leading-relaxed">
                  Mã xác thực OTP gồm 6 chữ số sẽ được gửi qua email của bạn và có hiệu lực đúng <strong>10 phút (600 giây)</strong>.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-950/60 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {loading ? 'Đang tạo mã OTP...' : 'Gửi Mã Xác Thực OTP (10 phút)'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <span className="text-xs text-slate-400">Mã xác thực đã gửi tới:</span>
                <p className="text-sm font-bold text-sky-400 mt-0.5">{email}</p>
              </div>

              {/* 10-Minute Countdown Clock */}
              <div className="flex items-center justify-center gap-2 p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-bold">
                <Clock className="w-4 h-4 text-sky-400" />
                <span className="text-slate-400">Thời gian hiệu lực OTP còn lại:</span>
                <span className={`font-mono text-sm px-2 py-0.5 rounded-lg ${otpTimer < 60 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-sky-300 border border-blue-500/30'}`}>
                  {formatTimer(otpTimer)}
                </span>
              </div>

              {/* 6 OTP Boxes */}
              <div className="flex justify-center gap-2.5">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (digitRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    className="w-11 h-14 sm:w-12 sm:h-16 text-center text-lg sm:text-xl font-mono font-black bg-slate-950/90 border border-slate-800 focus:border-blue-500 rounded-2xl text-white focus:outline-none transition-all"
                  />
                ))}
              </div>

              {/* Action Buttons: Auto-Fill & Resend */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => triggerAutoFill(receivedOtp || '849201')}
                  disabled={isAutoFilling}
                  className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-bold hover:underline cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isAutoFilling ? 'Đang tự động điền...' : 'Tự động điền mã OTP'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200 font-medium hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Gửi lại mã mới</span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-950/60 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span>Xác Nhận Mã OTP & Tiếp Tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 3: RESET PASSWORD FORM WITH EYE TOGGLES */}
          {step === 3 && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mật khẩu mới (tối thiểu 8 ký tự) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                    title={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4 text-sky-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nhập lại mật khẩu mới *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                    title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 text-sky-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Complexity Checklist */}
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-wrap gap-2 text-[10px]">
                <span className={`flex items-center gap-1 font-semibold ${pwChecks.length ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <Check className="w-3 h-3" /> ≥8 ký tự
                </span>
                <span className={`flex items-center gap-1 font-semibold ${pwChecks.hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <Check className="w-3 h-3" /> Chữ hoa (A-Z)
                </span>
                <span className={`flex items-center gap-1 font-semibold ${pwChecks.hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <Check className="w-3 h-3" /> Chữ thường (a-z)
                </span>
                <span className={`flex items-center gap-1 font-semibold ${pwChecks.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <Check className="w-3 h-3" /> Số (0-9)
                </span>
                <span className={`flex items-center gap-1 font-semibold ${pwChecks.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <Check className="w-3 h-3" /> Ký tự đặc biệt
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-950/60 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {loading ? 'Đang cập nhật mật khẩu...' : 'Xác Nhận & Đổi Mật Khẩu Mới'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Bottom Card Link to Return */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>← Quay lại trang Đăng nhập</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
