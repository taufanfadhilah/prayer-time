# Architecture Overview

This document explains the architecture and data flow of the Prayer Time Display application.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   Routes     │    │   Hooks      │    │   Utils              │  │
│  │              │    │              │    │                      │  │
│  │  /           │───▶│ useClock     │───▶│ timeUtils            │  │
│  │  /config     │    │ useMosque    │    │ dateUtils            │  │
│  │  /admin/*    │    │ usePrayerTimes    │ apiUtils             │  │
│  │              │    │ useCountdown │    │ storageUtils         │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│          │                   │                      │               │
│          ▼                   ▼                      ▼               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      Components                                │  │
│  │  Header │ ClockDisplay │ DateDisplay │ PrayerTimesList │ Footer│  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐       ┌───────────────────┐
        │   Vaktija.ba API  │       │     Supabase      │
        │                   │       │                   │
        │  Prayer Times     │       │  Mosque Records   │
        │  Hijri Date       │       │  CRUD Operations  │
        │  Location Data    │       │                   │
        └───────────────────┘       └───────────────────┘
```

## Data Flow

### 1. Initial Load Sequence

```
1. App mounts
   │
   ├─▶ useMosque() loads selectedMosqueId from localStorage
   │   └─▶ Fetches mosque details from Supabase
   │
   ├─▶ usePrayerTimes() checks cache
   │   ├─▶ Cache valid? Use cached data
   │   └─▶ Cache expired? Fetch from Vaktija API
   │
   ├─▶ useClock() starts 1-second interval
   │   └─▶ Updates clock, gregorianDate, hijriDate
   │
   └─▶ useNextPrayerCountdown() calculates time to next prayer
       └─▶ Updates countdown every second
```

### 2. Prayer Times Data Flow

```
                    ┌─────────────────┐
                    │  usePrayerTimes │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Check    │  │ Fetch    │  │ Apply    │
        │ Cache    │  │ API      │  │ Overrides│
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │             │             │
             │    ┌────────┘             │
             │    │                      │
             ▼    ▼                      ▼
        ┌──────────────┐         ┌──────────────┐
        │ localStorage │         │ Fajr Time    │
        │ Cache        │         │ Priority:    │
        │              │         │ 1. Mosque    │
        │ Key: date+   │         │ 2. Config    │
        │      locId   │         │ 3. API       │
        └──────────────┘         └──────────────┘
```

### 3. Priority System

#### Fajr Time Priority
```
1. Mosque Override (selectedMosque.fajr_time)
   └─▶ Set in AdminConfigPage for specific mosque

2. Config Override (pageConfig.fajrTime)
   └─▶ Set in ConfigPage for this device

3. API Default (vaktija.ba response)
   └─▶ Standard Fajr time for location
```

#### Footer Text Priority
```
1. Mosque Footer (selectedMosque.footer_text)
   └─▶ Custom text per mosque

2. Config Footer (pageConfig.footerText)
   └─▶ Custom text per device

3. Countdown Timer
   └─▶ Default: shows time until next prayer
```

#### Location ID Priority
```
1. Mosque Location (selectedMosque.location_id)
   └─▶ From Supabase mosque record

2. localStorage (locId key)
   └─▶ Legacy/fallback storage

3. Default (14 = Brčko)
   └─▶ Hardcoded fallback
```

## State Management

The app uses React hooks for state management without external libraries.

### Hook Responsibilities

| Hook | State | Updates | Dependencies |
|------|-------|---------|--------------|
| `useClock` | clock, dates | Every 1s | None |
| `useMosque` | mosque data | On mount, on ID change | localStorage |
| `usePrayerTimes` | times, schedule | On mount, at midnight | useMosque |
| `useNextPrayerCountdown` | countdown | Every 1s | usePrayerTimes |
| `usePageConfig` | config | On mount | useMosque |

### Data Persistence

| Data | Storage | Expiry |
|------|---------|--------|
| Selected Mosque ID | localStorage | Never |
| Prayer Times Cache | localStorage | Daily (midnight) |
| Page Config | localStorage | Daily (midnight) |
| Admin Session | sessionStorage | Browser close |

## API Integration

### Vaktija.ba API

```javascript
// Request
GET https://api.vaktija.ba/vaktija/v1/{locationId}

// Response
{
  "vakat": ["5:30", "7:15", "12:30", "15:45", "18:15", "20:00"],
  "lokacija": "Sarajevo",
  "datum": ["25. džumade-l-uhra 1447"]
}
```

**Retry Logic:**
- Max 3 attempts
- Exponential backoff: 1s → 2s → 4s
- Falls back to cached data on failure

### Supabase

```javascript
// Table: public.mosques
{
  id: uuid,           // Auto-generated
  name: text,         // Required
  location_id: int,   // Vaktija location ID
  fajr_time: text,    // Optional override (H:MM)
  footer_text: text,  // Optional custom text
  created_at: timestamp
}
```

## Security Model

### Admin Authentication
- Simple username/password check
- Credentials stored in code (not production-ready)
- Session stored in `sessionStorage`
- Auto-logout on browser close

### Supabase Security
- Uses anon key (public, RLS-protected)
- Row Level Security should be configured on Supabase
- Service role key NOT used in client

## Error Handling

### API Failures
```
1. Retry with exponential backoff (3 attempts)
2. Fall back to cached data if available
3. Show error message if no cache
```

### Missing Data
```
1. Use fallback values from constants
2. Show placeholder UI elements
3. Continue rendering other components
```

## Performance Optimizations

1. **Memoization:** `useMemo` for sorted mosque lists
2. **Caching:** Daily localStorage cache for API data
3. **Cleanup:** useEffect cleanup prevents memory leaks
4. **No-store:** API calls use `cache: "no-store"` for freshness
5. **Lazy Updates:** Components only re-render on relevant state changes
