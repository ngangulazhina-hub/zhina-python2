import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zhina.python',
  appName: 'Zhina Python',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#111110',
  },
};

export default config;
