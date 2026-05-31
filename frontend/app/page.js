'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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

  const handleSearch = useCallback((e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  }, [searchQuery, router]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      document.querySelector('.search-input')?.focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.querySelector('.search-input')?.focus();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleFaq = (faqId) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const handleFeedback = async (faqId, itemId, helpful) => {
    try {
      await api.post(`/faqs/${faqId}/items/${itemId}/feedback`, { helpful });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
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
          <p className="text-[var(--color-text-secondary)] mb-8">
            Search our Elasticsearch knowledge base of questions, FAQs, and community answers.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search everything..."
                className="search-input w-full px-5 py-3.5 pr-24 text-sm border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)] hidden sm:inline">
                  Press Ctrl + K or /
                </span>
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] rounded-md border border-[var(--color-border)]">
                  Ctrl K
                </kbd>
              </div>
            </div>
          </form>

          {/* Tabs */}
          <div className="flex items-center justify-center gap-6 mt-6 text-sm">
            <button
              onClick={() => setActiveTab('faq')}
              className={`flex items-center gap-1.5 pb-1 border-b-2 transition-colors ${
                activeTab === 'faq'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              💬 Questions
            </button>
            <button
              onClick={() => setActiveTab('faq-answers')}
              className={`flex items-center gap-1.5 pb-1 border-b-2 transition-colors ${
                activeTab === 'faq-answers'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              📖 FAQ Answers
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`flex items-center gap-1.5 pb-1 border-b-2 transition-colors ${
                activeTab === 'tags'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              🏷️ Tags
            </button>
          </div>
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
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-[var(--color-text-muted)]">Was this answer helpful?</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleFeedback(faq._id, item._id, true)}
                                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-green-500/10 text-[var(--color-text-secondary)] hover:text-green-500 transition-colors"
                                >
                                  👍 Yes
                                </button>
                                <button
                                  onClick={() => handleFeedback(faq._id, item._id, false)}
                                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/10 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                                >
                                  👎 No
                                </button>
                              </div>
                              <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[var(--color-primary)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                                🔖 Save
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