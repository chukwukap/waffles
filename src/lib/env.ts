export const env = {
  neynarApiKey: process.env.NEYNAR_API_KEY!,
  databaseUrl: process.env.DATABASE_URL!,
  nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL!,
  nextPublicOnchainkitApiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY!,
  farcasterHeader: process.env.FARCASTER_HEADER!,
  farcasterPayload: process.env.FARCASTER_PAYLOAD!,
  farcasterSignature: process.env.FARCASTER_SIGNATURE!,
  farcasterHeroImageUrl: process.env.FARCASTER_HERO_IMAGE_URL!,
  waffleMainAddress: process.env.WAFFLE_MAIN_ADDRESS as `0x${string}`,
};
