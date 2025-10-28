const resolveRootUrl = (): string => {
  const explicitUrl =
    process.env.NEXT_PUBLIC_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null;

  if (explicitUrl) {
    try {
      new URL(explicitUrl);
      return explicitUrl.replace(/\/$/, "");
    } catch {
      console.warn(
        `Invalid NEXT_PUBLIC_URL provided: ${explicitUrl}. Falling back...`
      );
    }
  }

  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
};

const parseLeaderboardPageSize = (): number => {
  const defaultSize = 25;
  const envValue =
    process.env.NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE ??
    process.env.LEADERBOARD_PAGE_SIZE;

  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    } else {
      console.warn(
        `Invalid LEADERBOARD_PAGE_SIZE provided: "${envValue}". Using default ${defaultSize}.`
      );
    }
  }
  return defaultSize;
};

export const env = {
  rootUrl: resolveRootUrl(),
  neynarApiKey: process.env.NEYNAR_API_KEY!,
  nextPublicOnchainkitApiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY!,
  waffleMainAddress: process.env
    .NEXT_PUBLIC_WAFFLE_MAIN_ADDRESS as `0x${string}`,
  nextPublicUsdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
  nextPublicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  nextPublicSupabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  nextPublicLeaderboardPageSize: parseLeaderboardPageSize(),
};

if (typeof window === "undefined") {
  if (!env.neynarApiKey) {
    console.error(
      "FATAL ERROR: NEYNAR_API_KEY environment variable is not set."
    );
  }
  if (!env.nextPublicOnchainkitApiKey) {
    console.error(
      "FATAL ERROR: NEXT_PUBLIC_ONCHAINKIT_API_KEY environment variable is not set."
    );
  }
  if (
    !env.waffleMainAddress ||
    !/^0x[a-fA-F0-9]{40}$/.test(env.waffleMainAddress)
  ) {
    console.error(
      `FATAL ERROR: NEXT_PUBLIC_WAFFLE_MAIN_ADDRESS is invalid or not set: "${env.waffleMainAddress}"`
    );
  }
  if (
    !env.nextPublicUsdcAddress ||
    !/^0x[a-fA-F0-9]{40}$/.test(env.nextPublicUsdcAddress)
  ) {
    console.error(
      `FATAL ERROR: NEXT_PUBLIC_USDC_ADDRESS is invalid or not set: "${env.nextPublicUsdcAddress}"`
    );
  }
  if (
    !env.nextPublicSupabaseUrl ||
    !env.nextPublicSupabaseUrl.startsWith("http")
  ) {
    console.error(
      `FATAL ERROR: NEXT_PUBLIC_SUPABASE_URL is invalid or not set: "${env.nextPublicSupabaseUrl}"`
    );
  }
  if (!env.nextPublicSupabaseAnonKey) {
    console.error(
      "FATAL ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not set."
    );
  }
}
