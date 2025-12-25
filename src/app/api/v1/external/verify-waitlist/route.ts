import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/v1/external/verify-waitlist
 *
 * Secure endpoint for external apps (like FOF) to verify if a user
 * is on the Waffles waitlist.
 *
 * Security measures:
 * - API key validation (X-API-Key header)
 * - Rate limiting via Vercel/Cloudflare (not in code)
 * - Input validation
 * - Minimal data exposure
 *
 * Query params:
 *   - fid: Farcaster ID to check
 *
 * Headers:
 *   - X-API-Key: Required API key for external access
 *
 * Response:
 *   - { onWaitlist: boolean, points: number }
 */

// Allowed origins for CORS (add your domains)
const ALLOWED_ORIGINS = [
  "https://fof.waffles.fyi",
  "http://localhost:3000",
  "http://localhost:3001",
];

// Validate API key for external access
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("X-API-Key");
  const expectedKey = process.env.EXTERNAL_API_KEY;

  // If no key configured, allow (dev mode) but log warning
  if (!expectedKey) {
    console.warn(
      "EXTERNAL_API_KEY not configured - allowing unauthenticated access"
    );
    return true;
  }

  return apiKey === expectedKey;
}

// Add CORS headers
function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

// Handle OPTIONS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("Origin");
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("Origin");

  try {
    // 1. Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    // 2. Validate FID parameter
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get("fid");

    if (!fidParam) {
      return NextResponse.json(
        { error: "Missing fid parameter" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const fid = parseInt(fidParam, 10);
    if (isNaN(fid) || fid <= 0 || fid > 2147483647) {
      return NextResponse.json(
        { error: "Invalid fid parameter" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // 3. Look up user by FID (minimal data exposure)
    const user = await prisma.user.findUnique({
      where: { fid },
      select: {
        joinedWaitlistAt: true,
        waitlistPoints: true,
      },
    });

    // 4. Return minimal response
    const onWaitlist =
      user?.joinedWaitlistAt !== null && user?.joinedWaitlistAt !== undefined;

    return NextResponse.json(
      {
        onWaitlist,
        points: user?.waitlistPoints ?? 0,
      },
      { headers: corsHeaders(origin) }
    );
  } catch (error) {
    console.error("Error verifying waitlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
