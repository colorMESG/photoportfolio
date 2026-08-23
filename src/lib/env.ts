/**
 * Browser-safe environment access.
 *
 * Only the Supabase URL and anon key are exposed to the client. The anon key is
 * public by design; Row Level Security is what protects the data. The service
 * role key must never be read here or given a VITE_ prefix.
 */

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export const supabaseUrl = url;
export const supabaseAnonKey = anonKey;

/**
 * False when either variable is missing, which is the normal state for a fresh
 * clone. The public site must stay fully renderable from static content in that
 * case, so callers treat this as "use the static fallback" rather than an error.
 */
export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;
