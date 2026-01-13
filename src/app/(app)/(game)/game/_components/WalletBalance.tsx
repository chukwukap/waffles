"use client";

import { useAccount, useChainId, useConnect } from "wagmi";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef } from "react";
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector";

import { TOKEN_CONFIG } from "@/lib/chain";
import { springs } from "@/lib/animations";

// Animated Wallet Icon with coin drop effect
function AnimatedWalletIcon({ triggerAnim }: { triggerAnim: boolean }) {
  return (
    <svg
      width={12}
      height={11}
      viewBox="0 0 16 16"
      fill="none"
      className="mr-1"
    >
      {/* Wallet body */}
      <motion.path
        d="M2 6.2H13.4C13.559 6.2 13.712 6.263 13.824 6.376C13.937 6.488 14 6.641 14 6.8V12.8C14 12.959 13.937 13.112 13.824 13.224C13.712 13.337 13.559 13.4 13.4 13.4H2.6C2.441 13.4 2.288 13.337 2.176 13.224C2.063 13.112 2 12.959 2 12.8V6.2Z"
        fill="currentColor"
        animate={triggerAnim ? { scaleY: [1, 1.1, 1] } : { scaleY: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
        style={{ transformOrigin: "center bottom" }}
      />
      {/* Wallet flap */}
      <motion.path
        d="M2.6 2.6H11.6V5H2V3.2C2 3.041 2.063 2.888 2.176 2.776C2.288 2.663 2.441 2.6 2.6 2.6Z"
        fill="currentColor"
        animate={triggerAnim ? { rotate: [0, -5, 0] } : { rotate: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" as const }}
        style={{ transformOrigin: "left center" }}
      />
      {/* Coin slot - pulses */}
      <motion.rect
        x="9.8"
        y="9.2"
        width="1.8"
        height="1.2"
        rx="0.2"
        fill="currentColor"
        animate={
          triggerAnim
            ? {
                scale: [1, 1.3, 1],
                opacity: [1, 0.6, 1],
              }
            : {}
        }
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" as const }}
        style={{ transformOrigin: "center" }}
      />
    </svg>
  );
}

export function WalletBalance() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const chainId = useChainId();

  // Auto-connect with Farcaster connector if not connected
  useEffect(() => {
    if (!isConnected) {
      connect({
        connector: farcasterFrame(),
        // chainId: CHAIN_CONFIG.chain.id
      });
    }
  }, [isConnected, connect]);

  const { roundedBalance } = useGetTokenBalance(address as `0x${string}`, {
    address: TOKEN_CONFIG.address as `0x${string}`,
    decimals: TOKEN_CONFIG.decimals,
    name: TOKEN_CONFIG.symbol,
    symbol: TOKEN_CONFIG.symbol,
    image: "/images/tokens/usdc.png",
    chainId: chainId,
  });

  // Track previous balance for animation trigger
  const prevBalance = useRef(roundedBalance);
  const controls = useAnimation();

  // Animate on balance change
  useEffect(() => {
    if (prevBalance.current !== roundedBalance) {
      controls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.3, ease: "easeOut" as const },
      });
      prevBalance.current = roundedBalance;
    }
  }, [roundedBalance, controls]);

  return (
    <motion.div
      className="flex items-center px-3 py-1.5 rounded-full bg-[#F9F9F91A] font-body cursor-pointer"
      whileHover={{
        scale: 1.05,
        backgroundColor: "rgba(249, 249, 249, 0.15)",
      }}
      whileTap={{ scale: 0.95 }}
      transition={springs.snappy}
    >
      <AnimatedWalletIcon triggerAnim={false} />
      <motion.span
        className="text-center font-normal not-italic text-[16px] leading-[100%] tracking-[0px] text-white"
        animate={controls}
      >
        {`$${Number(roundedBalance).toFixed(2)}`}
      </motion.span>
    </motion.div>
  );
}
