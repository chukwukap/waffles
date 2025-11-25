import { NextResponse } from "next/server";
import { Webhook } from "coinbase-commerce-node";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Coinbase Commerce Webhook Handler
 * Receives payment confirmations and updates ticket status
 */
export async function POST(request: Request) {
  try {
    // 1. Get raw body and signature
    const rawBody = await request.text();
    const signature = request.headers.get("x-cc-webhook-signature");

    if (!signature) {
      console.error("❌ Webhook: No signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // 2. Verify webhook signature
    let event;
    try {
      event = Webhook.verifyEventBody(
        rawBody,
        signature,
        env.coinbaseCommerceWebhookSecret
      );
    } catch (error) {
      console.error("❌ Webhook: Invalid signature", error);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log(`📥 Webhook received: ${event.type}`, {
      chargeId: event.data.id,
      chargeCode: event.data.code,
    });

    // 3. Handle charge:confirmed event
    if (event.type === "charge:confirmed") {
      const charge = event.data;
      const metadata = charge.metadata || {};

      const gameId = parseInt(metadata.gameId);
      const userId = parseInt(metadata.userId);
      const ticketCode = metadata.ticketCode;

      if (!gameId || !userId) {
        console.error("❌ Webhook: Missing metadata", { metadata });
        return NextResponse.json(
          { error: "Invalid metadata" },
          { status: 400 }
        );
      }

      // Extract transaction hash from timeline
      let txHash: string | null = null;
      if (charge.timeline && charge.timeline.length > 0) {
        const lastEvent = charge.timeline[charge.timeline.length - 1];
        txHash = lastEvent.payment?.transaction_id || null;
      }

      // Update ticket status to PAID
      const ticket = await prisma.ticket.update({
        where: {
          gameId_userId: {
            gameId,
            userId,
          },
        },
        data: {
          status: "PAID",
          txHash: txHash,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Ticket confirmed:`, {
        ticketId: ticket.id,
        gameId,
        userId,
        txHash,
      });

      // TODO: Send notification to user
      // await sendTicketConfirmationNotification(userId, gameId);

      return NextResponse.json({
        success: true,
        ticketId: ticket.id,
      });
    }

    // 4. Handle charge:failed event
    if (event.type === "charge:failed") {
      const charge = event.data;
      const metadata = charge.metadata || {};

      const gameId = parseInt(metadata.gameId);
      const userId = parseInt(metadata.userId);

      if (gameId && userId) {
        await prisma.ticket.update({
          where: {
            gameId_userId: { gameId, userId },
          },
          data: { status: "FAILED" },
        });

        console.log(`❌ Ticket payment failed:`, { gameId, userId });
      }

      return NextResponse.json({ success: true });
    }

    // 5. Handle charge:pending (optional - track intermediate state)
    if (event.type === "charge:pending") {
      console.log(`⏳ Charge pending:`, {
        chargeId: event.data.id,
        metadata: event.data.metadata,
      });

      return NextResponse.json({ success: true });
    }

    // 6. Acknowledge other events
    console.log(`ℹ️  Unhandled event type: ${event.type}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
