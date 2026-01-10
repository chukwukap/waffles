"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import {
    staggerContainerVariants,
    wordStaggerVariants,
    fadeUpVariants,
    fadeScaleVariants,
    floatingVariants,
    springPresets,
} from "./AnimationContext";
import { useMouseParallax, useMagneticEffect } from "./useAnimationHooks";
import { TextScramble } from "./TextScramble";
import { FloatingParticles } from "./GradientBlobs";

// Split headline into words for staggered animation
const headlineWords = ["THE", "WORLD", "IS", "A", "PUZZLE"];

export function HeroSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const { layer1, layer2 } = useMouseParallax(15);
    const magnetic = useMagneticEffect(0.2);

    // Scroll-based parallax for character
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"],
    });
    const characterY = useTransform(scrollYProgress, [0, 1], [0, 100]);
    const contentY = useTransform(scrollYProgress, [0, 1], [0, 50]);

    return (
        <section
            ref={sectionRef}
            className="relative w-full min-h-screen md:h-[930px] overflow-hidden"
            style={{
                background: `linear-gradient(180deg, #1E1E1E 0%, #000000 100%)`,
            }}
        >
            {/* Floating particles for ambient effect */}
            <FloatingParticles count={30} color="#FFC931" className="opacity-40" />

            {/* Subtle ambient layer with parallax */}
            <motion.div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{ x: layer2.x, y: layer2.y }}
            >
                {/* Gradient orbs for depth */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-[#FFC931]/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-gradient-radial from-[#FF6B6B]/10 to-transparent rounded-full blur-3xl" />
            </motion.div>

            {/* Content Container - centered with parallax */}
            <motion.div
                className="absolute left-1/2 -translate-x-1/2 top-48 md:top-60 flex flex-col items-center gap-6 md:gap-8 w-full max-w-[801px] px-4 md:px-0"
                style={{ y: contentY }}
            >
                {/* Main Headline - Staggered word animation with scramble */}
                <motion.h1
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="font-body text-5xl sm:text-7xl md:text-8xl lg:text-[140px] leading-[0.9] text-center tracking-tight text-white flex flex-wrap justify-center gap-x-4 md:gap-x-6"
                >
                    {headlineWords.map((word, index) => (
                        <motion.span
                            key={index}
                            variants={wordStaggerVariants}
                            className="inline-block"
                            style={{
                                transformStyle: "preserve-3d",
                            }}
                        >
                            <TextScramble
                                text={word}
                                trigger="mount"
                                revealDelay={300 + index * 150}
                                scrambleSpeed={40}
                            />
                        </motion.span>
                    ))}
                </motion.h1>

                {/* Subtitle with fade up and scramble */}
                <motion.p
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.5 }}
                    className="font-display font-medium text-lg sm:text-xl md:text-2xl lg:text-[28px] leading-[1.3] text-center tracking-tight text-white/70 max-w-[453px]"
                >
                    <TextScramble
                        text="Win real money by recognizing patterns faster than everyone else"
                        trigger="mount"
                        revealDelay={800}
                        scrambleSpeed={30}
                    />
                </motion.p>

                {/* CTA Button with magnetic effect and 3D press */}
                <motion.div
                    ref={magnetic.ref}
                    variants={fadeScaleVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.7 }}
                    className="mt-4"
                    style={{
                        x: magnetic.x,
                        y: magnetic.y,
                    }}
                    data-cursor-hover
                    data-cursor-text="Click"
                >
                    <motion.button
                        className="relative flex items-center justify-center w-full sm:w-[337px] h-[54px] p-3 bg-white rounded-xl font-body text-xl sm:text-2xl leading-[1.15] tracking-tight text-[#FBB03B] text-center overflow-hidden"
                        style={{
                            borderRight: "5px solid #FBB03B",
                            borderBottom: "5px solid #FBB03B",
                        }}
                        whileHover={{
                            scale: 1.02,
                            y: -2,
                            boxShadow: "0 10px 30px rgba(251, 176, 59, 0.3)",
                        }}
                        whileTap={{
                            scale: 0.98,
                            y: 0,
                            boxShadow: "0 2px 10px rgba(251, 176, 59, 0.2)",
                        }}
                        transition={springPresets.snappy}
                    >
                        {/* Animated shine effect */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 3,
                                ease: "easeInOut",
                            }}
                        />
                        <span className="relative z-10">GET INVITE CODE</span>
                    </motion.button>
                </motion.div>
            </motion.div>

            {/* Hero Character - with floating animation and scroll parallax */}
            <motion.div
                initial={{ opacity: 0, x: 80, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                    duration: 0.8,
                    delay: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                }}
                className="absolute right-8 md:right-[133px] bottom-0 w-48 sm:w-64 md:w-80 lg:w-[413px] h-auto"
                style={{
                    y: characterY,
                    x: layer1.x,
                }}
            >
                {/* Floating wrapper */}
                <motion.div
                    variants={floatingVariants}
                    initial="initial"
                    animate="animate"
                >
                    <Image
                        src="/images/hero-character.png"
                        alt="Waffles Character"
                        width={413}
                        height={515}
                        className="object-contain drop-shadow-2xl"
                        priority
                    />
                </motion.div>

                {/* Subtle glow behind character */}
                <motion.div
                    className="absolute -inset-8 bg-gradient-radial from-[#FFC931]/20 via-transparent to-transparent rounded-full blur-3xl -z-10"
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </motion.div>
        </section>
    );
}
