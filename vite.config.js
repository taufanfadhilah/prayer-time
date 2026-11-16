import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Samsung Tizen TVs and older Android TV WebViews ship old Chromium builds
    // (a 2018 Samsung runs Chromium M56). Vite's default target is chrome87, so
    // the bundle fails to *parse* on those devices and the screen stays blank.
    target: ['chrome56', 'safari12'],
  },
})
