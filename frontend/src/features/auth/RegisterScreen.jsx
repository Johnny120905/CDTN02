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

import React, { useState } from 'react';
import BrandLogo from '../../shared/BrandLogo';
import Web3DBackground from '../../canvas3d/Web3DBackground';
import { 
  User, Lock, Mail, Phone, Building, GraduationCap, 
  ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff,
  ChevronRight, FileText, Upload, Check, MapPin, X
} from 'lucide-react';
import { HCM_DISTRICTS, HCM_BRANCH_SUGGESTIONS } from '../../shared/professionSuggestions';

export default function RegisterScreen({ onAuthSuccess, onNavigate }) {
  const [role, setRole] = useState('student'); // 'student' | 'employer'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState(''); // School for student
  
  // Distinct fields for Employer (Requirement 7)
  const [companyName, setCompanyName] = useState(''); // Tên doanh nghiệp riêng biệt
  const [branchName, setBranchName] = useState(''); // Chi nhánh riêng biệt
  const [businessLicense, setBusinessLicense] = useState(''); // MST / GPKD number
  const [licenseFile, setLicenseFile] = useState(null); // File object or preview
  const [licenseFileName, setLicenseFileName] = useState('');
  const [address, setAddress] = useState(''); // Trụ sở chính / Chi nhánh

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Password complexity check (minimum 8 characters)
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

    if (!isPasswordValid) {
      setErrorMsg('Mật khẩu phải tối thiểu 8 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
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
          license_file: licenseFile || '',
          address: address.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Đăng ký tài khoản không thành công.');
      } else {
        setSuccessMsg(data.message || 'Tạo tài khoản thành công! Đang chuyển hướng...');
        localStorage.setItem('partime_token', data.token);
        localStorage.setItem('partime_user', JSON.stringify(data.user));
        setTimeout(() => {
          onAuthSuccess(data.user);
        }, 600);
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ API backend. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 bg-[#030712] text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* 4D Cosmic Universe Background */}
      <Web3DBackground />

      {/* CENTER REGISTRATION CARD (NO HEADER & NO FOOTER) */}
      <div className="w-full max-w-2xl z-10 my-6">
        <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-blue-950/40 border border-blue-900/30 p-6 sm:p-9 relative">
          
          {/* Brand Logo centered in card */}
          <div className="flex justify-center mb-6">
            <BrandLogo size="lg" />
          </div>

          {/* Title & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Tạo Tài Khoản Thành Viên
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Mở khóa cơ hội việc làm linh hoạt, xác thực doanh nghiệp uy tín và kết nối nhanh chóng.
            </p>
          </div>

          {/* Role Choice Cards */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Chọn vai trò thành viên của bạn:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Student */}
              <div
                onClick={() => setRole('student')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  role === 'student'
                    ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-950/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    role === 'student' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Sinh viên / TTS</h3>
                    <p className="text-[10px] text-slate-400">Tìm ca làm linh hoạt theo lịch học</p>
                  </div>
                </div>
              </div>

              {/* Option 2: Employer */}
              <div
                onClick={() => setRole('employer')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  role === 'employer'
                    ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-950/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    role === 'employer' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Nhà Tuyển Dụng</h3>
                    <p className="text-[10px] text-slate-400">Đăng tin ca làm & tuyển dụng sinh viên</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-2xl p-3.5 mb-5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-2xl p-3.5 mb-5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* Student: Full Name & School */}
            {role === 'student' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Họ và tên sinh viên *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="ví dụ: Nguyễn Văn An"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Trường Đại học / Cao đẳng *
                    </label>
                    <span className="text-[10px] text-sky-400 font-medium">Gợi ý trường ĐH/CĐ</span>
                  </div>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      list="vietnam-universities-list"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="ví dụ: Đại học Văn Lang (Gõ để gợi ý...)"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                    />
                    <datalist id="vietnam-universities-list">
                      {VIETNAM_UNIVERSITIES.map((u, idx) => (
                        <option key={idx} value={u} />
                      ))}
                    </datalist>
                  </div>
                  {/* Gợi ý chọn nhanh các trường đại học phổ biến */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Đại học Văn Lang', 'ĐH Bách Khoa TP.HCM', 'ĐH Kinh Tế (UEH)', 'ĐH HUTECH', 'ĐH FPT'].map((u, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setOrganization(u)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                          organization === u
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Employer: Tên Công ty, Tên Người đại diện và Chi nhánh (Riêng biệt - Yêu cầu 7) */
              <div className="space-y-3 p-4 bg-slate-950/60 rounded-2xl border border-blue-900/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Tên Doanh nghiệp / Công ty *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="ví dụ: Phúc Long Coffee & Tea"
                        className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Chi nhánh / Văn phòng tuyển dụng
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        list="hcm-branches-list"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        placeholder="Chọn hoặc nhập chi nhánh (24 quận huyện)..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                      />
                      <datalist id="hcm-branches-list">
                        {HCM_BRANCH_SUGGESTIONS.map((b) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Họ và tên Người đại diện tuyển dụng *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="ví dụ: Huỳnh Nguyễn Bảo Ngọc (Trưởng phòng nhân sự)"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email Field with 1 Email 1 Role Note */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Email liên hệ chính thức *
                </label>
                <span className="text-[10px] font-bold text-sky-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  1 Email dùng cho 1 vai trò duy nhất
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'student' ? 'Sinhvien@gmail.com' : 'Nhatuyendung@gmail.com'}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Số điện thoại liên hệ *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xx xxx xxx"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* BỔ SUNG RIÊNG CHO NHÀ TUYỂN DỤNG: GPKD & ĐỊA CHỈ TRỤ SỞ */}
            {role === 'employer' && (
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-blue-900/30 space-y-3">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Xác thực Doanh nghiệp & Giấy Phép Kinh Doanh (GPKD)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Mã số thuế / Số GPKD *
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={businessLicense}
                        onChange={(e) => setBusinessLicense(e.target.value)}
                        placeholder="ví dụ: 0312345678"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Địa chỉ trụ sở chính / Quận huyện *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        list="hcm-districts-list"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Chọn hoặc nhập địa chỉ / Quận (24 quận huyện TP.HCM)..."
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                      <datalist id="hcm-districts-list">
                        {HCM_DISTRICTS.map((d) => (
                          <option key={d} value={`${d}, TP.HCM`} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Upload File GPKD với Hỗ Trợ Kéo Thả File Bên Ngoài (Drag & Drop) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Đính kèm tệp GPKD * (Bắt buộc file PDF):
                    </label>
                    <span className="text-[10px] text-sky-400 font-semibold">Chỉ nhận .pdf ≤ 10MB</span>
                  </div>
                  <label 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      isDraggingFile 
                        ? 'border-sky-400 bg-sky-500/20 scale-[1.01] shadow-lg shadow-sky-950/50' 
                        : 'border-slate-800 hover:border-blue-500/50 bg-slate-900/60 hover:bg-slate-900'
                    }`}
                  >
                    <Upload className={`w-6 h-6 mb-1.5 transition-transform ${isDraggingFile ? 'text-sky-300 scale-125 animate-bounce' : 'text-sky-400'}`} />
                    <span className="text-xs text-slate-200 font-bold text-center">
                      {licenseFileName ? `✓ Tệp PDF đã tải lên: ${licenseFileName}` : (isDraggingFile ? 'Thả tệp GPKD (.pdf) vào đây ngay!' : 'Nhấp để chọn file hoặc kéo thả tệp PDF GPKD từ máy tính')}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">Định dạng hợp lệ: .pdf (Dung lượng tối đa 10MB)</span>
                    <input 
                      type="file" 
                      accept=".pdf,application/pdf" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Password & Confirm with Eye toggles (Requirement 3) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mật khẩu bảo mật *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-sky-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Xác nhận lại mật khẩu *
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
                <Check className="w-3 h-3" /> Chữ số (0-9)
              </span>
              <span className={`flex items-center gap-1 font-semibold ${pwChecks.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                <Check className="w-3 h-3" /> Ký tự đặc biệt (!@#$)
              </span>
            </div>

            {/* Agree Terms */}
            <div className="flex items-center gap-2 text-xs pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="terms" className="text-slate-400 cursor-pointer">
                Tôi đồng ý với <span className="text-sky-400 font-bold hover:underline">Điều khoản sử dụng</span> và cam kết tuân thủ <span className="text-sky-400 font-bold hover:underline">Chính sách bảo mật dữ liệu</span>.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-blue-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Tạo Tài Khoản Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Back to Login */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Đã có tài khoản tại hệ thống?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-sky-400 font-bold hover:underline cursor-pointer ml-1"
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
