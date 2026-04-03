import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import { User, Tenant } from '../../models/index.js';

// Generate access + refresh tokens
const generateTokens = (userId, tenantId, role) => {
  const accessToken = jwt.sign(
    { userId, tenantId, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { userId, tenantId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

// POST /api/auth/register — SaaS signup (creates tenant + admin user)
export const register = async (req, res, next) => {
  try {
    const { companyName, subdomain, name, email, password } = req.body;

    if (!companyName || !subdomain || !name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required: companyName, subdomain, name, email, password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if subdomain already taken
    const existingTenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
    if (existingTenant) {
      return res.status(409).json({ error: 'Subdomain already taken' });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create tenant
    const tenant = await Tenant.create({
      companyName,
      subdomain: subdomain.toLowerCase(),
    });

    // Create admin user
    const user = await User.create({
      tenantId: tenant._id,
      name,
      email: email.toLowerCase(),
      passwordHash: password, // pre-save hook hashes this
      role: 'admin',
    });

    const { accessToken, refreshToken } = generateTokens(user._id, tenant._id, user.role);

    // Store refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      message: 'Registration successful',
      user: user.toJSON(),
      tenant: {
        id: tenant._id,
        companyName: tenant.companyName,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, tenant._id, user.role);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      tenant: {
        id: tenant._id,
        companyName: tenant.companyName,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded = jwt.verify(token, config.jwt.refreshSecret);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user._id, user.tenantId, user.role);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired. Please login again.' });
    }
    next(error);
  }
};

// POST /api/auth/invite — Invite team member
export const inviteTeamMember = async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;
    const tenantId = req.tenantId;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'name, email, role, and password are required' });
    }

    const validRoles = ['hr_manager', 'recruiter', 'hiring_manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const user = await User.create({
      tenantId,
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      role,
    });

    res.status(201).json({
      message: 'Team member invited successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me — Get current user
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash -refreshToken');
    const tenant = await Tenant.findById(req.tenantId);

    res.json({
      user,
      tenant: {
        id: tenant._id,
        companyName: tenant.companyName,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
        primaryColor: tenant.primaryColor,
        logoUrl: tenant.logoUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};
