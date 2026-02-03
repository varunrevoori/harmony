const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../Models/User');
const Provider = require('../Models/Provider');
const { generateToken } = require('../Utils/tokenGenerator');
const { createManualLog } = require('../Middlewares/auditLog');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['SYSTEM_ADMIN', 'SERVICE_PROVIDER', 'END_USER'])
    .withMessage('Invalid role'),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { name, email, password, role, phone, businessName, serviceType, description } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create user
    const user = new User({
      name,
      email,
      password,
      role,
      phone: phone || ''
    });
    
    await user.save();
    
    // If registering as SERVICE_PROVIDER, create provider profile
    if (role === 'SERVICE_PROVIDER' && businessName && serviceType) {
      const provider = new Provider({
        userId: user._id,
        businessName: businessName,
        serviceType: serviceType,
        description: description || '',
        pricing: {
          basePrice: req.body.basePrice || 0,
          currency: 'USD',
          pricingModel: 'PER_SESSION'
        }
      });
      
      await provider.save();
      
      // Audit log for provider creation
      await createManualLog(
        user._id,
        'PROVIDER_CREATED',
        'PROVIDER',
        provider._id,
        { email: user.email, role: user.role },
        { ipAddress: req.ip }
      );
    }
    
    // Create audit log
    await createManualLog(
      user._id,
      'USER_CREATED',
      'USER',
      user._id,
      { email: user.email, role: user.role },
      { ipAddress: req.ip }
    );
    
    // Generate token
    const token = generateToken({ userId: user._id, role: user.role });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved
        },
        token
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return token
 * @access  Public
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { email, password } = req.body;
    
    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact support.'
      });
    }
    
    // Check if provider is approved (for SERVICE_PROVIDER role)
    if (user.role === 'SERVICE_PROVIDER' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your provider account is pending approval'
      });
    }
    
    // Create audit log
    await createManualLog(
      user._id,
      'USER_LOGIN',
      'USER',
      user._id,
      { email: user.email, role: user.role },
      { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
    );
    
    // Generate token
    const token = generateToken({ userId: user._id, role: user.role });
    
    // Get provider profile if applicable
    let providerProfile = null;
    if (user.role === 'SERVICE_PROVIDER') {
      providerProfile = await Provider.findOne({ userId: user._id });
    }
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
          isActive: user.isActive
        },
        providerProfile: providerProfile ? {
          id: providerProfile._id,
          businessName: providerProfile.businessName,
          serviceType: providerProfile.serviceType
        } : null,
        token
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token and return user data
 * @access  Private
 */
router.get('/verify', require('../Middlewares/auth'), async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
});

module.exports = router;
