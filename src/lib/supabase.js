import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

const hasPlaceholderUrl = supabaseUrl?.includes("your-project-id");
const hasPlaceholderKey = supabaseAnonKey?.includes("your-supabase-anon-key");
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
    : !hasValidUrl
      ? "NEXT_PUBLIC_SUPABASE_URL must be a valid http or https URL."
      : hasPlaceholderUrl || hasPlaceholderKey
        ? "Replace the placeholder Supabase credentials in .env.local."
        : null;

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey);
