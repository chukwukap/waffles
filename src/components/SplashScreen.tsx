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

                    {/* Character images positioned from left to right */}

                    {/* 1.png: left: -21px, top: 710px → bottom: ~42px, rotated 6.78deg */}
                    <Image
                        src="/images/splash/1.png"
                        alt=""
                        width={109}
                        height={100}
                        className="absolute"
                        style={{
                            left: toPercentX(-21),
                            bottom: "50px",
                            transform: "rotate(6.78deg)",
                        }}
                    />

                    {/* 2.png: left: 34px, top: 778px → bottom ~0 */}
                    <Image
                        src="/images/splash/2.png"
                        alt=""
                        width={87}
                        height={95}
                        className="absolute"
                        style={{
                            left: toPercentX(34),
                            bottom: "0",
                        }}
                    />

                    {/* 3.png: left: 85px, top: 777px */}
                    <Image
                        src="/images/splash/3.png"
                        alt=""
                        width={81}
                        height={78}
                        className="absolute"
                        style={{
                            left: toPercentX(85),
                            bottom: "0",
                        }}
                    />

                    {/* 4.png: left: 142px, top: 775px, flipped horizontally */}
                    <Image
                        src="/images/splash/4.png"
                        alt=""
                        width={72}
                        height={91}
                        className="absolute"
                        style={{
                            left: toPercentX(142),
                            bottom: "0",
                            transform: "scaleX(-1)",
                        }}
                    />

                    {/* 5.png: left: 178px, top: 783px */}
                    <Image
                        src="/images/splash/5.png"
                        alt=""
                        width={85}
                        height={69}
                        className="absolute"
                        style={{
                            left: toPercentX(178),
                            bottom: "0",
                        }}
                    />

                    {/* 6.png: left: 235px, top: 775px */}
                    <Image
                        src="/images/splash/6.png"
                        alt=""
                        width={62}
                        height={76}
                        className="absolute"
                        style={{
                            left: toPercentX(235),
                            bottom: "0",
                        }}
                    />

                    {/* 7.png: left: 263px, top: 765px → slightly higher */}
                    <Image
                        src="/images/splash/7.png"
                        alt=""
                        width={88}
                        height={88}
                        className="absolute"
                        style={{
                            left: toPercentX(263),
                            bottom: "0",
                        }}
                    />

                    {/* 8.png: left: 296px, top: 733px → higher up */}
                    <Image
                        src="/images/splash/8.png"
                        alt=""
                        width={85}
                        height={81}
                        className="absolute"
                        style={{
                            left: toPercentX(296),
                            bottom: "40px",
                        }}
                    />

                    {/* 9.png: left: 315px, top: 672px → high up, doge/character jumping */}
                    <Image
                        src="/images/splash/9.png"
                        alt=""
                        width={78}
                        height={83}
                        className="absolute"
                        style={{
                            left: toPercentX(315),
                            bottom: "100px",
                        }}
                    />

                    {/* 10.png: left: 326px, top: 779px */}
                    <Image
                        src="/images/splash/10.png"
                        alt=""
                        width={82}
                        height={74}
                        className="absolute"
                        style={{
                            left: toPercentX(326),
                            bottom: "0",
                        }}
                    />

                    {/* 11.png: left: 337.61px, top: 742.02px, rotate -16.47deg */}
                    <Image
                        src="/images/splash/11.png"
                        alt=""
                        width={56}
                        height={72}
                        className="absolute"
                        style={{
                            left: toPercentX(337.61),
                            bottom: "40px",
                            transform: "rotate(-16.47deg)",
                        }}
                    />

                    {/* 12.png: left: -9px, bottom: 0 */}
                    <Image
                        src="/images/splash/12.png"
                        alt=""
                        width={68}
                        height={82}
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
