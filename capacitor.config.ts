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
    url: 'https://prayertime-v2.fonti.dev',
  },
  plugins: {
    // No additional plugins needed for basic TV display
  },
};

export default config;
