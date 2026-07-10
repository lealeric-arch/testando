/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        caixa: {
          // Azul institucional Caixa
          blue: '#005CA9',
          'blue-dark': '#004A87',
          'blue-light': '#3A82C4',
          // Laranja alerta/destaque
          orange: '#F37021',
          'orange-dark': '#D95E13',
          'orange-light': '#FF8A47',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
