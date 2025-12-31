# Changelog

All notable changes to the Prayer Time Display application will be documented in this file.

## [2.0.2] - 2025-12-31

### Added
- **Page Load Notifications**: Telegram notification sent when a client loads the app (once per session to avoid spam)
- **Version Upgrade Notifications**: Telegram notification sent when a client upgrades from an old version to a new version, showing both old and new version numbers

### Technical Details
- New Cloudflare Function: `functions/api/notify-load.js`
- Uses `navigator.sendBeacon()` for reliable notification delivery even during page reload
- Session-based throttling prevents duplicate notifications on same session

---

## [2.0.1] - 2025-12-31

### Fixed
- **Thundering Herd Problem**: Added random jitter (5-120 seconds) to midnight refresh timing to prevent all clients from hitting the API at exactly the same time, which was causing 503 errors
- **Telegram Success Notifications**: Now sends notification when midnight refresh succeeds, including all prayer times for the day

### Added
- **Auto Version Update**: App automatically detects new versions and reloads to get latest code
- **Daily Maintenance Reload**: App reloads at 3:00 AM local time to ensure code updates are picked up (important for Android TV installations)
- **Detailed Console Logging**: Added comprehensive logging for debugging midnight refresh flow

### Technical Details
- Random jitter spreads API requests over 2 minutes instead of all at once
- Version check on app load with automatic reload if outdated
- Scheduled maintenance reload at 3 AM using setTimeout

---

## [2.0.0] - 2025-12-30

### Added
- **CORS Proxy**: Server-side proxy via Cloudflare Functions to eliminate CORS errors from Vaktija API
- **Telegram Error Notifications**: Automatic alerts sent to Telegram when API fails, including:
  - Location ID
  - Error message
  - Timestamp
  - Source URL
- **Umami Analytics**: Usage monitoring to track display activity
- **Stale Cache Fallback**: When API is unavailable, previous day's prayer times are used as fallback

### Changed
- **Midnight Refresh**: Removed page reload at midnight - prayer times now update seamlessly without any flash or empty state
- **API Fetching**: Now uses local CORS proxy first, with direct API as fallback
- **Error Handling**: Improved error handling that preserves displayed data when API fails

### Fixed
- **Empty Prayer Times at Midnight**: Fixed issue where prayer times would show "--:--" during midnight data refresh
- **CORS Errors**: Eliminated intermittent CORS errors by routing requests through Cloudflare Function proxy

### Technical Details
- New Cloudflare Function: `functions/api/prayer-times/[locationId].js`
- Recursive setTimeout pattern for midnight refresh (no page reload)
- useRef pattern to prevent React infinite loops
- Exponential backoff retry logic (1s → 2s → 4s)

---

## [1.0.0] - Initial Release

### Features
- Real-time prayer times display for Bosnia/Sandzak locations
- Clock with hours, minutes, seconds
- Gregorian and Hijri date display
- Countdown to next prayer
- Active prayer highlighting
- Multi-mosque support via Supabase
- Custom Fajr time override per mosque
- Custom footer text per mosque
- Admin panel for mosque management
- Responsive design for TV/screen displays
