/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      minHeight: {
        1: "1rem",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    darkTheme: "none",
    themes: [
      {
        faceblukTheme: {
          primary: "#3b82f6",
          secondary: "#F553AE",
          accent: "#F5B83B",
          neutral: "#3d4451",
          error: "#ee4540",
          "base-100": "#ffffff",
        },
      },
    ],
  },
};
