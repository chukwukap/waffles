# Features

## Game Management

### Creating Games

The game creation workflow provides a comprehensive form for configuring all game aspects:

**Form Fields**:

- **Title**: Game name (3+ characters)
- **Description**: Optional game description
- **Theme**: Select from FOOTBALL, MOVIES, ANIME, POLITICS, CRYPTO
- **Cover Image**: Upload game cover (max 4MB)
- **Schedule**: Start and end date/time
- **Entry Fee**: Cost in USDC (default: 50)
- **Prize Pool**: Total prize amount
- **Question Count**: Number of questions (default: 9)
- **Round Duration**: Time per question in seconds (default: 15)
- **Max Players**: Maximum participants (default: 200)

**Server Action**: `createGameAction`

**Validation**:

- Title minimum length
- Valid date range (endsAt > startsAt)
- Non-negative fees and prizes
- At least 1 question required

### Editing Games

Modify existing games with the same comprehensive form. Pre-populated with current values.

**Server Action**: `updateGameAction`

**Restrictions**:

- Cannot edit LIVE or ENDED games (status must be SCHEDULED)
- Validation same as creation

### Game Lifecycle

#### Starting a Game

**Requirements**:

- Game status must be SCHEDULED
- At least 1 question added
- Cannot start ENDED or CANCELLED games

**Action**: Click "Start Game" in action dropdown

**Server Action**: `startGameAction`

**Validation**:

```typescript
if (game.status === "LIVE") {
  return { error: "Game is already live" };
}
if (game._count.questions === 0) {
  return { error: "Cannot start game without questions" };
}
```

**Effects**:

- Status changes to LIVE
- Audit log created
- Games list revalidated

#### Ending a Game

**Requirements**:

- Game status must be LIVE
- Cannot end ENDED or CANCELLED games

**Action**: Click "End Game" in action dropdown

**Server Action**: `endGameAction`

**Effects**:

- Status changes to ENDED
- Audit log created
- Games list revalidated

### Deleting Games

**Action**: Click "Delete Game" in dropdown or delete icon

**Server Action**: `deleteGameAction`

**Confirmation**: Requires user confirmation

**Effects**:

- Game and all related data deleted (cascading)
- Audit log created
- Redirect to games list

### Game Listing

**Features**:

- Search by title (case-insensitive)
- Filter by status (SCHEDULED, LIVE, ENDED, CANCELLED)
- Status badges with color coding
- Player/ticket counts
- Question count
- Start time display
- Action dropdown per game

**Loading State**: Skeleton UI with table structure

## Question Management

### Creating Questions

Navigate to game → Manage Questions → Add Question

**Form Fields**:

- **Content**: Question text (5+ characters)
- **Options A-D**: Four answer choices
- **Correct Answer**: Select A, B, C, or D
- **Round Index**: Question order (1-based)
- **Duration**: Time to answer in seconds (default: 10)
- **Media Image**: Optional image upload (max 4MB)
- **Audio**: Optional sound file (max 10MB)

**Server Action**: `createQuestionAction`

**Supported Media**:

- Images: image/\*
- Audio: audio/\* (MP3, WAV, etc.)

### Question List

**Features**:

- Display all questions for a game
- Round index ordering
- Content preview
- Media/audio indicators
- Duration display
- Edit/Delete actions

### Media Uploads

Uses `MediaUpload` component with Vercel Blob:

**Image Preview**:

- Shows uploaded image
- Aspect ratio: video (16:9)
- Remove button on hover

**Audio Preview**:

- Built-in audio player
- Music note icon
- Remove button

**Upload Process**:

1. User selects file
2. Client-side validation (size, type)
3. Direct upload to Vercel Blob with auth token
4. URL stored in hidden form field
5. Submitted with form data

## User Management

### User Listing

**Search Capabilities**:

- By FID (Farcaster ID)
- By username
- By wallet address

**Filters**:

- Status: ACTIVE, BANNED, SUSPENDED
- Role: USER, ADMIN

**Display**:

- User card grid (responsive)
- Avatar with gradient background
- Username and FID
- Stats (games played, tickets)
- Status badge
- Action buttons

**Loading State**: Skeleton cards

### User Details

Click user card → Navigate to detail page

**Information Displayed**:

- Profile information
- Account status
- Activity statistics
- Game history
- Ticket purchases
- Referral data

### User Actions

#### Ban User

**Effect**: Sets status to BANNED
**Server Action**: `banUserAction`
**Restrictions**: Cannot ban other admins

#### Unban User

**Effect**: Sets status to ACTIVE
**Server Action**: `unbanUserAction`

#### Update Invite Quota

**Effect**: Changes user's invite allowance
**Server Action**: `updateUserInviteQuotaAction`
**Use Case**: Reward power users or adjust limits

#### Promote to Admin

**Effect**: Sets role to ADMIN
**Server Action**: `promoteUserAction`
**Warning**: Grants full dashboard access

## Analytics Dashboard

### Overview Statistics

**Metrics Displayed**:

- Total Users
- Active Users (status = ACTIVE)
- Total Games
- Live Games
- Total Tickets
- Paid Tickets
- Total Revenue (sum of ticket sales)

**Server-Side Aggregation**:

