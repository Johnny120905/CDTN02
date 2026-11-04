import React, { useState, useEffect } from 'react';
import BrandLogo from '../../shared/BrandLogo';
import { 
  User, Lock, Mail, Phone, Building, GraduationCap, 
  ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff,
  ChevronRight, FileText, Upload, Check, MapPin, X, ChevronLeft, Briefcase
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

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);

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
    }

    if (!isPasswordValid) {
      setErrorMsg('Mật khẩu phải tối thiểu 8 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt (!#$*...).');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      return;
    }

    if (role === 'employer') {
      if (!companyName.trim()) {
        setErrorMsg('Vui lòng nhập Tên Doanh nghiệp / Công ty.');
        return;
      }
      if (!licenseFileName) {
        setErrorMsg('Bắt buộc đính kèm tệp Giấy phép kinh doanh (GPKD) định dạng .pdf (≤ 10MB).');
        return;
      }
    }

    if (!agreeTerms) {
      setErrorMsg('Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.');
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
        setTimeout(() => {
          const loginPath = role === 'employer' ? '/employer/login' : '/student/login';
          if (window.history && window.history.pushState) window.history.pushState({}, '', loginPath);
          onNavigate('login', role);
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-dimension text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col justify-center items-center p-4 relative py-12">
      
      {/* Top back button */}
      <div className="absolute top-6 left-6">
        <button
          onClick={() => {
            const landingPath = role === 'employer' ? '/employer' : '/student';
            if (window.history && window.history.pushState) window.history.pushState({}, '', landingPath);
            onNavigate('landing', role);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white text-xs font-semibold text-slate-700 shadow-sm border border-slate-200 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Về trang chủ {role === 'employer' ? 'Nhà tuyển dụng' : 'Sinh viên'}</span>
        </button>
      </div>

      <div className="w-full max-w-2xl">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <BrandLogo size="lg" />
        </div>

        {/* Card */}
        <div className="glass-card-dimension p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-200/90 space-y-6 bg-white/95">
          
          {/* Role Indicator / Selector */}
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
                <span>🎓 Sinh Viên</span>
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
                <span>💼 Doanh Nghiệp</span>
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
              {role === 'employer' ? <Briefcase className="w-3.5 h-3.5 text-blue-600" /> : <GraduationCap className="w-3.5 h-3.5 text-blue-600" />}
              <span>{role === 'employer' ? 'ĐĂNG KÝ NHÀ TUYỂN DỤNG' : 'ĐĂNG KÝ SINH VIÊN'}</span>
            </div>
          )}

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
                Địa chỉ Email tài khoản *
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
                <span className={pwChecks.length ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                  ✓ Tối thiểu 8 ký tự
                </span>
                <span className={pwChecks.hasUpper ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                  ✓ Chữ hoa (A-Z)
                </span>
                <span className={pwChecks.hasLower ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                  ✓ Chữ thường (a-z)
                </span>
                <span className={pwChecks.hasSpecial ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                  ✓ Ký tự đặc biệt (@#$...)
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl btn-primary-dimension text-sm sm:text-base font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <span>Đang xử lý đăng ký...</span>
              ) : (
                <>
                  <span>Hoàn Tất Đăng Ký Tài Khoản</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

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
