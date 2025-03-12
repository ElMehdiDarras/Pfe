// test-auth.js
const { authenticateToken } = require('./middleware/auth');
console.log('Type of authenticateToken:', typeof authenticateToken);

// Mock request, response, and next
const req = {};
const res = { status: () => ({ json: () => {} }) };
const next = () => console.log('Next function called');

try {
  // Try calling the middleware
  authenticateToken(req, res, next);
  console.log('Middleware executed without errors');
} catch (error) {
  console.error('Error executing middleware:', error);
}