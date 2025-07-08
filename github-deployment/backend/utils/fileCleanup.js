const fs = require('fs').promises;
const path = require('path');

// Clean up old generated files (older than 24 hours)
async function cleanupOldFiles() {
  try {
    const directories = [
      path.join(__dirname, '../generated-docs'),
      path.join(__dirname, '../generated-pdfs'),
      path.join(__dirname, '../temp/uploads')
    ];
    
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const zipMaxAge = 6 * 60 * 60 * 1000; // 6 hours for ZIP files
    
    for (const dir of directories) {
      try {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.isFile()) {
            // ZIP files have shorter retention period
            const isZip = file.endsWith('.zip');
            const fileMaxAge = isZip ? zipMaxAge : maxAge;
            
            if ((now - stats.mtimeMs) > fileMaxAge) {
              await fs.unlink(filePath);
              console.log(`Cleaned up old file: ${file} (${isZip ? 'ZIP' : 'regular'})`);
            }
          }
        }
      } catch (error) {
        // Directory might not exist yet
        if (error.code !== 'ENOENT') {
          console.error(`Error cleaning directory ${dir}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('File cleanup error:', error);
  }
}

// Run cleanup every 6 hours
function startFileCleanup() {
  // Run immediately on startup
  cleanupOldFiles();
  
  // Then run every 6 hours
  setInterval(cleanupOldFiles, 6 * 60 * 60 * 1000);
}

module.exports = {
  cleanupOldFiles,
  startFileCleanup
};