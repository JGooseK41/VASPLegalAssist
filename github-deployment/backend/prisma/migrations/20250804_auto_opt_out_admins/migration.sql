-- Automatically opt out all admin users from leaderboard
UPDATE "User" 
SET "leaderboardOptOut" = true 
WHERE "role" IN ('ADMIN', 'MASTER_ADMIN') 
AND "leaderboardOptOut" = false;

-- Add a comment to document the business rule
COMMENT ON COLUMN "User"."leaderboardOptOut" IS 'When true, user is excluded from public leaderboards. Automatically set to true for ADMIN and MASTER_ADMIN roles.';