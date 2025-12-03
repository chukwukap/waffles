import { z } from "zod";

const isServer = typeof window === "undefined";

const envSchema = z.object({
  // Server-only (optional on client, required on server)
  NEYNAR_API_KEY: isServer
    ? z.string().min(1, "NEYNAR_API_KEY is required")
    : z.string().optional(),

  // Client
  NEXT_PUBLIC_ONCHAINKIT_API_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_ONCHAINKIT_API_KEY is required"),
  NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE: z.coerce
    .number()
    .int()
    .positive()
    .default(25),
  NEXT_PUBLIC_TREASURY_WALLET: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Treasury Wallet address")
    .optional(), // Optional because we provide a default in getEnv
  NEXT_PUBLIC_HOME_URL_PATH: z.string().default("/waitlist"),

  // Account Association (optional for development)
  NEXT_PUBLIC_ACCOUNT_ASSOCIATION_HEADER: z.string().optional(),
  NEXT_PUBLIC_ACCOUNT_ASSOCIATION_PAYLOAD: z.string().optional(),
  NEXT_PUBLIC_ACCOUNT_ASSOCIATION_SIGNATURE: z.string().optional(),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // URLs
  NEXT_PUBLIC_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
});

const getEnv = () => {
  const parsed = envSchema.safeParse({
    NEYNAR_API_KEY: process.env.NEYNAR_API_KEY,
    NEXT_PUBLIC_ONCHAINKIT_API_KEY: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
    NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE:
      process.env.NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE,
    NEXT_PUBLIC_HOME_URL_PATH: process.env.NEXT_PUBLIC_HOME_URL_PATH,
    NEXT_PUBLIC_ACCOUNT_ASSOCIATION_HEADER:
      process.env.NEXT_PUBLIC_ACCOUNT_ASSOCIATION_HEADER,
    NEXT_PUBLIC_ACCOUNT_ASSOCIATION_PAYLOAD:
      process.env.NEXT_PUBLIC_ACCOUNT_ASSOCIATION_PAYLOAD,
    NEXT_PUBLIC_ACCOUNT_ASSOCIATION_SIGNATURE:
      process.env.NEXT_PUBLIC_ACCOUNT_ASSOCIATION_SIGNATURE,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });

  if (!parsed.success) {
    // Only log on server to avoid exposing errors to client
    if (typeof window === "undefined") {
      console.error(
        "❌ Invalid environment variables:",
        JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
      );
      throw new Error("Invalid environment variables");
    } else {
      // On client, just log to console but don't crash
      console.warn(
        "⚠️ Environment validation failed (non-fatal on client):",
        parsed.error.flatten().fieldErrors
      );
      // Return defaults for client
      return {
        rootUrl: "http://localhost:3000",
        neynarApiKey: "",
        nextPublicOnchainkitApiKey:
          process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || "",
        nextPublicLeaderboardPageSize: 25,
        homeUrlPath: "/waitlist",
        nextPublicTreasuryWallet: (process.env.NEXT_PUBLIC_TREASURY_WALLET ||
          "0xd584F8079192E078F0f3237622345E19360384A2") as `0x${string}`,
        accountAssociation: {
          header: undefined,
          payload: undefined,
          signature: undefined,
        },
        nextPublicSupabaseUrl: "",
        nextPublicSupabaseAnonKey: "",
      };
    }
  }

  const data = parsed.data;

  const resolveRootUrl = () => {
    if (data.NEXT_PUBLIC_URL) return data.NEXT_PUBLIC_URL;
    if (data.NEXT_PUBLIC_APP_URL) return data.NEXT_PUBLIC_APP_URL;
    if (
      data.VERCEL_ENV === "production" &&
      data.VERCEL_PROJECT_PRODUCTION_URL
    ) {
      return `https://${data.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    if (data.VERCEL_URL) return `https://${data.VERCEL_URL}`;
    return "http://localhost:3000";
  };

  return {
    rootUrl: resolveRootUrl().replace(/\/$/, ""),
    neynarApiKey: data.NEYNAR_API_KEY!,
    nextPublicOnchainkitApiKey: data.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
    nextPublicLeaderboardPageSize: data.NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE,
    homeUrlPath: data.NEXT_PUBLIC_HOME_URL_PATH,
    nextPublicTreasuryWallet: (process.env.NEXT_PUBLIC_TREASURY_WALLET ||
      "0xd584F8079192E078F0f3237622345E19360384A2") as `0x${string}`, // Default to demo wallet if missing
    accountAssociation: {
      header: data.NEXT_PUBLIC_ACCOUNT_ASSOCIATION_HEADER,
      payload: data.NEXT_PUBLIC_ACCOUNT_ASSOCIATION_PAYLOAD,
      signature: data.NEXT_PUBLIC_ACCOUNT_ASSOCIATION_SIGNATURE,
    },
    nextPublicSupabaseUrl: data.NEXT_PUBLIC_SUPABASE_URL,
    nextPublicSupabaseAnonKey: data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
};

export const env = getEnv();
