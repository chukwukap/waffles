# User Guide

## Getting Started

### Prerequisites

Before accessing the admin dashboard, ensure you have:

1. **Admin Access**: Your Farcaster ID must be marked as an admin
2. **Environment Variables Set**:
   ```bash
   ADMIN_PASSWORD_HASH="your-bcrypt-hash"
   ADMIN_SESSION_SECRET="your-secret-key"
   ```
3. **Database Access**: PostgreSQL connection configured
4. **Blob Storage**: Vercel Blob token configured (for media uploads)

### First-Time Setup

1. **Generate Admin Password Hash**:

   ```bash
   node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
   ```

2. **Set Environment Variables**:

   ```bash
   # .env.local
   ADMIN_PASSWORD_HASH="$2a$10$..."
   ADMIN_SESSION_SECRET="random-64-char-string"
   BLOB_READ_WRITE_TOKEN="vercel_blob_..."
   ```

3. **Run Database Migrations**:
   ```bash
   pnpm prisma migrate deploy
   ```

## Authentication

### Logging In

1. Navigate to `/admin/login`
2. Enter your admin password
3. Click "Sign In"
4. Upon success, redirected to `/admin` (dashboard)

**Session Duration**: 7 days (configurable)

**Security**:

- Password hashed with bcrypt
- Session stored in HTTP-only cookie
- CSRF protection via session secret

### Logging Out

Navigate to any admin page and click your avatar → Logout
Or manually delete the `admin-session` cookie

## Dashboard Overview

### Statistics Cards

The dashboard displays 4 key metrics:

1. **Total Users**: All registered users
2. **Active Games**: Currently LIVE games
3. **Revenue**: Total USDC collected
4. **Tickets**: Total tickets sold

### Charts

**User Growth**:

- 7-day trend
- Daily new signups
- Line chart visualization

**Revenue**:

- 7-day trend
- Daily ticket sales
- Area chart visualization

### Recent Activity

**Recent Games**: Last 3 created games with player counts
**Recent Users**: Last 3 joined users with timestamps

## Game Management

### Creating a New Game

1. Navigate to `/admin/games`
2. Click "Create Game" button
3. Fill in the form:

#### Basic Information

- **Title**: Give your game a catchy name
- **Description**: Optional description for players
- **Theme**: Choose category (Football, Movies, etc.)
- **Cover Image**: Upload a 16:9 cover image

#### Schedule

- **Starts At**: Date and time when game goes live
- **Ends At**: Date and time when game closes

> [!IMPORTANT]
> Ensure sufficient time between start and end for all rounds

#### Economics

- **Entry Fee**: Cost to join (in USDC)
- **Prize Pool**: Total amount to distribute
- **Max Players**: Limit participants (prevents overload)

#### Gameplay

- **Question Count**: How many questions (default: 9)
- **Round Duration**: Seconds per question (default: 15)

4. Click "Create Game"
5. Success toast appears
6. Redirected to games list

### Managing Questions

1. Navigate to game → Click "Q" icon → Manage Questions
2. Click "Add Question"
3. Fill in question details:

**Content**:

- Write clear, concise question
- Minimum 5 characters

**Options**:

- Provide 4 distinct choices (A, B, C, D)
- Mark correct answer

**Media** (Optional):

- Upload image: Max 4MB, supports JPG/PNG/GIF
- Upload audio: Max 10MB, supports MP3/WAV

**Settings**:

- Round Index: Order in game (1, 2, 3...)
- Duration: Override default time

4. Click "Add Question"
5. Question appears in list

> [!TIP]
> Add all questions before starting the game. You cannot add questions to a LIVE game.

### Starting a Game

**Prerequisites**:

- Game status must be SCHEDULED
- At least 1 question added

**Steps**:

1. Navigate to `/admin/games`
2. Find your game
3. Click three-dot menu → "Start Game"
4. Confirm the action
5. Game status changes to LIVE

**What Happens**:

- Game becomes visible to players
- Players can purchase tickets
- Game enters active state

### Ending a Game

**Prerequisites**:

- Game status must be LIVE

**Steps**:

1. Navigate to `/admin/games`
2. Find the game
3. Click three-dot menu → "End Game"
4. Confirm the action
5. Game status changes to ENDED

**What Happens**:

- Game closes to new players
- Final scores calculated
- Prizes distributed (if configured)

### Editing a Game

**Restrictions**: Only SCHEDULED games can be edited

**Steps**:

1. Navigate to `/admin/games`
2. Click three-dot menu → "Edit Game"
3. Modify fields
4. Click "Update Game"

**Editable Fields**:

- All game settings (title, schedule, fees, etc.)
- Cannot change status directly (use Start/End actions)

### Deleting a Game

> [!CAUTION]
> This action is irreversible and deletes all related data (questions, tickets, players, answers).

**Steps**:

1. Navigate to `/admin/games`
2. Click three-dot menu → "Delete Game"
3. Confirm deletion
4. Game and all data removed

## User Management

### Viewing Users

1. Navigate to `/admin/users`
2. Use search and filters:

**Search**:

- By username
- By FID
- By wallet address

**Filters**:

- Status: ACTIVE, BANNED, SUSPENDED
- Role: USER, ADMIN

### User Details

1. Click on a user card
2. View comprehensive profile:
   - Account information
   - Activity statistics
   - Game history
   - Referral data

### Banning a User

**Use Case**: Prevent abusive users from accessing the platform

**Steps**:

1. Navigate to user details
2. Click "Ban User"
3. Confirm action
4. User status changes to BANNED

**Effects**:

- User cannot log in
- User cannot join games
- Existing tickets remain valid

### Unbanning a User

**Steps**:

1. Navigate to user details
2. Click "Unban User"
3. User status changes to ACTIVE

