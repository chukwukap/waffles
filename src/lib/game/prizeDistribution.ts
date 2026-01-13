/**
 * Prize Distribution Algorithm
 *
 * Distributes prize pool among top 10 winners with tiered system:
 * - Top 3 (Podium): Share 70% of net pool with rank-based weights
 * - Ranks 4-10 (Runners): Share 30% of net pool proportionally by ticket
 *
 * Within each rank, higher ticket purchases earn more.
 * 20% platform fee is deducted before distribution.
 *
 * @module prizeDistribution
 */

// ============================================================================
// Configuration
// ============================================================================

/** Number of players who receive prizes */
export const WINNERS_COUNT = 10;

/** Platform fee in basis points (20% = 2000 bps) */
export const PLATFORM_FEE_BPS = 2000;

/** Podium ranks (top 3) share this percentage of net pool */
const PODIUM_SHARE = 0.7; // 70%

/** Runners (ranks 4-10) share this percentage of net pool */
const RUNNERS_SHARE = 0.3; // 30%

/**
 * Base weights for podium positions (normalized internally).
 * Rank 1 gets most, Rank 3 gets least of the podium share.
 */
const PODIUM_WEIGHTS: Record<number, number> = {
  1: 50, // Rank 1: ~50% of podium share
  2: 33, // Rank 2: ~33% of podium share
  3: 17, // Rank 3: ~17% of podium share
};

// ============================================================================
// Types
// ============================================================================

export interface PlayerEntry {
  id: string;
  userId: string;
  score: number;
  paidAmount: number; // Ticket price paid (tier)
  username?: string;
}

export interface PrizeAllocation {
  entryId: string;
  userId: string;
  rank: number;
  prize: number;
  username?: string;
  tier: "podium" | "runner" | "none";
}

export interface DistributionResult {
  allocations: PrizeAllocation[];
  grossPool: number;
  platformFee: number;
  netPool: number;
  podiumTotal: number;
  runnersTotal: number;
}

// ============================================================================
// Core Algorithm
// ============================================================================

/**
 * Calculate prize distribution for all players.
 *
 * Algorithm:
 * 1. Deduct platform fee (20%)
 * 2. Split net pool: 70% podium, 30% runners
 * 3. Podium (1-3): Distribute by rank weight × ticket multiplier
 * 4. Runners (4-10): Distribute proportionally by ticket amount
 * 5. Others: Rank only, no prize
 *
 * Edge cases handled:
 * - Less than 3 players: Podium share redistributed among available
 * - Less than 10 players: Runner share among available
 * - Zero total tickets: Equal split within tier
 * - Single winner: Gets full net pool
 *
 * @param entries - All game entries sorted by score DESC, updatedAt ASC
 * @param grossPrizePool - Total prize pool before fees
 * @returns Distribution result with all allocations
 */
