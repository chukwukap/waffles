import { createClient, Errors } from "@farcaster/quick-auth";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

const client = createClient();

/**
 * Extract domain from rootUrl (e.g., "https://example.com" -> "example.com")
 */
function getDomain(): string {
  try {
    const url = new URL(env.rootUrl);
    return url.hostname;
  } catch {
    // Fallback for localhost
    return "localhost:3000";
  }
}

const domain = getDomain();

/**
 * Auth API endpoint that verifies JWT tokens and returns the authenticated user's FID
 */
export async function GET(request: NextRequest) {
  const authorization = request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authorization.split(" ")[1];

  try {
    const payload = await client.verifyJwt({ token, domain });

    return NextResponse.json({
      fid: payload.sub,
    });
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    throw e;
  }
}
