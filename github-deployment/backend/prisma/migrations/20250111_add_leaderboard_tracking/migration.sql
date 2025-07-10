-- AlterTable
ALTER TABLE "User" ADD COLUMN "firstLeaderboardShown" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "currentLeaderboardStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "longestLeaderboardStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastOnLeaderboard" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "LeaderboardHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaderboardHistory_userId_idx" ON "LeaderboardHistory"("userId");

-- CreateIndex
CREATE INDEX "LeaderboardHistory_date_idx" ON "LeaderboardHistory"("date");

-- CreateIndex
CREATE INDEX "LeaderboardHistory_position_idx" ON "LeaderboardHistory"("position");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardHistory_userId_date_key" ON "LeaderboardHistory"("userId", "date");

-- AddForeignKey
ALTER TABLE "LeaderboardHistory" ADD CONSTRAINT "LeaderboardHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;