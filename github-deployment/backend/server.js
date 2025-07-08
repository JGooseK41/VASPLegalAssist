const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// FORCE REDEPLOY - Run migrations before starting server
console.log('🚀 VASP Legal Assistant Backend Starting...');
console.log('Version: 1.0.3 - FORCE REDEPLOY WITH MIGRATE FIX');
console.log('Time:', new Date().toISOString());
console.log('🔧 All routes now use isActive field instead of status field');

const { execSync } = require('child_process');
console.log('\n🔧 Running database migrations...');
try {
  console.log('Step 1: Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('Step 2: Deploying migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('✅ Migrations completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('Continuing anyway - migrations might already be applied');
}

// Check if VASPs need to be migrated
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndMigrateVasps() {
  try {
    const vaspCount = await prisma.vasp.count();
    console.log(`\n📊 Found ${vaspCount} VASPs in database`);
    
    if (vaspCount === 0) {
      console.log('🚀 No VASPs found, running migration from CSV...');
      execSync('node scripts/migrate-vasps-to-db-fixed.js', { stdio: 'inherit' });
    }
  } catch (error) {
    console.error('Error checking VASPs:', error.message);
  }
}

checkAndMigrateVasps();

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

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  // Allow file downloads
  exposedHeaders: ['Content-Disposition', 'Content-Type']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

// Routes
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start file cleanup service
  startFileCleanup();
  console.log('File cleanup service started');
});