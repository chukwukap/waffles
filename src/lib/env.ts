export const env = {
  rootUrl:
    "https://ddfd716973f5.ngrok-free.app" ||
    process.env.NEXT_PUBLIC_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),

  neynarApiKey: process.env.NEYNAR_API_KEY!,
  databaseUrl: process.env.DATABASE_URL!,
  nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL!,
  nextPublicOnchainkitApiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY!,
  waffleMainAddress: process.env.WAFFLE_MAIN_ADDRESS as `0x${string}`,
  nextPublicReceiverAddress: process.env
    .NEXT_PUBLIC_RECEIVER_ADDRESS! as `0x${string}`, // EOA receiving funds
  nextPublicUsdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS! as `0x${string}`, // Base USDC token address
  nextPublicLeaderboardPageSize:
    Number(process.env.NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE!) || 25,
  nextPublicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  nextPublicSupabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
};
