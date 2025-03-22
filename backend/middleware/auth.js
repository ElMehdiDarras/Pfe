const jwt = require('jsonwebtoken');
const Site = require('../models/sites');
const User = require('../models/users');

const TRUSTED_IPS = [
  '10.29.92.41',    
  '10.29.145.245',  
  '127.0.0.1',      
  'localhost',      
];

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

const flexibleAuth = async (req, res, next) => {
  try {
    console.log('Flexible Auth - Request received');
    console.log('Request IP:', req.ip);
    console.log('Connection remote address:', req.connection?.remoteAddress);
    console.log('Socket remote address:', req.socket?.remoteAddress);
    
    // Check if the request is coming from a trusted IP
    const clientIP = req.ip || 
                    req.connection?.remoteAddress || 
                    req.socket?.remoteAddress || 
                    req.connection?.socket?.remoteAddress;
    
    console.log('Original client IP:', clientIP);
    
    // Special check for IPv6 localhost or any localhost representation
    if (clientIP === '::1' || clientIP === 'localhost' || clientIP === '127.0.0.1') {
      console.log('Localhost detected:', clientIP);
      // For localhost, add a system user to the request
      req.user = {
        _id: 'system',
        username: 'system',
        role: 'system'
      };
      return next();
    }
    
    // For non-localhost IPs, clean up (sometimes it comes as ::ffff:127.0.0.1)
    const cleanIP = clientIP ? clientIP.replace(/^.*:/, '') : '';
    console.log('Cleaned IP:', cleanIP);
    
    if (TRUSTED_IPS.includes(cleanIP)) {
      console.log('Trusted IP detected:', clientIP);
      // For trusted IPs, add a system user to the request
      req.user = {
        _id: 'system',
        username: 'system',
        role: 'system'
      };
      return next();
    }
    
    
    // If not from trusted IP, use regular auth
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

// Modify hasSiteAccess to handle name variations
const hasSiteAccess = async (req, res, next) => {
  try {
    if (!req.params.siteId) {
      return next();
    }
    
    if (req.user.role === 'administrator' || req.user.role === 'supervisor') {
      return next();
    }
    
    if (req.user.role === 'agent' && req.user.sites) {
      try {
        const site = await Site.findById(req.params.siteId);
        
        if (!site) {
          // If site not found by ID, it might be a name - continue to other middleware
          return next();
        }
        
        // Normalize names for comparison
        const normalizedSiteName = site.name.replace(/[\s-]/g, '').toLowerCase();
        const hasAccess = req.user.sites.some(userSite => {
          const normalizedUserSite = userSite.replace(/[\s-]/g, '').toLowerCase();
          return normalizedSiteName === normalizedUserSite;
        });
        
        if (!hasAccess) {
          return res.status(403).json({ error: 'You do not have access to this site' });
        }
      } catch (error) {
        // Continue if there's an error - might not be an ObjectId
        return next();
      }
    }
    
    next();
  } catch (error) {
    console.error('Site access check error:', error);
    return res.status(500).json({ error: 'Error checking site access' });
  }
};

module.exports = {
  auth,
  isAdmin,
  isSupervisorOrAdmin,
  flexibleAuth,
  hasSiteAccess
};