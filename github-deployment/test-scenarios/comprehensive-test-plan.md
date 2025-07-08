# VASP Records Assistant - Comprehensive Test Plan

## Test Environment Setup
- URL: [Production/Staging URL]
- Test Users: Create multiple test accounts with different roles
- Browser Testing: Chrome, Firefox, Safari, Edge
- Mobile Testing: iOS Safari, Android Chrome
- Screen Sizes: Mobile (375px), Tablet (768px), Desktop (1920px)

## 1. New User Registration and Onboarding

### Test Case 1.1: Basic Registration Flow
**Steps:**
1. Navigate to /register
2. Enter valid email, password, name
3. Submit form
4. Verify email confirmation process
5. Login with new credentials

**Expected Results:**
- Form validation works properly
- Password requirements are clear
- Email verification sent
- Successful login after registration

**Edge Cases to Test:**
- Duplicate email registration
- Weak password attempts
- Invalid email formats
- SQL injection attempts in form fields
- XSS attempts in name field
- Registration with extremely long inputs
- Special characters in all fields
- Concurrent registration with same email

### Test Case 1.2: Onboarding Experience
**Steps:**
1. Login as new user
2. Check for welcome messages/tutorials
3. Navigate through main features
4. Check for helpful tooltips/guides

**Expected Results:**
- Clear guidance for new users
- Easy access to help/FAQ
- Intuitive navigation

**Issues to Look For:**
- Missing onboarding flow
- Confusing initial dashboard
- No clear next steps

## 2. Document Creation Workflows

### Test Case 2.1: Simple Document Creation
**Steps:**
1. Navigate to /documents/create
2. Select "Simple Document"
3. Fill in all required fields
4. Generate document
5. Download PDF

**Edge Cases:**
- Empty required fields
- Very long text inputs (>10,000 chars)
- Special characters and Unicode
- HTML/Script injection attempts
- Concurrent document generation
- Network interruption during generation
- Browser back button during process

### Test Case 2.2: Custom Document Creation
**Steps:**
1. Navigate to /documents/custom
2. Test marker replacement system
3. Upload custom template
4. Generate with various data inputs
5. Test preview functionality

**Edge Cases:**
- Invalid template formats
- Templates with malicious content
- Missing markers in template
- Circular marker references
- Templates > 10MB
- Corrupted DOCX files
- Templates with macros
- Non-DOCX file uploads with .docx extension

### Test Case 2.3: Batch Processing
**Steps:**
1. Navigate to /documents/batch
2. Upload CSV file
3. Select template
4. Process batch
5. Download all generated documents

**Edge Cases:**
- Empty CSV files
- CSV with 10,000+ rows
- Malformed CSV data
- Missing required columns
- Special characters in CSV
- CSV with different encodings (UTF-8, UTF-16, etc.)
- Extremely large cell values
- CSV bomb (billion laughs attack variant)
- Concurrent batch processing
- Browser crash during processing
- Partial batch completion

## 3. Template Management

### Test Case 3.1: Template Upload
**Steps:**
1. Navigate to /templates
2. Upload new template
3. Configure marker mappings
4. Save template
5. Use template in document creation

**Edge Cases:**
- Duplicate template names
- Templates with no markers
- Templates with 100+ markers
- Nested markers
- Invalid marker syntax
- Template versioning conflicts
- Sharing templates between users
- Deleting templates in use

### Test Case 3.2: Template Encryption
**Steps:**
1. Upload sensitive template
2. Enable encryption
3. Test document generation with encrypted template
4. Verify encryption in database

**Security Tests:**
- Attempt to access encrypted templates via API
- Check for encryption keys in client-side code
- Verify encrypted data at rest
- Test key rotation scenarios

## 4. VASP Search and Comments

### Test Case 4.1: VASP Search Functionality
**Steps:**
1. Navigate to /search
2. Search by various criteria (name, address, type)
3. Test filters and sorting
4. View VASP details
5. Add/edit comments

**Edge Cases:**
- Search with special characters
- Empty search results
- Search with 1000+ results
- SQL injection in search
- Searching for deleted VASPs
- Case sensitivity tests
- Partial match accuracy
- Performance with complex queries

### Test Case 4.2: Comment System
**Steps:**
1. Add comment to VASP
2. Edit own comment
3. Delete comment
4. View comment history

