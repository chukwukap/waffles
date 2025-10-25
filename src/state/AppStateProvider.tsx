"use client";

import { GameStateProvider } from "./game/GameContext";
import { LobbyProvider } from "./lobby/LobbyContext";
import { LeaderboardProvider } from "./leaderboard/LeaderboardContext";
import { ProfileProvider } from "./profile/ProfileContext";
import { FinalRoundProvider } from "./final-round/FinalRoundContext";

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  return (
    <GameStateProvider>
      <LobbyProvider>
        <ProfileProvider>
          <LeaderboardProvider>
            <FinalRoundProvider>{children}</FinalRoundProvider>
          </LeaderboardProvider>
        </ProfileProvider>
      </LobbyProvider>
    </GameStateProvider>
  );
}
