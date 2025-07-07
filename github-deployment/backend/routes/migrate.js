const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parse');
const path = require('path');

const prisma = new PrismaClient();

// GET /api/migrate/check - Check migration status
router.get('/check', async (req, res) => {
  try {
    const vaspCount = await prisma.vasp.count();
    const csvPath = path.join(__dirname, '../public/ComplianceGuide.csv');
    const csvExists = fs.existsSync(csvPath);
    
    res.json({
      databaseVaspCount: vaspCount,
      csvFileExists: csvExists,
      csvPath: csvPath,
      needsMigration: vaspCount === 0 && csvExists
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to check migration status',
      details: error.message 
    });
  }
});

// POST /api/migrate/vasps - Force migrate VASPs
router.post('/vasps', async (req, res) => {
  try {
    console.log('Starting forced VASP migration...');
    
    const csvPath = path.join(__dirname, '../public/ComplianceGuide.csv');
    
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ 
        error: 'CSV file not found',
        path: csvPath 
      });
    }
    
    const vasps = [];
    let migrated = 0;
    let skipped = 0;
    let errors = [];

    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv.parse({ columns: true, skip_empty_lines: true }))
        .on('data', (row) => {
          vasps.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Found ${vasps.length} VASPs in CSV file`);

    // Check existing VASPs
    const existingVasps = await prisma.vasp.findMany({
      select: { name: true }
    });
    const existingNames = new Set(existingVasps.map(v => v.name));

    // Migrate each VASP
    for (const vasp of vasps) {
      try {
        const vaspName = vasp['VASP Name'] || vasp['Title'] || '';
        
        // Skip if already exists
        if (existingNames.has(vaspName)) {
          skipped++;
          continue;
        }

        // Parse address
        const legalAddress = vasp['Legal Address'] || '';
        let street = '', city = '', state = '', zipCode = '', country = '';
        
        if (legalAddress) {
          const parts = legalAddress.split(',').map(p => p.trim());
          if (parts.length >= 3) {
            street = parts[0];
            city = parts[1];
            const lastPart = parts[parts.length - 1];
            const stateZipMatch = lastPart.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
            if (stateZipMatch) {
              state = stateZipMatch[1];
              zipCode = stateZipMatch[2];
              country = 'United States';
            } else {
              country = lastPart;
            }
          }
        }

        // Extract jurisdiction
        let jurisdiction = vasp['Jurisdiction'] || '';
        if (!jurisdiction && country) {
          jurisdiction = country;
        }
        if (!jurisdiction && legalAddress.toUpperCase().includes('USA')) {
          jurisdiction = 'United States';
        }
        if (!jurisdiction) {
          jurisdiction = 'Unknown';
        }

        // Create VASP
        await prisma.vasp.create({
          data: {
            name: vaspName,
            legalName: vasp['Legal Name'] || vaspName,
            street: street,
            city: city,
            state: state,
            zipCode: zipCode,
            country: country,
            jurisdiction: jurisdiction,
            supportEmail: vasp['Support Email'] || null,
            complianceEmail: vasp['Compliance Email'] || vasp['Support Email'] || null,
            serviceUrl: vasp['Law Enforcement URL'] || null,
            additionalInfo: vasp['Additional Info'] || null,
            acceptsInternational: vasp['Accepts International'] !== 'No',
            requiredDocuments: vasp['Required Documents'] || 'Letterhead',
            serviceMethod: (vasp['Service Method'] || 'email').toLowerCase(),
            processingTime: vasp['Processing Time'] || '5-10 business days',
            informationAvailable: vasp['Information Available'] || 'KYC, Transaction History',
            status: 'ACTIVE'
          }
        });
        
        migrated++;
      } catch (error) {
        errors.push({
          vasp: vasp['VASP Name'] || 'Unknown',
          error: error.message
        });
      }
    }

    const finalCount = await prisma.vasp.count();

    res.json({
      success: true,
      totalInCsv: vasps.length,
      migrated: migrated,
      skipped: skipped,
      errors: errors.length,
      errorDetails: errors.slice(0, 10), // First 10 errors
      finalDatabaseCount: finalCount
    });

  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({ 
      error: 'Migration failed',
      details: error.message 
    });
  }
});

// DELETE /api/migrate/clear - Clear all VASPs (dangerous!)
router.delete('/clear', async (req, res) => {
  try {
    // Safety check - require a confirm parameter
    if (req.query.confirm !== 'yes-clear-all-vasps') {
      return res.status(400).json({ 
        error: 'Safety check failed',
        message: 'Add ?confirm=yes-clear-all-vasps to confirm deletion' 
      });
    }

    const deleted = await prisma.vasp.deleteMany({});
    
    res.json({
      success: true,
      deleted: deleted.count
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to clear VASPs',
      details: error.message 
    });
  }
});

module.exports = router;