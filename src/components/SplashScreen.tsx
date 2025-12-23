"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
    duration?: number;
    onComplete?: () => void;
}

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
                    className="fixed inset-0 z-9999 overflow-hidden"
                    style={{
                        background: "linear-gradient(180deg, #1E1E1E 0%, #000000 100%)",
                    }}
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

                    {/* Character images at bottom - positions from Figma (scaled to %) */}

                    {/* crew-1: left: 34px, bottom area */}
                    <Image
                        src="/images/splash/crew-1.png"
                        alt=""
                        width={87}
                        height={95}
                        className="absolute"
                        style={{ left: "8.6%", bottom: "0" }}
                    />

                    {/* crew-2: left: 85px */}
                    <Image
                        src="/images/splash/crew-2.png"
                        alt=""
                        width={81}
                        height={78}
                        className="absolute"
                        style={{ left: "21.6%", bottom: "0" }}
                    />

                    {/* crew-3: left: 142px, flipped */}
                    <Image
                        src="/images/splash/crew-3.png"
                        alt=""
                        width={72}
                        height={91}
                        className="absolute scale-x-[-1]"
                        style={{ left: "36%", bottom: "0" }}
                    />

                    {/* crew-4: left: 178px */}
                    <Image
                        src="/images/splash/crew-4.png"
                        alt=""
                        width={85}
                        height={69}
                        className="absolute"
                        style={{ left: "45%", bottom: "0" }}
                    />

                    {/* crew-5: left: 235px */}
                    <Image
                        src="/images/splash/crew-5.png"
                        alt=""
                        width={62}
                        height={76}
                        className="absolute"
                        style={{ left: "60%", bottom: "0" }}
                    />

                    {/* crew-6: left: 263px */}
                    <Image
                        src="/images/splash/crew-6.png"
                        alt=""
                        width={88}
                        height={88}
                        className="absolute"
                        style={{ left: "67%", bottom: "0" }}
                    />

                    {/* crew-7: left: 326px */}
                    <Image
                        src="/images/splash/crew-7.png"
                        alt=""
                        width={82}
                        height={74}
                        className="absolute"
                        style={{ left: "83%", bottom: "0" }}
                    />

                    {/* Left edge character: rotated */}
                    <Image
                        src="/images/splash/crew-8.png"
                        alt=""
                        width={109}
                        height={100}
                        className="absolute"
                        style={{
                            left: "-5%",
                            bottom: "5%",
                            transform: "rotate(6.78deg)",
                        }}
                    />

                    {/* Right edge characters */}
                    <Image
                        src="/images/splash/crew-9.png"
                        alt=""
                        width={78}
                        height={83}
                        className="absolute"
                        style={{ right: "5%", bottom: "15%" }}
                    />

                    <Image
                        src="/images/splash/crew-10.png"
                        alt=""
                        width={68}
                        height={82}
                        className="absolute"
                        style={{ left: "-2%", bottom: "0" }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
