const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testEndpoint() {
  const prisma = new PrismaClient();

  try {
    // Test user ID from the error
    const userId = 'c627c9e5-6c73-41d8-9734-b17026bb8fed';
    
    console.log(`\nTesting contribution details for user: ${userId}\n`);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found with ID:', userId);
      
      // List some actual users
      const users = await prisma.user.findMany({
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      });
      
      console.log('\nAvailable users:');
      users.forEach(u => {
        console.log(`  - ${u.id}: ${u.firstName} ${u.lastName}`);
      });
      return;
    }
    
    console.log(`✅ Found user: ${user.firstName} ${user.lastName}`);
    
    // Get accepted VASPs
    const acceptedVasps = await prisma.vaspSubmission.findMany({
      where: {
        userId: userId,
        status: 'APPROVED'
      },
      select: {
        vaspName: true,
        jurisdiction: true,
        createdAt: true
      }
    });
    
    console.log(`\nAccepted VASPs: ${acceptedVasps.length}`);
    acceptedVasps.forEach(v => {
      console.log(`  - ${v.vaspName} (${v.jurisdiction})`);
    });
    
    // Get comments
    const comments = await prisma.vaspComment.findMany({
      where: {
        userId: userId
      },
      select: {
        content: true,
        voteScore: true,
        createdAt: true
      },
      take: 5
    });
    
    console.log(`\nComments: ${comments.length}`);
    comments.forEach(c => {
      console.log(`  - "${c.content.substring(0, 50)}..." (${c.voteScore} votes)`);
    });
    
    // Get VASP responses
    const vaspResponses = await prisma.vaspResponse.findMany({
      where: {
        userId: userId
      },
      select: {
        responseType: true,
        turnaroundDays: true
      },
      take: 5
    });
    
    console.log(`\nVASP Responses: ${vaspResponses.length}`);
    vaspResponses.forEach(r => {
      console.log(`  - ${r.responseType} (${r.turnaroundDays || 'N/A'} days)`);
    });
    
    console.log('\n✅ All queries work correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEndpoint();