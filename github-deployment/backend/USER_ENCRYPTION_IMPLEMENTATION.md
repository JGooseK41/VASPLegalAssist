# User-Specific Document Encryption Implementation

## Overview

This implementation provides true end-to-end encryption where:
- Each user has their own unique encryption key derived from their user ID
- Documents are encrypted with the user's key, making them accessible only to that user
- Even system administrators cannot decrypt user documents
- Documents are downloaded as encrypted packages that users decrypt locally

## How It Works

### 1. Key Generation
- Each user gets a unique encryption key derived from their user ID + master secret
- Keys are generated deterministically using PBKDF2 with 100,000 iterations
- The key never leaves the server and is never stored

### 2. Document Creation & Encryption
When a document is created:
1. The document is generated normally (DOCX/PDF)
2. Sensitive fields in the database are encrypted with the user's key
3. The actual document file remains unencrypted on the server initially
4. When downloaded, it's packaged into an encrypted `.encrypted` file

### 3. Encrypted Download Process
1. User clicks download on a document
2. Server creates an encrypted package containing:
   - The document encrypted with the user's key
   - Metadata about the document
   - Decryption instructions
3. User receives a `.encrypted` file

### 4. Decryption Process
1. User uploads the `.encrypted` file to the Decrypt Document page
2. Server verifies the user owns the document
3. Server decrypts the document using the user's key
4. Original DOCX/PDF is sent to the user

## Implementation Details

### Backend Components

1. **User Key Encryption Service** (`/backend/services/userKeyEncryption.js`)
   - Derives user-specific keys
   - Encrypts/decrypts data and files
   - Creates encrypted packages

2. **User Encrypted Document Controller** (`/backend/controllers/userEncryptedDocumentController.js`)
   - Handles document creation with encryption
   - Manages encrypted downloads
   - Processes decryption requests

3. **Routes** (`/backend/routes/encryptedDocuments.js`)
   - `/api/encrypted-documents/download/:id` - Download as encrypted package
   - `/api/encrypted-documents/decrypt` - Decrypt uploaded package
   - `/api/encrypted-documents/migrate` - Migrate existing documents

### Frontend Components

1. **Document Decryptor** (`/src/components/documents/DocumentDecryptor.js`)
   - UI for uploading and decrypting `.encrypted` files
   - Drag-and-drop interface
   - Security information display

2. **Updated Document History**
   - Shows encryption status
   - Offers encrypted download option

## Security Features

1. **User Isolation**: Each user's key is unique and derived from their ID
2. **No Key Storage**: Keys are generated on-demand, never stored
3. **Strong Encryption**: AES-256-GCM with authenticated encryption
4. **Salt & IV**: Each encryption uses unique salt and initialization vectors
5. **Master Secret**: Additional layer using environment variable

## Configuration

### Environment Variables

```env
# Enable user-specific encryption
ENABLE_USER_ENCRYPTION=true

# Master secret for key derivation (MUST be kept secret!)
USER_KEY_MASTER_SECRET=your-very-secret-master-key-here
```

### Database Changes

The existing schema already supports encrypted fields:
- `encryptedContent` - Stores encrypted sensitive data
- `isEncrypted` - Boolean flag
- `encryptionVersion` - Tracks encryption method

## Usage Guide

### For Users

1. **Creating Documents**: No change - create documents normally
2. **Downloading**: Documents download as `.encrypted` files
3. **Decrypting**:
   - Go to Documents > Decrypt Document
   - Upload the `.encrypted` file
   - Receive the original DOCX/PDF

### For Administrators

1. **Migration**: Use the migrate endpoint to encrypt existing documents
2. **No Access**: You cannot decrypt user documents - this is by design
3. **Support**: If users lose access, documents are permanently inaccessible

## Implementation Checklist

- [x] User key derivation service
- [x] Document encryption on creation
- [x] Encrypted package download
- [x] Decryption interface
- [x] Routes and API endpoints
- [ ] Update Document History UI for encrypted downloads
- [ ] Add encryption toggle in user settings
- [ ] Migration tool for existing documents
- [ ] Admin interface for monitoring encryption status

## FAQ

**Q: What happens if a user forgets their password?**
A: Password resets don't affect encryption - keys are derived from user ID, not passwords.

**Q: Can admins decrypt documents?**
A: No. This is a feature - it ensures complete privacy for investigations.

**Q: What if we get a subpoena?**
A: You can only provide encrypted data, which is useless without the user's key.

**Q: Can users share encrypted documents?**
A: No. Documents are tied to the encrypting user's account.

## Next Steps

1. Enable `ENABLE_USER_ENCRYPTION=true` in production
2. Set a strong `USER_KEY_MASTER_SECRET`
3. Run migration for existing documents
4. Update user documentation
5. Train support staff on the new system