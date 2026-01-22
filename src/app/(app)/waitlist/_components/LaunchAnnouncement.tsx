"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

import { useUser } from "@/hooks/useUser";
import { WaffleLoader } from "@/components/ui/WaffleLoader";

/**
 * LaunchAnnouncement
 *
 * Simple, professional page announcing that the waitlist is over
 * and the game launches soon. Clean design, clear messaging.
 *
 * Users with game access are redirected to /game.
 */
export function LaunchAnnouncement() {
    const router = useRouter();
    const { user, isLoading } = useUser();

    // Redirect users with game access to the game
    useEffect(() => {
        if (!isLoading && user?.hasGameAccess) {
            router.replace("/game");
        }
    }, [user, isLoading, router]);

    // Show loader while checking access
    if (isLoading) {
        return (
            <section className="flex-1 flex items-center justify-center">
                <WaffleLoader text="" />
            </section>
        );
    }

    // Don't render if user has access (redirect will happen)
    if (user?.hasGameAccess) {
        return null;
    }

    return (
        <section className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-10"
            >
                <Image
                    src="/logo-onboarding.png"
                    alt="Waffles"
                    width={140}
                    height={27}
                    priority
                    className="object-contain"
                />
            </motion.div>

            {/* Main Headline */}
            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="font-body text-[42px] sm:text-[52px] leading-[0.92] tracking-[-0.03em] text-white uppercase mb-3"
            >
                The Wait
                <br />
                Is Over
            </motion.h1>

            {/* Divider Line */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-12 h-[2px] bg-[#FFC931] mb-6"
            />

            {/* Subheadline */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="font-display font-medium text-[20px] sm:text-[24px] leading-[1.2] tracking-[-0.02em] text-white/80"
            >
                We&apos;re Going Live Soon
            </motion.p>

            {/* Supporting text */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="font-display text-[14px] leading-normal text-white/50 mt-6 max-w-[300px]"
            >
                You&apos;ll be notified the moment the game begins. Stay tuned.
            </motion.p>
        </section>
    );
}
