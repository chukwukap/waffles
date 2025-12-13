import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { WAFFLE_GAME_CONFIG, TOKEN_CONFIG } from "@/lib/contracts/config";
import waffleGameAbi from "@/lib/contracts/WaffleGameAbi.json";

// ERC20 ABI for approve
const erc20Abi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

/**
 * Hook to read game data from the contract
 */
export function useGetGame(gameId: bigint | undefined) {
  return useReadContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "getGame",
    args: gameId ? [gameId] : undefined,
    chainId: WAFFLE_GAME_CONFIG.chainId,
    query: {
      enabled: !!gameId,
    },
  });
}

/**
 * Hook to check if a user has a ticket for a game
 */
export function useHasTicket(
  gameId: bigint | undefined,
  playerAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "hasTicket",
    args: gameId && playerAddress ? [gameId, playerAddress] : undefined,
    chainId: WAFFLE_GAME_CONFIG.chainId,
    query: {
      enabled: !!gameId && !!playerAddress,
    },
  });
}

/**
 * Hook to check if a user has claimed their prize
 */
export function useHasClaimed(
  gameId: bigint | undefined,
  playerAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "hasClaimed",
    args: gameId && playerAddress ? [gameId, playerAddress] : undefined,
    chainId: WAFFLE_GAME_CONFIG.chainId,
    query: {
      enabled: !!gameId && !!playerAddress,
    },
  });
}

/**
 * Hook to get the user's token balance
 */
export function useTokenBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: TOKEN_CONFIG.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: TOKEN_CONFIG.chainId,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Hook to get the user's token allowance for WaffleGame
 */
export function useTokenAllowance(ownerAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: TOKEN_CONFIG.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: ownerAddress ? [ownerAddress, WAFFLE_GAME_CONFIG.address] : undefined,
    chainId: TOKEN_CONFIG.chainId,
    query: {
      enabled: !!ownerAddress,
    },
  });
}

/**
 * Hook to approve tokens for WaffleGame contract
 */
export function useApproveToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = (amount: string) => {
    const amountInUnits = parseUnits(amount, TOKEN_CONFIG.decimals);
    writeContract({
      address: TOKEN_CONFIG.address,
      abi: erc20Abi,
      functionName: "approve",
      args: [WAFFLE_GAME_CONFIG.address, amountInUnits],
      chainId: TOKEN_CONFIG.chainId,
    });
  };

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Hook to buy a ticket for a game
 */
export function useBuyTicket() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buyTicket = (gameId: bigint, amount: string) => {
    const amountInUnits = parseUnits(amount, TOKEN_CONFIG.decimals);
    writeContract({
      address: WAFFLE_GAME_CONFIG.address,
      abi: waffleGameAbi,
      functionName: "buyTicket",
      args: [gameId, amountInUnits],
      chainId: WAFFLE_GAME_CONFIG.chainId,
    });
  };

  return { buyTicket, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Hook to claim a prize using a Merkle proof
 */
export function useClaimPrize() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimPrize = (
    gameId: bigint,
    amount: bigint,
    proof: `0x${string}`[]
  ) => {
    writeContract({
      address: WAFFLE_GAME_CONFIG.address,
      abi: waffleGameAbi,
      functionName: "claimPrize",
      args: [gameId, amount, proof],
      chainId: WAFFLE_GAME_CONFIG.chainId,
    });
  };

  return { claimPrize, hash, isPending, isConfirming, isSuccess, error };
}
