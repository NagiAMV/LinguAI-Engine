import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl) {
  throw new Error("Missing env variable: NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing env variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

if (supabaseUrl.includes("your-project-id")) {
  throw new Error("Replace NEXT_PUBLIC_SUPABASE_URL in .env.local with your real Supabase Project URL");
}

if (supabaseAnonKey.includes("your-supabase-anon-key")) {
  throw new Error("Replace NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local with your real Supabase anon key");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
