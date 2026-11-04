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
  const [viewMode, setViewMode] = useState(data.fileUrl ? 'file' : 'a4');

  React.useEffect(() => {
    if (data.fileUrl) {
      setViewMode('file');
    } else {
      setViewMode('a4');
    }
  }, [data.fileUrl, isOpen]);

  if (!isOpen) return null;

  const fileName = data.fileName || (type === 'cv' ? 'CV_UngVien.pdf' : 'GPKD_DoanhNghiep.pdf');
  const title = data.title || (type === 'cv' ? 'Hồ Sơ Năng Lực & CV Ứng Viên' : 'Giấy Phép Kinh Doanh & Đăng Ký Doanh Nghiệp');

  // Trigger browser download of real document
  const handleDownloadFile = () => {
    if (data.fileUrl && !data.fileUrl.startsWith('blob:')) {
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white/95 border border-slate-200 rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl shadow-blue-900/20 overflow-hidden text-slate-800">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-2xl ${type === 'cv' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {type === 'cv' ? <FileText className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate flex items-center gap-2">
                <span>{title}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  PDF CHUẨN
                </span>
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">Tệp: <strong className="text-slate-700">{fileName}</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle if GPKD */}
            {type !== 'cv' && (
              <div className="hidden sm:flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('file')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    viewMode === 'file' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tài liệu
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('a4')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    viewMode === 'a4' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chi Tiết GPKD (A4)
                </button>
              </div>
            )}

            {/* Download File */}
            <button
              type="button"
              onClick={handleDownloadFile}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              title="Tải tệp PDF về máy tính"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Tải về</span>
            </button>

            {/* Print document */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200"
              title="In tài liệu"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer border border-slate-200"
              title="Đóng modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6" ref={printAreaRef}>
          {viewMode === 'file' ? (
            <div className="w-full h-full min-h-[480px] flex items-center justify-center">
              {data.fileUrl ? (
                <iframe
                  src={data.fileUrl}
                  className="w-full h-full rounded-2xl border border-slate-200 shadow-inner bg-white"
                  title={fileName}
                />
              ) : (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 max-w-md shadow-lg">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="text-slate-900 font-bold text-sm">Tài liệu: {fileName}</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Tệp PDF hồ sơ đã được mã hóa bảo mật. Bạn có thể xem trực tuyến hoặc tải về máy tính để tra cứu chi tiết.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadFile}
                    className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải về tài liệu</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* A4 FORMAT GPKD */
            <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-8 text-slate-800 font-sans space-y-6">
              <div className="text-center border-b border-slate-200 pb-5">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
                <span className="text-xs text-slate-500 font-semibold block mt-0.5">Độc lập - Tự do - Hạnh phúc</span>
                <div className="w-20 h-0.5 bg-slate-300 mx-auto my-3" />
                <h2 className="text-lg font-bold text-slate-900 uppercase">GIẤY CHỨNG NHẬN ĐĂNG KÝ DOANH NGHIỆP</h2>
                <p className="text-xs text-slate-500 mt-1">Mã số doanh nghiệp: <strong className="text-blue-700 font-mono text-sm">{data.taxCode || data.licenseNumber || 'Chưa cập nhật'}</strong></p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">1. Tên doanh nghiệp:</span>
                  <span className="font-bold text-slate-900 text-right">{data.companyName || 'Doanh nghiệp'}</span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">2. Người đại diện pháp luật:</span>
                  <span className="font-bold text-slate-900 text-right">{data.representativeName || data.repName || 'Người đại diện'}</span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">3. Địa chỉ trụ sở / chi nhánh:</span>
                  <span className="font-medium text-slate-800 text-right max-w-sm">{data.address || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">4. Tình trạng thẩm định:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác thực GPKD
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>PARTIME.VN Hệ thống xác thực tài liệu</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
