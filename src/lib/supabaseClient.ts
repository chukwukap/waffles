// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js"; // Supabase client library
import { env } from "./env"; // Import environment variables

// --- Initialize Supabase Client ---
// Create a single Supabase client instance using environment variables.
// This instance can be imported and used throughout the application (both server and client).
export const supabase = createClient(
  env.nextPublicSupabaseUrl, // Supabase project URL (public) [cite: 1586]
  env.nextPublicSupabaseAnonKey, // Supabase anonymous key (public) [cite: 1586]
  {
    // Optional: Configure Realtime settings if used
    realtime: {
      params: {
        // eventsPerSecond: 10 // Example: Increase event rate if needed
      },
    },
    // Optional: Configure auth settings if using Supabase Auth
    // auth: {
    //     persistSession: true, // Default: true
    //     autoRefreshToken: true, // Default: true
    // }
  }
);

// Note: For server-side operations requiring admin privileges,
// you would typically create a separate service role client using
// process.env.SUPABASE_SERVICE_ROLE_KEY (do NOT expose this key to the client).
// Example (DO NOT USE IN CLIENT COMPONENTS):
// import { createClient as createAdminClient } from '@supabase/supabase-js';
// const supabaseAdmin = createAdminClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );
