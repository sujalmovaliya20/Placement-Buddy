import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS configuration.
 *
 * ⚠️  DESIGN.md CONTRACT: Override the default theme values below with
 * tokens from /frontend/DESIGN.md. Do NOT use default shadcn colors.
 *
 * When DESIGN.md is populated, update the `colors`, `fontFamily`,
 * `fontSize`, `spacing`, and `borderRadius` extensions here.
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      /**
       * Colors — override with DESIGN.md tokens.
       * Uses CSS custom properties so shadcn/ui components pick them up.
       */
      colors: {
        border: '#000000',
        input: '#000000',
        ring: '#000000',
        background: '#ffffff',
        foreground: '#000000',
        primary: {
          DEFAULT: '#e91d2a',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#ffffff',
          foreground: '#000000',
        },
        canvas: '#ffffff',
        surface: '#ffffff',
        ink: '#000000',
        'frame-ink': '#000000',
        'yellow-sticker': '#fcc20f',
        'purple-stripe': '#6a26a4',
        link: '#0000ee',
        'tint-olive': '#8e8a25',
        'tint-sage': '#b3bd95',
        'tint-salmon': '#d77a7a',
        'tint-peach': '#e6915d',
        'tint-lime': '#c0d4a7',
        'tint-sky': '#9ab6c8',
        'tint-steel': '#a5b8c0',
        'tint-periwinkle': '#8c9ae0',
      },
      fontFamily: {
        'arial-black': ['Arial Black', 'sans-serif'],
        helvetica: ['Helvetica', 'Arial', 'sans-serif'],
        'times-new-roman': ['Times New Roman', 'Times', 'serif'],
      },
      fontSize: {
        'heading-2': '16px',
        'heading-3': '14px',
        body: '14px',
        'body-sm': '12px',
        caption: '11px',
        button: '12px',
        link: '14px',
        'ui-label': '12px',
      },
      borderRadius: {
        none: '0px',
        full: '9999px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
