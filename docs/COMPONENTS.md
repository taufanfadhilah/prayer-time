# Components Reference

This document describes all React components in the Prayer Time application.

## Page Components

### App.jsx
**Location:** `src/App.jsx`

The main display page showing prayer times, clock, and dates.

**Responsibilities:**
- Orchestrates all display hooks
- Renders the main prayer time display layout
- Handles daily page refresh at midnight

**Hooks Used:**
- `useClock()` - Real-time clock and dates
- `useMosque()` - Selected mosque data
- `usePrayerTimes()` - Prayer schedule and active prayer
- `useNextPrayerCountdown()` - Countdown timer
- `usePageConfig()` - Footer and Fajr overrides

**Layout:**
```
┌─────────────────────────────────────┐
│            Header                    │
│  (Logo, Mosque Name, Organization)  │
├─────────────────────────────────────┤
│          ClockDisplay               │
│           HH:MM:SS                  │
├─────────────────────────────────────┤
│          DateDisplay                │
│   [Gregorian]    [Hijri]           │
├─────────────────────────────────────┤
│        PrayerTimesList              │
│  Fajr | Sunrise | Dhuhr | ...      │
├─────────────────────────────────────┤
│            Footer                   │
│    (Countdown or Custom Text)       │
└─────────────────────────────────────┘
```

---

### ConfigPage.jsx
**Location:** `src/ConfigPage.jsx`

User-facing configuration page for selecting active mosque.

**Features:**
- Displays list of all mosques from Supabase
- Search/filter mosques by name
- Select and activate a mosque
- Saves selection to localStorage

**State:**
- `mosques` - List of all mosques
- `selectedId` - Currently selected mosque ID

---

### AdminConfigPage.jsx
**Location:** `src/AdminConfigPage.jsx`

Admin panel for CRUD operations on mosques.

**Features:**
- Create new mosque with name, location, fajr time, footer
- Edit existing mosque details
- Delete mosque (with confirmation)
- Activate mosque for current device
- Logout admin session

**Protected By:** `AdminAuthGate`

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | text | Yes | Mosque display name |
| Location | select | Yes | Vaktija location ID |
| Fajr Time | text | No | Override format: H:MM |
| Footer Text | textarea | No | Custom footer message |

---

### AdminAuthGate.jsx
**Location:** `src/AdminAuthGate.jsx`

Authentication wrapper for admin routes.

**Behavior:**
- If authenticated → renders children
- If not authenticated → shows login form

**Login Form:**
- Username input
- Password input
- Error message display

---

## Display Components

### Header.jsx
**Location:** `src/components/Header.jsx`

Top section with branding and mosque name.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `masjidHeaderLine` | string | Mosque name to display |
| `clock` | string | Current time (displayed in some layouts) |

**Content:**
- Logo image
- Mosque/Masjid name
- Organization name ("ISLAMSKA ZAJEDNICA BOŠNJAKA")

---

### ClockDisplay.jsx
**Location:** `src/components/ClockDisplay.jsx`

Large real-time clock display.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `clock` | string | Time in HH:MM:SS format |

**Styling:**
- Large font (72px)
- Centered
- Green accent color

---

### DateDisplay.jsx
**Location:** `src/components/DateDisplay.jsx`

Dual date display boxes.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `gregorianDate` | string | Formatted Gregorian date |
| `hijriDate` | string | Formatted Hijri date |
| `hijriMonthApi` | string | API-provided Hijri month (optional) |

**Layout:**
```
┌──────────────────┐  ┌──────────────────┐
│   Gregorian      │  │     Hijri        │
│   25. Decembar   │  │  25. Džumade-l-  │
│      2024        │  │     uhra 1447    │
└──────────────────┘  └──────────────────┘
```

---

### PrayerTimesList.jsx
**Location:** `src/components/PrayerTimesList.jsx`

Grid display of all 6 prayer times.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `prayerTimes` | array | Array of time strings |
| `activePrayerIndex` | number | Index of current prayer (0-5) |
| `hasCustomFajrTime` | boolean | Show indicator if Fajr is custom |

**Prayer Order:**
1. Fajr (Zora)
2. Sunrise (Izlazak)
3. Dhuhr (Podne)
4. Asr (Ikindija)
5. Maghrib (Akšam)
6. Isha (Jacija)

**Styling:**
- Active prayer highlighted in green
- Each prayer shows: Label (EN/BS/AR) + Time

---

### Footer.jsx
**Location:** `src/components/Footer.jsx`

Bottom section with countdown or custom text.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `footerText` | string | Custom text (if set) |
| `countdown` | string | Time until next prayer |

**Behavior:**
- If `footerText` exists → display custom text
- Otherwise → display countdown timer

---

## Component Hierarchy

```
main.jsx (Router)
├── App
│   ├── Header
│   ├── ClockDisplay
│   ├── DateDisplay
│   ├── PrayerTimesList
│   └── Footer
│
├── ConfigPage
│   └── (inline mosque list)
│
└── AdminAuthGate
    └── AdminConfigPage
        └── (inline forms and lists)
```

## Styling Approach

All components use Tailwind CSS classes with custom colors defined in `tailwind.config.js`:

| Color Name | Hex | Usage |
|------------|-----|-------|
| `prayer-green` | #008449 | Primary accent, active states |
| `dark-background` | #2C333B | Page background |
| `card-background` | #F8F8F8 | Card backgrounds |
| `dark-text` | #333333 | Body text |
| `islamic-date` | #A59574 | Hijri date accent |

## Responsive Design

Components are optimized for:
- TV/Large screens (primary use case)
- Tablet displays
- Mobile (basic support)

Key responsive patterns:
- Flexbox layouts with wrapping
- Font sizes scale with viewport
- Overflow handling for long text
