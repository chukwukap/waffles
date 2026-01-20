import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SignJWT } from "jose";
import { env } from "@/lib/env";

const SERVICE = "party-token-api";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/auth/party-token
 * Issues a short-lived JWT for connecting to PartyKit
 */
export const GET = withAuth(async (request, auth: AuthResult) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        fid: true,
        username: true,
        pfpUrl: true,
      },
    });

    if (!user) {
      console.warn("["+SERVICE+"]", "token_user_not_found", {
        userId: auth.userId,
      });
      return NextResponse.json<ApiError>(
        { error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const secret = env.partykitSecret;
    if (!secret) {
      console.error("["+SERVICE+"]", "token_secret_missing", {
        message: "PARTYKIT_SECRET is not set",
      });
      return NextResponse.json<ApiError>(
        { error: "Server configuration error", code: "CONFIG_ERROR" },
        { status: 500 }
      );
    }

    // Sign a JWT
    const token = await new SignJWT({
      fid: user.fid,
      username: user.username,
      pfpUrl: user.pfpUrl,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h") // Token valid for 1 hour
      .sign(new TextEncoder().encode(secret));

    console.log("["+SERVICE+"]", "token_issued", {
      fid: user.fid,
      username: user.username,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("["+SERVICE+"]", "token_error", {
      userId: auth.userId,
      error: (error instanceof Error ? error.message : String(error)),
    });
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
});
