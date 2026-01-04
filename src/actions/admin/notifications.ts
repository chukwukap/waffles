"use server";

import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction, EntityType } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import {
  sendBatch,
  countUsersWithTokens,
  sendToUser,
  type UserFilter,
} from "@/lib/notifications";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

// Validation schema
const notificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(65, "Title max 65 chars"),
  body: z.string().min(1, "Body is required").max(240, "Body max 240 chars"),
  targetUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  audience: z.enum(["all", "active", "waitlist", "single", "no_quests"]),
  targetFid: z.string().optional(),
});

export type NotificationResult =
  | {
      success: true;
      total: number;
      sent: number;
      failed: number;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Get count of users who can receive notifications
 */
export async function getAudienceCount(
  audience: "all" | "active" | "waitlist" | "no_quests"
): Promise<number> {
  return countUsersWithTokens(audience);
}

/**
 * Send admin notification to users
 */
export async function sendAdminNotificationAction(
  _prevState: NotificationResult | null,
  formData: FormData
): Promise<NotificationResult> {
  // Verify admin session
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  // Parse and validate form data
  const rawData = {
    title: formData.get("title") as string,
    body: formData.get("body") as string,
    targetUrl: formData.get("targetUrl") as string,
    audience: formData.get("audience") as string,
    targetFid: formData.get("targetFid") as string,
  };

  const validation = notificationSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { title, body, targetUrl, audience, targetFid } = validation.data;

  // Default target URL to game page
  const finalTargetUrl = targetUrl || `${env.rootUrl}/game`;

  try {
    let results: { total: number; success: number; failed: number };

    console.log("[AdminNotification] Starting send:", {
      title,
      audience,
      targetFid: audience === "single" ? targetFid : undefined,
      targetUrl: finalTargetUrl,
    });

    if (audience === "single" && targetFid) {
      // Send to single user
      const fid = parseInt(targetFid, 10);
      if (isNaN(fid)) {
        console.error("[AdminNotification] Invalid FID:", targetFid);
        return { success: false, error: "Invalid FID" };
      }

      const result = await sendToUser(fid, {
        title,
        body,
        targetUrl: finalTargetUrl,
      });

      results = {
        total: 1,
        success: result.state === "success" ? 1 : 0,
        failed: result.state !== "success" ? 1 : 0,
      };
    } else {
      // Send to filtered audience using new batch function
      const filter: UserFilter =
        audience === "single" ? "all" : (audience as UserFilter);
      const bulkResults = await sendBatch(
        {
          title,
          body,
          targetUrl: finalTargetUrl,
        },
        filter
      );

      results = {
        total: bulkResults.total,
        success: bulkResults.success,
        failed:
          bulkResults.failed +
          bulkResults.invalidTokens +
          bulkResults.rateLimited,
      };

      console.log("[AdminNotification] Batch send complete:", bulkResults);
    }

    // Log admin action
    await logAdminAction({
      adminId: authResult.session.userId,
      action: "SEND_NOTIFICATION",
      entityType: EntityType.SYSTEM,
      details: {
        type: "notification",
        title,
        audience,
        targetFid: audience === "single" ? targetFid : undefined,
        results,
      },
    });

    revalidatePath("/admin/notifications");

    return {
      success: true,
      total: results.total,
      sent: results.success,
      failed: results.failed,
    };
  } catch (error) {
    console.error("[AdminNotification] Error:", error);
    return { success: false, error: "Failed to send notifications" };
  }
}

/**
 * Get recent notifications sent by admins
 */
export async function getRecentNotifications(limit: number = 10) {
  return prisma.auditLog.findMany({
    where: {
      action: "SEND_NOTIFICATION",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    include: {
      admin: {
        select: {
          username: true,
          pfpUrl: true,
        },
      },
    },
  });
}
