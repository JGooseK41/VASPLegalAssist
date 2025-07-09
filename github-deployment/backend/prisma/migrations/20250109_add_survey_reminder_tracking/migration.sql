-- Add lastSurveyReminderShown field to track when survey reminder was last shown
ALTER TABLE "User" ADD COLUMN "lastSurveyReminderShown" TIMESTAMP(3);