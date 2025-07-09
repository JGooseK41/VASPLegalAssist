const jwt = require('jsonwebtoken');
require('dotenv').config();

// Test JWT generation and decoding
function testJWT() {
  const testUserId = 'test-user-id';
  const testRole = 'MASTER_ADMIN';
  
  console.log('Testing JWT with:');
  console.log('  User ID:', testUserId);
  console.log('  Role:', testRole);
  console.log('  JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
  console.log('');
  
  // Generate token
  const token = jwt.sign({ userId: testUserId, role: testRole }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
  
  console.log('Generated token:', token);
  console.log('');
  
  // Decode token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:');
    console.log('  User ID:', decoded.userId);
    console.log('  Role:', decoded.role);
    console.log('  Issued at:', new Date(decoded.iat * 1000));
    console.log('  Expires at:', new Date(decoded.exp * 1000));
  } catch (error) {
    console.error('Error decoding token:', error.message);
  }
}

testJWT();