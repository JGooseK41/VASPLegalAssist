const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// FORCE REDEPLOY - Run migrations before starting server
console.log('🚀 VASP Legal Assistant Backend Starting...');
console.log('Version: 1.0.1 - WITH MIGRATIONS');
console.log('Time:', new Date().toISOString());

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

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for PDFs, Word documents, and templates
app.use('/pdfs', express.static(path.join(__dirname, 'generated-pdfs')));
app.use('/docs', express.static(path.join(__dirname, 'generated-docs')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
});