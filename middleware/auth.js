const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (prioritized for tab isolation)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.userId).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // RBAC Enhancement: Map employees to their contractor's data via companyName
      if (req.user.role === 'employee') {
        const contractor = await User.findOne({ 
          companyName: req.user.companyName, 
          role: { $in: ['contractor', 'admin'] } 
        });
        req.user.contractorId = contractor ? contractor._id : req.user._id;
      } else {
        req.user.contractorId = req.user._id;
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// @desc   Middleware to block write operations for non-admins (specifically employees).
//         GET requests are allowed for all roles.
const checkAdmin = (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }

  if (req.user && req.user.role === 'employee') {
    return res.status(403).json({
      message: 'Access denied. Employees have view-only access.',
    });
  }

  next();
};

module.exports = { protect, checkAdmin };
