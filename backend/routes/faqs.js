const router = require('express').Router();
const { auth, optionalAuth, moderatorOrAdmin } = require('../middleware/auth');
const { feedbackLimiter } = require('../middleware/rateLimiter');
const ctrl = require('../controllers/faqController');
const { reindexAllFAQs } = require('../services/searchService');
const FAQ = require('../models/FAQ');

router.get('/', ctrl.getFAQs);
router.get('/recommended', optionalAuth, ctrl.getRecommendedFAQs);
router.get('/:slug', ctrl.getFAQBySlug);
router.post('/', auth, moderatorOrAdmin, ctrl.createFAQ);
router.put('/:id', auth, moderatorOrAdmin, ctrl.updateFAQ);
router.delete('/:id', auth, moderatorOrAdmin, ctrl.deleteFAQ);

router.post('/:id/items', auth, moderatorOrAdmin, ctrl.addFAQItem);
router.put('/:id/items/:itemId', auth, moderatorOrAdmin, ctrl.updateFAQItem);
router.delete('/:id/items/:itemId', auth, moderatorOrAdmin, ctrl.deleteFAQItem);
router.post('/:id/items/:itemId/feedback', optionalAuth, feedbackLimiter, ctrl.markFAQHelpful);

router.post('/reindex', auth, moderatorOrAdmin, async (req, res) => {
  try {
    const faqs = await FAQ.find({ isPublished: true });
    await reindexAllFAQs(faqs);
    res.json({ message: `Reindexed ${faqs.length} FAQs` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
