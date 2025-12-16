import { useState, useEffect, useCallback } from "react";
import { DEFAULT_FOOTER_TEXT, loadPageConfig, savePageConfig } from "./pageConfig";

const API = "https://api.vaktija.ba/vaktija/v1";
const STORAGE_KEY = "vaktijaCache";

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
  const base = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + dayOffset,
      h,
      m,
      0
    )
  );
  const str = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(base);
  const d = new Date(str);
  return isNaN(d.getTime()) ? base : d;
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

function getLocationId() {
  const saved = localStorage.getItem("locId");
  return saved ? Number(saved) : 15;
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

  const updateClockAndDates = () => {
    const now = currentTimeTZ(tz);
    setClock(fmtTimeWithSeconds(now, tz));
    const gregorian = toGregorianDate(now, tz);
    setGregorianDate(gregorian);
    const hijri = toHijri(now);
    setHijriDate(hijri);
    return now;
  };

  const loadPrayerTimes = useCallback(async () => {
    const locId = getLocationId();
    try {
      const data = await getPrayerData(locId, tz);
      let nextPrepared = data.vakat;

      // Initialize Fajr time in config from API if not set yet
      if (!config.fajrTime && nextPrepared && nextPrepared.length > 0) {
        const nextConfig = {
          ...config,
          fajrTime: nextPrepared[0],
        };
        setConfig(nextConfig);
        savePageConfig(nextConfig);
      } else if (config.fajrTime && nextPrepared && nextPrepared.length > 0) {
        // Override Fajr time with configured value
        nextPrepared = [config.fajrTime, ...nextPrepared.slice(1)];
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
        for (let i = nextSchedule.length - 1; i >= 0; i--) {
          if (now >= nextSchedule[i]) {
            idx = i;
            break;
          }
        }
      }
      setActivePrayerIndex(idx);
    } catch (e) {
      setPrayerTimes(["--:--", "--:--", "--:--", "--:--", "--:--", "--:--"]);
      setStatus("Unable to load prayer times");
      setSchedule(null);
      setPrepared(null);
      setActivePrayerIndex(-1);
    }
  }, [tz, config]);

  useEffect(() => {
    // Initial load
    updateClockAndDates();
    loadPrayerTimes();
  }, []);

  useEffect(() => {
    // Update clock and dates every second
    const clockInterval = setInterval(() => {
      const now = updateClockAndDates();

      // Update active prayer based on current time
      if (schedule) {
        let idx = -1;
        for (let i = schedule.length - 1; i >= 0; i--) {
          if (now >= schedule[i]) {
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
    let dailyIntervalId;

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setDate(now.getDate() + 1);
    nextMidnight.setHours(0, 0, 5, 0); // a few seconds after midnight

    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    const midnightTimeoutId = setTimeout(async () => {
      await loadPrayerTimes();
      dailyIntervalId = setInterval(loadPrayerTimes, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => {
      clearTimeout(midnightTimeoutId);
      if (dailyIntervalId) clearInterval(dailyIntervalId);
    };
  }, [loadPrayerTimes]);

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
                <div className="flex flex-col text-xs sm:text-lg lg:text-base text-dark-text">
                  <p className="font-bold uppercase text-prayer-green">
                    ISLAMSKA ZAJEDNICA U BOSNI I HERCEGOVINI
                  </p>
                </div>
                <div className="text-xs sm:text-base lg:text-base font-normal text-islamic-date mt-1 text-center">
                  Medžlis Islamske zajednice Breza - Džemat "Mahala"
                </div>
              </div>
            </div>

            {/* Current Time Display */}
            <div className="rounded-lg border border-light-border p-2 mx-auto w-fit min-w-[240px]">
              <div className="text-4xl font-bold tracking-tight text-dark-text text-center">
                {clock}
              </div>
            </div>
          </header>

          {/* Date Section */}
          <section className="mb-3">
            <div className="flex flex-row gap-3 justify-center">
              {/* Gregorian Date Box */}
              <div className="rounded-lg border border-light-border bg-transparent p-2 text-center flex-1 max-w-xs">
                <div className="mb-1">
                  <span className="text-4xl font-bold text-prayer-green">
                    {gregorianDate.day}
                  </span>
                  <span className="text-xl font-bold text-prayer-green">
                    .
                  </span>
                  <span className="text-xl font-bold text-prayer-green">
                    {gregorianDate.year}
                  </span>
                </div>
                <div className="text-lg font-bold text-prayer-green">
                  {gregorianDate.month}
                </div>
              </div>

              {/* Islamic Date Box */}
              <div className="rounded-lg border border-light-border bg-transparent p-2 text-center flex-1 max-w-xs">
                <div className="mb-1">
                  <span className="text-4xl font-bold text-islamic-date">
                    {hijriDate.day}
                  </span>
                  <span className="text-xl font-bold text-islamic-date">
                    .
                  </span>
                  <span className="text-xl font-bold text-islamic-date">
                    {hijriDate.year}
                  </span>
                </div>
                <div className="text-lg font-bold text-islamic-date">
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
                <div className="text-base font-bold text-center uppercase">
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
                            style={{ fontSize: "24px" }}
                          >
                            {labels.bs[i]}
                          </div>
                        </div>
                        <div className="flex-1 text-center px-2">
                          <div
                            className={`font-semibold ${
                              isActive ? "text-prayer-green" : "text-dark-text"
                            }`}
                            style={{ fontSize: "60px" }}
                          >
                            {time}
                          </div>
                        </div>
                        <div className="flex-1 text-right pl-3">
                          <div
                            className={`font-medium ${
                              isActive ? "text-prayer-green" : "text-dark-text"
                            }`}
                            style={{ fontSize: "24px" }}
                          >
                            {labels.en[i]}
                          </div>
                          <div
                            className={`font-normal ${
                              isActive ? "text-prayer-green" : "text-dark-text"
                            } mt-0 opacity-90`}
                            style={{ fontSize: "24px" }}
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
            <p className="text-xs text-center leading-tight">
              {config.footerText || DEFAULT_FOOTER_TEXT}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;
