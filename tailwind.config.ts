
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        gensys: {
          primary: {
            from: "#56CCF2",      // Bleu clair du logo
            via: "#5B86E5",       // Bleu moyen
            to: "#8B5CF6",        // Violet du logo
          },
          surface: {
            light: "#f8fafc",
            DEFAULT: "#f1f5f9",
            dark: "#e2e8f0",
          },
          glassmorphism: {
            light: "rgba(255, 255, 255, 0.7)",
            dark: "rgba(15, 23, 42, 0.6)",
          }
        },
        neumorph: {
          primary: "var(--gensys-primary-from, #56CCF2)",
          accent: "var(--gensys-primary-to, #8B5CF6)",
          secondary: "var(--gensys-primary-via, #5B86E5)",
        },
        primary: {
          DEFAULT: "#5B86E5",
          hover: "#4F46E5",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F3F4F6",
          foreground: "#111827",
        },
        title: "#111827",
        subtitle: "#6B7280",
        card: "#FFFFFF",
        muted: {
          DEFAULT: "#F3F4F6",
          foreground: "#6B7280",
        },
        accent: {
          DEFAULT: "#5B86E5",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-gensys': 'linear-gradient(to right, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'neumorph': '5px 5px 10px rgba(0, 0, 0, 0.1), -5px -5px 10px rgba(255, 255, 255, 0.7)',
        'neumorph-hover': '8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.7)',
        'neumorph-active': 'inset 5px 5px 10px rgba(0, 0, 0, 0.1), inset -5px -5px 10px rgba(255, 255, 255, 0.7)',
        'neumorph-inset': 'inset 2px 2px 5px rgba(0, 0, 0, 0.1), inset -2px -2px 5px rgba(255, 255, 255, 0.7)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
