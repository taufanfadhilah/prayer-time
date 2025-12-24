import { useState, useEffect, useCallback } from "react";
import { getPrayerData } from "../utils/apiUtils";
import { parseHHMM, currentTimeTZ, formatTimeWithoutLeadingZero } from "../utils/timeUtils";
import { getFallbackLocationId } from "../utils/storageUtils";
import { getTodayKey } from "../utils/dateUtils";
import { loadPageConfig, savePageConfig } from "../pageConfig";
import { DEFAULT_FOOTER_TEXT } from "../pageConfig";
import { expireLocalStorageDaily } from "../utils/storageUtils";
import { loadMosqueById } from "../mosqueStore";

export function usePrayerTimes(tz, selectedMosque, config, setConfig, selectedMosqueId, setSelectedMosque) {
  const [prayerTimes, setPrayerTimes] = useState([
    "--:--",
    "--:--",
    "--:--",
    "--:--",
    "--:--",
    "--:--",
  ]);
  const [activePrayerIndex, setActivePrayerIndex] = useState(-1);
  const [status, setStatus] = useState("");
  const [schedule, setSchedule] = useState(null);
  const [prepared, setPrepared] = useState(null);
  const [hijriMonthApi, setHijriMonthApi] = useState("");

  const loadPrayerTimes = useCallback(
    async (forcedMosque = null) => {
      const mosque = forcedMosque || selectedMosque;
      const locId = mosque?.locationId ?? getFallbackLocationId();
      try {
        const data = await getPrayerData(locId, tz);
        let nextPrepared = data.vakat;

        const overrideFajr =
          (mosque?.fajrTime || "").trim().length > 0
            ? mosque.fajrTime.trim()
            : null;
        const effectiveFajrTime = overrideFajr || config.fajrTime;

        // Initialize Fajr time in config from API if not set yet
        if (!effectiveFajrTime && nextPrepared && nextPrepared.length > 0) {
          const nextConfig = {
            ...config,
            fajrTime: nextPrepared[0],
          };
          setConfig(nextConfig);
          savePageConfig(nextConfig);
        } else if (
          effectiveFajrTime &&
          nextPrepared &&
          nextPrepared.length > 0
        ) {
          // Override Fajr time with configured value
          nextPrepared = [effectiveFajrTime, ...nextPrepared.slice(1)];
        }

        const nextSchedule = nextPrepared.map((t) => parseHHMM(t, tz));
        // Format times to remove leading zeros from hours (e.g., "06:45" -> "6:45")
        const formattedPrepared = nextPrepared.map(formatTimeWithoutLeadingZero);
        setPrepared(formattedPrepared);
        setSchedule(nextSchedule);
        setStatus(data.lokacija ? `Location: ${data.lokacija}` : "");

        // Parse Hijri month from API date string, e.g. "25. džumade-l-uhra 1447"
        if (Array.isArray(data.datum) && data.datum[0]) {
          const hijriString = data.datum[0];
          const match = hijriString.match(/^\s*\d+\.\s+(.+)\s+\d+\s*$/);
          if (match && match[1]) {
            setHijriMonthApi(match[1]);
          } else {
            setHijriMonthApi("");
          }
        } else {
          setHijriMonthApi("");
        }

        // Update active prayer index using the freshly computed schedule
        const now = currentTimeTZ(tz);
        let idx = -1;
        if (nextSchedule && nextSchedule.length) {
          // Find the most recent prayer time that has passed
          // Check from most recent (last) to oldest (first)
          for (let i = nextSchedule.length - 1; i >= 0; i--) {
            if (now >= nextSchedule[i]) {
              idx = i;
              break;
            }
          }
          // If we're after the last prayer of the day (Isya), keep it active until next Fajr
          // (idx will already be set to the last prayer index, which is correct)
        }
        setActivePrayerIndex(idx);
      } catch (e) {
        setPrayerTimes(["--:--", "--:--", "--:--", "--:--", "--:--", "--:--"]);
        setStatus("Unable to load prayer times");
        setSchedule(null);
        setPrepared(null);
        setActivePrayerIndex(-1);
      }
    },
    [tz, config, selectedMosque, setConfig]
  );

  useEffect(() => {
    // Reload prayer times whenever the effective data source changes
    // (selected masjid fetched from Supabase, or config reset/updated)
    loadPrayerTimes();
  }, [loadPrayerTimes]);

  useEffect(() => {
    // Update active prayer based on current time (checks every second)
    if (schedule && schedule.length > 0) {
      const clockInterval = setInterval(() => {
        const now = currentTimeTZ(tz);
        let idx = -1;
        // Find the most recent prayer time that has passed
        // Check from most recent (last) to oldest (first)
        // This runs every second, so active status will update immediately when a prayer time is reached
        for (let i = schedule.length - 1; i >= 0; i--) {
          const prayerTime = schedule[i];
          if (prayerTime && now >= prayerTime) {
            idx = i;
            break;
          }
        }
        setActivePrayerIndex(idx);
      }, 1000);

      return () => {
        clearInterval(clockInterval);
      };
    }
  }, [schedule, tz]);

  useEffect(() => {
    // Ensure data refreshes at (local) midnight and then once per day after that
    const RELOAD_FLAG_KEY = "dailyReloadDate";

    const now = new Date();
    const todayKey = getTodayKey(tz);
    
    // Check if we've already reloaded today (prevent infinite loop)
    try {
      const lastReloadDate = sessionStorage.getItem(RELOAD_FLAG_KEY);
      if (lastReloadDate === todayKey) {
        // Already reloaded today, don't set up another reload
        return;
      }
    } catch {
      // Ignore sessionStorage errors
    }

    const nextMidnight = new Date(now);
    nextMidnight.setDate(now.getDate() + 1);
    nextMidnight.setHours(0, 0, 5, 0); // a few seconds after midnight

    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    // Safety check: don't set timeout if we're already past midnight
    if (msUntilMidnight <= 0 || msUntilMidnight > 24 * 60 * 60 * 1000) {
      return;
    }

    const midnightTimeoutId = setTimeout(async () => {
      // Double-check we haven't already reloaded today (race condition protection)
      try {
        const lastReloadDate = sessionStorage.getItem(RELOAD_FLAG_KEY);
        if (lastReloadDate === todayKey) {
          return; // Already reloaded, abort
        }
        // Mark that we're about to reload today
        sessionStorage.setItem(RELOAD_FLAG_KEY, todayKey);
      } catch {
        // Ignore sessionStorage errors, proceed with reload
      }

      // Expire all localStorage keys except selected masjid uuid.
      expireLocalStorageDaily(tz);
      // Reset page config (it lives in localStorage and should expire daily)
      setConfig(loadPageConfig());
      // Refresh selected masjid data from Supabase (fajr/footer/location might change)
      if (selectedMosqueId) {
        const res = await loadMosqueById(selectedMosqueId);
        if (res?.mosque) setSelectedMosque(res.mosque);
      }
      await loadPrayerTimes();
      // Reload the page once a day at midnight (without removing localStorage)
      // This ensures a fresh start each day while preserving selectedMosqueId
      window.location.reload();
    }, msUntilMidnight);

    return () => {
      clearTimeout(midnightTimeoutId);
    };
  }, [loadPrayerTimes, selectedMosqueId, tz, setConfig, setSelectedMosque]);

  // Update prayer times display when prepared changes
  useEffect(() => {
    if (prepared) {
      setPrayerTimes(prepared);
    }
  }, [prepared]);

  return {
    prayerTimes,
    activePrayerIndex,
    status,
    hijriMonthApi,
  };
}

