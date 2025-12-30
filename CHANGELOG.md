# Changelog

All notable changes to the Prayer Time Display application will be documented in this file.

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
