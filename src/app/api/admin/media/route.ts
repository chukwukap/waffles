import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { listFiles, isBucketConfigured, getFileMetadata } from "@/lib/storage";

export async function GET() {
  try {
    // Authenticate admin
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check bucket config
    if (!isBucketConfigured()) {
      return NextResponse.json(
        { error: "Storage not configured", files: [] },
        { status: 200 }
      );
    }

    // List all files from Railway Bucket
    const allFiles = await listFiles();

    // Get content types for each file
    const files = await Promise.all(
      allFiles.map(async (file) => {
        const metadata = await getFileMetadata(file.key);
        return {
          url: file.url,
          pathname: file.key,
          contentType: metadata?.contentType || "application/octet-stream",
          size: file.size,
          uploadedAt: file.lastModified,
        };
      })
    );

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Failed to list media files:", error);
    return NextResponse.json(
      { error: "Failed to fetch media files" },
      { status: 500 }
    );
  }
}
