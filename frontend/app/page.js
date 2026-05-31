'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

const CATEGORY_ICONS = {
  'About the internship': '💼',
  'Timing and dates': '📅',
  'NOC (No Objection Certificate)': '📄',
  'Selection, offer letter, and certificate': '📜',
  'Work, mentorship, and projects': '💻',
  'Code of conduct — communication channels': '📋',
  'Interviews Related': '🎤',
  'Certificate': '🏆',
  'Rosetta — your internship journal': '📔',
  'Phase 1 — coursework, Vibe LMS, and live sessions': '📚',
  'Spurti Points': '⭐',
  'ViBe Platform': '🎯',
  'Team Formation': '👥',
  'Yaksha Chat Related': '💬',
  'Discourse Related': '💭',
};

export default function HomePage() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localVotes, setLocalVotes] = useState({});

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const data = await api.get('/faqs', { limit: 100 });
      const faqList = data.faqs || [];

      const categoryMap = {};
      faqList.forEach(faq => {
        const cat = faq.category || 'Uncategorized';
        if (!categoryMap[cat]) {
          categoryMap[cat] = { name: cat, count: 0, items: [] };
        }
        categoryMap[cat].count += faq.itemCount || 0;
        categoryMap[cat].items.push(faq);
      });

      const sortedCategories = Object.values(categoryMap).sort((a, b) => b.count - a.count);
      setCategories([{ name: 'All Categories', count: faqList.reduce((acc, f) => acc + (f.itemCount || 0), 0) }, ...sortedCategories]);
      setFaqs(faqList);
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFAQs = selectedCategory === 'All Categories'
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFaq = (faqId) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const handleFeedback = async (faqId, itemId, helpful) => {
    if (!user) { toast.error('Please login to vote'); return; }
    const currentVote = localVotes[itemId];
    if (currentVote === (helpful ? 'helpful' : 'notHelpful')) {
      toast.error('You have already voted');
      return;
    }
    try {
      const data = await api.post(`/faqs/${faqId}/items/${itemId}/feedback`, { helpful });
      setLocalVotes(prev => ({ ...prev, [itemId]: helpful ? 'helpful' : 'notHelpful' }));
      setFaqs(prev => prev.map(faq => {
        if (faq._id !== faqId) return faq;
        return {
          ...faq,
          items: faq.items.map(item => {
            if (item._id !== itemId) return item;
            return { ...item, helpfulCount: data.helpfulCount, notHelpfulCount: data.notHelpfulCount };
          })
        };
      }));
      toast.success(helpful ? 'Glad this helped!' : 'Thanks for the feedback');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getIcon = (category) => {
    return CATEGORY_ICONS[category] || '📌';
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <section className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] mb-3">
            Vicharanashala Q&A Portal
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)]">
            Search our Elasticsearch knowledge base of questions, FAQs, and community answers.
          </p>
        </section>

        {/* Categories */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Categories</h2>
            <span className="text-sm text-[var(--color-text-secondary)]">{categories[0]?.count || 0}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  selectedCategory === cat.name
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]'
                }`}
              >
                {getIcon(cat.name)} {cat.name}
                <span className="ml-1.5 text-xs opacity-75">{cat.count}</span>
              </button>
            ))}
          </div>
        </section>

        {/* All FAQs */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">All Frequently Asked Questions</h2>
            <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
              <button
                onClick={() => setExpandedFaq('all')}
                className="hover:text-[var(--color-text)]"
              >
                Expand all
              </button>
              <span>|</span>
              <button
                onClick={() => setExpandedFaq(null)}
                className="hover:text-[var(--color-text)]"
              >
                Collapse all
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="h-5 bg-[var(--color-border)] rounded w-3/4 mb-3" />
                  <div className="h-4 bg-[var(--color-border)] rounded w-full mb-2" />
                  <div className="h-4 bg-[var(--color-border)] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFAQs.map((faq) => (
                <div key={faq._id} className="card overflow-hidden">
                  {/* FAQ Header */}
                  <button
                    onClick={() => toggleFaq(faq._id)}
                    className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-[var(--color-bg-tertiary)]/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {faq.isOfficial && (
                          <span className="badge-green text-xs">✓ Official</span>
                        )}
                        <span className="text-xs text-[var(--color-text-muted)]">✓ Fresh</span>
                      </div>
                      <h3 className="text-base font-medium text-[var(--color-text)]">
                        {faq.title}
                      </h3>
                    </div>
                    <svg
                      className={`w-5 h-5 text-[var(--color-text-muted)] shrink-0 transition-transform ${
                        expandedFaq === faq._id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded Content */}
                  {(expandedFaq === faq._id || expandedFaq === 'all') && faq.items?.length > 0 && (
                    <div className="border-t border-[var(--color-border)]">
                      {faq.items
                        .filter(item => item.isPublished)
                        .map((item) => (
                          <div key={item._id} className="p-5 border-b border-[var(--color-border)] last:border-b-0">
                            <div className="text-sm font-medium text-[var(--color-text)] mb-2">
                              {item.question}
                            </div>
                            <div
                              className="text-sm text-[var(--color-text-secondary)] mb-4"
                              style={{ whiteSpace: 'pre-wrap' }}
                            >
                              {item.answer}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                              <span>Was this helpful?</span>
                              <button
                                onClick={() => handleFeedback(faq._id, item._id, true)}
                                className={`flex items-center gap-1 ${localVotes[item._id] === 'helpful' ? 'text-green-600 font-semibold' : 'hover:text-green-600'}`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                                Yes ({item.helpfulCount || 0})
                              </button>
                              <button
                                onClick={() => handleFeedback(faq._id, item._id, false)}
                                className={`flex items-center gap-1 ${localVotes[item._id] === 'notHelpful' ? 'text-red-600 font-semibold' : 'hover:text-red-600'}`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                                No ({item.notHelpfulCount || 0})
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && filteredFAQs.length === 0 && (
            <div className="text-center py-12 text-[var(--color-text-secondary)]">
              No FAQs found in this category.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}