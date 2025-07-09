const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Common jurisdiction patterns
const jurisdictionPatterns = {
  // US States
  'Alabama': [/\bAL\b/, /Alabama/i],
  'Alaska': [/\bAK\b/, /Alaska/i],
  'Arizona': [/\bAZ\b/, /Arizona/i],
  'Arkansas': [/\bAR\b/, /Arkansas/i],
  'California': [/\bCA\b/, /California/i],
  'Colorado': [/\bCO\b/, /Colorado/i],
  'Connecticut': [/\bCT\b/, /Connecticut/i],
  'Delaware': [/\bDE\b/, /Delaware/i],
  'Florida': [/\bFL\b/, /Florida/i],
  'Georgia': [/\bGA\b/, /Georgia/i],
  'Hawaii': [/\bHI\b/, /Hawaii/i],
  'Idaho': [/\bID\b/, /Idaho/i],
  'Illinois': [/\bIL\b/, /Illinois/i],
  'Indiana': [/\bIN\b/, /Indiana/i],
  'Iowa': [/\bIA\b/, /Iowa/i],
  'Kansas': [/\bKS\b/, /Kansas/i],
  'Kentucky': [/\bKY\b/, /Kentucky/i],
  'Louisiana': [/\bLA\b/, /Louisiana/i],
  'Maine': [/\bME\b/, /Maine/i],
  'Maryland': [/\bMD\b/, /Maryland/i],
  'Massachusetts': [/\bMA\b/, /Massachusetts/i],
  'Michigan': [/\bMI\b/, /Michigan/i],
  'Minnesota': [/\bMN\b/, /Minnesota/i],
  'Mississippi': [/\bMS\b/, /Mississippi/i],
  'Missouri': [/\bMO\b/, /Missouri/i],
  'Montana': [/\bMT\b/, /Montana/i],
  'Nebraska': [/\bNE\b/, /Nebraska/i],
  'Nevada': [/\bNV\b/, /Nevada/i],
  'New Hampshire': [/\bNH\b/, /New Hampshire/i],
  'New Jersey': [/\bNJ\b/, /New Jersey/i],
  'New Mexico': [/\bNM\b/, /New Mexico/i],
  'New York': [/\bNY\b/, /New York/i],
  'North Carolina': [/\bNC\b/, /North Carolina/i],
  'North Dakota': [/\bND\b/, /North Dakota/i],
  'Ohio': [/\bOH\b/, /Ohio/i],
  'Oklahoma': [/\bOK\b/, /Oklahoma/i],
  'Oregon': [/\bOR\b/, /Oregon/i],
  'Pennsylvania': [/\bPA\b/, /Pennsylvania/i],
  'Rhode Island': [/\bRI\b/, /Rhode Island/i],
  'South Carolina': [/\bSC\b/, /South Carolina/i],
  'South Dakota': [/\bSD\b/, /South Dakota/i],
  'Tennessee': [/\bTN\b/, /Tennessee/i],
  'Texas': [/\bTX\b/, /Texas/i],
  'Utah': [/\bUT\b/, /Utah/i],
  'Vermont': [/\bVT\b/, /Vermont/i],
  'Virginia': [/\bVA\b/, /Virginia/i],
  'Washington': [/\bWA\b/, /Washington/i],
  'West Virginia': [/\bWV\b/, /West Virginia/i],
  'Wisconsin': [/\bWI\b/, /Wisconsin/i],
  'Wyoming': [/\bWY\b/, /Wyoming/i],
  'District of Columbia': [/\bDC\b/, /Washington,?\s*D\.?C\.?/i],
  
  // Countries
  'United States': [/USA/i, /United States/i, /\bUS\b/, /U\.S\.A/i],
  'United Kingdom': [/UK/i, /United Kingdom/i, /England/i, /London/i, /Britain/i],
  'Canada': [/Canada/i, /Ontario/i, /Quebec/i, /British Columbia/i, /Alberta/i],
  'Australia': [/Australia/i, /Sydney/i, /Melbourne/i],
  'Singapore': [/Singapore/i],
  'Hong Kong': [/Hong Kong/i, /HK/i],
  'Japan': [/Japan/i, /Tokyo/i],
  'Germany': [/Germany/i, /Berlin/i, /Munich/i],
  'France': [/France/i, /Paris/i],
  'Switzerland': [/Switzerland/i, /Swiss/i, /Zurich/i],
  'Netherlands': [/Netherlands/i, /Amsterdam/i, /Dutch/i],
  'Ireland': [/Ireland/i, /Dublin/i],
  'Estonia': [/Estonia/i, /Tallinn/i],
  'Lithuania': [/Lithuania/i, /Vilnius/i],
  'Malta': [/Malta/i],
  'Gibraltar': [/Gibraltar/i],
  'Cayman Islands': [/Cayman/i],
  'British Virgin Islands': [/BVI/i, /British Virgin/i],
  'Bermuda': [/Bermuda/i],
  'Seychelles': [/Seychelles/i],
  'Nigeria': [/Nigeria/i, /Lagos/i],
  'South Africa': [/South Africa/i],
  'Israel': [/Israel/i],
  'United Arab Emirates': [/UAE/i, /Dubai/i, /Abu Dhabi/i, /United Arab Emirates/i],
  'South Korea': [/South Korea/i, /Seoul/i],
  'India': [/India/i, /Mumbai/i, /Delhi/i, /Bangalore/i],
  'Brazil': [/Brazil/i, /São Paulo/i],
  'Mexico': [/Mexico/i],
  'Argentina': [/Argentina/i],
  'Chile': [/Chile/i],
  'Sweden': [/Sweden/i, /Stockholm/i],
  'Saint Vincent and the Grenadines': [/St\.?\s*Vincent/i, /Saint Vincent/i, /Kingstown/i],
  'Cyprus': [/Cyprus/i, /Cypress/i, /Limassol/i],
  'Spain': [/Spain/i, /Madrid/i, /Barcelona/i],
  'Italy': [/Italy/i, /Rome/i, /Milan/i],
  'Poland': [/Poland/i, /Warsaw/i],
  'Belgium': [/Belgium/i, /Brussels/i],
  'Luxembourg': [/Luxembourg/i],
  'Turkey': [/Turkey/i, /Istanbul/i],
  'Russia': [/Russia/i, /Moscow/i],
  'Ukraine': [/Ukraine/i, /Kiev/i, /Kyiv/i],
  'Czech Republic': [/Czech/i, /Prague/i],
  'Austria': [/Austria/i, /Vienna/i],
  'Portugal': [/Portugal/i, /Lisbon/i],
  'Greece': [/Greece/i, /Athens/i],
  'Finland': [/Finland/i, /Helsinki/i],
  'Norway': [/Norway/i, /Oslo/i],
  'Denmark': [/Denmark/i, /Copenhagen/i]
};

