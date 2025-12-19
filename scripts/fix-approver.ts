/**
 * Fix Missing Users and Set ApprovedBy
 *
 * Run: npx tsx scripts/fix-approver.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client";

// chukwukauba user id (has fid 755074)
const APPROVER_USER_ID = 5;

async function fixApprover() {
  console.log("🔧 Fixing missing users and approvedBy...\n");

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Add missing users 727 and 728
    console.log("📦 Adding missing users...");

    // User 727
    try {
      await prisma.user.create({
        data: {
          id: 727,
          fid: 1471054,
          username: "lauraether",
          pfpUrl:
            "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/3355c5ea-0758-45ef-a113-a13f89be1500/rectcontain2",
          wallet: "0x7d355c255c56DB7c3Ff1eE37A4b26e4E87390122",
          inviteCode: "5X4VE6",
          inviteQuota: 3,
          hasGameAccess: false,
          joinedWaitlistAt: new Date("2025-12-14 16:59:55.844"),
          waitlistPoints: 450,
          createdAt: new Date("2025-12-14 16:59:55.844"),
          updatedAt: new Date("2025-12-14 17:05:01.72"),
        },
      });
      console.log("   ✅ Added user 727 (lauraether)");
    } catch (e: any) {
      if (e.message?.includes("Unique constraint")) {
        console.log("   ⏭️  User 727 already exists");
      } else {
        console.log(`   ⚠️ Failed to add user 727: ${e.message}`);
      }
    }

    // User 728
    try {
      await prisma.user.create({
        data: {
          id: 728,
          fid: 1137974,
          username: "ayaayabyte",
          pfpUrl:
            "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/5a2717bd-8a5e-4596-12ba-67e920d4f600/original",
          wallet: null,
          inviteCode: "FKKAMR",
          inviteQuota: 3,
          hasGameAccess: false,
          joinedWaitlistAt: new Date("2025-12-16 02:06:22.262"),
          waitlistPoints: 350,
          createdAt: new Date("2025-12-16 02:06:22.262"),
          updatedAt: new Date("2025-12-16 02:10:14.63"),
        },
      });
      console.log("   ✅ Added user 728 (ayaayabyte)");
    } catch (e: any) {
      if (e.message?.includes("Unique constraint")) {
        console.log("   ⏭️  User 728 already exists");
      } else {
        console.log(`   ⚠️ Failed to add user 728: ${e.message}`);
      }
    }

    // 2. Check if approver user exists
    console.log("\n📦 Checking approver user...");
    const approver = await prisma.user.findUnique({
      where: { id: APPROVER_USER_ID },
      select: { id: true, username: true },
    });

    if (!approver) {
      console.log(`   ❌ Approver user ${APPROVER_USER_ID} not found!`);
      return;
    }
    console.log(
      `   ✅ Found approver: ${approver.username} (id: ${approver.id})`
    );

    // 3. Update all CompletedQuest records to set approvedBy
    console.log("\n📦 Updating CompletedQuest approvedBy...");
    const result = await prisma.completedQuest.updateMany({
      where: { approvedBy: null },
      data: { approvedBy: APPROVER_USER_ID },
    });
    console.log(`   ✅ Updated ${result.count} records`);

    // 4. Add CompletedQuest records for users 727 and 728
    console.log("\n📦 Adding CompletedQuest for users 727 and 728...");

    const quests = await prisma.quest.findMany({
      select: { id: true, slug: true, points: true },
    });
    const slugToQuest = new Map(quests.map((q) => [q.slug, q]));

    const OLD_TO_NEW_SLUG: Record<string, string> = {
      join_discord_general: "join-discord-general",
      follow_playwaffles_twitter: "follow-playwaffles-twitter",
      retweet_playwaffles_launch_post: "retweet-playwaffles-launch-post",
      follow_wafflesdotfun_farcaster: "follow-wafflesdotfun-farcaster",
      share_waitlist_farcaster: "share-waitlist-farcaster",
      recast_waitlist_launch: "recast-waitlist-launch",
    };

    const usersToAdd = [
      {
        id: 727,
        tasks: [
          "join_discord_general",
          "follow_playwaffles_twitter",
          "retweet_playwaffles_launch_post",
          "follow_wafflesdotfun_farcaster",
          "recast_waitlist_launch",
          "share_waitlist_farcaster",
        ],
        updatedAt: new Date("2025-12-14 17:05:01.72"),
      },
      {
        id: 728,
        tasks: [
          "follow_playwaffles_twitter",
          "join_discord_general",
          "retweet_playwaffles_launch_post",
          "follow_wafflesdotfun_farcaster",
          "recast_waitlist_launch",
        ],
        updatedAt: new Date("2025-12-16 02:10:14.63"),
      },
    ];

    for (const user of usersToAdd) {
      for (const taskSlug of user.tasks) {
        const newSlug = OLD_TO_NEW_SLUG[taskSlug];
        const quest = slugToQuest.get(newSlug);
        if (!quest) continue;

        try {
          await prisma.completedQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              completedAt: user.updatedAt,
              pointsAwarded: quest.points,
              isApproved: true,
              approvedBy: APPROVER_USER_ID,
              approvedAt: user.updatedAt,
            },
          });
        } catch (e: any) {
          // Ignore duplicates
        }
      }
      console.log(`   ✅ Added quests for user ${user.id}`);
    }

    console.log("\n🎉 All done!");
  } finally {
    await prisma.$disconnect();
  }
}

fixApprover().catch(console.error);
