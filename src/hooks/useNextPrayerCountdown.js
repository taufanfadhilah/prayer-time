import { useState, useEffect } from "react";
import { currentTimeTZ } from "../utils/timeUtils";

export function useNextPrayerCountdown(schedule, tz) {
  const [countdown, setCountdown] = useState("--:--:--");
  const [nextPrayerIndex, setNextPrayerIndex] = useState(-1);

  useEffect(() => {
    if (!schedule || schedule.length === 0) {
      setCountdown("--:--:--");
      setNextPrayerIndex(-1);
      return;
    }

    const updateCountdown = () => {
      const now = currentTimeTZ(tz);
      
      // Find the next prayer time
      let nextPrayerTime = null;
      let nextIndex = -1;
      
      // Check all prayer times to find the next one
      for (let i = 0; i < schedule.length; i++) {
        if (schedule[i] && now < schedule[i]) {
          nextPrayerTime = schedule[i];
          nextIndex = i;
          break;
        }
      }
      
      // If no prayer time found for today, next prayer is tomorrow's Fajr (first prayer)
      if (!nextPrayerTime && schedule.length > 0 && schedule[0]) {
        // Create tomorrow's Fajr time
        const tomorrowFajr = new Date(schedule[0]);
        tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
        nextPrayerTime = tomorrowFajr;
        nextIndex = 0;
      }

      if (nextPrayerTime) {
        const diffMs = nextPrayerTime.getTime() - now.getTime();
        
        if (diffMs <= 0) {
          setCountdown("00:00:00");
          setNextPrayerIndex(nextIndex);
          return;
        }

        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        setCountdown(formatted);
        setNextPrayerIndex(nextIndex);
      } else {
        setCountdown("--:--:--");
        setNextPrayerIndex(-1);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [schedule, tz]);

  return { countdown, nextPrayerIndex };
}

