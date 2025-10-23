export const env = {
  rootUrl:
    "https://ddfd716973f5.ngrok-free.app" ||
    process.env.NEXT_PUBLIC_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),

  // server keys
  neynarApiKey: process.env.NEYNAR_API_KEY!,

  // client keys
  nextPublicOnchainkitApiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY!,
  waffleMainAddress: process.env
    .NEXT_PUBLIC_WAFFLE_MAIN_ADDRESS as `0x${string}`,
  nextPublicUsdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS! as `0x${string}`, // Base USDC token address
  nextPublicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  nextPublicSupabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
};
