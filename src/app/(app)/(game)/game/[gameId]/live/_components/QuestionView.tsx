"use client";

import Image from "next/image";
import { useLiveGame } from "../LiveGameProvider";
import { QuestionCardHeader } from "./QuestionCardHeader";
import { QuestionOption } from "./QuestionOption";
import { PALETTES } from "@/lib/constants";
import type { LiveGameQuestion } from "../page";

// ==========================================
// PROPS
// ==========================================

interface QuestionViewProps {
    question: LiveGameQuestion;
    questionNumber: number;
    totalQuestions: number;
    seconds: number;
}

// ==========================================
// COMPONENT
// ==========================================

export default function QuestionView({
    question,
    questionNumber,
    totalQuestions,
    seconds,
}: QuestionViewProps) {
    const { submitAnswer, hasAnswered } = useLiveGame();

    const isAnswered = hasAnswered(question.id);

    const handleSelect = (index: number) => {
        if (isAnswered) return;
        submitAnswer(index);
    };

    return (
        <div className="w-full max-w-lg mx-auto mt-2">
            <QuestionCardHeader
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
                remaining={seconds}
                duration={question.durationSec}
            />

            <section className="mx-auto w-full max-w-lg px-4" aria-live="polite">
                {/* Question Content */}
                <div className="mx-auto mb-4 flex items-center justify-center w-full max-w-[306px] font-body font-normal text-[36px] leading-[0.92] text-center tracking-[-0.03em] text-white">
                    {question.content}
                </div>

                {/* Media */}
                {question.mediaUrl && (
                    <figure className="mx-auto mb-4 flex justify-center w-full">
                        <div className="relative w-full max-w-[299px] h-[158px] rounded-[10px] overflow-hidden bg-[#17171a] border border-[#313136] shadow-[0_8px_0_#000]">
                            <Image
                                src={question.mediaUrl}
                                alt={question.content}
                                fill
                                className="object-cover"
                                sizes="299px"
                            />
                        </div>
                    </figure>
                )}

                {/* Options */}
                <ul className="mx-auto mb-2 flex w-full flex-col gap-2">
                    {question.options.map((opt, idx) => {
                        const palette = PALETTES[idx % PALETTES.length];
                        return (
                            <QuestionOption
                                key={idx}
                                option={opt}
                                index={idx}
                                palette={palette}
                                selectedOptionIndex={isAnswered ? -1 : null} // -1 means no visual selection shown
                                onSelect={handleSelect}
                                disabled={isAnswered}
                            />
                        );
                    })}
                </ul>

                {/* Status */}
                {isAnswered && (
                    <div className="mx-auto text-center font-display text-[16px] text-[#99A0AE]">
                        Answer submitted!
                    </div>
                )}
            </section>
        </div>
    );
}
