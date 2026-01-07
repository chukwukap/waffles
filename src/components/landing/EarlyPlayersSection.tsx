"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Cloud1 } from "../icons";

export function EarlyPlayersSection() {
  const router = useRouter();

  return (
    <section className="relative w-full h-[930px] overflow-hidden bg-[#00CFF2]">
      {/* Gradient Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(180deg, #00CFF2 0%, #FFFEFE 100%)",
        }}
      />

      {/* Decorative Clouds - Top Left */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="absolute left-[5%] top-[10%] z-[5] hidden md:block"
      >
        <Cloud1 className="w-[120px] h-auto" />
      </motion.div>

      {/* Decorative Clouds - Middle Left */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="absolute left-[8%] top-[25%] z-[5] hidden md:block"
      >
        <Cloud1 className="w-[80px] h-auto" />
      </motion.div>

      {/* Decorative Clouds - Bottom Left */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="absolute left-[15%] top-[35%] z-[5] hidden md:block"
      >
        <Cloud1 className="w-[60px] h-auto" />
      </motion.div>

      {/* Decorative Clouds - Bottom Right */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="absolute right-[25%] top-[60%] z-[5] hidden md:block"
      >
        <Cloud1 className="w-[90px] h-auto" />
      </motion.div>

      {/* Decorative Clouds - Far Right */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="absolute right-[5%] top-[55%] z-[5] hidden md:block"
      >
        <Cloud1 className="w-[100px] h-auto" />
      </motion.div>

      {/* Content Container - 1440px centered relative */}
      <div className="relative w-full max-w-[1440px] h-full mx-auto z-10">
        {/* Text Block - Positioned per Figma: left: 102px; top: 270px */}
        <div className="absolute top-[200px] lg:top-[270px] left-4 lg:left-[102px] flex flex-col items-start gap-5 w-full max-w-[752px] z-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-body font-normal text-[60px] md:text-[90px] lg:text-[120px] leading-[90%] text-white tracking-[-0.03em] self-stretch"
          >
            EARLY PLAYERS WIN <span className="text-[#006576]">TWICE</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display font-medium text-[20px] md:text-[24px] lg:text-[32px] leading-[130%] text-[#1E1E1E] opacity-70 tracking-[-0.03em] self-stretch"
          >
            It&apos;s conviction rewarded. <br /> It&apos;s how we turn risk
            into reward, and participation into legacy.
          </motion.p>

          {/* Button Container - Per Figma: width: 337px; height: 54px; gap: 12px */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-start gap-3 w-[337px]"
          >
            <button
              onClick={() =>
                router.push(
                  "https://farcaster.xyz/miniapps/sbpPNle-R2-V/waffles"
                )
              }
              className="flex flex-col items-start p-3 gap-1 w-full h-[54px] bg-white rounded-xl border-r-[5px] border-b-[5px] border-[#00CFF2] hover:brightness-95 transition-all"
            >
              <span className="font-body font-normal text-[26px] leading-[115%] tracking-[-0.02em] text-[#00CFF2] text-center self-stretch flex items-end justify-center">
                JOIN THE WAITLIST
              </span>
            </button>
          </motion.div>
        </div>

        {/* Coins and Cloud Group - Figma: left: 946px; top: 253px */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute left-[946px] top-[253px] pointer-events-none hidden xl:block"
        >
          {/* Large Coin - at the back: 381x379 */}
          <div className="relative z-10">
            <Image
              src="/images/illustrations/golden-coin.png"
              alt="Golden Coin"
              width={381}
              height={379}
              className="object-contain"
            />
          </div>

          {/* Small Coin - front right, overlapping large coin */}
          {/* Offset: left: 1091-946=145px, top: 435-253=182px */}
          <div className="absolute left-[145px] top-[182px] z-20">
            <Image
              src="/images/illustrations/golden-coin.png"
              alt="Golden Coin Small"
              width={240}
              height={239}
              className="object-contain"
            />
          </div>

          {/* Cloud - in front at bottom-left of large coin */}
          <div className="absolute left-[-20px] top-[200px] z-30">
            <Cloud1 className="w-[173px] h-auto" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
