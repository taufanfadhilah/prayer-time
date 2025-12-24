import { useState, useEffect } from "react";
import { fmtTimeWithSeconds, currentTimeTZ } from "../utils/timeUtils";
import { toGregorianDate, toHijri } from "../utils/dateUtils";

export function useClock(tz) {
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

  const updateClockAndDates = () => {
    const now = currentTimeTZ(tz);
    setClock(fmtTimeWithSeconds(now, tz));
    const gregorian = toGregorianDate(now, tz);
    setGregorianDate(gregorian);
    const hijri = toHijri(now);
    setHijriDate(hijri);
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
    updateClockAndDates,
  };
}

