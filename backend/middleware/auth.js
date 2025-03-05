const jwt = require('jsonwebtoken');
const User = require('../models/users');

// Middleware to authenticate users via JWT
const auth = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } 
    // Also check for token in cookies (for web browser clients)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'alarm-manager-secret');
    
    // Find the user
    const user = await User.findById(decoded.id);
    if (!user || !user.active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Add user to request object
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    // Handle token verification failures
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware to check if user is an administrator
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  next();
};

// Middleware to check if user is a supervisor or administrator
const isSupervisorOrAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'supervisor' && req.user.role !== 'administrator')) {
    return res.status(403).json({ error: 'Supervisor or administrator access required' });
  }
  next();
};

// Middleware to check if user has access to a specific site
const hasSiteAccess = (req, res, next) => {
  // Get site ID from request params or query
  const siteId = req.params.id || req.params.siteId || req.query.siteId;
  
  if (!siteId) {
    return next(); // No site specified, continue
  }
  
  // Supervisors and administrators have access to all sites
  if (req.user.role === 'supervisor' || req.user.role === 'administrator') {
    return next();
  }
  
  // For agents, check site access
  // Note: siteId might be a MongoDB ObjectId or a site name, handle both cases
  let siteName;
  if (siteId.match(/^[0-9a-fA-F]{24}$/)) {
    // This is a MongoDB ObjectId, need to look up the site
    // This part would need to be adjusted based on how you store site IDs
    // For example, if you're passing the site name directly:
    siteName = siteId.replace(/-/g, ' ');
  } else {
    siteName = siteId;
  }
  
  if (!req.user.sites.includes(siteName)) {
    return res.status(403).json({ error: 'You do not have access to this site' });
  }
  
  next();
};

module.exports = {
  auth,
  isAdmin,
  isSupervisorOrAdmin,
  hasSiteAccess
};