/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
          light: 'var(--color-primary-light)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          dark: 'var(--color-secondary-dark)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          dark: 'var(--color-success-dark)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          dark: 'var(--color-warning-dark)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          dark: 'var(--color-danger-dark)',
        },
      },
      fontFamily: {
        sans: 'var(--font-sans)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
  ],
}
