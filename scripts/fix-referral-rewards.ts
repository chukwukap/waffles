/**
 * Fix Referral Rewards - Backfill Script
 *
 * Updates existing ReferralReward records:
 * - Sets amount = 200
 * - Sets status = UNLOCKED
 * - Adds 200 points to each referrer's waitlistPoints
 *
 * Run with: pnpm tsx scripts/fix-referral-rewards.ts
 */

import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const REFERRAL_POINTS = 200;

async function fixReferralRewards() {
  const client = new pg.Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // 1. Check current state
    const beforeResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE amount = 0 AND status = 'PENDING') as needs_fix
      FROM "ReferralReward"
    `);
    const { total, needs_fix } = beforeResult.rows[0];
    console.log(`📊 Current state:`);
    console.log(`   Total rewards: ${total}`);
    console.log(`   Needs fix (amount=0, PENDING): ${needs_fix}\n`);

    if (needs_fix === "0") {
      console.log("✅ No rewards need fixing!");
      return;
    }

    // 2. Get all referrers who need points added
    const referrersResult = await client.query(`
      SELECT "inviterId", COUNT(*) as reward_count
      FROM "ReferralReward"
      WHERE amount = 0 AND status = 'PENDING'
      GROUP BY "inviterId"
    `);
    console.log(`👥 Referrers to update: ${referrersResult.rows.length}\n`);

    // 3. Update ReferralReward records
    console.log("🔄 Updating ReferralReward records...");
    const updateRewardsResult = await client.query(
      `
      UPDATE "ReferralReward"
      SET 
        amount = $1,
        status = 'UNLOCKED',
        "unlockedAt" = NOW()
      WHERE amount = 0 AND status = 'PENDING'
      RETURNING id
    `,
      [REFERRAL_POINTS]
    );
    console.log(
      `   ✅ Updated ${updateRewardsResult.rowCount} reward records\n`
    );

    // 4. Add points to each referrer's waitlistPoints
    console.log("🔄 Adding points to referrers...");
    let totalPointsAdded = 0;
    for (const row of referrersResult.rows) {
      const pointsToAdd = parseInt(row.reward_count) * REFERRAL_POINTS;
      await client.query(
        `
        UPDATE "User"
        SET "waitlistPoints" = "waitlistPoints" + $1
        WHERE id = $2
      `,
        [pointsToAdd, row.inviterId]
      );
      totalPointsAdded += pointsToAdd;
      console.log(
        `   User ${row.inviterId}: +${pointsToAdd} points (${row.reward_count} referrals)`
      );
    }

    console.log(`\n✅ Done!`);
    console.log(`   Rewards updated: ${updateRewardsResult.rowCount}`);
    console.log(`   Users updated: ${referrersResult.rows.length}`);
    console.log(`   Total points added: ${totalPointsAdded}`);
  } finally {
    await client.end();
    console.log("\n🔌 Connection closed");
  }
}

fixReferralRewards().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
