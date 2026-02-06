import { Capacitor } from '@capacitor/core';

let _isNative = false;
try {
  _isNative = Capacitor.isNativePlatform();
} catch {
  _isNative = false;
}

console.log('[platformConfig] platform:', Capacitor.getPlatform(), 'isNative:', _isNative);

export const isNative = _isNative;

export const fontSize = {
  // Header
  headerTitle:    isNative ? '14px' : '18px',
  headerSubtitle: isNative ? '12px' : '15px',
  // PrayerTimesList
  listTitle:      isNative ? '20px' : '24px',
  prayerName:     isNative ? '24px' : '36px',
  prayerTime:     isNative ? '48px' : '72px',
  prayerLabel:    isNative ? '24px' : '36px',
};

export const spacing = {
  titleBarPy: isNative ? 'py-1.5' : 'py-2',
  prayerRowPy: isNative ? 'py-1' : 'py-2',
};
