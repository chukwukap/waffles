import { NextResponse } from "next/server";
import { verifyAuthToken, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface AuthResponse {
  authenticated: boolean;
  fid: number;
  userId: string;
}

/**
 * POST /api/v1/auth
 * Verify Quick Auth token and return user info
 *
 * This endpoint is used to verify that a token is valid
 * and get the authenticated user's FID and userId
 */
export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json<ApiError>(
        { error: "Authorization header required", code: "MISSING_AUTH" },
        { status: 401 }
      );
    }

    const token = authorization.split(" ")[1];
    const fid = await verifyAuthToken(token);

    if (!fid) {
      return NextResponse.json<ApiError>(
        { error: "Invalid or expired token", code: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    // Look up user
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true, fid: true },
    });

    if (!user) {
      return NextResponse.json<ApiError>(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const response: AuthResponse = {
      authenticated: true,
      fid: user.fid,
      userId: user.id,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("POST /api/v1/auth Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
