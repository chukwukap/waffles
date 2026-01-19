"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import {
    ArrowRightEndOnRectangleIcon,
    WalletIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
import { useCorrectChain } from "@/hooks/useCorrectChain";
import { chain as targetChain } from "@/lib/chain";

interface AdminHeaderProps {
    username: string;
    pfpUrl: string | null;
}

export function AdminHeader({ username, pfpUrl }: AdminHeaderProps) {
    const { isConnected, address, chain } = useAccount();
    const { connect, isPending: isConnecting } = useConnect();
    const { disconnect } = useDisconnect();
    const { ensureCorrectChain, isOnCorrectChain } = useCorrectChain();

    const handleSwitchChain = async () => {
        try {
            await ensureCorrectChain();
        } catch (err) {
            console.error("Failed to switch chain:", err);
        }
    };

    return (
        <header className="bg-[#0a0a0b]/80 border-b border-white/6 backdrop-blur-xl flex h-16 items-center justify-between px-6">
            {/* Left: Title */}
            <h2 className="text-lg font-semibold text-white font-body">
                Admin Dashboard
            </h2>

            {/* Right: Wallet + User */}
            <div className="flex items-center gap-3">
                {/* Wallet Section */}
                {isConnected ? (
                    <div className="flex items-center gap-1.5">
                        {/* Chain indicator */}
                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs ${isOnCorrectChain
                            ? "bg-[#14B985]/10 text-[#14B985]"
                            : "bg-amber-500/10 text-amber-400"
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isOnCorrectChain ? "bg-[#14B985]" : "bg-amber-400"
                                }`} />
                            <span className="font-medium">{chain?.name || "Unknown"}</span>
                            <span className="text-white/30">·</span>
                            <span className="text-white/50 font-mono">
                                {address?.slice(0, 4)}...{address?.slice(-3)}
                            </span>
                        </div>

                        {/* Switch chain button (shows when on wrong chain) */}
                        {!isOnCorrectChain && (
                            <button
                                onClick={handleSwitchChain}
                                className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-xs font-medium text-amber-400 transition-colors"
                                title={`Switch to ${targetChain.name}`}
                            >
                                <ArrowPathIcon className="h-3 w-3" />
                                Switch
                            </button>
                        )}

                        <button
                            onClick={() => disconnect()}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Disconnect"
                        >
                            <ArrowRightEndOnRectangleIcon className="h-4 w-4 text-white/40 hover:text-red-400" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => connect({ connector: injected() })}
                        disabled={isConnecting}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFC931]/10 hover:bg-[#FFC931]/20 rounded-lg text-xs font-medium text-[#FFC931] transition-colors disabled:opacity-50"
                    >
                        <WalletIcon className="h-3.5 w-3.5" />
                        {isConnecting ? "Connecting..." : "Connect"}
                    </button>
                )}

                {/* Divider */}
                <div className="w-px h-6 bg-white/10" />

                {/* User Section */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">
                        {username}
                    </span>
                    {pfpUrl ? (
                        <img
                            src={pfpUrl}
                            alt={username}
                            className="h-7 w-7 rounded-full ring-1 ring-white/10 object-cover"
                        />
                    ) : (
                        <div className="h-7 w-7 rounded-full bg-linear-to-br from-[#FFC931] to-[#00CFF2] flex items-center justify-center text-black font-bold text-xs ring-1 ring-white/10">
                            {username?.[0]?.toUpperCase() || "A"}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
