const crypto = require('crypto');
const prisma = require('../config/database');

// Simple IP geolocation using a free service
async function getGeoLocation(ip) {
  try {
    // For local/private IPs, return default location
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return {
        country: 'Local',
        countryCode: 'XX',
        region: 'Local',
        city: 'Local'
      };
    }

    // Use ip-api.com free service (no API key required)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || null,
        countryCode: data.countryCode || null,
        region: data.regionName || null,
        city: data.city || null,
        latitude: data.lat || null,
        longitude: data.lon || null
      };
    }
  } catch (error) {
    console.error('Geolocation error:', error);
  }
  
  return {
    country: null,
    countryCode: null,
    region: null,
    city: null,
    latitude: null,
    longitude: null
  };
}

// Anonymize IP address for privacy
function anonymizeIp(ip) {
  if (!ip) return 'unknown';
  
  // For IPv4, remove last octet
  if (ip.includes('.')) {
    const parts = ip.split('.');
    parts[3] = '0';
    return parts.join('.');
  }
  
  // For IPv6, keep only first 3 segments
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 3).join(':') + '::';
  }
  
  return 'unknown';
}

// Get client IP from various headers
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.connection.socket?.remoteAddress ||
         'unknown';
}

// Track visitor session
async function trackVisitor(req, res, next) {
  try {
    // Skip tracking for certain paths
    const skipPaths = ['/api/health', '/api/analytics', '/favicon.ico', '/robots.txt', '/api/contributors'];
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Skip tracking for non-GET requests to avoid double counting
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip tracking for API calls (only track page views)
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    const ip = getClientIp(req);
    const anonymizedIp = anonymizeIp(ip);
    const userAgent = req.headers['user-agent'] || null;
    const referrer = req.headers['referer'] || req.headers['referrer'] || null;
    
    // Get or create session ID from cookie
    let sessionId;
    if (process.env.COOKIE_SECRET || process.env.SESSION_SECRET) {
      sessionId = req.signedCookies?.sessionId;
    } else {
      sessionId = req.cookies?.sessionId;
    }
    
    if (!sessionId) {
      // Create new session without geolocation first (non-blocking)
      const session = await prisma.visitorSession.create({
        data: {
          anonymizedIp,
          userAgent,
          country: 'Pending',
          countryCode: 'XX'
        }
      });
      
      sessionId = session.id;
      
      // Set session cookie (expires in 30 minutes)
      const cookieOptions = {
        maxAge: 30 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      };
      
      // Only sign cookies if a secret is available
      if (process.env.COOKIE_SECRET || process.env.SESSION_SECRET) {
        cookieOptions.signed = true;
      }
      
      res.cookie('sessionId', sessionId, cookieOptions);
      
      // Update geolocation asynchronously (non-blocking)
      getGeoLocation(ip).then(geo => {
        if (geo) {
          prisma.visitorSession.update({
            where: { id: sessionId },
            data: geo
          }).catch(err => console.error('Error updating geo:', err));
        }
      }).catch(err => console.error('Geolocation error:', err));
    }
    
    // Track page view
    const startTime = Date.now();
    
    // Store session ID for later use
    req.sessionId = sessionId;
    
    // Track response time
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      // Create page view record asynchronously
      prisma.pageView.create({
        data: {
          sessionId,
          path: req.path,
          duration
        }
      }).catch(err => console.error('Error tracking page view:', err));
      
      return originalSend.call(this, data);
    };
    
    next();
  } catch (error) {
    console.error('Analytics tracking error:', error);
    next(); // Don't block the request
  }
}

module.exports = { trackVisitor };