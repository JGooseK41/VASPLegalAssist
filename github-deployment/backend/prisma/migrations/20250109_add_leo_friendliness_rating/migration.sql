-- Add leoFriendlinessRating to VaspResponse
ALTER TABLE "VaspResponse" ADD COLUMN "leoFriendlinessRating" INTEGER;

-- Add constraint to ensure rating is between 1 and 10
ALTER TABLE "VaspResponse" ADD CONSTRAINT "VaspResponse_leoFriendlinessRating_check" CHECK ("leoFriendlinessRating" IS NULL OR ("leoFriendlinessRating" >= 1 AND "leoFriendlinessRating" <= 10));