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
  const [viewMode, setViewMode] = useState('file');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileLoadError, setFileLoadError] = useState('');
  const [isImagePreview, setIsImagePreview] = useState(false);

  React.useEffect(() => {
    setViewMode('file');
  }, [data.fileUrl, isOpen, type]);

  React.useEffect(() => {
    if (!isOpen) {
      setPreviewUrl('');
      setFileLoadError('');
      setIsLoadingFile(false);
      setIsImagePreview(false);
      return;
    }

    const rawUrl = String(data.fileUrl || '').trim();
    if (!rawUrl) {
      setPreviewUrl('');
      setFileLoadError('');
      setIsLoadingFile(false);
      setIsImagePreview(false);
      return;
    }

    let revokedUrl = '';
    const controller = new AbortController();

    const loadPreview = async () => {
      setFileLoadError('');
      if (rawUrl.startsWith('data:')) {
        try {
          const commaIdx = rawUrl.indexOf(',');
          if (commaIdx === -1) throw new Error('Dữ liệu tệp không hợp lệ.');
          const header = rawUrl.slice(5, commaIdx);
          const mimeRaw = header.split(';')[0].trim().toLowerCase();
          const b64 = rawUrl.slice(commaIdx + 1);
          const binaryStr = atob(b64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const isImg = type === 'image' || mimeRaw.startsWith('image/');
          const blobType = isImg ? (mimeRaw || 'image/png') : 'application/pdf';
          const blob = new Blob([bytes], { type: blobType });
          revokedUrl = URL.createObjectURL(blob);
          setIsImagePreview(isImg);
          setPreviewUrl(revokedUrl);
        } catch (err) {
          setFileLoadError('Không thể giải mã tệp PDF để xem trước.');
        }
        return;
      }

      if (rawUrl.startsWith('/api/files/')) {
        setIsLoadingFile(true);
        try {
          const res = await fetch(rawUrl, { signal: controller.signal });
          if (!res.ok) {
            let errMsg = 'Không tìm thấy tệp tài liệu trên máy chủ.';
            try {
              const errJson = await res.json();
              if (errJson?.message) errMsg = errJson.message;
            } catch (_) {}
            setFileLoadError(errMsg);
            setPreviewUrl('');
            return;
          }
          const ct = (res.headers.get('content-type') || '').toLowerCase();
          const rawBlob = await res.blob();
          const isImg = type === 'image' || ct.startsWith('image/');
          const normalizedBlob = isImg
            ? rawBlob
            : new Blob([rawBlob], { type: 'application/pdf' });
          revokedUrl = URL.createObjectURL(normalizedBlob);
          setIsImagePreview(isImg);
          setPreviewUrl(revokedUrl);
        } catch (err) {
          if (err.name !== 'AbortError') {
            setFileLoadError('Lỗi kết nối khi tải tệp PDF từ máy chủ.');
          }
        } finally {
          setIsLoadingFile(false);
        }
        return;
      }

      const isImgUrl = type === 'image' || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(rawUrl);
      setIsImagePreview(isImgUrl);
      setPreviewUrl(rawUrl);
    };

    loadPreview();

    return () => {
      controller.abort();
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
    };
  }, [data.fileUrl, isOpen, type]);

  if (!isOpen) return null;

  const fileName = data.fileName || (type === 'cv' ? 'CV_UngVien.pdf' : 'GPKD_DoanhNghiep.pdf');
  const title = data.title || (type === 'cv' ? 'Hồ Sơ Năng Lực & CV Ứng Viên' : 'Giấy Phép Kinh Doanh & Đăng Ký Doanh Nghiệp');

  // Trigger browser download of real document
  const handleDownloadFile = () => {
    const rawUrl = String(data.fileUrl || '').trim();
    if (!rawUrl) {
      return;
    }

    const downloadHref = rawUrl.startsWith('/api/files/')
      ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}download=1`
      : (rawUrl.startsWith('data:') && previewUrl ? previewUrl : rawUrl);

    const a = document.createElement('a');
    a.href = downloadHref;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (onDownloadSuccess) {
      onDownloadSuccess(`Đã tải xuống tệp "${fileName}" thành công vào thư mục máy tính!`);
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
            {/* Download File */}
            <button
              type="button"
              onClick={handleDownloadFile}
              disabled={!data.fileUrl}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all ${
                data.fileUrl
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
              title={data.fileUrl ? 'Tải tệp PDF về máy tính' : 'Chưa có tệp PDF để tải'}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Tải về</span>
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
          {viewMode === 'file' && (
            <div className="w-full h-full min-h-[540px] flex items-center justify-center">
              {isLoadingFile ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 max-w-md shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="text-slate-900 font-bold text-sm">Đang tải tài liệu: {fileName}</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Đang đọc dữ liệu PDF từ hệ thống lưu trữ...
                  </p>
                </div>
              ) : fileLoadError ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-rose-200 max-w-md shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="text-slate-900 font-bold text-sm">Không thể mở tệp: {fileName}</h4>
                  <p className="text-xs text-rose-600 mt-2 leading-relaxed">{fileLoadError}</p>
                </div>
              ) : previewUrl ? (
                isImagePreview ? (
                  <img
                    src={previewUrl}
                    alt={fileName}
                    className="max-w-full max-h-[72vh] rounded-2xl border border-slate-200 shadow-md object-contain bg-white"
                  />
                ) : (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full min-h-[560px] rounded-2xl border border-slate-200 shadow-inner bg-white"
                    title={fileName}
                  />
                )
              ) : (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 max-w-md shadow-lg">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="text-slate-900 font-bold text-sm">
                    {type === 'gpkd' ? 'Chưa có tệp PDF Giấy phép kinh doanh' : `Chưa có tệp: ${fileName}`}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {type === 'gpkd'
                      ? 'Doanh nghiệp chưa tải lên tệp PDF Giấy phép kinh doanh hợp lệ lên hệ thống.'
                      : 'Tài liệu chưa được tải lên hệ thống.'}
                  </p>
                </div>
              )}
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
