const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get analytics summary
router.get('/summary', requireAuth, requireRole('ADMIN'), async (req, res) => {
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
    const dailyVisitors = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as visitors
      FROM "VisitorSession"
      WHERE created_at >= ${start} AND created_at <= ${end}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
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
    res.status(500).json({ error: 'Failed to get analytics summary' });
  }
});

// Get detailed visitor sessions
router.get('/sessions', requireAuth, requireRole('ADMIN'), async (req, res) => {
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
router.get('/realtime', requireAuth, requireRole('ADMIN'), async (req, res) => {
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

module.exports = router;