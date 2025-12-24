export const CONFIG_KEY = "pageConfig";

export function loadPageConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) {
      return { footerText: null, fajrTime: null };
    }
    const parsed = JSON.parse(raw);
    return {
      footerText: parsed.footerText || null,
      fajrTime: parsed.fajrTime || null,
    };
  } catch {
    return { footerText: null, fajrTime: null };
  }
}

export function savePageConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}


