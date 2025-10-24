const resolveRootUrl = (): string => {
  const explicit =
    process.env.NEXT_PUBLIC_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null;

  const vercelProject = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null;

  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;

  return explicit || vercelProject || vercelUrl || "http://localhost:3000";
};

export const env = {
  rootUrl: resolveRootUrl(),

  // server keys
  neynarApiKey: process.env.NEYNAR_API_KEY!,

  // client keys
  nextPublicOnchainkitApiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY!,
  waffleMainAddress: process.env
    .NEXT_PUBLIC_WAFFLE_MAIN_ADDRESS as `0x${string}`,
  nextPublicUsdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS! as `0x${string}`, // Base USDC token address
  nextPublicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  nextPublicSupabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  nextPublicLeaderboardPageSize:
    Number.parseInt(
      process.env.NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE ??
        process.env.LEADERBOARD_PAGE_SIZE ??
        "25",
      10
    ) || 25,
};
