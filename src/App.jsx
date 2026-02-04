import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
const APP_VERSION = "2.0.5";

// Send notification to Telegram via Cloudflare Function
function sendLoadNotification(type, fromVersion = null) {
  const payload = {
    type, // "load" | "upgrade"
    currentVersion: APP_VERSION,
    fromVersion,
    toVersion: type === "upgrade" ? APP_VERSION : null,
    locationId: localStorage.getItem("locId") || "N/A",
    userAgent: navigator.userAgent.slice(0, 100), // Truncate for readability
  };

  const url = "/api/notify-load";
  const body = JSON.stringify(payload);

  // Use sendBeacon for reliability (works even during page unload)
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    console.log(`[App] 📤 Sent ${type} notification via sendBeacon`);
  } else {
    // Fallback to fetch with keepalive
    fetch(url, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {}); // Fire and forget
    console.log(`[App] 📤 Sent ${type} notification via fetch`);
  }
}

// Force reload if app version changed (ensures clients get latest code)
function checkVersionAndReload() {
  const storedVersion = localStorage.getItem("appVersion");
  if (storedVersion !== APP_VERSION) {
    console.log(`[App] Version changed: ${storedVersion} → ${APP_VERSION}, reloading...`);

    // Send upgrade notification BEFORE reload
    sendLoadNotification("upgrade", storedVersion);

    localStorage.setItem("appVersion", APP_VERSION);

    // Small delay to ensure notification is sent before reload
    setTimeout(() => {
      window.location.reload();
    }, 100);

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
  const navigate = useNavigate();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  // Expire all localStorage keys daily, except the selected masjid UUID.
  expireLocalStorageDaily(tz);

  // All hooks must be called before any early returns
  const { selectedMosque, selectedMosqueId, setSelectedMosque } = useMosque();
  const { clock, gregorianDate, hijriDate } = useClock(tz);
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

  // Redirect to config page if no mosque is selected
  useEffect(() => {
    if (!selectedMosqueId) {
      navigate("/config", { replace: true });
    }
  }, [selectedMosqueId, navigate]);

  // TV remote shortcuts:
  // - D-pad Center (Enter/OK) → /config
  // - D-pad Center pressed 3x quickly → /admin/config
  useEffect(() => {
    let pressCount = 0;
    let pressTimer = null;

    const handleKeyDown = (e) => {
      // D-pad center = Enter (keyCode 13) or keyCode 23 (DPAD_CENTER)
      if (e.keyCode === 13 || e.keyCode === 23) {
        e.preventDefault();
        pressCount++;
        clearTimeout(pressTimer);
        pressTimer = setTimeout(() => {
          if (pressCount >= 3) {
            navigate("/admin/config");
          } else {
            navigate("/config");
          }
          pressCount = 0;
        }, 600);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(pressTimer);
    };
  }, [navigate]);

  // Schedule maintenance reload and send page load notification on mount
  useEffect(() => {
    if (isReloading) return; // Don't schedule if we're about to reload

    // Send page load notification (only once per session to avoid spam)
    const hasNotifiedThisSession = sessionStorage.getItem("loadNotified");
    if (!hasNotifiedThisSession) {
      sendLoadNotification("load");
      sessionStorage.setItem("loadNotified", "true");
    }

    const maintenanceTimeout = scheduleMaintenanceReload();

    return () => {
      clearTimeout(maintenanceTimeout);
    };
  }, []);

  // Don't render anything while redirecting to config
  if (!selectedMosqueId) {
    return null;
  }

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
