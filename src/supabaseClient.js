import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function getSupabaseConfigError() {
  if (supabase) return "";
  if (!supabaseUrl && !supabaseAnonKey) {
    return "Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY";
  }
  if (!supabaseUrl) return "Missing VITE_SUPABASE_URL";
  if (!supabaseAnonKey) return "Missing VITE_SUPABASE_ANON_KEY";
  return "Invalid Supabase configuration";
}


