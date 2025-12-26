/**
 * Debug script to check notification token appFids
 * Run with: pnpm tsx scripts/debug-notifications.ts
 */

import pg from "pg";

const RAILWAY_URL =
  "postgresql://postgres:aCsolCsflIYcvmETEAjhxwkKeWBHaYWv@switchyard.proxy.rlwy.net:21127/railway";

async function debugNotifications() {
  const client = new pg.Client({ connectionString: RAILWAY_URL });

  try {
    await client.connect();
    console.log("Connected to Railway DB\n");

    // Check distinct appFids
    console.log("=== Distinct appFids in NotificationToken ===");
    const appFidsResult = await client.query(
      `SELECT "appFid", COUNT(*) as count FROM "NotificationToken" GROUP BY "appFid" ORDER BY count DESC`
    );
    console.table(appFidsResult.rows);

    // Check if WAFFLE_FID (1386922) has any tokens
    console.log("\n=== Tokens with appFid = 1386922 (WAFFLE_FID) ===");
    const waffleFidResult = await client.query(
      `SELECT COUNT(*) as count FROM "NotificationToken" WHERE "appFid" = 1386922`
    );
    console.log(`Count: ${waffleFidResult.rows[0].count}`);

    // Check active users with tokens
    console.log("\n=== Active users (hasGameAccess=true) with any token ===");
    const activeUsersResult = await client.query(`
      SELECT u.fid, u.username, nt."appFid"
      FROM "User" u
      JOIN "NotificationToken" nt ON u.id = nt."userId"
      WHERE u."hasGameAccess" = true
      LIMIT 10
    `);
    console.table(activeUsersResult.rows);

    // Sample token data
    console.log("\n=== Sample NotificationToken data (first 5) ===");
    const sampleResult = await client.query(`
      SELECT nt.id, nt."userId", nt."appFid", LEFT(nt.token, 20) as token_prefix, LEFT(nt.url, 50) as url_prefix
      FROM "NotificationToken" nt
      LIMIT 5
    `);
    console.table(sampleResult.rows);
  } finally {
    await client.end();
  }
}

debugNotifications().catch(console.error);
