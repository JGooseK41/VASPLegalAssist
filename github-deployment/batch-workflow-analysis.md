# Batch Document Creation Workflow Analysis

## Executive Summary
The batch document creation workflow allows users to generate multiple documents from a CSV file. However, it has a critical limitation: **users cannot use different templates for different VASPs in a single batch**.

## Workflow Steps and Issues

### 1. ✅ Navigate to Batch Document Creation
- Route: `/batch-documents`
- Component: `UnifiedBatchBuilder`
- Access: Main navigation menu

### 2. ✅ CSV Upload Functionality
**Working Features:**
- Accepts CSV files up to 10MB
- Shows preview of first 6 lines
- Drag-and-drop support
- Sample CSV download available

**CSV Format:**
```csv
VASP_Name,VASP_Email,VASP_Address,VASP_Jurisdiction,Transaction_ID,Date,From_Address,To_Address,Amount,Currency
Binance US,compliance@binance.us,"1 Main St, San Francisco, CA",United States,abc123def456,2024-01-15,1A2B3C4D5E,5E4D3C2B1A,0.5,BTC
```

### 3. ✅ Mode Selection (Simple vs Custom)
**Simple Mode:**
- Pre-defined templates (freeze_request, records_request)
- DOCX output only
- No template customization

**Custom Mode:**
- User's uploaded templates
- PDF or DOCX output
- Template selection from dropdown

### 4. ❌ CRITICAL ISSUE: No Per-VASP Template Selection
**Current Behavior:**
- All documents in a batch use THE SAME template
- Template selected once for entire batch
- No way to specify different templates for different VASPs

**Impact on Use Case:**
- User with 3 different VASPs cannot use custom template for just one VASP
- Must run separate batches for each template type
- Defeats purpose of batch processing

### 5. ⚠️ Batch Generation Logic Issues

**Simple Batch (`/api/documents/simple-batch`):**
```javascript
// All documents use same template
const templateContent = documentType === 'freeze_request' 
  ? FREEZE_REQUEST_TEMPLATE 
  : RECORDS_REQUEST_TEMPLATE;

// Applied to every VASP in loop
for (const record of records) {
  const result = await generateFromTemplate(templateContent, documentData);
}
```

**Custom Batch (`/api/documents/custom-batch`):**
```javascript
// Single template for all VASPs
const template = await prisma.documentTemplate.findFirst({
  where: { id: templateId }
});

// Same template used for every record
for (const record of records) {
  generatedDoc = await wordGenerator.generateFromSmartTemplate(
    template.id,  // Same template ID for all
    req.userId,
    documentData
  );
}
```

### 6. ⚠️ ZIP File Creation Inconsistencies
- Simple mode: Always creates ZIP
- Custom mode: Always creates ZIP
- Main batch controller: Only creates ZIP if >5 documents
- No user control over ZIP creation

### 7. ⚠️ Additional Issues Found

**CSV Parsing:**
- No validation of required fields before processing
- Silent failure for missing VASP names
- No duplicate VASP detection

**Error Handling:**
- Generic error messages
- No detailed failure logs
- Cannot retry failed documents

**Performance:**
- Entire CSV loaded into memory
- No streaming for large files
- No progress updates during generation

## Recommendations to Fix Per-VASP Template Issue

### Option 1: Add Template Column to CSV
```csv
VASP_Name,Template_Type,Template_ID,VASP_Email,...
Binance,simple,freeze_request,compliance@binance.us,...
Coinbase,custom,template123,legal@coinbase.com,...
```

### Option 2: Template Mapping UI
- After CSV upload, show VASP list
- Allow template selection per VASP
- Save mapping before generation

### Option 3: Rule-Based Templates
- Define rules (e.g., jurisdiction-based)
- Auto-select templates based on VASP data
- Override option per VASP

## Current Workarounds

1. **Multiple Batch Runs:**
   - Separate CSV files by template type
   - Run batch for each template
   - Manually combine results

2. **Post-Processing:**
   - Generate all with default template
   - Regenerate specific VASPs individually
   - Replace in final package

3. **Manual Process:**
   - Use batch for similar VASPs
   - Generate custom template documents individually
   - Combine manually

## Conclusion
The batch document creation works well for uniform document generation but fails the requirement of mixed template usage. The architecture assumes one template per batch, making it impossible to customize per VASP without code changes.