import { env } from "@/lib/env";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

if (!env.neynarApiKey) {
  console.error(
    "FATAL ERROR: NEYNAR_API_KEY is not configured in environment variables. Neynar client cannot be initialized."
  );
}

export const neynar = new NeynarAPIClient({
  apiKey: env.neynarApiKey,
});
