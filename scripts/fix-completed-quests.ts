/**
 * Fix CompletedQuest Migration Script
 *
 * Parses the SQL dump locally to avoid Supabase connection timeout.
 * Creates proper CompletedQuest records with points and approval.
 *
 * Run: npx tsx scripts/fix-completed-quests.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client";
import fs from "fs";
import path from "path";

// ApprovedBy user ID
const APPROVED_BY_USER_ID = 755074;

// Maps old completedTasks slugs (with underscores) to new Quest slugs (with hyphens)
const OLD_TO_NEW_SLUG: Record<string, string> = {
  join_discord_general: "join-discord-general",
  follow_playwaffles_twitter: "follow-playwaffles-twitter",
  retweet_playwaffles_launch_post: "retweet-playwaffles-launch-post",
  follow_wafflesdotfun_farcaster: "follow-wafflesdotfun-farcaster",
  share_waitlist_farcaster: "share-waitlist-farcaster",
  recast_waitlist_launch: "recast-waitlist-launch",
};

interface UserData {
  id: number;
  completedTasks: string[];
  updatedAt: Date;
}

async function fixCompletedQuests() {
  console.log("🔧 Fixing CompletedQuest records...\n");

  // Read the SQL dump file
  const sqlPath = path.join(process.cwd(), "supabase_data.sql");
  const sqlContent = fs.readFileSync(sqlPath, "utf-8");
  console.log("✅ Read SQL dump file");

  // Parse User inserts line by line
  // Format: INSERT INTO public."User" VALUES (id, wallet, createdAt, updatedAt, fid, inviteCode, inviteQuota, referredById, pfpUrl, status, username, completedTasks, role, password, waitlistPoints);
  const lines = sqlContent.split("\n");
  const users: UserData[] = [];

  for (const line of lines) {
    if (!line.startsWith('INSERT INTO public."User" VALUES')) continue;

    // Extract the VALUES part
    const valuesMatch = line.match(/VALUES \((.+)\);$/);
    if (!valuesMatch) continue;

    const valuesStr = valuesMatch[1];

    // Parse fields manually - handle quoted strings and NULL
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    let braceDepth = 0;

    for (let i = 0; i < valuesStr.length; i++) {
      const char = valuesStr[i];

      if (char === "'" && valuesStr[i - 1] !== "\\") {
        inQuotes = !inQuotes;
        current += char;
      } else if (char === "{") {
        braceDepth++;
        current += char;
      } else if (char === "}") {
        braceDepth--;
        current += char;
      } else if (char === "," && !inQuotes && braceDepth === 0) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim()); // Last field

    if (fields.length < 12) continue;

    // Field indices (0-based):
    // 0: id, 1: wallet, 2: createdAt, 3: updatedAt, 4: fid, 5: inviteCode,
    // 6: inviteQuota, 7: referredById, 8: pfpUrl, 9: status, 10: username,
    // 11: completedTasks, 12: role, 13: password, 14: waitlistPoints

    const id = parseInt(fields[0], 10);
    const updatedAtStr = fields[3].replace(/'/g, "");
    const updatedAt = new Date(updatedAtStr);
    const tasksStr = fields[11].replace(/'/g, ""); // Remove quotes

    // Parse the PostgreSQL array format: {task1,task2,task3}
    const tasks =
      tasksStr === "{}"
        ? []
        : tasksStr
            .slice(1, -1)
            .split(",")
            .filter((t) => t.length > 0);

    if (tasks.length > 0) {
      users.push({ id, completedTasks: tasks, updatedAt });
    }
  }

  console.log(`   Found ${users.length} users with completed tasks\n`);

  // Connect to Railway via Prisma
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  console.log("✅ Connected to Railway\n");

  try {
    // Load quests from DB to get their IDs and points
    const quests = await prisma.quest.findMany({
      select: { id: true, slug: true, points: true },
    });
    const slugToQuest = new Map(quests.map((q) => [q.slug, q]));
    console.log(`📦 Found ${quests.length} quests in target DB`);

    // Clear existing incorrect CompletedQuest records
    console.log("🗑️  Clearing existing CompletedQuest records...");
    await prisma.completedQuest.deleteMany({});
    console.log("   ✅ Cleared\n");

    // Check if approver user exists
    const approver = await prisma.user.findUnique({
      where: { id: APPROVED_BY_USER_ID },
      select: { id: true },
    });
    if (!approver) {
      console.log(
        `   ⚠️ Approver user ${APPROVED_BY_USER_ID} not found - will set approvedBy to null`
      );
    }

    // Insert CompletedQuest records
    console.log("📦 Inserting CompletedQuest records...");
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      for (const taskSlug of user.completedTasks) {
        const newSlug = OLD_TO_NEW_SLUG[taskSlug];
        if (!newSlug) {
          console.log(`   ⚠️ Unknown task slug: ${taskSlug}`);
          errorCount++;
          continue;
        }

        const quest = slugToQuest.get(newSlug);
        if (!quest) {
          console.log(`   ⚠️ Quest not found for slug: ${newSlug}`);
          errorCount++;
          continue;
        }

        try {
          await prisma.completedQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              completedAt: user.updatedAt,
              pointsAwarded: quest.points,
              isApproved: true,
              approvedBy: approver ? APPROVED_BY_USER_ID : null,
              approvedAt: user.updatedAt,
            },
          });
          successCount++;
        } catch (err: any) {
          // Likely duplicate or missing user - skip
          if (!err.message?.includes("Unique constraint")) {
            console.log(`   ⚠️ Failed for user ${user.id}: ${err.message}`);
          }
          errorCount++;
        }
      }
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⚠️ Errors/Skipped: ${errorCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

fixCompletedQuests().catch(console.error);
