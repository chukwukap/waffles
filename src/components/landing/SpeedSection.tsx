"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function SpeedSection() {
    return (
        <section className="relative w-full min-h-[930px] bg-[#FFC931] overflow-hidden py-20">
            {/* Left Content */}
            <div className="absolute left-[102px] top-[120px] flex flex-col gap-5 max-w-[752px] max-lg:relative max-lg:left-0 max-lg:px-8">
                {/* Headline */}
                <motion.h2
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="font-body text-[120px] leading-[0.9] tracking-[-0.03em] text-white max-md:text-[60px]"
                >
                    Speed.
                    <br />
                    Memory.
                    <br />
                    Intuition.
                </motion.h2>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="font-display text-[32px] leading-[1.3] tracking-[-0.03em] text-[#1E1E1E]/70 max-w-[556px] max-md:text-xl"
                >
                    This isn&apos;t about luck. It&apos;s about who can recognize patterns
                    the fastest. Movie scenes reimagined as AI art. Memes compressed into
                    visual puzzles. Sports moments transformed into aesthetic challenges.
                </motion.p>
            </div>

            {/* Movie Poster with Pink Offset */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="absolute right-[86px] top-[120px] max-lg:relative max-lg:right-0 max-lg:mx-auto max-lg:mt-12"
            >
                {/* Pink Background Offset */}
                <div className="absolute -left-[10px] -top-[10px] w-[409px] h-[409px] bg-[#FB72FF] max-md:w-[280px] max-md:h-[280px]" />
                {/* Image */}
                <div className="relative w-[409px] h-[409px] max-md:w-[280px] max-md:h-[280px]">
                    <Image
                        src="/images/godfather.png"
                        alt="Movie Scene"
                        fill
                        className="object-cover"
                    />
                </div>
            </motion.div>

            {/* Right Side Text */}
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute right-[86px] top-[600px] w-[443px] font-display text-[32px] leading-[1.3] tracking-[-0.03em] text-[#1E1E1E]/70 max-lg:relative max-lg:right-0 max-lg:w-auto max-lg:px-8 max-lg:mt-8 max-md:text-xl"
            >
                You have seconds to connect the dots. The world rewards those who see
                signals before everyone else.
            </motion.p>

            {/* Scrolling Marquee */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden max-lg:relative max-lg:bottom-0 max-lg:mt-12">
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.1 }}
                    viewport={{ once: true }}
                    className="font-input text-[80px] leading-[1.3] tracking-[-0.03em] text-[#1E1E1E] whitespace-nowrap text-center max-md:text-[40px]"
                >
                    How fast can you connect the dots?
                </motion.p>
            </div>
        </section>
    );
}
