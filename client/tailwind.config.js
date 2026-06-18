/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0A0E1A',
          surface: '#111827',
          'surface-light': '#161D2E',
          border: '#1E2535',
          'border-light': '#2A3550',
          cyan: '#00D4FF',
          'cyan-light': '#4DE8FF',
          green: '#00E87A',
          'green-light': '#4EEBA0',
          amber: '#FF9500',
          'amber-light': '#FFA620',
          red: '#FF4444',
          'red-light': '#FF6B6B',
          muted: '#6B7280',
          'muted-light': '#8B95A5',
          text: '#E8EAF0',
          'text-dark': '#B0B5BF'
        }
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px'
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px'
      },
      backgroundColor: {
        'glass': 'rgba(17, 24, 39, 0.4)'
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'bounce-slow': 'bounceSlow 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out'
      },
      keyframes: {
        slideIn: {
          'from': { transform: 'translateX(100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' }
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        slideUp: {
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-green': '0 0 20px rgba(0, 232, 122, 0.3)',
        'glow-sm': '0 0 10px rgba(0, 0, 0, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(0, 212, 255, 0.05)'
      },
      spacing: {
        safe: 'max(1rem, env(safe-area-inset-bottom))'
      }
    }
  },
  plugins: []
};
