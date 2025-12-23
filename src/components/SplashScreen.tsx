"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
    duration?: number;
    onComplete?: () => void;
}

// Figma design is 393x852. Convert absolute px to % for responsive
const toPercent = (px: number, base: number) => `${(px / base) * 100}%`;
const BASE_W = 393;
const BASE_H = 852;

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
                    {/* Center Logo Container - Frame 1 from Figma */}
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
                        {/* Logo Icon - 55x43 */}
                        <Image
                            src="/logo.png"
                            alt="Waffles"
                            width={55}
                            height={43}
                            priority
                        />
                        {/* WAFFLES Text */}
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

                    {/* ============================================
              Character images - numbered 1-12 left to right
              Base: 393x852, positions converted to %
              ============================================ */}

                    {/* 1.png: left: -21px, top: 710px, rotated 6.78deg */}
                    <Image
                        src="/images/splash/1.png"
                        alt=""
                        width={109}
                        height={100}
                        className="absolute"
                        style={{
                            left: toPercent(-21, BASE_W),
                            top: toPercent(710, BASE_H),
                            transform: "rotate(6.78deg)",
                        }}
                    />

                    {/* 2.png: left: 34px, top: 778px */}
                    <Image
                        src="/images/splash/2.png"
                        alt=""
                        width={87}
                        height={95}
                        className="absolute"
                        style={{
                            left: toPercent(34, BASE_W),
                            top: toPercent(778, BASE_H),
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
                            left: toPercent(85, BASE_W),
                            top: toPercent(777, BASE_H),
                        }}
                    />

                    {/* 4.png: left: 142px, top: 775px, flipped */}
                    <Image
                        src="/images/splash/4.png"
                        alt=""
                        width={72}
                        height={91}
                        className="absolute"
                        style={{
                            left: toPercent(142, BASE_W),
                            top: toPercent(775, BASE_H),
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
                            left: toPercent(178, BASE_W),
                            top: toPercent(783, BASE_H),
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
                            left: toPercent(235, BASE_W),
                            top: toPercent(775, BASE_H),
                        }}
                    />

                    {/* 7.png: left: 263px, top: 765px */}
                    <Image
                        src="/images/splash/7.png"
                        alt=""
                        width={88}
                        height={88}
                        className="absolute"
                        style={{
                            left: toPercent(263, BASE_W),
                            top: toPercent(765, BASE_H),
                        }}
                    />

                    {/* 8.png: left: 296px, top: 733px */}
                    <Image
                        src="/images/splash/8.png"
                        alt=""
                        width={85}
                        height={81}
                        className="absolute"
                        style={{
                            left: toPercent(296, BASE_W),
                            top: toPercent(733, BASE_H),
                        }}
                    />

                    {/* 9.png: left: 315px, top: 672px */}
                    <Image
                        src="/images/splash/9.png"
                        alt=""
                        width={78}
                        height={83}
                        className="absolute"
                        style={{
                            left: toPercent(315, BASE_W),
                            top: toPercent(672, BASE_H),
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
                            left: toPercent(326, BASE_W),
                            top: toPercent(779, BASE_H),
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
                            left: toPercent(337.61, BASE_W),
                            top: toPercent(742.02, BASE_H),
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
                            left: toPercent(-9, BASE_W),
                            bottom: "0",
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
