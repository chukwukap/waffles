"use client";

import { Clock } from "@/components/icons";
import { AvatarDiamond } from "./AvatarDiamond";
import ChatDrawer from "./ChatDrawer";
import ChatTickerOverlay from "./ChatTickerOverlay";
import { useGameStore } from "@/stores/gameStore";
import { useLobbyStore } from "@/stores/lobbyStore";
import { useCountdown } from "@/hooks/useCountdown";

export default function LobbyView() {
  const game = useGameStore((state) => state.game);
  const ticket = useLobbyStore((state) => state.ticket);

  // Countdown to game start time if available
  const startTimeMs = game?.startTime ? new Date(game.startTime).getTime() : 0;
  const { millisecondsLeft } = useCountdown({ target: startTimeMs, autoStart: true });
  const totalSec = Math.max(0, Math.ceil(millisecondsLeft / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;

  return (
    /**
     * Root takes full height and acts as the positioning context for overlays.
     * Max width lives here, so the whole lobby sits within the game screen nicely.
     */
    <div className="relative mx-auto w-full max-w-screen-sm px-4 pt-6 pb-24 min-h-[100dvh] text-foreground flex flex-col">
      {/* Main scrollable column */}
      <section className="flex-1 flex flex-col items-center gap-3 overflow-y-auto w-full pt-16 pb-4">
        {/* Top bar */}
        <div className="flex w-full h-10 min-h-[38px] items-center justify-center gap-0.5 p-2 sm:p-3">
          {/* Title + clock */}
          <div className="order-0 flex h-7 sm:h-[28px] min-w-0 flex-1 flex-col justify-center gap-3.5 font-body">
            <div className="order-0 flex h-7 sm:h-[28px] min-w-0 w-full flex-row items-center gap-2">
              <span
                className="h-7 w-7 flex-none sm:h-[28px] sm:w-[28px]"
                aria-label="Countdown"
              >
                <Clock />
              </span>
              <span
                className="truncate pl-1 select-none text-white font-normal leading-[0.92] tracking-tight"
                style={{
                  fontSize: "clamp(1rem,4vw,1.6rem)",
                  letterSpacing: "-0.03em",
                }}
              >
                GAME STARTS IN
              </span>
            </div>
          </div>

          {/* Timer pill */}
          <div className="order-1 box-border z-0 flex h-10 min-w-[64px] w-[clamp(72px,20vw,110px)] max-w-[140px] flex-none flex-row items-center justify-center rounded-full border-2 border-[var(--color-neon-pink)] bg-transparent px-4 py-1 sm:px-5 sm:py-2">
            <span className="px-0 flex items-end justify-center w-full min-w-0 select-none not-italic text-center text-xs leading-[115%] text-[var(--color-neon-pink)]">
              {minutes}M {String(seconds).padStart(2, "0")}s
            </span>
          </div>
        </div>

        {/* Prize copy */}
        <div className="flex w-full min-h-[6rem] flex-col items-center justify-end gap-1 pb-2.5">
          <p className="w-auto min-w-[60px] sm:min-w-[80px] select-none text-center font-display font-medium leading-[1.3] tracking-tight text-muted text-[0.95rem] sm:text-base md:text-lg">
            Current prize pool
          </p>
          <div className="flex min-h-[2.5rem] sm:min-h-[2.7rem] w-full items-center justify-center px-2 sm:px-4">
            <span className="block min-w-[70px] sm:min-w-[90px] select-none text-center font-body font-normal leading-[0.92] tracking-tight text-success text-[clamp(2rem,6vw,3rem)]">
              $2,500
            </span>
          </div>
        </div>

        {/* Avatar diamond */}
        <div className="w-full flex justify-center">
          <AvatarDiamond
            avatars={[
              { id: "1", src: "/images/avatars/a.png", alt: "Avatar 1" },
              { id: "2", src: "/images/avatars/b.png", alt: "Avatar 2" },
              { id: "3", src: "/images/avatars/c.png", alt: "Avatar 3" },
              {
                id: "4",
                src: "/images/avatars/d.png",
                alt: "Avatar 4",
                opacity: 0.2,
              },
              { id: "5", src: "/images/avatars/a.png", alt: "Avatar 5" },
              { id: "6", src: "/images/avatars/a.png", alt: "Avatar 6" },
              { id: "7", src: "/images/avatars/a.png", alt: "Avatar 7" },
              { id: "8", src: "/images/avatars/a.png", alt: "Avatar 8" },
              {
                id: "9",
                src: "/images/avatars/a.png",
                alt: "Avatar 9",
                opacity: 0.2,
              },
              { id: "10", src: "/images/avatars/a.png", alt: "Avatar 10" },
              { id: "11", src: "/images/avatars/a.png", alt: "Avatar 11" },
              { id: "12", src: "/images/avatars/a.png", alt: "Avatar 12" },
              { id: "13", src: "/images/avatars/a.png", alt: "Avatar 13" },
              { id: "14", src: "/images/avatars/a.png", alt: "Avatar 14" },
              { id: "15", src: "/images/avatars/a.png", alt: "Avatar 15" },
              { id: "16", src: "/images/avatars/a.png", alt: "Avatar 16" },
              {
                id: "17",
                src: "/images/avatars/a.png",
                alt: "Avatar 17",
                opacity: 0.2,
              },
            ]}
            cellMin={32}
            cellMax={54}
            gap={2}
            className="scale-95 sm:scale-100"
          />
        </div>

        {/* joined count */}
        <p className="mt-1 min-w-[120px] text-center font-display font-medium tracking-[-0.03em] text-muted text-[clamp(13px,4vw,16px)] leading-[130%]">
          {ticket?.id} players have joined
        </p>
      </section>

      {/* bottom shadow mask (kept, anchored to root) */}
      <div className="pointer-events-none absolute left-0 right-0 bottom-[78px] h-28 w-full">
        <div
          className="absolute inset-0 opacity-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 6%, #FFFFFF 100%)",
          }}
        />
        <div className="absolute inset-0 opacity-0" />
      </div>

      {/* overlays anchored to this view */}
      <ChatTickerOverlay
        className="bottom-[7.5rem] sm:bottom-36"
        maxItems={4}
      />
      <ChatDrawer />
    </div>
  );
}
