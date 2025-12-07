"use client";

import { ClockIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

interface QuestionData {
    id: number;
    content: string;
    gameTitle: string;
    totalAnswers: number;
    correctAnswers: number;
    avgLatencyMs: number;
    accuracy: number;  // percentage
}

interface QuestionDifficultyProps {
    questions: QuestionData[];
}

export function QuestionDifficulty({ questions }: QuestionDifficultyProps) {
    // Sort by accuracy (lowest = hardest)
    const sorted = [...questions].sort((a, b) => a.accuracy - b.accuracy);
    const hardest = sorted.slice(0, 5);
    const easiest = sorted.slice(-5).reverse();

    const getDifficultyColor = (accuracy: number) => {
        if (accuracy < 30) return { bg: "bg-red-500/20", text: "text-red-400", label: "HARD" };
        if (accuracy < 60) return { bg: "bg-[#FFC931]/20", text: "text-[#FFC931]", label: "MEDIUM" };
        return { bg: "bg-[#14B985]/20", text: "text-[#14B985]", label: "EASY" };
    };

    const formatLatency = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    const QuestionCard = ({ q, rank, type }: { q: QuestionData; rank: number; type: "hard" | "easy" }) => {
        const difficulty = getDifficultyColor(q.accuracy);
        return (
            <div className="p-4 rounded-xl bg-white/3 hover:bg-white/5 transition-colors border border-white/5">
                <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${type === "hard" ? "bg-red-500/20 text-red-400" : "bg-[#14B985]/20 text-[#14B985]"
                        }`}>
                        #{rank}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white line-clamp-2 mb-2">{q.content}</p>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="text-white/40">{q.gameTitle}</span>
                            <span className={`px-2 py-0.5 rounded-full ${difficulty.bg} ${difficulty.text}`}>
                                {difficulty.label}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                    <div>
                        <div className="text-lg font-bold text-[#FFC931]">{q.accuracy.toFixed(0)}%</div>
                        <div className="text-xs text-white/40">accuracy</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-[#00CFF2]">{formatLatency(q.avgLatencyMs)}</div>
                        <div className="text-xs text-white/40">avg time</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-white/70">{q.totalAnswers}</div>
                        <div className="text-xs text-white/40">answers</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Summary Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="admin-panel p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-[#FFC931]/10">
                            <CheckCircleIcon className="h-5 w-5 text-[#FFC931]" />
                        </div>
                        <span className="text-sm text-white/50 font-display uppercase tracking-wider">Avg Accuracy</span>
                    </div>
                    <div className="text-3xl font-bold text-[#FFC931] font-body admin-stat-glow">
                        {questions.length > 0
                            ? (questions.reduce((sum, q) => sum + q.accuracy, 0) / questions.length).toFixed(1)
                            : 0}%
                    </div>
                </div>

                <div className="admin-panel p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-[#00CFF2]/10">
                            <ClockIcon className="h-5 w-5 text-[#00CFF2]" />
                        </div>
                        <span className="text-sm text-white/50 font-display uppercase tracking-wider">Avg Response</span>
                    </div>
                    <div className="text-3xl font-bold text-[#00CFF2] font-body admin-stat-glow-cyan">
                        {questions.length > 0
                            ? formatLatency(questions.reduce((sum, q) => sum + q.avgLatencyMs, 0) / questions.length)
                            : "0s"}
                    </div>
                </div>

                <div className="admin-panel p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-[#FB72FF]/10">
                            <XCircleIcon className="h-5 w-5 text-[#FB72FF]" />
                        </div>
                        <span className="text-sm text-white/50 font-display uppercase tracking-wider">Questions</span>
                    </div>
                    <div className="text-3xl font-bold text-[#FB72FF] font-body admin-stat-glow-pink">
                        {questions.length}
                    </div>
                </div>
            </div>

            {/* Hardest & Easiest */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="admin-panel p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        <h3 className="text-lg font-semibold text-white font-display">Hardest Questions</h3>
                    </div>
                    <div className="space-y-3">
                        {hardest.map((q, i) => (
                            <QuestionCard key={q.id} q={q} rank={i + 1} type="hard" />
                        ))}
                        {hardest.length === 0 && (
                            <div className="text-center py-8 text-white/40">No question data yet</div>
                        )}
                    </div>
                </div>

                <div className="admin-panel p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-[#14B985] animate-pulse" />
                        <h3 className="text-lg font-semibold text-white font-display">Easiest Questions</h3>
                    </div>
                    <div className="space-y-3">
                        {easiest.map((q, i) => (
                            <QuestionCard key={q.id} q={q} rank={i + 1} type="easy" />
                        ))}
                        {easiest.length === 0 && (
                            <div className="text-center py-8 text-white/40">No question data yet</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
