import { useState, useEffect } from "react";
import { currentTimeTZ, parseHHMM } from "../utils/timeUtils";

export function useNextPrayerCountdown(schedule, tz, preparedTimes = null) {
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
        // Create tomorrow's Fajr time using parseHHMM with dayOffset=1
        // This ensures it's created the same way as the schedule times, accounting for timezone correctly
        if (preparedTimes && preparedTimes.length > 0 && preparedTimes[0]) {
          // Use the time string (HH:MM) to create tomorrow's Fajr with dayOffset=1
          nextPrayerTime = parseHHMM(preparedTimes[0], tz, 1);
          nextIndex = 0;
        } else {
          // Fallback: add 24 hours if we don't have the time string
          const tomorrowFajr = new Date(schedule[0].getTime() + 24 * 60 * 60 * 1000);
          tomorrowFajr.setSeconds(0, 0);
          nextPrayerTime = tomorrowFajr;
          nextIndex = 0;
        }
      }

      if (nextPrayerTime) {
        // Get the difference in milliseconds
        const diffMs = nextPrayerTime.getTime() - now.getTime();
        
        if (diffMs <= 0) {
          setCountdown("00:00:00");
          setNextPrayerIndex(nextIndex);
          return;
        }

        // Calculate total seconds remaining
        // Use Math.floor to show actual remaining time (not rounded up)
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
  }, [schedule, tz, preparedTimes]);

  return { countdown, nextPrayerIndex };
}

