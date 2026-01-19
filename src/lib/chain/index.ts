/**
 * Chain Module - Unified Exports
 * Import everything from @/lib/chain
 */

// Configuration
export {
  CHAIN_CONFIG,
  TOKEN_CONFIG,
  WAFFLE_GAME_CONFIG,
  getExplorerUrl,
} from "./config";

// Clients
export { publicClient, getAdminWallet, getWalletClient } from "./client";

// Game operations
export {
  generateOnchainGameId,
  createGameOnChain,
  closeSalesOnChain,
  getOnChainGame,
  hasTicketOnChain,
  hasClaimedOnChain,
  type OnChainGame,
} from "./game";

// Game lifecycle (ranking, publishing) - NOT exported here because it's server-only
// Import directly from "@/lib/game/lifecycle" in server components/actions

// Merkle tree
export {
  buildMerkleTree,
  generateMerkleProof,
  verifyMerkleProof,
  type Winner,
  type MerkleTreeResult,
} from "./merkle";

// Payment verification
export {
  verifyTicketPurchase,
  waitForTransaction,
  type VerifyTicketPurchaseResult,
  type VerifyTicketPurchaseInput,
} from "./verify";
