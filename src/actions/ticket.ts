"use server";

import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { revalidateTag } from "next/cache"; // Import for revalidation
import { z } from "zod";
import type { Ticket } from "@prisma/client"; // Import Prisma type

// Schema for input validation
const purchaseSchema = z.object({
  fid: z.number().int().positive("Invalid FID format."),
  gameId: z.number().int().positive("Invalid Game ID."),
  txHash: z.string().optional().nullable(), // Optional transaction hash
});

export type PurchaseResult =
  | { success: true; ticket: Ticket; alreadyExists?: boolean }
  | {
      success: false;
      error: string;
      alreadyExists?: boolean;
      existingTicket?: Ticket;
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
  };

  const validation = purchaseSchema.safeParse(rawData);

  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message || "Invalid input.";
    return { success: false, error: firstError };
  }

  const { fid, gameId, txHash } = validation.data;

  try {
    // 1. Find User
    const user = await prisma.user.findUnique({
      where: { fid: fid },
    });
    if (!user) {
      return { success: false, error: "User not found. Please sync profile." };
    }
    const userId = user.id;

    // 2. Find Game & Config
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { config: true },
    });
    if (!game) {
      return { success: false, error: "Game not found." };
    }
    if (!game.config) {
      return { success: false, error: "Game configuration is missing." };
    }

    // 3. Check for Existing Ticket (Idempotency)
    const existingTicket = await prisma.ticket.findUnique({
      where: { gameId_userId: { gameId, userId } },
    });
    if (existingTicket) {
      // If txHash is provided and different, update it? Or just return existing.
      // For simplicity, return existing ticket as success.
      console.log("Ticket already exists for user", userId, "and game", gameId);
      // Optionally update txHash if needed and different
      if (txHash && existingTicket.txHash !== txHash) {
        const updatedTicket = await prisma.ticket.update({
          where: { id: existingTicket.id },
          data: { txHash: txHash, status: "confirmed" }, // Update status too
        });
        revalidateTag(`ticket_${fid}_${gameId}`); // Revalidate SWR cache
        revalidateTag("lobby_stats");
        return { success: true, ticket: updatedTicket };
      }
      return { success: true, ticket: existingTicket, alreadyExists: true };
    }

    // 4. Generate Unique Code
    let code: string;
    for (let attempt = 0; attempt < 10; attempt++) {
      code = randomBytes(6).toString("hex").toUpperCase(); // Increased length for less collision chance
      if (!(await prisma.ticket.findUnique({ where: { code } }))) {
        break; // Found unique code
      }
      if (attempt === 9) {
        return {
          success: false,
          error: "Could not generate unique ticket code.",
        };
      }
    }

    // 5. Determine Status
    const status =
      typeof txHash === "string" && txHash.length > 0 ? "confirmed" : "pending";

    // 6. Create Ticket
    const newTicket = await prisma.ticket.create({
      data: {
        userId: userId,
        gameId: gameId,
        amountUSDC: game.config.ticketPrice, // Use price from game config
        code: code!, // Code is guaranteed to be assigned here
        txHash: txHash ?? null,
        status: "confirmed", // for testing
      },
    });

    // 7. Revalidate relevant data caches
    revalidateTag(`ticket_${fid}_${gameId}`); // Invalidate specific ticket cache for SWR
    revalidateTag("lobby_stats"); // Invalidate general lobby stats

    return { success: true, ticket: newTicket };
  } catch (e) {
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
        if (existing)
          return { success: true, ticket: existing, alreadyExists: true };
      }
      return {
        success: false,
        error: "Ticket already exists (race condition).",
      };
    }
    console.error("Purchase Ticket Action Error:", e);
    return { success: false, error: "Internal Server Error during purchase." };
  }
}
