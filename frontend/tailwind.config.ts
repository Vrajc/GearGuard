import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'caveat': ['var(--font-caveat)', 'Caveat', 'cursive'],
        'inter': ['var(--font-inter)', 'Inter', 'sans-serif'],
        'sans': ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      colors: {
        // Odoo-style color palette
        odoo: {
          // Primary colors
          primary: '#875A7B',
          'primary-hover': '#6F4E6A',
          
          // Backgrounds
          'bg-app': '#F9F9F9',
          'bg-page': '#FFFFFF',
          'bg-sidebar': '#F3F3F3',
          
          // Text colors
          'text-primary': '#212121',
          'text-secondary': '#6B6B6B',
          'text-muted': '#9E9E9E',
          
          // Borders
          border: '#E0E0E0',
          
          // Status colors
          success: '#4CAF50',
          warning: '#FF9800',
          danger: '#F44336',
          info: '#2196F3',
        },
      },
      boxShadow: {
        'odoo': '0 1px 3px rgba(0,0,0,0.1)',
        'odoo-lg': '0 4px 6px rgba(0,0,0,0.15)',
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
export default config
