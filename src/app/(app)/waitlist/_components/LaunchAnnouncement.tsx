"use client";

import Image from "next/image";
import { motion } from "framer-motion";

/**
 * LaunchAnnouncement
 *
 * Simple, professional page announcing that the waitlist is over
 * and the game launches soon. Clean design, clear messaging.
 */
export function LaunchAnnouncement() {
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
                className="font-display text-[14px] leading-[1.5] text-white/50 mt-6 max-w-[300px]"
            >
                You&apos;ll be notified the moment the game begins. Stay tuned.
            </motion.p>
        </section>
    );
}
