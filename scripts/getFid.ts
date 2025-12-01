import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const apiKey = process.env.NEYNAR_API_KEY;

if (!apiKey) {
  console.error("NEYNAR_API_KEY not found in environment");
  process.exit(1);
}

const neynar = new NeynarAPIClient({ apiKey });

async function getFid(username: string) {
  try {
    const user = await neynar.searchUser({ q: username, limit: 1 });

    if (user.result.users.length === 0) {
      console.log(`No user found for username: ${username}`);
      return;
    }

    const foundUser = user.result.users[0];
    console.log(`Username: ${foundUser.username}`);
    console.log(`FID: ${foundUser.fid}`);
    console.log(`Display Name: ${foundUser.display_name}`);
  } catch (error) {
    console.error("Error fetching user:", error);
  }
}

const username = process.argv[2];

if (!username) {
  console.error("Usage: tsx scripts/getFid.ts <username>");
  process.exit(1);
}

getFid(username);
