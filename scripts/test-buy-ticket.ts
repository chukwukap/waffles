/**
 * Test Script: Buy Ticket Directly
 *
 * Usage:
 *   PRIVATE_KEY=0x... npx tsx scripts/test-buy-ticket.ts <onchainId>
 *
 * This bypasses the frontend to test the contract directly.
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  encodeFunctionData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// Contract addresses (Base Sepolia testnet)
const WAFFLE_GAME_ADDRESS = "0xb4De98e6290142626F00A3371D5Ea2cD5B01A0A3";
// TestUSDC with faucet function (contract updated to use this token)
const USDC_ADDRESS = "0x8aAa7ECea87244Ca4062eBce6DA61820f3830233";

// ABIs (minimal)
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
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

const waffleGameAbi = [
  {
    type: "function",
    name: "buyTicket",
    inputs: [
      { name: "gameId", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getGame",
    inputs: [{ name: "gameId", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "entryFee", type: "uint256" },
          { name: "ticketCount", type: "uint256" },
          { name: "merkleRoot", type: "bytes32" },
          { name: "settledAt", type: "uint256" },
          { name: "ended", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasTicket",
    inputs: [
      { name: "gameId", type: "bytes32" },
      { name: "player", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;

async function main() {
  // Get private key from environment
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY environment variable not set");
    console.log(
      "Usage: PRIVATE_KEY=0x... npx tsx scripts/test-buy-ticket.ts <onchainId>"
    );
    process.exit(1);
  }

  // Get onchainId from command line
  const onchainId = process.argv[2] as `0x${string}`;
  if (!onchainId || !onchainId.startsWith("0x")) {
    console.error("❌ Please provide onchainId as command line argument");
    console.log(
      "Usage: PRIVATE_KEY=0x... npx tsx scripts/test-buy-ticket.ts 0x..."
    );
    process.exit(1);
  }

  // Create account from private key
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  console.log("👤 Wallet address:", account.address);

  // Create clients
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  });

  // Test amount (2 USDC - tier 1 price)
  const amount = parseUnits("2", 6); // 2 USDC
  console.log("💰 Amount:", amount.toString(), "(2 USDC)");
  console.log("🎮 Game ID:", onchainId);

  try {
    // 1. Check game exists
    console.log("\n📋 Step 1: Check game exists on-chain...");
    const game = await publicClient.readContract({
      address: WAFFLE_GAME_ADDRESS,
      abi: waffleGameAbi,
      functionName: "getGame",
      args: [onchainId],
    });
    console.log("Game data:", {
      entryFee: game.entryFee.toString(),
      ticketCount: game.ticketCount.toString(),
      merkleRoot: game.merkleRoot,
      ended: game.ended,
    });

    if (game.entryFee === BigInt(0)) {
      console.error("❌ Game does not exist on-chain (entryFee is 0)");
      process.exit(1);
    }

    if (game.ended) {
      console.error("❌ Game has ended, cannot buy tickets");
      process.exit(1);
    }

    // 2. Check if already has ticket
    console.log("\n📋 Step 2: Check if already has ticket...");
    const hasTicket = await publicClient.readContract({
      address: WAFFLE_GAME_ADDRESS,
      abi: waffleGameAbi,
      functionName: "hasTicket",
      args: [onchainId, account.address],
    });
    console.log("Has ticket:", hasTicket);

    if (hasTicket) {
      console.error("❌ Already has a ticket for this game");
      process.exit(1);
    }

    // 3. Check USDC balance
    console.log("\n📋 Step 3: Check USDC balance...");
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account.address],
    });
    console.log(
      "USDC balance:",
      balance.toString(),
      `(${Number(balance / BigInt(1000000))} USDC)`
    );

    if (balance < amount) {
      console.error("❌ Insufficient USDC balance");
      process.exit(1);
    }

    // 4. Check current allowance
    console.log("\n📋 Step 4: Check current allowance...");
    const allowance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "allowance",
      args: [account.address, WAFFLE_GAME_ADDRESS],
    });
    console.log("Current allowance:", allowance.toString());

    // 5. Approve if needed
    if (allowance < amount) {
      console.log("\n📋 Step 5: Approving USDC...");
      const approveHash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [WAFFLE_GAME_ADDRESS, amount * BigInt(100)], // Approve 100x for future txs
      });
      console.log("Approve TX:", approveHash);

      console.log("Waiting for approval confirmation...");
      const approveReceipt = await publicClient.waitForTransactionReceipt({
        hash: approveHash,
      });
      console.log("Approval confirmed:", approveReceipt.status);
    } else {
      console.log("✅ Sufficient allowance, skipping approval");
    }

    // 6. Buy ticket
    console.log("\n📋 Step 6: Buying ticket...");
    const buyHash = await walletClient.writeContract({
      address: WAFFLE_GAME_ADDRESS,
      abi: waffleGameAbi,
      functionName: "buyTicket",
      args: [onchainId, amount],
    });
    console.log("Buy TX:", buyHash);

    console.log("Waiting for buy confirmation...");
    const buyReceipt = await publicClient.waitForTransactionReceipt({
      hash: buyHash,
    });
    console.log("Buy confirmed:", buyReceipt.status);

    if (buyReceipt.status === "success") {
      console.log("\n✅ SUCCESS! Ticket purchased!");
      console.log("Transaction hash:", buyHash);
      console.log(
        `View on explorer: https://sepolia.basescan.org/tx/${buyHash}`
      );
    } else {
      console.log("\n❌ Transaction reverted");
    }
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);

    // Try to get more details
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
    if (error.shortMessage) {
      console.error("Short message:", error.shortMessage);
    }
    if (error.metaMessages) {
      console.error("Meta messages:", error.metaMessages);
    }
  }
}

main();
