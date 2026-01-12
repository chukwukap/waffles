"use server";

import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction, EntityType } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { sendBatch, countUsersWithTokens } from "@/lib/notifications";
import {
  AUDIENCES,
  getAudienceUrl,
  type AudienceId,
} from "@/lib/notifications/audiences";

// Validation schema - simplified: just title, body, audience
const notificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(65, "Title max 65 chars"),
  body: z.string().min(1, "Body is required").max(240, "Body max 240 chars"),
  audience: z.enum(["all", "active", "waitlist", "no_quests"]),
});

export type NotificationResult =
  | { success: true; total: number; sent: number; failed: number }
  | { success: false; error: string };

/**
 * Get count of users who can receive notifications for an audience
 */
export async function getAudienceCount(audience: AudienceId): Promise<number> {
  const config = AUDIENCES[audience];
  return countUsersWithTokens(config.filter);
}

/**
 * Send admin notification to users
 */
export async function sendAdminNotificationAction(
  _prevState: NotificationResult | null,
  formData: FormData
): Promise<NotificationResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  const rawData = {
    title: formData.get("title") as string,
    body: formData.get("body") as string,
    audience: formData.get("audience") as string,
  };

  const validation = notificationSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { title, body, audience } = validation.data;

  // Get target URL from audience config
  const targetUrl = getAudienceUrl(audience);
  const config = AUDIENCES[audience];

  try {
    console.log("[AdminNotification] Sending:", { title, audience, targetUrl });

    const results = await sendBatch({ title, body, targetUrl }, config.filter);

    // Log admin action
    await logAdminAction({
      adminId: authResult.session.userId,
      action: "SEND_NOTIFICATION",
      entityType: EntityType.SYSTEM,
      details: {
        title,
        audience,
        targetUrl,
        results: {
          total: results.total,
          success: results.success,
          failed: results.failed + results.invalidTokens + results.rateLimited,
        },
      },
    });

    revalidatePath("/admin/notifications");

    return {
      success: true,
      total: results.total,
      sent: results.success,
      failed: results.failed + results.invalidTokens + results.rateLimited,
    };
  } catch (error) {
    console.error("[AdminNotification] Error:", error);
    return { success: false, error: "Failed to send notifications" };
  }
}
