import React, { useState, useEffect } from 'react';
import BrandLogo from './BrandLogo';
import HeroLogo3D from '../canvas3d/HeroLogo3D';
import { 
  Search, MapPin, DollarSign, Clock, CheckCircle2, Bookmark, 
  Sparkles, ArrowRight, ShieldCheck, Zap, Users, GraduationCap, 
  Briefcase, Eye, ChevronRight, Building, Award, Star, Phone, 
  Mail, FileText, Check, X, ArrowUpRight, Filter, AlertCircle
} from 'lucide-react';

const FALLBACK_JOBS = [
  {
    _id: 'job_mock_1',
    title: 'Nhân viên Pha chế Barista (Part-time)',
    company_name: 'Phúc Long Coffee & Tea',
    company_logo: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=100&auto=format&fit=crop&q=80',
    salary_min: 28000,
    salary_max: 35000,
    location: '42 Ngô Đức Kế, Phường Bến Nghé, Quận 1, TP.HCM',
    work_time: 'Ca sáng (7h00 - 12h00) hoặc Ca chiều (13h00 - 18h00)',
    description: 'Pha chế các dòng trà sữa, cà phê truyền thống theo công thức chuẩn. Đảm bảo vệ sinh quầy pha chế và phục vụ khách hàng chu đáo.',
    requirements: 'Sinh viên từ 18 tuổi trở lên, trung thực, nhanh nhẹn. Ưu tiên có kinh nghiệm cơ bản hoặc sẽ được đào tạo bài bản 3 ngày.',
    benefits: 'Phụ cấp tiền ăn, thưởng doanh số chi nhánh, hỗ trợ linh hoạt đổi ca thi cử theo lịch học.',
    category: 'F&B / Pha chế'
  },
  {
    _id: 'job_mock_2',
    title: 'Nhân viên Thu ngân Siêu thị Mini (Ca Tối)',
    company_name: 'WinMart+ Bán Lẻ',
    company_logo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=100&auto=format&fit=crop&q=80',
    salary_min: 26000,
    salary_max: 32000,
    location: '128 Nguyễn Gia Trí, Phường 25, Bình Thạnh, TP.HCM',
    work_time: 'Ca tối (18h00 - 22h30)',
    description: 'Tính tiền, kiểm tra hóa đơn cho khách qua máy POS. Sắp xếp hàng hóa ngăn nắp lên kệ theo tiêu chuẩn cửa hàng.',
    requirements: 'Kỹ năng tính toán cơ bản, giao tiếp thân thiện. Ưu tiên sinh viên trường ĐH Văn Lang, HUTECH gần khu vực Bình Thạnh.',
    benefits: 'Lương chuyển khoản đúng ngày 5 hàng tháng, voucher mua hàng giảm 15% tại siêu thị.',
    category: 'Bán lẻ / Thu ngân'
  },
  {
    _id: 'job_mock_3',
    title: 'Gia sư Tiếng Anh Giao Tiếp Cơ Bản',
    company_name: 'Trung Tâm Ngoại Ngữ Vstar',
    company_logo: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=100&auto=format&fit=crop&q=80',
    salary_min: 50000,
    salary_max: 75000,
    location: '382 Quang Trung, Phường 10, Gò Vấp, TP.HCM',
    work_time: 'Thứ 3 - 5 - 7 (18h30 - 20h00)',
    description: 'Trợ giảng và hướng dẫn phát âm chuẩn cho học sinh THCS. Chuẩn bị tài liệu ôn tập và chấm bài tập về nhà.',
    requirements: 'IELTS từ 6.5 hoặc TOEIC từ 750. Có chứng chỉ nghiệp vụ sư phạm là một lợi thế lớn.',
    benefits: 'Mức lương giờ cao, cơ hội thực tập giảng dạy và cấp giấy chứng nhận kinh nghiệm.',
    category: 'Gia sư / Giáo dục'
  },
  {
    _id: 'job_mock_4',
    title: 'Thực tập sinh Phát triển Web Frontend (Part-time)',
    company_name: 'TechLab Solutions VN',
    company_logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=80',
    salary_min: 35000,
    salary_max: 50000,
    location: 'Khu Công Nghệ Cao, TP. Thủ Đức, TP.HCM',
    work_time: 'Linh hoạt 20 giờ / tuần',
    description: 'Tham gia xây dựng giao diện người dùng ReactJS, TailwindCSS cho các dự án thương mại điện tử và cổng tuyển dụng.',
    requirements: 'Nắm vững HTML, CSS, JavaScript, ReactJS cơ bản. Có tinh thần ham học hỏi và tư duy thuật toán tốt.',
    benefits: 'Được Senior trực tiếp mentoring 1-1, hỗ trợ dấu mộc thực tập tốt nghiệp và xét lên chính thức.',
    category: 'Công nghệ thông tin'
  },
  {
    _id: 'job_mock_5',
    title: 'Nhân viên Phục vụ Nhà hàng Cuối Tuần',
    company_name: 'Chuỗi Lẩu Haidilao',
    company_logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&auto=format&fit=crop&q=80',
    salary_min: 30000,
    salary_max: 42000,
    location: 'Tầng 4 Vincom Center, 72 Lê Thánh Tôn, Quận 1, TP.HCM',
    work_time: 'Thứ 7 & Chủ Nhật (Ca gãy 4 - 8 tiếng)',
    description: 'Chào đón và hướng dẫn khách vào bàn, nhận gọi món qua tablet, chuẩn bị nước lẩu và hỗ trợ khách hàng suốt bữa ăn.',
    requirements: 'Ngoại hình sáng, nụ cười tươi, tác phong nhanh nhẹn. Không yêu cầu kinh nghiệm trước.',
    benefits: 'Ăn giữa ca miễn phí, tiền tip chia đều hàng tuần, môi trường làm việc trẻ trung năng động.',
    category: 'F&B / Pha chế'
  },
  {
    _id: 'job_mock_6',
    title: 'Cộng tác viên Viết bài Content & Quản trị Fanpage',
    company_name: 'Saigon Media Agency',
    company_logo: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=100&auto=format&fit=crop&q=80',
    salary_min: 30000,
    salary_max: 45000,
    location: 'Làm việc Online kết hợp lên văn phòng Quận 3 1 buổi/tuần',
    work_time: 'Linh hoạt tự sắp xếp theo deadline',
    description: 'Sáng tạo bài đăng social media cho các nhãn hàng sinh viên, thiết kế ảnh cơ bản bằng Canva và theo dõi tương tác bài viết.',
    requirements: 'Có khả năng viết lách lưu loát, bắt trend TikTok/Facebook tốt. Có laptop cá nhân.',
    benefits: 'Làm việc linh hoạt tại nhà, thưởng bài viết viral, hỗ trợ làm báo cáo thực tập.',
    category: 'Văn phòng / Marketing'
  }
];

