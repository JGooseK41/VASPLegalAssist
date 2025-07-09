-- Set jesse@theblockaudit.com as MASTER_ADMIN
UPDATE "User" 
SET role = 'MASTER_ADMIN' 
WHERE email = 'jesse@theblockaudit.com';

-- Verify the update
SELECT id, email, role, "firstName", "lastName" 
FROM "User" 
WHERE email = 'jesse@theblockaudit.com';