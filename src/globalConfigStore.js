import { getSupabaseConfigError, supabase } from "./supabaseClient";

export async function loadGlobalConfig() {
  if (!supabase) return { hijriDayOffset: 0 };
  const { data, error } = await supabase
    .from("global_config")
    .select("hijri_day_offset")
    .eq("id", 1)
    .single();

  if (error || !data) return { hijriDayOffset: 0 };
  return { hijriDayOffset: Number(data.hijri_day_offset) || 0 };
}

export async function saveGlobalConfig({ hijriDayOffset }) {
  if (!supabase) return { error: getSupabaseConfigError() || "Supabase not initialized" };

  const value = parseInt(hijriDayOffset, 10);
  if (isNaN(value)) return { error: "Offset must be an integer" };

  const { error } = await supabase
    .from("global_config")
    .upsert({ id: 1, hijri_day_offset: value, updated_at: new Date().toISOString() });

  if (error) return { error: error.message || "Failed to save config" };
  return { ok: true };
}