export default function PublicLandingPage({ onNavigate, onShowNotice }) {
  // Mode: 'candidate' (Ứng viên / Sinh viên) | 'employer' (Nhà tuyển dụng / Doanh nghiệp)
  const [audienceMode, setAudienceMode] = useState('candidate');
  
  // Real Jobs from API with Fallback
  const [jobs, setJobs] = useState(FALLBACK_JOBS);
  const [loadingJobs, setLoadingJobs] = useState(false);
  
  // Filter States
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedShift, setSelectedShift] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Job Detail Modal State
  const [activeJobDetail, setActiveJobDetail] = useState(null);

  // Fetch Real Jobs from API
  useEffect(() => {
    setLoadingJobs(true);
    fetch('/api/jobs')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
          // Merge API jobs with fallback images if logo is missing
          const enriched = data.data.map((j, idx) => ({
            ...j,
            company_logo: j.company_logo || FALLBACK_JOBS[idx % FALLBACK_JOBS.length].company_logo
          }));
          setJobs(enriched);
        }
      })
      .catch((err) => {
        console.warn('[LandingPage] Using fallback jobs:', err);
      })
      .finally(() => {
        setLoadingJobs(false);
      });
  }, []);

  // Filter Logic
  const filteredJobs = jobs.filter((job) => {
    const matchKeyword = !searchKeyword.trim() || 
      (job.title && job.title.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (job.company_name && job.company_name.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (job.description && job.description.toLowerCase().includes(searchKeyword.toLowerCase()));
    
    const matchLocation = selectedLocation === 'all' || 
      (job.location && job.location.toLowerCase().includes(selectedLocation.toLowerCase()));

    const matchShift = selectedShift === 'all' || 
      (job.work_time && job.work_time.toLowerCase().includes(selectedShift.toLowerCase()));

    const matchCategory = selectedCategory === 'all' || 
      (job.category && job.category.toLowerCase().includes(selectedCategory.toLowerCase()));

    return matchKeyword && matchLocation && matchShift && matchCategory;
  });

  const handleApplyClick = (job) => {
    if (onShowNotice) {
      onShowNotice('Vui lòng đăng nhập tài khoản Sinh viên để nộp hồ sơ ứng tuyển!', 'loading');
    }
    setTimeout(() => {
      onNavigate('login', 'student');
    }, 400);
  };

  const handlePostJobClick = () => {
    if (onShowNotice) {
      onShowNotice('Đang chuyển đến Cổng Nhà tuyển dụng...', 'loading');
    }
    setTimeout(() => {
      onNavigate('register', 'employer');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      
      {/* 1. PUBLIC TOP HEADER (STICKY BLUR BAR) */}
      <header className="sticky top-0 z-40 bg-[#030712]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <BrandLogo size="md" />
            <div className="hidden lg:block">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block">
                Nền tảng việc làm sinh viên
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Xếp ca linh hoạt • 100% Duyệt GPKD
              </span>
            </div>
          </div>

          {/* Center: AUDIENCE SWITCHER (TopCV Style: Ứng viên vs Nhà tuyển dụng) */}
          <div className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setAudienceMode('candidate')}
              className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                audienceMode === 'candidate'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Dành cho Ứng Viên</span>
            </button>
            <button
              onClick={() => setAudienceMode('employer')}
              className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                audienceMode === 'employer'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Dành cho Nhà Tuyển Dụng</span>
            </button>
          </div>

          {/* Right: Auth Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onNavigate('login', audienceMode === 'candidate' ? 'student' : 'employer')}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-200 transition-colors border border-slate-700/60 cursor-pointer"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => onNavigate('register', audienceMode === 'candidate' ? 'student' : 'employer')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md cursor-pointer ${
                audienceMode === 'candidate'
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30'
              }`}
            >
              Đăng ký
            </button>
          </div>

        </div>
      </header>

      {/* 2. DYNAMIC HERO SECTION (CANDIDATE vs EMPLOYER) */}
      <section className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
        {audienceMode === 'employer' && (
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[300px] bg-amber-600/10 blur-[120px] rounded-full pointer-events-none" />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column (7 Cols) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Audience Specific Pill Tag */}
              {audienceMode === 'candidate' ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 text-xs font-bold shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Nền tảng việc làm Part-time #1 dành cho Sinh viên</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-lg">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  <span>Giải pháp tuyển dụng Part-time & Thực tập sinh chất lượng cao</span>
                </div>
              )}

              {/* Dynamic Big Heading */}
              {audienceMode === 'candidate' ? (
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
                  Tìm Việc Linh Hoạt, <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">
                    Vững Bước Tương Lai
                  </span>
                </h1>
              ) : (
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
                  Tiếp Cận 250,000+ <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-300">
                    Sinh Viên Năng Động Trong 24H
                  </span>
                </h1>
              )}

              {/* Dynamic Description */}
              {audienceMode === 'candidate' ? (
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Kết nối trực tiếp sinh viên với hàng ngàn việc làm bán thời gian tại TP.HCM. Xếp ca linh hoạt theo lịch học, thanh toán lương minh bạch và <strong className="text-blue-400 font-bold">tuyệt đối không thu phí đặt cọc</strong>.
                </p>
              ) : (
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Đăng tin nhanh chóng chỉ trong 60 giây, kiểm soát chất lượng qua quy trình quản lý ATS chuẩn hóa, phỏng vấn trực tiếp bằng video call WebRTC và đánh giá ứng viên minh bạch.
                </p>
              )}

              {/* DYNAMIC ACTION BOX ACCORDING TO AUDIENCE */}
              {audienceMode === 'candidate' ? (
                /* Candidate Quick Search Box */
                <div className="p-3 sm:p-4 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl space-y-3 max-w-2xl mx-auto lg:mx-0 backdrop-blur-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    
                    {/* Input Keyword */}
                    <div className="sm:col-span-6 relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="Vị trí: Barista, Thu ngân, Gia sư..."
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Location Select */}
                    <div className="sm:col-span-3 relative">
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="all">Mọi khu vực</option>
                        <option value="Quận 1">Quận 1</option>
                        <option value="Bình Thạnh">Bình Thạnh</option>
                        <option value="Gò Vấp">Gò Vấp</option>
                        <option value="Quận 7">Quận 7</option>
                        <option value="Thủ Đức">TP. Thủ Đức</option>
                        <option value="Quận 3">Quận 3</option>
                      </select>
                    </div>

                    {/* Button Search */}
                    <div className="sm:col-span-3">
                      <a
                        href="#jobs-section"
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-900/40 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Tìm việc</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Popular Tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Gợi ý tìm kiếm:</span>
                    {['Barista', 'Gia sư', 'Thực tập IT', 'Thu ngân', 'Phục vụ bàn'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchKeyword(tag)}
                        className="bg-slate-800/80 hover:bg-blue-900/40 hover:text-blue-300 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors border border-slate-700/50 cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Employer Quick Action Box */
                <div className="p-5 sm:p-6 bg-slate-900/90 rounded-3xl border border-amber-900/40 shadow-2xl space-y-4 max-w-xl mx-auto lg:mx-0 backdrop-blur-xl">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handlePostJobClick}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm rounded-2xl shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Đăng Tin Tuyển Dụng Ngay</span>
                    </button>
                    <button
                      onClick={() => onNavigate('login', 'employer')}
                      className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-2xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Vào Cổng Doanh Nghiệp</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Duyệt tin 15 phút</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>100% Sinh viên thật</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ATS chuẩn hóa</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: 3D Interactive WebGL Hero Canvas (5 Cols) */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="w-full max-w-md bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-950 rounded-3xl p-4 border border-slate-800 shadow-2xl relative">
                
                {/* 3D Canvas */}
                <HeroLogo3D />
                
                {/* Floating Metric Card 1 */}
                <div className="absolute -top-4 -left-4 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase block">Đã xác minh GPKD</span>
                    <span className="text-xs font-bold text-slate-100">100% Doanh nghiệp uy tín</span>
                  </div>
                </div>

                {/* Floating Metric Card 2 */}
                <div className="absolute -bottom-4 -right-4 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase block">Linh hoạt theo ca</span>
                    <span className="text-xs font-bold text-slate-100">25.000đ - 55.000đ/giờ</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. STATS BAR (4 METRICS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-8 bg-slate-900/60 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-md text-center">
          <div>
            <span className="text-2xl sm:text-3xl font-black text-blue-400 block">15,000+</span>
            <span className="text-xs font-medium text-slate-400 mt-1 block">Việc Làm Đang Tuyển</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-cyan-400 block">250,000+</span>
            <span className="text-xs font-medium text-slate-400 mt-1 block">Sinh Viên Hoạt Động</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">4,200+</span>
            <span className="text-xs font-medium text-slate-400 mt-1 block">Doanh Nghiệp Liên Kết</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 block">100%</span>
            <span className="text-xs font-medium text-slate-400 mt-1 block">Duyệt GPKD Hợp Pháp</span>
          </div>
        </div>
      </section>

      {/* 4. PUBLIC JOBS EXPLORER SECTION */}
      <section id="jobs-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">
              Khám Phá Cơ Hội Mới
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Việc Làm Part-Time Nổi Bật Dành Cho Sinh Viên
            </h2>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Hiển thị <span className="text-blue-400 font-bold">{filteredJobs.length}</span> công việc phù hợp
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'Tất cả ngành nghề' },
            { id: 'F&B', label: '☕ F&B / Pha chế / Phục vụ' },
            { id: 'Bán lẻ', label: '🛒 Bán lẻ / Thu ngân' },
            { id: 'Gia sư', label: '📚 Gia sư / Giáo dục' },
            { id: 'Công nghệ', label: '💻 Công nghệ thông tin' },
            { id: 'Văn phòng', label: '📝 Văn phòng / Marketing' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all border cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950/40'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-950/30 transition-all flex flex-col justify-between group backdrop-blur-md"
            >
              <div>
                {/* Company Header */}
                <div className="flex items-center gap-3.5 mb-4">
                  <img
                    src={job.company_logo || "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=80&auto=format&fit=crop&q=80"}
                    alt={job.company_name}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-700/80 shadow-md bg-slate-950 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 truncate">
                      <span>{job.company_name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                      {job.title}
                    </h3>
                  </div>
                </div>

                {/* Salary Badge */}
                <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-xl text-xs mb-3.5">
                  <DollarSign className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {job.salary_min ? `${job.salary_min.toLocaleString()}đ` : 'Thỏa thuận'} - {job.salary_max ? `${job.salary_max.toLocaleString()}đ` : ''} / giờ
                  </span>
                </div>

                {/* Location & Time */}
                <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{job.location || 'TP. Hồ Chí Minh'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{job.work_time || 'Ca linh hoạt'}</span>
                  </div>
                </div>

                {/* Short Description */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-6">
                  {job.description}
                </p>
              </div>

              {/* Action Buttons: Xem chi tiết & Ứng tuyển */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => setActiveJobDetail(job)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem Chi Tiết</span>
                </button>
                <button
                  onClick={() => handleApplyClick(job)}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-950/40 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Ứng Tuyển</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </section>

      {/* 5. EMPLOYER SOLUTIONS SECTION (FOR BUSINESS AUDIENCE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mb-8">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest block mb-2">
              Dành Riêng Cho Nhà Tuyển Dụng
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight leading-tight">
              Tuyển Dụng Nhân Sự Part-Time Nhanh Chóng & Tiết Kiệm 70% Chi Phí
            </h2>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              Giải quyết bài toán thiếu hụt nhân sự vào các khung giờ cao điểm hoặc dịp lễ tết với hệ thống quản lý hồ sơ ATS kéo thả, bảo mật và phỏng vấn trực tuyến.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <Zap className="w-6 h-6 text-amber-400 mb-2" />
              <h4 className="text-sm font-bold text-slate-200 mb-1">Đăng tin 60 giây</h4>
              <p className="text-xs text-slate-400">Thiết lập mức lương theo giờ và khung ca làm việc dễ dàng.</p>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <Users className="w-6 h-6 text-blue-400 mb-2" />
              <h4 className="text-sm font-bold text-slate-200 mb-1">Quản trị hồ sơ ATS</h4>
              <p className="text-xs text-slate-400">Phân loại ứng viên trực quan: Chờ duyệt, Phỏng vấn, Trúng tuyển.</p>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <Phone className="w-6 h-6 text-emerald-400 mb-2" />
              <h4 className="text-sm font-bold text-slate-200 mb-1">Phỏng vấn WebRTC</h4>
              <p className="text-xs text-slate-400">Gọi video trực tiếp trên trình duyệt, không cần cài thêm phần mềm.</p>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <ShieldCheck className="w-6 h-6 text-cyan-400 mb-2" />
              <h4 className="text-sm font-bold text-slate-200 mb-1">Đánh giá minh bạch</h4>
              <p className="text-xs text-slate-400">Kiểm tra lịch sử ứng tuyển và mức độ chuyên cần của sinh viên.</p>
            </div>
          </div>

          <button
            onClick={handlePostJobClick}
            className="py-3 px-8 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-amber-950/50 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Tạo Tài Khoản Doanh Nghiệp & Đăng Tin Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 6. ECOSYSTEM GATEWAYS (3 ROLES) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-blue-400 text-xs font-bold uppercase tracking-widest block mb-2">
            Hệ Sinh Thái Phân Quyền Độc Lập
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            Tối Ưu Trải Nghiệm Cho Cả 3 Phân Hệ
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Student Gateway */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-blue-500/50 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Cổng Sinh Viên</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Phân hệ dành cho sinh viên tìm kiếm việc làm, lọc theo thời khóa biểu, ứng tuyển 1-chạm và lưu bản sao chụp CV snapshot cố định minh bạch.
              </p>
            </div>
            <button
              onClick={() => onNavigate('login', 'student')}
              className="mt-6 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Vào Cổng Sinh Viên</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Employer Gateway */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/50 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Cổng Nhà Tuyển Dụng</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Phân hệ dành cho doanh nghiệp đăng tin, quản lý phỏng vấn, chat hai chiều và đánh giá thái độ nhân sự sau quá trình thử việc.
              </p>
            </div>
            <button
              onClick={() => onNavigate('login', 'employer')}
              className="mt-6 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Vào Cổng Doanh Nghiệp</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Admin Gateway */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/50 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Cổng Quản Trị Viên</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Phân hệ kiểm duyệt giấy phép kinh doanh, xử lý báo cáo vi phạm, quản lý danh sách người dùng và thiết lập bộ lọc an toàn cho sinh viên.
              </p>
            </div>
            <button
              onClick={() => onNavigate('login', 'admin')}
              className="mt-6 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Vào Cổng Quản Trị</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* 7. PUBLIC FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <BrandLogo size="sm" />
            <p className="text-slate-500 leading-relaxed">
              PARTIME.VN là nền tảng kết nối việc làm bán thời gian thông minh dành cho sinh viên Việt Nam, giải quyết bài toán lịch học và việc làm minh bạch.
            </p>
            <p className="text-xs text-slate-600">
              Đề tài Chuyên đề tốt nghiệp 2 (CDTN02) - ĐH Văn Lang.
            </p>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold mb-3 text-sm">Dành Cho Ứng Viên</h4>
            <ul className="space-y-2">
              <li><button onClick={() => { setAudienceMode('candidate'); window.scrollTo({ top: 300, behavior: 'smooth' }); }} className="hover:text-blue-400 cursor-pointer">Tìm việc làm part-time</button></li>
              <li><button onClick={() => onNavigate('register', 'student')} className="hover:text-blue-400 cursor-pointer">Tạo tài khoản sinh viên</button></li>
              <li><span className="text-slate-600">Cẩm nang phỏng vấn</span></li>
              <li><span className="text-slate-600">Bảo vệ khỏi lừa đảo việc làm</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold mb-3 text-sm">Dành Cho Nhà Tuyển Dụng</h4>
            <ul className="space-y-2">
              <li><button onClick={handlePostJobClick} className="hover:text-amber-400 cursor-pointer">Đăng tin tuyển dụng</button></li>
              <li><button onClick={() => onNavigate('login', 'employer')} className="hover:text-amber-400 cursor-pointer">Quản trị hồ sơ ATS</button></li>
              <li><span className="text-slate-600">Quy định duyệt GPKD</span></li>
              <li><span className="text-slate-600">Chính sách bảo mật doanh nghiệp</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold mb-3 text-sm">Hỗ Trợ & Liên Hệ</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-blue-400" /><span>vuthelong1009@gmail.com</span></li>
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-blue-400" /><span>Hotline: 1900 8888 (8h - 20h)</span></li>
              <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-blue-400" /><span>Đại học Văn Lang, TP.HCM</span></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-900 text-center text-slate-600">
          © 2026 PARTIME.VN - Tất cả quyền được bảo lưu. Phát triển bởi nhóm sinh viên CDTN02.
        </div>
      </footer>

      {/* 8. JOB DETAIL MODAL (FOR PUBLIC GUEST VIEWING) */}
      {activeJobDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            
            {/* Close Button */}
            <button
              onClick={() => setActiveJobDetail(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div className="flex items-center gap-4 mb-6">
              <img
                src={activeJobDetail.company_logo || "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=80&auto=format&fit=crop&q=80"}
                alt={activeJobDetail.company_name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shadow-md bg-slate-950 shrink-0"
              />
              <div>
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                  <span>{activeJobDetail.company_name}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-100">
                  {activeJobDetail.title}
                </h3>
              </div>
            </div>

            {/* Highlights Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 mb-6 text-xs">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold">
                <DollarSign className="w-4 h-4 shrink-0" />
                <span>Mức lương: {activeJobDetail.salary_min ? `${activeJobDetail.salary_min.toLocaleString()}đ` : 'Thỏa thuận'} - {activeJobDetail.salary_max ? `${activeJobDetail.salary_max.toLocaleString()}đ` : ''} / giờ</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Thời gian: {activeJobDetail.work_time || 'Ca linh hoạt'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300 sm:col-span-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Địa điểm: {activeJobDetail.location || 'TP. Hồ Chí Minh'}</span>
              </div>
            </div>

            {/* Details Content */}
            <div className="space-y-5 text-xs text-slate-300 leading-relaxed mb-8">
              <div>
                <h4 className="font-bold text-slate-100 uppercase tracking-wider mb-1.5 text-xs text-blue-400">
                  Mô Tả Công Việc
                </h4>
                <p className="whitespace-pre-line">{activeJobDetail.description}</p>
              </div>

              {activeJobDetail.requirements && (
                <div>
                  <h4 className="font-bold text-slate-100 uppercase tracking-wider mb-1.5 text-xs text-amber-400">
                    Yêu Cầu Ứng Viên
                  </h4>
                  <p className="whitespace-pre-line">{activeJobDetail.requirements}</p>
                </div>
              )}

              {activeJobDetail.benefits && (
                <div>
                  <h4 className="font-bold text-slate-100 uppercase tracking-wider mb-1.5 text-xs text-emerald-400">
                    Quyền Lợi Được Hưởng
                  </h4>
                  <p className="whitespace-pre-line">{activeJobDetail.benefits}</p>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setActiveJobDetail(null)}
                className="py-2.5 px-5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setActiveJobDetail(null);
                  handleApplyClick(activeJobDetail);
                }}
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-900/50 flex items-center gap-2 cursor-pointer"
              >
                <span>Đăng Nhập Để Ứng Tuyển Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

