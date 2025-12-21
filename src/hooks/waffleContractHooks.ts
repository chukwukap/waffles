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
export function useGetGame(onchainId: `0x${string}` | undefined) {
  return useReadContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "getGame",
    args: onchainId ? [onchainId] : undefined,
    chainId: WAFFLE_GAME_CONFIG.chainId,
    query: {
      enabled: !!onchainId,
    },
  });
}

/**
 * Hook to get the payment token address from the WaffleGame contract
 * This prevents mismatch between hardcoded config and actual contract token
 */
export function useContractToken() {
  return useReadContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "token",
    chainId: WAFFLE_GAME_CONFIG.chainId,
  });
}

/**
 * Hook to check if a user has a ticket for a game
 */
export function useHasTicket(
  onchainId: `0x${string}` | undefined,
  playerAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "hasTicket",
    args: onchainId && playerAddress ? [onchainId, playerAddress] : undefined,
    chainId: WAFFLE_GAME_CONFIG.chainId,
    query: {
      enabled: !!onchainId && !!playerAddress,
    },
  });
}

/**
 * Hook to check if a user has claimed their prize
 */
export function useHasClaimed(
  onchainId: `0x${string}` | undefined,
  playerAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "hasClaimed",
    args: onchainId && playerAddress ? [onchainId, playerAddress] : undefined,
    chainId: WAFFLE_GAME_CONFIG.chainId,
    query: {
      enabled: !!onchainId && !!playerAddress,
    },
  });
}

/**
 * Hook to get the user's token balance
 * @param address - User's wallet address
 * @param tokenAddress - Optional custom token address (defaults to TOKEN_CONFIG.address)
 */
export function useTokenBalance(
  address: `0x${string}` | undefined,
  tokenAddress?: `0x${string}`
) {
  const token = tokenAddress || TOKEN_CONFIG.address;
  return useReadContract({
    address: token,
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
 * @param ownerAddress - User's wallet address
 * @param tokenAddress - Optional custom token address (defaults to TOKEN_CONFIG.address)
 */
export function useTokenAllowance(
  ownerAddress: `0x${string}` | undefined,
  tokenAddress?: `0x${string}`
) {
  const token = tokenAddress || TOKEN_CONFIG.address;
  return useReadContract({
    address: token,
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

  const buyTicket = (onchainId: `0x${string}`, amount: string) => {
    const amountInUnits = parseUnits(amount, TOKEN_CONFIG.decimals);
    writeContract({
      address: WAFFLE_GAME_CONFIG.address,
      abi: waffleGameAbi,
      functionName: "buyTicket",
      args: [onchainId, amountInUnits],
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
    onchainId: `0x${string}`,
    amount: bigint,
    proof: `0x${string}`[]
  ) => {
    writeContract({
      address: WAFFLE_GAME_CONFIG.address,
      abi: waffleGameAbi,
      functionName: "claimPrize",
      args: [onchainId, amount, proof],
      chainId: WAFFLE_GAME_CONFIG.chainId,
    });
  };

  return { claimPrize, hash, isPending, isConfirming, isSuccess, error };
}

// ============================================================================
// ERC20 Permit Flow (One-Click Ticket Purchase)
// ============================================================================

// ERC20 Permit ABI for nonces
const erc20PermitAbi = [
  ...erc20Abi,
  {
    type: "function",
    name: "nonces",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
] as const;

/**
 * Hook to get the user's permit nonce for USDC
 */
export function usePermitNonce(address: `0x${string}` | undefined) {
  return useReadContract({
    address: TOKEN_CONFIG.address,
    abi: erc20PermitAbi,
    functionName: "nonces",
    args: address ? [address] : undefined,
    chainId: TOKEN_CONFIG.chainId,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * USDC Permit domain for EIP-712 signing
 * Base USDC uses name="USDC" and version="2"
 * Reference: https://github.com/circlefin/stablecoin-evm
 */
export const USDC_PERMIT_DOMAIN = {
  name: "USD Coin",
  version: "2",
  chainId: TOKEN_CONFIG.chainId,
  verifyingContract: TOKEN_CONFIG.address,
} as const;

/**
 * EIP-712 types for ERC20 Permit
 */
export const PERMIT_TYPES = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

/**
 * Hook to buy a ticket using ERC20 Permit (one-click purchase)
 *
 * Flow:
 * 1. Sign permit off-chain (no gas)
 * 2. Submit buyTicketWithPermit transaction (permit + buy in one tx)
 */
export function useBuyTicketWithPermit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Buy ticket with permit signature
   * @param onchainId - bytes32 Game ID to join
   * @param amount - Amount in human-readable format (e.g., "5" for $5)
   * @param deadline - Permit deadline (timestamp)
   * @param signature - Signed permit (v, r, s from signTypedData)
   */
  const buyWithPermit = (
    onchainId: `0x${string}`,
    amount: string,
    deadline: bigint,
    v: number,
    r: `0x${string}`,
    s: `0x${string}`
  ) => {
    const amountInUnits = parseUnits(amount, TOKEN_CONFIG.decimals);
    writeContract({
      address: WAFFLE_GAME_CONFIG.address,
      abi: waffleGameAbi,
      functionName: "buyTicketWithPermit",
      args: [onchainId, amountInUnits, deadline, v, r, s],
      chainId: WAFFLE_GAME_CONFIG.chainId,
    });
  };

  return { buyWithPermit, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Helper to split an EIP-712 signature into v, r, s components
 */
export function splitSignature(signature: `0x${string}`): {
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
} {
  const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
  const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
  const v = parseInt(signature.slice(130, 132), 16);

  // Handle EIP-155 style recovery id
  return { r, s, v: v < 27 ? v + 27 : v };
}
