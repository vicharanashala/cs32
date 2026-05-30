const { getES } = require('../config/elasticsearch');

const INDEX_QUESTIONS = 'questions';
const INDEX_FAQS = 'faqs';
const INDEX_FAQ_ITEMS = 'faq_items';
const INDEX_USERS = 'users';

const ensureIndex = async (index, body) => {
  const es = getES();
  const exists = await es.indices.exists({ index });
  if (!exists) {
    await es.indices.create({ index, body });
  }
};

const initIndices = async () => {
  await ensureIndex(INDEX_QUESTIONS, {
    settings: { analysis: { analyzer: { default: { type: 'standard' } } } },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        title: { type: 'text', analyzer: 'standard' },
        body: { type: 'text', analyzer: 'standard' },
        tags: { type: 'keyword' },
        author: { type: 'keyword' },
        authorName: { type: 'text' },
        upvotes: { type: 'integer' },
        answerCount: { type: 'integer' },
        viewCount: { type: 'integer' },
        createdAt: { type: 'date' },
        status: { type: 'keyword' },
        isFAQ: { type: 'boolean' },
        resolvedAt: { type: 'date' },
      },
    },
  });

  await ensureIndex(INDEX_FAQS, {
    mappings: {
      properties: {
        id: { type: 'keyword' },
        title: { type: 'text', analyzer: 'standard' },
        description: { type: 'text' },
        category: { type: 'keyword' },
        tags: { type: 'keyword' },
        isOfficial: { type: 'boolean' },
        createdAt: { type: 'date' },
      },
    },
  });

  await ensureIndex(INDEX_FAQ_ITEMS, {
    settings: {
      analysis: {
        analyzer: {
          default: { type: 'standard' },
        },
      },
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        faqId: { type: 'keyword' },
        faqTitle: { type: 'text' },
        question: { type: 'text', analyzer: 'standard' },
        answer: { type: 'text', analyzer: 'standard' },
        tags: { type: 'keyword' },
        isPublished: { type: 'boolean' },
        createdAt: { type: 'date' },
      },
    },
  });

  await ensureIndex(INDEX_USERS, {
    mappings: {
      properties: {
        id: { type: 'keyword' },
        username: { type: 'text', analyzer: 'standard' },
        displayName: { type: 'text' },
        bio: { type: 'text' },
        reputation: { type: 'integer' },
        role: { type: 'keyword' },
      },
    },
  });
};

const indexQuestion = async (question) => {
  try {
    const es = getES();
    await es.index({
      index: INDEX_QUESTIONS,
      id: question._id.toString(),
      body: {
        id: question._id,
        title: question.title,
        body: question.body,
        tags: question.tagNames,
        author: question.author?._id || question.author,
        authorName: question.author?.displayName || question.author?.username || '',
        upvotes: question.upvotes,
        answerCount: question.answerCount,
        viewCount: question.viewCount,
        createdAt: question.createdAt,
        status: question.status,
        isFAQ: question.isFAQ || false,
        resolvedAt: question.resolvedAt || null,
      },
    });
  } catch (err) {
    console.error('Index question error:', err.message);
  }
};

const indexFAQ = async (faq) => {
  try {
    const es = getES();
    await es.index({
      index: INDEX_FAQS,
      id: faq._id.toString(),
      body: {
        id: faq._id,
        title: faq.title,
        description: faq.description,
        category: faq.category,
        tags: faq.tags,
        isOfficial: faq.isOfficial,
        createdAt: faq.createdAt,
      },
    });

    if (faq.items && faq.items.length > 0) {
      for (const item of faq.items) {
        await es.index({
          index: INDEX_FAQ_ITEMS,
          id: `${faq._id.toString()}_${item._id.toString()}`,
          body: {
            id: item._id,
            faqId: faq._id,
            faqTitle: faq.title,
            question: item.question,
            answer: item.answer,
            tags: item.tags || [],
            isPublished: item.isPublished,
            createdAt: item.createdAt,
          },
        });
      }
    }
  } catch (err) {
    console.error('Index FAQ error:', err.message);
  }
};

const indexFAQItem = async (faq, item) => {
  try {
    const es = getES();
    await es.index({
      index: INDEX_FAQ_ITEMS,
      id: `${faq._id.toString()}_${item._id.toString()}`,
      body: {
        id: item._id,
        faqId: faq._id,
        faqTitle: faq.title,
        question: item.question,
        answer: item.answer,
        tags: item.tags || [],
        isPublished: item.isPublished,
        createdAt: item.createdAt,
      },
    });
  } catch (err) {
    console.error('Index FAQ item error:', err.message);
  }
};

