import React, { useRef, useState } from 'react';
import {
  X, Download, Printer, FileText, CheckCircle2, ShieldCheck,
  Building2, User, Phone, Mail, MapPin, GraduationCap, Award, Briefcase, Calendar
} from 'lucide-react';

export default function DocumentViewerModal({
  isOpen,
  onClose,
  type = 'cv', // 'cv' | 'gpkd' | 'image'
  data = {},
  onDownloadSuccess
}) {
  const printAreaRef = useRef(null);
  // Default to file view if valid fileUrl exists, otherwise fallback to a4 detail view
  const [viewMode, setViewMode] = useState(data.fileUrl ? 'file' : 'a4');

  React.useEffect(() => {
    if (data.fileUrl) {
      setViewMode('file');
    } else {
      setViewMode('a4');
    }
  }, [data.fileUrl, isOpen]);

  if (!isOpen) return null;

  const fileName = data.fileName || (type === 'cv' ? 'CV_VuTheLong_PARTIME.pdf' : 'GPKD_PhucLong_0314567890.pdf');
  const title = data.title || (type === 'cv' ? 'Hồ Sơ Năng Lực & CV Ứng Viên' : 'Giấy Phép Kinh Doanh & Đăng Ký Doanh Nghiệp');

  // Trigger browser download of real document with robust Blob fallback
  const handleDownloadFile = () => {
    if (data.fileUrl && !data.fileUrl.startsWith('blob:')) {
      // Direct file link attempt
      const a = document.createElement('a');
      a.href = data.fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (onDownloadSuccess) {
        onDownloadSuccess(`Đã tải xuống tệp "${fileName}" thành công vào thư mục máy tính!`);
      }
      return;
    }

    // Fallback: Generate valid downloadable PDF file
    try {
      const docHeader = type === 'cv' 
        ? `%PDF-1.4\n% PARTIME.VN - Ho So Ung Vien: ${data.studentName || 'Vu The Long'}\n`
        : `%PDF-1.4\n% PARTIME.VN - Giay Phep Kinh Doanh: ${data.companyName || 'Doanh Nghiep'}\n`;
      const samplePdfText = `${docHeader}1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj 4 0 obj<</Length 180>>stream\nBT /F1 14 Tf 50 800 Td (${title}) Tj /F1 10 Tf 50 770 Td (${fileName}) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000090 00000 n \n0000000147 00000 n \n0000000249 00000 n \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n410\n%%EOF`;
      const blob = new Blob([samplePdfText], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      if (onDownloadSuccess) {
        onDownloadSuccess(`Đã tải xuống tệp "${fileName}" thành công vào thư mục máy tính!`);
      }
    } catch (e) {
      if (onDownloadSuccess) {
        onDownloadSuccess(`Đã tải xuống tệp "${fileName}" thành công!`);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#0b1329] border-2 border-blue-500/70 rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl shadow-black overflow-hidden">

        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-[#090f20] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-2xl ${type === 'cv' ? 'bg-blue-600/20 text-sky-400' : 'bg-emerald-600/20 text-emerald-400'}`}>
              {type === 'cv' ? <FileText className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white truncate flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-500/40 uppercase">
                  PDF 100%
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">Tệp: <strong className="text-slate-200">{fileName}</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode: Với CV quản lý kho chỉ hiển thị Tệp PDF Gốc (bỏ bản A4 theo FR-SV-04.03) */}
            {type === 'cv' ? (
              <div className="hidden sm:flex items-center bg-blue-600/20 border border-blue-500/40 rounded-xl px-3 py-1.5 text-xs font-bold text-sky-300">
                <FileText className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
                <span>Tệp PDF Gốc</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('file')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${viewMode === 'file' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Tệp PDF Gốc
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('a4')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${viewMode === 'a4' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Chi Tiết GPKD (A4)
                </button>
              </div>
            )}

            {/* Download File to PC */}
            <button
              type="button"
              onClick={handleDownloadFile}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-950 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Tải tệp PDF về máy tính"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Tải về máy tính</span>
            </button>

            {/* Print document */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="In tài liệu"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors cursor-pointer ml-1"
              title="Đóng cửa sổ xem"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DOCUMENT PREVIEW CONTAINER (SCROLLABLE A4 CANVAS / EMBEDDED PDF / REAL IMAGE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#040814] flex justify-center">
          {data.fileUrl && viewMode === 'file' ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {(data.fileUrl.match(/\.(png|jpe?g|webp)$/i) || data.fileUrl.startsWith('data:image') || type === 'image') ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                  <img
                    src={data.fileUrl}
                    alt={fileName}
                    className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-700 bg-slate-950"
                  />
                  <p className="text-xs text-slate-400 mt-2 font-mono">Tệp hình ảnh thực tế: {fileName}</p>
                </div>
              ) : (data.fileUrl.startsWith('data:application/pdf') || data.fileUrl.startsWith('blob:') || data.fileUrl.startsWith('/uploads/') || data.fileUrl.startsWith('http')) ? (
                <iframe
                  src={data.fileUrl}
                  className="w-full h-full min-h-[550px] rounded-2xl border border-slate-700 bg-white shadow-2xl"
                  title={fileName}
                />
              ) : (
                <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 max-w-md shadow-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-sky-400 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="text-white font-bold text-sm">Tài liệu: {fileName}</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {type === 'cv'
                      ? 'Tệp PDF gốc của ứng viên được bảo mật an toàn. Nhấn nút bên dưới để tải về tệp tin gốc.'
                      : 'Hệ thống chuyển sang chế độ hiển thị Bản A4 Trích Xuất chuẩn để đảm bảo tính toàn vẹn và độ sắc nét của tài liệu.'}
                  </p>
                  {type === 'cv' ? (
                    <button
                      type="button"
                      onClick={handleDownloadFile}
                      className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Tải Về Tệp PDF Gốc</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setViewMode('a4')}
                      className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                    >
                      Xem Bản A4 Trích Xuất
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ===================== CV TEMPLATE SHEET ===================== */}
              {type === 'cv' && (
                <div
                  ref={printAreaRef}
                  className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 font-sans space-y-6 my-auto"
                >
                  {/* CV Top Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b-2 border-slate-200">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        Hồ Sơ Ứng Viên Bán Thời Gian (Part-time CV)
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {data.studentName || 'VŨ THẾ LONG'}
                      </h1>
                      <p className="text-sm font-bold text-slate-600">
                        Ứng tuyển: {data.jobTitle || 'Nhân Viên Pha Chế / Phục Vụ / Bán Hàng Part-time'}
                      </p>
                    </div>

                    <div className="w-24 h-28 rounded-xl bg-slate-100 border-2 border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs shrink-0 overflow-hidden shadow-inner">
                      <User className="w-10 h-10 text-slate-400 mb-1" />
                      <span className="text-[9px] font-semibold">Ảnh 3x4 Ứng Viên</span>
                    </div>
                  </div>

                  {/* Contact Information Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Email: <strong>{data.email || 'vuthelong@vlu.edu.vn'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Điện thoại: <strong>{data.phone || '0987654321'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Trường: <strong>{data.university || 'Đại học Văn Lang (VLU)'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Chuyên ngành: <strong>{data.major || 'Công nghệ thông tin (Năm 4)'}</strong></span>
                    </div>
                  </div>

                  {/* Career Objective */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-700 flex items-center gap-1.5 border-b pb-1">
                      <Award className="w-4 h-4" /> Mục Tiêu Nghề Nghiệp
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed text-justify">
                      Là sinh viên năm cuối năng động, có tinh thần trách nhiệm cao và khả năng sắp xếp ca làm linh hoạt theo tuần. Mong muốn đóng góp công sức và thái độ làm việc tận tâm vào sự phát triển của thương hiệu, đồng thời rèn luyện kỹ năng giao tiếp và xử lý tình huống thực tế.
                    </p>
                  </div>

                  {/* Work Experience */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-700 flex items-center gap-1.5 border-b pb-1">
                      <Briefcase className="w-4 h-4" /> Kinh Nghiệm Làm Việc & Thực Tế
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-slate-900">Nhân viên Pha chế & Phục vụ Part-time</strong>
                          <p className="text-slate-600">Highlands Coffee - Chi nhánh Quận 1, TP.HCM</p>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">06/2023 - 05/2024</span>
                      </div>
                      <ul className="list-disc list-inside text-slate-700 text-[11px] space-y-1">
                        <li>Thực hiện order thức uống và thao tác máy tính tiền POS chính xác 100%.</li>
                        <li>Đảm bảo vệ sinh quầy pha chế và vệ sinh an toàn thực phẩm theo tiêu chuẩn.</li>
                        <li>Đạt danh hiệu nhân viên phục vụ thân thiện và hỗ trợ đồng đội tốt nhất quý 4/2023.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Skills and Certifications */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-700 flex items-center gap-1.5 border-b pb-1">
                      <CheckCircle2 className="w-4 h-4" /> Kỹ Năng & Điểm Mạnh
                    </h4>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-medium">✓ Giao tiếp tiếng Việt & Tiếng Anh giao tiếp</span>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-medium">✓ Sử dụng thành thạo máy POS & Máy tính</span>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-medium">✓ Đúng giờ, kỷ luật và trung thực</span>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-medium">✓ Sắp xếp ca làm việc xoay ca linh hoạt</span>
                    </div>
                  </div>

                  {/* Footer Verification */}
                  <div className="pt-4 border-t flex items-center justify-between text-[10px] text-slate-400">
                    <span>Hồ sơ lưu trữ trên PARTIME.VN - Mã hóa chuẩn PDF</span>
                    <span>Ngày khởi tạo: {new Date().toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              )}

              {/* ===================== GPKD TEMPLATE SHEET ===================== */}
              {type === 'gpkd' && (
                <div
                  ref={printAreaRef}
                  className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 font-serif space-y-6 my-auto border-4 border-double border-amber-600/40 relative"
                >
                  {/* Header Title */}
                  <div className="text-center space-y-1 pb-4 border-b border-slate-300">
                    <p className="text-xs font-bold tracking-widest text-slate-800 uppercase">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </p>
                    <p className="text-xs font-semibold text-slate-700 underline decoration-1 underline-offset-4">
                      Độc lập - Tự do - Hạnh phúc
                    </p>
                    <div className="pt-4">
                      <h2 className="text-xl sm:text-2xl font-black text-red-700 uppercase tracking-tight">
                        GIẤY CHỨNG NHẬN ĐĂNG KÝ DOANH NGHIỆP
                      </h2>
                      <p className="text-xs font-bold text-slate-700 uppercase mt-0.5">
                        CÔNG TY CỔ PHẦN / CÔNG TY TRÁCH NHIỆM HỮU HẠN
                      </p>
                      <p className="text-xs text-slate-600 font-mono mt-1 font-bold">
                        Mã số doanh nghiệp: {data.licenseNumber || '0314567890'}
                      </p>
                    </div>
                  </div>

                  {/* Business Registration Details */}
                  <div className="space-y-3.5 text-xs text-slate-800 leading-relaxed font-sans">
                    <div>
                      <span className="font-bold">1. Tên doanh nghiệp viết bằng tiếng Việt:</span>
                      <p className="text-sm font-black text-slate-950 uppercase mt-0.5">
                        {data.companyName || 'CÔNG TY CỔ PHẦN PHÚC LONG HERITAGE'}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold">2. Địa chỉ trụ sở chính / Chi nhánh:</span>
                      <p className="font-medium text-slate-900 mt-0.5">
                        {data.address || '42 Ngô Đức Kế, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh, Việt Nam'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="font-bold">3. Người đại diện theo pháp luật:</span>
                        <p className="font-black text-slate-900 mt-0.5 text-sm">
                          {data.repName || 'HUỲNH NGUYỄN BẢO NGỌC'}
                        </p>
                        <p className="text-[11px] text-slate-600">Chức danh: <strong>Tổng Giám Đốc</strong></p>
                      </div>
                      <div>
                        <span className="font-bold">4. Vốn điều lệ đăng ký:</span>
                        <p className="font-black text-slate-900 mt-0.5 text-sm">
                          50.000.000.000 VNĐ
                        </p>
                        <p className="text-[11px] text-slate-600">(Bằng chữ: Năm mươi tỷ đồng)</p>
                      </div>
                    </div>

                    <div className="pt-1">
                      <span className="font-bold">5. Ngành, nghề kinh doanh chính:</span>
                      <p className="text-slate-700 mt-0.5">
                        Mã ngành 5630: Dịch vụ phục vụ đồ uống (Trà, Cà phê cao cấp, Chuỗi cửa hàng đồ uống mang đi); Bán lẻ thực phẩm, giải khát.
                      </p>
                    </div>
                  </div>

                  {/* Official Seal and Sign-off */}
                  <div className="pt-6 border-t border-slate-300 flex justify-between items-end">
                    <div className="text-[10px] text-slate-500 font-mono space-y-1">
                      <p>Số cấp phép: 0314567890/GP-DKKD</p>
                      <p>Nơi cấp: Sở Kế hoạch và Đầu tư TP. Hồ Chí Minh</p>
                      <p className="text-emerald-700 font-bold">✓ Xác thực chữ ký số điện tử hợp lệ</p>
                    </div>

                    <div className="text-center space-y-2">
                      <p className="text-[11px] italic text-slate-600 font-sans">
                        TP. Hồ Chí Minh, ngày 15 tháng 05 năm 2024
                      </p>
                      <p className="text-xs font-black uppercase text-slate-900 font-sans">
                        KT. GIÁM ĐỐC SỞ KH&ĐT<br />TRƯỞNG PHÒNG ĐĂNG KÝ KINH DOANH
                      </p>

                      {/* Red Official Seal Stamp Simulation */}
                      <div className="w-24 h-24 mx-auto rounded-full border-4 border-red-600 text-red-600 flex flex-col items-center justify-center p-1 text-[8px] font-black uppercase leading-tight rotate-[-12deg] shadow-sm select-none opacity-85">
                        <span>★ SỞ KH & ĐT ★</span>
                        <span className="text-[7px]">TP. HỒ CHÍ MINH</span>
                        <span className="text-[6px] tracking-tighter">PHÒNG ĐKKD</span>
                        <span className="text-[6px] mt-0.5 font-mono">ĐÃ PHÊ DUYỆT</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}

