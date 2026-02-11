// Detect Android TV via user-agent since the app loads from a remote URL
// and Capacitor.isNativePlatform() returns false in that scenario.
const ua = navigator.userAgent || '';
const _isAndroidTV = /Android/.test(ua) && /TV|AFT|BRAVIA|SHIELD/.test(ua);
const _isAndroid = /Android/.test(ua);

console.log('[platformConfig] userAgent:', ua, 'isAndroid:', _isAndroid, 'isAndroidTV:', _isAndroidTV);

export const isNative = _isAndroid;

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
