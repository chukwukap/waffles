# Recent Changes Summary

This document highlights every change made during the latest development session in preparation for the production launch of Waffles.

## Environment & Configuration
- Added a resilient `rootUrl` resolver that honours `NEXT_PUBLIC_URL`, `NEXT_PUBLIC_APP_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, and `VERCEL_URL` before falling back to `http://localhost:3000` (`src/lib/env.ts`).
- Introduced `NEXT_PUBLIC_LEADERBOARD_PAGE_SIZE` support for consistent pagination sizing across environments (`src/lib/env.ts`).

## Audio & Game Flow Enhancements
- Rebuilt the sound manager to preload a unified placeholder (`dice-shake-1.ogg`), support looping sounds, expose `stop`/`stopAll`, and gate playback behind the first user gesture (`src/lib/SoundManager.ts`, `src/app/(authenticated)/game/gameClientImpl.ts`, `src/stores/gameStore.ts`).
- Wired countdown ambience, question-start cues, and wallet-based sound toggles into the game flow while ensuring sounds stop on reset/navigation.

## Leaderboard Reliability
- Hardened `/api/leaderboard` pagination by parsing pages safely and using the configured page size; response now returns `totalPlayers` and `totalPoints` to support downstream analytics (`src/app/api/leaderboard/route.ts`).
- Extended the leaderboard store to handle refreshed fetches, prevent duplicate pages, and support replace semantics for the auto-refresh loop (`src/stores/leaderboardStore.ts`, `src/app/(authenticated)/leaderboard/page.tsx`).

## Profile Synchronisation
- Ensured Farcaster headers accompany every profile/stat/history fetch and update request; the profile store now tracks the active FID and avoids redundant fetches (`src/stores/profileStore.ts`, profile pages).

## Scoring System
- Clamped scoring inputs, guaranteed non-negative scores, and recalculated deltas when players resubmit answers to avoid double counting (`src/lib/scoring.ts`, `src/app/api/game/answer/route.ts`).

## Game Over Experience
- Replaced the minimal Game Over view with a data-rich summary that pulls leaderboard results, estimated earnings, percentile stats, and offers share/back actions in a responsive layout (`src/app/(authenticated)/game/_components/GameOverView.tsx`).

## Ticket Purchase Flow
- Embedded the “Waffle Secured” confirmation inside the lobby buy page, delivering a responsive confirmation card, share/back controls, and live prize-pool data (`src/app/(authenticated)/lobby/buy/_components/BuyConfirmation.tsx`, `src/app/(authenticated)/lobby/buy/page.tsx`).
- Built a Neynar-powered social graph endpoint exposing mutual followers and their ticket status, then surfaced this context in the ticket purchase screen (avatars in “Spots left” + “Your friends” list) (`src/app/api/social/friends/route.ts`, `src/app/(authenticated)/lobby/buy/page.tsx`).

## Referral & Onboarding
- Automatically creates or reuses referral codes during user sync and propagates the code to onboarding, sync hooks, and profile UI, ensuring marketing flows stay in sync (`src/app/api/user/sync/route.ts`, `src/hooks/useSyncUser.ts`, `src/hooks/useOnboarding.ts`, `src/app/(authenticated)/profile/page.tsx`).

## Assets & Miscellaneous
- Added the `dice-shake-1.ogg` placeholder audio in `public/sounds`.
- General tidy-ups across the codebase (import ordering, defensive checks) uncovered while integrating the above features.

All of these changes have been committed to the repository and verified for build consistency. Please review this list before deployment to ensure environment variables and new API dependencies (Neynar) are configured in production.
