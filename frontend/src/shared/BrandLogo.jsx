import React from 'react';
import MeshyLogo3D from '../canvas3d/MeshyLogo3D';

/**
 * BrandLogo component rendering the authentic PARTIME.VN 3D Logo (GLB)
 * with the required text: "PARTIME.VN" and "Việc Làm Linh Hoạt".
 * Styled for the Dark 4D Electric Blue Theme.
 */
export default function BrandLogo({ 
  size = 'md', 
  showText = true, 
  use3D = true,
  className = '', 
  textClassName = ''
}) {
  const pixelSizes = {
    sm: 36,
    md: 46,
    lg: 64,
    xl: 96,
    hero: 128
  };

  const titleSizes = {
    sm: 'text-base font-extrabold',
    md: 'text-lg sm:text-xl font-black',
    lg: 'text-2xl sm:text-3xl font-black',
    xl: 'text-3xl sm:text-4xl font-black',
    hero: 'text-4xl sm:text-5xl font-black'
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px] sm:text-xs',
    lg: 'text-xs sm:text-sm',
    xl: 'text-sm sm:text-base',
    hero: 'text-base sm:text-lg'
  };

  const currentPixelSize = pixelSizes[size] || pixelSizes.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 3D GLB Logo with Fallback - Không chặn sự kiện nhấp chuột của thẻ cha */}
      <div 
        className="relative shrink-0 rounded-2xl overflow-hidden bg-slate-950/80 border border-blue-500/30 shadow-lg shadow-blue-950/50 flex items-center justify-center p-0.5 pointer-events-none"
        style={{ width: currentPixelSize, height: currentPixelSize }}
      >
        {use3D ? (
          <MeshyLogo3D size={currentPixelSize - 4} interactive={false} autoRotate={true} />
        ) : (
          <img 
            src="/logo.jpg" 
            alt="PARTIME.VN Logo - Việc Làm Linh Hoạt" 
            className="w-full h-full object-contain p-0.5 rounded-2xl"
          />
        )}
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className={`flex flex-col justify-center ${textClassName}`}>
          <div className="flex items-center gap-1 leading-none">
            <span className={`tracking-tight font-black font-sans text-white ${titleSizes[size] || titleSizes.md}`}>
              PARTIME<span className="text-sky-400">.VN</span>
            </span>
          </div>
          <span className={`font-semibold tracking-wide text-sky-400/90 mt-1 ${subtitleSizes[size] || subtitleSizes.md}`}>
            Việc Làm Linh Hoạt
          </span>
        </div>
      )}
    </div>
  );
}
