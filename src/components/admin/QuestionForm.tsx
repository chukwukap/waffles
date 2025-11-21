"use client";


import { QuestionActionResult } from "@/actions/admin/questions";
import { useActionState, useRef } from "react";
import { MediaUpload } from "@/components/admin/MediaUpload";

interface QuestionFormProps {
    gameId: number;
    action: (prevState: QuestionActionResult | null, formData: FormData) => Promise<QuestionActionResult>;
    nextRoundIndex: number;
}

export function QuestionForm({ gameId, action, nextRoundIndex }: QuestionFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState<QuestionActionResult | null, FormData>(
        action,
        null
    );

    // Reset form on success
    if (state?.success && formRef.current) {
        formRef.current.reset();
    }

    return (
        <div className="space-y-6">
            <form ref={formRef} action={formAction} className="space-y-4">
                <input type="hidden" name="roundIndex" value={nextRoundIndex} />

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Question #{nextRoundIndex}
                    </label>
                    <textarea
                        name="content"
                        required
                        rows={2}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter question content..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MediaUpload
                        label="Question Image (Optional)"
                        name="mediaUrl"
                        maxSizeMB={4}
                        accept="image/*"
                    />
                    <MediaUpload
                        label="Question Audio (Optional)"
                        name="soundUrl"
                        maxSizeMB={10}
                        accept="audio/*"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Option A</label>
                        <input
                            type="text"
                            name="optionA"
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Option B</label>
                        <input
                            type="text"
                            name="optionB"
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Option C</label>
                        <input
                            type="text"
                            name="optionC"
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Option D</label>
                        <input
                            type="text"
                            name="optionD"
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Correct Answer</label>
                        <select
                            name="correctAnswer"
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">Select correct answer...</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Duration (seconds)</label>
                        <input
                            type="number"
                            name="durationSec"
                            defaultValue={10}
                            min={5}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Media URLs - for Vercel Blob Storage integration */}
                <div className="border-t border-slate-200 pt-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Media (Optional)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-600 mb-2">Image URL</label>
                            <input
                                type="url"
                                name="mediaUrl"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-600 mb-2">Audio URL</label>
                            <input
                                type="url"
                                name="soundUrl"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>

                {state && !state.success && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">{state.error}</p>
                    </div>
                )}

                {state && state.success && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 text-sm">Question added successfully!</p>
                    </div>
                )}

                <button
                    type="submit"
                    className="px-6 py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    Add Question
                </button>
            </form>
        </div>
    );
}
