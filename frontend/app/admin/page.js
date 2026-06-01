'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { fetchDeepAnalytics } from '@/services/adminService';
export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [deepStats, setDeepStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [flaggedQs, setFlaggedQs] = useState([]);
  const [flaggedAs, setFlaggedAs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      router.push('/');
      return;
    }
    fetchDashboard();
    fetchUsers();
    fetchFlagged();
    fetchDeepData();
  }, [user]);
  const fetchDashboard = async () => {
    try {
      const data = await api.get('/admin/dashboard');
      setStats(data.stats);
    } catch (_) {}
  };
  const fetchDeepData = async () => {
    try {
      const data = await fetchDeepAnalytics();
      if (data) setDeepStats(data);
    } catch (error) { console.error("Error fetching deep stats:", error); }
  };
  const fetchUsers = async () => {
    try {
      const data = await api.get('/admin/users');
      setUsers(data.users || []);
    } catch (_) {}
  };
  const fetchFlagged = async () => {
    try {
      const data = await api.get('/admin/flagged');
      setFlaggedQs(data.flaggedQuestions || []);
      setFlaggedAs(data.flaggedAnswers || []);
    } catch (_) {}
    finally { setLoading(false); }
  };
  const handleBan = async (userId) => {
    const reason = prompt('Ban reason:');
    if (!reason) return;
    try {
      await api.post(`/admin/users/${userId}/ban`, { reason });
      toast.success('User banned');
      fetchUsers();
    } catch (err) { toast.error(err.message); }
  };
  const handleUnban = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/unban`);
      toast.success('User unbanned');
      fetchUsers();
    } catch (err) { toast.error(err.message); }
  };
  const handleRoleChange = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      toast.success('Role updated');
      fetchUsers();
    } catch (err) { toast.error(err.message); }
  };
  const clearCache = async () => {
    try {
      await api.post('/admin/cache/clear');
      toast.success('Cache cleared');
    } catch (err) { toast.error(err.message); }
  };
  const tabs = ['dashboard', 'users', 'flagged'];
  if (user?.role !== 'admin') tabs.splice(tabs.indexOf('users'), 1);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Admin Panel</h1>
        {user?.role === 'admin' && (
          <button onClick={clearCache} className="btn-secondary btn-sm">Clear Cache</button>
        )}
      </div>
      <div className="flex gap-1 mb-6 border-b border-[var(--color-border)]">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="card p-8 animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-border)] rounded w-1/4" />
          <div className="h-4 bg-[var(--color-border)] rounded w-1/2" />
        </div>
      ) : tab === 'dashboard' && stats ? (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Questions', value: stats.totalQuestions },
              { label: 'Total Answers', value: stats.totalAnswers },
              { label: 'Total Users', value: stats.totalUsers },
              { label: 'Total FAQs', value: stats.totalFAQs },
              { label: 'Total Votes', value: stats.totalVotes },
              { label: 'Questions Today', value: stats.questionsToday },
              { label: 'Resolution Rate', value: `${stats.resolutionRate}%` },
            ].map(item => (
              <div key={item.label} className="card p-4 text-center">
                <p className="text-2xl font-bold text-primary-600">{item.value}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">{item.label}</p>
              </div>
            ))}
          </div>
          {deepStats && (
            <div className="mt-8 border-t border-[var(--color-border)] pt-8">
              <h2 className="text-xl font-bold text-[var(--color-text)] mb-6">Platform Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="font-semibold text-lg mb-4 text-[var(--color-text)]">New Registrations (30 Days)</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {deepStats.userStats?.map((day) => (
                      <div key={day._id} className="flex justify-between items-center border-b border-[var(--color-border)] pb-2">
                        <span className="text-sm text-[var(--color-text-secondary)]">{day._id}</span>
                        <span className="text-sm font-medium text-[var(--color-text)]">{day.newUsers} users</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card p-6">
                  <h3 className="font-semibold text-lg mb-4 text-[var(--color-text)]">Top 10 Most Helpful FAQs</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {deepStats.faqStats?.map((faq, index) => (
                      <div key={index} className="flex flex-col border-b border-[var(--color-border)] pb-2">
                        <span className="font-medium text-sm text-[var(--color-text)]">{faq.question}</span>
                        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-secondary)]">
                          <span className="text-green-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2" /></svg>
                            {faq.helpfulCount}
                          </span>
                          <span className="text-red-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                            {faq.notHelpfulCount}
                          </span>
                          <span className="bg-[var(--color-bg-secondary)] px-2 py-1 rounded">{faq.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : tab === 'users' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[var(--color-border)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text)]">User</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text)]">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text)]">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text)]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text)]">Joined</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{u.displayName || u.username}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">@{u.username}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="text-xs border border-[var(--color-border)] rounded px-2 py-1 bg-[var(--color-bg)] text-[var(--color-text)]"
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {u.isBanned ? <span className="badge-red">Banned</span> : <span className="badge-green">Active</span>}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] text-xs">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      {u.isBanned ? (
                        <button onClick={() => handleUnban(u._id)} className="btn-secondary btn-sm">Unban</button>
                      ) : (
                        <button onClick={() => handleBan(u._id)} className="btn-danger btn-sm">Ban</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'flagged' ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-3">Flagged Questions ({flaggedQs.length})</h3>
            {flaggedQs.length === 0 ? (
              <div className="card p-4 text-sm text-[var(--color-text-secondary)]">No flagged questions</div>
            ) : (
              <div className="space-y-2">
                {flaggedQs.map(q => (
                  <div key={q._id} className="card p-4">
                    <p className="font-medium text-[var(--color-text)]">{q.title}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">Reason: {q.flagReason}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">Flagged by: {q.flaggedBy?.username}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-3">Flagged Answers ({flaggedAs.length})</h3>
            {flaggedAs.length === 0 ? (
              <div className="card p-4 text-sm text-[var(--color-text-secondary)]">No flagged answers</div>
            ) : (
              <div className="space-y-2">
                {flaggedAs.map(a => (
                  <div key={a._id} className="card p-4">
                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">{a.body}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">Reason: {a.flagReason}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">Flagged by: {a.flaggedBy?.username}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}