const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');
const { notifyUserRegistered } = require('../utils/notificationHelper');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: errors.array()[0].msg,
          errors: errors.array() 
        });
      }

      const { name, email, password, role } = req.body;

      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'Email id should not be a duplicate in database' });
      }

      // Create user with role (default to employee if not provided)
      const validRoles = ['employee', 'technician', 'manager', 'admin'];
      const userRole = role && validRoles.includes(role) ? role : 'employee';

      user = new User({
        name,
        email,
        password,
        role: userRole,
      });

      await user.save();

      // Send welcome email (optional, non-blocking)
      sendWelcomeEmail(user.email, user.name).catch(err => 
        console.error('Failed to send welcome email:', err)
      );

      // Create welcome notification
      notifyUserRegistered(user._id, user.name).catch(err =>
        console.error('Failed to create welcome notification:', err)
      );

      // Create token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: errors.array()[0].msg,
          errors: errors.array() 
        });
      }

      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ message: 'Account not exist' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid Password' });
      }

      // Create token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: errors.array()[0].msg,
          errors: errors.array() 
        });
      }

      const { email } = req.body;
      console.log('Password reset requested for:', email);

      // Find user by email
      const user = await User.findOne({ email });
      
      if (!user) {
        console.log('User not found:', email);
        return res.status(404).json({ 
          message: 'No account found with that email address' 
        });
      }

      console.log('User found, generating reset token...');
      
      // Generate reset token
      const resetToken = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });
      
      console.log('Reset token generated, sending email...');

      // Send email
      try {
        await sendPasswordResetEmail(user.email, resetToken);
        console.log('Password reset email sent successfully');
        
        res.json({ 
          success: true,
          message: 'Password reset email sent successfully' 
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        
        // If email fails, clear reset token
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        
        return res.status(500).json({ 
          message: 'Failed to send email. Please check your email configuration.',
          error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.post(
  '/reset-password/:token',
  [
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: errors.array()[0].msg,
          errors: errors.array() 
        });
      }

      // Hash the token from URL
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

      // Find user with valid token
      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ 
          message: 'Invalid or expired reset token' 
        });
      }

      // Set new password
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      // Create token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      res.json({
        success: true,
        message: 'Password reset successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
