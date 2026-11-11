/** Design tokens follow docs/design/DESIGN.md (ChurnLens Analytical Core). */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        card: token('card'),
        subtle: token('subtle'),
        line: token('line'),
        'line-strong': token('line-strong'),
        ink: token('ink'),
        body: token('body'),
        muted: token('muted'),
        faint: token('faint'),
        brand: {
          DEFAULT: '#4F46E5',
          strong: '#4338CA',
          soft: token('brand-soft'),
          text: token('brand-text'),
        },
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        caps: ['11px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        'body-sm': ['12px', { lineHeight: '18px' }],
        'body-md': ['13px', { lineHeight: '20px' }],
        'head-sm': ['15px', { lineHeight: '22px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'head-md': ['18px', { lineHeight: '26px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'head-lg': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '600' }],
        metric: ['28px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '600' }],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        lift: '0 4px 6px -1px rgba(15, 23, 42, 0.05)',
        pop: '0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.03)',
      },
    },
  },
  plugins: [],
}
