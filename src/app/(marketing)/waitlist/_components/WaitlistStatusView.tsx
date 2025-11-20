"use client";

import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { WaitlistMutuals, MutualsData } from "./WaitlistMutuals";

interface WaitlistStatusViewProps {
    rank: number | null;
    share: () => void;
    mutualsData: MutualsData | null;
    pending: boolean;
}

export function WaitlistStatusView({
    rank,
    share,
    mutualsData,
    pending,
}: WaitlistStatusViewProps) {
    const router = useRouter();
    const descriptionClasses =
        "text-[#99A0AE] font-display font-medium text-[16px] leading-[130%] tracking-[-0.03em] text-center mb-2 text-pretty max-w-[320px] mx-auto";
    const buttonClasses = "w-[361px] mx-auto text-[#191919] text-[26px]";

    const rankMsg = (n: number | null) => {
        if (n === 1) return "You're #1 on the waitlist.";
        if (n && n > 1) return `You're #${n} on the waitlist.`;
        return "You're on the waitlist!";
    };

    return (
        <>
            <section className="flex-1 overflow-y-auto px-4 space-y-4 flex flex-col items-center">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mt-14"
                >
                    <div className="w-[224px] h-[42px] relative">
                        <Image
                            src="/logo-onboarding.png"
                            alt="WAFFLES logo"
                            width={224}
                            height={42}
                            priority
                            className="object-contain"
                        />
                    </div>
                </motion.div>

                {/* Scroll Illustration */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="flex-1 flex items-center justify-center min-h-[200px]"
                >
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Image
                            src="/images/illustrations/waitlist-scroll.svg"
                            width={170}
                            height={189}
                            priority
                            alt="scroll"
                            className="drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                        />
                    </motion.div>
                </motion.div>

                {/* Content: Rank & Description */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.2 }}
                    className="flex flex-col items-center text-center w-full pb-4"
                >
                    {/* Dynamic Rank Message based on Figma design */}
                    <p className={descriptionClasses}>
                        {rankMsg(rank)} Move up faster by completing tasks and inviting
                        friends!
                    </p>

                    {/* Primary Action: COMPLETE TASKS */}
                    <div className="mt-6 w-full flex flex-col items-center gap-4">
                        <FancyBorderButton
                            onClick={() => router.push("/waitlist/tasks")}
                            className={buttonClasses}
                            disabled={pending}
                        >
                            COMPLETE TASKS
                        </FancyBorderButton>

                        {/* Secondary Action: SHARE WAITLIST (Text Link Style) */}
                        <button
                            onClick={share}
                            className="font-body text-[#00CFF2] text-[24px] leading-none tracking-normal hover:opacity-80 transition-opacity uppercase"
                        >
                            SHARE WAITLIST
                        </button>
                    </div>
                </motion.div>

                {/* Mutuals Footer */}
                <WaitlistMutuals mutualsData={mutualsData} />
            </section>
        </>
    );
}
