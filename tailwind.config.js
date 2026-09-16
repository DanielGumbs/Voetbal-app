module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#f5f5f6',
        muted: '#b0aeb6',
        accent: '#f04455',
        line: '#363039',
        surface: '#201d23',
        action: {
          DEFAULT: '#db3047',
          hover: '#ef4056',
          pressed: '#c8243b',
        },
      },
    },
  },
  plugins: [],
};
