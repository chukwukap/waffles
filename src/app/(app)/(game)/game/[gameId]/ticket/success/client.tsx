"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import sdk from "@farcaster/miniapp-sdk";
import { GameSummaryCard } from "../_components/GameSummary";
import { BottomNav } from "@/components/BottomNav";
import {
    createGameCalendarEvent,
    getGoogleCalendarUrl,
    downloadICS
} from "@/lib/calendar";

interface TicketSuccessClientProps {
    gameId: number;
    theme: string;
    coverUrl: string;
    prizePool: number;
    startsAt: string;
    endsAt: string;
    ticketCode?: string;
}

export function TicketSuccessClient({
    gameId,
    theme,
    coverUrl,
    prizePool,
    startsAt,
    endsAt,
    ticketCode,
}: TicketSuccessClientProps) {
    const { composeCastAsync } = useComposeCast();
    const [showCalendarOptions, setShowCalendarOptions] = useState(false);
    const [userInfo, setUserInfo] = useState<{
        fid: number;
        username: string | null;
        pfpUrl: string | null;
    } | null>(null);

    // Fetch user info on mount
    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await sdk.quickAuth.fetch("/api/v1/me");
                if (res.ok) {
                    setUserInfo(await res.json());
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        }
        fetchUser();
    }, []);

    // Create calendar event
    const calendarEvent = createGameCalendarEvent(
        theme,
        prizePool,
        new Date(startsAt),
        new Date(endsAt),
        `${env.rootUrl}/game/${gameId}`
    );

    // Calendar handlers
    const handleAddToGoogle = useCallback(() => {
        window.open(getGoogleCalendarUrl(calendarEvent), '_blank');
        setShowCalendarOptions(false);
    }, [calendarEvent]);

    const handleAddToApple = useCallback(() => {
        downloadICS(calendarEvent);
        setShowCalendarOptions(false);
    }, [calendarEvent]);

    const shareTicket = useCallback(async () => {
        try {
            // Build frame URL with params - this page has fc:frame metadata
            const frameParams = new URLSearchParams();
            frameParams.set("username", userInfo?.username || `Player #${userInfo?.fid || ""}`);
            if (userInfo?.pfpUrl) {
                frameParams.set("pfpUrl", userInfo.pfpUrl);
            }
            if (ticketCode) {
                frameParams.set("ticketCode", ticketCode);
            }
            const frameUrl = `${env.rootUrl}/game/${gameId}/ticket/success?${frameParams.toString()}`;

            const result = await composeCastAsync({
                text: `I just joined the next Waffles game! 🧇\n\nTheme: ${theme}\nPrize Pool: $${prizePool.toLocaleString()}\n\nJoin me!`,
                embeds: [frameUrl],
            });

            if (result?.cast) {
                console.log("Cast created successfully:", result.cast.hash);
            } else {
                console.log("User cancelled the cast");
            }
        } catch (error) {
            console.error("Error sharing cast:", error);
        }
    }, [composeCastAsync, userInfo, theme, prizePool, ticketCode, gameId]);

    return (
        <>
            <div className="h-dvh flex flex-col items-center justify-center overflow-hidden px-5">
                <motion.div
                    className="flex flex-col items-center w-full max-w-[420px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Waffle Image */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{
                            duration: 0.6,
                            ease: [0.34, 1.56, 0.64, 1],
                        }}
                    >
                        <Image
                            src="/images/illustrations/waffles.svg"
                            alt="Pixel waffle"
                            width={200}
                            height={100}
                            priority
                            className="mb-5 h-auto w-[150px]"
                        />
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        className="text-foreground text-center font-body"
                        style={{
                            fontSize: "42px",
                            lineHeight: "0.92",
                            letterSpacing: "-0.03em",
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                    >
                        WAFFLE SECURED!
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        className="mt-3 text-center text-base font-display text-[#99A0AE]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                    >
                        You&apos;re in! Good luck 🍀
                    </motion.p>

                    {/* Game Summary Card */}
                    <GameSummaryCard theme={theme} coverUrl={coverUrl} prizePool={prizePool} />

                    {/* Share Button */}
                    <motion.button
                        onClick={shareTicket}
                        className={cn(
                            "mt-8 w-full rounded-[14px] bg-white px-6 py-4 text-center font-body text-2xl text-[#FB72FF]",
                            "border-r-[5px] border-b-[5px] border-[#FB72FF]"
                        )}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                        whileHover={{
                            scale: 1.02,
                            boxShadow: "0 10px 30px rgba(251, 114, 255, 0.3)",
                        }}
                        whileTap={{ scale: 0.98, x: 2, y: 2 }}
                    >
                        SHARE TICKET
                    </motion.button>

                    {/* Add to Calendar Button */}
                    <motion.div
                        className="relative w-full mt-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.4 }}
                    >
                        <button
                            onClick={() => setShowCalendarOptions(!showCalendarOptions)}
                            className={cn(
                                "w-full rounded-[14px] bg-[#1E1E1E] px-6 py-4 text-center font-body text-xl text-white",
                                "border border-white/20 hover:border-white/40 transition-all"
                            )}
                        >
                            📅 ADD TO CALENDAR
                        </button>

                        {/* Calendar Options Dropdown */}
                        <AnimatePresence>
                            {showCalendarOptions && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-[#2A2A2A] rounded-xl border border-white/20 overflow-hidden z-50"
                                >
                                    <button
                                        onClick={handleAddToGoogle}
                                        className="w-full px-4 py-3 text-left font-body text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                                    >
                                        <span className="text-xl">📆</span>
                                        Google Calendar
                                    </button>
                                    <div className="h-px bg-white/10" />
                                    <button
                                        onClick={handleAddToApple}
                                        className="w-full px-4 py-3 text-left font-body text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                                    >
                                        <span className="text-xl">🍎</span>
                                        Apple / Outlook
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Back to Home Link */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.4 }}
                    >
                        <Link
                            href="/game"
                            className="mt-6 inline-block text-sm font-body uppercase text-[#00CFF2] transition hover:text-[#33defa]"
                        >
                            <motion.span
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-block"
                            >
                                BACK TO HOME
                            </motion.span>
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
            <BottomNav />
        </>
    );
}
