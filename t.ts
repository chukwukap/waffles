import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

const config = new Configuration({
  apiKey: "6DAA7802-1243-4792-B93A-B87D4A7894F7",
});

const client = new NeynarAPIClient(config);
const fid = 755074;

client.fetchUserFollowers({ fid, limit: 10 }).then((response) => {
  console.log("response:", response.users[0]);
});
