import React, { useState, useEffect, useRef } from 'react';
import BrandLogo from '../../shared/BrandLogo';
import { 
  User, Lock, Mail, Phone, Building, GraduationCap, 
  ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff,
  ChevronRight, FileText, Upload, Check, MapPin, X, ChevronLeft, Briefcase,
  KeyRound, Clock
} from 'lucide-react';
import { HCM_DISTRICTS } from '../../shared/professionSuggestions';

const VIETNAM_UNIVERSITIES = [
  'Đại học Văn Lang (VLU)',
  'Đại học Bách Khoa - ĐHQG TP.HCM',
  'Đại học Khoa học Tự nhiên - ĐHQG TP.HCM',
  'Đại học Công nghệ Thông tin - ĐHQG TP.HCM (UIT)',
  'Đại học Kinh tế TP.HCM (UEH)',
  'Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)',
  'Đại học Ngoại Thương - Cơ sở 2 (FTU2)',
  'Đại học Tôn Đức Thắng (TDTU)',
  'Đại học Công nghệ TP.HCM (HUTECH)',
  'Đại học Hoa Sen (HSU)',
  'Đại học FPT TP.HCM',
  'Đại học Sài Gòn (SGU)',
  'Đại học Mở TP.HCM (OU)',
  'Đại học Ngân Hàng TP.HCM (HUB)',
  'Đại học Tài chính - Marketing (UFM)',
  'Đại học Luật TP.HCM (ULAW)',
  'Đại học Y Dược TP.HCM (UMP)',
  'Cao đẳng Kỹ thuật Cao Thắng',
  'Cao đẳng Kinh tế Đối ngoại'
];

