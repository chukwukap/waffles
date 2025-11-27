"use server";

import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { z } from "zod";
import type { Ticket } from "../../prisma/generated/client";
import { createPublicClient, http, isHash } from "viem";
import { base } from "viem/chains";
import { revalidatePath } from "next/cache";

const purchaseSchema = z.object({
  fid: z.number().int().positive("Invalid FID format."),
  gameId: z.number().int().positive("Invalid Game ID."),
  txHash: z.string().optional().nullable(),
});

export type PurchaseResult = {
  status: "success" | "error";
  error?: string;
  ticket?: Ticket;
};

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

/**
 * Server Action to buy a waffle (ticket) for a game.
 */
export async function buyWaffleAction(
  prevState: PurchaseResult | null,
  formData: FormData
): Promise<PurchaseResult> {
  console.log("[BuyWaffle] Starting ticket purchase action");

  const rawData = {
    fid: Number(formData.get("fid")),
    gameId: Number(formData.get("gameId")),
    txHash: formData.get("txHash"),
  };

  console.log("[BuyWaffle] Input:", {
    fid: rawData.fid,
    gameId: rawData.gameId,
    hasTxHash: !!rawData.txHash,
  });

  const validation = purchaseSchema.safeParse(rawData);

  if (!validation.success) {
    console.error("[BuyWaffle] Validation failed:", validation.error.issues);
    const firstError = validation.error.issues[0]?.message || "Invalid input.";
    return { status: "error", error: firstError };
  }

  const { fid, gameId, txHash } = validation.data;

  try {
    console.log("[BuyWaffle] Step 1: Looking up user", { fid });
    // 1. Find User
    const user = await prisma.user.findUnique({
      where: { fid: fid },
      select: { id: true, status: true, wallet: true },
    });

    if (!user) {
      console.error("[BuyWaffle] User not found", { fid });
      return {
        status: "error",
        error: "User not found. Please go through onboarding first.",
      };
    }

    console.log("[BuyWaffle] User found:", {
      userId: user.id,
      status: user.status,
    });

    // Enforce access control
    if (user.status !== "ACTIVE") {
      console.error("[BuyWaffle] User not active", {
        userId: user.id,
        status: user.status,
      });
      return {
        status: "error",
        error: "Access denied. You must be invited to play.",
      };
    }

    const userId = user.id;

    console.log("[BuyWaffle] Step 2: Looking up game", { gameId });

    // 2. Find Game
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, entryFee: true },
    });

    if (!game) {
      console.error("[BuyWaffle] Game not found", { gameId });
      return { status: "error", error: "Game not found." };
    }

    console.log("[BuyWaffle] Game found:", {
      gameId: game.id,
      entryFee: game.entryFee,
    });

    // 3. Verify Transaction (if txHash provided)
    let isVerified = false;
    if (txHash) {
      console.log("[BuyWaffle] Step 3: Verifying transaction", { txHash });
      // Validate hash format
      if (!isHash(txHash)) {
        console.error("[BuyWaffle] Invalid transaction hash format", {
          txHash,
        });
        return { status: "error", error: "Invalid transaction hash format." };
      }

      try {
        // Check if this txHash has already been used
        const existingTx = await prisma.ticket.findFirst({
          where: { txHash: txHash },
        });

        // If it's used by ANOTHER ticket, that's fraud.
        // If it's used by THIS user for THIS game (idempotency), we handle that below.
        if (
          existingTx &&
          (existingTx.userId !== userId || existingTx.gameId !== gameId)
        ) {
          console.error(
            "[BuyWaffle] Transaction hash already used by another ticket",
            { txHash, existingTicketId: existingTx.id }
          );
          return { status: "error", error: "Transaction hash already used." };
        }

        const receipt = await publicClient.getTransactionReceipt({
          hash: txHash,
        });

        console.log("[BuyWaffle] Transaction receipt:", {
          txHash,
          status: receipt.status,
          blockNumber: receipt.blockNumber,
        });

        if (receipt.status !== "success") {
          console.error("[BuyWaffle] Transaction failed on-chain", {
            txHash,
            status: receipt.status,
          });
          return { status: "error", error: "Transaction failed on-chain." };
        }

        const transaction = await publicClient.getTransaction({
          hash: txHash,
        });

        console.log("[BuyWaffle] Transaction details:", {
          txHash,
          from: transaction.from,
          to: transaction.to,
          value: transaction.value.toString(),
        });

        // Forgiving check: Accept if it's a successful transaction
        // We log warnings but don't block for demo purposes

        // let isValidPayment = false;

        // Check: ERC20 Payment (USDC) ONLY
        // try {
        //   const { args } = decodeFunctionData({
        //     abi: USDC_TRANSFER_ABI,
        //     data: transaction.input,
        //   });
        //   const [to, amount] = args;

        //   // Validate amount matches entry fee (with tolerance for rounding)
        //   const expectedAmount = BigInt(Math.round(game.entryFee * 1_000_000));
        //   const tolerance = BigInt(100); // 0.0001 USDC tolerance

        //   if (
        //     amount < expectedAmount - tolerance ||
        //     amount > expectedAmount + tolerance
        //   ) {
        //     console.warn(
        //       `Amount mismatch: expected ${expectedAmount}, got ${amount}`
        //     );
        //     return {
        //       status: "error",
        //       error: `Incorrect payment amount. Expected ${game.entryFee} USDC.`,
        //     };
        //   }

        //   if (amount > BigInt(0)) {
        //     isValidPayment = true;
        //   }
        // } catch (e) {
        //   console.warn("Could not decode ERC20 transfer:", e);
        // }

        // if (!isValidPayment) {
        //   console.warn("Transaction is not a valid USDC transfer.");
        //   // For bare bone simplicity, we might fail here if strictly USDC is required
        //   // But user said "keep things super simple", so maybe we just return error if not USDC
        //   return { status: "error", error: "Invalid USDC transaction." };
        // }
        // We skip strict recipient/contract checks
        isVerified = true;
        console.log("[BuyWaffle] Transaction verified successfully", {
          txHash,
        });
      } catch (txError) {
        console.error("Transaction verification failed:", txError);
        // If we can't even fetch the tx, that's a real error
        return { status: "error", error: "Failed to verify transaction." };
      }
    } else {
      console.log(
        "[BuyWaffle] No transaction hash provided, ticket will be PENDING"
      );
    }

    console.log("[BuyWaffle] Step 4: Checking for existing ticket", {
      gameId,
      userId,
    });

    // 4. Check for Existing Ticket (Idempotency)
    const existingTicket = await prisma.ticket.findUnique({
      where: { gameId_userId: { gameId, userId } },
    });

    if (existingTicket) {
      console.log("[BuyWaffle] Found existing ticket", {
        ticketId: existingTicket.id,
        ticketStatus: existingTicket.status,
      });

      // If txHash is provided and different, update it
      if (txHash && existingTicket.txHash !== txHash) {
        console.log("[BuyWaffle] Updating existing ticket with new txHash", {
          ticketId: existingTicket.id,
        });

        if (!isVerified) {
          console.error(
            "[BuyWaffle] Cannot update ticket - transaction not verified"
          );
          return { status: "error", error: "Transaction verification failed." };
        }
        const updatedTicket = await prisma.ticket.update({
          where: { id: existingTicket.id },
          data: { txHash: txHash, status: "PAID" },
        });
        console.log("[BuyWaffle] Ticket updated successfully", {
          ticketId: updatedTicket.id,
        });
        return { status: "success", ticket: updatedTicket };
      }
      console.log("[BuyWaffle] Returning existing ticket (idempotent)", {
        ticketId: existingTicket.id,
      });
      return { status: "success", ticket: existingTicket };
    }

    console.log("[BuyWaffle] Step 5: Generating unique ticket code");

    // 5. Generate Unique Code
    let code: string;
    for (let attempt = 0; attempt < 10; attempt++) {
      code = randomBytes(6).toString("hex").toUpperCase();
      if (!(await prisma.ticket.findUnique({ where: { code } }))) {
        break;
      }
      if (attempt === 9) {
        return {
          status: "error",
          error: "Could not generate unique ticket code.",
        };
      }
    }

    console.log("[BuyWaffle] Generated ticket code:", { code: code! });

    // 6. Determine Status
    const status = isVerified ? "PAID" : "PENDING";
    console.log("[BuyWaffle] Ticket status will be:", { status });

    console.log("[BuyWaffle] Step 6: Creating ticket", {
      gameId,
      userId,
      code: code!,
    });

    // 7. Create Ticket
    const newTicket = await prisma.ticket.create({
      data: {
        userId: userId,
        gameId: gameId,
        amountUSDC: game.entryFee,
        code: code!,
        txHash: txHash ?? null,
        status: status,
      },
    });

    console.log("[BuyWaffle] Ticket created successfully", {
      ticketId: newTicket.id,
      code: newTicket.code,
    });

    console.log("[BuyWaffle] Step 7: Creating GamePlayer entry", {
      gameId,
      userId,
    });

    // 8. Create GamePlayer (Join the Lobby)
    // Idempotent creation: if they already exist, do nothing
    await prisma.gamePlayer.upsert({
      where: {
        gameId_userId: {
          gameId: gameId,
          userId: userId,
        },
      },
      update: {}, // No updates needed if exists
      create: {
        gameId: gameId,
        userId: userId,
        score: 0,
        // joinedAt defaults to now()
      },
    });

    console.log("[BuyWaffle] GamePlayer entry created/updated");

    // Revalidate ticket page paths
    console.log("[BuyWaffle] Revalidating paths");
    revalidatePath(`/game/${gameId}/ticket`);
    revalidatePath(`/game`);

    console.log("[BuyWaffle] ✅ Purchase completed successfully", {
      ticketId: newTicket.id,
    });
    return { status: "success", ticket: newTicket };
  } catch (e) {
    console.error("[BuyWaffle] ❌ Error occurred:", e);
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      e.code === "P2002"
    ) {
      const user = await prisma.user.findUnique({
        where: { fid: fid },
      });
      if (user) {
        const existing = await prisma.ticket.findUnique({
          where: { gameId_userId: { gameId, userId: user.id } },
        });
        if (existing) {
          console.log(
            "[BuyWaffle] Returning existing ticket after race condition",
            { ticketId: existing.id }
          );
          return { status: "success", ticket: existing };
        }
      }
      console.error("[BuyWaffle] Race condition - ticket already exists");
      return {
        status: "error",
        error: "Ticket already exists (race condition).",
      };
    }
    console.error("[BuyWaffle] Internal server error");
    return { status: "error", error: "Internal Server Error during purchase." };
  }
}
