-- Add email verification fields to User table
ALTER TABLE "User" ADD COLUMN "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "emailVerificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerificationExpiry" TIMESTAMP(3);

-- Create index for email verification token lookups
CREATE INDEX "User_emailVerificationToken_idx" ON "User"("emailVerificationToken");

-- Update existing users to have verified emails (since they're already using the system)
UPDATE "User" SET "isEmailVerified" = true WHERE "isApproved" = true;