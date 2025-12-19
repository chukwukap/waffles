/**
 * Merkle Tree Utility for WaffleGame Prize Distribution
 *
 * Uses @openzeppelin/merkle-tree for standard, audited implementation.
 * Tree format matches the contract's claimPrize verification.
 */

import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

/**
 * Represents a winner in the Merkle tree
 */
export interface Winner {
  gameId: `0x${string}`; // bytes32 on-chain game ID
  address: `0x${string}`;
  amount: bigint; // In token units (e.g., USDC has 6 decimals)
}

/**
 * Merkle tree result with root and tree reference
 */
export interface MerkleTreeResult {
  root: `0x${string}`;
  tree: StandardMerkleTree<[string, string, bigint]>;
}

/**
 * Builds a Merkle tree from a list of winners
 *
 * Leaf format: [gameId, playerAddress, amount]
 * This matches the contract's verification: keccak256(abi.encode(gameId, player, amount))
 * gameId is bytes32 on-chain
 */
export function buildMerkleTree(winners: Winner[]): MerkleTreeResult {
  if (winners.length === 0) {
    throw new Error("Cannot build Merkle tree with no winners");
  }

  // Convert winners to leaf format: [gameId (bytes32), address, amount]
  const leaves = winners.map(
    (w) => [w.gameId, w.address, w.amount] as [string, string, bigint]
  );

  // Build tree with OpenZeppelin library
  // Uses double hashing internally, matching Solidity's keccak256(bytes.concat(keccak256(...)))
  const tree = StandardMerkleTree.of(leaves, ["bytes32", "address", "uint256"]);

  return {
    root: tree.root as `0x${string}`,
    tree,
  };
}

/**
 * Generates a Merkle proof for a specific winner
 */
export function generateMerkleProof(
  winners: Winner[],
  targetAddress: `0x${string}`
): {
  amount: bigint;
  proof: `0x${string}`[];
} | null {
  if (winners.length === 0) return null;

  // Find the target winner
  const targetWinner = winners.find(
    (w) => w.address.toLowerCase() === targetAddress.toLowerCase()
  );

  if (!targetWinner) return null;

  // Build tree
  const { tree } = buildMerkleTree(winners);

  // Find the leaf and get proof
  for (const [i, leaf] of tree.entries()) {
    const [, leafAddress] = leaf;
    if (leafAddress.toLowerCase() === targetAddress.toLowerCase()) {
      const proof = tree.getProof(i) as `0x${string}`[];
      return {
        amount: targetWinner.amount,
        proof,
      };
    }
  }

  return null;
}

/**
 * Verifies a Merkle proof (for testing)
 */
export function verifyMerkleProof(
  root: `0x${string}`,
  winner: Winner,
  proof: `0x${string}`[]
): boolean {
  const leaf: [string, string, bigint] = [
    winner.gameId,
    winner.address,
    winner.amount,
  ];

  return StandardMerkleTree.verify(
    root,
    ["bytes32", "address", "uint256"],
    leaf,
    proof
  );
}

/**
 * Dumps tree to JSON for storage/debugging
 */
export function dumpTree(
  tree: StandardMerkleTree<[bigint, string, bigint]>
): string {
  return JSON.stringify(tree.dump());
}

/**
 * Loads tree from JSON
 */
export function loadTree(
  json: string
): StandardMerkleTree<[bigint, string, bigint]> {
  return StandardMerkleTree.load(JSON.parse(json));
}
