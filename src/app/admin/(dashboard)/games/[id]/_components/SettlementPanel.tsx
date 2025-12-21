"use client";

import { useState } from "react";
import { getExplorerUrl } from "@/lib/contracts/config";
import {
  ChartPieIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

interface SettlementPanelProps {
  gameId: number;
  gameStatus: string;
  onChainStatus?: {
    exists: boolean;
    ended: boolean;
    settled: boolean;
    merkleRoot?: string;
    claimCount?: number;
  };
}

type SettlementAction = "end" | "settle" | "updateMerkleRoot";

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
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newMerkleRoot, setNewMerkleRoot] = useState("");

  // Confirmation states
  const [showSettleConfirm, setShowSettleConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [endConfirmText, setEndConfirmText] = useState("");

  const executeSettlement = async (
    action: SettlementAction,
    extraParams?: { newMerkleRoot?: string }
  ) => {
    setIsLoading(action);
    setResult(null);

    try {
      const res = await fetch("/api/v1/admin/settlement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action,
          gameId,
          ...extraParams,
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

      if (action === "updateMerkleRoot") {
        setShowUpdateModal(false);
        setNewMerkleRoot("");
      }
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
      case "updateMerkleRoot":
        return `Merkle root updated successfully!`;
      default:
        return "Action completed";
    }
  };

  const canEnd =
    gameStatus === "ENDED" && onChainStatus?.exists && !onChainStatus?.ended;
  const canSettle =
    gameStatus === "ENDED" && onChainStatus?.ended && !onChainStatus?.settled;
  const isSettled = onChainStatus?.settled;
  const isOnChain = onChainStatus?.exists;
  const canUpdateMerkleRoot =
    isSettled && (onChainStatus?.claimCount ?? 0) === 0;

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
        <StatusBadge label="On-Chain" active={onChainStatus?.exists} />
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
            onClick={() => setShowEndConfirm(true)}
            loading={isLoading === "end"}
            icon={<ArrowPathIcon className="h-4 w-4" />}
            label="End On-Chain"
            variant="warning"
          />
        )}

        {canSettle && (
          <ActionButton
            onClick={() => setShowSettleConfirm(true)}
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

        {canUpdateMerkleRoot && (
          <ActionButton
            onClick={() => setShowUpdateModal(true)}
            loading={isLoading === "updateMerkleRoot"}
            icon={<PencilSquareIcon className="h-4 w-4" />}
            label="Update Merkle Root"
            variant="primary"
          />
        )}

        {/* Status messages when no actions available */}
        {!canEnd && !canSettle && !isSettled && (
          <div className="text-white/50 text-sm space-y-1">
            {!isOnChain && gameStatus === "SCHEDULED" && (
              <p className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Game was not created on-chain. This may indicate an error during
                creation.
              </p>
            )}
            {isOnChain && gameStatus === "SCHEDULED" && (
              <p>
                Game is registered on-chain. Waiting for game to go live and
                end.
              </p>
            )}
            {isOnChain && gameStatus === "LIVE" && (
              <p>
                Game is live. Settlement actions will be available after the
                game ends.
              </p>
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
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/50 text-sm">Merkle Root</p>
            {canUpdateMerkleRoot && (
              <span className="text-xs text-[#FFC931] bg-[#FFC931]/10 px-2 py-0.5 rounded">
                Editable (0 claims)
              </span>
            )}
          </div>
          <code className="text-xs text-[#00CFF2] break-all">
            {onChainStatus.merkleRoot}
          </code>
        </div>
      )}

      {/* Update Merkle Root Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 max-w-lg w-full mx-4 space-y-4">
            <h3 className="text-xl font-bold text-white font-display">
              Update Merkle Root
            </h3>
            <p className="text-white/60 text-sm">
              Enter the new Merkle root to replace the current one. This is only
              possible because no claims have been made yet.
            </p>

            <div>
              <label className="block text-white/50 text-sm mb-2">
                Current Root
              </label>
              <code className="block text-xs text-[#00CFF2]/50 break-all p-2 bg-white/5 rounded">
                {onChainStatus?.merkleRoot}
              </code>
            </div>

            <div>
              <label className="block text-white/50 text-sm mb-2">
                New Merkle Root
              </label>
              <input
                type="text"
                value={newMerkleRoot}
                onChange={(e) => setNewMerkleRoot(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFC931]/50 font-mono text-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setNewMerkleRoot("");
                }}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  executeSettlement("updateMerkleRoot", { newMerkleRoot })
                }
                disabled={
                  !newMerkleRoot.startsWith("0x") ||
                  newMerkleRoot.length !== 66 ||
                  isLoading === "updateMerkleRoot"
                }
                className="flex-1 px-4 py-3 bg-[#FFC931] hover:bg-[#FFD966] rounded-xl text-black font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading === "updateMerkleRoot" ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  "Update Root"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Game Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="relative bg-linear-to-br from-[#0F0F15] to-[#0a0a0d] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#FFC931]/10 rounded-full blur-3xl" />

            <div className="relative space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFC931]/10 border border-[#FFC931]/20 flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-display">
                    End Game On-Chain
                  </h3>
                  <p className="text-white/40 text-sm">Irreversible action</p>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 bg-white/3 rounded-2xl border border-white/6 space-y-3">
                <p className="text-white/60 text-sm">This will:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#FFC931]/20 flex items-center justify-center text-xs">✓</span>
                    <span className="text-white/70">Mark game as ended on-chain</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#FFC931]/20 flex items-center justify-center text-xs">✓</span>
                    <span className="text-white/70">Prevent new ticket purchases</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#FFC931]/20 flex items-center justify-center text-xs">✓</span>
                    <span className="text-white/70">Enable settlement to proceed</span>
                  </div>
                </div>
              </div>

              {/* Confirm Input */}
              <div>
                <label className="block text-white/50 text-sm mb-2 font-medium">
                  Type <code className="px-1.5 py-0.5 bg-[#FFC931]/10 rounded text-[#FFC931] font-mono">END</code> to confirm
                </label>
                <input
                  type="text"
                  value={endConfirmText}
                  onChange={(e) => setEndConfirmText(e.target.value.toUpperCase())}
                  placeholder="END"
                  className="w-full px-4 py-3.5 bg-white/3 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFC931]/50 focus:ring-2 focus:ring-[#FFC931]/10 font-mono text-center text-xl tracking-widest transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEndConfirm(false);
                    setEndConfirmText("");
                  }}
                  className="flex-1 px-5 py-3.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white font-medium transition-all border border-white/8 hover:border-white/15"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowEndConfirm(false);
                    setEndConfirmText("");
                    executeSettlement("end");
                  }}
                  disabled={endConfirmText !== "END" || isLoading === "end"}
                  className="flex-1 px-5 py-3.5 bg-[#FFC931] hover:bg-[#FFD966] rounded-xl text-black font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#FFC931]/20"
                >
                  {isLoading === "end" ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "End Game"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settle Confirmation Modal */}
      {showSettleConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="relative bg-linear-to-br from-[#0F0F15] to-[#0a0a0d] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#14B985]/10 rounded-full blur-3xl" />

            <div className="relative space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#14B985]/10 border border-[#14B985]/20 flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-display">
                    Confirm Settlement
                  </h3>
                  <p className="text-white/40 text-sm">Submit Merkle root on-chain</p>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 bg-white/3 rounded-2xl border border-white/6 space-y-3">
                <p className="text-white/60 text-sm">This will:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#14B985]/20 flex items-center justify-center text-xs text-[#14B985]">✓</span>
                    <span className="text-white/70">Lock winner data permanently</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#14B985]/20 flex items-center justify-center text-xs text-[#14B985]">✓</span>
                    <span className="text-white/70">Enable winners to claim prizes</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#FFC931]/20 flex items-center justify-center text-xs">⚠</span>
                    <span className="text-[#FFC931]/80">Cannot be undone once claims start</span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <p className="text-white/40 text-xs text-center">
                Make sure you have reviewed the game results before proceeding.
              </p>

              {/* Confirm Input */}
              <div>
                <label className="block text-white/50 text-sm mb-2 font-medium">
                  Type <code className="px-1.5 py-0.5 bg-[#14B985]/10 rounded text-[#14B985] font-mono">SETTLE</code> to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="SETTLE"
                  className="w-full px-4 py-3.5 bg-white/3 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#14B985]/50 focus:ring-2 focus:ring-[#14B985]/10 font-mono text-center text-xl tracking-widest transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSettleConfirm(false);
                    setConfirmText("");
                  }}
                  className="flex-1 px-5 py-3.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white font-medium transition-all border border-white/8 hover:border-white/15"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSettleConfirm(false);
                    setConfirmText("");
                    executeSettlement("settle");
                  }}
                  disabled={confirmText !== "SETTLE" || isLoading === "settle"}
                  className="flex-1 px-5 py-3.5 bg-[#14B985] hover:bg-[#1BF5B0] rounded-xl text-black font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#14B985]/20"
                >
                  {isLoading === "settle" ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "Settle Game"
                  )}
                </button>
              </div>
            </div>
          </div>
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

