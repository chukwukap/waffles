"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { Game } from "@prisma/client";

const createGameSchema = z
  .object({
    name: z.string().trim().min(1, "Game name cannot be empty."),
    description: z.string().trim().optional().nullable(),
    startTime: z.coerce.date({ message: "Invalid start date/time format." }),
    endTime: z.coerce.date({ message: "Invalid end date/time format." }),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

export type CreateGameResult =
  | { success: true; game: Game }
  | { success: false; error: string };

export async function createGameAction(
  input: z.input<typeof createGameSchema>
): Promise<CreateGameResult> {
  const validation = createGameSchema.safeParse(input);
  if (!validation.success) {
    console.warn(
      "createGameAction validation failed:",
      validation.error.message
    );
    return { success: false, error: validation.error.message };
  }
  const { name, description, startTime, endTime } = validation.data;

  try {
    const newGame = await prisma.game.create({
      data: {
        name,
        description,
        startTime,
        endTime,
      },
    });

    revalidatePath("/admin/games");
    revalidatePath("/api/game");

    return { success: true, game: newGame };
  } catch (error) {
    console.error("createGameAction Error:", error);
    return {
      success: false,
      error: "Failed to create game due to a server error.",
    };
  }
}
