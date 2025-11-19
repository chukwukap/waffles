import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const querySchema = z.object({
  gameId: z.coerce.number().int().positive("Invalid gameId format"),
});

/**
 * Server-Sent Events endpoint for real-time game events (chat + joins)
 * Streams events as they happen in the database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameIdParam = searchParams.get("gameId");

    const validationResult = querySchema.safeParse({ gameId: gameIdParam });
    if (!validationResult.success) {
      return new Response("Invalid gameId", { status: 400 });
    }

    const { gameId } = validationResult.data;

    // Verify game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    });

    if (!game) {
      return new Response("Game not found", { status: 404 });
    }

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Send initial connection message
        const send = (data: string) => {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        // Send initial ping to establish connection
        send(JSON.stringify({ type: "connected", gameId }));

        // Poll database for new events
        let lastChatId = 0;
        let lastParticipantId = 0;

        // Find the "current" last IDs to avoid sending old messages
        const [lastChat, lastPlayer] = await Promise.all([
          prisma.chat.findFirst({
            where: { gameId },
            orderBy: { id: "desc" },
            select: { id: true },
          }),
          prisma.gamePlayer.findFirst({
            where: { gameId },
            orderBy: { id: "desc" },
            select: { id: true },
          }),
        ]);
        lastChatId = lastChat?.id ?? 0;
        lastParticipantId = lastPlayer?.id ?? 0;

        const pollInterval = setInterval(async () => {
          try {
            // Fetch new chat messages
            const newChats = await prisma.chat.findMany({
              where: {
                gameId,
                id: { gt: lastChatId },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    fid: true,
                    username: true, // CHANGED
                    pfpUrl: true, // CHANGED
                  },
                },
              },
              orderBy: { id: "asc" },
            });

            // Send chat events
            for (const chat of newChats) {
              send(
                JSON.stringify({
                  type: "chat",
                  data: {
                    id: chat.id,
                    userId: chat.userId,
                    gameId: chat.gameId,
                    text: chat.text, // CHANGED
                    createdAt: chat.createdAt.toISOString(),
                    user: {
                      id: chat.user.id,
                      fid: chat.user.fid,
                      username: chat.user.username ?? "anon", // CHANGED
                      pfpUrl: chat.user.pfpUrl, // CHANGED
                    },
                  },
                })
              );
              lastChatId = chat.id;
            }

            // Fetch new participants (join events)
            // CHANGED: Query GamePlayer
            const newParticipants = await prisma.gamePlayer.findMany({
              where: {
                gameId,
                id: { gt: lastParticipantId },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    fid: true,
                    username: true, // CHANGED
                    pfpUrl: true, // CHANGED
                  },
                },
              },
              orderBy: { id: "asc" },
            });

            // Send join events
            for (const participant of newParticipants) {
              send(
                JSON.stringify({
                  type: "join",
                  data: {
                    id: participant.id,
                    userId: participant.userId,
                    gameId: participant.gameId,
                    joinedAt: participant.joinedAt.toISOString(),
                    user: {
                      id: participant.user.id,
                      fid: participant.user.fid,
                      username: participant.user.username ?? "anon", // CHANGED
                      pfpUrl: participant.user.pfpUrl, // CHANGED
                    },
                  },
                })
              );
              lastParticipantId = participant.id;
            }
          } catch (error) {
            console.error("Error polling events:", error);
            send(JSON.stringify({ type: "error", message: "Polling error" }));
          }
        }, 1000); // Poll every 1 second

        // Cleanup on client disconnect
        request.signal.addEventListener("abort", () => {
          clearInterval(pollInterval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("SSE Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
