import { isNative } from "./platformConfig";

const APP_VERSION = "2.0.5";

function getPlatform() {
  const ua = navigator.userAgent || "";
  if (/Android/.test(ua) && /TV|AFT|BRAVIA|SHIELD/.test(ua)) return "android-tv";
  if (/Android/.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  return "web";
}

function track(eventName, data = {}) {
  try {
    if (typeof window !== "undefined" && window.umami) {
      window.umami.track(eventName, {
        platform: getPlatform(),
        version: APP_VERSION,
        ...data,
      });
    }
  } catch {
    // silent fail
  }
}

// Fired once per session on app load
export function trackAppLoaded(mosqueName) {
  track("app-loaded", {
    mosque: mosqueName || "none",
    screen: `${window.screen.width}x${window.screen.height}`,
  });
}

// Fired when user saves a mosque selection
export function trackMosqueSelected(mosqueName) {
  track("mosque-selected", { mosque: mosqueName });
}

// Fired when user clears mosque selection
export function trackMosqueCleared() {
  track("mosque-cleared");
}

// Fired on version upgrade
export function trackVersionUpgrade(fromVersion) {
  track("version-upgrade", { from: fromVersion, to: APP_VERSION });
}
