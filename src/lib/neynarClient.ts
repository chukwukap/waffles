import { env } from "@/lib/env";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

export const neynar = new NeynarAPIClient({
  apiKey: env.neynarApiKey,
});