### Adjusting Invite Quota

**Use Case**: Reward power users or limit spam

**Steps**:

1. Navigate to user details
2. Find "Invite Quota" section
3. Enter new quota value
4. Click "Update"

### Promoting to Admin

> [!WARNING]
> Admins have full access to the dashboard. Only promote trusted users.

**Steps**:

1. Navigate to user details
2. Click "Promote to Admin"
3. Confirm action
4. User role changes to ADMIN

**Effects**:

- User can access `/admin`
- User can perform all admin actions
- User appears in audit logs

## Analytics & Monitoring

### Analytics Dashboard

Navigate to `/admin/analytics` to view:

**Performance Metrics**:

- Game engagement rates
- Average players per game
- Revenue per game

**User Metrics**:

- Retention rates
- Referral conversion
- Active user trends

**Financial Metrics**:

- Daily/weekly/monthly revenue
- Average ticket price
- Prize pool distribution

### Audit Logs

Navigate to `/admin/logs` to review all admin actions:

**Filters**:

- By admin user
- By action type (CREATE, UPDATE, DELETE)
- By entity type (GAME, USER, QUESTION)
- By date range

**Log Details**:

- Timestamp
- Admin who performed action
- Action type
- Affected entity
- Before/after values (in details)

**Use Cases**:

- Compliance audits
- Debugging issues
- Security investigations

### System Health

Navigate to `/admin/settings` to monitor:

**Database**:

- Connection status
- Query performance
- Storage usage

**Active Games**:

- Current LIVE games
- Player counts
- Server load

**Error Logs**:

- Recent errors
- Error frequency
- Stack traces

## Tickets

### Viewing Tickets

Navigate to `/admin/tickets`:

**Display**:

- Ticket ID
- User information
- Game title
- Amount paid
- Status (PENDING, PAID, REDEEMED, REFUNDED)
- Purchase timestamp

**Filters**:

- By game
- By status
- By user
- By date range

### Refunding Tickets

> [!IMPORTANT]
> Refunds should be issued for legitimate reasons (game cancellation, technical issues).

**Steps**:

1. Navigate to `/admin/tickets`
2. Find the ticket
3. Click "Refund"
4. Confirm action
5. Status changes to REFUNDED

**Effects**:

- User receives USDC refund
- Ticket marked as refunded
- Audit log created

## Media Management

### Uploading Files

**Supported Types**:

- Images: JPG, PNG, GIF (max 4MB)
- Audio: MP3, WAV (max 10MB)

**Process**:

1. Click the upload area in any form
2. Select file from your computer
3. Wait for upload (progress shown)
4. Preview appears
5. Submit form to save

**Removing Files**:

- Hover over preview
- Click "X" button
- File removed from form

### Best Practices

**Images**:

- Use 16:9 aspect ratio for game covers
- Optimize images before upload (recommended < 1MB)
- Use descriptive filenames

**Audio**:

- Keep files short (< 10 seconds for questions)
- Use MP3 format for best compatibility
- Test audio before uploading

## Troubleshooting

### Cannot Log In

**Issue**: "Invalid password" error

**Solutions**:

1. Verify `ADMIN_PASSWORD_HASH` in environment
2. Ensure password matches hash
3. Check session secret is set
4. Clear browser cookies and retry

### Cannot Upload Files

**Issue**: Upload fails or times out

**Solutions**:

1. Verify `BLOB_READ_WRITE_TOKEN` is set
2. Check file size (< 4MB for images, < 10MB for audio)
3. Ensure file type is supported
4. Check network connection

### Game Won't Start

**Issue**: "Cannot start game" error

**Solutions**:

1. Verify at least 1 question added
2. Check game status is SCHEDULED
3. Ensure you're logged in as admin
4. Review audit logs for errors

### Questions Not Saving

**Issue**: Question form submission fails

**Solutions**:

1. Check all required fields filled
2. Verify correct answer selected (A, B, C, or D)
3. Ensure content is at least 5 characters
4. Check database connection

## Keyboard Shortcuts

**Planned Features**:

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New game
- `Escape`: Close modals
- `Tab`: Navigate forms

**Current Status**: Standard browser navigation only

## Best Practices

### Security

1. **Never share admin password**
2. **Use strong, unique password**
3. **Review audit logs regularly**
4. **Limit admin role assignments**
5. **Enable 2FA** (when available)

### Game Management

1. **Test questions before going live**
2. **Set realistic prize pools**
3. **Monitor player counts**
4. **Schedule games during peak hours**
5. **Review analytics after each game**

### User Management

1. **Investigate before banning**
2. **Document ban reasons**
3. **Respond to user reports promptly**
4. **Review referral patterns**
5. **Reward active users**

### Performance

1. **Use skeleton loading states** (automatic)
2. **Limit large queries** (use pagination)
3. **Optimize uploaded files**
4. **Monitor database size**
5. **Review slow queries**

## FAQ

**Q: Can I edit a LIVE game?**
A: No, only SCHEDULED games can be edited. End the game first, then create a new one.

**Q: How do I restore a deleted game?**
A: Games cannot be restored. Always confirm before deleting.

**Q: Can users see draft games?**
A: No, only SCHEDULED and LIVE games are visible to users.

**Q: How are prizes distributed?**
A: Prize distribution is automatic based on final scores (configured in game settings).

**Q: Can I change a question after the game starts?**
A: No, questions cannot be modified once the game is LIVE.

**Q: What happens if a game crashes mid-session?**
A: The system will attempt to recover. In worst case, issue refunds via the tickets page.

## Next Steps

- [API Reference](./05-api-reference.md)
- [Security Guide](./06-security.md)
- [Development Guide](./07-development.md)
