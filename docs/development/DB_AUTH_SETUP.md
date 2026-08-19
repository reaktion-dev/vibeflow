# Database & Authentication Setup

This project uses **Drizzle ORM** for database management and **Better Auth** for authentication.

## Environment Variables

All environment variables are configured in `.env.local`:

```bash
# Database Connection (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:npg_nRZDlx5Ph2YA@ep-late-band-b1zejv1f.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Better Auth Configuration
BETTER_AUTH_SECRET="611afdfd98685b05d758d45077a66767fd94c6fc8ffb3f2f86d3d3295dedff7c"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string (provided)
- `BETTER_AUTH_SECRET` - Secret key for signing auth tokens (generated)
- `NEXT_PUBLIC_APP_URL` - Your app's public URL (used by auth)

## Database Setup

### 1. Generate Initial Migration

This creates the database schema based on `lib/db/schema.ts`:

```bash
npm run db:generate
```

This will create a migration file in the `migrations/` directory.

### 2. Push Schema to Database

```bash
npm run db:push
```

This applies the migration to your Neon PostgreSQL database and creates all tables (users, sessions, accounts, verifications, projects, files, chat_messages).

### 3. View Database (Optional)

Open Drizzle Studio to browse and manage your database:

```bash
npm run db:studio
```

## Database Schema

### Authentication Tables (Better Auth)
- **user** - User accounts
- **session** - Active sessions
- **account** - OAuth and password accounts
- **verification** - Email verification tokens

### Application Tables
- **project** - Development projects (linked to users)
- **file** - Project files
- **chat_message** - AI chat history per project

## Authentication Features

### Available Out of the Box
- ✅ Email/password sign-up and login
- ✅ Email verification
- ✅ Password reset flow
- ✅ Session management
- ✅ Protected routes

### Optional OAuth Providers
Add these environment variables to enable social login:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

Then uncomment the provider config in `lib/auth.ts`.

## API Endpoints

Better Auth automatically creates these endpoints at `/api/auth`:

- `POST /api/auth/sign-up` - Create new account
- `POST /api/auth/sign-in/email` - Login with email/password
- `POST /api/auth/sign-out` - Logout
- `POST /api/auth/send-verification-email` - Send verification
- `GET /api/auth/session` - Get current session
- `POST /api/auth/forgot-password` - Start password reset

## Usage in Components

### Client-Side

```typescript
"use client";

import { useSession } from "@/lib/auth-client";

export function Profile() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Not logged in</div>;

  return <div>Hello, {session.user.name}</div>;
}
```

### Server-Side

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user;
}
```

## Development Workflow

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Make schema changes** in `lib/db/schema.ts`

3. **Generate migration:**
   ```bash
   npm run db:generate
   ```

4. **Push to database:**
   ```bash
   npm run db:push
   ```

## Production Deployment

For production:

1. Update `.env.local` with production values
2. Set `BETTER_AUTH_SECRET` to a new secure random value
3. Update `NEXT_PUBLIC_APP_URL` to your production domain
4. Run `npm run db:push` on first deploy
5. Deploy application normally

## Troubleshooting

### "DATABASE_URL not found"
Ensure `.env.local` is in the project root and contains `DATABASE_URL`.

### "Connection refused"
Check that your Neon PostgreSQL connection string is correct and the database is accessible.

### "SSL Error" 
Neon requires SSL. The connection string includes `?sslmode=require` which is handled automatically.

### Authentication not working
Ensure `BETTER_AUTH_SECRET` is set and matches between sessions. Generate a new one if needed:
```bash
openssl rand -hex 32
```

## References

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Better Auth Docs](https://www.better-auth.com/)
- [Neon PostgreSQL Docs](https://neon.tech/docs/)
