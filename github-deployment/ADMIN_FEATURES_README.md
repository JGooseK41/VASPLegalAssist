# Admin Portal & New Features

This update adds comprehensive admin functionality, a FAQ page, and VASP submission system.

## New Features

### 1. Admin Portal
- **Dashboard**: Overview of system statistics
- **VASP Management**: Add, edit, and deactivate VASPs
- **User Management**: Approve new users, manage roles
- **Submission Review**: Approve/reject user-submitted VASPs

### 2. FAQ Page
- Comprehensive help documentation
- Searchable FAQ sections
- Step-by-step guides for all features

### 3. VASP Submission System
- Members can submit new VASP information
- Pending submissions require admin approval
- Track submission status
- Edit pending submissions

## Database Migration

Run these commands to update your database:

```bash
cd backend

# Run the comments migration first (if not already done)
npx prisma db execute --file prisma/migrations/add_comments_and_votes.sql

# Run the admin features migration
npx prisma db execute --file prisma/migrations/add_admin_features.sql

# Generate Prisma client
npx prisma generate
```

Or use Prisma migrate:

```bash
cd backend
npx prisma migrate dev --name add_admin_features
```

## Access Control

### Admin Users
- Access to Admin Portal via navigation menu
- Can manage VASPs, users, and submissions
- Full CRUD operations on all resources

### Regular Users
- Can submit VASPs for review
- Can view and manage their own submissions
- Can add comments and vote on VASPs
- Cannot access admin functions

## New Routes

### Frontend Routes
- `/admin/*` - Admin portal (requires admin role)
- `/faq` - FAQ/Help page
- `/submissions/new` - Submit new VASP
- `/submissions/my` - View my submissions

### Backend API Routes
- `/api/admin/stats` - Dashboard statistics
- `/api/admin/vasps` - VASP management
- `/api/admin/users` - User management
- `/api/admin/submissions` - Submission management
- `/api/submissions/*` - User submission endpoints

## User Approval System

New users now require admin approval:
1. User registers with badge/agency info
2. Account is created but marked as not approved
3. Admin reviews and approves/rejects in User Management
4. User receives notification and can log in after approval

## Testing Admin Features

1. Create an admin user by updating a user's role in the database:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```

2. Log in with the admin account
3. Access Admin Portal from the navigation menu
4. Test all admin functions:
   - View dashboard statistics
   - Add/edit VASPs
   - Approve pending users
   - Review VASP submissions

## Security Notes

- Admin endpoints require both authentication and admin role
- Regular users cannot access admin functions
- All actions are logged with user IDs
- Sensitive operations require confirmation