import api from '@/lib/api';

export async function fetchDeepAnalytics() {
  try {
    const [userData, faqData] = await Promise.all([
      api.get('/admin/user-analytics'),
      api.get('/admin/faq-analytics'),
    ]);
    return {
      userStats: userData.data || [],
      faqStats: faqData.data || [],
    };
  } catch (error) {
    console.error('Error fetching deep analytics:', error);
    return null;
  }
}