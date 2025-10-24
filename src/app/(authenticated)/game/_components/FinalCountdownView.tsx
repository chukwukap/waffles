"use client";

import Image from "next/image";
import { Clock } from "@/components/icons";
import { useCountdown } from "@/hooks/useCountdown";
import { useGame, useLobby } from "@/state";

const FINAL_COUNTDOWN_SECONDS = 10;

export function FinalCountdownView() {
  const { setView } = useGame();
  const { stats } = useLobby();
  const totalJoined = stats?.totalTickets ?? 0;

  const { secondsLeft } = useCountdown({
    durationSeconds: FINAL_COUNTDOWN_SECONDS,
    autoStart: true,
    onComplete: () => setView("QUESTION_ACTIVE"),
  });

  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-80px)] w-full max-w-screen-sm flex-col items-center justify-center gap-10 px-4 text-white">
      <header className="flex w-full flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-3 text-xl sm:text-2xl md:text-3xl font-edit-undo tracking-tight">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Clock />
          </span>
          GAME STARTS IN
        </div>
        <div className="flex items-center gap-3 text-lg text-muted">
          <Image
            src="/images/illustration/waffle-ticket.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8"
          />
          Ready up!
        </div>
      </header>

      <div className="flex items-center justify-center rounded-[32px] border border-white/10 bg-black/30 px-8 py-10 text-[#14B985] shadow-[0_15px_35px_rgba(0,0,0,0.35)]">
        <span
          className="font-edit-undo leading-none tracking-tight text-[25vw] sm:text-[18vw] md:text-[14vw]"
          aria-live="polite"
        >
          {String(Math.max(0, secondsLeft)).padStart(2, "0")}
        </span>
      </div>

      <div className="flex flex-col items-center gap-3 text-sm text-[#99A0AE]">
        <div className="flex items-center -space-x-4">
          {["/images/avatars/a.png", "/images/avatars/b.png", "/images/avatars/c.png", "/images/avatars/d.png"].map(
            (src, index) => (
              <span
                key={`${src}-${index}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#0E0E11]"
                style={{ transform: `rotate(${[-8, 5, -3, 7][index] ?? 0}deg)` }}
              >
                <Image src={src} alt="" width={36} height={36} className="h-full w-full rounded-xl object-cover" />
              </span>
            )
          )}
        </div>
        <p className="font-display text-base">
          {totalJoined > 0
            ? `${totalJoined} people have joined the game`
            : "Loading players…"}
        </p>
      </div>
    </div>
  );
}
