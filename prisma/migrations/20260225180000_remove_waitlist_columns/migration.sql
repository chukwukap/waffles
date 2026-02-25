-- Remove legacy waitlist fields from users.
DROP INDEX IF EXISTS "User_waitlistPoints_idx";

ALTER TABLE "User"
  DROP COLUMN IF EXISTS "joinedWaitlistAt",
  DROP COLUMN IF EXISTS "waitlistPoints";
