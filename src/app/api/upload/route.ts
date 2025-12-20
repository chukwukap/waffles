import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import {
  uploadFile,
  generateFileKey,
  getPresignedUploadUrl,
  isBucketConfigured,
} from "@/lib/storage";

// Allowed content types
const ALLOWED_CONTENT_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
  "audio/webm",
  // Video
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/upload
 * Upload a file to Railway Bucket
 *
 * Option 1: Direct upload (multipart/form-data)
 * Option 2: Get presigned URL (application/json with { filename, contentType })
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Authenticate
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check bucket config
    if (!isBucketConfigured()) {
      return NextResponse.json(
        {
          error:
            "Storage not configured. Please set RAILWAY_BUCKET_* environment variables.",
        },
        { status: 500 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    // Option 2: JSON request for presigned URL
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const {
        filename,
        contentType: fileContentType,
        folder = "uploads",
      } = body;

      if (!filename || !fileContentType) {
        return NextResponse.json(
          { error: "Missing filename or contentType" },
          { status: 400 }
        );
      }

      if (!ALLOWED_CONTENT_TYPES.includes(fileContentType)) {
        return NextResponse.json(
          { error: "File type not allowed" },
          { status: 400 }
        );
      }

      const key = generateFileKey(filename, folder);
      const { uploadUrl, publicUrl } = await getPresignedUploadUrl({
        key,
        contentType: fileContentType,
      });

      return NextResponse.json({
        uploadUrl,
        publicUrl,
        key,
      });
    }

    // Option 1: Direct upload (multipart/form-data)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const folder = (formData.get("folder") as string) || "uploads";

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File too large. Maximum size is ${
              MAX_FILE_SIZE / 1024 / 1024
            }MB`,
          },
          { status: 400 }
        );
      }

      if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type '${file.type}' not allowed` },
          { status: 400 }
        );
      }

      const key = generateFileKey(file.name, folder);
      const buffer = Buffer.from(await file.arrayBuffer());

      const result = await uploadFile({
        key,
        body: buffer,
        contentType: file.type,
      });

      console.log(
        `[Upload] File uploaded: ${result.url} by ${session.username}`
      );

      return NextResponse.json({
        url: result.url,
        key: result.key,
        size: file.size,
        contentType: file.type,
      });
    }

    return NextResponse.json(
      {
        error:
          "Invalid content type. Use multipart/form-data or application/json",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Upload failed" },
      { status: 500 }
    );
  }
}
