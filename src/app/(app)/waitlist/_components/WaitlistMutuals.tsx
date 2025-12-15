"use client";

import { CardStack } from "@/components/CardStack";
import { motion } from "framer-motion";

export interface MutualsData {
  mutuals: Array<{ fid: number; pfpUrl: string | null }>;
  mutualCount: number;
  totalCount: number;
}

interface WaitlistMutualsProps {
  mutualsData: MutualsData | null;
}

export function WaitlistMutuals({ mutualsData }: WaitlistMutualsProps) {
  const count = mutualsData?.totalCount ?? 0;
  
  // Dynamic message based on count
  const getMessage = () => {
    if (count === 0) return "Be the first to invite friends!";
    if (count === 1) return "1 friend is on the list";
    return `${count} friends are on the list`;
  };

  return (
    <motion.div
      className="mb-[env(safe-area-inset-bottom)] pb-4 flex items-center justify-center gap-3 shrink-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, type: "spring", stiffness: 200, damping: 20 }}
    >
      {/* Avatars with subtle float */}
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <CardStack
          size={28}
          borderColor="#FFFFFF"
          rotations={[-8, 5, -5, 7]}
          imageUrls={
            mutualsData?.mutuals
              .map((m) => m.pfpUrl)
              .filter((url): url is string => url !== null) ?? undefined
          }
        />
      </motion.div>
      
      {/* Text with subtle glow for non-zero counts */}
      <motion.p 
        className={`font-medium font-display text-[15px] leading-[130%] tracking-[-0.03em] text-center ${
          count > 0 ? "text-[#99A0AE]" : "text-[#666]"
        }`}
        animate={count > 0 ? { 
          textShadow: [
            "0 0 0px rgba(251,191,36,0)",
            "0 0 8px rgba(251,191,36,0.3)",
            "0 0 0px rgba(251,191,36,0)",
          ]
        } : {}}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {getMessage()}
      </motion.p>
    </motion.div>
  );
}
