"use client";

import { useState } from "react";
import Image from "next/image";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { BuyTicketModal } from "./BuyTicketModal";

interface NextGameCardProps {
  gameId: number;
  onchainId: `0x${string}` | null;
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
  username?: string;
  userAvatar?: string;
}

export function NextGameCard({
  gameId,
  onchainId,
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
  username,
  userAvatar,
}: NextGameCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pad = (n: number) => String(n).padStart(2, "0");
  const countdownDisplay = `${pad(Math.floor(countdown / 3600))}H ${pad(
    Math.floor((countdown % 3600) / 60)
  )}M ${pad(countdown % 60)}S`;

  const buttonConfig = hasEnded
    ? { text: "ENDED", disabled: true, href: null }
    : isLive
      ? hasTicket
        ? { text: "START GAME", disabled: false, href: `/game/${gameId}/live` }
        : { text: "GET TICKET", disabled: false, href: null }
      : hasTicket
        ? { text: "YOU'RE IN!", disabled: true, href: null }
        : { text: "BUY WAFFLE", disabled: false, href: null };

  const handleButtonClick = () => {
    if (buttonConfig.disabled) return;
    if (buttonConfig.href) {
      window.location.href = buttonConfig.href;
    } else {
      setIsModalOpen(true);
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
        {/* Header */}
        <div
          className="relative flex flex-col justify-center items-center shrink-0 z-10 w-full h-[52px] p-0 gap-[17px]"
          style={{
            background: "rgba(27, 27, 29, 0.8)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex flex-row justify-center items-center self-stretch p-0 gap-3 h-[30px]">
            <Image
              src="/images/icons/game-controller.png"
              alt="controller"
              width={30}
              height={30}
              className="object-contain w-[30px] h-[30px] flex-none"
            />
            <span className="font-body text-white uppercase w-[114px] h-6 text-[26px] font-normal leading-[92%] tracking-[-0.03em]">
              NEXT GAME
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div
          className="relative flex flex-row items-start z-10 shrink-0"
          style={{ padding: "12px 10px 0px", gap: "12px" }}
        >
          <StatBlock
            icon="/images/illustrations/spots.svg"
            iconSize={{ w: 55.12, h: 40 }}
            label="Spots"
            value={`${spotsTaken}/${spotsTotal}`}
          />
          <StatBlock
            icon="/images/illustrations/money-stack.svg"
            iconSize={{ w: 38.32, h: 40 }}
            label="Prize pool"
            value={`$${prizePool.toLocaleString()}`}
          />
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

        {/* Countdown */}
        <div
          className="flex flex-col justify-center items-center z-10 shrink-0 w-full"
          style={{ padding: "8px 0px 0px", gap: "6px" }}
        >
          <div
            className="flex flex-row justify-center items-center"
            style={{
              boxSizing: "border-box",
              padding: "10px 20px",
              gap: "4px",
              minWidth: "158px",
              height: "44px",
              border: "2px solid #F5BB1B",
              borderRadius: "900px",
            }}
          >
            <span
              className="font-body text-center whitespace-nowrap"
              style={{
                fontWeight: 400,
                fontSize: "clamp(18px, 2.5vw, 21px)",
                lineHeight: "115%",
                color: "#F5BB1B",
              }}
            >
              {countdownDisplay}
            </span>
          </div>
          <div
            className="flex flex-row justify-center items-center w-full"
            style={{ padding: "0px", gap: "8px" }}
          >
            <span
              className="font-display text-center"
              style={{
                fontWeight: 500,
                fontSize: "12px",
                lineHeight: "14px",
                letterSpacing: "-0.03em",
                color: "#FFFFFF",
                opacity: 0.5,
              }}
            >
              Until game starts
            </span>
          </div>
        </div>

        {/* Player Avatars Row */}
        <div
          className="relative flex flex-row justify-center items-center z-10 shrink-0"
          style={{
            padding: "0px",
            gap: "6px",
            width: "353px",
            height: "25.11px",
          }}
        >
          {spotsTaken > 0 ? (
            <>
              <div
                className="flex flex-row items-center"
                style={{ padding: "0px", width: "70.44px", height: "25.11px" }}
              >
                {recentPlayers.slice(0, 4).map((player, idx) => (
                  <div
                    key={idx}
                    className="rounded-full overflow-hidden shrink-0 box-border"
                    style={{
                      width: "25.11px",
                      height: "25.11px",
                      border: "2.01px solid #FFFFFF",
                      background: "#F0F3F4",
                      borderRadius: "900px",
                      marginLeft: idx === 0 ? "0px" : "-10px",
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
              <span
                className="font-display text-center"
                style={{
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "130%",
                  letterSpacing: "-0.03em",
                  color: "#99A0AE",
                }}
              >
                {othersCount > 0
                  ? `and ${othersCount} others have joined the game`
                  : "have joined the game"}
              </span>
            </>
          ) : (
            <span
              className="font-display text-center"
              style={{
                fontWeight: 500,
                fontSize: "14px",
                lineHeight: "130%",
                letterSpacing: "-0.03em",
                color: "#99A0AE",
                opacity: 0.6,
              }}
            />
          )}
        </div>
      </div>

      <BuyTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        gameId={gameId}
        onchainId={onchainId}
        theme={theme}
        themeIcon={themeIcon}
        tierPrices={tierPrices}
        prizePool={prizePool}
        onPurchaseSuccess={onPurchaseSuccess}
        username={username}
        userAvatar={userAvatar}
      />
    </>
  );
}

function StatBlock({
  icon,
  iconSize,
  label,
  value,
}: {
  icon: string;
  iconSize: { w: number; h: number };
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex flex-col justify-center items-center flex-1"
      style={{ padding: "0px", height: "85px" }}
    >
      <Image
        src={icon}
        alt={label}
        width={iconSize.w}
        height={iconSize.h}
        className="object-contain"
        style={{ width: `${iconSize.w}px`, height: `${iconSize.h}px` }}
      />
      <span
        className="font-display text-center"
        style={{
          fontSize: "16px",
          fontWeight: 500,
          lineHeight: "130%",
          letterSpacing: "-0.03em",
          color: "#99A0AE",
        }}
      >
        {label}
      </span>
      <span
        className="font-body text-white"
        style={{ fontSize: "24px", fontWeight: 400, lineHeight: "100%" }}
      >
        {value}
      </span>
    </div>
  );
}
