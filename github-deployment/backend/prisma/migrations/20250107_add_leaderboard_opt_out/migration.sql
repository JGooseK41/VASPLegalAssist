-- Add leaderboard opt-out preference to User
ALTER TABLE "User" 
ADD COLUMN "leaderboardOptOut" BOOLEAN DEFAULT false;