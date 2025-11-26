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
    return (
        <motion.div
            className="mb-[env(safe-area-inset-bottom)] pb-6 flex items-center justify-center gap-2 shrink-0 cursor-default"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.05 }}
        >
            <CardStack
                size={21.05}
                borderColor="#FFFFFF"
                rotations={[-8, 5, -5, 7]}
                imageUrls={
                    mutualsData?.mutuals
                        .map((m) => m.pfpUrl)
                        .filter((url): url is string => url !== null) ?? undefined
                }
            />
            <p className="font-medium font-display text-[#99A0AE] text-[16px] leading-[130%] tracking-[-0.03em] text-center">
                {mutualsData?.mutualCount === 0
                    ? "No friends are on the list yet"
                    : `${mutualsData?.mutualCount ?? 0} friend${(mutualsData?.mutualCount ?? 0) === 1 ? "" : "s"
                    } ${(mutualsData?.mutualCount ?? 0) === 1 ? "is" : "are"} on the list`}
            </p>
        </motion.div>
    );
}
