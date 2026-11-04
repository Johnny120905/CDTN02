import React, { useState, useEffect } from 'react';
import { 
  X, User, Lock, Mail, Phone, Building, GraduationCap, MapPin,
  Check, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, Activity
} from 'lucide-react';

export default function AccountModal({ isOpen, onClose, currentUser, onUpdateSuccess }) {
  if (!isOpen || !currentUser) return null;

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'
  
  // Profile state - Distinct fields for Student vs Employer
  const [fullName, setFullName] = useState(
    currentUser?.profile?.representative_name || 
    currentUser?.profile?.full_name || 
    currentUser?.full_name || ''
  );
  const [companyName, setCompanyName] = useState(
    currentUser?.profile?.company_name || ''
  );
  const [branchName, setBranchName] = useState(
    currentUser?.profile?.branch_name || ''
  );
  const [phone, setPhone] = useState(currentUser?.profile?.phone || '');
  const [extraField, setExtraField] = useState(
    currentUser?.profile?.university || 
    currentUser?.profile?.address || ''
  );
  const [userStatus, setUserStatus] = useState(
    currentUser?.profile?.status || currentUser?.status || 'active'
  );

  // Password state with auto-fill current password per specification
  const getDefaultCurrentPassword = () => {
    const saved = localStorage.getItem('partime_saved_pw') || sessionStorage.getItem('partime_saved_pw');
    if (saved) return saved;
    const email = (currentUser?.email || '').toLowerCase();
    if (email.includes('vuthelong')) return 'Long123!';
    if (email.includes('huynhnguyenbaongoc')) return 'Huynh120905!';
    if (email.includes('lethithuyngan')) return 'Le090805!';
    if (currentUser?.role === 'student') return 'Long123!';
    if (currentUser?.role === 'employer') return 'Huynh120905!';
    if (currentUser?.role === 'admin') return 'Le090805!';
    return '';
  };

  const [oldPassword, setOldPassword] = useState(getDefaultCurrentPassword());
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOldPassword(getDefaultCurrentPassword());
    }
  }, [isOpen, currentUser]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const token = localStorage.getItem('partime_token');
  const headers = token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' };

  // Password complexity check
  const pwChecks = {
    length: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword)
  };
  const isPasswordValid = Object.values(pwChecks).every(Boolean);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    setLoading(true);

    try {
      const endpoint = currentUser.role === 'student' 
        ? '/api/student/profile' 
        : (currentUser.role === 'employer' ? '/api/employer/company' : null);

      if (!endpoint) {
        setMsg({ text: 'Thông tin quản trị viên là cố định theo cấu hình hệ thống.', type: 'info' });
        setLoading(false);
        return;
      }

      const bodyData = currentUser.role === 'student'
        ? { 
            full_name: fullName.trim(), 
            phone: phone.trim(), 
            university: extraField.trim(),
            status: userStatus
          }
        : { 
            company_name: companyName.trim() || fullName.trim(), 
            representative_name: fullName.trim(),
            branch_name: branchName.trim(),
            address: extraField.trim(), 
            phone: phone.trim(),
            status: userStatus
          };

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: 'Cập nhật thông tin thành công!', type: 'success' });
        const updatedUser = { ...currentUser };
        updatedUser.status = userStatus;
        updatedUser.profile = { ...(updatedUser.profile || {}), ...bodyData };
        localStorage.setItem('partime_user', JSON.stringify(updatedUser));
        if (onUpdateSuccess) onUpdateSuccess(updatedUser);
      } else {
        setMsg({ text: data.message || 'Cập nhật thất bại.', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: 'Lỗi kết nối máy chủ.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (!isPasswordValid) {
      setMsg({ text: 'Mật khẩu mới phải có tối thiểu 8 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg({ text: 'Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: 'Đổi mật khẩu thành công!', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMsg({ text: data.message || 'Đổi mật khẩu không thành công.', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: 'Lỗi kết nối máy chủ.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-slate-800 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        
        {/* Header with Close */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-slate-900">Tài Khoản & Bảo Mật</h2>
            <p className="text-xs text-slate-500 mt-0.5">Quản lý hồ sơ cá nhân, trạng thái hoạt động và mật khẩu bảo mật</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); setMsg({ text: '', type: '' }); }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Thông Tin Tài Khoản
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('password'); setMsg({ text: '', type: '' }); }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'password' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đổi Mật Khẩu
          </button>
        </div>

        {/* Alerts */}
        {msg.text && (
          <div className={`p-3 rounded-2xl text-xs font-semibold mb-4 flex items-center gap-2 ${
            msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            (msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200')
          }`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* TAB 1: UPDATE PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Địa chỉ Email (Cố định)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-medium text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Trạng thái hoạt động tự động đồng bộ (Online khi đăng nhập, Tạm dừng khi đăng xuất, Ngưng khi khóa/hủy) */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Trạng Thái Tài Khoản</p>
                  <p className="text-xs text-slate-500">Tự động đồng bộ theo phiên đăng nhập / đăng xuất</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                (currentUser?.is_banned || userStatus === 'inactive' || userStatus === 'cancelled')
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : (userStatus === 'paused'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200')
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  (currentUser?.is_banned || userStatus === 'inactive' || userStatus === 'cancelled')
                    ? 'bg-red-500'
                    : (userStatus === 'paused'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500 animate-pulse')
                }`} />
                <span>
                  {(currentUser?.is_banned || userStatus === 'inactive' || userStatus === 'cancelled')
                    ? 'Ngưng hoạt động'
                    : (userStatus === 'paused' ? 'Tạm dừng' : 'Đang hoạt động')}
                </span>
              </span>
            </div>

            {/* Role-specific fields */}
            {currentUser.role === 'admin' ? (
              <div className="space-y-4 pt-1">
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Hồ Sơ Quản Trị Viên Hệ Thống</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-700 border border-blue-200">
                      SUPER ADMIN
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-xs text-slate-600">Mã định danh (Admin ID):</p>
                      <p className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 mt-1">
                        {currentUser._id || currentUser.id || 'ADM_SUPER_2026'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Họ và tên Quản trị viên:</p>
                      <p className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 mt-1">
                        {currentUser.profile?.full_name || currentUser.full_name || 'Lê Thị Thúy Ngân'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Để đổi mật khẩu đăng nhập của Quản trị viên, vui lòng chuyển sang tab <strong>"Đổi Mật Khẩu"</strong> ở phía trên.</span>
                </div>
              </div>
            ) : (
              <>
                {currentUser.role === 'employer' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên Doanh nghiệp / Công ty *</label>
                        <div className="relative">
                          <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="ví dụ: Công ty TNHH Cà phê & Trà Sài Gòn"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Chi nhánh / Đơn vị</label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            placeholder="ví dụ: Chi nhánh Quận 1"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Họ và tên Người đại diện tuyển dụng *</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="ví dụ: Huỳnh Nguyễn Bảo Ngọc"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Họ và tên sinh viên *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Số điện thoại liên hệ</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09xx xxx xxx"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {currentUser.role === 'student' ? 'Trường Đại học / Cao đẳng' : 'Địa chỉ trụ sở chính'}
                  </label>
                  <div className="relative">
                    {currentUser.role === 'student' ? (
                      <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    ) : (
                      <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    )}
                    <input
                      type="text"
                      value={extraField}
                      onChange={(e) => setExtraField(e.target.value)}
                      placeholder={currentUser.role === 'student' ? 'Đại học Văn Lang' : '42 Nguyễn Huệ, Quận 1, TP.HCM'}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                >
                  {loading ? 'Đang lưu...' : 'Lưu Thay Đổi Thông Tin'}
                </button>
              </>
            )}
          </form>
        )}

        {/* TAB 2: CHANGE PASSWORD */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu hiện tại *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1"
                  title={showOldPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu mới (tối thiểu 8 ký tự) *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1"
                  title={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Xác nhận lại mật khẩu mới *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1"
                  title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checklist */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-2 text-xs">
              <span className={`flex items-center gap-1 font-semibold ${pwChecks.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                <Check className="w-3 h-3" /> ≥8 ký tự
              </span>
              <span className={`flex items-center gap-1 font-semibold ${pwChecks.hasUpper ? 'text-emerald-600' : 'text-slate-400'}`}>
                <Check className="w-3 h-3" /> Chữ hoa
              </span>
              <span className={`flex items-center gap-1 font-semibold ${pwChecks.hasLower ? 'text-emerald-600' : 'text-slate-400'}`}>
                <Check className="w-3 h-3" /> Chữ thường
              </span>
              <span className={`flex items-center gap-1 font-semibold ${pwChecks.hasNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                <Check className="w-3 h-3" /> Số
              </span>
              <span className={`flex items-center gap-1 font-semibold ${pwChecks.hasSpecial ? 'text-emerald-600' : 'text-slate-400'}`}>
                <Check className="w-3 h-3" /> Ký tự đặc biệt
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              {loading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu Mới'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
