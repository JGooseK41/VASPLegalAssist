# VASP Comments Feature

This feature adds a commenting system to VASP cards where members can share updates and experiences about VASPs.

## Features Added

1. **Comments Section**: Each VASP card now has an expandable comments section
2. **Update Notifications**: Members can mark comments as "updates" to notify others of changes
3. **Voting System**: Comments can be upvoted/downvoted to surface the most helpful information
4. **Auto-sorting**: Comments are sorted by vote score (highest first) and then by date
5. **Edit/Delete**: Users can edit or delete their own comments

## Database Migration

Run the following commands to update your database:

```bash
cd backend
npx prisma migrate dev --name add_comments_and_votes
```

Or if you prefer to run the SQL directly:

```bash
cd backend
npx prisma db execute --file prisma/migrations/add_comments_and_votes.sql
npx prisma generate
```

## Testing the Feature

1. Navigate to the VASP Search page
2. Each VASP card now has a "Member Comments" section at the bottom
3. Click to expand the comments section
4. Add a comment (optionally mark it as an update)
5. Vote on comments using the thumbs up/down buttons
6. Edit or delete your own comments

## API Endpoints Added

- `GET /api/comments/vasp/:vaspId` - Get all comments for a VASP
- `POST /api/comments/vasp/:vaspId` - Create a new comment
- `PUT /api/comments/:commentId` - Update a comment
- `DELETE /api/comments/:commentId` - Delete a comment
- `POST /api/comments/:commentId/vote` - Vote on a comment

## Component Structure

- `/src/components/comments/VaspComments.js` - Main comment component
- `/backend/controllers/commentController.js` - Backend comment logic
- `/backend/routes/comments.js` - Comment API routes