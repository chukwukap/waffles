"use client";

import { useState } from "react";
import Image from "next/image";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { BuyTicketModal } from "./BuyTicketModal";

interface NextGameCardProps {
  gameId: number;
  theme: string;
  themeIcon?: string;
  tierPrices: number[];
  countdown: number;
  hasTicket: boolean;
  isLive: boolean;
  hasEnded: boolean;
  prizePool?: number;
  spotsTotal?: number;
  spotsTaken?: number;
  recentPlayers?: { avatar?: string; name: string }[];
  onPurchaseSuccess?: () => void;
}

// Dotted pattern background component
function DottedPattern() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(circle, #18181B 1.5px, transparent 1.5px)`,
        backgroundSize: "7px 7px",
        opacity: 0.5,
      }}
    />
  );
}

export function NextGameCard({
  gameId,
  theme,
  themeIcon,
  tierPrices,
  countdown,
  hasTicket,
  isLive,
  hasEnded,
  prizePool = 0,
  spotsTotal = 100,
  spotsTaken = 0,
  recentPlayers = [],
  onPurchaseSuccess,
}: NextGameCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hours = Math.floor(countdown / 3600);
  const minutes = Math.floor((countdown % 3600) / 60);
  const seconds = countdown % 60;
  const formatPart = (n: number) => String(n).padStart(2, "0");
  const countdownDisplay = `${formatPart(hours)}H ${formatPart(
    minutes
  )}M ${formatPart(seconds)}S`;

  const getButtonConfig = () => {
    if (hasEnded)
      return { text: "ENDED", disabled: true, action: "none" as const };
    if (isLive) {
      return hasTicket
        ? {
            text: "START GAME",
            disabled: false,
            action: "navigate" as const,
            href: `/game/${gameId}/live`,
          }
        : { text: "GET TICKET", disabled: false, action: "modal" as const };
    }
    return hasTicket
      ? { text: "YOU'RE IN!", disabled: true, action: "none" as const }
      : { text: "BUY WAFFLE", disabled: false, action: "modal" as const };
  };

  const buttonConfig = getButtonConfig();

  const handleButtonClick = () => {
    if (buttonConfig.disabled) return;
    if (buttonConfig.action === "modal") {
      setIsModalOpen(true);
    } else if (buttonConfig.action === "navigate" && "href" in buttonConfig) {
      window.location.href = buttonConfig.href;
    }
  };

  const othersCount = Math.max(0, spotsTaken - recentPlayers.length);

  return (
    <>
      <div
        className="relative w-full max-w-[361px] mx-auto rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "rgba(21, 21, 25, 0.5)",
          boxShadow: "0px 5px 5.2px 8px rgba(12, 12, 14, 0.5)",
        }}
      >
        {/* Dotted Pattern Background */}
        <DottedPattern />

        {/* Header */}
        <div
          className="relative flex justify-center items-center gap-2 shrink-0 z-10"
          style={{
            height: "clamp(40px, 6vh, 52px)",
            background: "rgba(27, 27, 29, 0.8)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Image
            src="/images/icons/game-controller.png"
            alt="controller"
            width={24}
            height={24}
            className="object-contain"
            style={{ width: "clamp(20px, 3vh, 30px)", height: "auto" }}
          />
          <span
            className="font-body text-white uppercase"
            style={{
              fontSize: "clamp(18px, 3vh, 26px)",
              lineHeight: "92%",
              letterSpacing: "-0.03em",
            }}
          >
            NEXT GAME
          </span>
        </div>

        {/* Stats Row: Spots + Prize Pool */}
        <div
          className="relative flex justify-around items-center z-10 shrink-0"
          style={{ padding: "clamp(8px, 1.5vh, 16px) 0" }}
        >
          {/* Spots */}
          <div
            className="flex flex-col items-center"
            style={{ gap: "clamp(2px, 0.5vh, 4px)" }}
          >
            <Image
              src="/images/illustrations/spots.svg"
              alt="spots"
              width={48}
              height={32}
              className="object-contain"
              style={{ width: "clamp(36px, 6vh, 48px)", height: "auto" }}
            />
            <span
              className="font-display text-white"
              style={{ fontSize: "clamp(10px, 1.5vh, 12px)", opacity: 0.6 }}
            >
              Spots
            </span>
            <span
              className="font-body text-white"
              style={{ fontSize: "clamp(16px, 2.5vh, 24px)" }}
            >
              {spotsTaken}/{spotsTotal}
            </span>
          </div>

          {/* Prize Pool */}
          <div
            className="flex flex-col items-center"
            style={{ gap: "clamp(2px, 0.5vh, 4px)" }}
          >
            <Image
              src="/images/illustrations/money-stack.svg"
              alt="prize"
              width={48}
              height={32}
              className="object-contain"
              style={{ width: "clamp(36px, 6vh, 48px)", height: "auto" }}
            />
            <span
              className="font-display text-white"
              style={{ fontSize: "clamp(10px, 1.5vh, 12px)", opacity: 0.6 }}
            >
              Prize pool
            </span>
            <span
              className="font-body text-white"
              style={{ fontSize: "clamp(16px, 2.5vh, 24px)" }}
            >
              ${prizePool.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Button */}
        <div
          className="relative flex justify-center items-center px-4 z-10 shrink-0"
          style={{ padding: "clamp(6px, 1vh, 12px) 16px" }}
        >
          <FancyBorderButton
            disabled={buttonConfig.disabled}
            onClick={handleButtonClick}
          >
            {buttonConfig.text}
          </FancyBorderButton>
        </div>

        {/* Countdown - Always visible */}
        <div
          className="relative flex flex-col justify-center items-center z-10 shrink-0"
          style={{
            gap: "clamp(4px, 0.8vh, 8px)",
            padding: "clamp(6px, 1vh, 12px) 16px",
          }}
        >
          <div
            className="inline-flex items-center justify-center rounded-full"
            style={{
              border: "2px solid #F5BB1B",
              padding: "clamp(6px, 1vh, 10px) clamp(14px, 2.5vh, 20px)",
              height: "clamp(36px, 5vh, 44px)",
            }}
          >
            <span
              className="font-body"
              style={{
                fontSize: "clamp(16px, 2.5vh, 21px)",
                lineHeight: "115%",
                color: "#F5BB1B",
              }}
            >
              {countdownDisplay}
            </span>
          </div>
          <p
            className="font-display text-white"
            style={{
              fontSize: "clamp(10px, 1.5vh, 12px)",
              opacity: 0.5,
              letterSpacing: "-0.03em",
            }}
          >
            Until game starts
          </p>
        </div>

        {isLive && (
          <div className="relative flex items-center justify-center gap-2 z-10 shrink-0 py-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="font-body text-red-500 text-lg uppercase">
              LIVE NOW
            </span>
          </div>
        )}

        {/* Player Avatars Row */}
        <div
          className="relative flex items-center justify-center z-10 shrink-0"
          style={{
            gap: "clamp(4px, 0.8vh, 6px)",
            padding: "clamp(8px, 1.5vh, 12px) 16px",
          }}
        >
          {spotsTaken > 0 ? (
            <>
              {/* Stacked Avatars */}
              <div className="flex items-center" style={{ marginRight: "6px" }}>
                {recentPlayers.slice(0, 4).map((player, idx) => (
                  <div
                    key={idx}
                    className="rounded-full overflow-hidden shrink-0"
                    style={{
                      width: "clamp(20px, 3vh, 25px)",
                      height: "clamp(20px, 3vh, 25px)",
                      border: "2px solid #FFFFFF",
                      background: "#F0F3F4",
                      marginLeft: idx === 0 ? "0" : "-10px",
                    }}
                  >
                    {player.avatar && (
                      <Image
                        src={player.avatar}
                        alt={player.name}
                        width={25}
                        height={25}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
              {/* "and X others" text */}
              <span
                className="font-display"
                style={{
                  fontSize: "clamp(11px, 1.6vh, 14px)",
                  lineHeight: "130%",
                  color: "#99A0AE",
                  letterSpacing: "-0.03em",
                }}
              >
                {othersCount > 0
                  ? `and ${othersCount} others have joined the game`
                  : "have joined the game"}
              </span>
            </>
          ) : (
            <span
              className="font-display"
              style={{
                fontSize: "clamp(11px, 1.6vh, 14px)",
                color: "#99A0AE",
                opacity: 0.6,
              }}
            >
              Be the first to join!
            </span>
          )}
        </div>
      </div>

      {/* Buy Ticket Modal */}
      <BuyTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        gameId={gameId}
        theme={theme}
        themeIcon={themeIcon}
        tierPrices={tierPrices}
        prizePool={prizePool}
        onPurchaseSuccess={onPurchaseSuccess}
      />
    </>
  );
}
