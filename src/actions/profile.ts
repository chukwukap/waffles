"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { User } from "@prisma/client";

const updateProfileSchema = z
  .object({
    fid: z.number().int().positive("Invalid FID format."),
    name: z
      .string()
      .trim()
      .min(1, "Name cannot be empty.")
      .optional()
      .nullable(),
    wallet: z.string().trim().optional().nullable(),
    imageUrl: z.string().url("Invalid image URL.").optional().nullable(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.wallet !== undefined ||
      data.imageUrl !== undefined,
    {
      message:
        "At least one field (name, wallet, or imageUrl) must be provided for update.",
    }
  );

type UpdatedUserProfile = Pick<
  User,
  "id" | "name" | "wallet" | "imageUrl" | "fid"
>;

// Result type for the action
export type UpdateProfileResult =
  | { success: true; user: UpdatedUserProfile }
  | { success: false; error: string | z.ZodIssue[] };

/**
 * Server Action to update a user's profile information (name, wallet, imageUrl).
 */
export async function updateProfileAction(
  input: z.input<typeof updateProfileSchema>
): Promise<UpdateProfileResult> {
  const validation = updateProfileSchema.safeParse(input);
  if (!validation.success) {
    console.warn(
      "updateProfileAction validation failed:",
      validation.error.flatten()
    );
    return { success: false, error: validation.error.issues };
  }
  const { fid, ...updateData } = validation.data;

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: "No update data provided." };
  }
  const filteredUpdateData = Object.entries(updateData).reduce(
    (acc, [key, value]) => {
      if (value !== undefined) {
        acc[key as keyof typeof updateData] = value;
      }
      return acc;
    },
    {} as Partial<typeof updateData>
  );

  try {
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: filteredUpdateData,
      select: {
        id: true,
        name: true,
        wallet: true,
        imageUrl: true,
        fid: true,
      },
    });

    revalidatePath("/profile");

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("updateProfileAction Error:", error);
    return {
      success: false,
      error: "Failed to update profile due to a server error.",
    };
  }
}
