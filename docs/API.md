# API & Data Reference

This document covers external APIs and data management in the Prayer Time application.

## Vaktija.ba Prayer Times API

### Endpoint
```
GET https://api.vaktija.ba/vaktija/v1/{locationId}
```

### Parameters
| Param | Type | Description |
|-------|------|-------------|
| `locationId` | integer | Location ID from Vaktija system |

### Response
```json
{
  "vakat": ["5:30", "7:15", "12:30", "15:45", "18:15", "20:00"],
  "lokacija": "Sarajevo",
  "datum": ["25. džumade-l-uhra 1447"]
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `vakat` | string[] | Array of 6 prayer times (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) |
| `lokacija` | string | Location name in Bosnian |
| `datum` | string[] | Hijri date string |

### Location IDs (Partial List)
See `src/locations.js` for full list of 100+ locations.

| ID | Location |
|----|----------|
| 14 | Brčko |
| 77 | Sarajevo |
| 91 | Tuzla |
| 108 | Zenica |

### Error Handling
```javascript
// Retry logic in apiUtils.js
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

// Exponential backoff: 1s → 2s → 4s
delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
```

### Caching Strategy
```javascript
// Cache key format
const cacheKey = `prayerTimes_${date}_${locationId}`;

// Cache includes
{
  date: "2024-12-25",
  locationId: 14,
  times: ["5:30", ...],
  hijriMonth: "Džumade-l-uhra"
}
```

---

## Supabase Database

### Connection
```javascript
// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Table: `mosques`

#### Schema
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key, auto-generated |
| `name` | text | No | Mosque display name |
| `location_id` | integer | No | Vaktija API location ID |
| `fajr_time` | text | Yes | Custom Fajr time override (H:MM) |
| `footer_text` | text | Yes | Custom footer message |
| `created_at` | timestamp | No | Auto-generated timestamp |

#### CRUD Operations
Located in `src/mosqueStore.js`

**Load All Mosques**
```javascript
async function loadMosques() {
  const { data, error } = await supabase
    .from('mosques')
    .select('*')
    .order('created_at', { ascending: false });
  return data;
}
```

**Load Single Mosque**
```javascript
async function loadMosqueById(id) {
  const { data, error } = await supabase
    .from('mosques')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}
```

**Create Mosque**
```javascript
async function createMosque(draft) {
  const { data, error } = await supabase
    .from('mosques')
    .insert([{
      name: draft.name,
      location_id: draft.locationId,
      fajr_time: draft.fajrTime || null,
      footer_text: draft.footerText || null
    }])
    .select()
    .single();
  return data;
}
```

**Update Mosque**
```javascript
async function updateMosque(id, draft) {
  const { data, error } = await supabase
    .from('mosques')
    .update({
      name: draft.name,
      location_id: draft.locationId,
      fajr_time: draft.fajrTime || null,
      footer_text: draft.footerText || null
    })
    .eq('id', id)
    .select()
    .single();
  return data;
}
```

**Delete Mosque**
```javascript
async function deleteMosque(id) {
  const { error } = await supabase
    .from('mosques')
    .delete()
    .eq('id', id);
  return !error;
}
```

---

## localStorage Schema

### Keys

| Key | Type | Expiry | Description |
|-----|------|--------|-------------|
| `selectedMosqueId` | string (uuid) | Never | Currently selected mosque |
| `prayerTimes_{date}_{locId}` | object | Daily | Cached prayer times |
| `pageConfig` | object | Daily | Footer and Fajr settings |
| `locId` | number | Never | Legacy location ID fallback |

### Prayer Times Cache
```javascript
{
  date: "2024-12-25",
  locationId: 14,
  times: ["5:30", "7:15", "12:30", "15:45", "18:15", "20:00"],
  hijriMonth: "Džumade-l-uhra",
  cachedAt: 1703500800000
}
```

### Page Config
```javascript
{
  footerText: "Custom message",
  fajrTime: "5:45",
  isFajrTimeCustom: true
}
```

---

## sessionStorage Schema

| Key | Type | Purpose |
|-----|------|---------|
| `adminAuth` | string | Admin authentication flag |
| `dailyReload_{date}` | boolean | Prevents multiple daily reloads |

---

## Data Validation

### Fajr Time Format
```javascript
// Valid: "5:30", "05:30", "5:00"
// Invalid: "530", "5.30", "25:00"
const FAJR_TIME_REGEX = /^\d{1,2}:\d{2}$/;
```

### Mosque Draft Validation
```javascript
function validateMosqueDraft(draft) {
  if (!draft.name?.trim()) return "Name is required";
  if (!draft.locationId) return "Location is required";
  if (draft.fajrTime && !FAJR_TIME_REGEX.test(draft.fajrTime)) {
    return "Invalid Fajr time format (use H:MM)";
  }
  return null; // Valid
}
```

---

## Environment Variables

```bash
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# The anon key is safe to expose (protected by RLS)
# Never use service_role key in client code
```

---

## API Response Examples

### Successful Prayer Times Fetch
```javascript
// Input
await fetchTimesFromApi(77); // Sarajevo

// Output
{
  success: true,
  data: {
    times: ["5:30", "7:15", "12:30", "15:45", "18:15", "20:00"],
    location: "Sarajevo",
    hijriMonth: "Džumade-l-uhra"
  }
}
```

### Failed Fetch (After Retries)
```javascript
// Output
{
  success: false,
  error: "Failed to fetch prayer times after 3 attempts",
  cachedData: { ... } // Falls back to cache if available
}
```

### Mosque List Response
```javascript
// Output from loadMosques()
[
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Gazi Husrev-begova džamija",
    location_id: 77,
    fajr_time: null,
    footer_text: null,
    created_at: "2024-12-01T10:00:00Z"
  },
  // ... more mosques
]
```
