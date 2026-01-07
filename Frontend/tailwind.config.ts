/**
 * TailwindCSS Configuration File
 * 
 * Created with AI assistance.
 * Prompt: 'Create a TailwindCSS configuration with F1 racing theme for a garage management system'
 */

import type { Config } from "tailwindcss";

export default {
  // Enable dark mode 
  darkMode: ["class"],
  
  // Files where Tailwind should look for class names
  content: [
    "./modules/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
 
  theme: {
    // Container config for centered layouts
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    
    // Extend Default Theme
    extend: {
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      
      // Color system using HSL with CSS custom properties
      colors: {
        // Core UI colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Primary color palette with variants
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        // UI state colors
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        // Component-specific colors
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // Status/feedback colors
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        
        // F1-themed colors
        f1: {
          red: "hsl(var(--f1-red))",           // Ferrari/F1 primary red
          gold: "hsl(var(--f1-gold))",         // 1st place gold
          silver: "hsl(var(--f1-silver))",     // 2nd place silver
          bronze: "hsl(var(--f1-bronze))",     // 3rd place bronze
        },
        
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      
      // Consistent border radius system
      borderRadius: {
        lg: "var(--radius)",                   // Large: uses CSS variable
        md: "calc(var(--radius) - 2px)",       // Medium: radius - 2px
        sm: "calc(var(--radius) - 4px)",       // Small: radius - 4px
      },
      
      // Custom animation keyframes
      keyframes: {

        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-in-left": "slide-in-left 0.4s ease-out forwards",
        shimmer: "shimmer 2s infinite linear",
      },
      
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-primary": "var(--gradient-primary)",
        "gradient-card": "var(--gradient-card)",
      },
      
      boxShadow: {
        glow: "var(--shadow-glow)",
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
      },
    },
  },
  
  // Tailwind plugins
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
