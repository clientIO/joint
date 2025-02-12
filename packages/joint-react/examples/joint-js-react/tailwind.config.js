/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#ed2637',
        primaryText: '#252f39',
      },
    },
  },
  // plugins: [require('daisyui')],
}
