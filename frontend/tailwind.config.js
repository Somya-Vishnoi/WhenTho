/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#09090b",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#09090b"
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#09090b"
        },
        primary: {
          DEFAULT: "#18181b",
          foreground: "#ffffff"
        },
        secondary: {
          DEFAULT: "#f4f4f5",
          foreground: "#18181b"
        },
        muted: {
          DEFAULT: "#f4f4f5",
          foreground: "#71717a"
        },
        accent: {
          DEFAULT: "#f4f4f5",
          foreground: "#18181b"
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff"
        },
        border: "#e4e4e7",
        input: "#e4e4e7",
        ring: "#18181b",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      }
    },
  },
  plugins: [],
}
