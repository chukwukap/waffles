"use client";

import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { useEffect, useRef } from "react";
import { playSound } from "@/lib/sounds";
import { env } from "@/lib/env";

interface GameCompleteScreenProps {
    score: number;
    gameTheme: string;
    gameId: number;
}

export default function GameCompleteScreen({
    score,
    gameTheme,
    gameId,
}: GameCompleteScreenProps) {
    const hasPlayedSound = useRef(false);

    // Play victory sound
    useEffect(() => {
        if (!hasPlayedSound.current) {
            hasPlayedSound.current = true;
            playSound("victory");
        }
    }, []);

    const { composeCastAsync } = useComposeCast();

    const handleShare = useCallback(async () => {
        try {
            const message = `I scored ${score.toLocaleString()} points in Waffles! 🧇`;
            const result = await composeCastAsync({
                text: message,
                embeds: [`${env.rootUrl}/game/${gameId}/result`].filter(Boolean) as [],
            });

            if (result?.cast) {
                console.log("Cast created successfully:", result.cast.hash);
            }
        } catch (e) {
            console.error("Share failed:", e);
        }
    }, [composeCastAsync, score, gameId]);

    return (
        <div className="w-full px-4 text-white flex flex-col items-center flex-1 overflow-y-auto pb-8">
            {/* Header: Waffle + Title + Theme */}
            <motion.div
                className="flex flex-col justify-center items-center gap-2 w-[315px]"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{
                        duration: 0.6,
                        ease: [0.34, 1.56, 0.64, 1],
                        delay: 0.1,
                    }}
                >
                    <Image
                        src="/images/illustrations/waffles.svg"
                        alt="waffle"
                        width={228}
                        height={132}
                    />
                </motion.div>

                <motion.h1
                    className="font-body text-[44px] leading-[92%] text-center tracking-[-0.03em] text-white w-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    WAFFLES #{String(gameId).padStart(3, "0")}
                </motion.h1>

                <motion.div
                    className="flex flex-row justify-center items-center gap-2.5 w-full font-display"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    <p className="font-body font-medium text-[16px] leading-[130%] text-center tracking-[-0.03em] text-[#99A0AE] capitalize">
                        {gameTheme?.toLowerCase() ?? "trivia"}
                    </p>
                </motion.div>
            </motion.div>

            {/* Points Card */}
            <motion.div
                className="flex flex-col justify-center items-start p-3 gap-2.5 w-full max-w-[361px] mt-[27px] bg-linear-to-b from-transparent to-[rgba(27,245,176,0.12)] rounded-[24px]"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            >
                <div className="flex flex-col justify-center items-center w-full">
                    {/* Trophy icon */}
                    <motion.div
                        className="relative w-[40px] h-[48px]"
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            duration: 0.6,
                            delay: 0.5,
                            ease: [0.34, 1.56, 0.64, 1],
                        }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                        <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Image
                                src="/images/trophies/gold.svg"
                                alt="Trophy"
                                fill
                                className="object-contain drop-shadow-[0_4px_8px_rgba(20,185,133,0.3)]"
                            />
                        </motion.div>
                    </motion.div>

                    {/* You won label */}
                    <motion.div
                        className="flex flex-row justify-between items-center px-2 py-[7px] gap-2.5 w-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                    >
                        <span className="font-body font-medium text-[14px] leading-[130%] tracking-[-0.03em] text-[#99A0AE] mx-auto">
                            You won
                        </span>
                    </motion.div>

                    {/* Points amount */}
                    <motion.div
                        className="flex flex-row justify-center items-center gap-3 w-full"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.5,
                            delay: 0.7,
                            ease: [0.34, 1.56, 0.64, 1],
                        }}
                    >
                        <motion.h2
                            className="font-body text-[48px] leading-[90%] text-[#14B985]"
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                        >
                            {score.toLocaleString()}
                        </motion.h2>
                    </motion.div>
                </div>
            </motion.div>

            {/* Buttons */}
            <div className="flex flex-col justify-center items-center gap-3 w-full max-w-[361px] mt-6">
                {/* SHARE SCORE button */}
                <motion.div
                    className="w-full"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.85 }}
                    whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(20, 185, 133, 0.25)" }}
                    whileTap={{ scale: 0.98, y: 2 }}
                >
                    <button
                        onClick={handleShare}
                        className="flex flex-col items-center p-3 gap-1 w-full bg-white border-r-[5px] border-b-[5px] border-[#14B985] rounded-[12px] transition-all duration-200 hover:border-r-[3px] hover:border-b-[3px] active:border-r-2 active:border-b-2"
                    >
                        <span className="font-body text-[26px] leading-[115%] tracking-[-0.02em] text-[#14B985] text-center w-full">
                            SHARE SCORE
                        </span>
                    </button>
                </motion.div>

                {/* BACK TO HOME link */}
                <motion.div
                    className="w-full"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.9 }}
                >
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Link
                            href="/game"
                            className="flex flex-row justify-center items-center p-3 gap-2 w-full rounded-[12px] no-underline hover:bg-white/5 transition-colors duration-200"
                        >
                            <span className="font-body text-[18px] leading-[115%] tracking-[-0.02em] text-[#00CFF2]">
                                BACK TO HOME
                            </span>
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
