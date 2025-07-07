# Encryption Implementation Guide

## Overview

This application implements end-to-end encryption for sensitive user data, including:
- Document templates and their content
- Generated documents and transaction details
- Custom template fields and smart markers
- Imported CSV data

## How It Works

### Encryption Architecture

1. **Master Key**: A single master encryption key is used to derive user-specific keys
2. **User-Specific Keys**: Each user's data is encrypted with a unique key derived from the master key and their user ID
3. **AES-256-GCM**: Military-grade encryption algorithm with authenticated encryption
4. **PBKDF2**: Key derivation function to generate user keys from the master key

### Data Protection

- **At Rest**: All sensitive data is encrypted before storing in the database
- **In Transit**: HTTPS protects data during transmission
- **User Isolation**: Each user can only decrypt their own data

## Setup

### 1. Environment Configuration

Add to your `.env` file:

```bash
# Generate a secure master key
ENCRYPTION_MASTER_KEY=$(openssl rand -hex 32)
ENABLE_ENCRYPTION=true
```

### 2. Database Migration

Run the Prisma migration to add encryption fields:

```bash
cd backend
npx prisma migrate dev --name add-encryption-fields
```

### 3. Encrypt Existing Data

If you have existing data, run the encryption migration script:

```bash
cd backend
node scripts/encryptExistingData.js
```

## Encrypted Fields

### DocumentTemplate Model
- `customFields` → `encryptedCustomFields`
- `templateContent` → `encryptedContent`
- `markers` → `encryptedMarkers`
- `markerMappings` → `encryptedMappings`

### Document Model
- `transactionDetails` → `encryptedTransactionDetails`
- `requestedData` → `encryptedRequestedData`
- Document content → `encryptedContent`

## Security Best Practices

### Key Management
1. **Never commit the master key** to version control
2. **Use environment variables** for production keys
3. **Rotate keys periodically** (requires data re-encryption)
4. **Back up your master key** securely - losing it means losing all encrypted data

### Production Deployment
1. Use a secure key management service (AWS KMS, Azure Key Vault, etc.)
2. Enable audit logging for key access
3. Implement key rotation policies
4. Use different keys for different environments

### Development
1. Use a different master key for development
2. Document test keys in your team's secure documentation
3. Never use production keys in development

## Disabling Encryption

To disable encryption (not recommended for production):

1. Set `ENABLE_ENCRYPTION=false` in your `.env` file
2. Restart the application
3. New data will be stored unencrypted
4. Existing encrypted data will still be decrypted when accessed

## Troubleshooting

### Common Issues

1. **"Decryption failed" errors**
   - Check that `ENCRYPTION_MASTER_KEY` is set correctly
   - Ensure the key hasn't changed since data was encrypted
   - Verify the user ID matches the encryption owner

2. **Performance concerns**
   - Encryption adds minimal overhead (~1-2ms per operation)
   - Consider caching decrypted data in memory for frequently accessed items

3. **Migration failures**
   - Ensure all database fields exist before running encryption
   - Check for sufficient database storage (encrypted data is ~33% larger)

## API Changes

The API remains unchanged - encryption/decryption happens transparently:

- Templates API: Automatically encrypts/decrypts template content
- Documents API: Automatically encrypts/decrypts document data
- No changes required in frontend code

## Compliance

This encryption implementation helps meet various compliance requirements:
- **GDPR**: Right to erasure (delete user + their key = data is unrecoverable)
- **HIPAA**: Encryption of PHI at rest
- **PCI DSS**: Protection of sensitive data
- **SOC 2**: Data protection controls

## Recovery

### Lost Master Key
If the master key is lost:
1. All encrypted data becomes permanently inaccessible
2. Users must re-create their templates and documents
3. Consider implementing key escrow for critical deployments

### Data Export
To export decrypted data for a user:
1. Use the admin tools (if implemented)
2. Or create a custom script using the decryption service
3. Always audit data exports

## Future Enhancements

Potential improvements to consider:
1. Client-side encryption for zero-knowledge architecture
2. Hardware security module (HSM) integration
3. Multi-party computation for shared templates
4. Homomorphic encryption for encrypted search