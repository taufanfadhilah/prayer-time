import { LOCAL_STORAGE_DAY_KEY, SELECTED_MOSQUE_ID_KEY } from "./constants";
import { getTodayKey } from "./dateUtils";

export function readSelectedMosqueId() {
  try {
    return localStorage.getItem(SELECTED_MOSQUE_ID_KEY) || "";
  } catch {
    return "";
  }
}

export function expireLocalStorageDaily(tz) {
  const todayKey = getTodayKey(tz);
  try {
    const last = localStorage.getItem(LOCAL_STORAGE_DAY_KEY);
    if (last === todayKey) return;

    const keep = new Set([LOCAL_STORAGE_DAY_KEY, SELECTED_MOSQUE_ID_KEY]);
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !keep.has(k)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(LOCAL_STORAGE_DAY_KEY, todayKey);
  } catch {
    // ignore
  }
}

export function getFallbackLocationId() {
  try {
    const saved = localStorage.getItem("locId");
    return saved ? Number(saved) : 14;
  } catch {
    return 14;
  }
}

