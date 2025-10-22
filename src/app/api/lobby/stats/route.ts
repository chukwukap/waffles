import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { status: "confirmed" },
      include: { user: true },
    });

    const totalTickets = tickets.length;
    const totalPrize = totalTickets * 50; // each ticket costs 50 USDC

    // Return top 10 players by activity
    const players = tickets.map((t) => ({
      name: t.user.name,
      wallet: t.user.wallet,
      imageUrl: t.user.imageUrl,
    }));

    return Response.json({
      totalTickets,
      totalPrize,
      players,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
