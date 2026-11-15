import React, { useState, useEffect } from 'react';

/**
 * Hiển thị ảnh đại diện / logo doanh nghiệp thực tế, tự động quay về chữ cái đầu hoặc icon khi chưa có ảnh hoặc ảnh lỗi.
 */
export default function MediaAvatar({
  src,
  alt = 'Avatar',
  fallbackText = '',
  fallbackIcon = null,
  className = 'w-12 h-12 rounded-2xl',
  fallbackClassName = 'bg-gradient-to-br from-blue-600 to-sky-500 text-white font-black text-lg',
  imgClassName = 'w-full h-full object-cover',
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const cleanSrc = typeof src === 'string' ? src.trim() : '';
  const showImage = Boolean(cleanSrc) && !hasError;

  return (
    <div
      className={`${className} overflow-hidden shrink-0 flex items-center justify-center ${
        showImage ? 'bg-white border border-slate-200' : fallbackClassName
      }`}
    >
      {showImage ? (
        <img
          src={cleanSrc}
          alt={alt}
          className={imgClassName}
          onError={() => setHasError(true)}
        />
      ) : (
        fallbackIcon || fallbackText
      )}
    </div>
  );
}
