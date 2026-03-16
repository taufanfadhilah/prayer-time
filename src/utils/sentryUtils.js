import * as Sentry from "@sentry/react";

/**
 * Add a breadcrumb — no-op if Sentry is not initialised (no DSN).
 */
export function addBreadcrumb(message, data, category = "app", level = "info") {
  Sentry.addBreadcrumb({
    message,
    data,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set mosque context on every subsequent Sentry event.
 * Call this whenever the active mosque changes.
 */
export function setMosqueContext(mosque) {
  if (!mosque) {
    Sentry.setContext("mosque", null);
    Sentry.setTag("mosque_name", "unknown");
    Sentry.setTag("location_id", "unknown");
    return;
  }
  Sentry.setContext("mosque", {
    id: mosque.id,
    name: mosque.name,
    locationId: mosque.locationId,
    fajrOverride: mosque.fajrTime || null,
  });
  Sentry.setTag("mosque_name", mosque.name);
  Sentry.setTag("location_id", String(mosque.locationId));
}
