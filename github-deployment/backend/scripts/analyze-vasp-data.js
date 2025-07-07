const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeVaspData() {
  try {
    // Get all VASPs
    const allVasps = await prisma.vasp.findMany();
    
    console.log(`=== VASP Data Analysis ===`);
    console.log(`Total VASPs: ${allVasps.length}`);
    
    // Analyze empty/missing data
    const emptyNames = allVasps.filter(v => !v.name || v.name.trim() === '').length;
    const unknownJurisdictions = allVasps.filter(v => v.jurisdiction === 'Unknown').length;
    const missingEmails = allVasps.filter(v => !v.compliance_email || v.compliance_email.trim() === '').length;
    
    console.log(`\nData Quality Issues:`);
    console.log(`- Empty names: ${emptyNames}`);
    console.log(`- Unknown jurisdictions: ${unknownJurisdictions}`);
    console.log(`- Missing compliance emails: ${missingEmails}`);
    
    // Show jurisdiction distribution
    const jurisdictionCounts = {};
    allVasps.forEach(vasp => {
      const jurisdiction = vasp.jurisdiction || 'Not specified';
      jurisdictionCounts[jurisdiction] = (jurisdictionCounts[jurisdiction] || 0) + 1;
    });
    
    console.log(`\nJurisdiction Distribution:`);
    Object.entries(jurisdictionCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([jurisdiction, count]) => {
        console.log(`- ${jurisdiction}: ${count}`);
      });
    
    // Show service method distribution
    const methodCounts = {};
    allVasps.forEach(vasp => {
      const method = vasp.preferred_method || 'Not specified';
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });
    
    console.log(`\nPreferred Service Methods:`);
    Object.entries(methodCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([method, count]) => {
        console.log(`- ${method}: ${count}`);
      });
    
    // Show some VASPs with good data
    const goodVasps = allVasps.filter(v => 
      v.name && v.name.trim() !== '' && 
      v.jurisdiction !== 'Unknown' && 
      v.compliance_email && v.compliance_email.trim() !== ''
    );
    
    console.log(`\nVASPs with complete data: ${goodVasps.length}`);
    console.log(`\nSample VASPs with good data:`);
    goodVasps.slice(0, 5).forEach((vasp, index) => {
      console.log(`${index + 1}. ${vasp.name}`);
      console.log(`   - Jurisdiction: ${vasp.jurisdiction}`);
      console.log(`   - Email: ${vasp.compliance_email}`);
      console.log(`   - Method: ${vasp.preferred_method}`);
    });
    
  } catch (error) {
    console.error('Error analyzing VASPs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeVaspData();