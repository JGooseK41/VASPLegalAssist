const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/debug/vasps - Simple VASP check without auth
router.get('/vasps', async (req, res) => {
  try {
    // Count VASPs
    const count = await prisma.vasp.count();
    
    // Get first 5 VASPs
    const vasps = await prisma.vasp.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        jurisdiction: true,
        isActive: true,
        compliance_email: true
      }
    });
    
    res.json({
      success: true,
      count: count,
      sample: vasps,
      message: `Found ${count} VASPs in database`
    });
  } catch (error) {
    console.error('Debug VASP error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/debug/test-transform - Test the transformation logic
router.get('/test-transform', async (req, res) => {
  try {
    // Get one VASP and show both raw and transformed
    const rawVasp = await prisma.vasp.findFirst();
    
    if (!rawVasp) {
      return res.json({ message: 'No VASPs found' });
    }
    
    // Apply transformation
    const transformed = {
      id: rawVasp.id,
      name: rawVasp.name || "Unknown",
      legal_name: rawVasp.legalName || rawVasp.name || "Unknown",
      jurisdiction: rawVasp.jurisdiction || "Unknown",
      compliance_email: rawVasp.complianceEmail || rawVasp.supportEmail || "",
      // ... other fields
    };
    
    res.json({
      raw: rawVasp,
      transformed: transformed
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;