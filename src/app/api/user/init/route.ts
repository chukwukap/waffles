import { prisma } from "@/server/db";

export async function POST(req: Request) {
  try {
    const { fid, username, pfpUrl, walletAddress } = await req.json();

    if (!fid) {
      return Response.json({ error: "Missing fid" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { farcasterId: fid.toString() },
      update: {
        name: username,
        wallet: walletAddress || undefined,
        imageUrl: pfpUrl,
      },
      create: {
        farcasterId: fid.toString(),
        name: username,
        wallet: walletAddress,
        imageUrl: pfpUrl,
      },
    });

    return Response.json(user);
  } catch (error) {
    console.error("Error initializing user:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
