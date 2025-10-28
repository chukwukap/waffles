import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Schema to validate the 'farcasterId' query parameter
const querySchema = z.object({
  fid: z.number().int().positive("Invalid FID format."),
});

/**
 * GET handler to fetch basic user profile information based on Farcaster ID.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fidParam = searchParams.get("fid");

    const validationResult = querySchema.safeParse({
      fid: Number(fidParam),
    });
    if (!validationResult.success) {
      const firstError =
        validationResult.error.message || "Invalid FID format.";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }
    const { fid } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: { fid: Number(fid) },
      select: {
        id: true,
        fid: true,
        name: true,
        wallet: true,
        imageUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("GET /api/user Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Ensure dynamic execution for potentially updated user profiles
export const dynamic = "force-dynamic";
