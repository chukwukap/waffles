import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // 1. Authenticate the user
        const session = await getAdminSession();
        if (!session) {
          throw new Error("Unauthorized");
        }

        // 2. Limit file types and sizes (optional but recommended)
        // Example: only allow images up to 5MB
        // This is handled partly by client-side config but good to enforce here if needed

        return {
          allowedContentTypes: [
            // Images
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/avif",
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
          ],
          tokenPayload: JSON.stringify({
            userId: session.userId,
            username: session.username,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This is called via webhook after upload is complete
        // You can log the upload or update DB here if needed
        console.log("Upload completed:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // The webhook will retry 5 times if you return 400
    );
  }
}
