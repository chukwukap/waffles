/**
 * Merkle Tree Utility for WaffleGame Prize Distribution
 *
 * Uses double hashing (keccak256(keccak256(abi.encode(...)))) to match
 * the contract's Merkle proof verification.
 */

import {
  keccak256,
  encodePacked,
  encodeAbiParameters,
  parseAbiParameters,
} from "viem";

/**
 * Represents a winner in the Merkle tree
 */
export interface Winner {
  gameId: number;
  address: `0x${string}`;
  amount: bigint; // In token units (e.g., USDC has 6 decimals)
}

/**
 * Merkle tree node
 */
interface MerkleNode {
  hash: `0x${string}`;
  left?: MerkleNode;
  right?: MerkleNode;
  winner?: Winner;
}

/**
 * Generates a leaf hash matching the contract's format:
 * keccak256(bytes.concat(keccak256(abi.encode(gameId, player, amount))))
 */
export function generateLeafHash(winner: Winner): `0x${string}` {
  // First hash: abi.encode(gameId, player, amount)
  const innerData = encodeAbiParameters(
    parseAbiParameters("uint256 gameId, address player, uint256 amount"),
    [BigInt(winner.gameId), winner.address, winner.amount]
  );
  const innerHash = keccak256(innerData);

  // Second hash: keccak256(bytes.concat(innerHash))
  // In Solidity: keccak256(bytes.concat(innerHash))
  // In viem: keccak256(encodePacked) with bytes32
  const outerHash = keccak256(encodePacked(["bytes32"], [innerHash]));

  return outerHash;
}

/**
 * Sorts two hashes for consistent tree building
 */
function sortPair(
  a: `0x${string}`,
  b: `0x${string}`
): [`0x${string}`, `0x${string}`] {
  return a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
}

/**
 * Combines two hashes into a parent hash
 */
function hashPair(a: `0x${string}`, b: `0x${string}`): `0x${string}` {
  const [left, right] = sortPair(a, b);
  return keccak256(encodePacked(["bytes32", "bytes32"], [left, right]));
}

/**
 * Builds a Merkle tree from a list of winners
 */
export function buildMerkleTree(winners: Winner[]): {
  root: `0x${string}`;
  leaves: Map<`0x${string}`, { index: number; winner: Winner }>;
} {
  if (winners.length === 0) {
    throw new Error("Cannot build Merkle tree with no winners");
  }

  // Generate leaf hashes
  const leaves = new Map<`0x${string}`, { index: number; winner: Winner }>();
  const leafHashes = winners.map((winner, index) => {
    const hash = generateLeafHash(winner);
    leaves.set(winner.address.toLowerCase() as `0x${string}`, {
      index,
      winner,
    });
    return hash;
  });

  // Build tree layers
  let currentLayer = leafHashes;

  while (currentLayer.length > 1) {
    const nextLayer: `0x${string}`[] = [];

    for (let i = 0; i < currentLayer.length; i += 2) {
      if (i + 1 < currentLayer.length) {
        nextLayer.push(hashPair(currentLayer[i], currentLayer[i + 1]));
      } else {
        // Odd number of nodes: duplicate the last one
        nextLayer.push(hashPair(currentLayer[i], currentLayer[i]));
      }
    }

    currentLayer = nextLayer;
  }

  return {
    root: currentLayer[0],
    leaves,
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
  const targetIndex = winners.findIndex(
    (w) => w.address.toLowerCase() === targetAddress.toLowerCase()
  );

  if (targetIndex === -1) return null;

  // Generate all leaf hashes
  const leafHashes = winners.map((w) => generateLeafHash(w));

  // Build proof
  const proof: `0x${string}`[] = [];
  let currentIndex = targetIndex;
  let currentLayer = [...leafHashes];

  while (currentLayer.length > 1) {
    const siblingIndex =
      currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;

    if (siblingIndex < currentLayer.length) {
      proof.push(currentLayer[siblingIndex]);
    } else {
      // Odd number: sibling is self
      proof.push(currentLayer[currentIndex]);
    }

    // Build next layer
    const nextLayer: `0x${string}`[] = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      if (i + 1 < currentLayer.length) {
        nextLayer.push(hashPair(currentLayer[i], currentLayer[i + 1]));
      } else {
        nextLayer.push(hashPair(currentLayer[i], currentLayer[i]));
      }
    }

    currentIndex = Math.floor(currentIndex / 2);
    currentLayer = nextLayer;
  }

  return {
    amount: winners[targetIndex].amount,
    proof,
  };
}

/**
 * Verifies a Merkle proof (for testing)
 */
export function verifyMerkleProof(
  root: `0x${string}`,
  winner: Winner,
  proof: `0x${string}`[]
): boolean {
  let currentHash = generateLeafHash(winner);

  for (const proofElement of proof) {
    currentHash = hashPair(currentHash, proofElement);
  }

  return currentHash.toLowerCase() === root.toLowerCase();
}
