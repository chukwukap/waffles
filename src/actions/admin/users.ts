"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction, AdminAction, EntityType } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const updateUserStatusSchema = z.object({
  userId: z.number().int().positive(),
  status: z.enum(["NONE", "WAITLIST", "ACTIVE", "BANNED"]),
});

const adjustQuotaSchema = z.object({
  userId: z.number().int().positive(),
  quota: z.number().int().min(0),
});

export type UserActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Update user status (ACTIVE, BANNED, WAITLIST, NONE)
 */
export async function updateUserStatusAction(
  userId: number,
  status: "NONE" | "WAITLIST" | "ACTIVE" | "BANNED"
): Promise<UserActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  const validation = updateUserStatusSchema.safeParse({ userId, status });
  if (!validation.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    const action =
      status === "BANNED"
        ? AdminAction.BAN_USER
        : AdminAction.UPDATE_USER_STATUS;

    await logAdminAction({
      adminId: authResult.session.userId,
      action,
      entityType: EntityType.USER,
      entityId: userId,
      details: { newStatus: status, username: user.username },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Update user status error:", error);
    return { success: false, error: "Failed to update user status" };
  }
}

/**
 * Adjust user's invite quota
 */
export async function adjustInviteQuotaAction(
  userId: number,
  quota: number
): Promise<UserActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  const validation = adjustQuotaSchema.safeParse({ userId, quota });
  if (!validation.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { inviteQuota: quota },
    });

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.ADJUST_INVITE_QUOTA,
      entityType: EntityType.USER,
      entityId: userId,
      details: { newQuota: quota, username: user.username },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Adjust quota error:", error);
    return { success: false, error: "Failed to adjust invite quota" };
  }
}

/**
 * Promote user to admin
 */
export async function promoteToAdminAction(
  userId: number
): Promise<UserActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
    });

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.PROMOTE_TO_ADMIN,
      entityType: EntityType.USER,
      entityId: userId,
      details: { username: user.username },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Promote to admin error:", error);
    return { success: false, error: "Failed to promote user" };
  }
}
