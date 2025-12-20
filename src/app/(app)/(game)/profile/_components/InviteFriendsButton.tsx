"use client";

import { ArrowRightIcon } from "@/components/icons";
import React from "react";
import { motion } from "framer-motion";

const InviteFriendsButton = ({ onInvite }: { onInvite: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.2
      }}
      whileHover={{
        y: -4,
        boxShadow: "0 12px 28px rgba(255,201,49,0.3)"
      }}
      whileTap={{ scale: 0.98 }}
      className="relative flex items-center justify-between cursor-pointer group w-full max-w-lg overflow-hidden"
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
      {/* Shine effect overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.15)_50%,transparent_80%)] bg-size-[200%_100%] animate-shimmer" />

      {/* Left Content */}
      <div
        className="relative z-10 flex flex-col justify-center items-start h-full"
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
          className="font-display text-white transition-colors"
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
        className="relative z-10 flex flex-col justify-center items-start"
        style={{
          gap: "4px",
        }}
      >
        <motion.div
          className="flex items-center justify-center rounded-full bg-white/20"
          whileHover={{
            backgroundColor: "rgba(255, 255, 255, 0.4)",
            scale: 1.1
          }}
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "900px",
            padding: "8px",
          }}
        >
          <motion.div
            variants={{
              hover: { x: 3 }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <ArrowRightIcon
              className="text-white"
              style={{
                width: "18px",
                height: "18px",
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default InviteFriendsButton;
