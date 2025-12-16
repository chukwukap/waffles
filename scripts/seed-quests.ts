#!/usr/bin/env tsx

/**
 * Quest Seed Script
 *
 * Seeds the initial quests from the old hardcoded list.
 * Run: pnpm tsx scripts/seed-quests.ts
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";

async function seedQuests() {
  console.log("🌱 Seeding quests...");

  const quests = [
    {
      slug: "join-discord-general",
      title: "Join Discord Community",
      description: "Join our Discord server and say hi in #general",
      iconUrl: "/images/icons/discord.png",
      category: "SOCIAL" as const,
      points: 100,
      type: "LINK" as const,
      actionUrl: "https://discord.com/invite/F69CaAqVN",
      sortOrder: 1,
    },
    {
      slug: "follow-playwaffles-twitter",
      title: "Follow on X",
      description: "Follow @playwaffles on X",
      iconUrl: "/images/icons/x.png",
      category: "SOCIAL" as const,
      points: 50,
      type: "LINK" as const,
      actionUrl: "https://x.com/playwaffles",
      sortOrder: 2,
    },
    {
      slug: "retweet-playwaffles-launch-post",
      title: "Retweet Launch Post",
      description: "RT our pinned tweet about Waffles",
      iconUrl: "/images/icons/x.png",
      category: "SOCIAL" as const,
      points: 75,
      type: "LINK" as const,
      actionUrl: "https://x.com/thecyberverse1/status/1995546518887989641?s=20",
      sortOrder: 3,
    },
    {
      slug: "follow-wafflesdotfun-farcaster",
      title: "Follow on Farcaster",
      description: "Follow @wafflesdotfun on Farcaster",
      iconUrl: "/images/icons/farcaster.png",
      category: "SOCIAL" as const,
      points: 50,
      type: "FARCASTER_FOLLOW" as const,
      actionUrl: "https://warpcast.com/wafflesdotfun",
      sortOrder: 4,
    },
    {
      slug: "recast-waitlist-launch",
      title: "Recast Waitlist Launch Post",
      description: "Recast our waitlist launch post",
      iconUrl: "/images/icons/farcaster.png",
      category: "SOCIAL" as const,
      points: 75,
      type: "FARCASTER_RECAST" as const,
      castHash: "0x977440e4a6342d22b39c51ae307fdf9dfbd7d2a0",
      sortOrder: 5,
    },
    {
      slug: "share-waitlist-farcaster",
      title: "Cast About Waffles",
      description:
        "Share something about waffles on Farcaster and tag @wafflesdotfun",
      iconUrl: "/images/icons/farcaster.png",
      category: "SOCIAL" as const,
      points: 100,
      type: "FARCASTER_CAST" as const,
      sortOrder: 6,
    },
    {
      slug: "invite-three-friends",
      title: "Invite Friends",
      description: "Get 3 friends to join the waitlist",
      iconUrl: "/images/icons/invite.png",
      category: "REFERRAL" as const,
      points: 200,
      type: "REFERRAL" as const,
      requiredCount: 3,
      sortOrder: 7,
    },
  ];

  for (const quest of quests) {
    await prisma.quest.upsert({
      where: { slug: quest.slug },
      create: quest,
      update: quest,
    });
    console.log(`  ✅ ${quest.title}`);
  }

  console.log("\n🎉 Quest seeding complete!");
  console.log(`   Total quests: ${quests.length}`);
}

seedQuests()
  .catch((e) => {
    console.error("Error seeding quests:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
