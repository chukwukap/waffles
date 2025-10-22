import { neynar } from "@/lib/neynarClient";

export async function shareResult(fid: number, rank: number, points: number) {
  const text = `🏆 I just ranked #${rank} on Waffles with ${points} points!  
Join the next tournament → waffles.app`;

  await neynar.publishCast(fid, text);
}
