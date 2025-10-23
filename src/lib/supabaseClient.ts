// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export const supabase = createClient(
  env.nextPublicSupabaseUrl,
  env.nextPublicSupabaseAnonKey,
  {
    realtime: { params: { eventsPerSecond: 1 } },
  }
);
