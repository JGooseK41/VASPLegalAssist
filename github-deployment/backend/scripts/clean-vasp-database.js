const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Patterns that indicate problematic data
const PROBLEMATIC_PATTERNS = {
  codeStrings: [
    /^[A-Fa-f0-9]{32,}$/,  // Long hex strings
    /^0x[A-Fa-f0-9]+$/,     // Ethereum addresses
    /^\{.*\}$/,             // JSON-like strings
    /^<.*>$/,               // HTML/XML tags
    /^function\s*\(/,       // JavaScript functions
    /^class\s+/,            // Class definitions
    /^import\s+/,           // Import statements
    /^undefined$/i,         // Undefined values
    /^null$/i,              // Null values
    /^\[object\s+/,         // Object toString() output
  ],
  
  placeholders: [
    /^N\/A$/i,
    /^TBD$/i,
    /^TODO$/i,
    /^PLACEHOLDER$/i,
    /^TEST$/i,
    /^EXAMPLE$/i,
    /^\-+$/,                // Just dashes
    /^\.+$/,                // Just dots
    /^XXXX/i,               // X placeholders
  ],
  
  emailPatterns: [
    /^test@/i,
    /^example@/i,
    /^admin@test/i,
    /^no-?reply@/i,
    /@(test|example|localhost|temp)\.com$/i,
  ]
};

// Valid legal/compliance terms that should not be flagged
const VALID_TERMS = [
  'MLAT', 'MLA', 'KYC', 'AML', 'CTF', 'SAR', 'STR', 
  'US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'SG', 'HK', 'CH',
  'FBI', 'DEA', 'IRS', 'DOJ', 'SEC', 'CFTC', 'FinCEN',
  'na', 'NA', 'N/A' // Common placeholders that are acceptable
];

// Check if a field contains problematic content
function isProblematicContent(value) {
  if (!value || typeof value !== 'string') return false;
  
  const trimmed = value.trim();
  
  // Skip if it's a valid term
  if (VALID_TERMS.includes(trimmed) || VALID_TERMS.includes(trimmed.toUpperCase())) {
    return false;
  }
  
  // Check all patterns
  for (const patterns of Object.values(PROBLEMATIC_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(trimmed)) {
        return true;
      }
    }
  }
  
  // Check for very short values that aren't meaningful
  if (trimmed.length < 3) {
    return true;
  }
  
  // Check for repeated characters
  if (/^(.)\1{4,}$/.test(trimmed)) {
    return true;
  }
  
  return false;
}

// Analyze VASPs for issues
async function analyzeVasps() {
  console.log('\n🔍 Analyzing VASP database for problematic entries...\n');
  
  const vasps = await prisma.vasp.findMany({
    orderBy: { name: 'asc' }
  });
  
  const issues = [];
  
  for (const vasp of vasps) {
    const vaspIssues = [];
    
    // Check each field
    const fieldsToCheck = [
      'name',
      'legal_name',
      'jurisdiction',
      'compliance_email',
      'compliance_contact',
      'service_address',
      'phone',
      'processing_time',
      'preferred_method',
      'required_document',
      'notes',
      'law_enforcement_url'
    ];
    
    for (const field of fieldsToCheck) {
      if (isProblematicContent(vasp[field])) {
        vaspIssues.push({
          field,
          value: vasp[field],
          reason: getIssueReason(vasp[field])
        });
      }
    }
    
    // Check info_types array
    if (vasp.info_types && Array.isArray(vasp.info_types)) {
      const problematicTypes = vasp.info_types.filter(type => isProblematicContent(type));
      if (problematicTypes.length > 0) {
        vaspIssues.push({
          field: 'info_types',
          value: problematicTypes.join(', '),
          reason: 'Contains problematic values'
        });
      }
    }
    
    if (vaspIssues.length > 0) {
      issues.push({
        vasp,
        issues: vaspIssues
      });
    }
  }
  
  return { total: vasps.length, problematic: issues };
}

// Get reason for issue
function getIssueReason(value) {
  if (!value) return 'Empty value';
  
  const trimmed = value.trim();
  
  for (const [category, patterns] of Object.entries(PROBLEMATIC_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(trimmed)) {
        switch (category) {
          case 'codeStrings':
            return 'Contains code or technical string';
          case 'placeholders':
            return 'Placeholder value';
          case 'emailPatterns':
            return 'Test/invalid email';
          default:
            return 'Invalid format';
        }
      }
    }
  }
  
  if (trimmed.length < 3) return 'Too short';
  if (/^(.)\1{4,}$/.test(trimmed)) return 'Repeated characters';
  
  return 'Unknown issue';
}

// Display issues
function displayIssues(analysis) {
  console.log(`📊 Found ${analysis.problematic.length} VASPs with issues out of ${analysis.total} total\n`);
  
  if (analysis.problematic.length === 0) {
    console.log('✅ No problematic VASPs found!');
    return;
  }
  
  analysis.problematic.forEach((item, index) => {
    console.log(`\n${index + 1}. ${item.vasp.name} (ID: ${item.vasp.id})`);
    console.log('   Issues:');
    item.issues.forEach(issue => {
      console.log(`   - ${issue.field}: "${issue.value}" (${issue.reason})`);
    });
  });
}

