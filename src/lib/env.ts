import { z } from "zod";

const isServer = typeof window === "undefined";

const envSchema = z.object({
  // Server-only (optional on client, required on server)
  NEYNAR_API_KEY: isServer
    ? z.string().min(1, "NEYNAR_API_KEY is required")
    : z.string().optional(),

  // Database
  DATABASE_URL: isServer
    ? z.string().min(1, "DATABASE_URL is required")
    : z.string().optional(),

  // Settlement (server-only, optional - only needed for admin)
  SETTLEMENT_PRIVATE_KEY: z.string().optional(),

  // PartyKit
  PARTYKIT_SECRET: isServer
    ? z.string().min(1, "PARTYKIT_SECRET is required")
    : z.string().optional(),
  NEXT_PUBLIC_PARTYKIT_HOST: z
    .string()
    .min(1, "NEXT_PUBLIC_PARTYKIT_HOST is required"),

  // Cloudinary (media storage with public URLs)
  CLOUDINARY_CLOUD_NAME: isServer
    ? z.string().min(1, "CLOUDINARY_CLOUD_NAME is required")
    : z.string().optional(),
  CLOUDINARY_API_KEY: isServer
    ? z.string().min(1, "CLOUDINARY_API_KEY is required")
    : z.string().optional(),
  CLOUDINARY_API_SECRET: isServer
    ? z.string().min(1, "CLOUDINARY_API_SECRET is required")
    : z.string().optional(),

  // Test Mode
  NEXT_PUBLIC_TEST_MODE: z
    .enum(["true", "false", ""])
    .optional()
    .transform((val) => val === "true"),

  // Client
  NEXT_PUBLIC_ONCHAINKIT_API_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_ONCHAINKIT_API_KEY is required"),
  NEXT_PUBLIC_BASE_BUILDER_CODE: z.string().optional(),
  NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE: z.coerce
    .number()
    .int()
    .positive()
    .default(25),
  NEXT_PUBLIC_TREASURY_WALLET: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Treasury Wallet address")
    .optional(),
  NEXT_PUBLIC_HOME_URL_PATH: z
    .string()
    .min(1, "NEXT_PUBLIC_HOME_URL_PATH is required"),

  // Account Association (optional for development)
  NEXT_PUBLIC_ACCOUNT_ASSOCIATION_HEADER: z.string().optional(),
  NEXT_PUBLIC_ACCOUNT_ASSOCIATION_PAYLOAD: z.string().optional(),
  NEXT_PUBLIC_ACCOUNT_ASSOCIATION_SIGNATURE: z.string().optional(),

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
    DATABASE_URL: process.env.DATABASE_URL,
    SETTLEMENT_PRIVATE_KEY: process.env.SETTLEMENT_PRIVATE_KEY,
    PARTYKIT_SECRET: process.env.PARTYKIT_SECRET,
    NEXT_PUBLIC_PARTYKIT_HOST: process.env.NEXT_PUBLIC_PARTYKIT_HOST,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    NEXT_PUBLIC_TEST_MODE: process.env.NEXT_PUBLIC_TEST_MODE,
    NEXT_PUBLIC_ONCHAINKIT_API_KEY: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
    NEXT_PUBLIC_BASE_BUILDER_CODE: process.env.NEXT_PUBLIC_BASE_BUILDER_CODE,
    NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE:
      process.env.NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE,
    NEXT_PUBLIC_TREASURY_WALLET: process.env.NEXT_PUBLIC_TREASURY_WALLET,
    NEXT_PUBLIC_HOME_URL_PATH: process.env.NEXT_PUBLIC_HOME_URL_PATH,
    NEXT_PUBLIC_ACCOUNT_ASSOCIATION_HEADER:
      process.env.NEXT_PUBLIC_ACCOUNT_ASSOCIATION_HEADER,
    NEXT_PUBLIC_ACCOUNT_ASSOCIATION_PAYLOAD:
      process.env.NEXT_PUBLIC_ACCOUNT_ASSOCIATION_PAYLOAD,
    NEXT_PUBLIC_ACCOUNT_ASSOCIATION_SIGNATURE:
      process.env.NEXT_PUBLIC_ACCOUNT_ASSOCIATION_SIGNATURE,
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
        databaseUrl: "",
        settlementPrivateKey: undefined,
        partykitSecret: "",
        partykitHost: "",
        cloudinaryCloudName: "",
        cloudinaryApiKey: "",
        cloudinaryApiSecret: "",
        isTestMode: false,
        nextPublicOnchainkitApiKey: "",
        nextPublicBaseBuilderCode: undefined,
        nextPublicLeaderboardPageSize: 25,
        homeUrlPath: "",
        nextPublicTreasuryWallet:
          "0xd584F8079192E078F0f3237622345E19360384A2" as `0x${string}`,
        accountAssociation: {
          header: undefined,
          payload: undefined,
          signature: undefined,
        },
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
    // Database
    databaseUrl: data.DATABASE_URL,
    // Settlement
    settlementPrivateKey: data.SETTLEMENT_PRIVATE_KEY,
    // PartyKit
    partykitSecret: data.PARTYKIT_SECRET,
    partykitHost: data.NEXT_PUBLIC_PARTYKIT_HOST,
    // Cloudinary (media storage with public URLs)
    cloudinaryCloudName: data.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: data.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: data.CLOUDINARY_API_SECRET,
    // Test Mode
    isTestMode: data.NEXT_PUBLIC_TEST_MODE,
    // Client-side
    nextPublicOnchainkitApiKey: data.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
    nextPublicBaseBuilderCode: data.NEXT_PUBLIC_BASE_BUILDER_CODE,
    nextPublicLeaderboardPageSize: data.NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE,
    homeUrlPath: data.NEXT_PUBLIC_HOME_URL_PATH,
    nextPublicTreasuryWallet: (data.NEXT_PUBLIC_TREASURY_WALLET ||
      "0xd584F8079192E078F0f3237622345E19360384A2") as `0x${string}`,
    accountAssociation: {
      header: data.NEXT_PUBLIC_ACCOUNT_ASSOCIATION_HEADER,
      payload: data.NEXT_PUBLIC_ACCOUNT_ASSOCIATION_PAYLOAD,
      signature: data.NEXT_PUBLIC_ACCOUNT_ASSOCIATION_SIGNATURE,
    },
  };
};

export const env = getEnv();
