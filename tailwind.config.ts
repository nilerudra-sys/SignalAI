import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        ink: {
          DEFAULT: '#0a0e14',
          raised: '#10151d',
          raised2: '#141a23',
          border: '#1e2733',
        },
        muted: {
          DEFAULT: '#8993a3',
          dim: '#5c6673',
        },
        signal: {
          DEFAULT: '#fbbf24',
          soft: 'rgba(251, 191, 36, 0.12)',
        },
        diff: {
          add: '#4ade80',
          addbg: 'rgba(74, 222, 128, 0.09)',
          remove: '#fb7185',
          removebg: 'rgba(251, 113, 133, 0.09)',
        },
        // "Paper" design system — from the Claude Design mockups, used only on
        // the landing page and dashboard. Kept as separate tokens (rather than
        // reusing ink/signal/diff above) so /login and /signup, which still use
        // the original dark theme, are unaffected.
        paper: {
          DEFAULT: '#f4f4f2',
          raised: '#fafaf8',
          surface: '#ffffff',
        },
        graphite: {
          DEFAULT: '#16181a',
          soft: '#3a3f43',
        },
        slate: {
          DEFAULT: '#5f6467',
          dim: '#8b8f91',
          faint: '#b6b8b9',
        },
        hairline: {
          DEFAULT: '#dedfd9',
          card: '#d9dad4',
          input: '#d6d7d1',
          soft: '#eceded',
        },
        cobalt: {
          DEFAULT: '#17427f',
          hover: '#0f2c57',
          tint: '#eaf0f8',
          'tint-border': '#cfd8e6',
          'tint-text': '#2c3e5c',
        },
        rose: {
          DEFAULT: '#9e3346',
          tint: '#f7e9ec',
          line: '#f9eef0',
          border: '#d8a3ad',
        },
        moss: {
          DEFAULT: '#146b45',
          tint: '#e6f2eb',
          line: '#eef5f1',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
