"use server";

import { z } from "zod";
import {
  verifyAdminCredentials,
  createAdminSession,
  destroyAdminSession,
  requireAdminSession,
} from "@/lib/admin-auth";
import { logAdminAction, AdminAction, EntityType } from "@/lib/audit";
import { redirect } from "next/navigation";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginResult = { success: true } | { success: false; error: string };

/**
 * Admin login action
 */
export async function loginAdminAction(
  _prevState: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const rawData = {
    username: formData.get("username"),
    password: formData.get("password"),
  };

  const validation = loginSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid input",
    };
  }

  const { username, password } = validation.data;

  // Verify credentials
  const result = await verifyAdminCredentials(username, password);
  if (!result.success || !result.session) {
    return {
      success: false,
      error: result.error || "Authentication failed",
    };
  }

  // Create session
  await createAdminSession(result.session);

  // Log login action
  await logAdminAction({
    adminId: result.session.userId,
    action: AdminAction.LOGIN,
    entityType: EntityType.SYSTEM,
  });

  redirect("/admin");
}

/**
 * Admin logout action
 */
export async function logoutAdminAction(): Promise<void> {
  const authResult = await requireAdminSession();

  if (authResult.authenticated && authResult.session) {
    // Log logout action
    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.LOGOUT,
      entityType: EntityType.SYSTEM,
    });
  }

  await destroyAdminSession();
  redirect("/admin/login");
}
