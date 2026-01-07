"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export function LandingNav() {
    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute top-16 md:top-[70px] left-1/2 -translate-x-1/2 z-50 w-[95%] md:w-[1160px] max-w-full h-16 md:h-20 flex justify-between items-center gap-2.5 pl-6 md:pl-8 pr-3 md:pr-4 py-3 md:py-4 bg-white/10 backdrop-blur-xl rounded-full"
        >
            {/* Logo + Waffles Text */}
            <Link href="/" className="flex items-center gap-1.5">
                <Image
                    src="/logo.png"
                    alt="Waffles"
                    width={26}
                    height={20}
                    className="h-5 w-auto"
                />
                <span className="font-body text-white text-lg md:text-xl tracking-tight">
                    WAFFLES
                </span>
            </Link>

            {/* Navigation Links + CTA */}
            <div className="flex items-center justify-end gap-4 md:gap-6 h-10 md:h-12">
                {/* Nav Links - hidden on mobile */}
                <div className="hidden md:flex items-center gap-6">
                    <Link
                        href="#how-to-play"
                        className="font-display font-medium text-base leading-tight tracking-tight text-white text-center hover:opacity-80 transition-opacity"
                    >
                        How to play
                    </Link>
                    <Link
                        href="#faqs"
                        className="font-display font-medium text-base leading-tight tracking-tight text-white text-center hover:opacity-80 transition-opacity"
                    >
                        FAQs
                    </Link>
                </div>

                {/* CTA Button */}
                <Link
                    href="https://farcaster.xyz/miniapps/sbpPNle-R2-V/waffles"
                    className="flex items-center justify-center px-4 md:px-6 py-2.5 md:py-3 bg-[#FFC931] rounded-full font-body text-base md:text-xl leading-tight tracking-tight text-[#1E1E1E] text-center hover:brightness-110 transition-all"
                >
                    Play on Farcaster
                </Link>
            </div>
        </motion.nav>
    );
}