// Function to clean HTML tags from text
function cleanHtmlTags(text) {
  if (!text) return text;
  // Remove HTML tags and decode HTML entities
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&')  // Replace &amp; with &
    .replace(/&lt;/g, '<')   // Replace &lt; with <
    .replace(/&gt;/g, '>')   // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'")  // Replace &#39; with '
    .trim();
}

// Clean specific VASP
async function cleanVasp(vaspId) {
  const vasp = await prisma.vasp.findUnique({
    where: { id: vaspId }
  });
  
  if (!vasp) {
    console.log('❌ VASP not found');
    return;
  }
  
  console.log(`\n🧹 Cleaning VASP: ${vasp.name}`);
  
  const updates = {};
  
  // Clean or mark inactive based on severity
  const criticalFields = ['name', 'legal_name', 'compliance_email'];
  let hasCriticalIssues = false;
  
  for (const field of criticalFields) {
    if (isProblematicContent(vasp[field])) {
      hasCriticalIssues = true;
      break;
    }
  }
  
  if (hasCriticalIssues) {
    // Mark as inactive if critical fields are bad
    updates.isActive = false;
    console.log('   ⚠️  Marking as inactive due to critical field issues');
  } else {
    // Clean individual fields
    if (isProblematicContent(vasp.compliance_contact)) {
      updates.compliance_contact = null;
      console.log('   - Cleared compliance_contact');
    }
    
    if (isProblematicContent(vasp.service_address)) {
      updates.service_address = null;
      console.log('   - Cleared service_address');
    }
    
    if (isProblematicContent(vasp.phone)) {
      updates.phone = null;
      console.log('   - Cleared phone');
    }
    
    // Special handling for notes - clean HTML tags
    if (vasp.notes && vasp.notes.includes('<')) {
      const cleanedNotes = cleanHtmlTags(vasp.notes);
      if (cleanedNotes && cleanedNotes !== 'NA' && cleanedNotes !== 'N/A') {
        updates.notes = cleanedNotes;
        console.log('   - Cleaned HTML from notes');
      } else {
        updates.notes = null;
        console.log('   - Cleared notes (was only NA or empty after cleaning)');
      }
    } else if (isProblematicContent(vasp.notes)) {
      updates.notes = null;
      console.log('   - Cleared notes');
    }
    
    if (isProblematicContent(vasp.law_enforcement_url)) {
      updates.law_enforcement_url = null;
      console.log('   - Cleared law_enforcement_url');
    }
    
    // Clean info_types array
    if (vasp.info_types && Array.isArray(vasp.info_types)) {
      const cleanTypes = vasp.info_types.filter(type => !isProblematicContent(type));
      if (cleanTypes.length !== vasp.info_types.length) {
        updates.info_types = cleanTypes;
        console.log('   - Cleaned info_types array');
      }
    }
  }
  
  if (Object.keys(updates).length > 0) {
    await prisma.vasp.update({
      where: { id: vaspId },
      data: updates
    });
    console.log('   ✅ VASP cleaned successfully');
  } else {
    console.log('   ℹ️  No cleaning needed');
  }
}

// Main menu
async function main() {
  console.log('🧹 VASP Database Cleanup Tool');
  console.log('============================\n');
  
  let running = true;
  
  while (running) {
    console.log('\nOptions:');
    console.log('1. Analyze database for issues');
    console.log('2. Clean all problematic VASPs');
    console.log('3. Clean specific VASP by ID');
    console.log('4. Deactivate all problematic VASPs');
    console.log('5. Export problematic VASPs report');
    console.log('6. Exit');
    
    const choice = await question('\nSelect option (1-6): ');
    
    switch (choice) {
      case '1':
        const analysis = await analyzeVasps();
        displayIssues(analysis);
        break;
        
      case '2':
        const analysisForClean = await analyzeVasps();
        if (analysisForClean.problematic.length > 0) {
          const confirm = await question(`\n⚠️  This will clean ${analysisForClean.problematic.length} VASPs. Continue? (y/n): `);
          if (confirm.toLowerCase() === 'y') {
            for (const item of analysisForClean.problematic) {
              await cleanVasp(item.vasp.id);
            }
            console.log('\n✅ All problematic VASPs cleaned');
          }
        }
        break;
        
      case '3':
        const vaspId = await question('\nEnter VASP ID: ');
        await cleanVasp(parseInt(vaspId));
        break;
        
      case '4':
        const analysisForDeactivate = await analyzeVasps();
        if (analysisForDeactivate.problematic.length > 0) {
          const confirm = await question(`\n⚠️  This will deactivate ${analysisForDeactivate.problematic.length} VASPs. Continue? (y/n): `);
          if (confirm.toLowerCase() === 'y') {
            for (const item of analysisForDeactivate.problematic) {
              await prisma.vasp.update({
                where: { id: item.vasp.id },
                data: { isActive: false }
              });
            }
            console.log('\n✅ All problematic VASPs deactivated');
          }
        }
        break;
        
      case '5':
        const report = await analyzeVasps();
        const filename = `vasp-cleanup-report-${Date.now()}.json`;
        require('fs').writeFileSync(filename, JSON.stringify(report, null, 2));
        console.log(`\n✅ Report exported to ${filename}`);
        break;
        
      case '6':
        running = false;
        break;
        
      default:
        console.log('❌ Invalid option');
    }
  }
  
  rl.close();
  await prisma.$disconnect();
}

// Run the script
main().catch(async (error) => {
  console.error('Error:', error);
  await prisma.$disconnect();
  process.exit(1);
});