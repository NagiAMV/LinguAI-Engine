import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

const hasPlaceholderUrl = supabaseUrl?.includes("your-project-id");
const hasPlaceholderKey = supabaseAnonKey?.includes("your-supabase-anon-key");
let hasSecretKey = supabaseAnonKey?.startsWith('sb_secret_');
try {
  if (supabaseAnonKey?.startsWith('eyJ')) hasSecretKey ||= JSON.parse(atob(supabaseAnonKey.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role';
} catch { /* An invalid public key will be rejected by the Auth service. */ }
let hasValidUrl = false;

try {
  const parsedUrl = new URL(supabaseUrl || "");
  hasValidUrl =
    parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
} catch {
  hasValidUrl = false;
}

export const supabaseConfigError = !supabaseUrl
  ? "Missing NEXT_PUBLIC_SUPABASE_URL in .env.local."
  : !supabaseAnonKey
    ? "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    : hasSecretKey
      ? 'Use a publishable or anon key, never a secret/service-role key in public settings.'
    : !hasValidUrl
      ? "NEXT_PUBLIC_SUPABASE_URL must be a valid http or https URL."
      : hasPlaceholderUrl || hasPlaceholderKey
        ? "Replace the placeholder Supabase credentials in .env.local."
        : null;

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
    });
