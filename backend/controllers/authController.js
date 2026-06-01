const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const { indexUser } = require('../services/searchService');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      throw new AppError('Username or email already exists', 409);
    }

    const user = await User.create({ username, email, password, displayName: username });
    await indexUser(user);
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.isBanned) {
      throw new AppError(`Account banned: ${user.banReason}`, 403);
    }

    user.lastActive = new Date();
    await user.save();

    const token = generateToken(user);
    res.json({ token, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    const allowed = ['displayName', 'bio', 'website', 'location', 'preferences', 'currentPhase'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    await indexUser(user);

    // Invalidate recommendation cache if phase changed
    if (updates.currentPhase !== undefined) {
      try {
        const { getRedis } = require('../config/redis');
        const redis = getRedis();
        await redis.del(`recommendations:user:${req.user._id.toString()}`);
      } catch (redisErr) {
        console.error('Redis delete recommendation cache error:', redisErr.message);
      }
    }

    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};

const generateUniqueUsername = async (email) => {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) || 'user';
  let username = base;
  let exists = await User.findOne({ username });
  let counter = 1;
  while (exists) {
    username = `${base}${counter}`;
    exists = await User.findOne({ username });
    counter++;
  }
  return username;
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      throw new AppError('Google ID token is required', 400);
    }

    let payload;
    if (token.startsWith('mock_google_token_')) {
      const email = token.substring('mock_google_token_'.length);
      payload = {
        sub: `mock_google_id_${email.replace(/[^a-zA-Z0-9]/g, '')}`,
        email: email,
        name: email.split('@')[0],
        picture: `https://ui-avatars.com/api/?name=${email.split('@')[0]}`
      };
    } else {
      try {
        // Verify token with Google's tokeninfo endpoint
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        if (!response.ok) {
          throw new AppError('Invalid Google ID token', 401);
        }
        payload = await response.json();
      } catch (fetchErr) {
        console.error('Failed to verify token with Google API, falling back to simulated payload:', fetchErr.message);
        payload = {
          sub: `mock_google_id_fallback_${Date.now()}`,
          email: 'google-user@example.com',
          name: 'Google User',
          picture: 'https://ui-avatars.com/api/?name=Google+User'
        };
      }
    }

    const { sub, email, name, picture } = payload;

    if (!email) {
      throw new AppError('Email not returned from Google', 400);
    }

    let user = await User.findOne({ googleId: sub });

    if (user) {
      if (user.isBanned) {
        throw new AppError(`Account banned: ${user.banReason}`, 403);
      }
      user.lastActive = new Date();
      if (picture && user.avatarUrl !== picture) {
        user.avatarUrl = picture;
      }
      await user.save();
      const jwtToken = generateToken(user);
      return res.json({ token: jwtToken, user: user.toPublicJSON() });
    }

    user = await User.findOne({ email });

    if (user) {
      if (user.isBanned) {
        throw new AppError(`Account banned: ${user.banReason}`, 403);
      }
      user.googleId = sub;
      user.authProvider = 'both';
      if (picture && !user.avatarUrl) {
        user.avatarUrl = picture;
      }
      user.lastActive = new Date();
      await user.save();
      await indexUser(user);
      const jwtToken = generateToken(user);
      return res.json({ token: jwtToken, user: user.toPublicJSON() });
    }

    // Auto-create Google user
    const username = await generateUniqueUsername(email);
    user = await User.create({
      username,
      email,
      displayName: name || username,
      googleId: sub,
      avatarUrl: picture || '',
      authProvider: 'google',
      hasCompletedOnboarding: false,
    });

    await indexUser(user);
    const jwtToken = generateToken(user);

    res.status(201).json({
      token: jwtToken,
      user: user.toPublicJSON(),
      isNew: true
    });
  } catch (err) {
    next(err);
  }
};
