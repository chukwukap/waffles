export const PALETTES = [
  { bg: "#FFE8BA", border: "#FFC931", text: "#151515" },
  { bg: "#EFD6FF", border: "#B45CFF", text: "#151515" },
  { bg: "#D7EBFF", border: "#2E7DFF", text: "#151515" },
  { bg: "#D8FFF1", border: "#18DCA5", text: "#151515" },
] as const;

export const EXTRA_TIME_SECONDS = 3; // 3 seconds

export const USDC_ADDRESS_BASE_MAINNET =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export const REFERRAL_BONUS_POINTS = 200;

// Claim delay: Players must wait this long after game ends before claiming prizes
export const CLAIM_DELAY_MS = 60 * 60 * 1000; // 1 hour in milliseconds
// ERC20 approve ABI

// ERC20 ABI for approve
export const ERC20_ABI = [
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
];

// Theme configurations with enhanced styling
export const THEMES = [
  {
    id: "FOOTBALL",
    label: "Football",
    icon: "⚽",
    color: "from-green-500 to-emerald-700",
    bgColor: "bg-green-500",
    glowColor: "shadow-green-500/30",
    description: "Sports trivia",
  },
  {
    id: "MOVIES",
    label: "Movies",
    icon: "🎬",
    color: "from-red-500 to-rose-700",
    bgColor: "bg-red-500",
    glowColor: "shadow-red-500/30",
    description: "Cinema & films",
  },
  {
    id: "ANIME",
    label: "Anime",
    icon: "🎌",
    color: "from-pink-500 to-fuchsia-700",
    bgColor: "bg-pink-500",
    glowColor: "shadow-pink-500/30",
    description: "Japanese animation",
  },
  {
    id: "POLITICS",
    label: "Politics",
    icon: "🏛️",
    color: "from-blue-500 to-indigo-700",
    bgColor: "bg-blue-600",
    glowColor: "shadow-blue-500/30",
    description: "World affairs",
  },
  {
    id: "CRYPTO",
    label: "Crypto",
    icon: "₿",
    color: "from-orange-500 to-amber-600",
    bgColor: "bg-orange-500",
    glowColor: "shadow-orange-500/30",
    description: "Web3 & blockchain",
  },
];
