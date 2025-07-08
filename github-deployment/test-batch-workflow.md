# Batch Document Creation Workflow Analysis

## Test Scenario
- CSV file with 10 wallet addresses
- Transactions involving 3 different VASPs  
- Need to use custom template for one VASP

## Workflow Analysis

### 1. Navigate to Batch Document Creation
The batch document creation is accessible through the `UnifiedBatchBuilder` component at `/batch-documents`.

### 2. CSV Upload Functionality
**✅ Working:**
- File upload accepts CSV files up to 10MB
- Maximum 100 VASPs per batch enforced
- CSV preview shows first 6 lines
- Drag and drop supported

**⚠️ Issues Found:**
- No client-side CSV validation before upload
- File size limit (10MB) might be restrictive for large datasets

### 3. Mode Switching (Simple vs Custom)
**✅ Working:**
- Clear visual toggle between Simple and Custom modes
- Simple mode offers freeze_request and records_request templates
- Custom mode loads user's encrypted templates

**⚠️ Issues Found:**
- Custom templates require encryption setup
- No way to preview template before batch generation

### 4. CSV Format and Parsing
**Expected CSV columns:**
```csv
VASP_Name,VASP_Email,VASP_Address,VASP_Jurisdiction,Transaction_ID,Date,From_Address,To_Address,Amount,Currency
```

**✅ Working:**
- Flexible column name matching (case-insensitive)
- Supports both VASP_Name and vasp_name formats
- Transaction data is optional per row
- Sample CSV download available

**⚠️ Issues Found:**
- No support for per-VASP template selection in batch mode
- All documents in a batch use the same template

### 5. Batch Generation Logic

#### Simple Mode (`/api/documents/simple-batch`)
- Uses predefined templates (freeze_request or records_request)
- Generates DOCX files only
- All documents zipped together

#### Custom Mode (`/api/documents/custom-batch`)
- Uses selected custom template
- Supports PDF or DOCX output format
- Template placeholders filled with CSV data

**✅ Working:**
- Parallel document generation for each VASP
- ZIP file created for downloads
- Progress tracking (successful/failed counts)

**⚠️ Issues Found:**
1. **No per-VASP template selection** - Cannot use different templates for different VASPs in same batch
2. **Memory usage** - Entire CSV loaded into memory
3. **No streaming support** for large files
4. **ZIP always created** even for small batches in custom mode

### 6. Download Process
**✅ Working:**
- ZIP file generation for all documents
- Individual document URLs provided for successful generations
- Cleanup of temporary files after download

**⚠️ Issues Found:**
- Inconsistent ZIP behavior (simple mode creates ZIP for any batch, custom mode only for >5 docs)
- Download URLs are relative paths that may not work in all deployments

## Key Limitations for the Use Case

### 1. Cannot Mix Templates in Single Batch
The current implementation doesn't support using different templates for different VASPs. All documents in a batch use the same template.

**Workaround Options:**
- Run multiple batches, one per template type
- Modify CSV to group VASPs by template need
- Implement template mapping in CSV (requires code changes)

### 2. Custom Template Selection Issues
- Must select template before upload
- Cannot preview template with sample data
- No template validation before batch run

### 3. Error Handling
- Failed documents don't provide detailed error messages
- No retry mechanism for failed documents
- No partial save - all or nothing approach

## Recommended Improvements

1. **Add Template Mapping Column to CSV**
   ```csv
   VASP_Name,Template_ID,VASP_Email,...
   Binance,template123,compliance@binance.com,...
   ```

2. **Implement Progressive Processing**
   - Stream CSV processing
   - Show real-time progress
   - Allow pause/resume

3. **Enhanced Error Reporting**
   - Detailed error log per VASP
   - Export failed records as CSV
   - Validation before processing

4. **Template Preview**
   - Preview with sample data
   - Validate template compatibility
   - Show required fields

5. **Flexible Download Options**
   - Choose ZIP threshold
   - Download individual files
   - Batch download manager