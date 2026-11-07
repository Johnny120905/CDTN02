import React, { useState, useEffect } from 'react';
import HeroLogo3D from '../canvas3d/HeroLogo3D';
import { 
  Search, MapPin, DollarSign, Clock, CheckCircle2, Bookmark, 
  ArrowRight, ShieldCheck, Users, GraduationCap, Briefcase 
} from 'lucide-react';

export default function HeroLanding({ onOpenAuth, onSelectRole }) {
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => { if (data.success) setFeaturedJobs(data.data); })
      .catch(console.error);

    fetch('/api/categories')
      .then(res => res.json())
      .then(data => { if (data.success) setCategories(data.data); })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-12 sm:space-y-16 pb-24 sm:pb-16">
      
      {/* 1. HERO SECTION WITH 3D CANVAS */}
      <section className="relative overflow-hidden pt-8 pb-12 lg:pt-14 lg:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content (7 Cols) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nền tảng việc làm Part-time #1 Sinh viên Việt Nam</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Tìm Việc Làm Linh Hoạt, <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-emerald-500">
                  Vững Bước Tương Lai
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Kết nối sinh viên với hàng nghìn công việc bán thời gian uy tín tại TP.HCM & Hà Nội. Xếp ca linh hoạt theo lịch học, thanh toán lương minh bạch và tuyệt đối không thu phí đặt cọc.
              </p>

              {/* Quick Search Floating Bar */}
              <div className="p-2 sm:p-3 bg-white rounded-3xl shadow-xl shadow-brand-500/10 border border-slate-200/80 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto lg:mx-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Vị trí: Barista, Thu ngân, Gia sư, IT..."
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  onClick={() => onSelectRole('student')}
                  className="py-2.5 px-6 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>Tìm Việc Ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Popular Tags */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Tìm kiếm phổ biến:</span>
                {['Barista', 'Gia sư Toán/Anh', 'Thực tập IT', 'Phục vụ bàn', 'Content Writer'].map((tag) => (
                  <span 
                    key={tag}
                    onClick={() => { setKeyword(tag); onSelectRole('student'); }}
                    className="bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Column: 3D Interactive WebGL Hero Canvas (5 Cols) */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="w-full max-w-md bg-gradient-to-b from-emerald-50/50 via-white to-white rounded-3xl p-4 border border-emerald-100 shadow-2xl relative">
                {/* 3D Canvas */}
                <HeroLogo3D />
                
                {/* Floating Metric Card 1 */}
                <div className="absolute -top-4 -left-4 bg-white p-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce duration-1000">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase block">Đã xác minh GPKD</span>
                    <span className="text-xs font-bold text-slate-900">100% Doanh nghiệp uy tín</span>
                  </div>
                </div>

                {/* Floating Metric Card 2 */}
                <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase block">Linh hoạt ca học</span>
                    <span className="text-xs font-bold text-slate-900">25.000đ - 50.000đ/giờ</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. STATS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">15,000+</span>
            <span className="text-xs font-semibold text-slate-500 mt-1 block">Việc Làm Đang Tuyển</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-brand-600 block">250,000+</span>
            <span className="text-xs font-semibold text-slate-500 mt-1 block">Sinh Viên Hoạt Động</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">4,200+</span>
            <span className="text-xs font-semibold text-slate-500 mt-1 block">Doanh Nghiệp Liên Kết</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-brand-600 block">99.2%</span>
            <span className="text-xs font-semibold text-slate-500 mt-1 block">Tỷ Lệ Đánh Giá 5 Sao</span>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PART-TIME JOBS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
              Khám Phá Cơ Hội Mới
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Việc Làm Part-Time Nổi Bật Dành Cho Sinh Viên
            </h2>
          </div>
          <button
            onClick={() => onSelectRole('student')}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors"
          >
            <span>Xem tất cả công việc</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredJobs.map((job) => (
            <div 
              key={job._id}
              className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-500/5 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src={job.company_logo || "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=80&auto=format&fit=crop&q=80"}
                    alt={job.company_name}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-sm"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      {job.company_name}
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                      {job.title}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                  {job.description}
                </p>

                <div className="space-y-1.5 text-xs font-medium text-slate-600 mb-6">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-50/60 p-2 rounded-xl">
                    <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{job.salary_min?.toLocaleString()}đ - {job.salary_max?.toLocaleString()}đ/giờ</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 px-2 py-1">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 px-2 py-1">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{job.work_time}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectRole('student')}
                className="w-full py-2.5 bg-slate-900 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Ứng Tuyển Ngay
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. VALUE PROPOSITION FOR 3 ROLES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-brand-400 text-xs font-bold uppercase tracking-wider block mb-2">
              Hệ Sinh Thái Phân Chia Độc Lập
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Được Thiết Kế Tối Ưu Cho Cả 3 Đối Tượng
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Cổng Dành Cho Sinh Viên</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Lọc ca làm linh hoạt, nộp hồ sơ bằng một chạm, lưu bản chụp CV snapshot minh bạch, chat và phỏng vấn trực tiếp bằng video call WebRTC.
                </p>
              </div>
              <button
                onClick={() => onSelectRole('student')}
                className="mt-6 py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-colors"
              >
                Khám Phá Cổng Sinh Viên &rarr;
              </button>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Nhà Tuyển Dụng (Bảo Ngọc)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Đăng tin nhanh chóng, quản lý hồ sơ theo quy trình ATS chuẩn hóa, xếp lịch phỏng vấn và đánh giá thái độ sinh viên sau làm việc.
                </p>
              </div>
              <button
                onClick={() => onSelectRole('employer')}
                className="mt-6 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
              >
                Khám Phá Cổng Doanh Nghiệp &rarr;
              </button>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Quản Trị Viên (Thuỳ Ngân)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dashboard phân tích toàn diện, kiểm duyệt tin rác, khóa tài khoản vi phạm và thiết lập bộ lọc từ cấm tự động bảo vệ sinh viên.
                </p>
              </div>
              <button
                onClick={() => onSelectRole('admin')}
                className="mt-6 py-2 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors"
              >
                Khám Phá Cổng Quản Trị &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

