"use server";

import {
  listFilesWithUrls,
  deleteFile,
  isBucketConfigured,
  getFileMetadata,
  getPresignedDownloadUrl,
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
    // Use listFilesWithUrls to get presigned URLs
    const allFiles = await listFilesWithUrls();

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
 * Pass the file key (pathname), not the presigned URL
 */
export async function deleteMediaAction(
  pathname: string
): Promise<{ success: boolean; error?: string }> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isBucketConfigured()) {
    return { success: false, error: "Storage not configured" };
  }

  try {
    // pathname is the file key directly (e.g., "media/1766221974734-p4gw4g-football.svg")
    if (!pathname) {
      return { success: false, error: "Invalid file path" };
    }

    const deleted = await deleteFile(pathname);
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

/**
 * Get a presigned URL for a specific file
 */
export async function getMediaUrlAction(
  pathname: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isBucketConfigured()) {
    return { success: false, error: "Storage not configured" };
  }

  try {
    const url = await getPresignedDownloadUrl(pathname, 60 * 60 * 24 * 7); // 7 days
    return { success: true, url };
  } catch (error) {
    console.error("Get media URL error:", error);
    return { success: false, error: "Failed to get media URL" };
  }
}
