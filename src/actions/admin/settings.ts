"use server";

import { hashPassword } from "@/lib/admin-auth";
import { z } from "zod";

const generateHashSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function generatePasswordHashAction(formData: FormData) {
  const password = formData.get("password");

  const validation = generateHashSchema.safeParse({ password });
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message,
    };
  }

  try {
    const hash = await hashPassword(validation.data.password);
    return {
      success: true,
      hash,
    };
  } catch (error) {
    console.error("Error generating hash:", error);
    return {
      success: false,
      error: "Failed to generate hash",
    };
  }
}
