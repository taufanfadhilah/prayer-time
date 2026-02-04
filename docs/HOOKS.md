# Custom Hooks Reference

This document describes all custom React hooks in the Prayer Time application.

## useClock

**Location:** `src/hooks/useClock.js`

Provides real-time clock and date information.

### Returns
```javascript
{
  clock: string,        // "14:30:45" (HH:MM:SS)
  gregorianDate: string, // "25. Decembar 2024"
  hijriDate: string     // "25. Džumade-l-uhra 1447"
}
```

### Behavior
- Updates every 1 second
- Auto-detects user timezone
- Calculates Hijri date client-side

### Usage
```javascript
const { clock, gregorianDate, hijriDate } = useClock();
```

---

## useMosque

**Location:** `src/hooks/useMosque.js`

Manages the selected mosque from Supabase.

### Returns
```javascript
{
  selectedMosque: object | null,  // Mosque data from Supabase
  selectedMosqueId: string | null, // UUID of selected mosque
  setSelectedMosqueId: function   // Update selected mosque
}
```

### Behavior
- Reads `selectedMosqueId` from localStorage on mount
- Fetches mosque details from Supabase
- Updates when mosque ID changes

### Mosque Object Shape
```javascript
{
  id: "uuid",
  name: "Mosque Name",
  location_id: 14,
  fajr_time: "5:30",      // optional
  footer_text: "Custom",   // optional
  created_at: "2024-01-01"
}
```

### Usage
```javascript
const { selectedMosque, selectedMosqueId, setSelectedMosqueId } = useMosque();
```

---

## usePrayerTimes

**Location:** `src/hooks/usePrayerTimes.js`

Main hook for prayer times data and active prayer detection.

### Parameters
```javascript
usePrayerTimes(locationId, selectedMosque)
```

| Param | Type | Description |
|-------|------|-------------|
| `locationId` | number | Vaktija API location ID |
| `selectedMosque` | object | Selected mosque (for overrides) |

### Returns
```javascript
{
  prayerTimes: string[],      // ["5:30", "7:15", "12:30", ...]
  schedule: Date[],           // Parsed Date objects for each prayer
  activePrayerIndex: number,  // 0-5, which prayer is current
  hijriMonthApi: string,      // API-provided Hijri month
  hasCustomFajrTime: boolean  // True if Fajr is overridden
}
```

### Behavior
1. Checks localStorage cache first
2. Fetches from Vaktija API if cache expired
3. Applies Fajr time override if set
4. Calculates active prayer based on current time
5. Updates active prayer every second

### Cache Key Format
```
prayerTimes_{YYYY-MM-DD}_{locationId}
```

### Usage
```javascript
const { prayerTimes, schedule, activePrayerIndex } = usePrayerTimes(
  locationId,
  selectedMosque
);
```

---

## useNextPrayerCountdown

**Location:** `src/hooks/useNextPrayerCountdown.js`

Calculates countdown to the next prayer time.

### Parameters
```javascript
useNextPrayerCountdown(schedule, activePrayerIndex)
```

| Param | Type | Description |
|-------|------|-------------|
| `schedule` | Date[] | Array of prayer time Date objects |
| `activePrayerIndex` | number | Current active prayer (0-5) |

### Returns
```javascript
{
  countdown: string,       // "02:45:30" (HH:MM:SS until next)
  nextPrayerIndex: number  // Index of next prayer (0-5)
}
```

### Behavior
- Updates every 1 second
- After Isha, counts down to tomorrow's Fajr
- Handles edge cases around midnight

### Usage
```javascript
const { countdown, nextPrayerIndex } = useNextPrayerCountdown(
  schedule,
  activePrayerIndex
);
```

---

## usePageConfig

**Location:** `src/hooks/usePageConfig.js`

Loads page-level configuration from localStorage or mosque.

### Parameters
```javascript
usePageConfig(selectedMosque)
```

| Param | Type | Description |
|-------|------|-------------|
| `selectedMosque` | object | Selected mosque for overrides |

### Returns
```javascript
{
  config: {
    footerText: string,      // Custom footer text
    fajrTime: string,        // Custom Fajr time
    isFajrTimeCustom: boolean // Whether Fajr is customized
  }
}
```

### Priority Logic
```
Footer: Mosque footerText > localStorage footerText > empty
Fajr:   Mosque fajr_time > localStorage fajrTime > empty
```

### Usage
```javascript
const { config } = usePageConfig(selectedMosque);
```

---

## Hook Dependencies Diagram

```
                    ┌─────────────┐
                    │  useClock   │
                    │ (standalone)│
                    └─────────────┘

┌─────────────┐     ┌─────────────────┐
│  useMosque  │────▶│  usePrayerTimes │
│             │     │                 │
└─────────────┘     └────────┬────────┘
       │                     │
       │                     ▼
       │            ┌─────────────────────┐
       │            │useNextPrayerCountdown│
       │            └─────────────────────┘
       │
       ▼
┌─────────────────┐
│  usePageConfig  │
└─────────────────┘
```

## Common Patterns

### Cleanup Pattern
All hooks with intervals use cleanup:
```javascript
useEffect(() => {
  const interval = setInterval(() => { ... }, 1000);
  return () => clearInterval(interval);
}, []);
```

### Dependency Array Pattern
Hooks re-run when dependencies change:
```javascript
useEffect(() => {
  // Fetch data
}, [locationId, selectedMosque?.id]);
```

### Memoization Pattern
Computed values are memoized:
```javascript
const sortedMosques = useMemo(
  () => mosques.sort((a, b) => a.name.localeCompare(b.name)),
  [mosques]
);
```
