const mongoose = require('mongoose');
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Report = require('../models/Report');
const SiteReport = require('../models/SiteReport');
const { recalculateAnswerCount } = require('./helpers');

const cleanupOrphanedData = async () => {
  try {
    console.log('[Cleanup] Starting database purge of fake, gibberish and deleted data...');
    
    // 1. Delete all deleted/hidden questions and answers
    const deletedQs = await Question.deleteMany({ $or: [{ isDeleted: true }, { status: 'deleted' }] });
    const deletedAs = await Answer.deleteMany({ $or: [{ isDeleted: true }, { status: 'deleted' }] });
    console.log(`[Cleanup] Purged ${deletedQs.deletedCount} deleted questions and ${deletedAs.deletedCount} deleted answers.`);

    // 2. Delete questions/answers with gibberish title or body
    const allQs = await Question.find({});
    let gibberishQsCount = 0;
    for (const q of allQs) {
      const uppercaseNoSpaces = q.title.replace(/\s/g, '');
      const uniqueChars = new Set(uppercaseNoSpaces).size;
      const hasConsecutiveConsonants = /[bcdfghjklmnpqrstvwxyz]{6,}/i.test(q.title);
      const isGibberish = (uppercaseNoSpaces.length > 10 && uniqueChars / uppercaseNoSpaces.length < 0.3) || 
                          hasConsecutiveConsonants ||
                          q.title.toLowerCase().includes('fdsfsf') || 
                          q.title.toLowerCase().includes('dfsfdsf');
      if (isGibberish) {
        console.log(`[Cleanup] Deleting gibberish question: "${q.title}"`);
        await Question.deleteOne({ _id: q._id });
        await Answer.deleteMany({ question: q._id });
        gibberishQsCount++;
      }
    }
    console.log(`[Cleanup] Deleted ${gibberishQsCount} gibberish questions.`);

    // 3. Delete orphaned reports pointing to non-existent posts or authors
    const users = await User.find({}, '_id').lean();
    const userIds = new Set(users.map(u => u._id.toString()));

    const reports = await Report.find({});
    let deletedReports = 0;
    for (const r of reports) {
      const hasReporter = r.reportedBy && userIds.has(r.reportedBy.toString());
      let targetExists = false;
      if (r.postId) {
        if (r.postType === 'Question') {
          targetExists = await Question.exists({ _id: r.postId });
        } else if (r.postType === 'Answer') {
          targetExists = await Answer.exists({ _id: r.postId });
        }
      }
      if (!hasReporter || !targetExists) {
        await Report.deleteOne({ _id: r._id });
        deletedReports++;
      }
    }
    console.log(`[Cleanup] Deleted ${deletedReports} orphaned reports.`);

    // 4. Delete site reports with title "undefined" or description containing test/error gibberish
    const deletedSiteReports = await SiteReport.deleteMany({
      $or: [
        { title: 'undefined' },
        { title: undefined },
        { description: /7j6rrfikdfudj/ },
        { description: /test/i }
      ]
    });
    console.log(`[Cleanup] Deleted ${deletedSiteReports.deletedCount} fake site reports.`);

    // 5. Delete any remaining questions/answers whose authors do not exist
    const remainingQs = await Question.find({});
    let orphanedQs = 0;
    for (const q of remainingQs) {
      if (!q.author || !userIds.has(q.author.toString())) {
        console.log(`[Cleanup] Deleting orphaned question "${q.title}" (Author does not exist)`);
        await Question.deleteOne({ _id: q._id });
        await Answer.deleteMany({ question: q._id });
        orphanedQs++;
      }
    }

    const remainingAs = await Answer.find({});
    let orphanedAs = 0;
    for (const a of remainingAs) {
      if (!a.author || !userIds.has(a.author.toString()) || !a.question || !(await Question.exists({ _id: a.question }))) {
        console.log(`[Cleanup] Deleting orphaned answer (Author/Question does not exist)`);
        await Answer.deleteOne({ _id: a._id });
        orphanedAs++;
      }
    }

    // Recalculate answer counts on Question documents
    const activeQs = await Question.find({}, '_id');
    for (const q of activeQs) {
      await recalculateAnswerCount(q._id);
    }

    // 5b. Sync User.answerCount from actual non-deleted answers (one-time repair)
    console.log('[Cleanup] Syncing User.answerCount from live answer data...');
    const allUserIds = await User.find({}, '_id').lean();
    let syncedUsers = 0;
    for (const u of allUserIds) {
      const actualCount = await Answer.countDocuments({ author: u._id, isDeleted: false });
      const dbUser = await User.findById(u._id).select('answerCount');
      if (dbUser && dbUser.answerCount !== actualCount) {
        await User.updateOne({ _id: u._id }, { $set: { answerCount: actualCount } });
        syncedUsers++;
      }
    }
    console.log(`[Cleanup] Synced answerCount for ${syncedUsers} users.`);

    // 6. Ensure all users have their 10 base Spurti Points and logs
    const SpurtiPointLog = require('../models/SpurtiPointLog');
    const allUsers = await User.find({});
    let creditedCount = 0;
    for (const u of allUsers) {
      const existingLog = await SpurtiPointLog.findOne({
        user: u._id,
        reason: 'Base Spurti Points credited on account registration'
      });
      if (!existingLog) {
        console.log(`[Cleanup] Crediting base 10 Sp points to existing user: ${u.username}`);
        await SpurtiPointLog.create({
          user: u._id,
          amount: 10,
          action: 'reward',
          reason: 'Base Spurti Points credited on account registration',
        });
        u.spurtiPoints = (u.spurtiPoints || 0) + 10;
        await u.save();
        creditedCount++;
      }
    }

    // 6b. Resync User.spurtiPoints from log sum (fixes corruption from old recalculation logic)
    console.log('[Cleanup] Resyncing spurtiPoints from SpurtiPointLog totals...');
    const logTotals = await SpurtiPointLog.aggregate([
      { $group: { _id: '$user', totalSp: { $sum: '$amount' } } }
    ]);
    let spSyncedCount = 0;
    for (const entry of logTotals) {
      const correctSp = Math.max(0, entry.totalSp);
      const targetUser = await User.findById(entry._id).select('spurtiPoints');
      if (targetUser && targetUser.spurtiPoints !== correctSp) {
        await User.updateOne({ _id: entry._id }, { $set: { spurtiPoints: correctSp } });
        spSyncedCount++;
      }
    }
    console.log(`[Cleanup] Resynced spurtiPoints for ${spSyncedCount} users from log data.`);

    if (creditedCount > 0 || spSyncedCount > 0) {
      try {
        const { broadcastLeaderboard } = require('../services/leaderboardService');
        await broadcastLeaderboard();
      } catch (err) {
        console.error('[Cleanup] Error broadcasting leaderboard:', err.message);
      }
    }

    console.log(`[Cleanup] Finished. Orphaned Qs deleted: ${orphanedQs}, Orphaned As deleted: ${orphanedAs}, Credited Sp to ${creditedCount} existing users, Resynced SP for ${spSyncedCount} users.`);
  } catch (err) {
    console.error('[Cleanup] Error during database cleanup:', err.message);
  }
};

module.exports = { cleanupOrphanedData };
