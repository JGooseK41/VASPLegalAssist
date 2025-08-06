const express = require('express');
const prisma = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Custom admin check middleware that accepts both ADMIN and MASTER_ADMIN
const requireAdminAccess = (req, res, next) => {
  console.log('Analytics access check:', {
    userId: req.userId,
    userRole: req.userRole,
    hasRole: !!req.userRole,
    isAdmin: req.userRole === 'ADMIN',
    isMasterAdmin: req.userRole === 'MASTER_ADMIN',
    headers: req.headers.authorization ? 'Present' : 'Missing'
  });
  
  if (!req.userRole || (req.userRole !== 'ADMIN' && req.userRole !== 'MASTER_ADMIN')) {
    console.log('Analytics access denied:', {
      userRole: req.userRole,
      reason: !req.userRole ? 'No role set' : 'Insufficient permissions'
    });
    return res.status(403).json({ 
      error: 'Insufficient permissions',
      message: 'You do not have permission to access analytics. This feature requires administrator privileges.',
      required: 'ADMIN or MASTER_ADMIN',
      current: req.userRole || 'none',
      debug: {
        hasRole: !!req.userRole,
        roleValue: req.userRole
      }
    });
  }
  console.log('Analytics access granted for:', req.userRole);
  next();
};

// Health check endpoint - no auth required
router.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.1', // Updated to track deployments
    message: 'Analytics routes are loaded'
  });
});

// Debug endpoint to check visitor data
router.get('/debug', requireAuth, requireAdminAccess, async (req, res) => {
  try {
    const visitorCount = await prisma.visitorSession.count();
    const pageViewCount = await prisma.pageView.count();
    const recentVisitors = await prisma.visitorSession.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { pageViews: true }
    });
    
    res.json({
      visitorCount,
      pageViewCount,
      recentVisitors,
      message: visitorCount === 0 ? 'No visitor data yet. The tracking may not be working or no visitors have been tracked.' : 'Data found'
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get analytics summary
router.get('/summary', requireAuth, requireAdminAccess, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get session counts
    const sessionCounts = await prisma.visitorSession.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // Get total sessions
    const totalSessions = await prisma.visitorSession.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });
    
    // Get total page views
    const totalPageViews = await prisma.pageView.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });
    
    // Get page views by path
    const pageViews = await prisma.pageView.groupBy({
      by: ['path'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });
    
    // Get geographic distribution
    const countries = await prisma.visitorSession.groupBy({
      by: ['country', 'countryCode'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        country: {
          not: null
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });
    
    // Get cities
    const cities = await prisma.visitorSession.groupBy({
      by: ['city', 'country'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        city: {
          not: null
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });
    
    // Get daily visitor counts
    let dailyVisitors = [];
    try {
      dailyVisitors = await prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*)::int as visitors
        FROM "VisitorSession"
        WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `;
    } catch (error) {
      console.error('Daily visitors query error:', error);
      // Return empty array if query fails
      dailyVisitors = [];
    }
    
    res.json({
      summary: {
        totalSessions,
        totalPageViews,
        averageSessionDuration: totalSessions > 0 ? Math.round(totalPageViews / totalSessions) : 0,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      },
      dailyVisitors: dailyVisitors.map(row => ({
        date: row.date,
        visitors: parseInt(row.visitors)
      })),
      topPages: pageViews.map(page => ({
        path: page.path,
        views: page._count.id
      })),
      countries: countries.map(country => ({
        country: country.country,
        countryCode: country.countryCode,
        visitors: country._count.id
      })),
      cities: cities.map(city => ({
        city: city.city,
        country: city.country,
        visitors: city._count.id
      }))
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    
    // Check if it's a missing table error
    if (error.code === 'P2021' || error.message.includes('does not exist')) {
      return res.status(500).json({ 
        error: 'Analytics tables not found',
        message: 'The analytics database tables are not set up. Please run database migrations.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to get analytics summary',
      message: error.message 
    });
  }
});

// Get detailed visitor sessions
router.get('/sessions', requireAuth, requireAdminAccess, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      country, 
      city, 
      page = 1, 
      limit = 50 
    } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Build where clause
    const where = {
      createdAt: {
        gte: start,
        lte: end
      }
    };
    
    if (country) {
      where.country = country;
    }
    
    if (city) {
      where.city = city;
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const sessions = await prisma.visitorSession.findMany({
      where,
      include: {
        pageViews: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: parseInt(limit)
    });
    
    const totalSessions = await prisma.visitorSession.count({ where });
    
    res.json({
      sessions: sessions.map(session => ({
        id: session.id,
        anonymizedIp: session.anonymizedIp,
        country: session.country,
        city: session.city,
        userAgent: session.userAgent,
        referrer: session.referrer,
        createdAt: session.createdAt,
        pageViews: session.pageViews.map(pv => ({
          path: pv.path,
          duration: pv.duration,
          createdAt: pv.createdAt
        }))
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalSessions,
        totalPages: Math.ceil(totalSessions / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Analytics sessions error:', error);
    res.status(500).json({ error: 'Failed to get visitor sessions' });
  }
});

// Get real-time visitor count
router.get('/realtime', requireAuth, requireAdminAccess, async (req, res) => {
  try {
    // Count sessions from last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const activeVisitors = await prisma.visitorSession.count({
      where: {
        createdAt: {
          gte: thirtyMinutesAgo
        }
      }
    });
    
    // Get recent page views
    const recentViews = await prisma.pageView.findMany({
      where: {
        createdAt: {
          gte: thirtyMinutesAgo
        }
      },
      include: {
        session: {
          select: {
            country: true,
            city: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });
    
    res.json({
      activeVisitors,
      recentViews: recentViews.map(view => ({
        path: view.path,
        createdAt: view.createdAt,
        location: view.session.city && view.session.country 
          ? `${view.session.city}, ${view.session.country}`
          : view.session.country || 'Unknown'
      }))
    });
  } catch (error) {
    console.error('Real-time analytics error:', error);
    res.status(500).json({ error: 'Failed to get real-time analytics' });
  }
});

// GET /api/analytics/user-sessions - Get user access logs
router.get('/user-sessions', requireAuth, requireAdminAccess, async (req, res) => {
  try {
    const { startDate, endDate, isActive } = req.query;
    
    // Build where clause for filtering
    const where = {};
    
    if (startDate || endDate) {
      where.loginAt = {};
      if (startDate) {
        where.loginAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.loginAt.lte = end;
      }
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    // Get user sessions with user details
    const sessions = await prisma.userSession.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            agencyName: true,
            role: true
          }
        }
      },
      orderBy: {
        lastActivity: 'desc'
      },
      take: 100 // Limit to 100 most recent sessions
    });
    
    // Get counts for summary
    const activeSessions = await prisma.userSession.count({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });
    
    const totalSessions = await prisma.userSession.count({
      where: where.loginAt ? { loginAt: where.loginAt } : {}
    });
    
    res.json({
      sessions,
      summary: {
        activeSessions,
        totalSessions
      }
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({ error: 'Failed to fetch user sessions' });
  }
});

module.exports = router;