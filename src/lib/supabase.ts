import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const supabase = createClient(
  env.nextPublicSupabaseUrl,
  env.nextPublicSupabaseAnonKey
);
