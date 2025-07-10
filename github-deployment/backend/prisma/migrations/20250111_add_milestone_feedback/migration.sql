-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastMilestoneShown" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MilestoneNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "milestone" INTEGER NOT NULL,
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "MilestoneNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributorFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "milestone" INTEGER NOT NULL,
    "discoverySource" TEXT NOT NULL,
    "suggestions" TEXT,
    "feedbackType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContributorFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MilestoneNotification_userId_idx" ON "MilestoneNotification"("userId");

-- CreateIndex
CREATE INDEX "MilestoneNotification_milestone_idx" ON "MilestoneNotification"("milestone");

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneNotification_userId_milestone_key" ON "MilestoneNotification"("userId", "milestone");

-- CreateIndex
CREATE INDEX "ContributorFeedback_userId_idx" ON "ContributorFeedback"("userId");

-- CreateIndex
CREATE INDEX "ContributorFeedback_milestone_idx" ON "ContributorFeedback"("milestone");

-- CreateIndex
CREATE INDEX "ContributorFeedback_createdAt_idx" ON "ContributorFeedback"("createdAt");

-- AddForeignKey
ALTER TABLE "MilestoneNotification" ADD CONSTRAINT "MilestoneNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorFeedback" ADD CONSTRAINT "ContributorFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;