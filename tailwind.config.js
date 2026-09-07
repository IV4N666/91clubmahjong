/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        '11': '2.75rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '17': '4.25rem',
      },
      colors: {
        mahjong: {
          green: {
            deep: '#0e3a24',
            felt: '#175635',
            light: '#227b4c',
            border: '#2a915b'
          },
          tile: {
            base: '#fbfbf7',
            edge: '#eae6d6',
            shadow: '#c4baa3',
            back: '#105e38'
          },
          gold: {
            light: '#fde047',
            DEFAULT: '#eab308',
            dark: '#ca8a04'
          },
          red: '#dc2626',
          blue: '#2563eb'
        }
      },
      boxShadow: {
        'tile': '0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -3px 0 rgba(0,0,0,0.15)',
        'tile-active': '0 8px 12px -2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -4px 0 rgba(0,0,0,0.2)',
        'felt': 'inset 0 0 100px rgba(0,0,0,0.4)'
      }
    },
  },
  plugins: [],
}
