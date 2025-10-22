import { prisma } from "@/server/db";

export async function POST(req: Request) {
  try {
    const { userId, gameId } = await req.json();
    if (!userId || !gameId)
      return Response.json({ error: "Missing fields" }, { status: 400 });

    await prisma.chat.create({
      data: {
        userId,
        gameId,
        message: "joined the lobby.",
      },
    });

    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
