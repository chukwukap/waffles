import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/user?farcasterId=123
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const farcasterId = searchParams.get("farcasterId");

  if (!farcasterId) {
    return NextResponse.json(
      { success: false, error: "Missing farcasterId parameter" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { farcasterId: farcasterId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("User get failed", err);
    return NextResponse.json(
      { success: false, error: "User get failed" },
      { status: 500 }
    );
  }
}
