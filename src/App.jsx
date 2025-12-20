import { useState, useEffect, useCallback } from "react";
import {
  DEFAULT_FOOTER_TEXT,
  loadPageConfig,
  savePageConfig,
} from "./pageConfig";
import { loadMosqueById } from "./mosqueStore";

const API = "https://api.vaktija.ba/vaktija/v1";
const STORAGE_KEY = "vaktijaCache";
const LOCAL_STORAGE_DAY_KEY = "localStorageDay";
const SELECTED_MOSQUE_ID_KEY = "selectedMosqueId";

const labels = {
  en: ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"],
  bs: [
    "Sabah u džamiji",
    "Izlazak sunca",
    "Podne",
    "Ikindija",
    "Akšam",
    "Jacija",
  ],
  ar: ["الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء"],
};

const hijriMonths = [
  "muharram",
  "safar",
  "rabiʿ al-awwal",
  "rabiʿ al-thani",
  "jumada al-awwal",
  "jumada al-thani",
  "redžeb",
  "šaʿban",
  "ramadan",
  "šavval",
  "dhu al-qadah",
  "dhu al-hijjah",
];

function fmtTimeWithSeconds(date, tz) {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const h = formatted.find((p) => p.type === "hour").value;
  const m = formatted.find((p) => p.type === "minute").value;
  const s = formatted.find((p) => p.type === "second").value;
  return `${h}:${m}:${s}`;
}

function islamicToJD(y, m, d) {
  const epoch = 1948439.5;
  return (
    d +
    Math.ceil(29.5 * (m - 1)) +
    (y - 1) * 354 +
    Math.floor((3 + 11 * y) / 30) +
    epoch -
    1
  );
}

function jdToIslamic(jd) {
  const epoch = 1948439.5;
  const days = jd - epoch;
  const year = Math.floor((30 * days + 10646) / 10631);
  const month = Math.min(
    12,
    Math.ceil((days - (islamicToJD(year, 1, 1) - epoch)) / 29.5)
  );
  const day = Math.floor(jd - islamicToJD(year, month, 1)) + 1;
  return { year, month, day };
}

function gregorianToJD(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * m2 + 2) / 5) +
    365 * y2 +
    Math.floor(y2 / 4) -
    Math.floor(y2 / 100) +
    Math.floor(y2 / 400) -
    32045
  );
}

function toHijri(date) {
  const jd = gregorianToJD(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  const { year, month, day } = jdToIslamic(jd);
  return {
    day: String(day).padStart(2, "0"),
    year: String(year),
    month: hijriMonths[month - 1],
  };
}

function toGregorianDate(date, tz) {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "2-digit",
  }).formatToParts(date);

  const day = formatted.find((p) => p.type === "day").value;
  const year = formatted.find((p) => p.type === "year").value;
  const monthNum = parseInt(formatted.find((p) => p.type === "month").value);

  const monthNames = [
    "januar",
    "februar",
    "mart",
    "april",
    "maj",
    "jun",
    "jul",
    "avgust",
    "septembar",
    "oktobar",
    "novembar",
    "decembar",
  ];
  const month = monthNames[monthNum - 1];
  return {
    day: day,
    year: year,
    month: month,
  };
}

function parseHHMM(hhmm, tz, dayOffset = 0) {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();

  // Get today's date string in the target timezone (YYYY-MM-DD format)
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = dateFormatter.format(now);
  const [year, month, day] = dateStr.split("-").map(Number);

  const nowInTz = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  // Create a date representing "now" as if it were in local time with tz's display
  const nowAsTzLocal = new Date(
    parseInt(nowInTz.find((p) => p.type === "year").value),
    parseInt(nowInTz.find((p) => p.type === "month").value) - 1,
    parseInt(nowInTz.find((p) => p.type === "day").value),
    parseInt(nowInTz.find((p) => p.type === "hour").value),
    parseInt(nowInTz.find((p) => p.type === "minute").value),
    0
  );

  // The offset between actual now and the local representation of tz time
  const tzOffsetMs = now.getTime() - nowAsTzLocal.getTime();

  // Create the target date in local timezone
  const targetLocal = new Date(year, month - 1, day + dayOffset, h, m, 0);

  // Adjust by the timezone offset to get the correct UTC time
  return new Date(targetLocal.getTime() - tzOffsetMs);
}

