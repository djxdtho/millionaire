/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        million: {
          50: '#f0e6d0',
          100: '#d4a853',
          200: '#b8922e',
          900: '#0a0a12',
          800: '#12121e',
          700: '#1a1a2e',
          600: '#2a1f14',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'gold-pulse': 'goldPulse 1.5s ease-in-out infinite',
        'scale-in': 'scaleIn 0.4s ease-out',
        'dramatic-in': 'dramaticIn 0.6s ease-out',
        'confetti-fall': 'confettiFall 3s ease-in forwards',
        'glow-strong': 'glowStrong 1s ease-in-out infinite',
        'slide-up-gold': 'slideUpGold 0.5s ease-out',
        'bounce-gold': 'bounceGold 0.6s ease-out',
        'fade-scale-in': 'fadeScaleIn 0.4s ease-out',
        'timer-pulse': 'timerPulse 0.5s ease-in-out infinite',
        'letter-glow': 'letterGlow 0.6s ease-out forwards',
        'lock-in-flash': 'lockInFlash 0.5s ease-in-out infinite alternate',
        'page-enter': 'pageEnter 0.4s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212,168,83,0.3)' },
          '50%': { boxShadow: '0 0 50px rgba(212,168,83,0.7)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        goldPulse: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.3)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        dramaticIn: {
          '0%': { transform: 'scale(0.5) rotate(-5deg)', opacity: '0', filter: 'blur(10px)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1', filter: 'blur(0)' },
        },
        confettiFall: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        glowStrong: {
          '0%, 100%': { textShadow: '0 0 20px rgba(212,168,83,0.5), 0 0 40px rgba(212,168,83,0.2)' },
          '50%': { textShadow: '0 0 40px rgba(212,168,83,0.8), 0 0 80px rgba(212,168,83,0.4)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUpGold: {
          '0%': { transform: 'translateY(30px)', opacity: '0', filter: 'blur(4px)' },
          '100%': { transform: 'translateY(0)', opacity: '1', filter: 'blur(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceGold: {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.15)' },
          '50%': { transform: 'scale(0.95)' },
          '70%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeScaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        timerPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        letterGlow: {
          '0%': { opacity: '0', transform: 'translateY(-5px) scale(0.8)', filter: 'blur(2px)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
        lockInFlash: {
          '0%': { opacity: '0.3', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1.02)' },
        },
        pageEnter: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
