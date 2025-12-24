import { DEFAULT_FOOTER_TEXT } from "./pageConfig";
import { expireLocalStorageDaily } from "./utils/storageUtils";
import { useClock } from "./hooks/useClock";
import { useMosque } from "./hooks/useMosque";
import { usePageConfig } from "./hooks/usePageConfig";
import { usePrayerTimes } from "./hooks/usePrayerTimes";
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
  const { prayerTimes, activePrayerIndex, hijriMonthApi } = usePrayerTimes(
    tz,
    selectedMosque,
    config,
    setConfig,
    selectedMosqueId,
    setSelectedMosque
  );

  const masjidHeaderLine = selectedMosque?.name
    ? selectedMosque.name
    : "Medžlis Islamske zajednice - Džemat";

  const effectiveFooterText =
    (selectedMosque?.footerText || "").trim().length > 0
      ? selectedMosque.footerText.trim()
      : config.footerText || DEFAULT_FOOTER_TEXT;

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
          />
          <Footer footerText={effectiveFooterText} />
        </div>
      </div>
    </div>
  );
}

export default App;
