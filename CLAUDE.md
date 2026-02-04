# CLAUDE.md - Prayer Time Display Application

## Project Overview

A multi-mosque prayer times display system built for TV/screen displays in mosques. Shows real-time prayer times, clock, Gregorian/Hijri dates, and countdown to next prayer.

## Tech Stack

- **Frontend:** React 18.3.1 + Vite 5.4.2
- **Styling:** Tailwind CSS 3.4.10
- **Routing:** React Router DOM 6.28.0
- **Database:** Supabase (PostgreSQL)
- **Prayer Times API:** Vaktija.ba (Bosnia/Sandžak locations)
- **Deployment:** Cloudflare Pages (via Wrangler)
- **Native Wrapper:** Capacitor 8.x (for Android TV APK)

## Quick Commands

```bash
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview production build
npm run deploy        # Build and deploy to Cloudflare Pages

# Android TV Commands
npm run android:sync  # Build and sync to Android project
npm run android:open  # Open in Android Studio
npm run android:run   # Run on connected device/emulator
```

## Project Structure

```
src/
├── App.jsx                    # Main display component
├── main.jsx                   # Entry point with routing
├── components/
│   ├── Header.jsx             # Logo, mosque name, clock
│   ├── ClockDisplay.jsx       # Real-time HH:MM:SS clock
│   ├── DateDisplay.jsx        # Gregorian + Hijri dates
│   ├── PrayerTimesList.jsx    # 6 prayer times grid
│   └── Footer.jsx             # Countdown or custom text
├── hooks/
│   ├── useClock.js            # Real-time clock state
│   ├── useMosque.js           # Selected mosque from Supabase
│   ├── usePrayerTimes.js      # Prayer times with API/cache
│   ├── useNextPrayerCountdown.js  # Countdown timer
│   └── usePageConfig.js       # Page config (footer, fajr)
├── utils/
│   ├── apiUtils.js            # Vaktija API with retry logic
│   ├── constants.js           # API endpoints, labels
│   ├── dateUtils.js           # Gregorian/Hijri conversion
│   ├── timeUtils.js           # Time parsing/formatting
│   └── storageUtils.js        # localStorage helpers
├── AdminAuthGate.jsx          # Admin login gate
├── AdminConfigPage.jsx        # Admin CRUD for mosques
├── ConfigPage.jsx             # User mosque selection
├── adminAuth.js               # Admin auth (session-based)
├── mosqueStore.js             # Supabase CRUD operations
├── pageConfig.js              # localStorage page config
├── locations.js               # 100+ Bosnia/Sandžak locations
└── supabaseClient.js          # Supabase client init
```

## Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | App | Main prayer times display |
| `/config` | ConfigPage | User selects active mosque |
| `/admin/config` | AdminConfigPage | Admin CRUD (protected) |

## Key Architecture Decisions

### Data Flow Priority
- **Fajr Time:** Mosque override > Config fajrTime > API default
- **Footer:** Mosque footerText > Config footerText > Countdown timer
- **Location ID:** Mosque locationId > localStorage "locId" > fallback 14 (Brčko)

### Caching Strategy
- Prayer times cached daily in localStorage
- Cache key includes date + location ID
- Falls back to stale cache if API fails after 3 retries
- Exponential backoff: 1s → 2s → 4s

### Daily Refresh
- Auto-clears cache at midnight
- Reloads page for fresh data
- Uses `sessionStorage` to track daily reload

## External APIs

### Vaktija.ba Prayer Times
- **Endpoint:** `https://api.vaktija.ba/vaktija/v1/{locationId}`
- **Response:** `{ vakat: ["5:30", ...], lokacija: "City", datum: ["Hijri date"] }`
- **File:** `src/utils/apiUtils.js`

### Supabase
- **Table:** `public.mosques`
- **Columns:** id, name, location_id, fajr_time, footer_text, created_at
- **File:** `src/mosqueStore.js`

## Admin Access

- **URL:** `/admin/config`
- **Credentials:** Username: `admin`, Password: `bismillah`
- **Storage:** Session-based (clears on browser close)
- **File:** `src/adminAuth.js`

## Environment Variables

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Common Tasks

### Add a new location
Edit `src/locations.js` - add to the locations array with ID from Vaktija API

### Modify prayer time labels
Edit `src/utils/constants.js` - update `PRAYER_LABELS` array

### Change styling/colors
Edit `tailwind.config.js` - custom colors defined in `extend.colors`

### Add new mosque field
1. Update Supabase table schema
2. Update `src/mosqueStore.js` CRUD functions
3. Update `src/AdminConfigPage.jsx` form
4. Update relevant hooks if needed

## Known Patterns

### Active Prayer Detection
Located in `usePrayerTimes.js` - finds most recent prayer that has passed, keeps Isha active until next Fajr.

### Timezone Handling
Auto-detects user timezone. Prayer times parsed using custom `parseHHMM()` in `timeUtils.js`.

### Hijri Date
Client-side calculation in `dateUtils.js` + API-provided month from Vaktija when available.

## Deployment

### Web (Cloudflare Pages)
- **Production URL:** https://prayer-time-3ps.pages.dev
- **Account:** Januar@fonti.dev

```bash
npm run deploy  # Builds and deploys to Cloudflare
```

### Android TV APK

See [docs/ANDROID_TV_BUILD.md](docs/ANDROID_TV_BUILD.md) for complete build instructions.

**Quick build:**
```bash
npm run android:sync  # Build web assets and sync to Android
npm run android:open  # Open in Android Studio to build APK
```

**Key files:**
- `capacitor.config.ts` - Capacitor configuration
- `android/app/src/main/AndroidManifest.xml` - TV support flags
- `android/app/src/main/java/.../MainActivity.java` - Fullscreen mode
- `android/app/src/main/res/drawable/tv_banner.xml` - TV launcher banner
