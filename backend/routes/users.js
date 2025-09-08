const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, requireAdmin, requireAdminOrCaregiver } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Register new user
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('contactNumber').trim().isLength({ min: 10 }).withMessage('Valid contact number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn([1, 2, 3]).withMessage('Valid role is required'),
  body('age').optional().isInt({ min: 0, max: 150 }).withMessage('Valid age is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, contactNumber, password, role, age } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { contactNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or contact number already exists'
      });
    }

    // Generate unique userId
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new user
    const user = new User({
      userId,
      name,
      email,
      contactNumber,
      password,
      role,
      age: age || null
    });

    await user.save();

    // Generate token
    const token = generateToken(userId);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user.userId);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get all users (admin only)
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;
    
    let query = { isActive: true };
    
    // Filter by role if specified
    if (role) {
      query.role = parseInt(role);
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: skip + users.length < total,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

// Get user by ID
router.get('/:userId', auth, requireAdminOrCaregiver, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ userId, isActive: true })
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user'
    });
  }
});

// Search for elders by contact number (for caregivers)
router.get('/search/elders', auth, requireAdminOrCaregiver, async (req, res) => {
  try {
    const { contactNumber } = req.query;
    
    if (!contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Contact number is required'
      });
    }
    
    const elder = await User.findOne({
      contactNumber: contactNumber.trim(),
      role: 2,
      isActive: true
    }).select('-password');
    
    if (!elder) {
      return res.status(404).json({
        success: false,
        message: 'No elder found with this contact number'
      });
    }
    
    res.json({
      success: true,
      elder: {
        userId: elder.userId,
        name: elder.name,
        contactNumber: elder.contactNumber,
        email: elder.email,
        age: elder.age
      }
    });
    
  } catch (error) {
    console.error('Error searching for elder:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching for elder'
    });
  }
});

// Get elders by contact number
router.get('/phone/:contactNumber', auth, requireAdminOrCaregiver, async (req, res) => {
  try {
    const { contactNumber } = req.params;
    
    const elder = await User.findOne({
      contactNumber: contactNumber.trim(),
      role: 2,
      isActive: true
    }).select('-password');
    
    if (!elder) {
      return res.status(404).json({
        success: false,
        message: 'No elder found with this contact number'
      });
    }
    
    res.json({
      success: true,
      elder: {
        userId: elder.userId,
        name: elder.name,
        contactNumber: elder.contactNumber,
        email: elder.email,
        age: elder.age
      }
    });
    
  } catch (error) {
    console.error('Error fetching elder by phone:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching elder'
    });
  }
});

// Get all elders (for admin/caregiver)
router.get('/role/elders', auth, requireAdminOrCaregiver, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = { role: 2, isActive: true };
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const elders = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      elders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalElders: total,
        hasNext: skip + elders.length < total,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching elders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching elders'
    });
  }
});

// Update user (admin only)
router.put('/:userId', auth, requireAdmin, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('contactNumber').optional().trim().isLength({ min: 10 }).withMessage('Valid contact number is required'),
  body('role').optional().isIn([1, 2, 3]).withMessage('Valid role is required'),
  body('age').optional().isInt({ min: 0, max: 150 }).withMessage('Valid age is required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { userId } = req.params;
    const updates = req.body;
    
    // Remove password from updates if present
    delete updates.password;
    
    const user = await User.findOneAndUpdate(
      { userId },
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
});

// Delete user (admin only) - soft delete
router.delete('/:userId', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOneAndUpdate(
      { userId },
      { isActive: false },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deactivated successfully',
      user
    });
    
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deactivating user'
    });
  }
});

module.exports = router;









