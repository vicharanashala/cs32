const User = require('../models/User');
const Answer = require('../models/Answer');
const { getIO } = require('../socket');

const getLeaderboardData = async () => {
  // Primary: users who resolved doubts (accepted answers or solved-my-doubt votes)
  let leaderboard = await Answer.aggregate([
    { $match: { isDeleted: false, $or: [{ isAccepted: true }, { solvedMyDoubtCount: { $gt: 0 } }] } },
    { $group: { 
        _id: '$author', 
        resolvedCount: { $sum: 1 }, 
        totalSolvedVotes: { $sum: '$solvedMyDoubtCount' } 
      } 
    },
    { $sort: { resolvedCount: -1, totalSolvedVotes: -1 } },
    { $limit: 20 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: {
        _id: 0,
        resolvedCount: 1,
        totalSolvedVotes: 1,
        'user.username': 1,
        'user.displayName': 1,
        'user.avatar': 1,
        'user.reputation': 1,
    }}
  ]);

  // Fallback: if no resolved answers yet, show top users by reputation
  if (leaderboard.length === 0) {
    const topUsers = await User.find({ isBanned: { $ne: true } })
      .sort({ reputation: -1 })
      .limit(20)
      .select('username displayName avatar reputation')
      .lean();
    leaderboard = topUsers.map(u => ({
      resolvedCount: 0,
      totalSolvedVotes: 0,
      user: {
        username: u.username,
        displayName: u.displayName,
        avatar: u.avatar,
        reputation: u.reputation || 0,
      }
    }));
  }

  return leaderboard;
};

const broadcastLeaderboard = async () => {
  try {
    const data = await getLeaderboardData();
    const io = getIO();
    io.emit('leaderboard:update', { leaderboard: data });
  } catch (err) {
    // Socket might not be initialized yet during startup/seeding, ignore
    console.log('Socket not ready to broadcast leaderboard update.');
  }
};

module.exports = {
  getLeaderboardData,
  broadcastLeaderboard
};
