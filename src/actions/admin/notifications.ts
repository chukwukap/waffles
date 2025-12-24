"use server";

import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction, EntityType } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import {
  sendBulkNotifications,
  getNotificationEnabledUserCount,
  sendMiniAppNotification,
} from "@/lib/notifications";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { WAFFLE_FID } from "@/lib/constants";

// Validation schema
const notificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(65, "Title max 65 chars"),
  body: z.string().min(1, "Body is required").max(240, "Body max 240 chars"),
  targetUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  audience: z.enum(["all", "active", "waitlist", "single"]),
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
  audience: "all" | "active" | "waitlist"
): Promise<number> {
  return getNotificationEnabledUserCount(audience);
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
    title: formData.get("title"),
    body: formData.get("body"),
    targetUrl: formData.get("targetUrl") || "",
    audience: formData.get("audience"),
    targetFid: formData.get("targetFid") || undefined,
  };

  const validation = notificationSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid input",
    };
  }

  const { title, body, targetUrl, audience, targetFid } = validation.data;

  // Default target URL to app home
  const finalTargetUrl = targetUrl || env.rootUrl || "https://waffles.fun";

  // Use Waffle app FID from constants
  const appFid = WAFFLE_FID;

  try {
    let results: { total: number; success: number; failed: number };

    if (audience === "single" && targetFid) {
      // Send to single user
      const fid = parseInt(targetFid, 10);
      if (isNaN(fid)) {
        return { success: false, error: "Invalid FID" };
      }

      const result = await sendMiniAppNotification({
        fid,
        appFid,
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
      // Send to filtered audience
      const filter = audience === "single" ? "all" : audience;
      const bulkResults = await sendBulkNotifications({
        title,
        body,
        targetUrl: finalTargetUrl,
        appFid,
        filter,
      });

      results = {
        total: bulkResults.total,
        success: bulkResults.success,
        failed:
          bulkResults.failed + bulkResults.noToken + bulkResults.rateLimited,
      };
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
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send notifications",
    };
  }
}

/**
 * Get recent notification sends from audit log
 */
export async function getRecentNotifications(limit = 10) {
  return prisma.auditLog.findMany({
    where: {
      action: "SEND_NOTIFICATION",
      details: {
        path: ["type"],
        equals: "notification",
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      admin: {
        select: {
          username: true,
        },
      },
    },
  });
}
