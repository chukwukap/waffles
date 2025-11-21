# Development Guide

## Getting Started

### Prerequisites

- **Node.js**: 18+ or 20+
- **pnpm**: 8+ (recommended) or npm/yarn
- **PostgreSQL**: 14+ (local or Docker)
- **Vercel Account**: For Blob storage (or use alternative)

### Initial Setup

1. **Clone Repository**:

   ```bash
   git clone <repo-url>
   cd frontend
   ```

2. **Install Dependencies**:

   ```bash
   pnpm install
   ```

3. **Set Up Database**:

   ```bash
   # Option 1: Docker
   docker run -d \
     --name waffles-db \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=waffles \
     -p 5432:5432 \
     postgres:14

   # Option 2: Local PostgreSQL
   createdb waffles
   ```

4. **Configure Environment**:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:

   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/waffles"
   ADMIN_PASSWORD_HASH="$(node -e 'console.log(require(\"bcryptjs\").hashSync(\"admin123\", 10))')"
   ADMIN_SESSION_SECRET="$(openssl rand -hex 32)"
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
   ```

5. **Run Migrations**:

   ```bash
   pnpm prisma migrate dev
   ```

6. **Seed Database** (Optional):

   ```bash
   pnpm prisma db seed
   ```

7. **Start Development Server**:

   ```bash
   pnpm dev
   ```

8. **Access Dashboard**:
   - Navigate to `http://localhost:3000/admin/login`
   - Use the password you hashed in step 4

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # Admin dashboard routes
│   │   │   ├── layout.tsx      # Admin layout with auth
│   │   │   ├── page.tsx        # Dashboard home
│   │   │   ├── games/          # Game management
│   │   │   ├── users/          # User management
│   │   │   ├── analytics/      # Analytics
│   │   │   ├── tickets/        # Ticket management
│   │   │   ├── logs/           # Audit logs
│   │   │   └── settings/       # System settings
│   │   ├── api/                # API routes
│   │   │   ├── upload/         # File upload endpoint
│   │   │   └── ...
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React components
│   │   ├── admin/              # Admin-specific
│   │   │   ├── Sidebar.tsx
│   │   │   ├── GameForm.tsx
│   │   │   ├── QuestionForm.tsx
│   │   │   ├── MediaUpload.tsx
│   │   │   └── ...
│   │   ├── ui/                 # Reusable UI
│   │   │   ├── Button.tsx
│   │   │   ├── Toaster.tsx
│   │   │   └── ...
│   │   └── providers/          # Context providers
│   ├── actions/                # Server actions
│   │   └── admin/
│   │       ├── games.ts
│   │       ├── questions.ts
│   │       └── users.ts
│   ├── lib/                    # Utilities
│   │   ├── admin-auth.ts       # Admin authentication
│   │   ├── auth.ts             # User authentication
│   │   ├── audit.ts            # Audit logging
│   │   └── db.ts               # Prisma client
│   └── styles/                 # Global styles
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Migration files
│   └── seed.ts                 # Seed script
├── public/                     # Static assets
├── doc/                        # Documentation
│   └── admin-dashboard/        # This documentation
├── .env.local                  # Local environment (gitignored)
├── .env.example                # Environment template
├── next.config.js              # Next.js config
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies
```

## Development Workflow

### Adding a New Feature

1. **Plan**: Document in `task.md` or create issue
2. **Branch**: Create feature branch
   ```bash
   git checkout -b feature/new-admin-feature
   ```
3. **Implement**: Write code following patterns
4. **Test**: Manual testing + build check
5. **Document**: Update relevant docs
6. **Commit**: Clear, descriptive messages
   ```bash
   git commit -m "Add game cloning feature to admin"
   ```
7. **Push & PR**: Create pull request with description

### Creating a New Admin Page

1. **Create Route**:

   ```bash
   mkdir -p src/app/admin/new-section
   touch src/app/admin/new-section/page.tsx
   ```

2. **Implement Page** (Server Component):

   ```tsx
   // src/app/admin/new-section/page.tsx
   import { prisma } from "@/lib/db";

   export default async function NewSectionPage() {
     const data = await prisma.model.findMany();

     return (
       <div>
         <h1>New Section</h1>
         {/* Render data */}
       </div>
     );
   }
   ```

3. **Add to Sidebar**:

   ```tsx
   // src/components/admin/Sidebar.tsx
   <Link href="/admin/new-section">
     <Icon className="h-5 w-5" />
     New Section
   </Link>
   ```

4. **Add Loading State** (Optional):
   ```tsx
   // src/app/admin/new-section/loading.tsx
   export default function Loading() {
     return <SkeletonUI />;
   }
   ```

### Adding a Server Action

1. **Create Action Function**:

   ```tsx
   // src/actions/admin/my-actions.ts
   "use server";

   import { z } from "zod";
   import { prisma } from "@/lib/db";
   import { requireAdminSession } from "@/lib/admin-auth";
   import { logAdminAction } from "@/lib/audit";
   import { revalidatePath } from "next/cache";

   const schema = z.object({
     field: z.string().min(1),
   });

   export async function myAction(formData: FormData) {
     // 1. Auth
     const { authenticated, session } = await requireAdminSession();
     if (!authenticated) {
       return { success: false, error: "Unauthorized" };
     }

     // 2. Validate
     const data = schema.parse({
       field: formData.get("field"),
     });

     // 3. Execute
     try {
       await prisma.model.create({ data });

       // 4. Audit
       await logAdminAction({
         adminId: session.userId,
         action: AdminAction.CREATE_MODEL,
         entityType: EntityType.MODEL,
         entityId: result.id,
       });

       // 5. Revalidate
       revalidatePath("/admin/my-section");

       return { success: true };
     } catch (error) {
       console.error("Action failed:", error);
       return { success: false, error: "Operation failed" };
     }
   }
   ```

2. **Use in Form**:

   ```tsx
   // src/app/admin/my-section/page.tsx
   import { myAction } from "@/actions/admin/my-actions";

   export default function Page() {
     return (
       <form action={myAction}>
         <input name="field" />
         <button type="submit">Submit</button>
       </form>
     );
   }
   ```

### Database Schema Changes

1. **Modify Schema**:

   ```prisma
   // prisma/schema.prisma
   model NewModel {
     id        Int      @id @default(autoincrement())
     field     String
     createdAt DateTime @default(now())
   }
   ```

2. **Create Migration**:

   ```bash
   pnpm prisma migrate dev --name add_new_model
   ```

3. **Review Migration**:

   ```bash
   cat prisma/migrations/*/migration.sql
   ```

4. **Generate Client**:

   ```bash
   pnpm prisma generate
   ```

5. **Update TypeScript Types**:
   - Prisma auto-generates types
   - Import from `@prisma/client`

### Adding Audit Logging

1. **Define Action** (if new):

   ```typescript
   // src/lib/audit.ts
   export enum AdminAction {
     // ... existing
     NEW_ACTION = "NEW_ACTION",
   }
   ```

2. **Log in Server Action**:

   ```typescript
   await logAdminAction({
     adminId: session.userId,
     action: AdminAction.NEW_ACTION,
     entityType: EntityType.MODEL,
     entityId: modelId,
     details: { custom: "data" },
   });
   ```

3. **View in Logs**:
   - Navigate to `/admin/logs`
   - Filter by action type

## Testing

### Manual Testing Checklist

- [ ] Login flow works
- [ ] Session persists across page loads
- [ ] Logout clears session
- [ ] Unauthorized users redirected
- [ ] Forms validate input
- [ ] Success/error toasts appear
- [ ] Data persists to database
- [ ] Audit logs created
- [ ] File uploads work
- [ ] Images/audio display correctly
- [ ] Responsive on different screen sizes

### Build Testing

```bash
pnpm build
```

**Should complete without errors**

### Type Checking

```bash
pnpm tsc --noEmit
```

**Should complete without errors**

### Linting

```bash
pnpm lint
```

**Fix issues**:

```bash
pnpm lint --fix
```

## Debugging

### Common Issues

#### "Unauthorized" on Every Request

**Cause**: Session secret mismatch or missing

**Fix**:

```bash
# Ensure ADMIN_SESSION_SECRET is set
echo $ADMIN_SESSION_SECRET

# Regenerate if needed
openssl rand -hex 32 > .env.local
```

#### "Cannot find module '@prisma/client'"

**Cause**: Prisma client not generated

**Fix**:

```bash
pnpm prisma generate
```

#### Database Connection Failed

**Cause**: Invalid `DATABASE_URL`

**Fix**:

1. Check PostgreSQL is running
2. Verify credentials in `DATABASE_URL`
3. Test connection:
   ```bash
   psql $DATABASE_URL
   ```

#### File Uploads Fail

**Cause**: Missing or invalid `BLOB_READ_WRITE_TOKEN`

**Fix**:

1. Go to Vercel dashboard
2. Navigate to Storage → Blob
3. Generate new token
4. Update `.env.local`

### Debugging Tools

**Prisma Studio** (Database GUI):

```bash
pnpm prisma studio
```

**Next.js DevTools**:

- Installed automatically in dev mode
- View routes, components, server actions

**Console Logs**:

- Server logs: Terminal
- Client logs: Browser console
- Errors: Both locations

**React DevTools**:

- Install browser extension
- Inspect component tree
- Profile performance

## Performance Optimization

### Database Queries

**Use Proper Indexes**:

```prisma
model Game {
  @@index([status, startsAt])
  @@index([theme])
}
```

**Limit Fields**:

```typescript
// Bad: Fetches all fields
const games = await prisma.game.findMany();

// Good: Select only needed
const games = await prisma.game.findMany({
  select: { id: true, title: true, status: true },
});
```

**Use Pagination**:

```typescript
const games = await prisma.game.findMany({
  take: 20,
  skip: page * 20,
});
```

### Component Performance

**Use Server Components**:

- Default in App Router
- No client JavaScript for static content

**Client Components Only When Needed**:

```tsx
// ✓ Good: Server Component
export default async function GameList() {
  const games = await prisma.game.findMany();
  return <div>{games.map(...)}</div>;
}

// ✓ Good: Client Component for interactivity
"use client";
export function GameActions({ game }) {
  const [open, setOpen] = useState(false);
  return <Dropdown />;
}
```

**Lazy Load Heavy Components**:

```tsx
const HeavyChart = dynamic(() => import("./HeavyChart"), {
  loading: () => <Skeleton />,
});
```

### Caching

**Leverage Next.js Caching**:

```typescript
// Automatic caching
export const revalidate = 60; // Revalidate every 60s

// Manual revalidation after mutations
revalidatePath("/admin/games");
```

**Use Suspense Boundaries**:

```tsx
<Suspense fallback={<Loading />}>
  <SlowComponent />
</Suspense>
```

## Deployment

### Vercel Deployment

1. **Push to GitHub**:

   ```bash
   git push origin main
   ```

2. **Import on Vercel**:

   - Go to vercel.com
   - Click "New Project"
   - Import from GitHub
   - Configure environment variables

3. **Set Environment Variables**:

   - Copy all from `.env.local`
   - Add production database URL
   - Use strong production secrets

4. **Deploy**:
   - Auto-deploys on push
   - Preview deployments for branches

### Environment-Specific Config

**Production**:

```bash
DATABASE_URL="postgresql://prod-url"
ADMIN_PASSWORD_HASH="strong-hash"
ADMIN_SESSION_SECRET="production-secret"
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
NODE_ENV="production"
```

**Staging**:

```bash
DATABASE_URL="postgresql://staging-url"
ADMIN_PASSWORD_HASH="staging-hash"
ADMIN_SESSION_SECRET="staging-secret"
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
NODE_ENV="production"
```

**Development**:

```bash
DATABASE_URL="postgresql://localhost:5432/waffles"
ADMIN_PASSWORD_HASH="dev-hash"
ADMIN_SESSION_SECRET="dev-secret"
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
NODE_ENV="development"
```

### Database Migrations

**Production Deployment**:

```bash
# On Vercel, add to build script
pnpm prisma migrate deploy
```

**Best Practices**:

1. Test migrations on staging first
2. Backup production database before migrating
3. Use `migrate deploy` (not `migrate dev`) in production
4. Review SQL before applying

## Monitoring

### Application Monitoring

**Vercel Analytics** (Built-in):

- Page views
- Performance metrics
- Edge function calls

**Recommended**: Sentry for error tracking

```bash
pnpm add @sentry/nextjs
```

### Database Monitoring

**Prisma Logging**:

```typescript
// src/lib/db.ts
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});
```

**Query Performance**:

```bash
# Enable PostgreSQL slow query log
ALTER DATABASE waffles SET log_min_duration_statement = 100;
```

### Audit Log Monitoring

Navigate to `/admin/logs`:

- Review daily for suspicious activity
- Set up alerts for critical actions (planned)
- Export for compliance (planned)

## Contributing

### Code Style

**TypeScript**:

- Use strict mode
- Avoid `any` (use `unknown`)
- Export types explicitly

**React**:

- Functional components only
- Use hooks (not class components)
- Server Components by default
- Client Components only when needed

**CSS**:

- Tailwind classes preferred
- Avoid custom CSS when possible
- Use semantic class names

**Naming**:

- Components: PascalCase (`GameForm`)
- Functions: camelCase (`createGame`)
- Files: Match export (`GameForm.tsx`)
- Server Actions: `*Action` suffix

### Commit Messages

**Format**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructure
- `test`: Tests
- `chore`: Maintenance

**Examples**:

```bash
git commit -m "feat(admin): add game cloning feature"
git commit -m "fix(auth): prevent session race condition"
git commit -m "docs(api): update server action signatures"
```

### Pull Requests

**Template**:

```markdown
## Description

Brief description of changes

## Changes

- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing

- [ ] Manual testing completed
- [ ] Build passes
- [ ] No TypeScript errors
- [ ] Audit logs work

## Screenshots

(if UI changes)
```

## Troubleshooting Build Errors

### "Module not found"

**Fix**:

```bash
pnpm install
pnpm prisma generate
```

### "Type error in component"

**Fix**:

1. Check Prisma types are generated
2. Verify imports are correct
3. Run `pnpm tsc --noEmit` for details

### "Client/Server Component Mismatch"

**Fix**:

- Add `"use client"` to interactive components
- Ensure Server Components don't use hooks
- Don't pass callbacks to Server Components

## Further Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)

## Support

- **Documentation**: This doc folder
- **Code Comments**: Inline in source
- **Community**: [Your Discord/Slack]
- **Issues**: GitHub Issues
