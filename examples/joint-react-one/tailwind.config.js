/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      transitionProperty: {
        height: 'height',
      },
      colors: {
        primary: '#ed2637',
        primaryText: '#252f39',
      },
    },
  },
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: '#ed2637',
          'primary-content': '#ffffff', // Text color on primary buttons
          secondary: '#f6d860',
          accent: '#37cdbe',
          neutral: '#3d4451',
          'base-100': '#ffffff',
        },
      },
    ],
  },
  plugins: [require('daisyui')],
}
