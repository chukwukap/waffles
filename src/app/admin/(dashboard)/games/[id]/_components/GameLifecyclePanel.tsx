"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getExplorerUrl } from "@/lib/contracts/config";
import {
  PlayIcon,
  StopIcon,
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ClockIcon,
  UserGroupIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { ConfirmationModal } from "@/components/admin/ConfirmationModal";

interface GameLifecyclePanelProps {
  gameId: number;
  gameStatus: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
  questionsCount: number;
  playersCount: number;
  prizePool: number;
  onChainStatus: {
    exists: boolean;
    ended: boolean;
    settled: boolean;
    merkleRoot?: string;
  };
}

type LifecycleAction = "start" | "end" | "settle";

// Define the lifecycle stages
const LIFECYCLE_STAGES = [
  { id: "scheduled", label: "Scheduled", icon: ClockIcon },
  { id: "live", label: "Live", icon: PlayIcon },
  { id: "ended", label: "Ended", icon: StopIcon },
  { id: "settled", label: "Settled", icon: TrophyIcon },
];

export function GameLifecyclePanel({
  gameId,
  gameStatus,
  questionsCount,
  playersCount,
  prizePool,
  onChainStatus,
}: GameLifecyclePanelProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<LifecycleAction | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    txHash?: string;
  } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<LifecycleAction | null>(null);

  // Determine current stage index
  const getCurrentStageIndex = () => {
    if (onChainStatus.settled) return 3; // Settled
    if (gameStatus === "ENDED") return 2; // Ended
    if (gameStatus === "LIVE") return 1; // Live
    return 0; // Scheduled
  };

  const currentStageIndex = getCurrentStageIndex();

  // Execute lifecycle action
  const executeAction = async (action: LifecycleAction) => {
    setIsLoading(action);
    setResult(null);

    try {
      const res = await fetch("/api/v1/admin/game-lifecycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, gameId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }

      setResult({
        success: true,
        message: getSuccessMessage(action, data),
        txHash: data.txHash,
      });

      // Refresh the page to show updated status
      router.refresh();
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Action failed",
      });
    } finally {
      setIsLoading(null);
      setShowConfirmation(false);
      setPendingAction(null);
    }
  };

  const getSuccessMessage = (action: LifecycleAction, data: any) => {
    switch (action) {
      case "start":
        return "Game is now LIVE! Players can start joining.";
      case "end":
        return `Game ended successfully. ${data.playersRanked || 0} players ranked.`;
      case "settle":
        return `Prizes distributed! ${data.winnersCount || 0} winners can now claim.`;
      default:
        return "Action completed";
    }
  };

  // Action button configurations
  const getActionConfig = () => {
    // Scheduled → Live
    if (gameStatus === "SCHEDULED" && onChainStatus.exists) {
      return {
        action: "start" as LifecycleAction,
        label: "Go Live",
        description: "Start the game and allow players to join",
        icon: PlayIcon,
        variant: "success" as const,
        disabled: questionsCount === 0,
        disabledReason: questionsCount === 0 ? "Add questions first" : undefined,
        confirmTitle: "Start Game?",
        confirmDescription: "This will make the game live. Players will be able to join and play immediately.",
        previewItems: [
          { label: "Questions", value: `${questionsCount} questions` },
          { label: "Prize Pool", value: `$${prizePool.toLocaleString()} USDC` },
        ],
      };
    }

    // Live → Ended
    if (gameStatus === "LIVE") {
      return {
        action: "end" as LifecycleAction,
        label: "End Game",
        description: "Stop the game, calculate rankings, and end on-chain",
        icon: StopIcon,
        variant: "warning" as const,
        disabled: false,
        confirmTitle: "End Game?",
        confirmDescription: "This will end the game, calculate player rankings, and stop ticket sales on-chain. This action cannot be undone.",
        previewItems: [
          { label: "Players", value: `${playersCount} players` },
          { label: "Prize Pool", value: `$${prizePool.toLocaleString()} USDC` },
        ],
      };
    }

    // Ended → Settled
    if (gameStatus === "ENDED" && !onChainStatus.settled) {
      // Check if on-chain game is ended
      if (!onChainStatus.ended) {
        return {
          action: "end" as LifecycleAction, // Need to end on-chain first
          label: "Sync On-Chain",
          description: "End the game on-chain to enable settlement",
          icon: ArrowPathIcon,
          variant: "warning" as const,
          disabled: false,
          confirmTitle: "Sync On-Chain Status?",
          confirmDescription: "This will end the game on-chain, which stops ticket sales and enables prize distribution.",
          previewItems: [],
        };
      }

      return {
        action: "settle" as LifecycleAction,
        label: "Distribute Prizes",
        description: "Calculate winners and submit to blockchain",
        icon: TrophyIcon,
        variant: "success" as const,
        disabled: playersCount === 0,
        disabledReason: playersCount === 0 ? "No players to settle" : undefined,
        confirmTitle: "Distribute Prizes?",
        confirmDescription: "This will calculate the top 3 winners and submit the prize distribution to the blockchain. Winners can then claim their prizes.",
        previewItems: [
          { label: "Prize Pool", value: `$${prizePool.toLocaleString()} USDC` },
          { label: "Distribution", value: "60% / 30% / 10%" },
        ],
      };
    }

    return null;
  };

  const actionConfig = getActionConfig();

  // Handle action click
  const handleActionClick = (action: LifecycleAction) => {
    setPendingAction(action);
    setShowConfirmation(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-display">
            Game Lifecycle
          </h2>
          <p className="text-sm text-white/50 mt-1">
            Manage your game from start to finish
          </p>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {LIFECYCLE_STAGES.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.id} className="flex flex-col items-center relative z-10">
                {/* Stage Circle */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? "bg-[#14B985] text-white"
                      : isCurrent
                      ? "bg-[#FFC931] text-black ring-4 ring-[#FFC931]/30"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircleIcon className="h-6 w-6" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                {/* Label */}
                <span
                  className={`mt-2 text-sm font-medium ${
                    isCompleted
                      ? "text-[#14B985]"
                      : isCurrent
                      ? "text-[#FFC931]"
                      : "text-white/40"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-white/10 -z-0" />
        <div
          className="absolute top-6 left-6 h-0.5 bg-[#14B985] transition-all duration-500 -z-0"
          style={{
            width: `${(currentStageIndex / (LIFECYCLE_STAGES.length - 1)) * 100}%`,
            maxWidth: "calc(100% - 48px)",
          }}
        />
      </div>

      {/* Current Status Card */}
      <div className="admin-panel p-5">
        <div className="flex items-start gap-4">
          {/* Status Indicator */}
          <div
            className={`p-3 rounded-xl ${
              gameStatus === "LIVE"
                ? "bg-[#14B985]/15"
                : gameStatus === "SCHEDULED"
                ? "bg-[#FFC931]/15"
                : onChainStatus.settled
                ? "bg-[#14B985]/15"
                : "bg-white/10"
            }`}
          >
            {gameStatus === "LIVE" ? (
              <div className="relative">
                <PlayIcon className="h-6 w-6 text-[#14B985]" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#14B985] rounded-full animate-pulse" />
              </div>
            ) : gameStatus === "SCHEDULED" ? (
              <ClockIcon className="h-6 w-6 text-[#FFC931]" />
            ) : onChainStatus.settled ? (
              <TrophyIcon className="h-6 w-6 text-[#14B985]" />
            ) : (
              <StopIcon className="h-6 w-6 text-white/60" />
            )}
          </div>

          {/* Status Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">
                {gameStatus === "LIVE"
                  ? "Game is Live!"
                  : gameStatus === "SCHEDULED"
                  ? "Ready to Launch"
                  : onChainStatus.settled
                  ? "Settlement Complete"
                  : "Game Ended"}
              </h3>
              {gameStatus === "LIVE" && (
                <span className="px-2 py-0.5 text-xs font-bold bg-[#14B985] text-white rounded-full animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-sm text-white/50 mt-1">
              {gameStatus === "LIVE"
                ? "Players are actively participating. End the game when ready."
                : gameStatus === "SCHEDULED"
                ? onChainStatus.exists
                  ? "Game is registered on-chain. Click 'Go Live' to start."
                  : "Game is not on-chain. There may have been an error during creation."
                : onChainStatus.settled
                ? "Winners have been determined and can claim their prizes."
                : "Rankings calculated. Ready to distribute prizes."}
            </p>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm">
                <UserGroupIcon className="h-4 w-4 text-[#00CFF2]" />
                <span className="text-white/70">{playersCount} players</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <BanknotesIcon className="h-4 w-4 text-[#14B985]" />
                <span className="text-white/70">${prizePool.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {actionConfig && (
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => handleActionClick(actionConfig.action)}
                disabled={isLoading !== null || actionConfig.disabled}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionConfig.variant === "success"
                    ? "bg-[#14B985] hover:bg-[#1BF5B0] text-black shadow-lg shadow-[#14B985]/20"
                    : actionConfig.variant === "warning"
                    ? "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20"
                    : "bg-[#FFC931] hover:bg-[#FFD966] text-black shadow-lg shadow-[#FFC931]/20"
                }`}
              >
                {isLoading === actionConfig.action ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <actionConfig.icon className="h-5 w-5" />
                )}
                {actionConfig.label}
                <ArrowRightIcon className="h-4 w-4" />
              </button>
              {actionConfig.disabledReason && (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-3 w-3" />
                  {actionConfig.disabledReason}
                </span>
              )}
            </div>
          )}

          {/* Settled State */}
          {onChainStatus.settled && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#14B985]/20 text-[#14B985] rounded-xl">
              <CheckCircleIcon className="h-5 w-5" />
              <span className="font-medium">Complete</span>
            </div>
          )}
        </div>
      </div>

      {/* On-Chain Status Badges */}
      <div className="flex flex-wrap gap-3">
        <StatusBadge
          label="On-Chain"
          active={onChainStatus.exists}
          description={onChainStatus.exists ? "Registered" : "Not registered"}
        />
        <StatusBadge
          label="Ticket Sales"
          active={onChainStatus.exists && !onChainStatus.ended}
          inactive={onChainStatus.ended}
          description={
            !onChainStatus.exists
              ? "N/A"
              : onChainStatus.ended
              ? "Closed"
              : "Open"
          }
        />
        <StatusBadge
          label="Prizes"
          active={onChainStatus.settled}
          description={onChainStatus.settled ? "Distributed" : "Pending"}
        />
      </div>

      {/* Result Message */}
      {result && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border animate-in slide-in-from-top-2 duration-300 ${
            result.success
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
      {onChainStatus.merkleRoot && (
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-white/50 text-sm mb-1">Merkle Root (Prize Distribution)</p>
          <code className="text-xs text-[#00CFF2] break-all font-mono">
            {onChainStatus.merkleRoot}
          </code>
        </div>
      )}

      {/* Confirmation Modal */}
      {actionConfig && (
        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={() => {
            if (!isLoading) {
              setShowConfirmation(false);
              setPendingAction(null);
            }
          }}
          onConfirm={() => pendingAction && executeAction(pendingAction)}
          title={actionConfig.confirmTitle}
          description={actionConfig.confirmDescription}
          confirmText={actionConfig.label}
          cancelText="Cancel"
          variant={actionConfig.variant === "warning" ? "warning" : "success"}
          isLoading={isLoading !== null}
          previewItems={actionConfig.previewItems}
        />
      )}
    </div>
  );
}

// Helper Components
function StatusBadge({
  label,
  active,
  inactive,
  description,
}: {
  label: string;
  active?: boolean;
  inactive?: boolean;
  description: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${
        active
          ? "bg-[#14B985]/10 border-[#14B985]/30"
          : inactive
          ? "bg-white/5 border-white/10"
          : "bg-white/5 border-white/10"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          active ? "bg-[#14B985]" : inactive ? "bg-white/30" : "bg-white/30"
        }`}
      />
      <div>
        <div className="text-xs text-white/50">{label}</div>
        <div
          className={`text-sm font-medium ${
            active ? "text-[#14B985]" : "text-white/70"
          }`}
        >
          {description}
        </div>
      </div>
    </div>
  );
}

