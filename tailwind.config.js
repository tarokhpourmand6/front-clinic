export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        vazir: ['Vazir', 'sans-serif'],
      },
      colors: {
        brand: '#57BDB7',
        gold: '#d4af37',
        goldLight: '#f7e199',
        goldDark: '#b8860b', // رنگ سفارشی جدید
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};