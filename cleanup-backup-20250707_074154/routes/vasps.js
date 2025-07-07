const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');
const Papa = require('papaparse');

// Load and parse VASP data
let vaspCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

const loadVASPData = async () => {
  const now = Date.now();
  
  // Check cache
  if (vaspCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return vaspCache;
  }

  try {
    const csvPath = path.join(__dirname, '../public/ComplianceGuide.csv');
    const csvContent = await fs.readFile(csvPath, 'utf8');
    
    const parsedData = Papa.parse(csvContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    const processedVASPs = parsedData.data.map((row, index) => {
      // Enhanced jurisdiction extraction
      let jurisdiction = "Unknown";
      if (row["Legal Address"] && row["Legal Address"] !== "Unknown") {
        const address = row["Legal Address"].toUpperCase();
        if (address.includes(" GA ") || address.includes(" CA ") || address.includes(" NY ") || 
            address.includes(" FL ") || address.includes(" TX ") || address.includes("USA") ||
            address.includes("UNITED STATES")) {
          jurisdiction = "United States";
        } else if (address.includes("LAGOS") || address.includes("NIGERIA")) {
          jurisdiction = "Nigeria";
        } else if (address.includes("LITHUANIA")) {
          jurisdiction = "Lithuania";
        } else if (address.includes("UK") || address.includes("LONDON") || address.includes("UNITED KINGDOM")) {
          jurisdiction = "United Kingdom";
        } else if (address.includes("SINGAPORE")) {
          jurisdiction = "Singapore";
        } else if (address.includes("CAYMAN")) {
          jurisdiction = "Cayman Islands";
        } else if (address.includes("MALTA")) {
          jurisdiction = "Malta";
        } else if (address.includes("ESTONIA")) {
          jurisdiction = "Estonia";
        } else if (address.includes("CANADA")) {
          jurisdiction = "Canada";
        }
      }

      // Normalize service method
      let serviceMethod = (row["Service Method"] || "email").toLowerCase();
      if (serviceMethod.includes("kodex")) serviceMethod = "kodex";
      else if (serviceMethod.includes("portal")) serviceMethod = "portal";
      else if (serviceMethod.includes("email")) serviceMethod = "email";
      else if (serviceMethod.includes("postal") || serviceMethod.includes("mail")) serviceMethod = "postal";
      else if (serviceMethod.includes("mlat")) serviceMethod = "mlat";
      else serviceMethod = "email";

      // Clean notes from HTML
      let cleanNotes = row["Notes"] || "";
      if (cleanNotes) {
        cleanNotes = cleanNotes.replace(/<[^>]*>/g, '').trim();
      }

      return {
        id: index + 1,
        name: row["VASP Name"] || row["Title"] || "Unknown",
        legal_name: row["Title"] || row["VASP Name"] || "Unknown", 
        service_name: row["VASP Name"] || row["Title"] || "Unknown",
        jurisdiction: jurisdiction,
        service_address: row["Legal Address"] || "Unknown",
        legal_contact_email: row["Compliance Email"] || "",
        compliance_email: row["Compliance Email"] || "",
        phone: row["Phone Number"] && row["Phone Number"] !== "NA" ? row["Phone Number"] : "",
        preferred_method: serviceMethod,
        processing_time: "5-10 business days",
        accepts_international: true,
        accepts_us_service: jurisdiction === "United States" || jurisdiction === "Unknown",
        has_own_portal: serviceMethod === "portal" || serviceMethod === "kodex" || 
                        (row["Compliance Portal"] && row["Compliance Portal"] !== "http://NA"),
        law_enforcement_url: row["Compliance Portal"] || "",
        info_types: ["KYC", "Transaction History", "Account Balance", "Login Records"],
        last_updated: row["Updated Date"] ? new Date(row["Updated Date"]).toISOString().split('T')[0] : "2024-01-01",
        required_document: row["Required Document"] || "Letterhead",
        notes: cleanNotes
      };
    });

    // Update cache
    vaspCache = processedVASPs;
    cacheTimestamp = now;

    return processedVASPs;
  } catch (error) {
    console.error('Error loading VASP data:', error);
    // Return minimal fallback data
    return [{
      id: 1,
      name: "Error Loading Data",
      legal_name: "Please check CSV file",
      jurisdiction: "Unknown",
      compliance_email: "support@example.com",
      preferred_method: "email"
    }];
  }
};

// Routes
router.use(authMiddleware);

// GET /api/vasps
router.get('/', async (req, res) => {
  try {
    const vasps = await loadVASPData();
    res.json(vasps);
  } catch (error) {
    console.error('Error getting VASPs:', error);
    res.status(500).json({ error: 'Failed to load VASP data' });
  }
});

// GET /api/vasps/:id
router.get('/:id', async (req, res) => {
  try {
    const vasps = await loadVASPData();
    const vasp = vasps.find(v => v.id === parseInt(req.params.id));
    
    if (!vasp) {
      return res.status(404).json({ error: 'VASP not found' });
    }
    
    res.json(vasp);
  } catch (error) {
    console.error('Error getting VASP:', error);
    res.status(500).json({ error: 'Failed to load VASP data' });
  }
});

module.exports = router;