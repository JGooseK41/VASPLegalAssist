-- Add indexes to improve contributor score calculation performance
-- These indexes will help with the aggregation queries in the contributor controller

-- Index for faster filtering of approved VASP submissions by user
CREATE INDEX IF NOT EXISTS idx_vasp_submission_user_status ON "VaspSubmission" ("userId", "status");

-- Index for faster aggregation of comment vote scores by user
CREATE INDEX IF NOT EXISTS idx_vasp_comment_user_score ON "VaspComment" ("userId", "voteScore");

-- Index for faster counting of upvotes by user
CREATE INDEX IF NOT EXISTS idx_comment_vote_user_value ON "CommentVote" ("userId", "value");

-- Composite index for excluding admin users from queries
CREATE INDEX IF NOT EXISTS idx_user_role ON "User" ("role");