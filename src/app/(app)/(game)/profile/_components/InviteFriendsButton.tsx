import { ArrowRightIcon } from "@/components/icons";
import React from "react";

const InviteFriendsButton = ({ onInvite }: { onInvite: () => void }) => {
  return (
    <div
      className="relative flex items-center justify-between cursor-pointer group transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-[0.98] hover:shadow-[0_8px_24px_rgba(255,201,49,0.25)] w-full max-w-lg"
      onClick={onInvite}
      style={{
        height: "74px",
        borderRadius: "16px",
        padding: "12px 16px",
        backgroundColor: "#FFC931",
        backgroundImage:
          "linear-gradient(189.66deg, rgba(0, 0, 0, 0) -6.71%, rgba(0, 0, 0, 0.3) 92.73%)",
        backgroundBlendMode: "overlay",
        border: "1px solid rgba(255, 255, 255, 0.38)",
      }}
    >
      {/* Left Content */}
      <div className="flex flex-col justify-center h-full gap-1 transition-opacity duration-300 group-hover:opacity-100 opacity-95">
        <h3
          className="font-body text-white uppercase tracking-wide"
          style={{
            fontSize: "21px",
            lineHeight: "100%",
            letterSpacing: "-0.03em",
            textShadow: "0 2px 0 rgba(0,0,0,0.1)",
          }}
        >
          INVITE FRIENDS
        </h3>

        <p
          className="font-display text-white/90 group-hover:text-white transition-colors"
          style={{
            fontSize: "13px",
            fontWeight: 500,
            lineHeight: "130%",
            letterSpacing: "-0.01em",
          }}
        >
          Earn 10% bonus points by inviting friends <br />
          Plus 3% of your friends winnings 🤑
        </p>
      </div>

      {/* Right Content: Arrow Button 
            Interaction: Moves right on hover
        */}
      <div
        className="flex items-center justify-center rounded-full transition-all duration-300 group-hover:bg-white/25 group-hover:scale-105 group-active:scale-95"
        style={{
          width: "44px",
          height: "44px",
          backgroundColor: "rgba(255, 255, 255, 0.12)",
          border: "1px solid rgba(255,255,255,0.3)",
          backdropFilter: "blur(4px)",
        }}
      >
        <ArrowRightIcon
          className="text-white w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5"
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
};

export default InviteFriendsButton;
