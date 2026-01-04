import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface MerkleProofResponse {
  gameId: string;
  address: string;
  amount: string; // Amount in token units as string
  amountUSDC: number; // Amount in human-readable USDC
  proof: string[];
  claimedAt: string | null; // ISO timestamp if already claimed, null if not
}

/**
 * GET /api/v1/games/[gameId]/merkle-proof
 * Returns the stored Merkle proof for the authenticated user's prize claim.
 * Proofs are generated and stored during settlement - this just retrieves them.
 */
export const GET = withAuth<{ gameId: string }>(
  async (request, auth: AuthResult, params) => {
    try {
      const gameId = params.gameId;
      if (!gameId) {
        return NextResponse.json<ApiError>(
          { error: "Invalid game ID", code: "INVALID_ID" },
          { status: 400 }
        );
      }

      // Get game and check if settled
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          merkleRoot: true,
          onChainAt: true,
        },
      });

      if (!game) {
        return NextResponse.json<ApiError>(
          { error: "Game not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      if (!game.merkleRoot || !game.onChainAt) {
        return NextResponse.json<ApiError>(
          {
            error: "Game has not been published on-chain yet",
            code: "NOT_PUBLISHED",
          },
          { status: 400 }
        );
      }

      const entry = await prisma.gameEntry.findUnique({
        where: {
          gameId_userId: {
            gameId,
            userId: auth.userId,
          },
        },
        select: {
          rank: true,
          prize: true,
          merkleProof: true,
          merkleAmount: true,
          payerWallet: true,
          claimedAt: true,
          user: {
            select: { wallet: true },
          },
        },
      });

      if (!entry) {
        return NextResponse.json<ApiError>(
          { error: "You do not have an entry in this game", code: "NO_ENTRY" },
          { status: 400 }
        );
      }

      if (!entry.merkleProof || !entry.merkleAmount) {
        return NextResponse.json<ApiError>(
          { error: "You are not a winner in this game", code: "NOT_WINNER" },
          { status: 400 }
        );
      }

      // Use payerWallet (wallet that purchased) or fallback to user.wallet
      const claimAddress = entry.payerWallet || entry.user.wallet;
      if (!claimAddress) {
        return NextResponse.json<ApiError>(
          { error: "No wallet address to claim with", code: "NO_WALLET" },
          { status: 400 }
        );
      }

      return NextResponse.json<MerkleProofResponse>({
        gameId,
        address: claimAddress,
        amount: entry.merkleAmount,
        amountUSDC: entry.prize ?? 0,
        proof: entry.merkleProof as string[],
        claimedAt: entry.claimedAt?.toISOString() ?? null,
      });
    } catch (error) {
      console.error("GET /api/v1/games/[gameId]/merkle-proof Error:", error);
      return NextResponse.json<ApiError>(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }
);
