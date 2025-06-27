// config/trusted-ips.js
/**
 * List of trusted IP addresses that are allowed access without authentication
 * Used for system components and internal services
 */
const TRUSTED_IPS = [
    '10.29.92.41',    
    '10.29.145.245',
    '10.29.94.41',
    '10.29.143.94',
    '10.29.96.41',
    '10.29.98.41',
    '10.29.127.41',
    '10.29.125.41',
    '10.29.133.21',
    '10.29.133.22',
    '10.29.136.22',
    '10.29.139.21',
    '10.29.139.22',  
    '127.0.0.1',      
    'localhost',      
  ];
  
  module.exports = TRUSTED_IPS;