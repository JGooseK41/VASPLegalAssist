# Document Encryption Implementation

## Overview

This implementation provides server-side encryption for sensitive document data, including:
- Generated document files (DOCX)
- Sensitive database fields (case numbers, crime descriptions, statutes)

## Features

1. **AES-256-GCM Encryption**: Military-grade encryption for document files and data
2. **Automatic Encryption**: Documents are encrypted automatically when created (if enabled)
3. **Transparent Decryption**: Documents are decrypted on-the-fly when downloaded
4. **Bulk Encryption**: Admin tool to encrypt existing documents
5. **Key Management**: Secure key generation and storage

## Setup

### 1. Generate an Encryption Key

```bash
cd backend
node generate-encryption-key.js
```

This will output a secure encryption key. Save it securely!

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Enable document encryption
ENABLE_DOCUMENT_ENCRYPTION=true

# Your encryption key (from step 1)
DOCUMENT_ENCRYPTION_KEY=your-generated-key-here
```

### 3. Run Database Migrations

```bash
npx prisma migrate deploy
```

This adds the necessary encryption fields to the database.

## How It Works

### File Encryption

When a document is created:
1. The DOCX file is generated normally
2. The file is encrypted using AES-256-GCM
3. The encrypted file replaces the original
4. The original unencrypted file is deleted

### Database Field Encryption

Sensitive fields are encrypted:
- `crimeDescription` → `encrypted_crimeDescription`
- `statute` → `encrypted_statute`
- `caseNumber` → `encrypted_caseNumber`

The original fields are replaced with `[ENCRYPTED]` placeholders.

### Decryption

When a user downloads a document:
1. The system checks if the document is encrypted
2. If encrypted, it decrypts the file in memory
3. The decrypted file is sent to the user
4. The encrypted file remains on disk

## API Endpoints

### Download Encrypted Document
```
GET /api/encrypted-documents/download/:filename
```
Automatically decrypts the document before sending to user.

### Bulk Encrypt Existing Documents (Admin Only)
```
POST /api/encrypted-documents/bulk-encrypt
```
Encrypts all existing unencrypted documents in the database.

## Security Considerations

1. **Key Storage**: 
   - Never commit encryption keys to version control
   - Use environment variables or secure key management systems
   - Rotate keys periodically

2. **Backup Keys**: 
   - Always backup encryption keys securely
   - Loss of keys means permanent data loss

3. **Access Control**: 
   - Documents are still protected by user authentication
   - Users can only decrypt their own documents

4. **Performance**: 
   - Encryption/decryption happens on-demand
   - Minimal performance impact for typical usage

## Troubleshooting

### "Failed to decrypt document"
- Check that `DOCUMENT_ENCRYPTION_KEY` is set correctly
- Ensure the key hasn't changed since encryption

### "Document file not found"
- Check that encrypted files exist in `generated-docs/`
- Verify file paths in database

### Performance Issues
- Consider implementing caching for frequently accessed documents
- Use streaming for very large files

## Future Enhancements

1. **Key Rotation**: Implement automatic key rotation
2. **Client-Side Encryption**: Add E2E encryption option
3. **Audit Logging**: Track all encryption/decryption operations
4. **HSM Integration**: Support hardware security modules