function currentTimeTZ(tz) {
  return new Date();
}

function getTodayKey(tz) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date()); // YYYY-MM-DD in given tz
}

function readSelectedMosqueId() {
  try {
    return localStorage.getItem(SELECTED_MOSQUE_ID_KEY) || "";
  } catch {
    return "";
  }
}

function expireLocalStorageDaily(tz) {
  const todayKey = getTodayKey(tz);
  try {
    const last = localStorage.getItem(LOCAL_STORAGE_DAY_KEY);
    if (last === todayKey) return;

    const keep = new Set([LOCAL_STORAGE_DAY_KEY, SELECTED_MOSQUE_ID_KEY]);
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !keep.has(k)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(LOCAL_STORAGE_DAY_KEY, todayKey);
  } catch {
    // ignore
  }
}

function getFallbackLocationId() {
  try {
    const saved = localStorage.getItem("locId");
    return saved ? Number(saved) : 14;
  } catch {
    return 14;
  }
}

async function fetchTimesFromApi(locId) {
  const url = `${API}/${locId}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getPrayerData(locId, tz) {
  const todayKey = getTodayKey(tz);

  // Try read from cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        parsed.date === todayKey &&
        parsed.locId === locId &&
        parsed.data
      ) {
        return parsed.data;
      }
    }
  } catch {
    // Ignore cache errors and fall back to network
  }

  // Fallback: fetch from API and store
  const data = await fetchTimesFromApi(locId);
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        date: todayKey,
        locId,
        data,
      })
    );
  } catch {
    // Ignore storage errors, we still return fresh data
  }
  return data;
}

function App() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  // Expire all localStorage keys daily, except the selected masjid UUID.
  // (Runs every render, but only does work once per day.)
  expireLocalStorageDaily(tz);

  const [clock, setClock] = useState("--:--:--");
  const [gregorianDate, setGregorianDate] = useState({
    day: "--",
    year: "--",
    month: "--",
  });
  const [hijriDate, setHijriDate] = useState({
    day: "--",
    year: "--",
    month: "--",
  });
  const [prayerTimes, setPrayerTimes] = useState([
    "--:--",
    "--:--",
    "--:--",
    "--:--",
    "--:--",
    "--:--",
  ]);
  const [activePrayerIndex, setActivePrayerIndex] = useState(-1);
  const [status, setStatus] = useState("");
  const [schedule, setSchedule] = useState(null);
  const [prepared, setPrepared] = useState(null);
  const [hijriMonthApi, setHijriMonthApi] = useState("");
  const [config, setConfig] = useState(() => loadPageConfig());

  const [selectedMosqueId, setSelectedMosqueId] = useState(() =>
    readSelectedMosqueId()
  );
  const [selectedMosque, setSelectedMosque] = useState(null);

  const masjidHeaderLine = selectedMosque?.name
    ? selectedMosque.name
    : "Medžlis Islamske zajednice - Džemat";

  const effectiveFooterText =
    (selectedMosque?.footerText || "").trim().length > 0
      ? selectedMosque.footerText.trim()
      : config.footerText || DEFAULT_FOOTER_TEXT;

  const updateClockAndDates = () => {
    const now = currentTimeTZ(tz);
    setClock(fmtTimeWithSeconds(now, tz));
    const gregorian = toGregorianDate(now, tz);
    setGregorianDate(gregorian);
    const hijri = toHijri(now);
    setHijriDate(hijri);
    return now;
  };

  const loadPrayerTimes = useCallback(
    async (forcedMosque = null) => {
      const mosque = forcedMosque || selectedMosque;
      const locId = mosque?.locationId ?? getFallbackLocationId();
      try {
        const data = await getPrayerData(locId, tz);
        let nextPrepared = data.vakat;

        const overrideFajr =
          (mosque?.fajrTime || "").trim().length > 0
            ? mosque.fajrTime.trim()
            : null;
        const effectiveFajrTime = overrideFajr || config.fajrTime;

        // Initialize Fajr time in config from API if not set yet
        if (!effectiveFajrTime && nextPrepared && nextPrepared.length > 0) {
          const nextConfig = {
            ...config,
            fajrTime: nextPrepared[0],
          };
          setConfig(nextConfig);
          savePageConfig(nextConfig);
        } else if (
          effectiveFajrTime &&
          nextPrepared &&
          nextPrepared.length > 0
        ) {
          // Override Fajr time with configured value
          nextPrepared = [effectiveFajrTime, ...nextPrepared.slice(1)];
        }

        const nextSchedule = nextPrepared.map((t) => parseHHMM(t, tz));
        setPrepared(nextPrepared);
        setSchedule(nextSchedule);
        setStatus(data.lokacija ? `Location: ${data.lokacija}` : "");

        // Parse Hijri month from API date string, e.g. "25. džumade-l-uhra 1447"
        if (Array.isArray(data.datum) && data.datum[0]) {
          const hijriString = data.datum[0];
          const match = hijriString.match(/^\s*\d+\.\s+(.+)\s+\d+\s*$/);
          if (match && match[1]) {
            setHijriMonthApi(match[1]);
          } else {
            setHijriMonthApi("");
          }
        } else {
          setHijriMonthApi("");
        }

        // Update active prayer index using the freshly computed schedule
        const now = currentTimeTZ(tz);
        let idx = -1;
        if (nextSchedule && nextSchedule.length) {
          // Find the most recent prayer time that has passed
          // Check from most recent (last) to oldest (first)
          for (let i = nextSchedule.length - 1; i >= 0; i--) {
            if (now >= nextSchedule[i]) {
              idx = i;
              break;
            }
          }
          // If we're after the last prayer of the day (Isya), keep it active until next Fajr
          // (idx will already be set to the last prayer index, which is correct)
        }
        setActivePrayerIndex(idx);
      } catch (e) {
        setPrayerTimes(["--:--", "--:--", "--:--", "--:--", "--:--", "--:--"]);
        setStatus("Unable to load prayer times");
        setSchedule(null);
        setPrepared(null);
        setActivePrayerIndex(-1);
      }
    },
    [tz, config, selectedMosque]
  );

  useEffect(() => {
    // Initial load
    updateClockAndDates();
  }, []);

  useEffect(() => {
    // Reload prayer times whenever the effective data source changes
    // (selected masjid fetched from Supabase, or config reset/updated)
    loadPrayerTimes();
  }, [loadPrayerTimes]);

  useEffect(() => {
    // Update clock and dates every second
    const clockInterval = setInterval(() => {
      // Get fresh current time
      const now = updateClockAndDates();

      // Update active prayer based on current time (checks every second)
      if (schedule && schedule.length > 0) {
        let idx = -1;
        // Find the most recent prayer time that has passed
        // Check from most recent (last) to oldest (first)
        // This runs every second, so active status will update immediately when a prayer time is reached
        for (let i = schedule.length - 1; i >= 0; i--) {
          const prayerTime = schedule[i];
          if (prayerTime && now >= prayerTime) {
            idx = i;
            break;
          }
        }
        setActivePrayerIndex(idx);
      }
    }, 1000);

    return () => {
      clearInterval(clockInterval);
    };
  }, [schedule]);

  useEffect(() => {
    // Ensure data refreshes at (local) midnight and then once per day after that
    const RELOAD_FLAG_KEY = "dailyReloadDate";

    const now = new Date();
    const todayKey = getTodayKey(tz);
    
    // Check if we've already reloaded today (prevent infinite loop)
    try {
      const lastReloadDate = sessionStorage.getItem(RELOAD_FLAG_KEY);
      if (lastReloadDate === todayKey) {
        // Already reloaded today, don't set up another reload
        return;
      }
    } catch {
      // Ignore sessionStorage errors
    }

    const nextMidnight = new Date(now);
    nextMidnight.setDate(now.getDate() + 1);
    nextMidnight.setHours(0, 0, 5, 0); // a few seconds after midnight

    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    // Safety check: don't set timeout if we're already past midnight
    if (msUntilMidnight <= 0 || msUntilMidnight > 24 * 60 * 60 * 1000) {
      return;
    }

    const midnightTimeoutId = setTimeout(async () => {
      // Double-check we haven't already reloaded today (race condition protection)
      try {
        const lastReloadDate = sessionStorage.getItem(RELOAD_FLAG_KEY);
        if (lastReloadDate === todayKey) {
          return; // Already reloaded, abort
        }
        // Mark that we're about to reload today
        sessionStorage.setItem(RELOAD_FLAG_KEY, todayKey);
      } catch {
        // Ignore sessionStorage errors, proceed with reload
      }

      // Expire all localStorage keys except selected masjid uuid.
      expireLocalStorageDaily(tz);
      // Reset page config (it lives in localStorage and should expire daily)
      setConfig(loadPageConfig());
      // Refresh selected masjid data from Supabase (fajr/footer/location might change)
      if (selectedMosqueId) {
        const res = await loadMosqueById(selectedMosqueId);
        if (res?.mosque) setSelectedMosque(res.mosque);
      }
      await loadPrayerTimes();
      // Reload the page once a day at midnight (without removing localStorage)
      // This ensures a fresh start each day while preserving selectedMosqueId
      window.location.reload();
    }, msUntilMidnight);

    return () => {
      clearTimeout(midnightTimeoutId);
    };
  }, [loadPrayerTimes, selectedMosqueId, tz]);

  useEffect(() => {
    // Fetch the selected masjid record from Supabase whenever UUID changes.
    let cancelled = false;
    const run = async () => {
      if (!selectedMosqueId) {
        setSelectedMosque(null);
        return;
      }
      const res = await loadMosqueById(selectedMosqueId);
      if (cancelled) return;
      if (res?.error) {
        setSelectedMosque(null);
      } else {
        setSelectedMosque(res.mosque || null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedMosqueId]);

  // Update prayer times display when prepared changes
  useEffect(() => {
    if (prepared) {
      setPrayerTimes(prepared);
    }
  }, [prepared]);

  return (
    <div className="tv-portrait-wrapper bg-dark-background">
      <div className="w-full h-full flex">
        {/* Main Card Container */}
        <div className="prayer-card-container w-full h-full">
          {/* Header Section */}
          <header className="mb-3">
            <div className="flex items-center gap-2 mb-2 w-fit mx-auto">
              <img src="/images/logo.svg" alt="Logo" className="w-14 h-14" />
              <div className="flex flex-col">
                <div className="flex flex-col text-dark-text">
                  <p
                    className="font-bold uppercase text-prayer-green"
                    style={{ fontSize: "18px" }}
                  >
                    ISLAMSKA ZAJEDNICA U BOSNI I HERCEGOVINI
                  </p>
                </div>
                <div
                  className="font-normal text-islamic-date mt-1 text-center"
                  style={{ fontSize: "15px" }}
                >
                  {masjidHeaderLine}
                </div>
              </div>
            </div>

            {/* Current Time Display */}
            <div className="rounded-lg border border-light-border p-2 mx-auto w-[420px]">
              <div
                className="font-bold tracking-tight text-dark-text text-center tabular-nums"
                style={{ fontSize: "72px" }}
              >
                {clock}
              </div>
            </div>
          </header>

          {/* Date Section */}
          <section className="mb-3">
            <div className="flex flex-row gap-2 justify-center">
              {/* Gregorian Date Box */}
              <div className="rounded-lg border border-light-border bg-transparent px-2 py-1 text-center flex flex-col items-center justify-center flex-1 max-w-xs">
                <div className="mb-0 leading-none">
                  <span
                    className="font-bold text-prayer-green"
                    style={{ fontSize: "54px" }}
                  >
                    {gregorianDate.day}
                  </span>
                  <span
                    className="font-bold text-prayer-green"
                    style={{ fontSize: "30px" }}
                  >
                    .
                  </span>
                  <span
                    className="font-bold text-prayer-green"
                    style={{ fontSize: "30px" }}
                  >
                    {gregorianDate.year}
                  </span>
                </div>
                <div
                  className="font-bold text-prayer-green -mt-1 leading-none"
                  style={{ fontSize: "32px" }}
                >
                  {gregorianDate.month}
                </div>
              </div>

              {/* Islamic Date Box */}
              <div className="rounded-lg border border-light-border bg-transparent px-2 py-1 text-center flex flex-col items-center justify-center flex-1 max-w-xs">
                <div className="mb-0 leading-none">
                  <span
                    className="font-bold text-islamic-date"
                    style={{ fontSize: "54px" }}
                  >
                    {hijriDate.day}
                  </span>
                  <span
                    className="font-bold text-islamic-date"
                    style={{ fontSize: "30px" }}
                  >
                    .
                  </span>
                  <span
                    className="font-bold text-islamic-date"
                    style={{ fontSize: "30px" }}
                  >
                    {hijriDate.year}
                  </span>
                </div>
                <div
                  className="font-bold text-islamic-date -mt-1 leading-none"
                  style={{ fontSize: "32px" }}
                >
                  {hijriMonthApi || hijriDate.month}
                </div>
              </div>
            </div>
          </section>

          {/* Prayer Times Section */}
          <section className="mb-3 flex-1 min-h-0 flex flex-col">
            <div className="rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
              {/* Title Bar */}
              <div className="bg-prayer-green text-white px-4 py-2 rounded-lg flex-shrink-0">
                <div
                  className="font-bold text-center uppercase"
                  style={{ fontSize: "24px" }}
                >
                  VRIJEME NAMAZA | PRAYER TIMES
                </div>
              </div>

              {/* Prayer List */}
              <div className="bg-transparent flex-1 overflow-y-auto">
                <div className="flex flex-col">
                  {prayerTimes.map((time, i) => {
                    const isActive = activePrayerIndex === i;
                    return (
                      <div
                        key={i}
                        className={`prayer-row flex flex-row items-center py-2 px-3`}
                      >
                        <div className="flex-1 text-left pr-3">
                          <div
                            className={`font-medium ${
                              isActive ? "text-prayer-green" : "text-dark-text"
                            } leading-tight`}
                            style={{ fontSize: "36px" }}
                          >
                            {labels.bs[i]}
                          </div>
                        </div>
                        <div className="flex-1 text-center px-2">
                          <div
                            className={`font-semibold ${
                              isActive ? "text-prayer-green" : "text-dark-text"
                            }`}
                            style={{ fontSize: "72px" }}
                          >
                            {time}
                          </div>
                        </div>
                        <div className="flex-1 text-right pl-3">
                          <div
                            className={`font-medium ${
                              isActive ? "text-prayer-green" : "text-dark-text"
                            }`}
                            style={{ fontSize: "36px" }}
                          >
                            {labels.en[i]}
                          </div>
                          <div
                            className={`font-normal ${
                              isActive ? "text-prayer-green" : "text-dark-text"
                            } mt-0 opacity-90`}
                            style={{ fontSize: "36px" }}
                          >
                            {labels.ar[i]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
          {/* Footer Section */}
          <footer className="bg-prayer-green text-white px-4 py-2 flex-shrink-0">
            <p
              className="text-center leading-tight"
              style={{ fontSize: "18px" }}
            >
              {effectiveFooterText}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;
