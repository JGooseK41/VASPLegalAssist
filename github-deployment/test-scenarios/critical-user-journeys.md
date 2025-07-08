# Critical User Journey Test Scripts

## Journey 1: First-Time User Complete Flow

### Scenario: New prosecutor needs to create their first subpoena
**Persona:** Jane Smith, new ADA, first day using the system

**Test Script:**
1. **Registration**
   - Navigate to application
   - Click "Register"
   - Enter: jane.smith@prosecutor.gov, Password123!, Jane Smith
   - Submit and check for email
   - Verify email (if required)

2. **First Login**
   - Login with credentials
   - Expected: Welcome message or tutorial prompt
   - Issue to check: Is there any onboarding?

3. **Explore Dashboard**
   - Check if dashboard explains features
   - Look for "Get Started" or "Help" buttons
   - Issue: Are metrics meaningful for new users with no data?

4. **Create First Document**
   - Click "Create Document"
   - Expected: Clear choice between Simple/Custom/Batch
   - Select "Simple Document"
   - Issue: Are form fields explained?
   - Fill in:
     - Case Number: 2024-CR-001234
     - Defendant: John Doe
     - VASP: (Need to search)
   
5. **VASP Search within Document Creation**
   - Click VASP search
   - Search "Coinbase"
   - Issue: Is it clear what to search for?
   - Select appropriate VASP
   - Issue: Are VASP details helpful for selection?

6. **Complete and Generate**
   - Fill remaining fields
   - Click Generate
   - Issue: Loading indicators?
   - Download PDF
   - Issue: Is PDF properly formatted?

**Success Criteria:**
- User completes first document in < 10 minutes
- No confusion about next steps
- No errors or unclear messages

## Journey 2: Batch Processing Power User

### Scenario: Experienced user processing 50 subpoenas for a large case
**Persona:** Mike Johnson, Senior ADA, handles complex cases

**Test Script:**
1. **Prepare CSV File**
   ```csv
   CaseNumber,DefendantName,VaspName,VaspAddress,DateRange
   2024-CR-1001,Smith John,Coinbase Inc,"100 Pine St, San Francisco, CA",01/01/2023-12/31/2023
   2024-CR-1002,Doe Jane,Kraken,"237 Kearny St, San Francisco, CA",06/01/2023-06/30/2024
   ... (48 more rows)
   ```

2. **Upload and Process**
   - Login as experienced user
   - Navigate to Batch Processing
   - Upload CSV
   - Issue: File size limits?
   - Issue: Upload progress indicator?
   - Select template
   - Issue: Can preview template?

3. **Monitor Processing**
   - Start batch processing
   - Issue: Real-time progress updates?
   - Issue: Can cancel if needed?
   - Issue: Error handling for individual failures?

4. **Download Results**
   - Download all as ZIP
   - Issue: File naming convention clear?
   - Issue: Summary report included?
   - Check individual PDFs for accuracy

**Edge Cases to Test:**
- Row 25 has invalid VASP name
- Row 30 has missing required field
- Row 40 has special characters
- Internet disconnects at row 35
- Browser crashes during processing

## Journey 3: Template Customization Expert

### Scenario: Legal admin creating department-wide template
**Persona:** Sarah Chen, Legal Administrator

**Test Script:**
1. **Create Custom Template**
   - Login as admin user
   - Navigate to Templates
   - Create new template
   - Upload DOCX with markers:
     - {{CaseNumber}}
     - {{DefendantName}}
     - {{VaspLegalName}}
     - {{CustomField1}}
     - {{TableData}}

2. **Configure Mappings**
   - Map standard fields
   - Create custom field mappings
   - Issue: Is marker syntax explained?
   - Issue: Can preview with sample data?

3. **Test Template**
   - Use template in document creation
   - Test with edge cases:
     - Very long defendant names
     - Special characters in fields
     - Empty optional fields
     - Table with 100 rows

4. **Share Template**
   - Set template as department-wide
   - Issue: Permission controls?
   - Issue: Version control?
   - Test with another user account

**Advanced Features to Test:**
- Nested conditionals in template
- Dynamic tables
- Image placeholders
- Page breaks
- Headers/footers with fields

## Journey 4: VASP Researcher

### Scenario: Investigator researching crypto platforms
**Persona:** Tom Wilson, Financial Investigator

**Test Script:**
1. **Comprehensive VASP Search**
   - Login as investigator
   - Navigate to VASP Search
   - Test searches:
     - By name: "Binance"
     - By partial: "Coin*"
     - By address: "California"
     - By type: "Exchange"
   
2. **Advanced Filtering**
   - Apply multiple filters
   - Sort by different columns
   - Issue: Search speed with many results?
   - Export search results

3. **VASP Intelligence**
   - View VASP details
   - Add investigative notes
   - View others' comments
   - Issue: Comment permissions?
   - Check update history

4. **Submission Process**
   - Submit new VASP info
   - Upload supporting documents
   - Issue: What formats accepted?
   - Track submission status

