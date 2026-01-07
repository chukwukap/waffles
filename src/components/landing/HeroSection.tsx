"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function HeroSection() {
    return (
        <section
            className="relative w-full min-h-screen md:h-[930px] overflow-hidden"
            style={{
                background: `linear-gradient(180deg, #1E1E1E 0%, #000000 100%)`,
            }}
        >
            {/* Content Container - centered */}
            <div className="absolute left-1/2 -translate-x-1/2 top-48 md:top-60 flex flex-col items-center gap-6 md:gap-8 w-full max-w-[801px] px-4 md:px-0">
                {/* Main Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="font-body text-5xl sm:text-7xl md:text-8xl lg:text-[140px] leading-[0.9] text-center tracking-tight text-white"
                >
                    THE WORLD IS A PUZZLE
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="font-display font-medium text-lg sm:text-xl md:text-2xl lg:text-[28px] leading-[1.3] text-center tracking-tight text-white/70 max-w-[453px]"
                >
                    Win real money by recognizing patterns faster than everyone else
                </motion.p>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="mt-4"
                >
                    <button className="flex items-center justify-center w-full sm:w-[337px] h-[54px] p-3 bg-white rounded-xl border-r-[5px] border-b-[5px] border-[#FBB03B] font-body text-xl sm:text-2xl leading-[1.15] tracking-tight text-[#FBB03B] text-center hover:brightness-95 transition-all">
                        GET INVITE CODE
                    </button>
                </motion.div>
            </div>

            {/* Hero Character - positioned bottom right */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="absolute right-8 md:right-[133px] bottom-0 w-48 sm:w-64 md:w-80 lg:w-[413px] h-auto"
            >
                <Image
                    src="/images/hero-character.png"
                    alt="Waffles Character"
                    width={413}
                    height={515}
                    className="object-contain"
                    priority
                />
            </motion.div>
        </section>
    );
}
