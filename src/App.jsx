import { useEffect } from "react";
import { expireLocalStorageDaily } from "./utils/storageUtils";
import { useClock } from "./hooks/useClock";
import { useMosque } from "./hooks/useMosque";
import { usePageConfig } from "./hooks/usePageConfig";
import { usePrayerTimes } from "./hooks/usePrayerTimes";
import { useNextPrayerCountdown } from "./hooks/useNextPrayerCountdown";
import Header from "./components/Header";
import DateDisplay from "./components/DateDisplay";
import PrayerTimesList from "./components/PrayerTimesList";
import Footer from "./components/Footer";

// App version - increment this to force reload on all clients
const APP_VERSION = "2.0.1";

// Force reload if app version changed (ensures clients get latest code)
function checkVersionAndReload() {
  const storedVersion = localStorage.getItem("appVersion");
  if (storedVersion !== APP_VERSION) {
    console.log(`[App] Version changed: ${storedVersion} → ${APP_VERSION}, reloading...`);
    localStorage.setItem("appVersion", APP_VERSION);
    window.location.reload();
    return true; // Indicates reload is happening
  }
  return false;
}

// Schedule daily maintenance reload at 3 AM to pick up code updates
function scheduleMaintenanceReload() {
  const now = new Date();
  const next3AM = new Date(now);
  next3AM.setHours(3, 0, 0, 0);

  // If it's already past 3 AM today, schedule for tomorrow
  if (now >= next3AM) {
    next3AM.setDate(next3AM.getDate() + 1);
  }

  const msUntil3AM = next3AM.getTime() - now.getTime();
  const hoursUntil = Math.floor(msUntil3AM / (1000 * 60 * 60));
  const minsUntil = Math.floor((msUntil3AM % (1000 * 60 * 60)) / (1000 * 60));

  console.log(`[App] Maintenance reload scheduled in ${hoursUntil}h ${minsUntil}m (at 3:00 AM local time)`);

  return setTimeout(() => {
    console.log(`[App] 🔄 Maintenance reload triggered at 3 AM`);
    window.location.reload();
  }, msUntil3AM);
}

// Check version on app load (outside component to run immediately)
const isReloading = checkVersionAndReload();

function App() {
  // Schedule maintenance reload on mount
  useEffect(() => {
    if (isReloading) return; // Don't schedule if we're about to reload

    const maintenanceTimeout = scheduleMaintenanceReload();

    return () => {
      clearTimeout(maintenanceTimeout);
    };
  }, []);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  // Expire all localStorage keys daily, except the selected masjid UUID.
  // (Runs every render, but only does work once per day.)
  expireLocalStorageDaily(tz);

  const { clock, gregorianDate, hijriDate } = useClock(tz);
  const { selectedMosque, selectedMosqueId, setSelectedMosque } = useMosque();
  const { config, setConfig } = usePageConfig();
  const { prayerTimes, activePrayerIndex, hijriMonthApi, schedule, hasCustomFajrTime } = usePrayerTimes(
    tz,
    selectedMosque,
    config,
    setConfig,
    selectedMosqueId,
    setSelectedMosque
  );
  const { countdown } = useNextPrayerCountdown(schedule, tz);

  const masjidHeaderLine = selectedMosque?.name
    ? selectedMosque.name
    : "Medžlis Islamske zajednice - Džemat";

  // Determine footer content: use custom footer if set, otherwise show countdown timer
  const mosqueFooterText = (selectedMosque?.footerText || "").trim();
  const configFooterText = (config.footerText || "").trim();
  
  // Check if user has explicitly set a custom footer
  const hasMosqueFooter = mosqueFooterText.length > 0;
  const hasConfigFooter = configFooterText.length > 0;
  const hasCustomFooter = hasMosqueFooter || hasConfigFooter;
  
  const effectiveFooterText = hasCustomFooter
    ? (mosqueFooterText || configFooterText)
    : null; // null means show countdown timer

  return (
    <div className="tv-portrait-wrapper bg-dark-background">
      <div className="w-full h-full flex">
        {/* Main Card Container */}
        <div className="prayer-card-container w-full h-full">
          <Header masjidHeaderLine={masjidHeaderLine} clock={clock} />
          <DateDisplay
            gregorianDate={gregorianDate}
            hijriDate={hijriDate}
            hijriMonthApi={hijriMonthApi}
          />
          <PrayerTimesList
            prayerTimes={prayerTimes}
            activePrayerIndex={activePrayerIndex}
            hasCustomFajrTime={hasCustomFajrTime}
          />
          <Footer footerText={effectiveFooterText} countdown={countdown} />
        </div>
      </div>
    </div>
  );
}

export default App;