**Data Quality Tests:**
- Search for misspellings
- Check for duplicate VASPs
- Verify address formatting
- Test international VASPs

## Journey 5: Mobile Emergency User

### Scenario: Prosecutor needs urgent subpoena from courthouse
**Persona:** Lisa Park, Trial Attorney

**Test Script:**
1. **Mobile Login**
   - Open on iPhone/Android
   - Login with Face ID/Touch ID (if enabled)
   - Issue: Login form usable on small screen?

2. **Quick Document Creation**
   - Navigate to Simple Document
   - Issue: Form fields accessible?
   - Issue: Dropdown menus work on touch?
   - Use voice-to-text for fields
   - Search and select VASP
   - Issue: Search results readable?

3. **Generate and Share**
   - Generate document
   - Issue: PDF viewable on mobile?
   - Email/share directly from device
   - Save to device files

**Mobile-Specific Tests:**
- Landscape/portrait rotation
- Pinch to zoom on documents
- Touch-friendly button sizes
- Offline capability?
- Auto-save on connection loss

## Journey 6: System Administrator

### Scenario: IT admin managing system and users
**Persona:** David Kim, IT Administrator

**Test Script:**
1. **User Management**
   - Login as admin
   - View all users
   - Test pagination with 500+ users
   - Bulk operations:
     - Enable/disable users
     - Reset passwords
     - Change roles
   - Export user list

2. **System Monitoring**
   - View system stats
   - Check error logs
   - Issue: Real-time updates?
   - Monitor active sessions
   - Check storage usage

3. **Security Audit**
   - Review failed login attempts
   - Check suspicious activities
   - Export audit logs
   - Test IP blocking
   - Configure security settings

4. **Data Management**
   - Backup user data
   - Clean old documents
   - Archive inactive users
   - GDPR compliance tools?

## Journey 7: Accessibility User

### Scenario: Vision-impaired user with screen reader
**Persona:** Robert Jones, ADA with vision impairment

**Test Script:**
1. **Screen Reader Navigation**
   - Enable NVDA/JAWS
   - Navigate with keyboard only
   - Tab through all elements
   - Issue: Proper ARIA labels?
   - Issue: Skip navigation links?

2. **Form Completion**
   - Complete document form
   - Issue: Field labels announced?
   - Issue: Error messages accessible?
   - Issue: Success confirmations announced?

3. **Document Review**
   - Generate document
   - Issue: PDF accessible?
   - Issue: Alternative text formats?
   - Use screen magnification

**Accessibility Checks:**
- Color contrast ratios
- Keyboard focus indicators
- Modal dialog management
- Time-out warnings
- Consistent navigation

## Performance Degradation Scenarios

### Scenario 1: System Under Load
**Test Setup:**
- 100 concurrent users
- 10 batch processes running
- 50 active searches
- 20 document generations

**Expected Behavior:**
- Graceful degradation
- Queue management
- Clear user feedback
- No data loss

### Scenario 2: Large Data Processing
**Test Cases:**
- Upload 50MB template
- Batch process 1000 documents
- Search returning 5000 results
- User with 10000 document history

**Monitor:**
- Response times
- Memory usage
- Error rates
- User experience

## Security Breach Scenarios

### Scenario 1: Compromised Account
**Test Response:**
- Detect unusual activity
- Account lockdown
- Password reset flow
- Audit trail review
- User notification

### Scenario 2: Data Exfiltration Attempt
**Test Detection:**
- Mass download attempts
- API rate limiting
- Unusual access patterns
- Data encryption verification
- Alert mechanisms

## Integration Testing Scenarios

### Scenario 1: Email Service Down
**Test:**
- Registration without email
- Password reset fallback
- Document sharing alternatives
- Error messaging

### Scenario 2: PDF Service Failure
**Test:**
- Graceful error handling
- Alternative format options
- Retry mechanisms
- User notification

## Data Validation Matrix

| Field Type | Valid Cases | Invalid Cases | Edge Cases |
|------------|-------------|---------------|------------|
| Email | user@domain.com | user@, @domain, user | user+tag@domain.com, user@sub.domain.co.uk |
| Case Number | 2024-CR-1234 | 2024CR1234, CASE-1234 | 2024-CR-00001, 24-CR-1 |
| Date Range | 01/01/2023-12/31/2023 | 2023-01-01, Jan 1 2023 | 02/29/2024, 12/31/9999 |
| VASP Name | Coinbase Inc | <script>, SELECT * | Coinbase, Inc., ĆÖINBÄSÉ |
| Address | 123 Main St, City, ST 12345 | 123 Main | 123 Main St Apt 4B Suite 200, City, ST |

## Success Metrics

### User Journey Success Indicators:
- Task completion rate > 95%
- Time to first document < 10 min
- Error encounter rate < 5%
- User satisfaction > 4/5
- Support ticket rate < 2%

### System Performance Indicators:
- Page load time < 3 sec
- Document generation < 10 sec
- Search response < 2 sec
- Uptime > 99.9%
- Zero data loss incidents