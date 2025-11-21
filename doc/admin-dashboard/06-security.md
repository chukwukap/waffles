# Security

## Overview

The admin dashboard implements defense-in-depth security with multiple layers of protection.

## Authentication System

### Password-Based Authentication

**Mechanism**: bcrypt password hashing with session cookies

**Configuration**:

```bash
# .env.local
ADMIN_PASSWORD_HASH="$2a$10$..."  # bcrypt hash of admin password
ADMIN_SESSION_SECRET="..."         # 64-char random string for signing
```

**Password Requirements**:

- Minimum 8 characters recommended
- Mix of uppercase, lowercase, numbers, symbols
- Never commit passwords to version control

**Hashing Algorithm**:

- bcrypt with cost factor 10
- Salted automatically
- Resistant to rainbow table attacks

**Generate Hash**:

```bash
node -e "console.log(require('bcryptjs').hashSync('YourPassword123!', 10))"
```

### Session Management

**Storage**: HTTP-only, secure cookies

**Cookie Configuration**:

```typescript
{
  name: "admin-session",
  httpOnly: true,      // Prevents XSS access
  secure: true,        // HTTPS only in production
  sameSite: "lax",     // CSRF protection
  maxAge: 604800,      // 7 days
  path: "/admin"       // Scope to admin routes
}
```

**Session Data**:

```typescript
{
  userId: number;
  fid: string;
  username?: string;
  role: "ADMIN";
}
```

**Session Expiry**: 7 days (configurable in `admin-auth.ts`)

**Session Signing**:

- Uses `ADMIN_SESSION_SECRET` for HMAC
- Prevents tampering
- Validates on every request

### Multi-Layer Authorization

#### Layer 1: Edge Middleware

**File**: `middleware.ts`

```typescript
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const cookie = request.cookies.get("admin-session");
    if (!cookie) {
      return NextResponse.redirect("/admin/login");
    }

    // Verify session signature
    const session = verifySession(cookie.value);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.redirect("/admin/login");
    }
  }
}
```

**Benefits**:

- Runs on edge (low latency)
- Blocks unauthorized requests early
- No server processing for invalid sessions

#### Layer 2: Layout Authentication

**File**: `app/admin/layout.tsx`

```typescript
export default async function AdminLayout({ children }) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return <AdminUI session={session}>{children}</AdminUI>;
}
```

**Benefits**:

- Server-side validation
- Access to full session data
- Can query database if needed

#### Layer 3: Server Action Validation

**Pattern**: Every action validates auth

```typescript
export async function createGameAction() {
  const { authenticated, session } = await requireAdminSession();

  if (!authenticated || !session) {
    return { success: false, error: "Unauthorized" };
  }

  // Proceed with action
}
```

**Benefits**:

- Prevents direct action calls
- Validates even if middleware bypassed
- Provides clear error messages

## Authorization Model

### Role-Based Access Control (RBAC)

**Roles**:

- `USER`: Regular platform users
- `ADMIN`: Dashboard access

**Role Assignment**:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE fid = 'admin-fid';
```

**Permission Matrix**:

| Action         | USER | ADMIN |
| -------------- | ---- | ----- |
| View Games     | ✓    | ✓     |
| Create Game    | ✗    | ✓     |
| Edit Game      | ✗    | ✓     |
| Delete Game    | ✗    | ✓     |
| View Users     | ✗    | ✓     |
| Ban User       | ✗    | ✓     |
| Promote User   | ✗    | ✓     |
| View Analytics | ✗    | ✓     |
| Access Logs    | ✗    | ✓     |

### Admin-to-Admin Protection

**Cannot Ban Other Admins**:

```typescript
export async function banUserAction(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (user.role === "ADMIN") {
    return { success: false, error: "Cannot ban admin users" };
  }

  // Proceed with ban
}
```

**Audit All Admin Actions**:

```typescript
await logAdminAction({
  adminId: session.userId,
  action: AdminAction.BAN_USER,
  entityType: EntityType.USER,
  entityId: userId,
});
```

## Input Validation

### Schema Validation (Zod)

**All forms use Zod schemas**:

```typescript
const gameSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  theme: z.enum(["FOOTBALL", "MOVIES", "ANIME", "POLITICS", "CRYPTO"]),
  entryFee: z.coerce.number().min(0, "Entry fee must be non-negative"),
  // ... etc
});
```

**Validation Flow**:

1. Client-side: Browser HTML validation
2. Server-side: Zod schema parsing
3. Database: Prisma type safety + constraints

**Sanitization**:

- User input never directly interpolated into SQL
- Prisma parameterized queries
- No raw SQL (except migrations)

### File Upload Validation

**Client-Side**:

```typescript
// MediaUpload.tsx
const maxSize = accept === "image/*" ? 4 * 1024 * 1024 : 10 * 1024 * 1024;