```typescript
const stats = await Promise.all([
  prisma.user.count(),
  prisma.user.count({ where: { status: "ACTIVE" } }),
  prisma.game.count(),
  // ... etc
]);
```

### User Growth Chart

**Visualization**: Line chart (Recharts)
**Time Period**: Last 7 days
**Data Points**: Daily new user signups

### Revenue Chart

**Visualization**: Area chart
**Time Period**: Last 7 days
**Data Points**: Daily ticket revenue in USDC

### Referral Statistics

**Metrics**:

- Total referrals
- Conversion rate
- Top referrers

### Recent Activity Feed

**Displays**:

- Recently created games (last 3)
- Recently joined users (last 3)
- Player counts per game

## Ticket Management

### Ticket Listing

**Filters**:

- By game
- By status (PENDING, PAID, REDEEMED, REFUNDED)
- By user

**Display**:

- Ticket ID
- User information
- Game title
- Purchase amount
- Status
- Purchase timestamp

## System Monitoring

### Logs Viewer

**Features**:

- Audit log display
- Filter by action type
- Filter by entity type
- Filter by admin user
- Pagination

**Log Fields**:

- Timestamp
- Admin user
- Action (CREATE, UPDATE, DELETE, etc.)
- Entity type (GAME, USER, QUESTION, etc.)
- Entity ID
- Details (JSON)

### Database Health

**Checks**:

- Connection status
- Response time
- Table sizes
- Index usage

### Active Games Monitor

**Real-time Display**:

- Currently LIVE games
- Player counts
- Round progress
- System resource usage

## Media Upload System

### Architecture

**Flow**:

```
1. User selects file
2. MediaUpload validates (client-side)
3. Calls /api/upload for auth token
4. Direct upload to Vercel Blob
5. Blob URL returned
6. URL stored in form
7. Form submission includes URL
8. Server action saves to database
```

### Upload API

**Endpoint**: `POST /api/upload`

**Authentication**: Admin session required

**Token Payload**:

```typescript
{
  userId: session.userId,
  username: session.username
}
```

**Allowed Types**:

- `image/jpeg`
- `image/png`
- `image/gif`
- `audio/mpeg`
- `audio/wav`

**Size Limits**:

- Images: 4MB
- Audio: 10MB

### MediaUpload Component

**Props**:

```typescript
interface MediaUploadProps {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  accept?: string; // "image/*" or "audio/*"
  maxSizeMB?: number;
}
```

**States**:

- Empty: Upload prompt with icon
- Uploading: Spinner with progress
- Uploaded: Preview with remove button
- Error: Error message display

**Image Preview**: Next.js Image component with object-cover
**Audio Preview**: Native HTML5 audio player

## UI/UX Features

### Toast Notifications

**Library**: Sonner (via GlobalToaster)

**Usage**:

```typescript
import { notify } from "@/components/ui/Toaster";

notify.success("Game created successfully!");
notify.error("Failed to start game");
```

**Positions**: Bottom-right
**Duration**: 3 seconds (auto-dismiss)
**Types**: Success, Error, Info, Warning

### Loading States

**Pattern**: `loading.tsx` files
**Examples**:

- Games list skeleton
- Users list skeleton
- Dashboard skeleton

**Design**: Animate-pulse for visual feedback

### Action Dropdowns

**GameActions Component**:

- Three-dot menu (EllipsisVerticalIcon)
- Contextual actions based on status
- Backdrop for outside clicks
- Confirmation for destructive actions

**Actions Available**:

- Edit Game (all statuses)
- Manage Questions (all statuses)
- Start Game (SCHEDULED only)
- End Game (LIVE only)
- Delete Game (all statuses)

### Responsive Design

**Breakpoints**:

- Desktop: 1920px+
- Tablet: 768px - 1919px
- Mobile: < 768px

**Sidebar**:

- Desktop: Always visible
- Mobile: Hidden (hamburger menu recommended)

## Theming

**Game Themes Available**:

- FOOTBALL: Soccer, teams, matches
- MOVIES: Films, actors, trivia
- ANIME: Japanese animation
- POLITICS: Current events, history
- CRYPTO: Blockchain, tokens, DeFi

**Theme Display**: Badge with capitalized text and icon

## Performance Features

### Server-Side Rendering

- All admin pages use RSC
- Direct database queries
- No client-side data fetching
- SEO-friendly HTML

### Caching

- Automatic Next.js caching
- `revalidatePath()` for targeted updates
- No stale data after mutations

### Code Splitting

- Automatic route-based splitting
- Client components lazy-loaded
- Minimal JavaScript bundle

### Image Optimization

- Next.js Image component
- Automatic format selection (WebP)
- Responsive images
- Lazy loading

## Keyboard Navigation

**Planned Features**:

- Tab navigation
- Arrow key selection
- Enter to confirm
- Escape to close modals

**Current Status**: Partially implemented

## Accessibility

**Implemented**:

- Semantic HTML
- ARIA labels on interactive elements
- Focus states on buttons/links
- Color contrast compliance

**To Improve**:

- Screen reader announcements
- Keyboard shortcuts
- Focus management in modals

## Next Steps

- [User Guide](./04-user-guide.md)
- [API Reference](./05-api-reference.md)
- [Security Guide](./06-security.md)
