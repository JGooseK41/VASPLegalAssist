const express = require('express');
const prisma = require('../config/database');
const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if tables exist
    const tableChecks = await Promise.allSettled([
      prisma.user.count(),
      prisma.vasp.count(),
      prisma.visitorSession.count(),
      prisma.pageView.count(),
      prisma.adminApplication.count(),
      prisma.vaspComment.count(),
      prisma.document.count()
    ]);
    
    const tables = {
      users: tableChecks[0].status === 'fulfilled' ? tableChecks[0].value : 'error',
      vasps: tableChecks[1].status === 'fulfilled' ? tableChecks[1].value : 'error',
      visitorSessions: tableChecks[2].status === 'fulfilled' ? tableChecks[2].value : 'error',
      pageViews: tableChecks[3].status === 'fulfilled' ? tableChecks[3].value : 'error',
      adminApplications: tableChecks[4].status === 'fulfilled' ? tableChecks[4].value : 'error',
      vaspComments: tableChecks[5].status === 'fulfilled' ? tableChecks[5].value : 'error',
      documents: tableChecks[6].status === 'fulfilled' ? tableChecks[6].value : 'error'
    };
    
    res.json({
      status: 'healthy',
      database: 'connected',
      tables,
      timestamp: new Date().toISOString(),
      version: '1.0.4'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;