const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later' },
});

const feedbackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many feedback requests, please try again later' },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});

module.exports = { apiLimiter, authLimiter, feedbackLimiter };
