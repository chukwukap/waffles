"use server";

import { Client, resources } from "coinbase-commerce-node";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { verifyAuthenticatedUser } from "@/lib/auth";

// Initialize Coinbase Commerce client
if (!env.coinbaseCommerceApiKey) {
  console.warn(
    "⚠️  COINBASE_COMMERCE_API_KEY not set. " +
      "Ticket purchases will fail until configured."
  );
} else {
  Client.init(env.coinbaseCommerceApiKey);
}

export type CreateChargeResult =
  | { success: true; chargeId: string; chargeUrl: string; ticketId: number }
  | { success: false; error: string };

/**
 * Create a Coinbase Commerce charge for ticket purchase
 */
export async function createTicketCharge(data: {
  fid: number;
  gameId: number;
  amount: number;
  authToken: string;
}): Promise<CreateChargeResult> {
  // Runtime validation: Check if Commerce is configured
  if (!env.coinbaseCommerceApiKey) {
    return {
      success: false,
      error: "Payment system not configured. Please contact support.",
    };
  }

  try {
    // 1. Verify authentication
    const authResult = await verifyAuthenticatedUser(data.authToken, data.fid);
    if (!authResult.authenticated) {
      return {
        success: false,
        error: authResult.error || "Authentication required",
      };
    }

    // 2. Find user
    const user = await prisma.user.findUnique({
      where: { fid: data.fid },
      select: { id: true, status: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // 3. Check user status (access control)
    if (user.status !== "ACTIVE") {
      return {
        success: false,
        error: "Access denied. You must be invited to play.",
      };
    }

    // 4. Check if user already has ticket
    const existingTicket = await prisma.ticket.findUnique({
      where: {
        gameId_userId: {
          gameId: data.gameId,
          userId: user.id,
        },
      },
    });

    if (existingTicket) {
      return {
        success: false,
        error: "You already have a ticket for this game",
      };
    }

    // 5. Verify game exists
    const game = await prisma.game.findUnique({
      where: { id: data.gameId },
      select: { id: true, title: true, entryFee: true },
    });

    if (!game) {
      return { success: false, error: "Game not found" };
    }

    // 6. Generate unique ticket code
    let ticketCode: string = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = Math.random().toString(36).substring(2, 14).toUpperCase();
      const exists = await prisma.ticket.findUnique({ where: { code } });
      if (!exists) {
        ticketCode = code;
        break;
      }
      if (attempt === 9) {
        return {
          success: false,
          error: "Could not generate unique ticket code",
        };
      }
    }

    // 7. Create Coinbase Commerce charge
    const chargeData = {
      name: `Waffles Game Ticket`,
      description: `Entry ticket for ${game.title} (Game #${data.gameId})`,
      pricing_type: "fixed_price" as const,
      local_price: {
        amount: data.amount.toFixed(2),
        currency: "USD",
      },
      metadata: {
        fid: data.fid.toString(),
        gameId: data.gameId.toString(),
        userId: user.id.toString(),
        ticketCode: ticketCode,
      },
      redirect_url: `${env.rootUrl}/game?gameId=${data.gameId}`,
      cancel_url: `${env.rootUrl}/game/${data.gameId}/ticket`,
    };

    const charge = await resources.Charge.create(chargeData);

    // 8. Create ticket with PENDING status
    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        gameId: data.gameId,
        amountUSDC: data.amount,
        status: "PENDING",
        code: ticketCode,
        // Store commerce charge ID in a JSON field or create new field
        txHash: null, // Will be updated via webhook
      },
    });

    return {
      success: true,
      chargeId: charge.id,
      chargeUrl: charge.hosted_url,
      ticketId: ticket.id,
    };
  } catch (error: any) {
    console.error("Create charge error:", error);

    // Handle Coinbase Commerce specific errors
    if (error.response?.data?.error) {
      return {
        success: false,
        error: error.response.data.error.message || "Payment service error",
      };
    }

    return {
      success: false,
      error: "Failed to create payment. Please try again.",
    };
  }
}
