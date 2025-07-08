// Utility to parse VASP legal names and extract DBA information
export const parseVaspLegalName = (legalName) => {
  if (!legalName) return { legalName: '', dba: '' };
  
  // Pattern 1: d/b/a, D/B/A, dba, DBA
  const dbaMatch = legalName.match(/^(.+?)\s+(?:d\/b\/a|D\/B\/A|dba|DBA)\s+(.+)$/);
  if (dbaMatch) {
    return {
      legalName: dbaMatch[1].trim(),
      dba: dbaMatch[2].trim()
    };
  }
  
  // Pattern 2: Check if the name field might be the DBA
  // This is for cases where legal_name contains the full legal entity
  // and name contains the common/trading name
  
  // If no DBA pattern found, return the full legal name
  return {
    legalName: legalName.trim(),
    dba: ''
  };
};

// Compare name and legal_name to determine if name is actually a DBA
export const extractDbaFromNames = (name, legalName) => {
  if (!name || !legalName) return { legalName: legalName || name || '', dba: '' };
  
  // First check if legal_name contains d/b/a pattern
  const parsed = parseVaspLegalName(legalName);
  if (parsed.dba) {
    return parsed;
  }
  
  // If name and legal_name are different and legal_name is more formal
  // (contains Ltd, Inc, LLC, etc.), treat name as DBA
  const formalIndicators = /\b(Ltd|Limited|Inc|Incorporated|LLC|Corp|Corporation|GmbH|S\.A\.|N\.V\.|B\.V\.|UAB|PLC)\b/i;
  
  if (name !== legalName && formalIndicators.test(legalName) && !formalIndicators.test(name)) {
    return {
      legalName: legalName.trim(),
      dba: name.trim()
    };
  }
  
  // Otherwise, just use legal_name as the primary name
  return {
    legalName: legalName.trim(),
    dba: ''
  };
};