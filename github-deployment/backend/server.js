const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');

// Load environment variables
dotenv.config();

// Start server
console.log('🚀 VASP Legal Assistant Backend Starting...');
console.log('Version: 1.0.4');
console.log('Time:', new Date().toISOString());

// Initialize Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const templateRoutes = require('./routes/templates');
const documentRoutes = require('./routes/documents');
const vaspRoutes = require('./routes/vasps');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');
const submissionRoutes = require('./routes/submissions');
const contributorRoutes = require('./routes/contributors');
const vaspResponseRoutes = require('./routes/vaspResponses');
const migrateRoutes = require('./routes/migrate');
const debugRoutes = require('./routes/debug');
const analyticsRoutes = require('./routes/analytics');
const encryptedDocumentRoutes = require('./routes/encryptedDocuments');
const { trackVisitor } = require('./middleware/analytics');
const { startFileCleanup } = require('./utils/fileCleanup');

const app = express();

// Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Note: unsafe-eval needed for some libraries
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate Limiting Configuration
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // Increased from 100 to 500
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain IPs if needed
  skip: (req) => {
    // You can add IP whitelist logic here if needed
    return false;
  }
});

// CORS Configuration - MUST come before rate limiting to ensure headers are always set
// Temporary fix for production
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
const clientUrl = process.env.CLIENT_URL?.trim();
const allowedOrigins = [
  'https://theblockrecord.com',
  'https://www.theblockrecord.com',
  'http://localhost:3000',
  'http://localhost:3001',
  ...allowedOriginsEnv
];
if (clientUrl) allowedOrigins.push(clientUrl);

console.log('CORS Configuration - Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    console.log('CORS check - Request origin:', origin);
    
    // Allow requests with no origin (like mobile apps)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS BLOCKED - Origin not in allowed list:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'Content-Type'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS before anything else to ensure headers are always set
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || process.env.SESSION_SECRET));

// Apply rate limiting AFTER CORS
app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);

// Analytics tracking middleware
app.use(trackVisitor);

// Static files for PDFs, Word documents, and templates with proper Content-Type headers
app.use('/pdfs', express.static(path.join(__dirname, 'generated-pdfs'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment');
    }
  }
}));
app.use('/docs', express.static(path.join(__dirname, 'generated-docs'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.docx')) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment');
    } else if (path.endsWith('.zip')) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment');
    }
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/documents', express.static(path.join(__dirname, 'public/documents')));

// Public routes (no auth required)
app.use('/api/public/vasp-registration', require('./routes/public/vaspRegistration'));

// Protected routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/vasps', vaspRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/contributors', contributorRoutes);
app.use('/api/vasp-responses', vaspResponseRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/encrypted-documents', encryptedDocumentRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const vaspCount = await prisma.vasp.count();
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      vaspCount: vaspCount,
      databaseConnected: true
    });
  } catch (error) {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      vaspCount: 0,
      databaseConnected: false,
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  // Log error details server-side only
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Handle CSRF errors
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ 
      error: 'Invalid or missing CSRF token' 
    });
  }

  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'Cross-origin request blocked' 
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: process.env.NODE_ENV === 'development' ? err.errors : undefined
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ 
    error: statusCode === 500 ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack
    })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start file cleanup service
  startFileCleanup();
  console.log('File cleanup service started');
});