"use client";

import { useState } from "react";
import { getExplorerUrl } from "@/lib/contracts/config";
import {
    ChartPieIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";

interface SettlementPanelProps {
    gameId: number;
    gameStatus: string;
    onChainStatus?: {
        exists: boolean;
        ended: boolean;
        settled: boolean;
        merkleRoot?: string;
    };
}

// Note: "create" action removed - games are now created on-chain automatically during game creation
type SettlementAction = "end" | "settle";

export function SettlementPanel({
    gameId,
    gameStatus,
    onChainStatus,
}: SettlementPanelProps) {
    const [isLoading, setIsLoading] = useState<SettlementAction | null>(null);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        txHash?: string;
    } | null>(null);

    const executeSettlement = async (action: SettlementAction) => {
        setIsLoading(action);
        setResult(null);

        try {
            const res = await fetch("/api/v1/admin/settlement", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // Use cookie auth
                body: JSON.stringify({
                    action,
                    gameId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Settlement action failed");
            }

            setResult({
                success: true,
                message: getSuccessMessage(action, data),
                txHash: data.txHash,
            });
        } catch (error) {
            setResult({
                success: false,
                message: error instanceof Error ? error.message : "Settlement failed",
            });
        } finally {
            setIsLoading(null);
        }
    };

    const getSuccessMessage = (
        action: SettlementAction,
        data: { txHash?: string; winnersCount?: number }
    ) => {
        switch (action) {
            case "end":
                return `Game ended on-chain`;
            case "settle":
                return `Game settled! ${data.winnersCount || 0} winners`;
            default:
                return "Action completed";
        }
    };

    // Games are now created on-chain automatically when created in admin
    const canEnd = gameStatus === "ENDED" && onChainStatus?.exists && !onChainStatus?.ended;
    const canSettle = gameStatus === "ENDED" && onChainStatus?.ended && !onChainStatus?.settled;
    const isSettled = onChainStatus?.settled;
    const isOnChain = onChainStatus?.exists;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <ChartPieIcon className="h-5 w-5 text-[#FFC931]" />
                <h3 className="text-lg font-bold text-white font-display">
                    On-Chain Settlement
                </h3>
            </div>

            {/* Status Indicators */}
            <div className="flex flex-wrap gap-3">
                <StatusBadge
                    label="On-Chain"
                    active={onChainStatus?.exists}
                />
                <StatusBadge
                    label="Game Ended"
                    active={onChainStatus?.ended}
                    pending={isLoading === "end"}
                />
                <StatusBadge
                    label="Settled"
                    active={onChainStatus?.settled}
                    pending={isLoading === "settle"}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                {canEnd && (
                    <ActionButton
                        onClick={() => executeSettlement("end")}
                        loading={isLoading === "end"}
                        icon={<ArrowPathIcon className="h-4 w-4" />}
                        label="End On-Chain"
                        variant="warning"
                    />
                )}

                {canSettle && (
                    <ActionButton
                        onClick={() => executeSettlement("settle")}
                        loading={isLoading === "settle"}
                        icon={<ChartPieIcon className="h-4 w-4" />}
                        label="Submit Merkle Root"
                        variant="success"
                    />
                )}

                {isSettled && (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#14B985]/20 text-[#14B985] rounded-xl">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span className="font-medium">Settlement Complete</span>
                    </div>
                )}

                {/* Status messages when no actions available */}
                {!canEnd && !canSettle && !isSettled && (
                    <div className="text-white/50 text-sm space-y-1">
                        {!isOnChain && gameStatus === "SCHEDULED" && (
                            <p className="flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Game was not created on-chain. This may indicate an error during creation.
                            </p>
                        )}
                        {isOnChain && gameStatus === "SCHEDULED" && (
                            <p>Game is registered on-chain. Waiting for game to go live and end.</p>
                        )}
                        {isOnChain && gameStatus === "LIVE" && (
                            <p>Game is live. Settlement actions will be available after the game ends.</p>
                        )}
                        {!isOnChain && gameStatus !== "SCHEDULED" && (
                            <p>No settlement actions available.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Result Message */}
            {result && (
                <div
                    className={`flex items-start gap-3 p-4 rounded-xl border ${result.success
                        ? "bg-[#14B985]/10 border-[#14B985]/30 text-[#14B985]"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                        }`}
                >
                    {result.success ? (
                        <CheckCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
                    ) : (
                        <XCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                        <p className="font-medium">{result.message}</p>
                        {result.txHash && (
                            <a
                                href={getExplorerUrl.tx(result.txHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm underline opacity-80 hover:opacity-100"
                            >
                                View transaction →
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Merkle Root Display */}
            {onChainStatus?.merkleRoot && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-white/50 text-sm mb-1">Merkle Root</p>
                    <code className="text-xs text-[#00CFF2] break-all">
                        {onChainStatus.merkleRoot}
                    </code>
                </div>
            )}
        </div>
    );
}

// Helper Components
function StatusBadge({
    label,
    active,
    pending,
}: {
    label: string;
    active?: boolean;
    pending?: boolean;
}) {
    return (
        <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${pending
                ? "bg-[#FFC931]/20 text-[#FFC931]"
                : active
                    ? "bg-[#14B985]/20 text-[#14B985]"
                    : "bg-white/10 text-white/50"
                }`}
        >
            {pending ? (
                <ArrowPathIcon className="h-3 w-3 animate-spin" />
            ) : active ? (
                <CheckCircleIcon className="h-3 w-3" />
            ) : (
                <div className="h-2 w-2 rounded-full bg-current opacity-50" />
            )}
            {label}
        </div>
    );
}

function ActionButton({
    onClick,
    loading,
    icon,
    label,
    variant,
}: {
    onClick: () => void;
    loading: boolean;
    icon: React.ReactNode;
    label: string;
    variant: "primary" | "warning" | "success";
}) {
    const variants = {
        primary: "bg-[#FFC931] hover:bg-[#FFD966] text-black",
        warning: "bg-orange-500 hover:bg-orange-400 text-white",
        success: "bg-[#14B985] hover:bg-[#1BF5B0] text-black",
    };

    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]}`}
        >
            {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : icon}
            {label}
        </button>
    );
}
