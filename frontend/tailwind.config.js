/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        et: {
          orange: '#FF6B35',
          'orange-dark': '#E5521A',
          'orange-light': '#FF8C5A',
          navy: '#0A0E27',
          'navy-light': '#131730',
          'navy-card': '#1A1F3C',
          gold: '#FFD700',
          'gold-light': '#FFE55C',
          teal: '#00D4AA',
          'teal-dark': '#00B891',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'typing': 'typing 1.5s steps(3, end) infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        typing: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'et-gradient': 'linear-gradient(135deg, #FF6B35 0%, #E5521A 100%)',
        'navy-gradient': 'linear-gradient(180deg, #0A0E27 0%, #131730 100%)',
      },
    },
  },
  plugins: [],
}
