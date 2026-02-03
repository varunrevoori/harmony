/**
 * Role-Based Access Control Middleware
 * Restricts access based on user roles
 */
const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        userRole: req.userRole
      });
    }
    
    next();
  };
};

module.exports = roleCheck;
