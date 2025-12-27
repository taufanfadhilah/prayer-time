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

function App() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  // Expire all localStorage keys daily, except the selected masjid UUID.
  // (Runs every render, but only does work once per day.)
  expireLocalStorageDaily(tz);

  const { clock, gregorianDate, hijriDate } = useClock(tz);
  const { selectedMosque, selectedMosqueId, setSelectedMosque } = useMosque();
  const { config, setConfig } = usePageConfig();
  const { prayerTimes, activePrayerIndex, hijriMonthApi, schedule, hasCustomFajrTime, preparedTimes } = usePrayerTimes(
    tz,
    selectedMosque,
    config,
    setConfig,
    selectedMosqueId,
    setSelectedMosque
  );
  const { countdown } = useNextPrayerCountdown(schedule, tz, preparedTimes);

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
