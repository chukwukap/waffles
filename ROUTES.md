# Waffles Application Routes

## Public Pages

| Path | File               |
| ---- | ------------------ |
| `/`  | `src/app/page.tsx` |

---

## App (Player-facing)

### Game Flow

| Path                            | Purpose                     |
| ------------------------------- | --------------------------- |
| `/game`                         | Game lobby / upcoming games |
| `/game/[gameId]/ticket`         | Buy ticket page             |
| `/game/[gameId]/ticket/success` | Ticket purchase success     |
| `/game/[gameId]/live`           | Live gameplay               |
| `/game/[gameId]/result`         | Game results / claim prize  |

### Profile & Stats

| Path             | Purpose             |
| ---------------- | ------------------- |
| `/profile`       | User profile        |
| `/profile/games` | User's game history |
| `/profile/stats` | User statistics     |
| `/leaderboard`   | Global leaderboard  |

### Waitlist

| Path                    | Purpose              |
| ----------------------- | -------------------- |
| `/waitlist`             | Waitlist landing     |
| `/waitlist/quests`      | Waitlist quests      |
| `/waitlist/leaderboard` | Waitlist leaderboard |

### Other

| Path      | Purpose      |
| --------- | ------------ |
| `/redeem` | Redeem codes |

---

## Admin Dashboard

### Auth

| Path            | Purpose      |
| --------------- | ------------ |
| `/admin/login`  | Admin login  |
| `/admin/signup` | Admin signup |

### Dashboard

| Path               | Purpose        |
| ------------------ | -------------- |
| `/admin`           | Dashboard home |
| `/admin/analytics` | Analytics      |
| `/admin/logs`      | Audit logs     |

### Games

| Path                          | Purpose          |
| ----------------------------- | ---------------- |
| `/admin/games`                | Games list       |
| `/admin/games/create`         | Create new game  |
| `/admin/games/[id]`           | Game detail      |
| `/admin/games/[id]/edit`      | Edit game        |
| `/admin/games/[id]/questions` | Manage questions |

### Users

| Path                | Purpose           |
| ------------------- | ----------------- |
| `/admin/users`      | Users list        |
| `/admin/users/[id]` | User detail       |
| `/admin/tickets`    | Ticket management |

### Quests

| Path                    | Purpose                   |
| ----------------------- | ------------------------- |
| `/admin/quests`         | Quests list               |
| `/admin/quests/new`     | Create quest              |
| `/admin/quests/pending` | Pending quest submissions |
| `/admin/quests/[id]`    | Quest detail              |

### Media & Settings

| Path                       | Purpose             |
| -------------------------- | ------------------- |
| `/admin/media`             | Media library       |
| `/admin/media/upload`      | Upload media        |
| `/admin/notifications`     | Send notifications  |
| `/admin/invite-codes`      | Manage invite codes |
| `/admin/settings`          | Settings            |
| `/admin/settings/contract` | Contract management |

---

## API Routes

### Auth

| Endpoint                   | Method | Purpose             |
| -------------------------- | ------ | ------------------- |
| `/api/v1/auth`             | POST   | Farcaster auth      |
| `/api/v1/auth/party-token` | GET    | PartyKit auth token |

### Games

| Endpoint                              | Method | Purpose                            |
| ------------------------------------- | ------ | ---------------------------------- |
| `/api/v1/games`                       | GET    | List games                         |
| `/api/v1/games/[gameId]`              | GET    | Get game details                   |
| `/api/v1/games/[gameId]/entry`        | POST   | Create game entry (buy ticket)     |
| `/api/v1/games/[gameId]/join`         | POST   | Join game room                     |
| `/api/v1/games/[gameId]/leave`        | POST   | Leave game room                    |
| `/api/v1/games/[gameId]/questions`    | GET    | Get game questions                 |
| `/api/v1/games/[gameId]/answers`      | POST   | Submit answers                     |
| `/api/v1/games/[gameId]/chat`         | GET    | Get chat history                   |
| `/api/v1/games/[gameId]/leaderboard`  | GET    | Game leaderboard                   |
| `/api/v1/games/[gameId]/merkle-proof` | GET    | Get Merkle proof for prize claim   |
| `/api/v1/games/[gameId]/notify`       | POST   | Send notification (PartyKit)       |
| `/api/v1/games/[gameId]/notify-start` | POST   | Send start notification (PartyKit) |

### User

| Endpoint                      | Method | Purpose            |
| ----------------------------- | ------ | ------------------ |
| `/api/v1/me`                  | GET    | Current user       |
| `/api/v1/me/profile`          | PATCH  | Update profile     |
| `/api/v1/me/games`            | GET    | User's games       |
| `/api/v1/me/tickets`          | GET    | User's tickets     |
| `/api/v1/me/invite`           | POST   | Generate invite    |
| `/api/v1/users/[fid]`         | GET    | Get user by FID    |
| `/api/v1/users/[fid]/mutuals` | GET    | Get mutual follows |

### Prizes

| Endpoint                         | Method | Purpose              |
| -------------------------------- | ------ | -------------------- |
| `/api/v1/prizes/claim`           | POST   | Claim prize          |
| `/api/v1/prizes/[prizeId]/claim` | POST   | Claim specific prize |

### Waitlist

| Endpoint                       | Method   | Purpose              |
| ------------------------------ | -------- | -------------------- |
| `/api/v1/waitlist`             | GET/POST | Waitlist operations  |
| `/api/v1/waitlist/leaderboard` | GET      | Waitlist leaderboard |

### Leaderboard

| Endpoint              | Method | Purpose            |
| --------------------- | ------ | ------------------ |
| `/api/v1/leaderboard` | GET    | Global leaderboard |

### Admin

| Endpoint                   | Method   | Purpose               |
| -------------------------- | -------- | --------------------- |
| `/api/v1/admin/settlement` | GET/POST | Settlement operations |
| `/api/v1/admin/contract`   | GET      | Contract state        |
| `/api/v1/admin/media`      | POST     | Upload media          |

### External & Webhooks

| Endpoint                           | Method | Purpose                        |
| ---------------------------------- | ------ | ------------------------------ |
| `/api/v1/external/verify-waitlist` | POST   | External waitlist verification |
| `/api/webhook/notify`              | POST   | Farcaster notification webhook |
| `/api/upload`                      | POST   | File upload                    |
| `/.well-known/farcaster.json`      | GET    | Farcaster manifest             |

---

## Summary

- **41 Pages** (UI routes)
- **30 API Routes**
- **71 Total Paths**
