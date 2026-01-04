"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getExplorerUrl } from "@/lib/chain";
import {
    ChartPieIcon,
    LinkIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    XCircleIcon,
    TrophyIcon,
} from "@heroicons/react/24/outline";

// ============================================================================
// Types
// ============================================================================

type GameState = "SCHEDULED" | "LIVE" | "COMPLETED" | "RANKED" | "ON_CHAIN";

interface Winner {
    rank: number;
    username: string;
    score: number;
    prize: number;
}

interface LifecycleStatus {
    state: GameState;
    gameId: string;
    gameNumber: number;
    title: string;
    playerCount: number;
    prizePool: number;
    rankedAt: string | null;
    onChainAt: string | null;
    merkleRoot: string | null;
    onChainTxHash: string | null;
    canRank: boolean;
    canPublish: boolean;
    preview?: Winner[];
}

interface RankResult {
    entriesRanked: number;
    prizesDistributed: number;
    prizePool: number;
    winners: Array<{ rank: number; prize: number; username: string }>;
}

interface PublishResult {
    merkleRoot: string;
    txHash: string;
    winnersCount: number;
}

// ============================================================================
// Component
// ============================================================================

export function GameLifecyclePanel({ gameId }: { gameId: string }) {
    const router = useRouter();
    const [status, setStatus] = useState<LifecycleStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<"rank" | "publish" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<RankResult | PublishResult | null>(null);

    // Fetch status
    const fetchStatus = async () => {
        try {
            const res = await fetch(`/api/v1/admin/games/${gameId}/lifecycle`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to load status");
            const data = await res.json();
            setStatus(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [gameId]);

    // Execute action
    const executeAction = async (action: "rank" | "publish") => {
        setActionLoading(action);
        setError(null);
        setLastResult(null);

        try {
            const res = await fetch(`/api/v1/admin/games/${gameId}/lifecycle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ action }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Action failed");
            }

            setStatus(data.newStatus);
            setLastResult(data.result);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Action failed");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 animate-pulse">
                <div className="h-6 w-48 bg-white/10 rounded mb-4" />
                <div className="h-24 bg-white/5 rounded-xl" />
            </div>
        );
    }

    if (!status) {
        return (
            <div className="bg-red-500/10 rounded-2xl p-6 border border-red-500/20 text-red-400">
                Failed to load lifecycle status
            </div>
        );
    }

    const steps = [
        { key: "COMPLETED", label: "Complete", icon: "1" },
        { key: "RANKED", label: "Rank", icon: "2" },
        { key: "ON_CHAIN", label: "Publish", icon: "3" },
    ];

    const currentStepIndex = steps.findIndex((s) => s.key === status.state);
    const isCompleted = (stepKey: string) => {
        const stepIndex = steps.findIndex((s) => s.key === stepKey);
        return stepIndex <= currentStepIndex || status.state === "ON_CHAIN";
    };

    return (
        <div className="bg-linear-to-br from-white/3 to-transparent rounded-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FFC931]/10 border border-[#FFC931]/20 flex items-center justify-center">
                        <TrophyIcon className="h-5 w-5 text-[#FFC931]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white font-display">Game Results</h3>
                        <p className="text-sm text-white/50">{status.playerCount} players • ${status.prizePool.toFixed(2)} pool</p>
                    </div>
                </div>
                <StatusBadge state={status.state} />
            </div>

            {/* Step Progress */}
            <div className="px-6 py-4 bg-white/2">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    {steps.map((step, index) => (
                        <div key={step.key} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${isCompleted(step.key)
                                        ? "bg-[#14B985] text-black"
                                        : status.state === step.key || (index === currentStepIndex + 1 && status.state !== "ON_CHAIN")
                                            ? "bg-[#FFC931] text-black"
                                            : "bg-white/10 text-white/50"
                                        }`}
                                >
                                    {isCompleted(step.key) ? (
                                        <CheckCircleIcon className="h-5 w-5" />
                                    ) : (
                                        step.icon
                                    )}
                                </div>
                                <span
                                    className={`mt-2 text-xs font-medium ${isCompleted(step.key) ? "text-[#14B985]" : "text-white/50"
                                        }`}
                                >
                                    {step.label}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`w-16 h-0.5 mx-2 ${isCompleted(steps[index + 1].key)
                                        ? "bg-[#14B985]"
                                        : "bg-white/10"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6 space-y-6">
                {/* Error Display */}
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                        <XCircleIcon className="h-5 w-5 shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Success Display */}
                {lastResult && (
                    <div className="flex items-start gap-3 p-4 bg-[#14B985]/10 border border-[#14B985]/20 rounded-xl text-[#14B985]">
                        <CheckCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            {"entriesRanked" in lastResult ? (
                                <p className="text-sm">
                                    Ranked {lastResult.entriesRanked} players • {lastResult.prizesDistributed} winners
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-sm">Published to blockchain • {lastResult.winnersCount} winners</p>
                                    <a
                                        href={getExplorerUrl(lastResult.txHash, "tx")}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs underline opacity-80 hover:opacity-100"
                                    >
                                        View transaction →
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Card */}
                {(status.canRank || status.canPublish) && (
                    <ActionCard
                        status={status}
                        actionLoading={actionLoading}
                        onAction={executeAction}
                    />
                )}

                {/* Completed State */}
                {status.state === "ON_CHAIN" && (
                    <div className="p-6 bg-[#14B985]/10 border border-[#14B985]/20 rounded-xl text-center">
                        <CheckCircleIcon className="h-12 w-12 text-[#14B985] mx-auto mb-3" />
                        <p className="text-[#14B985] font-bold text-lg">Settlement Complete</p>
                        <p className="text-white/50 text-sm mt-1">Winners can now claim their prizes</p>
                        {status.onChainTxHash && (
                            <a
                                href={getExplorerUrl(status.onChainTxHash, "tx")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-4 text-sm text-[#14B985] hover:underline"
                            >
                                <LinkIcon className="h-4 w-4" />
                                View on Explorer
                            </a>
                        )}
                    </div>
                )}

                {/* Waiting States */}
                {status.state === "LIVE" && (
                    <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
                        <div className="w-12 h-12 rounded-full bg-[#FFC931]/10 border border-[#FFC931]/20 flex items-center justify-center mx-auto mb-3">
                            <ArrowPathIcon className="h-6 w-6 text-[#FFC931] animate-spin" />
                        </div>
                        <p className="text-white font-medium">Game in Progress</p>
                        <p className="text-white/50 text-sm mt-1">Actions available after game ends</p>
                    </div>
                )}

                {status.state === "SCHEDULED" && (
                    <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
                        <p className="text-white font-medium">Game Not Started</p>
                        <p className="text-white/50 text-sm mt-1">Actions available after game ends</p>
                    </div>
                )}

                {/* Preview / Winners List */}
                {(status.preview || status.state === "RANKED" || status.state === "ON_CHAIN") && (
                    <WinnersPreview gameId={gameId} state={status.state} preview={status.preview} />
                )}

                {/* Merkle Root Display */}
                {status.merkleRoot && (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-white/50 text-xs mb-1">Merkle Root</p>
                        <code className="text-xs text-[#00CFF2] break-all">{status.merkleRoot}</code>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

function StatusBadge({ state }: { state: GameState }) {
    const config: Record<GameState, { label: string; color: string }> = {
        SCHEDULED: { label: "Scheduled", color: "bg-white/10 text-white/60" },
        LIVE: { label: "Live", color: "bg-[#FFC931]/20 text-[#FFC931]" },
        COMPLETED: { label: "Completed", color: "bg-orange-500/20 text-orange-400" },
        RANKED: { label: "Ranked", color: "bg-blue-500/20 text-blue-400" },
        ON_CHAIN: { label: "On-Chain", color: "bg-[#14B985]/20 text-[#14B985]" },
    };

    const { label, color } = config[state];

    return (
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${color}`}>
            {label}
        </span>
    );
}

function ActionCard({
    status,
    actionLoading,
    onAction,
}: {
    status: LifecycleStatus;
    actionLoading: "rank" | "publish" | null;
    onAction: (action: "rank" | "publish") => void;
}) {
    if (status.canRank) {
        return (
            <div className="p-6 bg-linear-to-br from-[#FFC931]/10 to-transparent border border-[#FFC931]/20 rounded-xl">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FFC931]/20 border border-[#FFC931]/30 flex items-center justify-center shrink-0">
                        <ChartPieIcon className="h-6 w-6 text-[#FFC931]" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-white font-bold text-lg">Calculate Rankings</h4>
                        <ul className="mt-2 space-y-1 text-sm text-white/60">
                            <li>• {status.playerCount} players will be ranked by score</li>
                            <li>• Prize pool: ${status.prizePool.toFixed(2)}</li>
                            <li>• Top 3 receive: ${(status.prizePool * 0.6).toFixed(0)} / ${(status.prizePool * 0.3).toFixed(0)} / ${(status.prizePool * 0.1).toFixed(0)}</li>
                        </ul>
                        <button
                            onClick={() => onAction("rank")}
                            disabled={actionLoading === "rank"}
                            className="mt-4 w-full sm:w-auto px-6 py-3 bg-[#FFC931] hover:bg-[#FFD966] rounded-xl text-black font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#FFC931]/20"
                        >
                            {actionLoading === "rank" ? (
                                <span className="flex items-center justify-center gap-2">
                                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                    Calculating...
                                </span>
                            ) : (
                                "🚀 Rank Players"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (status.canPublish) {
        return (
            <div className="p-6 bg-linear-to-br from-[#14B985]/10 to-transparent border border-[#14B985]/20 rounded-xl">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#14B985]/20 border border-[#14B985]/30 flex items-center justify-center shrink-0">
                        <LinkIcon className="h-6 w-6 text-[#14B985]" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-white font-bold text-lg">Publish to Blockchain</h4>
                        <ul className="mt-2 space-y-1 text-sm text-white/60">
                            <li>• Submit merkle root to smart contract</li>
                            <li>• Enable winners to claim prizes</li>
                            <li>• Send notifications to all players</li>
                        </ul>
                        <button
                            onClick={() => onAction("publish")}
                            disabled={actionLoading === "publish"}
                            className="mt-4 w-full sm:w-auto px-6 py-3 bg-[#14B985] hover:bg-[#1BF5B0] rounded-xl text-black font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#14B985]/20"
                        >
                            {actionLoading === "publish" ? (
                                <span className="flex items-center justify-center gap-2">
                                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                    Publishing...
                                </span>
                            ) : (
                                "⛓️ Publish Results"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

function WinnersPreview({
    gameId,
    state,
    preview,
}: {
    gameId: string;
    state: GameState;
    preview?: Winner[];
}) {
    const [winners, setWinners] = useState<Winner[]>(preview || []);

    useEffect(() => {
        if (state === "RANKED" || state === "ON_CHAIN") {
            // Fetch actual winners from entries
            fetch(`/api/v1/admin/games/${gameId}/lifecycle`, { credentials: "include" })
                .then((res) => res.json())
                .then((data) => {
                    if (data.preview) setWinners(data.preview);
                })
                .catch(() => { });
        }
    }, [gameId, state]);

    if (winners.length === 0) return null;

    const medals = ["🥇", "🥈", "🥉"];

    return (
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-white/50 text-xs mb-3 font-medium">
                {state === "COMPLETED" ? "Preview: Top Scores" : state === "RANKED" ? "Ranked Winners" : "🏆 Winners"}
            </p>
            <div className="space-y-2">
                {winners.slice(0, 5).map((w, i) => (
                    <div
                        key={i}
                        className={`flex items-center justify-between p-3 rounded-lg ${i < 3 ? "bg-white/5" : ""
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-lg">{i < 3 ? medals[i] : `#${w.rank}`}</span>
                            <span className="text-white font-medium">@{w.username}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-white/50">{w.score.toLocaleString()} pts</span>
                            {w.prize > 0 && (
                                <span className="text-[#14B985] font-bold">${w.prize.toFixed(2)}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
