import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateMerkleProof, type Winner } from "@/lib/chain";
import { parseUnits } from "viem";
import { TOKEN_CONFIG } from "@/lib/chain";
import { getGamePhase } from "@/lib/types";

interface MerkleProofResponse {
  gameId: number;
  address: string;
  amount: string; // Amount in token units as string
  amountUSDC: number; // Amount in human-readable USDC
  proof: `0x${string}`[];
}

/**
 * GET /api/v1/games/[gameId]/merkle-proof
 * Generate Merkle proof for the authenticated user's prize claim
 */
export const GET = withAuth<{ gameId: string }>(
  async (request, auth: AuthResult, params) => {
    try {
      const gameId = parseInt(params.gameId);
      if (isNaN(gameId)) {
        return NextResponse.json<ApiError>(
          { error: "Invalid game ID", code: "INVALID_ID" },
          { status: 400 }
        );
      }

      // Get user's wallet address
      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { wallet: true },
      });

      if (!user?.wallet) {
        return NextResponse.json<ApiError>(
          { error: "No wallet address connected", code: "NO_WALLET" },
          { status: 400 }
        );
      }

      // Get game and check if ended
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          onchainId: true,
          startsAt: true,
          endsAt: true,
          prizePool: true,
        },
      });

      if (!game) {
        return NextResponse.json<ApiError>(
          { error: "Game not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      if (!game.onchainId) {
        return NextResponse.json<ApiError>(
          { error: "Game has no on-chain ID", code: "NO_ONCHAIN_ID" },
          { status: 400 }
        );
      }

      const phase = getGamePhase(game);
      if (phase !== "ENDED") {
        return NextResponse.json<ApiError>(
          { error: "Game has not ended yet", code: "GAME_NOT_ENDED" },
          { status: 400 }
        );
      }

      // Get all winners for this game (entries with rank <= 3)
      // Rank 1 = 60% of prize pool, Rank 2 = 30%, Rank 3 = 10%
      const rankedEntries = await prisma.gameEntry.findMany({
        where: {
          gameId,
          rank: { not: null, lte: 3 }, // Top 3 get prizes
          paidAt: { not: null },
        },
        include: {
          user: {
            select: { wallet: true },
          },
        },
        orderBy: { rank: "asc" },
      });

      if (rankedEntries.length === 0) {
        return NextResponse.json<ApiError>(
          { error: "No winners for this game", code: "NO_WINNERS" },
          { status: 400 }
        );
      }

      // Calculate prize distribution
      const prizeDistribution = [0.6, 0.3, 0.1]; // 60%, 30%, 10%
      const onchainId = game.onchainId as `0x${string}`;
      const winners: Winner[] = rankedEntries
        // Use payerWallet (wallet that purchased) or fallback to user.wallet for older entries
        .filter((e) => e.payerWallet || e.user.wallet)
        .map((entry, index) => {
          const prizeShare = prizeDistribution[index] || 0;
          const amountUSDC = game.prizePool * prizeShare;
          const amount = parseUnits(
            amountUSDC.toFixed(6),
            TOKEN_CONFIG.decimals
          );
          // Prefer payerWallet (the wallet that actually paid), fallback to user.wallet
          const winnerAddress = (entry.payerWallet ||
            entry.user.wallet) as `0x${string}`;

          return {
            gameId: onchainId, // Use onchainId for Merkle tree
            address: winnerAddress,
            amount,
          };
        });

      // Find the user's entry to determine which wallet to use for proof lookup
      const userEntry = rankedEntries.find((e) => e.userId === auth.userId);
      const userClaimWallet = userEntry
        ? userEntry.payerWallet || userEntry.user.wallet
        : user.wallet;

      if (!userClaimWallet) {
        return NextResponse.json<ApiError>(
          { error: "No wallet address to claim with", code: "NO_WALLET" },
          { status: 400 }
        );
      }

      // Generate proof for this user's claim wallet
      const userProof = generateMerkleProof(
        winners,
        userClaimWallet as `0x${string}`
      );

      if (!userProof) {
        return NextResponse.json<ApiError>(
          { error: "You are not a winner in this game", code: "NOT_WINNER" },
          { status: 400 }
        );
      }

      // Find the user's prize info
      const userWinnerIndex = winners.findIndex(
        (w) => w.address.toLowerCase() === userClaimWallet.toLowerCase()
      );
      const userRank = rankedEntries[userWinnerIndex]?.rank || 0;
      const prizeShare = prizeDistribution[userRank - 1] || 0;
      const amountUSDC = game.prizePool * prizeShare;

      return NextResponse.json<MerkleProofResponse>({
        gameId,
        address: user.wallet,
        amount: userProof.amount.toString(),
        amountUSDC,
        proof: userProof.proof,
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
