import { useState, useEffect, useRef } from "react";
import { fmtTimeWithSeconds, currentTimeTZ } from "../utils/timeUtils";
import { toGregorianDate, toHijri } from "../utils/dateUtils";

export function useClock(tz, maghribTime) {
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
  const [isAfterMaghrib, setIsAfterMaghrib] = useState(false);

  // Use ref to always hold latest maghribTime (avoids stale closure in setInterval)
  const maghribTimeRef = useRef(maghribTime);
  useEffect(() => {
    maghribTimeRef.current = maghribTime;
  }, [maghribTime]);

  const updateClockAndDates = () => {
    const now = currentTimeTZ(tz);
    setClock(fmtTimeWithSeconds(now, tz));
    const gregorian = toGregorianDate(now, tz);
    setGregorianDate(gregorian);

    // Islamic day starts at Maghrib — advance Hijri date after Maghrib
    let hijriInput = now;
    let afterMaghrib = false;

    if (maghribTimeRef.current) {
      // Check same Gregorian day to prevent double-advance after midnight
      const sameDay =
        now.getDate() === maghribTimeRef.current.getDate() &&
        now.getMonth() === maghribTimeRef.current.getMonth() &&
        now.getFullYear() === maghribTimeRef.current.getFullYear();

      if (sameDay && now >= maghribTimeRef.current) {
        // After Maghrib: use tomorrow's Gregorian date for Hijri conversion
        hijriInput = new Date(now);
        hijriInput.setDate(hijriInput.getDate() + 1);
        afterMaghrib = true;
      }
    }

    const hijri = toHijri(hijriInput);
    setHijriDate(hijri);
    setIsAfterMaghrib(afterMaghrib);
    return now;
  };

  useEffect(() => {
    // Initial load
    updateClockAndDates();
  }, []);

  useEffect(() => {
    // Update clock and dates every second
    const clockInterval = setInterval(() => {
      updateClockAndDates();
    }, 1000);

    return () => {
      clearInterval(clockInterval);
    };
  }, [tz]);

  return {
    clock,
    gregorianDate,
    hijriDate,
    isAfterMaghrib,
    updateClockAndDates,
  };
}

