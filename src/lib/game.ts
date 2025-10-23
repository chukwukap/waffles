import { prisma } from "@/lib/db";
import type { Game, GameConfig, GlobalConfig } from "@prisma/client";

export interface EffectiveConfig {
  ticketPrice: number;
  roundTimeLimit: number;
  questionsPerGame: number;
  scoreMultiplier: number;
  scorePenalty: number | null;
  maxPlayers: number;
  soundEnabled: boolean;
  animationEnabled: boolean;
  timeBonusEnabled: boolean;
  difficultyScaling: number;
}

function mergeConfig(globalCfg: GlobalConfig, gameCfg?: GameConfig | null): EffectiveConfig {
  return {
    ticketPrice: gameCfg?.ticketPrice ?? globalCfg.ticketPrice,
    roundTimeLimit: gameCfg?.roundTimeLimit ?? globalCfg.roundTimeLimit,
    questionsPerGame: gameCfg?.questionsPerGame ?? globalCfg.questionsPerGame,
    scoreMultiplier: gameCfg?.scoreMultiplier ?? globalCfg.scoreMultiplier,
    scorePenalty: gameCfg?.scorePenalty ?? globalCfg.scorePenalty ?? null,
    maxPlayers: gameCfg?.maxPlayers ?? globalCfg.maxPlayers,
    soundEnabled: gameCfg?.soundEnabled ?? globalCfg.soundEnabled,
    animationEnabled: gameCfg?.animationEnabled ?? globalCfg.animationEnabled,
    timeBonusEnabled: gameCfg?.timeBonusEnabled ?? globalCfg.timeBonusEnabled,
    difficultyScaling: gameCfg?.difficultyScaling ?? globalCfg.difficultyScaling,
  };
}

export async function getActiveGameWithConfig(): Promise<{
  game: Pick<Game, "id" | "name" | "startTime" | "endTime">;
  config: EffectiveConfig;
}> {
  const now = new Date();

  // Find an active game: started and not finished
  const game = await prisma.game.findFirst({
    where: {
      startTime: { lte: now },
      OR: [{ endTime: null }, { endTime: { gt: now } }],
    },
    orderBy: { startTime: "desc" },
    select: { id: true, name: true, startTime: true, endTime: true },
  });

  if (!game) {
    throw new Error("NO_ACTIVE_GAME");
  }

  const globalCfg = await prisma.globalConfig.findFirst();
  if (!globalCfg) {
    throw new Error("MISSING_GLOBAL_CONFIG");
  }

  const gameCfg = await prisma.gameConfig.findUnique({ where: { gameId: game.id } });
  const config = mergeConfig(globalCfg, gameCfg);

  return { game, config };
}


