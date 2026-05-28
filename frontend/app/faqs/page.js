'use client';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import FAQCard from '@/components/FAQCard';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

function isInputFocused() {
  const active = document.activeElement;
  return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
}

function FAQsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [savedFaqIds, setSavedFaqIds] = useState(new Set());
  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || '';

  const fetchSavedFaqs = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get('/users/me/saved/faqs');
      const ids = new Set(data.saved?.map(s => s.faq?._id) || []);
      setSavedFaqIds(ids);
    } catch (_) {}
  }, [user]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/faqs', { page, category }),
      api.get('/faqs', { limit: 100 }),
    ]).then(([data, all]) => {
      setFaqs(data.faqs || []);
      setPagination(data.pagination);
      const cats = [...new Set((all.faqs || []).map(f => f.category).filter(Boolean))];
      setCategories(cats);
    })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, category]);

  useEffect(() => {
    fetchSavedFaqs();
  }, [fetchSavedFaqs]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [faqs]);

  const handleKeyDown = useCallback((e) => {
    if (isInputFocused()) return;
    if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, faqs.length - 1));
    } else if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      router.push(`/faqs/${faqs[selectedIndex].slug}`);
    }
  }, [faqs, selectedIndex, router]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">FAQs</h1>
        <p className="text-sm text-gray-500 mt-1">Curated answers to commonly asked questions</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/faqs"
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            !category ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </Link>
        {categories.map(cat => (
          <Link
            key={cat}
            href={`/faqs?category=${cat}`}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium capitalize transition-colors ${
              category === cat ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <div className="card p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
          <p className="text-gray-500">No FAQs available for this category yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {faqs.map((faq, idx) => (
              <FAQCard
                key={faq._id}
                faq={{ ...faq, isSaved: savedFaqIds.has(faq._id) }}
                isSelected={selectedIndex === idx}
                onSelect={() => setSelectedIndex(idx)}
              />
            ))}
          </div>
          <Pagination pagination={pagination} basePath="/faqs" queryParams={{ category }} />
        </>
      )}
    </div>
  );
}

export default function FAQsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 animate-pulse"><div className="h-8 w-48 bg-gray-200 rounded mb-6" /></div>}>
      <FAQsPageContent />
    </Suspense>
  );
}
