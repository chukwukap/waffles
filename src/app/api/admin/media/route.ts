import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    // Authenticate admin
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // List all blobs
    const { blobs } = await list();

    // Format the response
    const files = blobs.map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      contentType: (blob as any).contentType || "application/octet-stream",
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Failed to list media files:", error);
    return NextResponse.json(
      { error: "Failed to fetch media files" },
      { status: 500 }
    );
  }
}
