import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { maskBannedWordsClient } from './searchAndFilterHelper';

/**
 * Cảnh báo nhắc nhở trực tiếp trên Form khi người dùng nhập từ khóa nhạy cảm/bị cấm trước khi gửi.
 */
export default function BannedKeywordWarning({ text = '', keywords = [], contextLabel = 'nội dung' }) {
  const { isFlagged, matchedWords } = maskBannedWordsClient(text, keywords);
  if (!isFlagged || matchedWords.length === 0) return null;

  return (
    <div
      role="alert"
      className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in"
    >
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="space-y-0.5 leading-relaxed">
        <p className="font-bold text-amber-950">
          Cảnh báo: Phát hiện từ khóa bị cấm/nhạy cảm trong {contextLabel}!
        </p>
        <p className="text-[11px] text-amber-800">
          Từ khóa phát hiện:{' '}
          <span className="font-mono font-bold text-rose-700">{matchedWords.join(', ')}</span>.{' '}
          Vui lòng điều chỉnh lại ngôn từ trước khi gửi.
        </p>
      </div>
    </div>
  );
}
