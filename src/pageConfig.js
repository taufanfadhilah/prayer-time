export const CONFIG_KEY = "pageConfig";

export function loadPageConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) {
      return { footerText: null, fajrTime: null, isFajrTimeCustom: false };
    }
    const parsed = JSON.parse(raw);
    return {
      footerText: parsed.footerText || null,
      fajrTime: parsed.fajrTime || null,
      isFajrTimeCustom: parsed.isFajrTimeCustom === true,
    };
  } catch {
    return { footerText: null, fajrTime: null, isFajrTimeCustom: false };
  }
}

export function savePageConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}


