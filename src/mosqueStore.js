import { getSupabaseConfigError, supabase } from "./supabaseClient";

const ACTIVE_MOSQUE_ID_KEY = "activeMosqueId";

export function normalizeFajrTime(input) {
  const v = String(input ?? "").trim();
  if (!v) return null;
  const m = v.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return { error: "Fajr time must be HH:MM" };
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return { error: "Fajr time must be a valid 24h time" };
  }
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function normalizeFooterText(input) {
  const v = String(input ?? "").trim();
  return v.length ? v : null;
}

export function normalizeLocationId(input) {
  const n = Number(String(input ?? "").trim());
  if (!Number.isFinite(n) || n <= 0) return { error: "Location id must be a positive number" };
  return n;
}

export function normalizeMosqueDraft(draft) {
  const name = String(draft?.name ?? "").trim();
  if (!name) return { error: "Name is required" };

  const locationId = normalizeLocationId(draft?.locationId);
  if (typeof locationId === "object" && locationId?.error) return locationId;

  const fajrTime = normalizeFajrTime(draft?.fajrTime);
  if (typeof fajrTime === "object" && fajrTime?.error) return fajrTime;

  const footerText = normalizeFooterText(draft?.footerText);

  return {
    name,
    locationId,
    fajrTime,
    footerText,
  };
}

function mapRowToMosque(row) {
  return {
    id: row.id,
    name: row.name,
    locationId: Number(row.location_id),
    fajrTime: row.fajr_time || null,
    footerText: row.footer_text || null,
  };
}

function mapDraftToRow(draft) {
  return {
    name: draft.name,
    location_id: draft.locationId,
    fajr_time: draft.fajrTime,
    footer_text: draft.footerText,
  };
}

function supabaseNotReadyError() {
  return getSupabaseConfigError() || "Supabase client not initialized";
}

export async function loadMosques() {
  if (!supabase) return { error: supabaseNotReadyError() };
  const { data, error } = await supabase
    .from("mosques")
    .select("id,name,location_id,fajr_time,footer_text,created_at")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message || "Failed to load mosques" };
  return { mosques: (data || []).map(mapRowToMosque) };
}

export async function loadMosqueById(id) {
  if (!supabase) return { error: supabaseNotReadyError() };
  const { data, error } = await supabase
    .from("mosques")
    .select("id,name,location_id,fajr_time,footer_text,created_at")
    .eq("id", id)
    .single();

  if (error) return { error: error.message || "Failed to load mosque" };
  return { mosque: mapRowToMosque(data) };
}

export async function createMosque(draft) {
  const normalized = normalizeMosqueDraft(draft);
  if (typeof normalized === "object" && normalized?.error) return normalized;
  if (!supabase) return { error: supabaseNotReadyError() };

  const row = mapDraftToRow(normalized);
  const { data, error } = await supabase.from("mosques").insert(row).select().single();
  if (error) return { error: error.message || "Failed to create mosque" };

  return { mosque: mapRowToMosque(data) };
}

export async function updateMosque(id, draft) {
  const normalized = normalizeMosqueDraft(draft);
  if (typeof normalized === "object" && normalized?.error) return normalized;
  if (!supabase) return { error: supabaseNotReadyError() };

  const row = mapDraftToRow(normalized);
  const { data, error } = await supabase
    .from("mosques")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message || "Failed to update mosque" };
  return { mosque: mapRowToMosque(data) };
}

export async function deleteMosque(id) {
  if (!supabase) return { error: supabaseNotReadyError() };
  const { error } = await supabase.from("mosques").delete().eq("id", id);
  if (error) return { error: error.message || "Failed to delete mosque" };

  // If we deleted the active one, clear it.
  const active = getActiveMosqueId();
  if (active && active === id) {
    setActiveMosqueId(null);
  }

  return { ok: true };
}

export function getActiveMosqueId() {
  try {
    const raw = localStorage.getItem(ACTIVE_MOSQUE_ID_KEY);
    return raw ? String(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveMosqueId(id) {
  try {
    if (!id) {
      localStorage.removeItem(ACTIVE_MOSQUE_ID_KEY);
      return;
    }
    localStorage.setItem(ACTIVE_MOSQUE_ID_KEY, String(id));
  } catch {
    // ignore storage errors
  }
}


