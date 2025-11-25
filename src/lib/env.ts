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
  NEXT_PUBLIC_WAFFLE_MAIN_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
  NEXT_PUBLIC_USDC_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid USDC address"),
  NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE: z.coerce
    .number()
    .int()
    .positive()
    .default(25),

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

  // Coinbase Commerce (server-only)
  COINBASE_COMMERCE_API_KEY: isServer
    ? z.string().min(1, "COINBASE_COMMERCE_API_KEY is required")
    : z.string().optional(),
  COINBASE_COMMERCE_WEBHOOK_SECRET: isServer
    ? z.string().min(1, "COINBASE_COMMERCE_WEBHOOK_SECRET is required")
    : z.string().optional(),

  // Payout Wallet (server-only)
  PAYOUT_WALLET_PRIVATE_KEY: isServer
    ? z
        .string()
        .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid private key format")
        .optional()
    : z.string().optional(),
});

const getEnv = () => {
  const parsed = envSchema.safeParse({
    NEYNAR_API_KEY: process.env.NEYNAR_API_KEY,
    NEXT_PUBLIC_ONCHAINKIT_API_KEY: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
    NEXT_PUBLIC_WAFFLE_MAIN_ADDRESS:
      process.env.NEXT_PUBLIC_WAFFLE_MAIN_ADDRESS,
    NEXT_PUBLIC_USDC_ADDRESS: process.env.NEXT_PUBLIC_USDC_ADDRESS,
    NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE:
      process.env.NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE,
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
    COINBASE_COMMERCE_API_KEY: process.env.COINBASE_COMMERCE_API_KEY,
    COINBASE_COMMERCE_WEBHOOK_SECRET:
      process.env.COINBASE_COMMERCE_WEBHOOK_SECRET,
    PAYOUT_WALLET_PRIVATE_KEY: process.env.PAYOUT_WALLET_PRIVATE_KEY,
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
        nextPublicAppUrl: "http://localhost:3000",
        neynarApiKey: "",
        nextPublicOnchainkitApiKey:
          process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || "",
        waffleMainAddress: (process.env.NEXT_PUBLIC_WAFFLE_MAIN_ADDRESS ||
          "") as `0x${string}`,
        nextPublicUsdcAddress: (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
          "") as `0x${string}`,
        nextPublicLeaderboardPageSize: 25,
        accountAssociation: {
          header: undefined,
          payload: undefined,
          signature: undefined,
        },
        coinbaseCommerceApiKey: "",
        coinbaseCommerceWebhookSecret: "",
        payoutWalletPrivateKey: undefined,
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
    nextPublicAppUrl: resolveRootUrl().replace(/\/$/, ""),
    neynarApiKey: data.NEYNAR_API_KEY!,
    nextPublicOnchainkitApiKey: data.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
    waffleMainAddress: data.NEXT_PUBLIC_WAFFLE_MAIN_ADDRESS as `0x${string}`,
    nextPublicUsdcAddress: data.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
    nextPublicLeaderboardPageSize: data.NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE,
    accountAssociation: {
      header: data.NEXT_PUBLIC_ACCOUNT_ASSOCIATION_HEADER,
      payload: data.NEXT_PUBLIC_ACCOUNT_ASSOCIATION_PAYLOAD,
      signature: data.NEXT_PUBLIC_ACCOUNT_ASSOCIATION_SIGNATURE,
    },
    coinbaseCommerceApiKey: data.COINBASE_COMMERCE_API_KEY || "",
    coinbaseCommerceWebhookSecret: data.COINBASE_COMMERCE_WEBHOOK_SECRET || "",
    payoutWalletPrivateKey: data.PAYOUT_WALLET_PRIVATE_KEY,
  };
};

export const env = getEnv();
