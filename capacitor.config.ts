import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prayertime.display',
  appName: 'Prayer Time',
  webDir: 'dist',
  android: {
    // Use system WebView for better compatibility
    webContentsDebuggingEnabled: true, // Enable for development, disable for production
    backgroundColor: '#1a1a2e', // Dark background to match app theme
    allowMixedContent: false,
    captureInput: true,
    // Fullscreen configuration
    initialFocus: true,
  },
  server: {
    // For development with hot reload (comment out for production)
    // url: 'http://localhost:5173',
    cleartext: true, // Allow HTTP for API calls if needed
  },
  plugins: {
    // No additional plugins needed for basic TV display
  },
};

export default config;
