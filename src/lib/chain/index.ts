/**
 * Chain Module - Unified Exports
 * Import everything from @/lib/chain
 */

// Configuration
export {
  CHAIN_CONFIG,
  TOKEN_CONFIG,
  TOKEN_DECIMALS,
  WAFFLE_GAME_CONFIG,
  DEFAULT_USDC_ADDRESS,
  DEFAULT_WAFFLE_GAME_ADDRESS,
  getExplorerUrl,
} from "./config";

// Clients
export { publicClient, getAdminWallet, getWalletClient } from "./client";

// Game operations
export {
  generateOnchainGameId,
  createGameOnChain,
  endGameOnChain,
  getOnChainGame,
  hasTicketOnChain,
  hasClaimedOnChain,
  type OnChainGame,
} from "./game";

// Settlement - NOT exported here because it's server-only (uses Prisma)
// Import directly from "@/lib/chain/settlement" in server components/actions

// Merkle tree
export {
  buildMerkleTree,
  generateMerkleProof,
  verifyMerkleProof,
  type Winner,
  type MerkleTreeResult,
} from "./merkle";
