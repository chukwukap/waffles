import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  try {
    const { userId, gameId, amount, txHash } = await req.json();
    if (!userId || !gameId || !amount)
      return Response.json({ error: "Missing fields" }, { status: 400 });

    const code = randomBytes(4).toString("hex").toUpperCase();

    const ticket = await prisma.ticket.create({
      data: {
        user: { connect: { id: userId } },
        game: { connect: { id: gameId } },
        gameId,
        amountUSDC: amount,
        code,
        txHash: txHash || null,
        status: txHash ? "confirmed" : "pending",
      },
    });

    return Response.json(ticket);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
