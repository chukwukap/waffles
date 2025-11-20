import { z } from "zod";

// --- Common Schemas ---
export const fidSchema = z.number().int().positive("Invalid FID format.");
export const walletSchema = z.string().trim().optional().nullable();
export const usernameSchema = z
  .string()
  .trim()
  .min(1, "Username cannot be empty.")
  .optional()
  .nullable();
export const pfpUrlSchema = z
  .string()
  .pipe(z.url("Invalid PFP URL."))
  .optional()
  .nullable();

// --- Invite Schemas ---
export const validateReferralSchema = z.object({
  // The 6-character code the user entered
  code: z.string().trim().length(6, "Code must be 6 characters.").toUpperCase(),
  // The FID of the user *using* the code
  fid: fidSchema,
});

// --- Chat Schemas ---
export const sendMessageSchema = z.object({
  gameId: z.number().int().positive("Invalid Game ID."),
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty.")
    .max(500, "Message exceeds 500 characters."),
  fid: fidSchema,
});

// --- Onboarding Schemas ---
export const syncUserSchema = z.object({
  fid: z.number().int().positive("FID must be a positive integer."),
  username: usernameSchema,
  pfpUrl: pfpUrlSchema,
  wallet: walletSchema,
});