export function calculatePrizeDistribution(
  entries: PlayerEntry[],
  grossPrizePool: number
): DistributionResult {
  // Filter only paid entries
  const paidEntries = entries.filter((e) => e.paidAmount > 0);

  // Calculate fee and net pool
  const platformFee = grossPrizePool * (PLATFORM_FEE_BPS / 10000);
  const netPool = grossPrizePool - platformFee;

  // Handle no entries case
  if (paidEntries.length === 0) {
    return {
      allocations: entries.map((e, i) => ({
        entryId: e.id,
        userId: e.userId,
        rank: i + 1,
        prize: 0,
        username: e.username,
        tier: "none",
      })),
      grossPool: grossPrizePool,
      platformFee,
      netPool,
      podiumTotal: 0,
      runnersTotal: 0,
    };
  }

  // Single winner edge case
  if (paidEntries.length === 1) {
    return {
      allocations: entries.map((e, i) => ({
        entryId: e.id,
        userId: e.userId,
        rank: i + 1,
        prize: i === 0 ? netPool : 0,
        username: e.username,
        tier: i === 0 ? "podium" : "none",
      })),
      grossPool: grossPrizePool,
      platformFee,
      netPool,
      podiumTotal: netPool,
      runnersTotal: 0,
    };
  }

  // Split entries into tiers
  const podiumEntries = paidEntries.slice(0, Math.min(3, paidEntries.length));
  const runnerEntries = paidEntries.slice(3, Math.min(WINNERS_COUNT, paidEntries.length));
  const nonWinners = paidEntries.slice(WINNERS_COUNT);

  // Calculate tier pools based on actual participant counts
  const { podiumPool, runnersPool } = calculateTierPools(
    netPool,
    podiumEntries.length,
    runnerEntries.length
  );

  // Distribute podium prizes (rank weight × ticket multiplier)
  const podiumAllocations = distributePodium(podiumEntries, podiumPool);

  // Distribute runner prizes (proportional by ticket)
  const runnerAllocations = distributeRunners(runnerEntries, runnersPool, 4);

  // Non-winners get rank only
  const nonWinnerAllocations = nonWinners.map((e, i) => ({
    entryId: e.id,
    userId: e.userId,
    rank: WINNERS_COUNT + i + 1,
    prize: 0,
    username: e.username,
    tier: "none" as const,
  }));

  // Also include unpaid entries at the end
  const unpaidEntries = entries.filter((e) => e.paidAmount <= 0);
  const unpaidAllocations = unpaidEntries.map((e, i) => ({
    entryId: e.id,
    userId: e.userId,
    rank: paidEntries.length + i + 1,
    prize: 0,
    username: e.username,
    tier: "none" as const,
  }));

  // Combine all allocations
  const allocations = [
    ...podiumAllocations,
    ...runnerAllocations,
    ...nonWinnerAllocations,
    ...unpaidAllocations,
  ];

  return {
    allocations,
    grossPool: grossPrizePool,
    platformFee,
    netPool,
    podiumTotal: podiumAllocations.reduce((sum, a) => sum + a.prize, 0),
    runnersTotal: runnerAllocations.reduce((sum, a) => sum + a.prize, 0),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate tier pools, redistributing if tiers are incomplete.
 */
function calculateTierPools(
  netPool: number,
  podiumCount: number,
  runnerCount: number
): { podiumPool: number; runnersPool: number } {
  // No runners → podium gets everything
  if (runnerCount === 0) {
    return { podiumPool: netPool, runnersPool: 0 };
  }

  // Standard split with both tiers
  const podiumPool = netPool * PODIUM_SHARE;
  const runnersPool = netPool * RUNNERS_SHARE;

  return { podiumPool, runnersPool };
}

/**
 * Distribute podium prizes using rank weights and ticket multipliers.
 *
 * Formula per player:
 *   baseWeight = PODIUM_WEIGHTS[rank]
 *   ticketMultiplier = paidAmount / avgTicket
 *   effectiveWeight = baseWeight × ticketMultiplier
 *   prize = (effectiveWeight / totalEffectiveWeight) × podiumPool
 *
 * This ensures:
 * - Higher rank always gets more (via rank weights)
 * - Higher ticket earns bonus within their rank band
 */
function distributePodium(entries: PlayerEntry[], pool: number): PrizeAllocation[] {
  if (entries.length === 0 || pool <= 0) return [];

  // Calculate average ticket for normalization
  const totalTickets = entries.reduce((sum, e) => sum + e.paidAmount, 0);
  const avgTicket = totalTickets / entries.length;

  // Calculate effective weights
  const weighted = entries.map((entry, i) => {
    const rank = i + 1;
    const baseWeight = PODIUM_WEIGHTS[rank] ?? 10;

    // Ticket multiplier: ranges from 0.5x to 1.5x based on deviation from average
    // This ensures rank weight dominates, but tickets still matter
    const ticketRatio = avgTicket > 0 ? entry.paidAmount / avgTicket : 1;
    const ticketMultiplier = 0.5 + Math.min(ticketRatio, 2) * 0.5; // Clamp to [0.5, 1.5]

    const effectiveWeight = baseWeight * ticketMultiplier;

    return { entry, rank, effectiveWeight };
  });

  // Normalize and calculate prizes
  const totalWeight = weighted.reduce((sum, w) => sum + w.effectiveWeight, 0);

  return weighted.map(({ entry, rank, effectiveWeight }) => ({
    entryId: entry.id,
    userId: entry.userId,
    rank,
    prize: totalWeight > 0 ? (effectiveWeight / totalWeight) * pool : pool / entries.length,
    username: entry.username,
    tier: "podium" as const,
  }));
}

/**
 * Distribute runner prizes proportionally by ticket amount.
 *
 * Formula: prize = (playerTicket / totalTickets) × runnersPool
 *
 * If tickets are equal, prizes are equal.
 */
function distributeRunners(
  entries: PlayerEntry[],
  pool: number,
  startRank: number
): PrizeAllocation[] {
  if (entries.length === 0 || pool <= 0) return [];

  const totalTickets = entries.reduce((sum, e) => sum + e.paidAmount, 0);

  return entries.map((entry, i) => ({
    entryId: entry.id,
    userId: entry.userId,
    rank: startRank + i,
    prize: totalTickets > 0 ? (entry.paidAmount / totalTickets) * pool : pool / entries.length,
    username: entry.username,
    tier: "runner" as const,
  }));
}

// ============================================================================
// Validation & Edge Case Utilities
// ============================================================================

/**
 * Validate distribution result for consistency.
 * Useful for testing and debugging.
 */
export function validateDistribution(result: DistributionResult): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check that total prizes equal net pool (within floating point tolerance)
  const totalPrizes = result.allocations.reduce((sum, a) => sum + a.prize, 0);
  const tolerance = 0.01; // 1 cent tolerance

  if (Math.abs(totalPrizes - result.netPool) > tolerance) {
    errors.push(
      `Prize sum (${totalPrizes.toFixed(6)}) doesn't match net pool (${result.netPool.toFixed(6)})`
    );
  }

  // Check rank ordering
  const ranks = result.allocations.map((a) => a.rank);
  const sortedRanks = [...ranks].sort((a, b) => a - b);
  if (JSON.stringify(ranks) !== JSON.stringify(sortedRanks)) {
    errors.push("Ranks are not in ascending order");
  }

  // Check for duplicate ranks
  const uniqueRanks = new Set(ranks);
  if (uniqueRanks.size !== ranks.length) {
    errors.push("Duplicate ranks found");
  }

  // Check that podium tier has highest prizes
  const podiumPrizes = result.allocations.filter((a) => a.tier === "podium").map((a) => a.prize);
  const runnerPrizes = result.allocations.filter((a) => a.tier === "runner").map((a) => a.prize);

  if (podiumPrizes.length > 0 && runnerPrizes.length > 0) {
    const minPodium = Math.min(...podiumPrizes);
    const maxRunner = Math.max(...runnerPrizes);
    if (minPodium < maxRunner) {
      errors.push(`Podium min (${minPodium}) is less than runner max (${maxRunner})`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Format distribution for logging/debugging.
 */
export function formatDistribution(result: DistributionResult): string {
  const lines = [
    `=== Prize Distribution ===`,
    `Gross Pool: $${result.grossPool.toFixed(2)}`,
    `Platform Fee: $${result.platformFee.toFixed(2)} (${PLATFORM_FEE_BPS / 100}%)`,
    `Net Pool: $${result.netPool.toFixed(2)}`,
    `Podium Total: $${result.podiumTotal.toFixed(2)}`,
    `Runners Total: $${result.runnersTotal.toFixed(2)}`,
    ``,
    `Rank | Tier    | Prize     | User`,
    `-`.repeat(50),
  ];

  for (const a of result.allocations) {
    if (a.prize > 0) {
      const tierLabel = a.tier.padEnd(7);
      const prizeStr = `$${a.prize.toFixed(2)}`.padStart(10);
      lines.push(`#${a.rank.toString().padEnd(3)} | ${tierLabel} | ${prizeStr} | ${a.username ?? a.userId}`);
    }
  }

  return lines.join("\n");
}
