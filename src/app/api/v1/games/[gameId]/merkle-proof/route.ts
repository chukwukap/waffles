import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateMerkleProof, type Winner } from "@/lib/merkle";
import { parseUnits } from "viem";
import { TOKEN_CONFIG } from "@/lib/contracts/config";

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

      // Get game and check if settled
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          status: true,
          prizePool: true,
        },
      });

      if (!game) {
        return NextResponse.json<ApiError>(
          { error: "Game not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      if (game.status !== "ENDED") {
        return NextResponse.json<ApiError>(
          { error: "Game has not ended yet", code: "GAME_NOT_ENDED" },
          { status: 400 }
        );
      }

      // Get all winners for this game (ranked players with winnings)
      // Rank 1 = 60% of prize pool, Rank 2 = 30%, Rank 3 = 10%
      const rankedPlayers = await prisma.gamePlayer.findMany({
        where: {
          gameId,
          rank: { not: null, lte: 3 }, // Top 3 get prizes
        },
        include: {
          user: {
            select: { wallet: true },
          },
        },
        orderBy: { rank: "asc" },
      });

      if (rankedPlayers.length === 0) {
        return NextResponse.json<ApiError>(
          { error: "No winners for this game", code: "NO_WINNERS" },
          { status: 400 }
        );
      }

      // Calculate prize distribution
      const prizeDistribution = [0.6, 0.3, 0.1]; // 60%, 30%, 10%
      const winners: Winner[] = rankedPlayers
        .filter((p) => p.user.wallet) // Only players with wallets
        .map((player, index) => {
          const prizeShare = prizeDistribution[index] || 0;
          const amountUSDC = game.prizePool * prizeShare;
          const amount = parseUnits(
            amountUSDC.toFixed(6),
            TOKEN_CONFIG.decimals
          );

          return {
            gameId,
            address: player.user.wallet as `0x${string}`,
            amount,
          };
        });

      // Generate proof for this user
      const userProof = generateMerkleProof(
        winners,
        user.wallet as `0x${string}`
      );

      if (!userProof) {
        return NextResponse.json<ApiError>(
          { error: "You are not a winner in this game", code: "NOT_WINNER" },
          { status: 400 }
        );
      }

      // Find the user's prize info
      const userWinnerIndex = winners.findIndex(
        (w) => w.address.toLowerCase() === user.wallet!.toLowerCase()
      );
      const userRank = rankedPlayers[userWinnerIndex]?.rank || 0;
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
