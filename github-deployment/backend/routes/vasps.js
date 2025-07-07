const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Routes
router.use(authMiddleware);

// GET /api/vasps - Get all VASPs from database
router.get('/', async (req, res) => {
  try {
    // Get all active VASPs from database
    const vasps = await prisma.vasp.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: null } // For backwards compatibility
        ]
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform database format to match frontend expectations
    const formattedVasps = vasps.map((vasp, index) => ({
      id: vasp.id,
      name: vasp.name || "Unknown",
      legal_name: vasp.legalName || vasp.name || "Unknown",
      service_name: vasp.name || "Unknown",
      jurisdiction: extractJurisdiction(vasp),
      service_address: formatAddress(vasp),
      legal_contact_email: vasp.complianceEmail || vasp.supportEmail || "",
      compliance_email: vasp.complianceEmail || vasp.supportEmail || "",
      phone: vasp.phone || "",
      preferred_method: vasp.serviceMethod || "email",
      processing_time: vasp.processingTime || "5-10 business days",
      accepts_international: vasp.acceptsInternational !== false,
      accepts_us_service: vasp.jurisdiction === "United States" || vasp.country === "United States",
      has_own_portal: vasp.serviceMethod === "portal" || vasp.serviceMethod === "kodex" || !!vasp.serviceUrl,
      law_enforcement_url: vasp.serviceUrl || "",
      info_types: vasp.informationAvailable ? vasp.informationAvailable.split(',').map(s => s.trim()) : ["KYC", "Transaction History", "Account Balance", "Login Records"],
      last_updated: vasp.updatedAt ? new Date(vasp.updatedAt).toISOString().split('T')[0] : "2024-01-01",
      required_document: vasp.requiredDocuments || "Letterhead",
      notes: vasp.additionalInfo || ""
    }));

    res.json(formattedVasps);
  } catch (error) {
    console.error('Error getting VASPs:', error);
    res.status(500).json({ error: 'Failed to load VASP data' });
  }
});

// GET /api/vasps/:id - Get single VASP
router.get('/:id', async (req, res) => {
  try {
    const vasp = await prisma.vasp.findUnique({
      where: { id: req.params.id }
    });
    
    if (!vasp) {
      return res.status(404).json({ error: 'VASP not found' });
    }
    
    // Transform to match frontend format
    const formattedVasp = {
      id: vasp.id,
      name: vasp.name || "Unknown",
      legal_name: vasp.legalName || vasp.name || "Unknown",
      service_name: vasp.name || "Unknown",
      jurisdiction: extractJurisdiction(vasp),
      service_address: formatAddress(vasp),
      legal_contact_email: vasp.complianceEmail || vasp.supportEmail || "",
      compliance_email: vasp.complianceEmail || vasp.supportEmail || "",
      phone: vasp.phone || "",
      preferred_method: vasp.serviceMethod || "email",
      processing_time: vasp.processingTime || "5-10 business days",
      accepts_international: vasp.acceptsInternational !== false,
      accepts_us_service: vasp.jurisdiction === "United States" || vasp.country === "United States",
      has_own_portal: vasp.serviceMethod === "portal" || vasp.serviceMethod === "kodex" || !!vasp.serviceUrl,
      law_enforcement_url: vasp.serviceUrl || "",
      info_types: vasp.informationAvailable ? vasp.informationAvailable.split(',').map(s => s.trim()) : ["KYC", "Transaction History", "Account Balance", "Login Records"],
      last_updated: vasp.updatedAt ? new Date(vasp.updatedAt).toISOString().split('T')[0] : "2024-01-01",
      required_document: vasp.requiredDocuments || "Letterhead",
      notes: vasp.additionalInfo || ""
    };
    
    res.json(formattedVasp);
  } catch (error) {
    console.error('Error getting VASP:', error);
    res.status(500).json({ error: 'Failed to load VASP data' });
  }
});

// Helper functions
function extractJurisdiction(vasp) {
  // First check explicit jurisdiction/country fields
  if (vasp.jurisdiction) return vasp.jurisdiction;
  if (vasp.country) return vasp.country;
  
  // Otherwise extract from address
  const address = formatAddress(vasp).toUpperCase();
  
  if (address.includes(" GA ") || address.includes(" CA ") || address.includes(" NY ") || 
      address.includes(" FL ") || address.includes(" TX ") || address.includes("USA") ||
      address.includes("UNITED STATES")) {
    return "United States";
  } else if (address.includes("LAGOS") || address.includes("NIGERIA")) {
    return "Nigeria";
  } else if (address.includes("LITHUANIA")) {
    return "Lithuania";
  } else if (address.includes("UK") || address.includes("LONDON") || address.includes("UNITED KINGDOM")) {
    return "United Kingdom";
  } else if (address.includes("SINGAPORE")) {
    return "Singapore";
  } else if (address.includes("CAYMAN")) {
    return "Cayman Islands";
  } else if (address.includes("MALTA")) {
    return "Malta";
  } else if (address.includes("ESTONIA")) {
    return "Estonia";
  } else if (address.includes("CANADA")) {
    return "Canada";
  }
  
  return "Unknown";
}

function formatAddress(vasp) {
  const parts = [];
  if (vasp.street) parts.push(vasp.street);
  if (vasp.city) parts.push(vasp.city);
  if (vasp.state) parts.push(vasp.state);
  if (vasp.zipCode) parts.push(vasp.zipCode);
  if (vasp.country) parts.push(vasp.country);
  
  return parts.length > 0 ? parts.join(', ') : "Unknown";
}

module.exports = router;