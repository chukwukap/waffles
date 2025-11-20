"use client";

import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { motion } from "framer-motion";
import Image from "next/image";
import { WaitlistFooter } from "./Footer"; // Assuming Footer is in same dir or update path
import { WaitlistMutuals, MutualsData } from "./WaitlistMutuals";
import { JoinWaitlistState } from "@/actions/waitlist"; // Import from actions

interface WaitlistJoinViewProps {
    state: JoinWaitlistState;
    pending: boolean;
    handleSubmit: (formData: FormData) => void;
    fid: number | undefined;
    refParam: string | null;
    mutualsData: MutualsData | null;
}

export function WaitlistJoinView({
    state,
    pending,
    handleSubmit,
    fid,
    refParam,
    mutualsData,
}: WaitlistJoinViewProps) {
    const headingClasses =
        "font-body font-normal not-italic text-[44px] leading-[92%] tracking-[-0.03em] text-center text-white";
    const descriptionClasses =
        "text-[#99A0AE] font-display font-medium text-[16px] leading-[130%] tracking-[-0.03em] text-center mb-2 text-pretty max-w-[320px] mx-auto";
    const buttonClasses = "w-[361px] mx-auto text-[#191919] text-[26px]";
    const errorClasses = "text-red-400 text-sm";

    return (
        <>
            <section className="flex-1 overflow-y-auto px-4 space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="w-[224px] h-[42px] relative mt-14 mx-auto">
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
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
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
                            className="mx-auto my-6"
                        />
                    </motion.div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.2 }}
                    className="mt-[2vh] flex flex-col items-center text-center"
                >
                    {/* Join Form UI */}
                    <h1 className={headingClasses}>JOIN THE WAITLIST</h1>
                    <p className={descriptionClasses}>
                        Join now to be first to play when <br /> Waffles launches
                    </p>
                    {state.error && <p className={errorClasses}>{state.error}</p>}
                    <form action={handleSubmit} className="mt-6">
                        {fid && <input type="hidden" name="fid" value={fid} />}
                        {refParam && <input type="hidden" name="ref" value={refParam} />}
                        <FancyBorderButton
                            type="submit"
                            disabled={pending}
                            className={buttonClasses}
                        >
                            {pending ? "JOINING..." : "GET ME ON THE LIST"}
                        </FancyBorderButton>
                    </form>
                </motion.div>

                <WaitlistMutuals mutualsData={mutualsData} />
            </section>
            <WaitlistFooter />
        </>
    );
}
