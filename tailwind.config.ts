import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        // Shadcn Preset b2D2hq2C0 Semantic Tokens
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)'
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)'
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)'
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)'
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)'
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)'
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)'
        },
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)'
        },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)'
        },

        // Ecclesia & Humanitas Palette
        parchment: {
          50: '#FDFCF9',
          100: '#FAF8F5', // Base light canvas
          200: '#F2EEE6', // Surface muted
          300: '#E6E0D4', // Hairline borders
          400: '#D5CCBD',
          500: '#B8AB96',
          600: '#8E8270',
          800: '#52483B',
          900: '#2A241C'
        },
        claret: {
          50: '#FBF3F4',
          100: '#F7E6E8',
          200: '#EFD0D4',
          300: '#DF9FA8',
          400: '#C25D6E',
          500: '#9E2A40',
          600: '#892336',
          700: '#7E2032', // Primary Liturgical Crimson
          800: '#641927',
          900: '#48111B',
          950: '#2E0910'
        },
        brass: {
          50: '#FAF7EF',
          100: '#F5EEDB', // Highlight pill background
          200: '#EADBB6',
          300: '#E4CF9A', // Soft gold
          400: '#D4AF37', // Radiant Sanctuary Gold
          500: '#C59B27',
          600: '#B8860B', // Cathedral Brass
          700: '#956906',
          800: '#735207',
          900: '#463203'
        },
        monastic: {
          700: '#343844',
          800: '#1F222A', // Dark surface
          900: '#14161C', // Dark canvas
          950: '#0C0D10'
        },

        // Indonesian Political Parties Palette
        parpol: {
          pdip: '#B91C1C',
          golkar: '#D97706',
          gerindra: '#0284C7',
          pkb: '#15803D',
          pks: '#EA580C',
          nasdem: '#1E3A8A',
          demokrat: '#2563EB',
          pan: '#0284C7',
          ppp: '#047857',
          psi: '#E11D48',
          perindo: '#7C3AED',
          swing: '#64748B'
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        display: ['Cinzel', 'Newsreader', 'serif'],
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace']
      },
      boxShadow: {
        'parchment': '0 2px 14px -3px rgba(40, 30, 20, 0.05)',
        'parchment-lg': '0 10px 25px -5px rgba(40, 30, 20, 0.07), 0 8px 10px -6px rgba(40, 30, 20, 0.04)',
        'sacramental': '0 4px 20px -2px rgba(126, 32, 50, 0.18)',
        'brass': '0 4px 16px -2px rgba(184, 134, 11, 0.22)'
      }
    }
  },
  plugins: []
} satisfies Config