if (file.size > maxSize) {
  setError("File too large");
  return;
}
```

**Server-Side**:

```typescript
// /api/upload
const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "audio/mpeg",
  "audio/wav",
];

if (!allowedTypes.includes(type)) {
  return new Response("Invalid file type", { status: 400 });
}
```

**Blob Storage**:

- Files uploaded directly to Vercel Blob
- No file processing on server
- CDN delivery (no server access)

## CSRF Protection

### SameSite Cookies

**Configuration**: `sameSite: "lax"`

**Protection**:

- Cookies not sent on cross-site POST requests
- Prevents CSRF from external sites
- Allows normal navigation

### Server Actions

**Built-in Protection**:

- Next.js Server Actions use POST with origin validation
- Actions only callable from same-origin forms
- Custom `action` attribute required

## XSS Prevention

### React Automatic Escaping

**Safe by Default**:

```tsx
<div>{userInput}</div> // Automatically escaped
```

**Dangerous Pattern (Avoided)**:

```tsx
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // NEVER USED
```

### Content Security Policy (Recommended)

**Add to `next.config.js`**:

```javascript
const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.vercel.com;
`;

module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp.replace(/\s{2,}/g, " ").trim(),
          },
        ],
      },
    ];
  },
};
```

## SQL Injection Prevention

### Prisma ORM

**Parameterized Queries**:

```typescript
// SAFE
await prisma.game.findMany({
  where: { title: { contains: userInput } }
});

// Prisma generates:
SELECT * FROM "Game" WHERE title LIKE $1
// With parameter: userInput
```

**No Raw SQL**:

```typescript
// DANGEROUS (Not used in codebase)
await prisma.$queryRaw`SELECT * FROM "Game" WHERE title = ${userInput}`;
```

**Type Safety**:

- Compile-time checks
- Auto-generated types
- No runtime SQL string building

## File Upload Security

### Direct Upload Architecture

**Benefit**: Server never touches files

```mermaid
graph LR
    Client[Browser] -->|1. Request token| API[/api/upload]
    API -->|2. Return token| Client
    Client -->|3. Upload file| Blob[Vercel Blob]
    Blob -->|4. Return URL| Client
    Client -->|5. Submit form + URL| Action[Server Action]
```

**Security Advantages**:

- No file processing vulnerabilities
- No disk writes
- No memory limits
- Automatic virus scanning (Vercel)

### Authentication Token

**Token Generation**:

```typescript
const token = await handleBlobUpload({
  request: req,
  payload: {
    userId: session.userId,
    username: session.username || "admin",
  },
  onBeforeGenerateToken: async (pathname, token) => {
    const session = await getAdminSession();
    if (!session) {
      throw new Error("Unauthorized");
    }
    return { token };
  },
  options: {
    allowedContentTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "audio/mpeg",
      "audio/wav",
    ],
    maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
  },
});
```

**Token Validation**:

- Short-lived (5 minutes)
- Single-use
- Signed by Vercel
- Admin session required

### File Type Restrictions

**Allowed Types**:

- Images: `image/jpeg`, `image/png`, `image/gif`
- Audio: `audio/mpeg`, `audio/wav`

**Blocked Types**:

- Executables (`.exe`, `.sh`, `.bat`)
- Scripts (`.js`, `.php`, `.py`)
- Archives (`.zip`, `.tar`, `.gz`)

### Size Limits

**Images**: 4MB
**Audio**: 10MB

**Enforcement**:

- Client-side: `MediaUpload` component
- Server-side: `/api/upload` endpoint
- Blob-side: Vercel Blob limits

## Audit Logging

### Compliance & Forensics

**All Admin Actions Logged**:

```typescript
model AuditLog {
  id         Int        @id @default(autoincrement())
  adminId    Int
  action     AdminAction
  entityType EntityType
  entityId   Int
  details    Json?
  createdAt  DateTime   @default(now())

  admin User @relation(fields: [adminId], references: [id])
}
```

**Logged Actions**:

- Game creation, updates, deletion
- Question management
- User bans/unbans
- Role changes
- Status changes

**Audit Review**:

- Navigate to `/admin/logs`
- Filter by admin, action, entity, date
- Export for compliance (planned)

### Immutable Logs

**Write-Only**:

- Logs cannot be edited
- Logs cannot be deleted (via UI)
- Database-level constraints (planned)

## Environment Variables

### Required Secrets

