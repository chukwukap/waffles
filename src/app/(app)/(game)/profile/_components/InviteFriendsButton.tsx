import { ArrowRightIcon } from "@/components/icons";
import React from "react";

const InviteFriendsButton = ({ onInvite }: { onInvite: () => void }) => {
  return (
    <div
      className="relative flex items-center justify-between cursor-pointer group transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-[0.98] hover:shadow-[0_8px_24px_rgba(255,201,49,0.25)] w-full max-w-lg"
      onClick={onInvite}
      style={{
        height: "91px",
        borderRadius: "16px",
        padding: "12px",
        gap: "12px",
        background:
          "linear-gradient(189.66deg, rgba(0, 0, 0, 0) -6.71%, #000000 92.73%), #FFC931",
        backgroundBlendMode: "overlay, normal",
        border: "1px solid rgba(255, 255, 255, 0.38)",
      }}
    >
      {/* Left Content */}
      <div
        className="flex flex-col justify-center items-start h-full transition-opacity duration-300 group-hover:opacity-100"
        style={{
          flexGrow: 1,
        }}
      >
        <h3
          className="font-body text-white uppercase"
          style={{
            fontSize: "21px",
            lineHeight: "130%",
            letterSpacing: "-0.03em",
          }}
        >
          Invite friends
        </h3>

        <p
          className="font-display text-white group-hover:text-white transition-colors"
          style={{
            fontSize: "14px",
            fontWeight: 500,
            lineHeight: "130%",
            letterSpacing: "-0.03em",
            opacity: 0.8,
          }}
        >
          Earn 10% bonus points by inviting friends <br />
          Plus 3% of your friends winnings 🤑
        </p>
      </div>

      {/* Right Content: Arrow Button */}
      <div
        className="flex flex-col justify-center items-start"
        style={{
          gap: "4px",
        }}
      >
        <div
          className="flex items-center justify-center rounded-full transition-all duration-300 group-hover:bg-white/30 group-hover:scale-105 group-active:scale-95"
          style={{
            width: "34px",
            height: "34px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: "900px",
            padding: "8px",
          }}
        >
          <ArrowRightIcon
            className="text-white transition-transform duration-300 group-hover:translate-x-0.5"
            style={{
              width: "18px",
              height: "18px",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default InviteFriendsButton;
