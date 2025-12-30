/**
 * Migration Script: NotificationToken from Supabase to Railway (OPTIMIZED)
 *
 * This optimized version:
 * 1. Fetches ALL existing tokens from Railway first (one query)
 * 2. Fetches tokens from Supabase
 * 3. Filters to only tokens that don't exist yet
 * 4. Migrates only the missing ones
 *
 * Run with: pnpm tsx scripts/migrate-notifications.ts
 */

import pg from "pg";

// Database connection strings
const SUPABASE_URL = process.env.SUPABASE_DATABASE_URL;
const RAILWAY_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_DATABASE_URL environment variable is required");
}

if (!RAILWAY_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

interface SourceNotification {
  id: number;
  user_id: number;
  app_fid: number;
  token: string;
  url: string;
  created_at: Date;
  updated_at: Date;
  user_fid: number;
}

interface RailwayUser {
  id: number;
  fid: number;
}

interface ExistingToken {
  user_id: number;
  app_fid: number;
}

async function migrateNotifications() {
  const sourceClient = new pg.Client({ connectionString: SUPABASE_URL });
  const destClient = new pg.Client({ connectionString: RAILWAY_URL });

  try {
    console.log("🔌 Connecting to databases...");
    await sourceClient.connect();
    await destClient.connect();
    console.log("✅ Connected to both databases\n");

    // Step 1: Get ALL users from Railway (for fid → userId mapping)
    console.log("� Fetching user mapping from Railway...");
    const usersResult = await destClient.query<RailwayUser>(
      `SELECT id, fid FROM "User"`
    );
    const fidToUserId = new Map<number, number>();
    for (const user of usersResult.rows) {
      fidToUserId.set(user.fid, user.id);
    }
    console.log(`   Found ${fidToUserId.size} users in Railway\n`);

    // Step 2: Get ALL existing tokens from Railway
    console.log("📥 Fetching existing tokens from Railway...");
    const existingResult = await destClient.query<ExistingToken>(
      `SELECT "userId" as user_id, "appFid" as app_fid FROM "NotificationToken"`
    );
    const existingTokens = new Set<string>();
    for (const token of existingResult.rows) {
      existingTokens.add(`${token.user_id}-${token.app_fid}`);
    }
    console.log(`   Found ${existingTokens.size} existing tokens\n`);

    // Step 3: Fetch tokens from Supabase
    console.log("📥 Fetching tokens from Supabase...");
    const sourceResult = await sourceClient.query<SourceNotification>(`
      SELECT 
        nt.id,
        nt."userId" as user_id,
        nt."appFid" as app_fid,
        nt.token,
        nt.url,
        nt."createdAt" as created_at,
        nt."updatedAt" as updated_at,
        u.fid as user_fid
      FROM "NotificationToken" nt
      JOIN "User" u ON nt."userId" = u.id
    `);
    console.log(`   Found ${sourceResult.rows.length} tokens in Supabase\n`);

    // Step 4: Filter to only tokens that need migration
    const toMigrate: Array<SourceNotification & { railwayUserId: number }> = [];
    let skippedNoUser = 0;
    let skippedExists = 0;

    for (const notif of sourceResult.rows) {
      const railwayUserId = fidToUserId.get(notif.user_fid);
      if (!railwayUserId) {
        skippedNoUser++;
        continue;
      }
      const key = `${railwayUserId}-${notif.app_fid}`;
      if (existingTokens.has(key)) {
        skippedExists++;
        continue;
      }
      toMigrate.push({ ...notif, railwayUserId });
    }

    console.log(`📊 Migration plan:`);
    console.log(`   Already exists: ${skippedExists}`);
    console.log(`   User not found: ${skippedNoUser}`);
    console.log(`   To migrate:     ${toMigrate.length}\n`);

    if (toMigrate.length === 0) {
      console.log("✅ All tokens already migrated!");
      return;
    }

    // Step 5: Migrate in batches
    console.log("🔄 Migrating tokens...");
    let migrated = 0;
    let errors = 0;

    for (const notif of toMigrate) {
      try {
        await destClient.query(
          `INSERT INTO "NotificationToken" ("userId", "appFid", token, url, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            notif.railwayUserId,
            notif.app_fid,
            notif.token,
            notif.url,
            notif.created_at,
            notif.updated_at,
          ]
        );
        migrated++;
        console.log(
          `✅ [${migrated}/${toMigrate.length}] fid ${notif.user_fid} → userId ${notif.railwayUserId}`
        );
      } catch (err) {
        errors++;
        console.error(`❌ Error for fid ${notif.user_fid}:`, err);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Complete!");
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Errors:   ${errors}`);
    console.log("=".repeat(50));
  } finally {
    await sourceClient.end();
    await destClient.end();
    console.log("\n🔌 Connections closed");
  }
}

migrateNotifications().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
