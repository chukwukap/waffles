"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction, AdminAction, EntityType } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const userIdSchema = z.object({
  userId: z.number().int().positive(),
});

const adjustQuotaSchema = z.object({
  userId: z.number().int().positive(),
  quota: z.number().int().min(0),
});

export type UserActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Grant game access to a user
 */
export async function grantGameAccessAction(
  userId: number
): Promise<UserActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  const validation = userIdSchema.safeParse({ userId });
  if (!validation.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        hasGameAccess: true,
        accessGrantedAt: new Date(),
        accessGrantedBy: authResult.session.userId,
      },
    });

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.UPDATE_USER_STATUS,
      entityType: EntityType.USER,
      entityId: userId,
      details: { action: "grant_access", username: user.username },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Grant game access error:", error);
    return { success: false, error: "Failed to grant game access" };
  }
}

/**
 * Ban a user
 */
export async function banUserAction(userId: number): Promise<UserActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  const validation = userIdSchema.safeParse({ userId });
  if (!validation.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedBy: authResult.session.userId,
      },
    });

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.BAN_USER,
      entityType: EntityType.USER,
      entityId: userId,
      details: { username: user.username },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Ban user error:", error);
    return { success: false, error: "Failed to ban user" };
  }
}

/**
 * Unban a user
 */
export async function unbanUserAction(
  userId: number
): Promise<UserActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  const validation = userIdSchema.safeParse({ userId });
  if (!validation.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedAt: null,
        bannedBy: null,
      },
    });

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.UPDATE_USER_STATUS,
      entityType: EntityType.USER,
      entityId: userId,
      details: { action: "unban", username: user.username },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Unban user error:", error);
    return { success: false, error: "Failed to unban user" };
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
