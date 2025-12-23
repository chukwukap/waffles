"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
    duration?: number;
    onComplete?: () => void;
}

// Figma design is 393x852. Use percentage for horizontal, bottom-based for vertical
const toPercentX = (px: number) => `${(px / 393) * 100}%`;

// Scale factor to increase character sizes
const SCALE = 1.25;

export function SplashScreen({ duration = 2000, onComplete }: SplashScreenProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-9999 overflow-hidden app-background"
                >
                    {/* Center Logo Container */}
                    <div
                        className="absolute flex flex-col items-center"
                        style={{
                            width: "157px",
                            height: "82px",
                            left: "calc(50% - 157px/2)",
                            top: "calc(50% - 82px/2)",
                            gap: "12px",
                        }}
                    >
                        <Image
                            src="/logo.png"
                            alt="Waffles"
                            width={55}
                            height={43}
                            priority
                        />
                        <span
                            className="font-body text-white text-center"
                            style={{
                                width: "157px",
                                height: "28px",
                                fontSize: "24px",
                                letterSpacing: "0.05em",
                            }}
                        >
                            WAFFLES
                        </span>
                    </div>

                    {/* Character images positioned from left to right - scaled up 25% */}

                    {/* 1.png */}
                    <Image
                        src="/images/splash/1.png"
                        alt=""
                        width={Math.round(109 * SCALE)}
                        height={Math.round(100 * SCALE)}
                        className="absolute"
                        style={{
                            left: toPercentX(-21),
                            bottom: "50px",
                            transform: "rotate(6.78deg)",
                        }}
                    />

                    {/* 2.png */}
                    <Image
                        src="/images/splash/2.png"
                        alt=""
                        width={Math.round(87 * SCALE)}
                        height={Math.round(95 * SCALE)}
                        className="absolute"
                        style={{
                            left: toPercentX(34),
                            bottom: "0",
                        }}
                    />

                    {/* 3.png */}
                    <Image
                        src="/images/splash/3.png"
                        alt=""
                        width={Math.round(81 * SCALE)}
                        height={Math.round(78 * SCALE)}
                        className="absolute"
                        style={{
                            left: toPercentX(85),
                            bottom: "0",
                        }}
                    />

                    {/* 4.png - flipped */}
                    <Image
                        src="/images/splash/4.png"
                        alt=""
                        width={Math.round(72 * SCALE)}
                        height={Math.round(91 * SCALE)}
                        className="absolute"
                        style={{
                            left: toPercentX(142),
                            bottom: "0",
                            transform: "scaleX(-1)",
                        }}
                    />

                    {/* 5.png */}
                    <Image
                        src="/images/splash/5.png"
                        alt=""
                        width={Math.round(85 * SCALE)}
                        height={Math.round(69 * SCALE)}
                        className="absolute"
                        style={{
                            left: toPercentX(178),
                            bottom: "0",
                        }}
                    />

                    {/* 6.png */}
                    <Image
                        src="/images/splash/6.png"
                        alt=""
                        width={Math.round(62 * SCALE)}
                        height={Math.round(76 * SCALE)}
                        className="absolute"
                        style={{
                            left: toPercentX(235),
                            bottom: "0",
                        }}
                    />

                    {/* 7.png */}
                    <Image
                        src="/images/splash/7.png"
                        alt=""
                        width={Math.round(88 * SCALE)}
                        height={Math.round(88 * SCALE)}
                        className="absolute"
                        style={{
                            left: toPercentX(263),
                            bottom: "0",
                        }}
                    />

                    {/* 8.png */}
                    <Image
                        src="/images/splash/8.png"
                        alt=""
                        width={Math.round(85 * SCALE)}
                        height={Math.round(81 * SCALE)}
                        className="absolute"
                        style={{
                            left: toPercentX(296),
                            bottom: "40px",
                        }}
                    />

                    {/* 9.png - jumping character */}
                    <Image
                        src="/images/splash/9.png"
                        alt=""
                        width={Math.round(78 * SCALE)}
                        height={Math.round(83 * SCALE)}
                        className="absolute"
                        style={{
                            left: toPercentX(315),
                            bottom: "100px",
                        }}
                    />

                    {/* 10.png */}
                    <Image
                        src="/images/splash/10.png"
                        alt=""
                        width={Math.round(82 * SCALE)}
                        height={Math.round(74 * SCALE)}
                        className="absolute"
                        style={{
                            left: toPercentX(326),
                            bottom: "0",
                        }}
                    />

                    {/* 11.png - rotated */}
                    <Image
                        src="/images/splash/11.png"
                        alt=""
                        width={Math.round(56 * SCALE)}
                        height={Math.round(72 * SCALE)}
                        className="absolute"
                        style={{
                            left: toPercentX(337.61),
                            bottom: "40px",
                            transform: "rotate(-16.47deg)",
                        }}
                    />

                    {/* 12.png */}
                    <Image
                        src="/images/splash/12.png"
                        alt=""
                        width={Math.round(68 * SCALE)}
                        height={Math.round(82 * SCALE)}
                        className="absolute"
                        style={{
                            left: toPercentX(-9),
                            bottom: "0",
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
