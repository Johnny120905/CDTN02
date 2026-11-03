import React from 'react';
import { AlertTriangle, Info, CheckCircle2, Trash2, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title = 'Xác Nhận Thao Tác',
  message = '',
  type = 'confirm', // 'confirm' | 'danger' | 'info' | 'success'
  confirmText = 'Xác Nhận',
  cancelText = 'Hủy Bỏ',
  onConfirm,
  onCancel,
  showCancel = true
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-rose-400" />;
      case 'info':
        return <Info className="w-6 h-6 text-sky-400" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-400" />;
    }
  };

  const getConfirmButtonClasses = () => {
    switch (type) {
      case 'danger':
        return 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-rose-950/60 border border-red-500/40';
      case 'info':
        return 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-lg shadow-sky-950/60 border border-sky-500/40';
      case 'success':
        return 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-950/60 border border-emerald-500/40';
      default:
        return 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-lg shadow-blue-950/60 border border-blue-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-blue-500/60 space-y-4 animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: '#0b1329', opacity: 1 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              type === 'danger' ? 'bg-red-500/20' : type === 'info' ? 'bg-sky-500/20' : 'bg-amber-500/20'
            }`}>
              {getIcon()}
            </div>
            <h3 className="text-base font-black text-white tracking-tight">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line pl-1">
          {message}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${getConfirmButtonClasses()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

