import { API, STORAGE_KEY } from "./constants";
import { getTodayKey } from "./dateUtils";

export async function fetchTimesFromApi(locId, retries = 3, delayMs = 1000) {
  const url = `${API}/${locId}`;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      // If this was the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }
      // Wait before retrying (exponential backoff: 1s, 2s, 4s)
      const waitTime = delayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

export async function getPrayerData(locId, tz) {
  const todayKey = getTodayKey(tz);

  // Try read from cache for today
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        parsed.date === todayKey &&
        parsed.locId === locId &&
        parsed.data
      ) {
        return parsed.data;
      }
    }
  } catch {
    // Ignore cache errors and fall back to network
  }

  // Fallback: fetch from API and store
  try {
    const data = await fetchTimesFromApi(locId);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          date: todayKey,
          locId,
          data,
        })
      );
    } catch {
      // Ignore storage errors, we still return fresh data
    }
    return data;
  } catch (error) {
    // If API fails, try to use yesterday's data as fallback
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Use yesterday's data even if date doesn't match, as long as locId matches
        if (parsed && parsed.locId === locId && parsed.data) {
          console.warn('Using cached prayer times as API is unavailable:', error);
          return parsed.data;
        }
      }
    } catch {
      // Ignore cache errors
    }
    
    // If no cache available, throw the error
    throw error;
  }
}

