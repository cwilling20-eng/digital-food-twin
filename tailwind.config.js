/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nm: {
          signature: '#FF6B6B',
          'signature-light': '#FF8E8E',
          accent: '#FFA62B',
          bg: '#FFFAF5',
          surface: '#FFF0E5',
          'surface-low': '#FFF5ED',
          'surface-high': '#FFE8D6',
          'surface-highest': '#FFDFC7',
          'surface-lowest': '#FFFFFF',
          text: '#1A1A2E',
          success: '#4ECDC4',
          'ghost-border': '#D4C4B0',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'nm': '2rem',
        'nm-lg': '3rem',
      },
      boxShadow: {
        'nm-float': '0px 10px 40px rgba(255, 107, 107, 0.08)',
        'nm-accent': '0px 10px 40px rgba(255, 166, 43, 0.08)',
        'nm-nav': '0px 20px 50px rgba(255, 107, 107, 0.15)',
      },
      spacing: {
        'nm-1': '0.25rem',
        'nm-2': '0.5rem',
        'nm-3': '1rem',
        'nm-4': '1.5rem',
        'nm-6': '2rem',
        'nm-8': '2.75rem',
        'nm-10': '3.5rem',
        'nm-16': '5.5rem',
      },
      fontSize: {
        'nm-display-lg': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'nm-display-md': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'nm-headline-lg': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'nm-headline-md': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'nm-title-lg': ['1.375rem', { lineHeight: '1.3', fontWeight: '600' }],
        'nm-title-md': ['1rem', { lineHeight: '1.4', fontWeight: '600' }],
        'nm-body-lg': ['1rem', { lineHeight: '1.5', fontWeight: '500' }],
        'nm-body-md': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'nm-label-lg': ['0.875rem', { lineHeight: '1.3', fontWeight: '700' }],
        'nm-label-md': ['0.75rem', { lineHeight: '1.3', fontWeight: '700', letterSpacing: '0.05em' }],
      },
    },
  },
  plugins: [],
};
