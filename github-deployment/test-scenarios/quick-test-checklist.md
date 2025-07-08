# VASP Records Assistant - Quick Test Checklist

## Pre-Deployment Testing Checklist

### 🔐 Authentication (5 min)
- [ ] Register new user with valid email
- [ ] Register with duplicate email (should fail)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Reset password flow
- [ ] Logout and session cleanup
- [ ] Login on multiple tabs (check session handling)

### 📄 Document Creation (10 min)
- [ ] Create simple document with all fields
- [ ] Try to create without required fields (validation)
- [ ] Search and select VASP
- [ ] Generate and download PDF
- [ ] Check PDF formatting and content
- [ ] Create document with special characters in fields
- [ ] Test date picker on different browsers

### 📦 Batch Processing (10 min)
- [ ] Upload valid CSV (5 rows)
- [ ] Upload invalid CSV (missing columns)
- [ ] Process batch successfully
- [ ] Download individual documents
- [ ] Download all as ZIP
- [ ] Upload large CSV (100+ rows) - check performance
- [ ] Cancel batch mid-process

### 📋 Template Management (10 min)
- [ ] Create new template
- [ ] Upload DOCX template
- [ ] Edit existing template
- [ ] Delete template (non-default)
- [ ] Set default template
- [ ] Use custom template in document creation
- [ ] Test encryption toggle

### 🔍 VASP Search (5 min)
- [ ] Search by name
- [ ] Search by partial name
- [ ] Search with no results
- [ ] Add comment to VASP
- [ ] Edit own comment
- [ ] View comment history
- [ ] Filter search results

### 📱 Mobile Testing (10 min)
- [ ] Login on mobile
- [ ] Navigate menu
- [ ] Create simple document
- [ ] Search VASPs
- [ ] View document history
- [ ] Test all dropdowns and date pickers
- [ ] Check responsive layout

### 🛡️ Security Tests (5 min)
- [ ] Try SQL injection in search: `' OR '1'='1`
- [ ] Try XSS in text fields: `<script>alert('XSS')</script>`
- [ ] Check HTTPS is enforced
- [ ] Verify JWT tokens expire
- [ ] Try accessing admin routes as regular user
- [ ] Check for sensitive data in browser console

### ⚡ Performance Tests (5 min)
- [ ] Page load time < 3 seconds
- [ ] Document generation < 10 seconds
- [ ] Search results < 2 seconds
- [ ] Check browser memory usage
- [ ] Test with slow 3G throttling
- [ ] Multiple concurrent users

### 🐛 Error Handling (5 min)
- [ ] Disconnect internet during document generation
- [ ] Submit form with server error (use dev tools)
- [ ] Upload corrupted file
- [ ] Session timeout behavior
- [ ] Browser back button during multi-step process
- [ ] Refresh page during operation

### ♿ Accessibility (5 min)
- [ ] Tab through entire form
- [ ] Check focus indicators visible
- [ ] Test with browser zoom 200%
- [ ] Check color contrast (use DevTools)
- [ ] Verify all images have alt text
- [ ] Check form labels are associated

## Critical Path Smoke Test (2 min)
**Must pass before any deployment:**

1. [ ] Login → Dashboard loads
2. [ ] Create Document → Select Simple
3. [ ] Fill required fields
4. [ ] Generate document
5. [ ] Download PDF
6. [ ] Logout

## Browser Matrix Quick Test
Test critical path on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome (Android)

## Known Issues to Verify Fixed
Based on recent commits:
- [ ] Encrypted template creation works
- [ ] Agency address validation enforced
- [ ] Template creation error messages clear
- [ ] Encryption toggle saves properly

## Data Validation Quick Tests

### Email Field
- [ ] ✅ user@example.com
- [ ] ❌ user@
- [ ] ❌ @example.com
- [ ] ✅ user+tag@example.com

### Case Number
- [ ] ✅ 2024-CR-1234
- [ ] ✅ 24-CV-5678
- [ ] ❌ CASE1234
- [ ] ⚠️ 2024-CR-00001 (check leading zeros)

### VASP Name Search
- [ ] ✅ Coinbase
- [ ] ✅ coinbase (case insensitive)
- [ ] ✅ Coin (partial match)
- [ ] ❌ <script>alert('xss')</script>

### Date Range
- [ ] ✅ 01/01/2024 - 12/31/2024
- [ ] ❌ 2024-01-01 (wrong format)
- [ ] ❌ 13/01/2024 (invalid month)
- [ ] ✅ 02/29/2024 (leap year)

## Performance Benchmarks
Record actual times:
- Login to Dashboard: _____ seconds
- Simple Document Generation: _____ seconds
- VASP Search Results: _____ seconds
- Batch Process (10 docs): _____ seconds
- Template Upload: _____ seconds

## Test Environment Info
- Date/Time: _____________
- Environment: [ ] Local [ ] Staging [ ] Production
- Browser/Version: _____________
- Tester Name: _____________
- Version/Commit: _____________

## Issues Found
Use this format:
```
Issue #___
Severity: [Critical/High/Medium/Low]
Area: [Component name]
Description: 
Steps to reproduce:
Expected:
Actual:
Screenshot: [Link/attachment]
```

## Sign-off
- [ ] All critical path tests passed
- [ ] No critical or high severity bugs
- [ ] Performance within acceptable limits
- [ ] Mobile experience acceptable
- [ ] Security tests passed
- [ ] Ready for deployment

**Tester Signature:** _________________ **Date:** _________________