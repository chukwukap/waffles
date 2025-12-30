/**
 * Database Migration Script: Supabase → Railway
 *
 * Transforms old schema to new schema while preserving all user state.
 *
 * Run with: npx tsx scripts/migrate-db.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client";
import pg from "pg";

// ==========================================
// CONFIGURATION
// ==========================================

// Use port 6543 for direct connection (bypasses pgbouncer to avoid timeout)
const SUPABASE_URL = process.env.SUPABASE_DATABASE_URL;

const RAILWAY_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_DATABASE_URL must be set");
}

if (!RAILWAY_URL) {
  throw new Error("DATABASE_URL (Railway) must be set");
}

// ==========================================
// OLD SCHEMA TYPES (Supabase)
// ==========================================

interface OldUser {
  id: number;
  wallet: string | null;
  createdAt: Date;
  updatedAt: Date;
  fid: number;
  inviteCode: string;
  inviteQuota: number;
  referredById: number | null;
  pfpUrl: string | null;
  status: "NONE" | "WAITLIST" | "ACTIVE";
  username: string | null;
  completedTasks: string[]; // Old format: array of task slugs
  role: "USER" | "ADMIN";
  password: string | null;
  waitlistPoints: number;
}

interface OldGame {
  id: number;
  title: string;
  createdAt: Date;
  endsAt: Date;
  roundBreakSec: number;
  maxPlayers: number;
  prizePool: number;
  playerCount: number;
  durationSec: number;
  startsAt: Date;
  status: string;
  theme: string;
  description: string | null;
  updatedAt: Date;
  coverUrl: string | null;
}

interface OldQuestion {
  id: number;
  gameId: number;
  options: string[];
  createdAt: Date;
  soundUrl: string | null;
  content: string;
  correctIndex: number;
  durationSec: number;
  mediaUrl: string | null;
  roundIndex: number;
  updatedAt: Date;
  orderInRound: number;
}

interface OldGameEntry {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  gameId: number;
  score: number;
  answered: number;
  rank: number | null;
  userId: number;
  paidAt: Date | null;
  leftAt: Date | null;
  prize: number | null;
  claimedAt: Date | null;
  txHash: string | null;
  paidAmount: number | null;
  answers: Record<string, unknown>;
}

interface OldChat {
  id: number;
  gameId: number;
  userId: number;
  message: string;
  sentAt: Date;
}

// ==========================================
// TASK SLUG TO NEW QUEST SLUG MAPPING
// ==========================================

// Maps old completedTasks slugs (with underscores) to new Quest slugs (with hyphens)
const OLD_TO_NEW_SLUG: Record<string, string> = {
  join_discord_general: "join-discord-general",
  follow_playwaffles_twitter: "follow-playwaffles-twitter",
  retweet_playwaffles_launch_post: "retweet-playwaffles-launch-post",
  follow_wafflesdotfun_farcaster: "follow-wafflesdotfun-farcaster",
  share_waitlist_farcaster: "share-waitlist-farcaster",
  recast_waitlist_launch: "recast-waitlist-launch",
};

// ==========================================
// MIGRATION
// ==========================================

async function migrate() {
  console.log("🚀 Starting migration from Supabase to Railway...\n");

  // Connect to Supabase
  const supabaseClient = new pg.Client({ connectionString: SUPABASE_URL });
  await supabaseClient.connect();
  console.log("✅ Connected to Supabase");

  // Connect to Railway via Prisma
  const adapter = new PrismaPg({ connectionString: RAILWAY_URL! });
  const prisma = new PrismaClient({ adapter });
  console.log("✅ Connected to Railway\n");

  try {
    // ==========================================
    // 1. MIGRATE USERS (skip if already done)
    // ==========================================
    const SKIP_USERS = true; // Set to false if you need to re-migrate users

    const usersResult = await supabaseClient.query<OldUser>(`
      SELECT * FROM public."User" ORDER BY id ASC
    `);
    const oldUsers = usersResult.rows;
    console.log(`📦 Found ${oldUsers.length} users in Supabase`);

    if (SKIP_USERS) {
      console.log("   ⏭️  Skipping user migration (already done)\n");
    } else {
      console.log("   Migrating users...");

      // Disable FK checks
      await prisma.$executeRawUnsafe(
        `SET session_replication_role = 'replica'`
      );

      for (const oldUser of oldUsers) {
        // Transform status to boolean flags
        const hasGameAccess = oldUser.status === "ACTIVE";
        const accessGrantedAt = hasGameAccess ? oldUser.updatedAt : null;

        try {
          await prisma.$executeRaw`
            INSERT INTO "User" (
              id, fid, username, "pfpUrl", wallet, role, password,
              "referredById", "inviteCode", "inviteQuota",
              "hasGameAccess", "accessGrantedAt", "accessGrantedBy",
              "isBanned", "bannedAt", "bannedBy",
              "joinedWaitlistAt", "waitlistPoints", "waitlistRank",
              "createdAt", "updatedAt"
            ) VALUES (
              ${oldUser.id},
              ${oldUser.fid},
              ${oldUser.username},
              ${oldUser.pfpUrl},
              ${oldUser.wallet},
              ${oldUser.role}::"UserRole",
              ${oldUser.password},
              ${oldUser.referredById},
              ${oldUser.inviteCode},
              ${oldUser.inviteQuota},
              ${hasGameAccess},
              ${accessGrantedAt},
              ${null},
              ${false},
              ${null},
              ${null},
              ${oldUser.status !== "NONE" ? oldUser.createdAt : null},
              ${oldUser.waitlistPoints},
              ${null},
              ${oldUser.createdAt},
              ${oldUser.updatedAt}
            )
            ON CONFLICT (id) DO NOTHING
          `;
        } catch (err) {
          console.error(`   ⚠️ Failed to insert user ${oldUser.id}: ${err}`);
        }
      }

      // Reset sequence
      const maxUserId = Math.max(...oldUsers.map((u) => u.id));
      await prisma.$executeRawUnsafe(
        `SELECT setval('"User_id_seq"', ${maxUserId}, true)`
      );
      console.log(`   ✅ Migrated ${oldUsers.length} users\n`);
    }

    // ==========================================
    // 2. MIGRATE COMPLETED TASKS → COMPLETED QUESTS
    // ==========================================
    console.log("📦 Migrating Completed Tasks to Quests...");

    // Check if quests exist (must run seed-quests.ts first)
    const questCount = await prisma.quest.count();
    if (questCount === 0) {
      console.error(
        "   ❌ No quests found! Run 'npx tsx scripts/seed-quests.ts' first."
      );
      throw new Error("Quests must be seeded before migration");
    }
    console.log(`   Found ${questCount} quests in target DB`);

    // Now migrate completed tasks
    // First, load quests from DB to get their IDs
    const quests = await prisma.quest.findMany({
      select: { id: true, slug: true },
    });
    const slugToId = new Map(quests.map((q) => [q.slug, q.id]));
    console.log(`   Found ${quests.length} quests in target DB`);

    let completedQuestCount = 0;
    for (const user of oldUsers) {
      if (!user.completedTasks || user.completedTasks.length === 0) continue;

      for (const taskSlug of user.completedTasks) {
        const newSlug = OLD_TO_NEW_SLUG[taskSlug];
        if (!newSlug) {
          console.log(`   ⚠️ Unknown task slug: ${taskSlug}`);
          continue;
        }

        const questId = slugToId.get(newSlug);
        if (!questId) {
          console.log(`   ⚠️ Quest not found for slug: ${newSlug}`);
          continue;
        }

        try {
          await prisma.$executeRaw`
            INSERT INTO "CompletedQuest" (
              "userId", "questId", "completedAt", "pointsAwarded", "isApproved"
            ) VALUES (
              ${user.id},
              ${questId},
              ${user.updatedAt},
              ${0},
              ${true}
            )
            ON CONFLICT ("userId", "questId") DO NOTHING
          `;
          completedQuestCount++;
        } catch (err) {
          // Ignore duplicates
        }
      }
    }
    console.log(`   ✅ Migrated ${completedQuestCount} completed quests\n`);

    // Re-enable FK checks
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin'`);

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log("🎉 Migration complete!");
    console.log("   Summary:");
    console.log(`   - Users: ${oldUsers.length}`);
    console.log(`   - Completed Quests: ${completedQuestCount}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await supabaseClient.end();
    await prisma.$disconnect();
  }
}

// Run migration
migrate().catch(console.error);
