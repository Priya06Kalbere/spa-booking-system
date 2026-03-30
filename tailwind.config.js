/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'brush-script': ['"Brush Script"', 'cursive'], // Add the custom font name and fallback
        // You can add more custom fonts here
      },},
  },
  plugins: [],
};