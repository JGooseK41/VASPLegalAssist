const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CleanupService {
  static async cleanupUnverifiedUsers() {
    console.log('🧹 Starting cleanup of unverified users...');
    
    try {
      // Remove users that are:
      // 1. Not email verified
      // 2. Not approved
      // 3. Older than 10 hours
      // 4. Have no associated data (to avoid removing legitimate pending users)
      
      const tenHoursAgo = new Date();
      tenHoursAgo.setHours(tenHoursAgo.getHours() - 10);
      
      // First, find users that qualify for cleanup
      const usersToCheck = await prisma.user.findMany({
        where: {
          isEmailVerified: false,
          isApproved: false,
          createdAt: {
            lt: tenHoursAgo
          }
        },
        include: {
          documents: true,
          templates: true,
          comments: true,
          vaspSubmissions: true,
          votes: true,
          vaspResponses: true
        }
      });
      
      // Filter to only users with no associated data
      const usersToDelete = usersToCheck.filter(user => 
        user.documents.length === 0 &&
        user.templates.length === 0 &&
        user.comments.length === 0 &&
        user.vaspSubmissions.length === 0 &&
        user.votes.length === 0 &&
        user.vaspResponses.length === 0
      );
      
      if (usersToDelete.length === 0) {
        console.log('✅ No unverified users to clean up');
        return { cleaned: 0, emails: [] };
      }
      
      console.log(`Found ${usersToDelete.length} unverified users older than 10 hours with no data`);
      
      const userIds = usersToDelete.map(user => user.id);
      const emails = usersToDelete.map(user => user.email);
      
      // Clean up related data first
      await prisma.userSession.deleteMany({
        where: { userId: { in: userIds } }
      });
      
      await prisma.passwordResetToken.deleteMany({
        where: { userId: { in: userIds } }
      });
      
      // Delete the users
      const deleteResult = await prisma.user.deleteMany({
        where: {
          id: { in: userIds }
        }
      });
      
      console.log(`✅ Cleaned up ${deleteResult.count} unverified users`);
      console.log('📧 Freed up emails:', emails.join(', '));
      
      return { 
        cleaned: deleteResult.count, 
        emails: emails 
      };
      
    } catch (error) {
      console.error('❌ Error during unverified user cleanup:', error);
      throw error;
    }
  }
  
  static async cleanupExpiredSessions() {
    console.log('🧹 Starting cleanup of expired sessions...');
    
    try {
      const now = new Date();
      
      const deleteResult = await prisma.userSession.deleteMany({
        where: {
          expiresAt: {
            lt: now
          }
        }
      });
      
      console.log(`✅ Cleaned up ${deleteResult.count} expired sessions`);
      return { cleaned: deleteResult.count };
      
    } catch (error) {
      console.error('❌ Error during session cleanup:', error);
      throw error;
    }
  }
  
  static async cleanupExpiredPasswordResets() {
    console.log('🧹 Starting cleanup of expired password reset tokens...');
    
    try {
      const now = new Date();
      
      const deleteResult = await prisma.passwordResetToken.deleteMany({
        where: {
          expiresAt: {
            lt: now
          }
        }
      });
      
      console.log(`✅ Cleaned up ${deleteResult.count} expired password reset tokens`);
      return { cleaned: deleteResult.count };
      
    } catch (error) {
      console.error('❌ Error during password reset cleanup:', error);
      throw error;
    }
  }
  
  static async runAllCleanups() {
    console.log('🚀 Running all scheduled cleanups...');
    
    try {
      const results = {
        unverifiedUsers: await this.cleanupUnverifiedUsers(),
        expiredSessions: await this.cleanupExpiredSessions(),
        expiredPasswordResets: await this.cleanupExpiredPasswordResets(),
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ All cleanups completed successfully');
      return results;
      
    } catch (error) {
      console.error('❌ Error during scheduled cleanup:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

module.exports = CleanupService;