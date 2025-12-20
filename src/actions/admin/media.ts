"use server";

import {
  listFiles,
  deleteFile,
  isBucketConfigured,
  getFileMetadata,
} from "@/lib/storage";
import { requireAdminSession } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

export interface MediaFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  contentType: string;
}

export type MediaActionResult =
  | { success: true; files?: MediaFile[] }
  | { success: false; error: string };

/**
 * List all uploaded media files from Railway Bucket
 */
export async function listMediaAction(): Promise<MediaActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isBucketConfigured()) {
    return { success: false, error: "Storage not configured" };
  }

  try {
    const allFiles = await listFiles();

    const files: MediaFile[] = await Promise.all(
      allFiles.map(async (file) => {
        const metadata = await getFileMetadata(file.key);
        return {
          url: file.url,
          pathname: file.key,
          size: file.size,
          uploadedAt: file.lastModified,
          contentType: metadata?.contentType || "application/octet-stream",
        };
      })
    );

    return { success: true, files };
  } catch (error) {
    console.error("List media error:", error);
    return { success: false, error: "Failed to list media files" };
  }
}

/**
 * Delete a media file from Railway Bucket
 */
export async function deleteMediaAction(
  url: string
): Promise<{ success: boolean; error?: string }> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isBucketConfigured()) {
    return { success: false, error: "Storage not configured" };
  }

  try {
    // Extract key from URL
    // URL format: https://storage.railway.app/bucket-name/key
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    // Remove bucket name (first part) and get the rest as key
    const key = pathParts.slice(1).join("/");

    if (!key) {
      return { success: false, error: "Invalid file URL" };
    }

    const deleted = await deleteFile(key);
    if (!deleted) {
      return { success: false, error: "Failed to delete file" };
    }

    revalidatePath("/admin/media");
    return { success: true };
  } catch (error) {
    console.error("Delete media error:", error);
    return { success: false, error: "Failed to delete media file" };
  }
}
