const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { AppError } = require('../middleware/errorHandler');
const { paginate, buildPaginationMeta } = require('../utils/helpers');
const { getDashboardStats, getUserAnalytics, getGlobalFAQAnalytics } = require('../services/analyticsService');
const { banUser, unbanUser } = require('../services/moderationService');
const { getRedis } = require('../config/redis');

exports.getDashboard = async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    res.json({ stats });
  } catch (err) {
    next(err);
  }
};

exports.getUserAnalytics = async (req, res, next) => {
  try {
    const data = await getUserAnalytics();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

exports.getGlobalFAQAnalytics = async (req, res, next) => {
  try {
    const data = await getGlobalFAQAnalytics();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password'),
      User.countDocuments(filter),
    ]);

    res.json({ users, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) {
      throw new AppError('Invalid role', 400);
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) throw new AppError('User not found', 404);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.banUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    await banUser({ userId: req.params.id, reason: reason || 'Violation of terms' });
    res.json({ message: 'User banned' });
  } catch (err) {
    next(err);
  }
};

exports.unbanUser = async (req, res, next) => {
  try {
    await unbanUser(req.params.id);
    res.json({ message: 'User unbanned' });
  } catch (err) {
    next(err);
  }
};

exports.getFlaggedContent = async (req, res, next) => {
  try {
    const [flaggedQuestions, flaggedAnswers] = await Promise.all([
      Question.find({ isFlagged: true, isDeleted: false })
        .populate('author', 'username displayName')
        .populate('flaggedBy', 'username')
        .select('title flagReason createdAt'),
      Answer.find({ isFlagged: true, isDeleted: false })
        .populate('author', 'username displayName')
        .populate('flaggedBy', 'username')
        .select('body flagReason createdAt'),
    ]);

    res.json({ flaggedQuestions, flaggedAnswers });
  } catch (err) {
    next(err);
  }
};

exports.getAnomalies = async (req, res, next) => {
  try {
    const { severity, status, sortBy = 'time', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { anomalySeverity: { $in: ['high', 'medium', 'low'] } };
    
    if (severity && severity !== 'all') {
      filter.anomalySeverity = severity;
    }
    
    if (status === 'resolved') {
      filter.anomalyResolvedAt = { $ne: null };
    } else if (status === 'unresolved') {
      filter.anomalyResolvedAt = null;
    }

    const sort = {};
    if (sortBy === 'severity') {
      sort.anomalyScore = -1;
    } else {
      sort.createdAt = -1;
    }

    const [anomalies, total] = await Promise.all([
      Question.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'username displayName email')
        .populate('anomalyResolvedBy', 'username displayName'),
      Question.countDocuments(filter)
    ]);

    const resolvedStats = await Question.aggregate([
      { 
        $match: { 
          anomalySeverity: { $in: ['high', 'medium', 'low'] },
          anomalyResolvedAt: { $ne: null } 
        } 
      },
      {
        $group: {
          _id: '$anomalySeverity',
          count: { $sum: 1 },
          totalMs: { $sum: { $subtract: ['$anomalyResolvedAt', '$createdAt'] } }
        }
      }
    ]);

    const avgResolutionTimes = {
      high: 0,
      medium: 0,
      low: 0
    };

    resolvedStats.forEach(stat => {
      const avgMinutes = stat.count > 0 ? Math.round(stat.totalMs / (1000 * 60) / stat.count) : 0;
      avgResolutionTimes[stat._id] = avgMinutes;
    });

    const openHighCount = await Question.countDocuments({ anomalySeverity: 'high', anomalyResolvedAt: null });
    const openMediumCount = await Question.countDocuments({ anomalySeverity: 'medium', anomalyResolvedAt: null });

    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const trendStats = await Question.aggregate([
      {
        $match: {
          anomalySeverity: { $in: ['high', 'medium', 'low'] },
          createdAt: { $gte: fourWeeksAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%U', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      anomalies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        openHighCount,
        openMediumCount,
        avgResolutionTimes,
        trend: trendStats.map(t => ({ week: t._id, count: t.count }))
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.resolveAnomaly = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) throw new AppError('Question not found', 404);

    question.anomalyResolvedAt = new Date();
    question.anomalyResolvedBy = req.user._id;
    await question.save();

    const populated = await Question.findById(question._id)
      .populate('author', 'username displayName email')
      .populate('anomalyResolvedBy', 'username displayName');

    res.json({ message: 'Anomaly marked as resolved', question: populated });
  } catch (err) {
    next(err);
  }
};

exports.clearCache = async (req, res) => {
  try {
    const redis = getRedis();
    await redis.flushall();
    res.json({ message: 'Cache cleared' });
  } catch (_) {
    res.json({ message: 'Cache not available' });
  }
};
