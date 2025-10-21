import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────
// Types (keep in sync with the client store)
// ─────────────────────────────────────────────────────────────
export type LeaderboardUser = {
  id: string;
  rank: number; // we’ll compute this server-side
  name: string;
  avatarUrl: string;
  score: number;
};

type Payload = {
  users: LeaderboardUser[];
  hasMore: boolean;
};

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 25; // tune to your needs

// When you flip to a real DB, remove this and query with ORDER BY score DESC
const TOTAL_USERS = 500; // how many rows we synthesize for each tab

// Optional caching semantics (can also export `revalidate` if you prefer ISR)
export const dynamic = "force-dynamic"; // keep responses dynamic

// ─────────────────────────────────────────────────────────────
// Helpers: deterministic RNG + fake data
// ─────────────────────────────────────────────────────────────

// Mulberry32 PRNG - fast & deterministic given a seed.
// Ref: https://stackoverflow.com/a/47593316
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Stable “word list” for names
const FIRST = [
  "Alex",
  "Bailey",
  "Casey",
  "Devon",
  "Elliot",
  "Frankie",
  "Gray",
  "Harper",
  "Indie",
  "Jules",
  "Kai",
  "Logan",
  "Morgan",
  "Nico",
  "Oakley",
  "Parker",
  "Quinn",
  "Riley",
  "Sage",
  "Taylor",
];
const LAST = [
  "Blaze",
  "Brook",
  "Cedar",
  "Dune",
  "Echo",
  "Fable",
  "Grove",
  "Haze",
  "Isle",
  "Jade",
  "Knoll",
  "Lark",
  "Moss",
  "North",
  "Onyx",
  "Pine",
  "Quill",
  "Rune",
  "Snow",
  "Vale",
];

function makeName(rand: () => number) {
  const f = FIRST[Math.floor(rand() * FIRST.length)];
  const l = LAST[Math.floor(rand() * LAST.length)];
  return `${f} ${l}`.toUpperCase();
}

/**
 * Build a *stable* dataset per tab (so page 0/1/2 are consistent).
 * - For “current” we still use a fixed seed so your UI stays predictable.
 *   (You can swap to a time-bucket seed if you want the list to churn hourly.)
 * - For “allTime” we use a different seed so datasets differ.
 */
function buildDataset(
  tab: "current" | "allTime",
  count: number
): LeaderboardUser[] {
  const seed = tab === "current" ? 1337 : 4242; // change to a time-bucket if you want live churn
  const rand = mulberry32(seed);

  const rows: Omit<LeaderboardUser, "rank">[] = Array.from(
    { length: count },
    (_, i) => {
      // Larger variance for “all time”, slightly tighter for “current”
      const base = tab === "allTime" ? 50_000 : 1_500;
      const swing = tab === "allTime" ? 75_000 : 1_000;
      const score =
        Math.floor(base + rand() * swing + rand() * (swing / 2)) + rand();

      const avatarIndex = (i % 12) + 1; // assuming you have 12 avatar images in /public/images/avatars
      const avatarUrl = `/images/avatars/a.png`;

      return {
        id: `${tab}-${i + 1}`,
        name: makeName(rand),
        avatarUrl,
        score,
      };
    }
  );

  // Sort DESC by score; compute rank
  const sorted = rows.sort((a, b) => b.score - a.score);
  return sorted.map((u, idx) => ({ ...u, rank: idx + 1 }));
}

/**
 * In-memory dataset cache (per process). In serverless it can be evicted,
 * which is fine—data will regenerate deterministically using the same seed.
 */
let cachedCurrent: LeaderboardUser[] | null = null;
let cachedAllTime: LeaderboardUser[] | null = null;

function getDataset(tab: "current" | "allTime") {
  if (tab === "current") {
    if (!cachedCurrent) cachedCurrent = buildDataset("current", TOTAL_USERS);
    return cachedCurrent;
  } else {
    if (!cachedAllTime) cachedAllTime = buildDataset("allTime", TOTAL_USERS);
    return cachedAllTime;
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/leaderboard?tab=current|allTime&page=n
// ─────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tabParam = (searchParams.get("tab") || "allTime") as
    | "current"
    | "allTime";
  const pageParam = searchParams.get("page") ?? "0";

  // Validate params
  if (tabParam !== "current" && tabParam !== "allTime") {
    return NextResponse.json(
      { error: "Invalid `tab`. Use `current` or `allTime`." },
      { status: 400 }
    );
  }

  const page = Number(pageParam);
  if (!Number.isFinite(page) || page < 0) {
    return NextResponse.json(
      { error: "Invalid `page` (>= 0)." },
      { status: 400 }
    );
  }

  // Get full dataset (sorted, ranked)
  const all = getDataset(tabParam);

  // Paginate
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const slice = all.slice(start, end);
  const hasMore = end < all.length;

  const body: Payload = {
    users: slice,
    hasMore,
  };

  // Cache headers: current = no-store; allTime = short cache
  const headers: HeadersInit =
    tabParam === "current"
      ? { "Cache-Control": "no-store" }
      : { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };

  return NextResponse.json(body, { headers });
}

// Optional: allow CORS if you’re testing cross-origin
// export async function OPTIONS() {
//   return NextResponse.json(null, {
//     headers: {
//       "Access-Control-Allow-Origin": "*",
//       "Access-Control-Allow-Methods": "GET, OPTIONS",
//       "Access-Control-Allow-Headers": "Content-Type",
//     },
//   });
// }
