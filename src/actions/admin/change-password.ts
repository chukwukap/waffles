"use server";

import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Change admin password action
 */
export async function changePasswordAction(
  _prevState: ChangePasswordResult | null,
  formData: FormData
): Promise<ChangePasswordResult> {
  // Verify admin session
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return {
      success: false,
      error: "Not authenticated",
    };
  }

  const validation = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid input",
    };
  }

  const { currentPassword, newPassword } = validation.data;

  try {
    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: authResult.session.userId },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      return {
        success: false,
        error: "User not found or password not set",
      };
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return {
        success: false,
        error: "Current password is incorrect",
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    return {
      success: false,
      error: "Failed to change password",
    };
  }
}
