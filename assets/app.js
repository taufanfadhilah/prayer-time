const API = "https://api.vaktija.ba/vaktija/v1";

const labels = {
  en: ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"],
  bs: ["Zora", "Izlazak sunca", "Podne", "Ikindija", "Akšam", "Jacija"],
  ar: ["الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء"],
};

const hijriMonths = [
  "muharram", "safar", "rabiʿ al-awwal", "rabiʿ al-thani", 
  "jumada al-awwal", "jumada al-thani", "redžeb", "šaʿban",
  "ramadan", "šavval", "dhu al-qadah", "dhu al-hijjah"
];

const MOSQUES = [
  { name: "Masjid Al-Hikmah", city: "Jakarta" },
  { name: "Masjid Nurul Iman", city: "Bandung" },
  { name: "Masjid Al-Ikhlas", city: "Surabaya" },
];

function saveMosqueIndex(i) { localStorage.setItem("mosqueIndex", String(i)); }
function loadMosqueIndex() { const v = localStorage.getItem("mosqueIndex"); return v ? Number(v) : 0; }

function isoDateInTZ(date, tz) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function fmtTime(date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function fmtTimeWithSeconds(date, tz) {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  
  const h = formatted.find(p => p.type === "hour").value;
  const m = formatted.find(p => p.type === "minute").value;
  const s = formatted.find(p => p.type === "second").value;
  return `${h}:${m}:${s}`;
}

function islamicToJD(y, m, d) {
  const epoch = 1948439.5;
  return d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + epoch - 1;
}

function jdToIslamic(jd) {
  const epoch = 1948439.5;
  const days = jd - epoch;
  const year = Math.floor((30 * days + 10646) / 10631);
  const month = Math.min(12, Math.ceil((days - (islamicToJD(year, 1, 1) - epoch)) / 29.5));
  const day = Math.floor(jd - islamicToJD(year, month, 1)) + 1;
  return { year, month, day };
}

function gregorianToJD(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}

function toHijri(date) {
  const jd = gregorianToJD(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const { year, month, day } = jdToIslamic(jd);
  return {
    day: String(day).padStart(2, "0"),
    year: String(year),
    month: hijriMonths[month - 1]
  };
}

function toGregorianDate(date, tz) {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "2-digit"
  }).formatToParts(date);
  
  const day = formatted.find(p => p.type === "day").value;
  const year = formatted.find(p => p.type === "year").value;
  const monthNum = parseInt(formatted.find(p => p.type === "month").value);
  
  const monthNames = [
    "januar", "februar", "mart", "april", "maj", "jun",
    "jul", "avgust", "septembar", "oktobar", "novembar", "decembar"
  ];
  const month = monthNames[monthNum - 1];
  return {
    day: day,
    year: year,
    month: month
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
  const str = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(base);
  const d = new Date(str);
  return isNaN(d.getTime()) ? base : d;
}

function currentTimeTZ(tz) {
  return new Date();
}

function getLocationId() {
  const saved = localStorage.getItem("locId");
  return saved ? Number(saved) : 77;
}

function setLocationId(id) {
  localStorage.setItem("locId", String(id));
}

async function fetchTimes(locId) {
  const url = `${API}/${locId}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderGrid(times, activeIdx, hasCustomFajrTime = false) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  times.forEach((t, i) => {
    const isActive = activeIdx === i;
    const fajrLabel = i === 0 ? (hasCustomFajrTime ? "Zora" : "Sabah u dzamiji") : labels.bs[i];
    const row = document.createElement("div");
    row.className = `flex flex-row items-center py-4 sm:py-5 px-4 sm:px-6`;
    
    row.innerHTML = `
      <div class="flex-1 text-left pr-4">
        <div class="font-medium ${isActive ? "text-prayer-green" : "text-dark-text"} leading-tight" style="font-size: 31.5px;">
          ${fajrLabel}
        </div>
      </div>
      <div class="flex-1 text-center px-2 sm:px-4">
        <div class="font-semibold ${isActive ? "text-prayer-green" : "text-dark-text"}" style="font-size: 84px;">
          ${t}
        </div>
      </div>
      <div class="flex-1 text-right pl-4">
        <div class="font-medium ${isActive ? "text-prayer-green" : "text-dark-text"}" style="font-size: 31.5px;">
          ${labels.en[i]}
        </div>
        <div class="font-normal ${isActive ? "text-prayer-green" : "text-dark-text"} mt-0.5 opacity-90" style="font-size: 31.5px;">
          ${labels.ar[i]}
        </div>
      </div>
    `;
    grid.appendChild(row);
  });
}

async function main() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  
  // Organization names
  const orgNames = document.getElementById("org-names");
  orgNames.innerHTML = `
    <div class="font-bold uppercase">ISLAMSKA ZAJEDNICA U BOSNI I HERCEGOVINI</div>
  `;
  
  // Mosque name
  const label = document.getElementById("mosque-name");
  const currentMosque = MOSQUES[loadMosqueIndex()];
  label.textContent = `Medžlis Islamske zajednice Breza - Džemat "Mahala"`;

  async function load() {
    const locId = getLocationId();
    try {
      const data = await fetchTimes(locId);
      const prepared = data.vakat;
      // Check if there's a custom fajrTime (from localStorage or config)
      // For now, since there's no custom fajrTime logic, this will always be false
      const customFajrTime = localStorage.getItem("customFajrTime");
      const hasCustomFajrTime = customFajrTime && customFajrTime.trim().length > 0;
      const schedule = prepared.map((t) => parseHHMM(t, tz));
      let idx = -1;
      const now = currentTimeTZ(tz);
      for (let i = schedule.length - 1; i >= 0; i--) if (now >= schedule[i]) { idx = i; break; }
      renderGrid(prepared, idx, hasCustomFajrTime);
      document.getElementById("status").textContent = data.lokacija ? `Location: ${data.lokacija}` : "";
      // cache schedule for countdown calculation
      window.__schedule = schedule;
      window.__prepared = prepared;
      window.__hasCustomFajrTime = hasCustomFajrTime;
    } catch (e) {
      renderGrid(["--:--","--:--","--:--","--:--","--:--","--:--"], -1, false);
      document.getElementById("status").textContent = "Unable to load prayer times";
      window.__schedule = null;
      window.__prepared = null;
      window.__hasCustomFajrTime = false;
    }
  }

  await load();

  // Initialize clock and dates immediately
  function updateClockAndDates() {
    const now = currentTimeTZ(tz);
    document.getElementById("clock").textContent = fmtTimeWithSeconds(now, tz);
    const gregorian = toGregorianDate(now, tz);
    document.getElementById("date-day").textContent = gregorian.day;
    document.getElementById("date-year").textContent = gregorian.year;
    document.getElementById("date-month").textContent = gregorian.month;
    const hijri = toHijri(now);
    document.getElementById("hijri-day").textContent = hijri.day;
    document.getElementById("hijri-year").textContent = hijri.year;
    document.getElementById("hijri-month").textContent = hijri.month;
    return now;
  }
  
  updateClockAndDates();

  setInterval(() => {
    const now = updateClockAndDates();
    
    // Update active prayer based on current time
    if (window.__schedule) {
      let idx = -1;
      for (let i = window.__schedule.length - 1; i >= 0; i--) {
        if (now >= window.__schedule[i]) { 
          idx = i; 
          break; 
        }
      }
      if (idx !== window.__lastIdx) {
        window.__lastIdx = idx;
        renderGrid(window.__prepared, idx, window.__hasCustomFajrTime || false);
      }
    }
  }, 1000);

  setInterval(load, 300000);
}

main();