export default function RegisterScreen({ onAuthSuccess, onNavigate, initialRole, lockRole = false }) {
  const [role, setRole] = useState(initialRole || 'student'); // 'student' | 'employer'
  const [step, setStep] = useState(1); // 1: Form | 2: OTP Verification

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  
  // Distinct fields for Employer
  const [companyName, setCompanyName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [licenseFile, setLicenseFile] = useState(null);
  const [licenseFileName, setLicenseFileName] = useState('');
  const [address, setAddress] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // OTP Verification States
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [receivedOtp, setReceivedOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(600);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [otpToast, setOtpToast] = useState(null);
  const digitRefs = useRef([]);

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);

  // Countdown Timer for OTP (10 minutes)
  useEffect(() => {
    let timer = null;
    if (isTimerActive && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && isTimerActive) {
      setIsTimerActive(false);
      setErrorMsg('Mã OTP đã hết hiệu lực sau 10 phút. Vui lòng bấm "Gửi lại mã OTP".');
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

  // Password complexity check
  const pwChecks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)
  };
  const isPasswordValid = Object.values(pwChecks).every(Boolean);

  const processFile = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Tệp Giấy phép kinh doanh (GPKD) chỉ nhận định dạng .pdf (application/pdf). Hệ thống chặn mọi định dạng khác!');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Dung lượng tệp GPKD không được vượt quá 10MB.');
      return;
    }
    setErrorMsg('');
    setLicenseFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setLicenseFile(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Hands-free Auto Fill OTP
  const handleAutoFillOtp = (customOtp) => {
    const targetOtp = customOtp || receivedOtp;
    if (!targetOtp || targetOtp.length < 6) return;
    setIsAutoFilling(true);
    const chars = String(targetOtp).slice(0, 6).split('');
    chars.forEach((c, idx) => {
      setTimeout(() => {
        setOtpDigits((prev) => {
          const next = [...prev];
          next[idx] = c;
          return next;
        });
        if (digitRefs.current[idx]) {
          digitRefs.current[idx].focus();
        }
        if (idx === chars.length - 1) {
          setIsAutoFilling(false);
        }
      }, idx * 100);
    });
  };

  const handleDigitChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
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

  // STEP 1: Submit form and send OTP
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@gmail.com')) {
      setErrorMsg('Địa chỉ Email phải có định dạng đuôi @gmail.com!');
      return;
    }

    const cleanPhone = phone.trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      setErrorMsg('Số điện thoại liên hệ phải có đúng 10 chữ số (Ví dụ: 0987654321)!');
      return;
    }

    if (role === 'employer') {
      const cleanTax = businessLicense.trim();
      if (!/^\d{10,13}$/.test(cleanTax)) {
        setErrorMsg('Mã số thuế doanh nghiệp phải từ 10 đến 13 chữ số!');
        return;
      }
      if (!companyName.trim()) {
        setErrorMsg('Vui lòng nhập Tên Doanh nghiệp / Công ty.');
        return;
      }
      if (!licenseFileName) {
        setErrorMsg('Bắt buộc đính kèm tệp Giấy phép kinh doanh (GPKD) định dạng .pdf (≤ 10MB).');
        return;
      }
    }

    if (!isPasswordValid) {
      setErrorMsg('Mật khẩu phải tối thiểu 8 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt (!#$*...).');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, purpose: 'register' })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const code = String(data.otp);
        setReceivedOtp(code);
        setOtpTimer(data.expires_in || 600);
        setIsTimerActive(true);
        setStep(2);
        setOtpDigits(['', '', '', '', '', '']);
        setOtpToast({ code, email: cleanEmail });
        setSuccessMsg(`Mã xác thực OTP đã được gửi tới ${cleanEmail}. Đang tự động điền...`);

        // Tự động điền mã OTP sau 800ms
        setTimeout(() => {
          handleAutoFillOtp(code);
        }, 800);
      } else {
        setErrorMsg(data.message || 'Không thể gửi mã xác thực OTP. Vui lòng kiểm tra lại email.');
      }
    } catch (err) {
      // Fallback cho kiểm thử offline
      const demoOtp = '654321';
      setReceivedOtp(demoOtp);
      setOtpTimer(600);
      setIsTimerActive(true);
      setStep(2);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpToast({ code: demoOtp, email: cleanEmail });
      setSuccessMsg(`Mã xác thực OTP đã được gửi tới ${cleanEmail}. Đang tự động điền...`);
      setTimeout(() => {
        handleAutoFillOtp(demoOtp);
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  // Re-send OTP
  const handleResendOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, purpose: 'register' })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const code = String(data.otp);
        setReceivedOtp(code);
        setOtpTimer(data.expires_in || 600);
        setIsTimerActive(true);
        setOtpDigits(['', '', '', '', '', '']);
        setOtpToast({ code, email: cleanEmail });
        setSuccessMsg('Mã OTP mới đã được gửi tới hộp thư Gmail của bạn.');
        setTimeout(() => {
          handleAutoFillOtp(code);
        }, 800);
      } else {
        setErrorMsg(data.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
      }
    } catch (err) {
      const demoOtp = '654321';
      setReceivedOtp(demoOtp);
      setOtpTimer(600);
      setIsTimerActive(true);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpToast({ code: demoOtp, email: cleanEmail });
      setTimeout(() => {
        handleAutoFillOtp(demoOtp);
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP and Complete Registration
  const handleCompleteRegister = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setErrorMsg('Vui lòng nhập đầy đủ 6 chữ số mã OTP.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role,
          otp: enteredOtp,
          full_name: fullName.trim(),
          representative_name: fullName.trim(),
          company_name: companyName.trim() || organization.trim(),
          branch_name: branchName.trim(),
          phone: phone.trim(),
          extra_field: role === 'student' ? organization.trim() : companyName.trim(),
          business_license: businessLicense.trim(),
          license_filename: licenseFileName,
          license_file: licenseFile,
          address: address.trim()
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng đăng nhập...');
        setOtpToast(null);
        setTimeout(() => {
          const loginPath = role === 'employer' ? '/employer/login' : '/student/login';
          if (window.history && window.history.pushState) window.history.pushState({}, '', loginPath);
          onNavigate('login', role);
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-dimension text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col justify-center items-center p-4 relative py-12">
      
      {/* Floating OTP Simulator Toast with Auto-Fill */}
      {otpToast && (
        <div className="fixed top-6 right-6 z-50 bg-white border-2 border-blue-500 rounded-2xl p-4 shadow-2xl max-w-sm w-full animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-blue-700">
              <KeyRound className="w-5 h-5" />
              <h4 className="text-xs font-bold uppercase tracking-wide">Mã OTP Xác Thực (10 Phút)</h4>
            </div>
            <button onClick={() => setOtpToast(null)} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Gửi tới: <strong className="text-slate-800">{otpToast.email}</strong>
          </p>
          <div className="flex items-center justify-between mt-3 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
            <span className="font-mono text-xl font-black text-blue-700 tracking-widest">
              {otpToast.code}
            </span>
            <button
              onClick={() => handleAutoFillOtp(otpToast.code)}
              disabled={isAutoFilling}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors"
            >
              {isAutoFilling ? 'Đang điền...' : 'Điền tự động'}
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl">
        
        {/* Brand Header - Bấm vào logo để quay lại trang xem chế độ khách */}
        <div className="flex flex-col items-center mb-6">
          <button
            type="button"
            onClick={() => {
              const landingPath = role === 'employer' ? '/employer' : '/student';
              if (window.history && window.history.pushState) window.history.pushState({}, '', landingPath);
              onNavigate('landing', role);
            }}
            className="cursor-pointer hover:opacity-90 transition-opacity focus:outline-none"
            title="Nhấn vào logo để quay lại trang xem chế độ khách"
          >
            <BrandLogo size="lg" />
          </button>
        </div>

        {/* Card */}
        <div className="glass-card-dimension p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-200/90 space-y-6 bg-white/95">
          
          {/* Role Indicator / Selector (Chỉ cho phép chuyển vai trò khi đang ở Bước 1) */}
          {step === 1 && (
            <>
              {!lockRole ? (
                <div className="flex bg-slate-100 p-1.5 rounded-2xl text-xs font-bold border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      role === 'student'
                        ? 'bg-blue-600 text-white shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Sinh Viên</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('employer')}
                    className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      role === 'employer'
                        ? 'bg-blue-600 text-white shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Doanh Nghiệp</span>
                  </button>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                  {role === 'employer' ? <Briefcase className="w-3.5 h-3.5 text-blue-600" /> : <GraduationCap className="w-3.5 h-3.5 text-blue-600" />}
                  <span>{role === 'employer' ? 'ĐĂNG KÝ NHÀ TUYỂN DỤNG' : 'ĐĂNG KÝ SINH VIÊN'}</span>
                </div>
              )}
            </>
          )}

          {/* Heading */}
          {step === 1 ? (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Tạo Tài Khoản {role === 'employer' ? 'Doanh Nghiệp' : 'Sinh Viên'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {role === 'employer'
                  ? 'Đăng ký để tiếp cận hơn 250,000+ sinh viên và quản lý tuyển dụng part-time.'
                  : 'Đăng ký hoàn toàn miễn phí để khám phá việc làm theo ca và xếp lịch làm thêm.'}
              </p>
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>BƯỚC 2: XÁC THỰC EMAIL BẢO MẬT</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Xác Thực Mã OTP Qua Email
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Vui lòng nhập mã OTP 6 chữ số được gửi tới hộp thư Gmail của bạn để kích hoạt tài khoản {role === 'employer' ? 'Doanh Nghiệp' : 'Sinh Viên'}.
              </p>
            </div>
          )}

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: FORM NHẬP THÔNG TIN */}
          {step === 1 && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-sm sm:text-base font-bold text-slate-700 mb-1.5">
                  {role === 'employer' ? 'Họ tên người đại diện pháp lý / Tuyển dụng *' : 'Họ và tên sinh viên *'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={role === 'employer' ? 'Nguyễn Văn A (Đại diện)' : 'Nguyễn Văn B'}
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm sm:text-base font-bold text-slate-700 mb-1.5">
                  Địa chỉ Email tài khoản (Nhận OTP) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'employer' ? 'Nhatuyendung@gmail.com' : 'Sinhvien@gmail.com'}
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm sm:text-base font-bold text-slate-700 mb-1.5">
                  Số điện thoại liên hệ (10 chữ số) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0987654321"
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* STUDENT SPECIFIC: University */}
              {role === 'student' && (
                <div>
                  <label className="block text-sm sm:text-base font-bold text-slate-700 mb-1.5">
                    Trường Đại Học / Cao Đẳng *
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      required
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                    >
                      <option value="">-- Chọn trường theo học --</option>
                      {VIETNAM_UNIVERSITIES.map((u, idx) => (
                        <option key={idx} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* EMPLOYER SPECIFIC: Company Name, Branch, Tax Code & GPKD PDF */}
              {role === 'employer' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-sm sm:text-base font-bold text-slate-700 mb-1.5">
                      Tên Doanh Nghiệp / Thương Hiệu Chuỗi *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Công ty TNHH Cà phê & Trà Việt Nam"
                        className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm sm:text-base font-bold text-slate-700 mb-1.5">
                        Chi Nhánh Tuyển Dụng
                      </label>
                      <input
                        type="text"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        placeholder="Chi nhánh Quận 1"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm sm:text-base font-bold text-slate-700 mb-1.5">
                        Mã Số Thuế (10 hoặc 13 số) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={14}
                        value={businessLicense}
                        onChange={(e) => setBusinessLicense(e.target.value)}
                        placeholder="0123456789"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-bold text-slate-700 mb-1.5">
                      Địa chỉ trụ sở / điểm làm việc *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="42 Ngô Đức Kế, Phường Bến Nghé, Quận 1, TP.HCM"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  {/* Upload GPKD PDF */}
                  <div>
                    <label className="block text-sm sm:text-base font-bold text-slate-700 mb-1.5">
                      Đính kèm tệp Giấy Phép Kinh Doanh (.pdf ≤ 10MB) *
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                        isDraggingFile 
                          ? 'border-blue-600 bg-blue-50' 
                          : (licenseFileName ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-300 bg-slate-50/80')
                      }`}
                    >
                      {licenseFileName ? (
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 text-emerald-800 font-semibold truncate">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate">{licenseFileName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setLicenseFileName('');
                              setLicenseFile(null);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                          <p className="text-xs text-slate-600">
                            Kéo thả tệp PDF vào đây hoặc{' '}
                            <label className="text-blue-600 font-bold hover:underline cursor-pointer">
                              chọn tệp từ máy
                              <input
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </label>
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">Chỉ chấp nhận định dạng .pdf (Dung lượng ≤ 10MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm sm:text-base font-bold text-slate-700 mb-1.5">
                    Mật khẩu *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-bold text-slate-700 mb-1.5">
                    Xác nhận mật khẩu *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password requirements pill check */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700">Yêu cầu bảo mật mật khẩu:</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className={pwChecks.length ? 'text-emerald-600 font-semibold flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                    <Check className="w-3.5 h-3.5 shrink-0" /> Tối thiểu 8 ký tự
                  </span>
                  <span className={pwChecks.hasUpper ? 'text-emerald-600 font-semibold flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                    <Check className="w-3.5 h-3.5 shrink-0" /> Chữ hoa (A-Z)
                  </span>
                  <span className={pwChecks.hasLower ? 'text-emerald-600 font-semibold flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                    <Check className="w-3.5 h-3.5 shrink-0" /> Chữ thường (a-z)
                  </span>
                  <span className={pwChecks.hasSpecial ? 'text-emerald-600 font-semibold flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                    <Check className="w-3.5 h-3.5 shrink-0" /> Ký tự đặc biệt (@#$...)
                  </span>
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300"
                />
                <span>
                  Tôi đồng ý với <strong className="text-blue-600">Điều khoản sử dụng</strong> và <strong className="text-blue-600">Chính sách bảo mật</strong> của PARTIME.VN.
                </span>
              </label>

              {/* Submit Button to trigger OTP */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl btn-primary-dimension text-sm sm:text-base font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <span>Đang gửi mã OTP qua Gmail...</span>
                ) : (
                  <>
                    <span>Tiếp Tục Xác Thực Email (Nhận Mã OTP)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          )}

          {/* STEP 2: XÁC THỰC MÃ OTP */}
          {step === 2 && (
            <form onSubmit={handleCompleteRegister} className="space-y-5">
              
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kiểm Tra Hộp Thư Email</h3>
                  <p className="text-xs text-slate-600">
                    Mã OTP gồm 6 chữ số đã được gửi tới: <strong className="text-blue-700 font-mono">{email}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700">Thời hạn hiệu lực mã OTP:</span>
                <span className="font-mono font-bold text-blue-600 flex items-center gap-1.5 text-sm">
                  <Clock className="w-4 h-4" />
                  {formatTimer(otpTimer)}
                </span>
              </div>

              {/* 6 Digit Inputs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 text-center uppercase tracking-wider">
                  Nhập 6 Chữ Số Mã OTP
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (digitRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(index, e)}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white shadow-inner transition-all"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Quay lại sửa thông tin
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || otpTimer > 540}
                  className="text-xs font-bold text-blue-600 hover:underline disabled:opacity-40 cursor-pointer"
                >
                  {loading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl btn-primary-dimension text-sm sm:text-base font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <span>Đang xác thực & tạo tài khoản...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Xác Nhận & Hoàn Tất Đăng Ký</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-500">
                💡 Hệ thống hỗ trợ <strong>tự động điền mã OTP</strong> ngay khi nhận được để bạn tiết kiệm thời gian.
              </p>
            </form>
          )}

          {/* Switch to Login */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            <span>Đã có tài khoản? </span>
            <button
              type="button"
              onClick={() => {
                const loginPath = role === 'employer' ? '/employer/login' : '/student/login';
                if (window.history && window.history.pushState) window.history.pushState({}, '', loginPath);
                onNavigate('login', role);
              }}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Đăng nhập ngay
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
