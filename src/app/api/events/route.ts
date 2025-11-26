import { NextRequest } from "next/server";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  gameId: z.coerce.number().int().positive("Invalid gameId format"),
});

// Type definition for Upstash Redis XREAD response
// [streamKey, [[messageId, [key, value, key, value, ...]]]]
type XReadResponse = [string, [string, string[]][]][];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameIdParam = searchParams.get("gameId");

    const validationResult = querySchema.safeParse({ gameId: gameIdParam });
    if (!validationResult.success) {
      return new Response("Invalid gameId", { status: 400 });
    }

    const { gameId } = validationResult.data;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let isClosed = false;

        const send = (data: string) => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch (e) {
            // Controller already closed, ignore
            isClosed = true;
          }
        };

        // Send initial connection message
        send(JSON.stringify({ type: "connected", gameId }));

        // Subscribe to Redis channel
        const streamKey = `game:stream:${gameId}`;
        let lastStreamId = "$";

        const pollInterval = setInterval(async () => {
          if (isClosed) {
            clearInterval(pollInterval);
            return;
          }

          try {
            // @upstash/redis xread signature: xread(streams, ids, options)
            // Note: Upstash REST doesn't support blocking, so we poll without BLOCK
            const response = (await redis.xread([streamKey], [lastStreamId], {
              count: 10,
            })) as XReadResponse | null;

            if (response && !isClosed) {
              // response is [[streamKey, [[id, [field, value, ...]]]]]
              const streamData = response[0][1];
              for (const [id, fields] of streamData) {
                // fields is [key1, val1, key2, val2...]
                // We expect "data" field
                const dataIdx = fields.indexOf("data");
                if (dataIdx !== -1) {
                  const eventData = fields[dataIdx + 1];
                  send(eventData);
                }
                lastStreamId = id;
              }
            }

            // Send stats update every poll (player count)
            if (!isClosed) {
              const onlineCount = await prisma.gamePlayer.count({
                where: { gameId },
              });

              send(JSON.stringify({ type: "stats", data: { onlineCount } }));
            }
          } catch (e) {
            // Silently ignore errors if closed
            if (!isClosed) {
              console.error("Error in SSE poll:", e);
            }
          }
        }, 200); // Poll every 200ms

        request.signal.addEventListener("abort", () => {
          isClosed = true;
          clearInterval(pollInterval);
          try {
            controller.close();
          } catch (e) {
            // Already closed
          }
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
