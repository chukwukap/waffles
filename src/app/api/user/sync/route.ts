import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  fid: z.number(),
  username: z.string().optional(),
  pfpUrl: z.string().url().optional(),
  wallet: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const user = await prisma.user.upsert({
      where: { farcasterId: String(data.fid) },
      update: {
        name: data.username ?? undefined,
        imageUrl: data.pfpUrl ?? undefined,
        wallet: data.wallet ?? undefined,
      },
      create: {
        farcasterId: String(data.fid),
        name: data.username ?? null,
        imageUrl: data.pfpUrl ?? null,
        wallet: data.wallet ?? null,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("User sync failed", err);
    return NextResponse.json(
      { success: false, error: "User sync failed" },
      { status: 500 }
    );
  }
}
