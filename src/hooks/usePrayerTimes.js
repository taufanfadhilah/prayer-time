import { useState, useEffect, useCallback, useRef } from "react";
import { getPrayerData } from "../utils/apiUtils";
import { parseHHMM, currentTimeTZ, formatTimeWithoutLeadingZero } from "../utils/timeUtils";
import { loadPageConfig } from "../pageConfig";
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
  const [hasCustomFajrTime, setHasCustomFajrTime] = useState(false);

  // Use ref to track if we have data - allows error handler to check without causing re-renders
  const hasPreparedDataRef = useRef(false);

  const loadPrayerTimes = useCallback(
    async (forcedMosque = null, isMidnightRefresh = false) => {
      const mosque = forcedMosque || selectedMosque;
      const locId = mosque?.locationId;

      // Skip loading if no mosque selected (user will be redirected to /config)
      if (!locId) {
        console.log(`[PrayerTimes] No mosque selected, skipping prayer times load`);
        return;
      }

      console.log(`[PrayerTimes] Loading prayer times...`, {
        locationId: locId,
        timezone: tz,
        isMidnightRefresh,
        timestamp: new Date().toISOString(),
      });

      try {
        const data = await getPrayerData(locId, tz, isMidnightRefresh);

        console.log(`[PrayerTimes] API response received:`, {
          location: data.lokacija,
          date: data.datum,
          times: data.vakat,
        });
        let nextPrepared = data.vakat;

        // Only use mosque's fajrTime from Supabase as override (no localStorage caching)
        const mosqueFajrTime =
          (mosque?.fajrTime || "").trim().length > 0
            ? mosque.fajrTime.trim()
            : null;

        // If mosque has custom fajrTime, override the API value
        if (mosqueFajrTime && nextPrepared && nextPrepared.length > 0) {
          nextPrepared = [mosqueFajrTime, ...nextPrepared.slice(1)];
          setHasCustomFajrTime(true);
        } else {
          // Use API time directly (no caching)
          setHasCustomFajrTime(false);
        }

        const nextSchedule = nextPrepared.map((t) => parseHHMM(t, tz));
        // Format times to remove leading zeros from hours (e.g., "06:45" -> "6:45")
        const formattedPrepared = nextPrepared.map(formatTimeWithoutLeadingZero);
        setPrepared(formattedPrepared);
        hasPreparedDataRef.current = true; // Mark that we have valid data
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
        console.error(`[PrayerTimes] Failed to load prayer times:`, {
          error: e.message,
          isMidnightRefresh,
          hasExistingData: hasPreparedDataRef.current,
          timestamp: new Date().toISOString(),
        });

        // Only clear data if we don't already have valid prayer times displayed
        // This prevents showing empty times when API fails but we have cached data
        if (!hasPreparedDataRef.current) {
          console.warn(`[PrayerTimes] No existing data - showing placeholder times`);
          setPrayerTimes(["--:--", "--:--", "--:--", "--:--", "--:--", "--:--"]);
          setSchedule(null);
          setPrepared(null);
          setActivePrayerIndex(-1);
        } else {
          console.log(`[PrayerTimes] Keeping existing data displayed`);
        }
        // Update status to indicate there was an issue
        setStatus("Using cached data (API unavailable)");
      }
    },
    [tz, selectedMosque]
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

  // Ref to track midnight timeout for cleanup
  const midnightTimeoutRef = useRef(null);

  // Setup midnight refresh function (recursive, no page reload)
  const setupMidnightRefresh = useCallback(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setDate(now.getDate() + 1);

    // Add random jitter (5-120 seconds) to avoid "thundering herd" problem
    // where all clients hit the API at exactly the same time causing 503 errors
    const jitterSeconds = 5 + Math.floor(Math.random() * 115); // 5-120 seconds
    nextMidnight.setHours(0, 0, jitterSeconds, 0);

    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    // Safety check: don't set timeout if invalid
    if (msUntilMidnight <= 0 || msUntilMidnight > 24 * 60 * 60 * 1000) {
      console.warn(`[PrayerTimes] Invalid midnight timeout: ${msUntilMidnight}ms`);
      return null;
    }

    const hoursUntil = Math.floor(msUntilMidnight / (1000 * 60 * 60));
    const minsUntil = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
    console.log(`[PrayerTimes] Midnight refresh scheduled in ${hoursUntil}h ${minsUntil}m (jitter: ${jitterSeconds}s)`, {
      currentTime: now.toISOString(),
      scheduledFor: nextMidnight.toISOString(),
      jitterSeconds,
      msUntilMidnight,
    });

    return setTimeout(async () => {
      console.log(`%c[PrayerTimes] ⏰ MIDNIGHT REFRESH TRIGGERED`, 'background: #222; color: #bada55; font-size: 14px;', {
        timestamp: new Date().toISOString(),
      });

      // Expire all localStorage keys except selected masjid uuid and prayer cache.
      console.log(`[PrayerTimes] Step 1/4: Expiring old localStorage keys...`);
      expireLocalStorageDaily(tz);

      // Reset page config (it lives in localStorage and should expire daily)
      console.log(`[PrayerTimes] Step 2/4: Reloading page config...`);
      setConfig(loadPageConfig());

      // Refresh selected masjid data from Supabase (fajr/footer/location might change)
      if (selectedMosqueId) {
        console.log(`[PrayerTimes] Step 3/4: Refreshing mosque data from Supabase...`);
        try {
          const res = await loadMosqueById(selectedMosqueId);
          if (res?.mosque) {
            setSelectedMosque(res.mosque);
            console.log(`[PrayerTimes] Mosque data refreshed:`, res.mosque.name);
          }
        } catch (e) {
          console.warn(`[PrayerTimes] Failed to reload mosque data:`, e.message);
        }
      } else {
        console.log(`[PrayerTimes] Step 3/4: No mosque selected, skipping Supabase refresh`);
      }

      // Load fresh prayer times (will update state, no page reload needed)
      console.log(`[PrayerTimes] Step 4/4: Fetching fresh prayer times from API...`);
      try {
        await loadPrayerTimes(null, true); // Pass isMidnightRefresh = true
        console.log(`%c[PrayerTimes] ✅ MIDNIGHT REFRESH COMPLETED SUCCESSFULLY`, 'background: #222; color: #00ff00; font-size: 14px;', {
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error(`%c[PrayerTimes] ❌ MIDNIGHT REFRESH FAILED`, 'background: #222; color: #ff0000; font-size: 14px;', {
          error: e.message,
          timestamp: new Date().toISOString(),
        });
        // Keep showing existing data, don't clear
      }

      // Setup next midnight refresh (recursive)
      console.log(`[PrayerTimes] Setting up next midnight refresh...`);
      midnightTimeoutRef.current = setupMidnightRefresh();
    }, msUntilMidnight);
  }, [tz, selectedMosqueId, loadPrayerTimes, setConfig, setSelectedMosque]);

  // Initialize midnight refresh on mount
  useEffect(() => {
    midnightTimeoutRef.current = setupMidnightRefresh();

    return () => {
      if (midnightTimeoutRef.current) {
        clearTimeout(midnightTimeoutRef.current);
      }
    };
  }, [setupMidnightRefresh]);

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
    schedule,
    hasCustomFajrTime,
  };
}

