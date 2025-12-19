"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
    useAccount,
    useConnect,
    useDisconnect,
    useWriteContract,
    useSwitchChain,
    useWaitForTransactionReceipt,
    WagmiProvider,
    createConfig,
    http,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet, injected, metaMask } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { formatUnits } from "viem";

import { useTokenBalance } from "@/hooks/waffleContractHooks";
import { TOKEN_CONFIG, CHAIN_CONFIG } from "@/lib/contracts/config";
import GlobalToaster, { notify } from "@/components/ui/Toaster";

// Create wagmi config for standalone use (not MiniKit)
const wagmiConfig = createConfig({
    chains: [baseSepolia],
    connectors: [
        injected(),
        coinbaseWallet({ appName: "Waffles Faucet" }),
        metaMask(),
    ],
    transports: {
        [baseSepolia.id]: http(),
    },
});

const queryClient = new QueryClient();

// TestUSDC ABI for faucet function
const testUsdcAbi = [
    {
        type: "function",
        name: "faucet",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable",
    },
] as const;

// ==========================================
// FAUCET CONTENT COMPONENT
// ==========================================

function FaucetContent() {
    const { address, isConnected, chainId: currentChainId } = useAccount();
    const { connect, connectors, isPending: isConnecting } = useConnect();
    const { disconnect } = useDisconnect();
    const { switchChain, isPending: isSwitching } = useSwitchChain();
    const { data: balance, refetch: refetchBalance } = useTokenBalance(address);
    const [showWallets, setShowWallets] = useState(false);

    // Format balance for display
    const formattedBalance = useMemo(() => {
        if (balance === undefined) return "0.00";
        return formatUnits(balance, TOKEN_CONFIG.decimals);
    }, [balance]);

    // Faucet transaction
    const {
        writeContract,
        data: txHash,
        isPending: isWriting,
        error: writeError,
        reset,
    } = useWriteContract();

    console.log("txHash", txHash);
    console.log("error", writeError);
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    // Handle faucet click
    const handleClaimFaucet = useCallback(async () => {
        reset();

        // Check if on correct chain
        if (currentChainId !== CHAIN_CONFIG.chainId) {
            console.log(`[Faucet] Switching to chain ${CHAIN_CONFIG.chainId}...`);
            try {
                await switchChain({ chainId: CHAIN_CONFIG.chainId });
                notify.info("Switching to Base Sepolia. Please click claim again.");
                return;
            } catch (err) {
                console.error("[Faucet] Switch chain error:", err);
                notify.error("Could not switch to Base Sepolia");
                return;
            }
        }

        console.log("[Faucet] Sending faucet transaction...");
        writeContract({
            address: TOKEN_CONFIG.address as `0x${string}`,
            abi: testUsdcAbi,
            functionName: "faucet",
            chainId: CHAIN_CONFIG.chainId,
            chain: baseSepolia, // Explicitly pass chain object to avoid "undefined" error
        });
    }, [writeContract, reset, currentChainId, switchChain]);

    // Handle success
    useMemo(() => {
        if (isSuccess && txHash) {
            notify.success("Claimed 10 USDC! 🎉");
            setTimeout(() => refetchBalance(), 2000);
        }
    }, [isSuccess, txHash, refetchBalance]);

    // Wallet selection modal
    const WalletModal = () => (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-sm border border-white/10">
                <h2 className="text-xl font-bold text-white mb-4 text-center">
                    Connect Wallet
                </h2>
                <div className="space-y-3">
                    {connectors.map((connector) => (
                        <button
                            key={connector.id}
                            onClick={() => {
                                connect({ connector });
                                setShowWallets(false);
                            }}
                            disabled={isConnecting}
                            className="w-full h-14 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                        >
                            {connector.name}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowWallets(false)}
                    className="w-full mt-4 text-gray-500 text-sm hover:text-gray-400"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
            {/* Wallet Modal */}
            {showWallets && <WalletModal />}

            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">
                    🧇 TEST USDC FAUCET
                </h1>
                <p className="text-gray-400 text-sm">
                    Claim free test USDC to play Waffles on Base Sepolia
                </p>
            </div>

            {/* Connected Wallet Info */}
            {isConnected && address && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 mb-4 flex items-center gap-3">
                    <span className="text-gray-400 text-sm">
                        {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                    <button
                        onClick={() => disconnect()}
                        className="text-red-400 text-xs hover:text-red-300"
                    >
                        Disconnect
                    </button>
                </div>
            )}

            {/* Balance Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-sm mb-6 text-center">
                <p className="text-gray-400 text-sm mb-1">Your Balance</p>
                <p className="text-3xl font-bold text-white">
                    ${formattedBalance} USDC
                </p>
            </div>

            {/* Faucet Button */}
            <div className="w-full max-w-sm mb-6">
                {!isConnected ? (
                    <button
                        onClick={() => setShowWallets(true)}
                        className="w-full h-14 px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg rounded-xl transition-colors"
                    >
                        CONNECT WALLET
                    </button>
                ) : (
                    <button
                        onClick={handleClaimFaucet}
                        disabled={isWriting || isConfirming}
                        className="w-full h-14 px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isWriting
                            ? "CONFIRM IN WALLET..."
                            : isConfirming
                                ? "CONFIRMING..."
                                : isSuccess
                                    ? "CLAIMED! ✓"
                                    : "CLAIM 10 USDC"}
                    </button>
                )}

                {/* Transaction status */}
                {txHash && (
                    <p className="text-center text-xs text-gray-500 mt-2">
                        TX:{" "}
                        <a
                            href={`${CHAIN_CONFIG.explorerUrl}/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline"
                        >
                            {txHash.slice(0, 10)}...
                        </a>
                    </p>
                )}

                {/* Error */}
                {writeError && (
                    <p className="text-center text-xs text-red-400 mt-2">
                        {writeError.message.includes("rejected")
                            ? "Transaction rejected"
                            : "Transaction failed"}
                    </p>
                )}
            </div>

            {/* Info */}
            <p className="text-gray-500 text-xs text-center max-w-xs mb-6">
                This is testnet USDC on Base Sepolia. Claim as many times as you want
                for testing.
            </p>

            {/* Contract Info */}
            <div className="text-gray-600 text-xs text-center">
                <p>Token: {TOKEN_CONFIG.address}</p>
                <p>Network: {CHAIN_CONFIG.name}</p>
            </div>

            {/* Back Link */}
            <Link href="/" className="mt-8 text-cyan-400 text-sm hover:underline">
                ← Back to Waffles
            </Link>
        </div>
    );
}

// ==========================================
// WRAPPER WITH STANDALONE WAGMI PROVIDER
// ==========================================

export default function FaucetPage() {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <FaucetContent />
                <GlobalToaster />
            </QueryClientProvider>
        </WagmiProvider>
    );
}
