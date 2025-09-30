import type { Config } from "tailwindcss"
export default {
  content: [
    "./app/**/*.{ts,tsx}", 
    "./components/**/*.{ts,tsx}",
    "./app-property-pulse/**/*.{js,ts,jsx,tsx}",
    "./components-property-pulse/**/*.{js,ts,jsx,tsx}"
  ],
  theme: { 
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      gridTemplateColumns: {
        '70/30': '70% 28%',
      },
    }
  },
  plugins: []
} satisfies Config
