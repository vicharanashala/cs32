const User = require('../models/User');
const Answer = require('../models/Answer');
const { getIO } = require('../socket');

const getLeaderboardData = async () => {
  const leaderboard = await Answer.aggregate([
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