```bash
# Authentication
ADMIN_PASSWORD_HASH="$2a$10$..."   # bcrypt hash
ADMIN_SESSION_SECRET="..."         # 64-char random

# Database
DATABASE_URL="postgresql://..."    # Connection string

# File Storage
BLOB_READ_WRITE_TOKEN="vercel_..." # Vercel Blob

# Optional
NODE_ENV="production"              # Enables security features
```

### Secret Management

**Best Practices**:

1. **Never commit secrets to Git**
   - Use `.env.local` (gitignored)
   - Use Vercel Environment Variables UI
2. **Rotate secrets regularly**

   - Password hash: Annually
   - Session secret: Quarterly
   - Blob token: As needed

3. **Use strong randomness**

   ```bash
   openssl rand -hex 32  # Generate session secret
   ```

4. **Restrict access**
   - Limit who can view production secrets
   - Use separate secrets for staging/prod

## Rate Limiting (Recommended)

### Login Attempts

**Not Currently Implemented**

**Recommended**:

```typescript
// middleware.ts
const loginAttempts = new Map<string, number>();

export function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/admin/login" &&
    request.method === "POST"
  ) {
    const ip = request.ip || "unknown";
    const attempts = loginAttempts.get(ip) || 0;

    if (attempts > 5) {
      return new Response("Too many attempts", { status: 429 });
    }

    loginAttempts.set(ip, attempts + 1);
  }
}
```

### API Endpoints

**Vercel Functions**:

- 10 seconds timeout
- 50MB memory
- Auto-scales

**Recommended**: Use Vercel Edge Config for rate limiting

## HTTPS Enforcement

### Production

**Vercel Automatic**:

- Free SSL certificates
- Auto-renewal
- HTTP → HTTPS redirect

**Cookie Security**:

```typescript
secure: process.env.NODE_ENV === "production"; // HTTPS only
```

### Development

**Local Development**: HTTP allowed

**Recommendation**: Use `mkcert` for local HTTPS

## Data Privacy

### PII Handling

**User Data Stored**:

- Farcaster ID (FID)
- Username (optional)
- Wallet address
- Game activity

**Not Stored**:

- Email addresses
- Real names (unless in username)
- Payment details (handled by external provider)

### Data Retention

**Games**: Kept indefinitely
**Users**: Kept indefinitely
**Audit Logs**: Kept indefinitely (compliance)
**Tickets**: Kept indefinitely (financial records)

**Planned**: GDPR compliance tools

- User data export
- Right to be forgotten
- Data anonymization

## Vulnerability Disclosure

### Reporting Security Issues

**Contact**: [Your email/security contact]

**What to Report**:

- Authentication bypasses
- XSS vulnerabilities
- SQL injection
- CSRF vulnerabilities
- File upload exploits
- Privilege escalation

**Response Time**:

- Acknowledgment: 24 hours
- Triage: 3 days
- Fix: 7-14 days (severity-dependent)

### Bug Bounty (Planned)

**Scope**:

- Admin dashboard (`/admin/*`)
- Server actions
- API endpoints

**Out of Scope**:

- Third-party services (Vercel, Prisma)
- Public pages (not admin)

## Security Checklist

### Before Production

- [ ] Set strong `ADMIN_PASSWORD_HASH`
- [ ] Generate random `ADMIN_SESSION_SECRET` (64+ chars)
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Configure `secure: true` for cookies
- [ ] Review all environment variables
- [ ] Test authentication flow
- [ ] Verify audit logging works
- [ ] Check file upload restrictions
- [ ] Review user roles in database
- [ ] Enable error tracking (Sentry)
- [ ] Configure CSP headers (recommended)
- [ ] Set up rate limiting (recommended)

### Regular Maintenance

- [ ] Review audit logs weekly
- [ ] Monitor failed login attempts
- [ ] Check for unusual admin activity
- [ ] Update dependencies monthly (`pnpm update`)
- [ ] Rotate session secret quarterly
- [ ] Review admin user list monthly
- [ ] Test disaster recovery (backups)

## Known Limitations

1. **No 2FA**: Password-only authentication

   - **Mitigation**: Strong password required
   - **Roadmap**: TOTP support planned

2. **No Rate Limiting**: Unlimited requests

   - **Mitigation**: Vercel auto-scales
   - **Roadmap**: Edge Config rate limits planned

3. **No IP Whitelisting**: Any IP can access login

   - **Mitigation**: Edge middleware can add
   - **Roadmap**: Admin configurable IP allow-list

4. **No Audit Log Export**: Logs viewable only in UI
   - **Mitigation**: Database access for exports
   - **Roadmap**: CSV export planned

## Next Steps

- [Development Guide](./07-development.md)
- [API Reference](./05-api-reference.md)
