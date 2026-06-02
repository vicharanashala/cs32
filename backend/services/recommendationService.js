const User = require('../models/User');
const FAQ = require('../models/FAQ');

const PHASE_CATEGORY_MAP = {
  pre: ['About the internship', 'Timing and dates', 'NOC (No Objection Certificate)', 'Selection, offer letter, and certificate', 'Work, mentorship, and projects', 'Code of conduct — communication channels', 'Spurti Points', 'ViBe Platform', 'Getting Started'],
  phase1_coursework: ['Phase 1', 'Vibe LMS', 'live sessions', 'Phase 1 — coursework, Vibe LMS, and live sessions'],
  phase1_completed: ['Team Formation', 'Yaksha Chat', 'Team Formation', 'Yaksha Chat Related'],
  phase2_project: ['Interviews', 'Certificate', 'Interviews Related'],
  completed: ['Certificate', 'Alumni']
};

const getCategoriesForPhase = (phase) => {
  return PHASE_CATEGORY_MAP[phase] || [];
};

/**
 * Tracks tag affinity when user views, saves, or marks an FAQ helpful.
 * Keeps last 30 days, max 20 tags.
 */
const recordTagAffinity = async (userId, tags) => {
  if (!userId || !tags || tags.length === 0) return;
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Keep tags within 30 days
    let currentAffinity = (user.tagAffinity || []).filter(item => item.timestamp >= thirtyDaysAgo);

    // Add new tags
    const cleanedTags = tags.map(t => t.toLowerCase().trim()).filter(Boolean);
    for (const tag of cleanedTags) {
      currentAffinity.push({ tag, timestamp: now });
    }

    // Sort by timestamp descending
    currentAffinity.sort((a, b) => b.timestamp - a.timestamp);

    // Cap at 20
    if (currentAffinity.length > 20) {
      currentAffinity = currentAffinity.slice(0, 20);
    }

    user.tagAffinity = currentAffinity;
    await user.save();
  } catch (err) {
    console.error('Error recording tag affinity:', err.message);
  }
};

/**
 * Recommends FAQs based on phase mapping and tag affinity.
 */
const getRecommendedFAQs = async (userId) => {
  let user = null;
  if (userId) {
    user = await User.findById(userId);
  }

  // Get all published FAQs
  const allFAQs = await FAQ.find({ isPublished: true }).populate('author', 'username displayName').lean();

  if (!user || !user.currentPhase) {
    // FALLBACK: No phase selected -> Official FAQs + trending this week (highest viewCount)
    const officialTrending = allFAQs
      .map(faq => {
        let score = 0;
        if (faq.isOfficial) score += 10;
        score += (faq.viewCount || 0) * 0.1;
        return { ...faq, score };
      })
      .sort((a, b) => b.score - a.score);
    return officialTrending;
  }

  const phase = user.currentPhase;
  const phaseCategories = getCategoriesForPhase(phase);
  const affinityTags = (user.tagAffinity || []).map(item => item.tag.toLowerCase());

  const scoredFAQs = allFAQs.map(faq => {
    // 1. Phase Match (score + 100 if faq category matches one of the phase categories)
    const faqCategoryClean = (faq.category || '').toLowerCase().trim();
    const phaseMatch = phaseCategories.some(cat => {
      const catClean = cat.toLowerCase().trim();
      return faqCategoryClean === catClean || faqCategoryClean.includes(catClean) || catClean.includes(faqCategoryClean);
    });

    // 2. Matching Tags (matchingTags x 10)
    const faqTagsClean = (faq.tags || []).map(t => t.toLowerCase().trim());
    const matchingTagsCount = faqTagsClean.filter(t => affinityTags.includes(t)).length;

    // 3. View Count (Math.log(viewCount) x 2)
    const viewFactor = Math.log(faq.viewCount || 1) * 2;

    // 4. Official Status (isOfficial ? 5 : 0)
    const officialFactor = faq.isOfficial ? 5 : 0;

    const score = (phaseMatch ? 100 : 0) + (matchingTagsCount * 10) + viewFactor + officialFactor;

    return {
      ...faq,
      score,
      phaseMatch,
      matchingTagsCount
    };
  });

  // Sort by score descending
  scoredFAQs.sort((a, b) => b.score - a.score);

  // Fallbacks:
  // If no tag history -> Phase-matched FAQs only (already handled by matchingTags = 0 in formula)
  // If no matches -> Recently updated FAQs
  const hasAnyMatches = scoredFAQs.some(faq => faq.score > 0);
  if (!hasAnyMatches) {
    return allFAQs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  return scoredFAQs;
};

module.exports = {
  recordTagAffinity,
  getRecommendedFAQs
};
