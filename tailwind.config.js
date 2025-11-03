/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'velotax-blue': '#000058',
        'velotax-accent': '#1634FF',
      },
      boxShadow: {
        card: '0 8px 24px rgba(0,0,0,0.25)'
      }
    },
  },
  plugins: [],
};

