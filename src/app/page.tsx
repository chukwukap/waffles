"use client";

import { useAccount, useConnect } from "wagmi";

import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";
import Image from "next/image";
import { wagmiConfig } from "@/lib/wagmiConfig";

export default function Home() {
  const { connect } = useConnect();
  const { address, isConnected } = useAccount();
  const { fid, username, pfpUrl, walletAddress, setWallet } = useAuthStore();

  useEffect(() => {
    if (isConnected && address) setWallet(address);
  }, [isConnected, address, setWallet]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-4">Waffles Mini-App</h1>

      {fid ? (
        <div className="flex flex-col items-center">
          <Image
            src={pfpUrl || "/images/avatars/a.png"}
            alt={username}
            className="w-16 h-16 rounded-full mb-2"
            width={64}
            height={64}
          />
          <p className="text-lg">@{username}</p>
          <p className="text-sm text-gray-400">FID: {fid}</p>
        </div>
      ) : (
        <p className="text-gray-400">Loading Farcaster context...</p>
      )}

      {!isConnected ? (
        <button
          onClick={() => connect({ connector: wagmiConfig.connectors[0] })}
          className="mt-6 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Connect Base Wallet
        </button>
      ) : (
        <p className="mt-6 text-green-400">Wallet connected: {walletAddress}</p>
      )}
    </main>
  );
}