function extractJurisdiction(address) {
  if (!address) return null;
  
  // First check for US states and zip codes (priority for US detection)
  const usStatePatterns = Object.entries(jurisdictionPatterns).filter(([key, _]) => 
    ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
     'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
     'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
     'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
     'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
     'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
     'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
     'Wisconsin', 'Wyoming', 'District of Columbia'].includes(key)
  );
  
  // Check if it has US zip code or state abbreviation
  const hasUSIndicators = /\b\d{5}(-\d{4})?\b/.test(address) && !(/Cayman|British Virgin|Bermuda/i.test(address)) || // US zip code but not Caribbean
                         /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/.test(address) && !(/Cayman/i.test(address));
  
  if (hasUSIndicators) {
    for (const [state, patterns] of usStatePatterns) {
      for (const pattern of patterns) {
        if (pattern.test(address)) {
          return 'United States';
        }
      }
    }
  }
  
  // Then check for specific countries (to avoid false matches like "Cayman Islands" matching "KY")
  const countryPatterns = Object.entries(jurisdictionPatterns).filter(([key, _]) => 
    !['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
      'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
      'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
      'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
      'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
      'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
      'Wisconsin', 'Wyoming', 'District of Columbia'].includes(key)
  );
  
  // Check country patterns
  for (const [country, patterns] of countryPatterns) {
    for (const pattern of patterns) {
      if (pattern.test(address)) {
        return country;
      }
    }
  }
  
  // Finally check for US states without strong indicators (lower priority)
  if (!hasUSIndicators) {
    for (const [state, patterns] of usStatePatterns) {
      for (const pattern of patterns) {
        if (pattern.test(address)) {
          // For US states, always return United States
          return 'United States';
        }
      }
    }
  }
  
  return null;
}

