"use server";

import { z } from "zod";
import { createAdminAccount } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

const signupSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Admin signup action
 */
export async function signupAdminAction(
  _prevState: SignupResult | null,
  formData: FormData
): Promise<SignupResult> {
  const rawData = {
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validation = signupSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid input",
    };
  }

  const { username, password } = validation.data;

  // Create admin account
  const result = await createAdminAccount(username, password);

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Failed to create admin account",
    };
  }

  // Redirect to login page on success
  redirect("/admin/login?signup=success");
}
