export const CONFIG_KEY = "pageConfig";

export const DEFAULT_FOOTER_TEXT =
  'Allah\'s Messenger ( ﷺ ) said, "By Him in Whose Hands my life is, none of you will have faith till he loves me more than his father and his children."';

export function loadPageConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) {
      return { footerText: DEFAULT_FOOTER_TEXT, fajrTime: null };
    }
    const parsed = JSON.parse(raw);
    return {
      footerText: parsed.footerText || DEFAULT_FOOTER_TEXT,
      fajrTime: parsed.fajrTime || null,
    };
  } catch {
    return { footerText: DEFAULT_FOOTER_TEXT, fajrTime: null };
  }
}

export function savePageConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}


