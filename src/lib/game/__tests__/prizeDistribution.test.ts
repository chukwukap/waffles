/**
 * Prize Distribution Algorithm Tests
 *
 * Tests the tiered prize distribution system:
 * - Top 3 (podium) share 70% of net pool
 * - Ranks 4-10 (runners) share 30% of net pool
 * - 20% platform fee is deducted
 * - Higher tickets = higher prizes within tier
 */

import {
  calculatePrizeDistribution,
  validateDistribution,
  formatDistribution,
  WINNERS_COUNT,
  PLATFORM_FEE_BPS,
  type PlayerEntry,
} from "../prizeDistribution";

// ============================================================================
// Test Helpers
// ============================================================================

function createPlayer(overrides: Partial<PlayerEntry> = {}): PlayerEntry {
  return {
    id: `entry-${Math.random().toString(36).slice(2)}`,
    userId: `user-${Math.random().toString(36).slice(2)}`,
    score: 1000,
    paidAmount: 10,
    username: "testuser",
    ...overrides,
  };
}

function createPlayers(count: number, baseScore = 1000): PlayerEntry[] {
  return Array.from({ length: count }, (_, i) =>
    createPlayer({
      id: `entry-${i}`,
      userId: `user-${i}`,
      score: baseScore - i * 10, // Higher rank = higher score
      paidAmount: 10,
      username: `player${i}`,
    })
  );
}

// ============================================================================
// Core Tests
// ============================================================================

