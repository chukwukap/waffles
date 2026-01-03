import { cookies } from "next/headers";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

const SESSION_COOKIE_NAME = "admin-session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days in seconds

export interface AdminSession {
  userId: string;
  fid: number;
  username: string | null;
  pfpUrl: string | null;
  role: "ADMIN";
  expiresAt: number;
}

/**
 * Verify admin credentials and create session
 */
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; session?: AdminSession }> {
  try {
    // Find user by username (case-insensitive check could be added if needed, but strict for now)
    const user = await prisma.user.findFirst({
      where: { username },
      select: {
        id: true,
        fid: true,
        username: true,
        pfpUrl: true,
        role: true,
        password: true,
      },
    });

    if (!user) {
      return { success: false, error: "Invalid credentials" };
    }

    if (user.role !== "ADMIN") {
      return { success: false, error: "Access denied: Admin role required" };
    }

    // Check if password is set
    if (!user.password) {
      return {
        success: false,
        error: "Password not set. Please complete setup.",
      };
    }

    // Verify password against database hash
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return { success: false, error: "Invalid credentials" };
    }

    // Create session
    const session: AdminSession = {
      userId: user.id,
      fid: user.fid,
      username: user.username,
      pfpUrl: user.pfpUrl,
      role: "ADMIN",
      expiresAt: Date.now() + SESSION_DURATION * 1000,
    };

    return { success: true, session };
  } catch (error) {
    console.error("Admin auth error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

/**
 * Store session in HTTP-only cookie
 */
export async function createAdminSession(session: AdminSession): Promise<void> {
  const cookieStore = await cookies();
  const sessionData = JSON.stringify(session);

  cookieStore.set(SESSION_COOKIE_NAME, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

/**
 * Get current admin session from cookie
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const session: AdminSession = JSON.parse(sessionCookie.value);

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      // Note: Don't delete cookie here - can't modify cookies during render
      // Stale cookie is harmless since we always verify
      return null;
    }

    return session;
  } catch (error) {
    console.error("Failed to get admin session:", error);
    return null;
  }
}

/**
 * Verify current request is from an admin
 */
export async function requireAdminSession(): Promise<{
  authenticated: boolean;
  session?: AdminSession;
  error?: string;
}> {
  const session = await getAdminSession();

  if (!session) {
    return {
      authenticated: false,
      error: "Not authenticated",
    };
  }

  // Verify user still has admin role in database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    // Note: Don't delete cookie here - can't modify cookies during render
    // Stale cookie is harmless since we always verify against DB
    return {
      authenticated: false,
      error: "Admin access revoked",
    };
  }

  return {
    authenticated: true,
    session,
  };
}

/**
 * Destroy admin session
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Generate a random invite code
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create admin account with password
 */
export async function createAdminAccount(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user exists by username
    const existingUser = await prisma.user.findFirst({
      where: { username },
      select: { id: true, role: true, password: true },
    });

    if (!existingUser) {
      return {
        success: false,
        error: "User not found. Please sign up in the main app first.",
      };
    }

    // CRITICAL: Only allow if they are ALREADY an admin (manually assigned)
    if (existingUser.role !== "ADMIN") {
      return {
        success: false,
        error: "You must be manually assigned the Admin role first.",
      };
    }

    // If user exists with password, they're already signed up
    if (existingUser.password) {
      return {
        success: false,
        error: "Admin account already exists for this user",
      };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Update user with password
    await prisma.user.update({
      where: { id: existingUser.id }, // Use ID for update to be safe
      data: {
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Create admin account error:", error);
    return { success: false, error: "Failed to create admin account" };
  }
}

/**
 * Generate bcrypt hash for password (helper for setup)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