const deleteFAQItemIndex = async (faqId, itemId) => {
  try {
    const es = getES();
    await es.delete({ index: INDEX_FAQ_ITEMS, id: `${faqId.toString()}_${itemId.toString()}` });
  } catch (_) {}
};

const deleteFAQItemsByFAQId = async (faqId) => {
  try {
    const es = getES();
    await es.deleteByQuery({
      index: INDEX_FAQ_ITEMS,
      body: { query: { term: { faqId: faqId.toString() } } },
    });
  } catch (_) {}
};

const indexUser = async (user) => {
  try {
    const es = getES();
    await es.index({
      index: INDEX_USERS,
      id: user._id.toString(),
      body: {
        id: user._id,
        username: user.username,
        displayName: user.displayName || user.username,
        bio: user.bio || '',
        reputation: user.reputation || 0,
        role: user.role || 'user',
      },
    });
  } catch (err) {
    console.error('Index user error:', err.message);
  }
};

const searchAll = async ({ query, tags, type, page = 1, limit = 20 }) => {
  try {
    const es = getES();
    const must = [];
    const filter = [];

    let indices;
    if (type === 'faqs') {
      indices = [INDEX_FAQS, INDEX_FAQ_ITEMS];
    } else if (type === 'users') {
      indices = INDEX_USERS;
    } else {
      indices = [INDEX_QUESTIONS, INDEX_FAQS, INDEX_FAQ_ITEMS, INDEX_USERS];
    }

    if (query) {
      if (type === 'users') {
        must.push({
          multi_match: {
            query,
            fields: ['username^3', 'displayName^2', 'bio'],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        });
      } else if (type === 'faqs') {
        must.push({
          multi_match: {
            query,
            fields: ['title^3', 'description^2', 'question^4', 'answer', 'tags'],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        });
      } else {
        must.push({
          multi_match: {
            query,
            fields: ['title^3', 'body^2', 'question^4', 'answer', 'description', 'tags', 'username^2', 'displayName', 'bio'],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        });
      }
    }

    if (tags && tags.length > 0) {
      filter.push({ terms: { tags } });
    }

    if (!type || (type !== 'faqs' && type !== 'users')) {
      must.push({
        bool: {
          should: [
            { bool: { must: [{ term: { isFAQ: true } }, { term: { _index: INDEX_QUESTIONS } }] } },
            { terms: { _index: [INDEX_FAQS, INDEX_USERS] } },
            { bool: { must: [{ term: { isPublished: true } }, { term: { _index: INDEX_FAQ_ITEMS } }] } },
          ],
          minimum_should_match: 1,
        },
      });
    }

    const body = {
      from: (page - 1) * limit,
      size: limit,
      sort: type === 'users'
        ? [{ _score: 'desc' }]
        : [{ _score: 'desc' }, { createdAt: { order: 'desc' } }],
    };

    if (must.length > 0 || filter.length > 0) {
      body.query = { bool: {} };
      if (must.length > 0) body.query.bool.must = must;
      if (filter.length > 0) body.query.bool.filter = filter;
    } else {
      body.query = { match_all: {} };
    }

    const result = await es.search({ index: indices, body });
    return {
      results: result.hits.hits.map(h => ({ id: h._id, ...h._source, score: h._score })),
      total: result.hits.total.value,
      page,
      limit,
    };
  } catch (err) {
    console.error('Search error:', err.message);
    return { results: [], total: 0, page, limit };
  }
};

const deleteQuestionIndex = async (id) => {
  try {
    const es = getES();
    await es.delete({ index: INDEX_QUESTIONS, id: id.toString() });
  } catch (_) {}
};

const deleteFAQIndex = async (id) => {
  try {
    const es = getES();
    await es.delete({ index: INDEX_FAQS, id: id.toString() });
    await deleteFAQItemsByFAQId(id);
  } catch (_) {}
};

const reindexAllFAQs = async (faqs) => {
  const es = getES();
  for (const faq of faqs) {
    await indexFAQ(faq);
  }
  console.log(`Reindexed ${faqs.length} FAQs with items`);
};

module.exports = {
  initIndices,
  indexQuestion,
  indexFAQ,
  indexFAQItem,
  indexUser,
  searchAll,
  deleteQuestionIndex,
  deleteFAQIndex,
  deleteFAQItemIndex,
  deleteFAQItemsByFAQId,
  reindexAllFAQs,
};
