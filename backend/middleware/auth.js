const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database
    const user = await User.findOne({ userId: decoded.userId, isActive: true });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 1) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Middleware to require elder role
const requireElder = (req, res, next) => {
  if (req.user.role !== 2) {
    return res.status(403).json({
      success: false,
      message: 'Elder access required'
    });
  }
  next();
};

// Middleware to require caregiver role
const requireCaregiver = (req, res, next) => {
  if (req.user.role !== 3) {
    return res.status(403).json({
      success: false,
      message: 'Caregiver access required'
    });
  }
  next();
};

// Middleware to require admin or caregiver role
const requireAdminOrCaregiver = (req, res, next) => {
  if (req.user.role !== 1 && req.user.role !== 3) {
    return res.status(403).json({
      success: false,
      message: 'Admin or caregiver access required'
    });
  }
  next();
};

// Middleware to require admin or elder role
const requireAdminOrElder = (req, res, next) => {
  if (req.user.role !== 1 && req.user.role !== 2) {
    return res.status(403).json({
      success: false,
      message: 'Admin or elder access required'
    });
  }
  next();
};

module.exports = {
  auth,
  requireAdmin,
  requireElder,
  requireCaregiver,
  requireAdminOrCaregiver,
  requireAdminOrElder
};
