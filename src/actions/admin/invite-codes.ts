"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";

// ============================================
// CODE GENERATION
// ============================================

const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // No 0/O, 1/I/L

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
}

// ============================================
// TYPES
// ============================================

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ============================================
// ACTIONS
// ============================================

/**
 * Generate a single invite code
 */
export async function generateInviteCodeAction(
  note?: string
): Promise<ActionResult<{ code: string; id: number }>> {
  const auth = await requireAdminSession();
  if (!auth.authenticated || !auth.session) {
    return { success: false, error: "Unauthorized" };
  }

  // Try up to 3 times in case of collision
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const code = generateCode();
      const inviteCode = await prisma.inviteCode.create({
        data: {
          code,
          note: note?.slice(0, 100) || null,
        },
      });

      revalidatePath("/admin/invite-codes");
      return {
        success: true,
        data: { code: inviteCode.code, id: inviteCode.id },
      };
    } catch (error: any) {
      // If unique constraint violation, retry
      if (error.code === "P2002") continue;
      throw error;
    }
  }

  return { success: false, error: "Failed to generate unique code" };
}

/**
 * Generate multiple invite codes
 */
export async function generateInviteCodesAction(
  count: number,
  note?: string
): Promise<ActionResult<{ codes: string[] }>> {
  const auth = await requireAdminSession();
  if (!auth.authenticated || !auth.session) {
    return { success: false, error: "Unauthorized" };
  }

  // Validate count
  const validation = z.number().int().min(1).max(100).safeParse(count);
  if (!validation.success) {
    return { success: false, error: "Count must be between 1 and 100" };
  }

  const codes: string[] = [];
  const noteValue = note?.slice(0, 100) || null;

  // Generate codes one by one (simpler, handles collisions naturally)
  for (let i = 0; i < count; i++) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const code = generateCode();
        await prisma.inviteCode.create({
          data: { code, note: noteValue },
        });
        codes.push(code);
        break;
      } catch (error: any) {
        if (error.code === "P2002") continue;
        throw error;
      }
    }
  }

  revalidatePath("/admin/invite-codes");
  return { success: true, data: { codes } };
}

/**
 * Delete an unused invite code
 */
export async function deleteInviteCodeAction(
  id: number
): Promise<ActionResult> {
  const auth = await requireAdminSession();
  if (!auth.authenticated || !auth.session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Check if code exists and is unused
    const code = await prisma.inviteCode.findUnique({
      where: { id },
      select: { usedById: true },
    });

    if (!code) {
      return { success: false, error: "Code not found" };
    }

    if (code.usedById) {
      return { success: false, error: "Cannot delete used code" };
    }

    await prisma.inviteCode.delete({ where: { id } });

    revalidatePath("/admin/invite-codes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting invite code:", error);
    return { success: false, error: "Failed to delete code" };
  }
}
