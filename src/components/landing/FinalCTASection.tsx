"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";


export function FinalCTASection() {
    const router = useRouter();
    return (
        <section
            className="relative w-full min-h-[763px] overflow-hidden flex flex-col items-center justify-center py-20"
            style={{
                backgroundColor: "#FFC931",
                backgroundImage: "url('/noise.svg')",
                backgroundRepeat: "repeat",
                backgroundBlendMode: "overlay"
            }}
        >
            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center gap-[60px] text-center max-w-[1200px] px-4 md:px-8">

                {/* Logo - SVG */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="relative w-[112px] h-[85px]"
                >
                    <svg width="112" height="85" viewBox="0 0 112 85" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.1108 64.8675H40.2216V84.9998H0V20.1313H20.1108V64.8675Z" fill="#493601" />
                        <path d="M91.1692 85H71.0586V64.8677H91.1692V85Z" fill="#493601" />
                        <path d="M111.279 64.8676H91.1686V20.1314H20.1104V0H111.279V64.8676Z" fill="#493601" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M42.241 39.1888H49.5251V47.4756H42.241V54.1083H34.2918V47.4756H27.0488V39.1888H34.2918V31.7324H42.241V39.1888Z" fill="#493601" />
                        <path d="M73.0692 32.8813C78.6223 32.8813 83.1234 37.3878 83.1234 42.9471C83.1234 48.5061 78.6223 53.0128 73.0692 53.0128C67.516 53.0128 63.0137 48.5061 63.0137 42.9471C63.0137 37.3878 67.516 32.8813 73.0692 32.8813Z" fill="#493601" />
                    </svg>
                </motion.div>

                {/* Headline */}
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="font-body text-4xl sm:text-6xl md:text-8xl lg:text-[120px] leading-[0.9] tracking-[-0.03em] text-[#493601] uppercase"
                >
                    Think You&apos;re Faster Than Everyone Else?
                </motion.h2>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    <button
                        className="w-[337px] h-[54px] bg-white rounded-xl flex items-center justify-center font-body text-[26px] tracking-[-0.02em] text-[#493601] hover:scale-105 transition-transform"
                        style={{
                            borderRight: "5px solid #493601",
                            borderBottom: "5px solid #493601"
                        }}
                        onClick={() => {
                            router.push("https://farcaster.xyz/miniapps/sbpPNle-R2-V/waffles");
                        }}
                    >
                        JOIN THE WAITLIST
                    </button>
                </motion.div>
            </div>

            {/* Footer Watermark Text */}
            <div
                className="absolute bottom-[10px] left-0 w-full text-center pointer-events-none"
                style={{ top: "651px" }} // Exact top position from Figma
            >
                <p
                    className="font-input text-4xl md:text-[80px] leading-[1.3] tracking-[-0.03em] text-[#1E1E1E] opacity-10 uppercase"
                >
                    See you in the next game
                </p>
            </div>
        </section>
    );
}