async function updateJurisdictions() {
  try {
    console.log('Starting jurisdiction extraction from service addresses...\n');
    
    // Get all VASPs
    const allVasps = await prisma.vasp.findMany();
    
    // Filter for unknown jurisdictions
    const vasps = allVasps.filter(v => 
      !v.jurisdiction || v.jurisdiction === 'Unknown' || v.jurisdiction === ''
    );
    
    console.log(`Found ${vasps.length} VASPs with unknown jurisdictions\n`);
    
    let updated = 0;
    let found = 0;
    
    for (const vasp of vasps) {
      if (vasp.service_address) {
        const extractedJurisdiction = extractJurisdiction(vasp.service_address);
        
        if (extractedJurisdiction) {
          found++;
          console.log(`✓ ${vasp.name}:`);
          console.log(`  Address: ${vasp.service_address}`);
          console.log(`  Detected: ${extractedJurisdiction}`);
          
          // Ask for confirmation before updating
          const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          await new Promise((resolve) => {
            readline.question('  Update this VASP? (y/N): ', async (answer) => {
              if (answer.toLowerCase() === 'y') {
                await prisma.vasp.update({
                  where: { id: vasp.id },
                  data: { jurisdiction: extractedJurisdiction }
                });
                updated++;
                console.log('  ✓ Updated!\n');
              } else {
                console.log('  ⨯ Skipped\n');
              }
              readline.close();
              resolve();
            });
          });
        } else {
          console.log(`✗ ${vasp.name}: Could not extract jurisdiction from "${vasp.service_address}"\n`);
        }
      } else {
        console.log(`✗ ${vasp.name}: No service address available\n`);
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total VASPs processed: ${vasps.length}`);
    console.log(`Jurisdictions detected: ${found}`);
    console.log(`Jurisdictions updated: ${updated}`);
    
    // Show remaining unknowns
    const remaining = await prisma.vasp.findMany();
    const stillUnknown = remaining.filter(v => 
      !v.jurisdiction || v.jurisdiction === 'Unknown' || v.jurisdiction === ''
    ).length;
    
    console.log(`Remaining unknown: ${stillUnknown}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Add command to run without confirmation for automated updates
if (process.argv.includes('--auto')) {
  async function autoUpdate() {
    try {
      // Get all VASPs
      const allVasps = await prisma.vasp.findMany();
      
      // Filter for unknown jurisdictions
      const vasps = allVasps.filter(v => 
        !v.jurisdiction || v.jurisdiction === 'Unknown' || v.jurisdiction === ''
      );
      
      let updated = 0;
      
      for (const vasp of vasps) {
        if (vasp.service_address) {
          const extractedJurisdiction = extractJurisdiction(vasp.service_address);
          
          if (extractedJurisdiction) {
            await prisma.vasp.update({
              where: { id: vasp.id },
              data: { jurisdiction: extractedJurisdiction }
            });
            updated++;
            console.log(`✓ Updated ${vasp.name} to ${extractedJurisdiction}`);
          }
        }
      }
      
      console.log(`\nAutomatically updated ${updated} jurisdictions`);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
  
  autoUpdate();
} else {
  updateJurisdictions();
}