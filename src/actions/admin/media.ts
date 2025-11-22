"use server";

import { list, del } from "@vercel/blob";
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
 * List all uploaded media files
 */
export async function listMediaAction(): Promise<MediaActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const response = await list();

    const files: MediaFile[] = response.blobs.map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
      contentType: (blob as any).contentType || "application/octet-stream",
    }));

    return { success: true, files };
  } catch (error) {
    console.error("List media error:", error);
    return { success: false, error: "Failed to list media files" };
  }
}

/**
 * Delete a media file
 */
export async function deleteMediaAction(
  url: string
): Promise<{ success: boolean; error?: string }> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await del(url);
    revalidatePath("/admin/media");
    return { success: true };
  } catch (error) {
    console.error("Delete media error:", error);
    return { success: false, error: "Failed to delete media file" };
  }
}
