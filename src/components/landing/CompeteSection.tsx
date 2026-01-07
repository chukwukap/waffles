"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function CompeteSection() {
    return (
        <section className="relative w-full min-h-screen md:h-[930px] bg-[#14B985]">
            {/* Treasure Chest - positioned above content */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="absolute left-1/2 -translate-x-1/2 -top-14 md:-top-16 lg:-top-20 w-64 sm:w-80 md:w-96 lg:w-[424px] h-auto z-10"
            >
                <Image
                    src="/images/illustrations/treasure-chest.png"
                    alt="Treasure Chest"
                    width={424}
                    height={395}
                    className="object-contain"
                />
            </motion.div>

            {/* Content Container - centered */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 md:top-[369px] -translate-y-1/2 md:translate-y-0 flex flex-col justify-center items-center gap-5 w-full max-w-[1094px] px-4 md:px-8 pt-48 md:pt-0">
                {/* Headline */}
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="font-body text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-[120px] leading-[0.9] text-center tracking-tight text-white"
                >
                    Compete for the biggest <span className="text-[#0A5C42]">prize pool</span> on Farcaster.
                </motion.h2>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="font-display font-medium text-lg sm:text-xl md:text-2xl lg:text-[32px] leading-[1.3] text-center tracking-tight text-[#1E1E1E]/70 max-w-[586px]"
                >
                    Win, lose, or almost — every game earns you a story worth sharing.
                </motion.p>
            </div>
        </section>
    );
}
