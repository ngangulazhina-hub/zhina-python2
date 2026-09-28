import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zhina.python',
  appName: 'Zhina Python',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // Allow the WebView to reach the Pyodide package CDN on first install.
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    backgroundColor: '#111110',
    allowMixedContent: true,
  },
};

export default config;
