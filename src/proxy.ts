import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect all admin routes except login
  if (path.startsWith("/admin") && path !== "/admin/login") {
    const sessionCookie = request.cookies.get("admin-session");

    if (!sessionCookie) {
      // Not authenticated, redirect to login
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      const session = JSON.parse(sessionCookie.value);

      // Check if session is expired
      if (session.expiresAt < Date.now()) {
        const response = NextResponse.redirect(
          new URL("/admin/login", request.url)
        );
        response.cookies.delete("admin-session");
        return response;
      }

      // Session is valid, allow request
      return NextResponse.next();
    } catch (error) {
      // Invalid session data, redirect to login
      const response = NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
      response.cookies.delete("admin-session");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
