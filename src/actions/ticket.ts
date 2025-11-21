"use server";

import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { z } from "zod";
import { verifyAuthenticatedUser } from "@/lib/auth";
import type { Ticket } from "../../prisma/generated/client";

// Schema for input validation
const purchaseSchema = z.object({
  fid: z.number().int().positive("Invalid FID format."),
  gameId: z.number().int().positive("Invalid Game ID."),
  txHash: z.string().optional().nullable(),
  authToken: z.string().optional().nullable(),
});

export type PurchaseResult = {
  status: "success" | "error";
  error?: string;
  ticket?: Ticket;
};

/**
 * Server Action to create or confirm a ticket purchase for a user and game.
 */
export async function purchaseTicketAction(
  prevState: PurchaseResult | null, // Not used actively here, but required by useFormState if used
  formData: FormData
): Promise<PurchaseResult> {
  const rawData = {
    fid: Number(formData.get("fid")),
    gameId: Number(formData.get("gameId")), // Ensure conversion
    txHash: formData.get("txHash"),
    authToken: formData.get("authToken"),
  };

  const validation = purchaseSchema.safeParse(rawData);

  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message || "Invalid input.";
    return { status: "error", error: firstError };
  }

  const { fid, gameId, txHash, authToken } = validation.data;

  // Verify authentication - REQUIRED for ticket purchases
  const authResult = await verifyAuthenticatedUser(authToken ?? null, fid);
  if (!authResult.authenticated) {
    return {
      status: "error",
      error: authResult.error || "Authentication required for purchases",
    };
  }

  try {
    // 1. Find User
    const user = await prisma.user.findUnique({
      where: { fid: fid },
      select: { id: true, status: true }, // Added status
    });
    if (!user) {
      return {
        status: "error",
        error: "User not found. Please go through onboarding first.",
      };
    }

    // Enforce access control
    if (user.status !== "ACTIVE") {
      return {
        status: "error",
        error: "Access denied. You must be invited to play.",
      };
    }

    const userId = user.id;

    // 2. Find Game & Config
    // CHANGED: No longer include 'config', just get 'entryFee'
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, entryFee: true }, // Select new 'entryFee' field
    });
    if (!game) {
      return { status: "error", error: "Game not found." };
    }
    // REMOVED: No longer need to check for game.config

    // 3. Check for Existing Ticket (Idempotency)
    const existingTicket = await prisma.ticket.findUnique({
      where: { gameId_userId: { gameId, userId } },
    });
    if (existingTicket) {
      // If txHash is provided and different, update it
      if (txHash && existingTicket.txHash !== txHash) {
        const updatedTicket = await prisma.ticket.update({
          where: { id: existingTicket.id },
          data: { txHash: txHash, status: "PAID" }, // CHANGED: "confirmed" -> "PAID"
        });
        return { status: "success", ticket: updatedTicket };
      }
      return { status: "success", ticket: existingTicket };
    }

    // 4. Generate Unique Code (This logic is fine)
    let code: string;
    for (let attempt = 0; attempt < 10; attempt++) {
      code = randomBytes(6).toString("hex").toUpperCase();
      if (!(await prisma.ticket.findUnique({ where: { code } }))) {
        break; // Found unique code
      }
      if (attempt === 9) {
        return {
          status: "error",
          error: "Could not generate unique ticket code.",
        };
      }
    }

    // 5. Determine Status
    // CHANGED: "confirmed" -> "PAID"
    const status =
      typeof txHash === "string" && txHash.length > 0 ? "PAID" : "PENDING";

    // 6. Create Ticket
    const newTicket = await prisma.ticket.create({
      data: {
        userId: userId,
        gameId: gameId,
        amountUSDC: game.entryFee, // CHANGED: Use game.entryFee
        code: code!,
        txHash: txHash ?? null,
        status: status,
      },
    });

    // 7. Revalidate relevant data caches

    return { status: "success", ticket: newTicket };
  } catch (e) {
    console.error("Purchase Ticket Action Error:", e);
    // Handle potential Prisma unique constraint violation if race condition occurs
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      e.code === "P2002"
    ) {
      // Fetch and return the existing ticket instead of erroring
      const user = await prisma.user.findUnique({
        where: { fid: fid },
      });
      if (user) {
        const existing = await prisma.ticket.findUnique({
          where: { gameId_userId: { gameId, userId: user.id } },
        });
        if (existing) return { status: "success", ticket: existing };
      }
      return {
        status: "error",
        error: "Ticket already exists (race condition).",
      };
    }
    return { status: "error", error: "Internal Server Error during purchase." };
  }
}
