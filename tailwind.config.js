/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk dark theme
        cyber: {
          bg: {
            primary: '#0a0a0f',
            secondary: '#12121a',
            tertiary: '#1a1a25',
            card: '#15151f',
          },
          border: {
            default: '#2a2a3a',
            hover: '#3a3a4a',
            active: '#4a4a5a',
          },
          accent: {
            blue: '#00d4ff',
            purple: '#a855f7',
            pink: '#ec4899',
            green: '#00ff88',
            orange: '#ff6b35',
            yellow: '#ffd700',
          },
          text: {
            primary: '#ffffff',
            secondary: '#a0a0b0',
            muted: '#606070',
          },
          glow: {
            blue: '0 0 20px rgba(0, 212, 255, 0.5)',
            purple: '0 0 20px rgba(168, 85, 247, 0.5)',
            green: '0 0 20px rgba(0, 255, 136, 0.5)',
            pink: '0 0 20px rgba(236, 72, 153, 0.5)',
          }
        }
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
        'cyber-gradient-accent': 'linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)',
        'cyber-gradient-card': 'linear-gradient(180deg, rgba(26, 26, 37, 0.8) 0%, rgba(21, 21, 31, 0.9) 100%)',
        'grid-pattern': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232a2a3a' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      },
      boxShadow: {
        'cyber-glow': '0 0 20px rgba(0, 212, 255, 0.3)',
        'cyber-glow-lg': '0 0 40px rgba(0, 212, 255, 0.4)',
        'cyber-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'node-pulse': 'node-pulse 1.5s ease-in-out infinite',
        'edge-flow': 'edge-flow 2s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 212, 255, 0.6)' },
        },
        'node-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
          '50%': { transform: 'scale(1.02)', opacity: 0.9 },
        },
        'edge-flow': {
          '0%': { strokeDashoffset: 24 },
          '100%': { strokeDashoffset: 0 },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-10px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
