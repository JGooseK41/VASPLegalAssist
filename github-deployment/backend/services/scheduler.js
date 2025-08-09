const CleanupService = require('./cleanupService');

class Scheduler {
  constructor() {
    this.intervals = [];
  }
  
  start() {
    console.log('📅 Starting scheduled tasks...');
    
    // Run cleanup every 4 hours
    const cleanupInterval = setInterval(async () => {
      try {
        console.log('⏰ Running scheduled cleanup at:', new Date().toISOString());
        await CleanupService.runAllCleanups();
      } catch (error) {
        console.error('❌ Scheduled cleanup failed:', error);
      }
    }, 4 * 60 * 60 * 1000); // 4 hours in milliseconds
    
    this.intervals.push(cleanupInterval);
    
    // Run initial cleanup after 5 minutes (to clean up any existing unverified users)
    const initialCleanup = setTimeout(async () => {
      try {
        console.log('🚀 Running initial cleanup...');
        await CleanupService.runAllCleanups();
      } catch (error) {
        console.error('❌ Initial cleanup failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log('✅ Scheduler started - cleanup will run every 4 hours');
    console.log('📋 Initial cleanup will run in 5 minutes');
  }
  
  stop() {
    console.log('🛑 Stopping scheduled tasks...');
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }
}

module.exports = new Scheduler();