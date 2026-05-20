const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Helper to construct a safe RegExp for fuzzy/case-insensitive/whitespace-flexible company name matching
const makeCompanyRegExp = (companyNameInput) => {
  if (!companyNameInput) return /^$/;
  const trimmed = companyNameInput.trim();
  const words = trimmed.split(/\s+/);
  const escapedWords = words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^\\s*${escapedWords.join('\\s+')}\\s*$`, 'i');
};

// @desc    Register a new contractor
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { fullName, companyName, email, password, phoneNumber, role } = req.body;

  try {
    // 1. Validation for required fields
    if (!fullName || !companyName || !email || !password || !phoneNumber) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const assignedRole = role === 'employee' ? 'employee' : 'contractor';
    let assignedCompanyName = companyName.trim();

    if (assignedRole === 'employee') {
      // 2. Check if the company exists (contractor/admin with that companyName)
      const companyExists = await User.findOne({ 
        companyName: { $regex: makeCompanyRegExp(companyName) }, 
        role: { $in: ['contractor', 'admin'] } 
      });
      if (!companyExists) {
        return res.status(404).json({ message: 'Company not found.' });
      }
      assignedCompanyName = companyExists.companyName; // Normalize company name capitalization

      // 3. Check duplicate employee using email + companyName
      const employeeExists = await User.findOne({ 
        email: email.toLowerCase(), 
        companyName: assignedCompanyName, 
        role: 'employee' 
      });
      if (employeeExists) {
        return res.status(400).json({ message: 'Employee already registered.' });
      }

      // Also check if email is registered as a contractor/admin (global uniqueness)
      const contractorExists = await User.findOne({ 
        email: email.toLowerCase(), 
        role: { $in: ['contractor', 'admin'] } 
      });
      if (contractorExists) {
        return res.status(400).json({ message: 'Employee already registered.' });
      }
    } else {
      // Contractor registration: check global email uniqueness
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }
    }

    const user = await User.create({
      fullName,
      companyName: assignedCompanyName,
      email: email.toLowerCase(),
      password,
      phoneNumber,
      role: assignedRole,
    });

    if (user) {
      const token = generateToken(res, user._id);
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        companyName: user.companyName,
        email: user.email,
        role: user.role,
        token: token,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password, companyName } = req.body;

  try {
    // If companyName is provided, it is employee login
    if (companyName !== undefined && companyName !== '') {
      if (!email || !password || !companyName) {
        return res.status(400).json({ message: 'Please fill in all fields' });
      }

      // Verify if the company exists
      const companyExists = await User.findOne({ 
        companyName: { $regex: makeCompanyRegExp(companyName) }, 
        role: { $in: ['contractor', 'admin'] } 
      });
      if (!companyExists) {
        return res.status(404).json({ message: 'Company not found.' });
      }

      // Find the employee in this company
      const employee = await User.findOne({ 
        email: email.toLowerCase(), 
        companyName: companyExists.companyName, 
        role: 'employee' 
      });

      if (!employee) {
        // Check if the email exists globally for any user
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (!emailExists) {
          return res.status(401).json({ message: 'Email is incorrect.' });
        }
        return res.status(401).json({ message: 'Email is incorrect for this company.' });
      }

      // Verify password
      const isMatch = await employee.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password.' });
      }

      const token = generateToken(res, employee._id);
      res.json({
        _id: employee._id,
        fullName: employee.fullName,
        companyName: employee.companyName,
        email: employee.email,
        role: employee.role,
        token: token,
      });
    } else {
      // Contractor/Admin login
      if (!email || !password) {
        return res.status(400).json({ message: 'Please fill in all fields' });
      }

      const user = await User.findOne({ 
        email: email.toLowerCase(), 
        role: { $in: ['contractor', 'admin'] } 
      });

      if (!user) {
        return res.status(401).json({ message: 'Email is incorrect.' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password.' });
      }

      const token = generateToken(res, user._id);
      res.json({
        _id: user._id,
        fullName: user.fullName,
        companyName: user.companyName,
        email: user.email,
        role: user.role,
        token: token,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        companyName: user.companyName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profilePhoto: user.profilePhoto,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'There is no user with that email' });
    }

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    console.log(`[Forgot Password] Saving reset token for ${email}. Is password modified? ${user.isModified('password')}`);
    await user.save();

    // Create reset url
    const clientUrl = process.env.NODE_ENV === 'production' && process.env.CLIENT_URL 
      ? process.env.CLIENT_URL 
      : 'http://localhost:5173';
      
    // Ensure no trailing slash in clientUrl
    const normalizedClientUrl = clientUrl.endsWith('/') ? clientUrl.slice(0, -1) : clientUrl;
    const resetUrl = `${normalizedClientUrl}/reset-password/${resetToken}`;

    console.log('RESET PASSWORD URL:', resetUrl);
    console.log(`Using CLIENT_URL config: NODE_ENV=${process.env.NODE_ENV}, CLIENT_URL=${process.env.CLIENT_URL}`);

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message,
        html: `
          <h1>You requested a password reset</h1>
          <p>Please click on the following link to reset your password:</p>
          <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
        `,
      });

      res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
      console.error('Email sending failed in authController:', err.message);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      console.log(`[Forgot Password] Email failed. Rolling back token. Is password modified? ${user.isModified('password')}`);
      await user.save();
      console.log(`[Forgot Password] Rollback complete. Password should remain unchanged.`);

      return res.status(500).json({ message: 'Email could not be sent. Please check if email service is configured correctly or try again later.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset success',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  forgotPassword,
  resetPassword,
};
