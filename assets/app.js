const API = "https://api.vaktija.ba/vaktija/v1";

const labels = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const MOSQUES = [
  { name: "Masjid Al-Hikmah", city: "Jakarta" },
  { name: "Masjid Nurul Iman", city: "Bandung" },
  { name: "Masjid Al-Ikhlas", city: "Surabaya" },
];

function saveMosqueIndex(i) { localStorage.setItem("mosqueIndex", String(i)); }
function loadMosqueIndex() { const v = localStorage.getItem("mosqueIndex"); return v? Number(v): 0; }

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
  const months = [
    "Muharram",
    "Safar",
    "Rabiʿ al-awwal",
    "Rabiʿ al-thani",
    "Jumada al-awwal",
    "Jumada al-thani",
    "Rajab",
    "Shaʿban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qadah",
    "Dhu al-Hijjah",
  ];
  return `${String(day).padStart(2, "0")} ${months[month - 1]} ${year} AH`;
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

function countdownTo(nextDate, now) {
  const diff = Math.max(nextDate.getTime() - now.getTime(), 0);
  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${s}`;
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

function renderGrid(times, activeIdx) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  times.forEach((t, i) => {
    const div = document.createElement("div");
    div.className = `flex flex-col items-center justify-between min-h-[140px] rounded-2xl p-4 lg:p-6 transition-transform duration-300 ${activeIdx===i?"bg-emerald-800/50 ring-2 ring-emerald-500 scale-[1.03]":"bg-neutral-900/80 ring-1 ring-neutral-700"}`;
    div.innerHTML = `<div class="text-base lg:text-lg ${activeIdx===i?"text-emerald-200":"text-neutral-300"}">${labels[i]}</div><div class="text-4xl lg:text-5xl font-semibold ${activeIdx===i?"text-emerald-100":"text-white"}">${t}</div>`;
    grid.appendChild(div);
  });
}

async function main() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  document.getElementById("tz").textContent = tz;
  document.getElementById("year").textContent = String(new Date().getFullYear());
  document.getElementById("loc").value = String(getLocationId());
  // Mosque select
  const select = document.getElementById("mosque");
  select.innerHTML = MOSQUES.map((m, i) => `<option value="${i}">${m.name} — ${m.city}</option>`).join("");
  select.value = String(loadMosqueIndex());
  const label = document.getElementById("mosque-name");
  label.textContent = `${MOSQUES[Number(select.value)].name} • ${MOSQUES[Number(select.value)].city}`;

  async function load() {
    const locId = getLocationId();
    try {
      const data = await fetchTimes(locId);
      const prepared = data.vakat;
      const schedule = prepared.map((t) => parseHHMM(t, tz));
      let idx = -1;
      const now = currentTimeTZ(tz);
      for (let i = schedule.length - 1; i >= 0; i--) if (now >= schedule[i]) { idx = i; break; }
      let nextIdx = idx === -1 ? 0 : idx + 1;
      let target;
      if (nextIdx >= schedule.length) {
        target = parseHHMM(prepared[0], tz, 1);
        nextIdx = 0;
      } else {
        target = schedule[nextIdx];
      }
      renderGrid(prepared, idx);
      document.getElementById("next").textContent = `Next: ${labels[nextIdx]} at ${fmtTime(target)}`;
      // cache next target for countdown
      window.__nextTarget = target;
      document.getElementById("status").textContent = data.lokacija ? `Location: ${data.lokacija}` : "";
    } catch (e) {
      renderGrid(["--:--","--:--","--:--","--:--","--:--","--:--"], -1);
      document.getElementById("status").textContent = "Unable to load prayer times";
      window.__nextTarget = null;
    }
  }

  await load();

  setInterval(() => {
    const now = currentTimeTZ(tz);
    document.getElementById("clock").textContent = fmtTime(now);
    document.getElementById("date").textContent = new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "long", day: "2-digit", weekday: "long" }).format(now);
    document.getElementById("hijri").textContent = toHijri(now);
    const target = window.__nextTarget;
    document.getElementById("countdown").textContent = target ? countdownTo(target, now) : "--:--:--";
    if (target && now >= target) {
      // refresh schedule when we pass the target
      load();
    }
  }, 1000);

  setInterval(load, 300000);

  document.getElementById("apply").addEventListener("click", () => {
    const v = Number(document.getElementById("loc").value);
    if (!Number.isFinite(v) || v <= 0) return;
    setLocationId(v);
    load();
  });

  select.addEventListener("change", () => {
    const i = Number(select.value);
    saveMosqueIndex(i);
    label.textContent = `${MOSQUES[i].name} • ${MOSQUES[i].city}`;
  });

  function applyOrientation() {
    const isLandscape = window.matchMedia("(orientation: landscape)").matches;
    const panels = document.getElementById("top-panels");
    if (isLandscape) {
      panels.className = "grid grid-cols-3 gap-6 items-stretch";
      document.getElementById("clock").className = "text-7xl font-semibold tracking-tight mt-2";
      document.getElementById("countdown").className = "text-7xl font-bold mt-2 text-emerald-300 tracking-wider";
      document.getElementById("date").className = "text-3xl font-medium mt-2 text-neutral-200";
      document.getElementById("hijri").className = "text-2xl font-medium mt-2 text-emerald-300";
    } else {
      panels.className = "grid grid-cols-1 gap-6 items-stretch";
      document.getElementById("clock").className = "text-6xl lg:text-7xl font-semibold tracking-tight mt-2";
      document.getElementById("countdown").className = "text-6xl lg:text-7xl font-bold mt-2 text-emerald-300 tracking-wider";
      document.getElementById("date").className = "text-2xl lg:text-3xl font-medium mt-2 text-neutral-200";
      document.getElementById("hijri").className = "text-xl lg:text-2xl font-medium mt-2 text-emerald-300";
    }
  }

  applyOrientation();
  window.addEventListener("resize", applyOrientation);
}

main();
