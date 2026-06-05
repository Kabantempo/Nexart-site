import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Nexart brand colors — Minimaliste Violet + Blanc
        nexart: {
          // Fonds
          bg: {
            primary: '#FFFFFF',
            secondary: '#F5F5F7',
            border: '#E5E7EB',
          },
          // Accent Principal Violet Indigo
          violet: {
            DEFAULT: '#6366F1',
            light: '#818CF8',
            dark: '#5B5BD6',
          },
          // Texte
          text: {
            primary: '#1A1A1A',
            secondary: '#888888',
            muted: '#AAAAAA',
          },
          // Feedback
          error: '#E05A5A',
          success: '#4CAF50',
          warning: '#FF9800',
          info: '#2196F3',
        },
      },
      backgroundColor: {
        'nexart-primary': '#FFFFFF',
        'nexart-secondary': '#F5F5F7',
        'nexart-violet': '#6366F1',
      },
      textColor: {
        'nexart-primary': '#1A1A1A',
        'nexart-secondary': '#888888',
        'nexart-violet': '#6366F1',
      },
      borderColor: {
        'nexart-border': '#E5E7EB',
        'nexart-violet': '#6366F1',
      },
    },
  },
  plugins: [],
}
export default config
