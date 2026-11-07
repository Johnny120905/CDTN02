/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px (Chấm dứt hoàn toàn chữ nhỏ 11-12px)
        'sm': ['0.9375rem', { lineHeight: '1.375rem' }], // 15px (Chuẩn văn bản dễ đọc, không đau mắt)
        'base': ['1rem', { lineHeight: '1.5rem' }],       // 16px (Văn bản chuẩn toàn hệ thống)
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],    // 18px
        'xl': ['1.25rem', { lineHeight: '1.875rem' }],    // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px
        '5xl': ['3rem', { lineHeight: '1.15' }],          // 48px
      },
      colors: {
        col1: { top: '#FAF8FF', mid: '#F0F7FF', bottom: '#E2E7FF' },
        col2: { top: '#EFF6FF', mid: '#E2E7FF', bottom: '#DBE1FF' },
        col3: { main: '#0F172A', navy: '#1E3A8A', electric: '#2563EB' },
        col4: { primary: '#1E293B', secondary: '#334155', muted: '#475569' },
        col5: { cyan: '#38BDF8', electric: '#2563EB', navy: '#1D4ED8' },
        col6: { hoverStart: '#2563EB', hoverMid: '#1D4ED8', hoverEnd: '#003EA8' },
        col7: { pure: '#FFFFFF', pearl: '#FAF8FF', soft: '#F8FAFC' },
        col8: { lightCyan: '#7BD0FF', sky: '#38BDF8', electric: '#2563EB' },
        surface: {
          DEFAULT: '#faf8ff',
          dim: '#d2d9f4',
          bright: '#faf8ff',
          lowest: '#ffffff',
          low: '#f2f3ff',
          container: '#eaedff',
          high: '#e2e7ff',
          highest: '#dae2fd',
          variant: '#dae2fd',
        },
        'on-surface': {
          DEFAULT: '#131b2e',
          variant: '#434655',
        },
        ink: {
          headings: '#0F172A',
          body: '#334155',
          muted: '#64748B',
        },
        brand: {
          primary: '#004ac6',
          'primary-container': '#2563eb',
          'deep-navy': '#1d4ed8',
          secondary: '#00668a',
          'sky-cyan': '#38bdf8',
          tertiary: '#0d46d1',
          'ice-blue': '#eff6ff',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#ef4444',
          error: '#ba1a1a',
        }
      },
      backgroundImage: {
        'col1-canvas': 'linear-gradient(135deg, #FAF8FF 0%, #F0F7FF 50%, #E2E7FF 100%)',
        'col2-card': 'linear-gradient(180deg, #EFF6FF 0%, #E2E7FF 55%, #DBE1FF 100%)',
        'col3-hero': 'linear-gradient(90deg, #0F172A 0%, #1E3A8A 60%, #2563EB 100%)',
        'col5-btn-3d': 'linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #1D4ED8 100%)',
        'col6-btn-hover': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 60%, #003EA8 100%)',
        'col7-surface': 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        'col8-rim-4d': 'linear-gradient(135deg, #7BD0FF 0%, #38BDF8 50%, #2563EB 100%)',
      },
      boxShadow: {
        'col6-glow': '0 8px 24px -2px rgba(56, 189, 248, 0.45)',
        'col2-glass': '0 20px 40px -15px rgba(37, 99, 235, 0.08), 0 0 1px 1px rgba(255, 255, 255, 0.8) inset',
        'glass-card': '0 4px 20px -2px rgba(29, 78, 216, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'glass-hover': '0 16px 36px -6px rgba(37, 99, 235, 0.16), 0 0 0 1px rgba(56, 189, 248, 0.2)',
        'elevated-layer': '0 12px 32px -4px rgba(37, 99, 235, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
        'cta-glow': '0 0 16px rgba(56, 189, 248, 0.4)',
      },
      borderRadius: {
        'card': '1rem',
        'modal': '1.5rem',
      }
    },
  },
  plugins: [],
}
