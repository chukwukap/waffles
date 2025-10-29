"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidateTag } from "next/cache";

// Utility function: Remove or redact URLs from a string.
function sanitizeMessage(input: string): string {
  // This will remove any http(s):// or www. links and any URL-looking words
  // Replace URLs with "[link removed]"
  return input.replace(
    // Basic regex that covers most normal URL forms
    /((https?:\/\/|www\.)[^\s]+)/gi,
    "[link removed]"
  );
}

const sendMessageSchema = z.object({
  gameId: z.number().int().positive("Invalid Game ID."),
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty.")
    .max(500, "Message exceeds 500 characters."),
  fid: z.number().int().positive("Invalid FID format."),
});

export type SendMessageResult =
  | { success: true; messageId: number }
  | { success: false; error: string };

export async function sendMessageAction(
  input: z.input<typeof sendMessageSchema>
): Promise<SendMessageResult> {
  const validation = sendMessageSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message || "Invalid input.";
    console.warn(
      "sendMessageAction validation failed:",
      validation.error.issues
    );
    return { success: false, error: firstError };
  }

  const { gameId, message, fid } = validation.data;

  try {
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true },
    });
    if (!user) {
      return { success: false, error: "User not found." };
    }

    const gameExists = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    });
    if (!gameExists) {
      return { success: false, error: "Game not found." };
    }

    // Sanitize message to remove links
    const sanitizedMessage = sanitizeMessage(message);

    const chat = await prisma.chat.create({
      data: {
        userId: user.id,
        gameId,
        message: sanitizedMessage,
      },
      select: { id: true },
    });

    // Add revalidation for chat updates related to this game
    revalidateTag(`game-chat-${gameId}`);

    return { success: true, messageId: chat.id };
  } catch (error) {
    console.error("sendMessageAction Error:", error);
    return {
      success: false,
      error: "Failed to send message due to a server error.",
    };
  }
}
