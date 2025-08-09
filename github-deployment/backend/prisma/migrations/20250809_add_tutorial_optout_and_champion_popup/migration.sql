-- Add tutorial opt-out and champion popup tracking
ALTER TABLE "User" ADD COLUMN "tutorialOptOut" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN "lastChampionPopupShown" TIMESTAMP;