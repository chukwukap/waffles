"use client";

import { QuestionActionResult } from "@/actions/admin/questions";
import { useActionState, useRef, useState, useEffect } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";

interface QuestionFormProps {
    gameId: number;
    action: (prevState: QuestionActionResult | null, formData: FormData) => Promise<QuestionActionResult>;
    nextRoundIndex: number;
}

export function QuestionForm({ gameId, action, nextRoundIndex }: QuestionFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const [resetKey, setResetKey] = useState(0);
    const [mediaUrl, setMediaUrl] = useState("");
    const [soundUrl, setSoundUrl] = useState("");
    const [state, formAction] = useActionState<QuestionActionResult | null, FormData>(
        action,
        null
    );

    // Reset form on success
    useEffect(() => {
        if (state?.success && formRef.current) {
            formRef.current.reset();
            setResetKey((prev: number) => prev + 1);
            setMediaUrl("");
            setSoundUrl("");
        }
    }, [state?.success]);

    return (
        <form ref={formRef} action={formAction} className="space-y-5">
            <input type="hidden" name="mediaUrl" value={mediaUrl} />
            <input type="hidden" name="soundUrl" value={soundUrl} />

            {/* Question Content */}
            <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                    Question <span className="text-red-400">*</span>
                </label>
                <textarea
                    name="content"
                    required
                    rows={2}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all resize-none"
                    placeholder="Enter your trivia question..."
                />
            </div>

            {/* Round Index */}
            <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                    Round # <span className="text-red-400">*</span>
                </label>
                <input
                    type="number"
                    name="roundIndex"
                    defaultValue={nextRoundIndex}
                    min={1}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                />
            </div>

            {/* Media Pickers */}
            <div className="space-y-4">
                <MediaPicker
                    key={`media-${resetKey}`}
                    label="Image (optional)"
                    name="mediaUrl"
                    accept="image"
                    selectedUrl={mediaUrl}
                    onSelect={setMediaUrl}
                />
                <MediaPicker
                    key={`sound-${resetKey}`}
                    label="Audio (optional)"
                    name="soundUrl"
                    accept="audio"
                    selectedUrl={soundUrl}
                    onSelect={setSoundUrl}
                />
            </div>

            {/* Answer Options */}
            <div>
                <label className="block text-sm font-medium text-white/70 mb-3">
                    Answer Options <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {['A', 'B', 'C', 'D'].map((letter) => (
                        <div key={letter}>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white/60">{letter}</span>
                            </div>
                            <input
                                type="text"
                                name={`option${letter}`}
                                required
                                placeholder={`Option ${letter}`}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Correct Answer & Duration */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                        Correct <span className="text-red-400">*</span>
                    </label>
                    <select
                        name="correctAnswer"
                        required
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                    >
                        <option value="" className="bg-[#0a0a0b]">Select...</option>
                        <option value="A" className="bg-[#0a0a0b]">A</option>
                        <option value="B" className="bg-[#0a0a0b]">B</option>
                        <option value="C" className="bg-[#0a0a0b]">C</option>
                        <option value="D" className="bg-[#0a0a0b]">D</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                        Duration <span className="text-white/30">(sec)</span>
                    </label>
                    <input
                        type="number"
                        name="durationSec"
                        defaultValue={10}
                        min={5}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                    />
                </div>
            </div>

            {/* Feedback Messages */}
            {state && !state.success && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 text-sm">{state.error}</p>
                </div>
            )}
            {state && state.success && (
                <div className="p-3 bg-[#14B985]/20 border border-[#14B985]/30 rounded-xl">
                    <p className="text-[#14B985] text-sm">✓ Question added!</p>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                className="w-full px-6 py-3 bg-[#FFC931] text-black font-bold rounded-xl hover:bg-[#FFD966] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#FFC931] disabled:opacity-50 transition-all"
            >
                Add Question
            </button>
        </form>
    );
}