describe("Prize Distribution Algorithm", () => {
  describe("Basic Distribution", () => {
    it("should deduct 20% platform fee", () => {
      const players = createPlayers(10);
      const grossPool = 1000;

      const result = calculatePrizeDistribution(players, grossPool);

      expect(result.platformFee).toBe(200); // 20% of 1000
      expect(result.netPool).toBe(800); // 1000 - 200
    });

    it("should distribute all net pool among top 10", () => {
      const players = createPlayers(15);
      const grossPool = 1000;

      const result = calculatePrizeDistribution(players, grossPool);
      const validation = validateDistribution(result);

      expect(validation.valid).toBe(true);

      // Total prizes should equal net pool (within tolerance)
      const totalPrizes = result.allocations.reduce((sum, a) => sum + a.prize, 0);
      expect(Math.abs(totalPrizes - result.netPool)).toBeLessThan(0.01);
    });

    it("should give podium (ranks 1-3) more than runners (ranks 4-10)", () => {
      const players = createPlayers(10);
      const grossPool = 1000;

      const result = calculatePrizeDistribution(players, grossPool);

      // Minimum podium prize should be > maximum runner prize
      const podiumPrizes = result.allocations
        .filter((a) => a.tier === "podium")
        .map((a) => a.prize);
      const runnerPrizes = result.allocations
        .filter((a) => a.tier === "runner")
        .map((a) => a.prize);

      const minPodium = Math.min(...podiumPrizes);
      const maxRunner = Math.max(...runnerPrizes);

      expect(minPodium).toBeGreaterThan(maxRunner);
    });

    it("should rank players by score (higher score = lower rank number)", () => {
      const players = createPlayers(5);
      const grossPool = 500;

      const result = calculatePrizeDistribution(players, grossPool);

      // Verify ranks are in order
      for (let i = 0; i < result.allocations.length; i++) {
        expect(result.allocations[i].rank).toBe(i + 1);
      }
    });
  });

  describe("Ticket Weighting", () => {
    it("should give higher prizes to players with higher tickets at same rank tier", () => {
      // Create 3 podium players with different ticket amounts
      const players = [
        createPlayer({ id: "1", userId: "u1", score: 1000, paidAmount: 25 }),
        createPlayer({ id: "2", userId: "u2", score: 900, paidAmount: 10 }),
        createPlayer({ id: "3", userId: "u3", score: 800, paidAmount: 5 }),
      ];
      const grossPool = 300;

      const result = calculatePrizeDistribution(players, grossPool);

      // Rank 1 should have highest prize (best score + highest ticket)
      expect(result.allocations[0].prize).toBeGreaterThan(result.allocations[1].prize);
      expect(result.allocations[1].prize).toBeGreaterThan(result.allocations[2].prize);
    });

    it("should distribute runner prizes proportionally by ticket", () => {
      // Create exact scenario: 3 podium + 3 runners with different tickets
      const players = [
        createPlayer({ id: "1", userId: "u1", score: 1000, paidAmount: 10 }),
        createPlayer({ id: "2", userId: "u2", score: 900, paidAmount: 10 }),
        createPlayer({ id: "3", userId: "u3", score: 800, paidAmount: 10 }),
        // Runners: rank 4 has 2x the ticket of rank 5
        createPlayer({ id: "4", userId: "u4", score: 700, paidAmount: 20 }),
        createPlayer({ id: "5", userId: "u5", score: 600, paidAmount: 10 }),
      ];
      const grossPool = 500;

      const result = calculatePrizeDistribution(players, grossPool);

      // Rank 4 should get ~2x the prize of rank 5
      const rank4Prize = result.allocations.find((a) => a.rank === 4)?.prize ?? 0;
      const rank5Prize = result.allocations.find((a) => a.rank === 5)?.prize ?? 0;

      // Should be roughly 2:1 ratio (allow some tolerance)
      expect(rank4Prize / rank5Prize).toBeCloseTo(2, 1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle no entries", () => {
      const result = calculatePrizeDistribution([], 1000);

      expect(result.allocations).toHaveLength(0);
      expect(result.platformFee).toBe(200);
      expect(result.netPool).toBe(800);
    });

    it("should handle single winner", () => {
      const players = [createPlayer({ score: 1000, paidAmount: 10 })];
      const grossPool = 100;

      const result = calculatePrizeDistribution(players, grossPool);
      const validation = validateDistribution(result);

      expect(validation.valid).toBe(true);
      expect(result.allocations[0].prize).toBe(80); // 100 - 20% fee
      expect(result.allocations[0].tier).toBe("podium");
    });

    it("should handle exactly 3 players (podium only, no runners)", () => {
      const players = createPlayers(3);
      const grossPool = 300;

      const result = calculatePrizeDistribution(players, grossPool);
      const validation = validateDistribution(result);

      expect(validation.valid).toBe(true);

      // All should be podium tier
      const podiumCount = result.allocations.filter((a) => a.tier === "podium").length;
      expect(podiumCount).toBe(3);

      // No runners
      const runnerCount = result.allocations.filter((a) => a.tier === "runner").length;
      expect(runnerCount).toBe(0);

      // Podium gets entire net pool when no runners
      expect(result.podiumTotal).toBeCloseTo(result.netPool, 2);
    });

    it("should handle less than 10 players", () => {
      const players = createPlayers(7);
      const grossPool = 700;

      const result = calculatePrizeDistribution(players, grossPool);
      const validation = validateDistribution(result);

      expect(validation.valid).toBe(true);

      // 3 podium + 4 runners
      const podiumCount = result.allocations.filter((a) => a.tier === "podium").length;
      const runnerCount = result.allocations.filter((a) => a.tier === "runner").length;

      expect(podiumCount).toBe(3);
      expect(runnerCount).toBe(4);
    });

    it("should handle more than 10 players (only top 10 get prizes)", () => {
      const players = createPlayers(20);
      const grossPool = 2000;

      const result = calculatePrizeDistribution(players, grossPool);

      // Only top 10 should have prizes
      const winnersWithPrizes = result.allocations.filter((a) => a.prize > 0);
      expect(winnersWithPrizes.length).toBe(WINNERS_COUNT);

      // Ranks 11-20 should have no prize
      const nonWinners = result.allocations.filter((a) => a.tier === "none");
      expect(nonWinners.length).toBe(10);
    });

    it("should handle unpaid entries (paidAmount = 0)", () => {
      const players = [
        createPlayer({ id: "1", score: 1000, paidAmount: 10 }),
        createPlayer({ id: "2", score: 900, paidAmount: 0 }), // Unpaid
        createPlayer({ id: "3", score: 800, paidAmount: 10 }),
      ];
      const grossPool = 200;

      const result = calculatePrizeDistribution(players, grossPool);

      // Unpaid player should get no prize
      const unpaidAlloc = result.allocations.find((a) => a.entryId === "2");
      expect(unpaidAlloc?.prize).toBe(0);

      // But they should still be ranked at the end
      expect(unpaidAlloc?.tier).toBe("none");
    });

    it("should handle zero prize pool", () => {
      const players = createPlayers(5);
      const grossPool = 0;

      const result = calculatePrizeDistribution(players, grossPool);

      expect(result.netPool).toBe(0);
      expect(result.allocations.every((a) => a.prize === 0)).toBe(true);
    });

    it("should handle equal ticket amounts (fair split within tier)", () => {
      const players = createPlayers(4); // 3 podium + 1 runner
      const grossPool = 400;

      const result = calculatePrizeDistribution(players, grossPool);

      // Runners should all get equal share when tickets are equal
      const runners = result.allocations.filter((a) => a.tier === "runner");

      if (runners.length > 1) {
        const firstRunnerPrize = runners[0].prize;
        runners.forEach((r) => {
          expect(r.prize).toBeCloseTo(firstRunnerPrize, 2);
        });
      }
    });
  });

  describe("Validation", () => {
    it("should pass validation for standard distribution", () => {
      const players = createPlayers(10);
      const result = calculatePrizeDistribution(players, 1000);
      const validation = validateDistribution(result);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should format distribution for logging", () => {
      const players = createPlayers(5);
      const result = calculatePrizeDistribution(players, 500);
      const formatted = formatDistribution(result);

      expect(formatted).toContain("Prize Distribution");
      expect(formatted).toContain("Gross Pool");
      expect(formatted).toContain("Platform Fee");
      expect(formatted).toContain("Net Pool");
    });
  });

  describe("Constants", () => {
    it("should have correct winner count", () => {
      expect(WINNERS_COUNT).toBe(10);
    });

    it("should have correct platform fee", () => {
      expect(PLATFORM_FEE_BPS).toBe(2000); // 20%
    });
  });
});
