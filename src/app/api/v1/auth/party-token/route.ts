import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SignJWT } from "jose";

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
      return NextResponse.json<ApiError>(
        { error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const secret = process.env.PARTYKIT_SECRET;
    if (!secret) {
      console.error("PARTYKIT_SECRET is not set");
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

    return NextResponse.json({ token });
  } catch (error) {
    console.error("GET /api/v1/auth/party-token Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
});
