-- Make badgeNumber optional as not all law enforcement personnel have badge numbers
ALTER TABLE "User" ALTER COLUMN "badgeNumber" DROP NOT NULL;