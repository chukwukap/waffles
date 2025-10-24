"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type SummaryItemProps = {
  iconSrc: string;
  label: string;
  value: string;
};

type ConfirmationViewProps = {
  gameTitle: string;
  theme: string;
  username: string;
  avatarUrl: string;
  prizePool: number | null;
  onShare: () => void;
  onBackHome: () => void;
};

const SummaryItem = ({ iconSrc, label, value }: SummaryItemProps) => (
  <div className="flex flex-1 items-center gap-3 rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
    <Image src={iconSrc} alt={label} width={32} height={32} />
    <div>
      <p className="text-sm font-display text-[#99A0AE]">{label}</p>
      <p className="font-edit-undo text-lg text-white">{value}</p>
    </div>
  </div>
);

export function BuyConfirmation({
  gameTitle,
  theme,
  username,
  avatarUrl,
  prizePool,
  onShare,
  onBackHome,
}: ConfirmationViewProps) {
  const formattedPrize =
    prizePool !== null ? `$${prizePool.toLocaleString("en-US")}` : "TBA";

  return (
    <div className="min-h-[100dvh] w-full bg-figmaYay noise">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[420px] flex-col items-center px-5 pb-[calc(env(safe-area-inset-bottom)+48px)] pt-14">
        <Image
          src="/images/illustration/waffle-ticket.png"
          alt="Pixel waffle"
          width={228}
          height={132}
          priority
          className="mb-8 h-auto w-[228px]"
        />

        <h1
          className="text-foreground text-center font-edit-undo"
          style={{
            fontSize: "42px",
            lineHeight: "0.92",
            letterSpacing: "-0.03em",
          }}
        >
          WAFFLE SECURED!
        </h1>

        <p className="mt-3 text-center text-base font-display text-[#99A0AE]">
          You&apos;re in for {gameTitle}. See you Friday.
        </p>

        <div className="mt-8 w-full rounded-[24px] border border-[#FFC931]/60 bg-black/30 p-4 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="relative size-14 overflow-hidden rounded-full border border-white/15">
              <Image
                src={avatarUrl}
                alt={username}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-edit-undo text-white text-xl">
                {username}
              </span>
              <span className="text-sm font-display text-[#99A0AE]">
                has joined the next game
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row">
            <SummaryItem
              iconSrc="/images/icons/icon-prizepool-cash.png"
              label="Prize pool"
              value={formattedPrize}
            />
            <SummaryItem
              iconSrc="/images/icons/icon-theme-football.png"
              label="Theme"
              value={theme.toUpperCase()}
            />
          </div>
        </div>

        <button
          onClick={onShare}
          className={cn(
            "mt-8 w-full rounded-[14px] bg-white px-6 py-4 text-center font-edit-undo text-2xl text-[#FB72FF]",
            "border-r-[5px] border-b-[5px] border-[#FB72FF] transition active:translate-x-[2px] active:translate-y-[2px]"
          )}
        >
          SHARE TICKET
        </button>

        <button
          onClick={onBackHome}
          className="mt-6 text-sm font-edit-undo uppercase text-[#00CFF2] transition hover:text-[#33defa]"
        >
          BACK TO HOME
        </button>
      </div>
    </div>
  );
}