**Edge Cases:**
- Very long comments (>5000 chars)
- Markdown/HTML in comments
- Rapid comment posting (spam)
- Comments on non-existent VASPs
- Concurrent comment editing
- Comment permissions (edit others' comments)

## 5. User Profile and Authentication

### Test Case 5.1: Profile Management
**Steps:**
1. Navigate to /profile
2. Update profile information
3. Change password
4. Update email
5. Test MFA if available

**Security Tests:**
- Password change without current password
- Email change to existing user's email
- Profile picture upload (if applicable)
- CSRF token validation
- Session management

### Test Case 5.2: Password Reset Flow
**Steps:**
1. Logout and go to /forgot-password
2. Enter email
3. Check reset email
4. Use reset link
5. Set new password

**Edge Cases:**
- Multiple reset requests
- Expired reset tokens
- Invalid reset tokens
- Reset for non-existent email
- Using reset link multiple times

## 6. Admin Portal

### Test Case 6.1: User Management
**Steps:**
1. Login as admin
2. Navigate to /admin
3. View user list
4. Edit user roles
5. Disable/enable users

**Security Tests:**
- Non-admin access attempts
- Privilege escalation attempts
- Bulk user operations
- Audit trail verification

### Test Case 6.2: VASP Management
**Steps:**
1. Add new VASP
2. Edit existing VASP
3. Delete VASP
4. Import VASP data

**Edge Cases:**
- Duplicate VASP entries
- Deleting VASP with comments
- Bulk import validation
- Data integrity checks

## 7. Performance and Load Testing

### Test Case 7.1: Concurrent Users
**Scenarios:**
- 10 users generating documents simultaneously
- 50 users searching VASPs
- 100 users logged in and browsing
- Batch processing during high load

### Test Case 7.2: Large Data Sets
**Scenarios:**
- Search with 10,000+ VASPs
- Batch process 1,000 documents
- Template with 50+ pages
- User with 1,000+ document history

## 8. Mobile Responsiveness

### Test Case 8.1: Core Functionality on Mobile
**Test all features on:**
- iPhone 12 (375px width)
- iPad (768px width)
- Android Phone (360px width)

**Key Areas:**
- Navigation menu
- Form inputs
- Table displays
- Document preview
- File uploads

### Test Case 8.2: Touch Interactions
**Test:**
- Dropdown menus
- Date pickers
- File drag-and-drop
- Scrolling in modals
- Pinch-to-zoom on documents

## 9. Error Handling and Recovery

### Test Case 9.1: Network Errors
**Scenarios:**
- Lose connection during document generation
- API timeout during search
- Upload interruption
- Session timeout handling

### Test Case 9.2: Input Validation
**Test all forms for:**
- Client-side validation
- Server-side validation
- Error message clarity
- Field highlighting
- Success confirmations

## 10. Security Testing

### Test Case 10.1: Authentication Security
**Tests:**
- JWT token expiration
- Refresh token handling
- Multi-tab session management
- Logout from all devices
- Account lockout after failed attempts

### Test Case 10.2: Data Security
**Tests:**
- HTTPS enforcement
- Secure cookie flags
- API rate limiting
- Input sanitization
- File upload restrictions
- Directory traversal attempts

## 11. Accessibility Testing

### Test Case 11.1: Screen Reader Compatibility
**Test with:**
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)

### Test Case 11.2: Keyboard Navigation
**Test:**
- Tab order logic
- Form navigation
- Modal focus trapping
- Skip links
- Keyboard shortcuts

## 12. Browser Compatibility

### Test Case 12.1: Cross-Browser Testing
**Browsers:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Chrome (1 year old version)

**Key Features:**
- File uploads
- PDF generation
- Form validation
- CSS layouts
- JavaScript functionality

## Bug Tracking Template

### Bug Report Format:
```
Title: [Component] - Brief description
Severity: Critical/High/Medium/Low
Environment: Browser/OS/Screen Size
Steps to Reproduce:
1. 
2. 
3. 
Expected Result:
Actual Result:
Screenshots/Videos:
Additional Notes:
```

## Regression Test Suite

### Critical Path Tests (Run before each release):
1. User registration and login
2. Simple document creation
3. VASP search
4. Template upload
5. Batch processing (small batch)
6. Profile update
7. Password reset
8. Admin user management

## Performance Benchmarks

### Target Metrics:
- Page load: < 3 seconds
- Document generation: < 10 seconds
- Search results: < 2 seconds
- Batch processing: < 1 second per document
- File upload: Dependent on file size and connection

## Test Data Management

### Test Data Sets:
1. User accounts (various roles)
2. Sample templates (various complexities)
3. CSV files (various sizes)
4. VASP data (clean and edge cases)
5. Document history (various states)

## Automated Testing Recommendations

### Priority Areas for Automation:
1. Registration/login flows
2. Form validation
3. API endpoint testing
4. Security vulnerability scanning
5. Performance monitoring
6. Cross-browser testing

## Known Issues to Verify

Based on recent commits:
1. Encrypted template creation
2. Agency address validation
3. Error logging visibility
4. Template creation debugging

## Testing Schedule

### Daily Tests:
- Smoke tests (critical paths)
- New feature testing

### Weekly Tests:
- Full regression suite
- Performance testing
- Security scanning

### Monthly Tests:
- Accessibility audit
- Cross-browser compatibility
- Mobile device testing
- Load testing

## Reporting

### Test Results Format:
- Test case ID
- Test date/time
- Tester name
- Pass/Fail status
- Defects found
- Screenshots/logs
- Environment details