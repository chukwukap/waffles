"use client";

import { UsersIcon } from "@/components/icons";
import { useGameStore, selectOnlineCount } from "@/lib/game-store";

// ==========================================
// TYPES
// ==========================================

interface ChatInputBarProps {
    onOpen: () => void;
}

// ==========================================
// COMPONENT
// ==========================================

/**
 * ChatInputBar - Trigger button to open chat drawer
 * 
 * Shows active count on left and "Type..." placeholder button.
 * Clicking anywhere opens the ChatDrawer.
 */
export function ChatInputBar({ onOpen }: ChatInputBarProps) {
    const activeCount = useGameStore(selectOnlineCount);

    return (
        <div className="flex items-center gap-3">
            {/* Active count on left */}
            <div className="flex items-center gap-1.5 shrink-0" role="status" aria-live="polite">
                <UsersIcon className="w-4 h-[13.5px] text-[#B93814]" aria-hidden="true" />
                <span className="text-[#B93814] text-sm font-medium font-body">
                    {activeCount}
                </span>
            </div>

            {/* Trigger button - opens drawer */}
            <button
                onClick={onOpen}
                className="flex-1 flex h-[46px] items-center gap-3 rounded-full bg-white/5 px-4 hover:bg-white/[0.07] transition-all"
                aria-label="Open chat"
            >
                <span
                    className="flex-1 font-display text-sm font-medium text-white/40 text-left"
                    style={{ letterSpacing: "-0.03em" }}
                >
                    Type...
                </span>
            </button>
        </div>
    );
}

export default ChatInputBar;
