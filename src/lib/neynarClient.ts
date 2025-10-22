// /src/lib/neynarClient.ts
import NeynarAPIClient from "@neynar/nodejs-sdk";

export const neynar = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY!,
});
