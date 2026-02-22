/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        light: {
          bg: '#f4f6f8',
          surface: '#ffffff',
          'surface-hover': '#eef1f4',
          border: '#e3e7ec',
          text: '#111317',
          muted: '#5b6470',
          'muted-hover': '#111317',
          'input-bg': '#ffffff',
        },
        dark: {
          bg: '#101214',
          surface: '#171a1e',
          'surface-hover': '#1e2227',
          border: '#2a2f36',
          text: '#e8ebee',
          muted: '#98a0aa',
          'muted-hover': '#e8ebee',
          'input-bg': '#1e2227',
        },
        brand: {
          primary: '#1d9bf0',
          'primary-hover': '#1a8cd8',
          'primary-active': '#1577b5',
          secondary: '#8ecdf8',
          success: '#00ba7c',
          warning: '#ffad1f',
          danger: '#f4212e',
          'danger-hover': '#dc1e28',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(29, 155, 240, 0.3)',
        'glow-lg': '0 0 40px rgba(29, 155, 240, 0.4)',
        'card': '0 0 15px rgba(0, 0, 0, 0.2)',
        'card-light': '0 1px 3px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #1d9bf0 0%, #8ecdf8 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
