#!/usr/bin/env tsx

/**
 * Admin Setup Script
 *
 * This script helps you create your first admin user.
 * Run: pnpm tsx scripts/setup-admin.ts
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/admin-auth";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log("🧇 Waffles Admin Setup\n");
  console.log("This script will help you create your first admin user.\n");

  // Get FID
  const fidStr = await question("Enter your Farcaster ID (FID): ");
  const fid = parseInt(fidStr.trim());

  if (isNaN(fid) || fid <= 0) {
    console.error("❌ Invalid FID");
    process.exit(1);
  }

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { fid },
  });

  if (!user) {
    console.log(`\n⚠️  User with FID ${fid} not found. Creating new user...`);

    const username = await question(
      "Enter username (optional, press Enter to skip): "
    );
    const wallet = await question(
      "Enter wallet address (optional, press Enter to skip): "
    );

    // Generate unique invite code
    const inviteCode = `ADMIN${fid}`;

    user = await prisma.user.create({
      data: {
        fid,
        username: username.trim() || null,
        wallet: wallet.trim() || null,
        inviteCode,
        hasGameAccess: true,
        role: "ADMIN",
        inviteQuota: 999,
      },
    });

    console.log(`✅ User created with FID ${fid}`);
  } else {
    console.log(
      `\n✅ Found existing user: ${user.username || `FID ${user.fid}`}`
    );

    if (user.role === "ADMIN") {
      console.log("⚠️  This user is already an admin.");
      const confirm = await question("Do you want to continue? (y/n): ");
      if (confirm.toLowerCase() !== "y") {
        console.log("Cancelled.");
        rl.close();
        process.exit(0);
      }
    } else {
      // Promote to admin
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN", hasGameAccess: true },
      });
      console.log("✅ User promoted to ADMIN");
    }
  }

  // Get password
  console.log("\n📝 Now let's set up the admin password.");
  console.log("This will be used for logging into the admin dashboard.\n");

  const password = await question("Enter admin password: ");

  if (password.length < 8) {
    console.error("❌ Password must be at least 8 characters");
    rl.close();
    process.exit(1);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  console.log("\n✅ Password hashed successfully!");
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🎉 Admin setup complete!\n");
  console.log("Add the following to your .env file:\n");
  console.log(`ADMIN_PASSWORD_HASH="${passwordHash}"`);
  console.log(`ADMIN_SESSION_SECRET="${generateSecret()}"`);
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📌 Login Credentials:");
  console.log(`   FID: ${user.fid}`);
  console.log(`   Password: [the password you just entered]`);
  console.log(`   Login URL: http://localhost:3000/admin/login`);
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  rl.close();
}

function generateSecret(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
