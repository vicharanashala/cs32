'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { getInitials } from '@/lib/utils';
import api from '@/lib/api';

export default function CommunityPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?mode=login');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    // Fetch initial leaderboard data
    api.get('/users/leaderboard')
      .then(data => {
        setLeaderboard(data.leaderboard || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleLeaderboardUpdate = (data) => {
      setLeaderboard(data.leaderboard || []);
    };

    socket.on('leaderboard:update', handleLeaderboardUpdate);

    return () => {
      socket.off('leaderboard:update', handleLeaderboardUpdate);
    };
  }, [socket]);

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return `${api.baseUrl.replace('/api', '')}${avatar}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-purple-400">
            Community Leaderboard
          </span>
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-3 max-w-xl mx-auto">
          Recognizing our top contributors who actively help others resolve their doubts and build collective knowledge.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[var(--color-bg-secondary)]/60 border border-[var(--color-border)]/40 rounded-2xl p-8 animate-pulse h-48" />
            ))}
          </div>
          <div className="bg-[var(--color-bg-secondary)]/60 border border-[var(--color-border)]/40 rounded-2xl p-6 animate-pulse h-96" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="bg-[var(--color-bg-secondary)]/60 border border-[var(--color-border)]/40 rounded-2xl p-16 text-center backdrop-blur-md">
          <p className="text-sm text-[var(--color-text-secondary)]">No resolutions logged yet. Be the first to help someone resolve their doubt!</p>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Top 3 podium layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            
            {/* 2nd Place */}
            {leaderboard[1] && (
              <div className="bg-[var(--color-bg-secondary)]/80 backdrop-blur-md border border-[var(--color-border)]/60 rounded-2xl p-6 text-center order-2 md:order-1 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-300" />
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  {leaderboard[1].user?.avatar ? (
                    <img 
                      src={getAvatarUrl(leaderboard[1].user.avatar)} 
                      alt={leaderboard[1].user.displayName || leaderboard[1].user.username} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-400 text-white flex items-center justify-center text-xl font-bold border-2 border-slate-300">
                      {getInitials(leaderboard[1].user.displayName || leaderboard[1].user.username)}
                    </div>
                  )}
                  <span className="absolute -bottom-1.5 -right-1.5 bg-slate-300 text-slate-800 text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                    2
                  </span>
                </div>
                <Link href={`/users/${leaderboard[1].user.username}`} className="text-base font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                  {leaderboard[1].user.displayName || leaderboard[1].user.username}
                </Link>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">@{leaderboard[1].user.username}</p>
                <div className="mt-4 pt-4 border-t border-[var(--color-border)]/40 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-lg font-extrabold text-[var(--color-text)]">{leaderboard[1].resolvedCount}</p>
                    <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold">Resolved</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-[var(--color-text)]">{leaderboard[1].user.reputation}</p>
                    <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold">Reputation</p>
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {leaderboard[0] && (
              <div className="bg-[var(--color-bg-secondary)]/90 backdrop-blur-md border-2 border-amber-500/30 rounded-2xl p-8 text-center order-1 md:order-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden group shadow-lg md:scale-105">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 to-amber-600 animate-pulse" />
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  {leaderboard[0].user?.avatar ? (
                    <img 
                      src={getAvatarUrl(leaderboard[0].user.avatar)} 
                      alt={leaderboard[0].user.displayName || leaderboard[0].user.username} 
                      className="w-20 h-20 rounded-full object-cover border-4 border-amber-400"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center text-2xl font-bold border-4 border-amber-400">
                      {getInitials(leaderboard[0].user.displayName || leaderboard[0].user.username)}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 text-sm font-extrabold w-7 h-7 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    👑
                  </span>
                </div>
                <Link href={`/users/${leaderboard[0].user.username}`} className="text-lg font-extrabold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                  {leaderboard[0].user.displayName || leaderboard[0].user.username}
                </Link>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">@{leaderboard[0].user.username}</p>
                <div className="mt-5 pt-5 border-t border-[var(--color-border)]/40 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-extrabold text-[var(--color-primary)]">{leaderboard[0].resolvedCount}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold">Resolved</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-[var(--color-text)]">{leaderboard[0].user.reputation}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold">Reputation</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {leaderboard[2] && (
              <div className="bg-[var(--color-bg-secondary)]/80 backdrop-blur-md border border-[var(--color-border)]/60 rounded-2xl p-6 text-center order-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-700/50" />
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  {leaderboard[2].user?.avatar ? (
                    <img 
                      src={getAvatarUrl(leaderboard[2].user.avatar)} 
                      alt={leaderboard[2].user.displayName || leaderboard[2].user.username} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-amber-700/45"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-amber-800/80 text-white flex items-center justify-center text-xl font-bold border-2 border-amber-700/45">
                      {getInitials(leaderboard[2].user.displayName || leaderboard[2].user.username)}
                    </div>
                  )}
                  <span className="absolute -bottom-1.5 -right-1.5 bg-amber-700/60 text-white text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                    3
                  </span>
                </div>
                <Link href={`/users/${leaderboard[2].user.username}`} className="text-base font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                  {leaderboard[2].user.displayName || leaderboard[2].user.username}
                </Link>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">@{leaderboard[2].user.username}</p>
                <div className="mt-4 pt-4 border-t border-[var(--color-border)]/40 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-lg font-extrabold text-[var(--color-text)]">{leaderboard[2].resolvedCount}</p>
                    <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold">Resolved</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-[var(--color-text)]">{leaderboard[2].user.reputation}</p>
                    <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold">Reputation</p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* List Table of remaining users */}
          <div className="bg-[var(--color-bg-secondary)]/80 backdrop-blur-md border border-[var(--color-border)]/60 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)]/40 text-xs uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)]/35">
                    <th className="px-6 py-4 font-bold text-center w-20">Rank</th>
                    <th className="px-6 py-4 font-bold">Contributor</th>
                    <th className="px-6 py-4 font-bold text-center">Resolved Doubts</th>
                    <th className="px-6 py-4 font-bold text-center">Solved Upvotes</th>
                    <th className="px-6 py-4 font-bold text-center">Reputation</th>
                    <th className="px-6 py-4 font-bold hidden sm:table-cell">Badges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]/30 text-sm text-[var(--color-text-secondary)]">
                  {leaderboard.map((row, index) => (
                    <tr 
                      key={row.user.username} 
                      className="hover:bg-[var(--color-bg-tertiary)]/20 transition-colors duration-200 group"
                    >
                      <td className="px-6 py-4 text-center font-bold text-[var(--color-text)]">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {row.user.avatar ? (
                            <img 
                              src={getAvatarUrl(row.user.avatar)} 
                              alt={row.user.displayName || row.user.username} 
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center font-bold text-sm">
                              {getInitials(row.user.displayName || row.user.username)}
                            </div>
                          )}
                          <div>
                            <Link href={`/users/${row.user.username}`} className="font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">
                              {row.user.displayName || row.user.username}
                            </Link>
                            <p className="text-xs text-[var(--color-text-muted)]">@{row.user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-[var(--color-primary)]">
                        {row.resolvedCount}
                      </td>
                      <td className="px-6 py-4 text-center">
                        👍 {row.totalSolvedVotes}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-[var(--color-text)]">
                        {row.user.reputation}
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {row.user.badges?.slice(0, 3).map(badge => (
                            <span key={badge} className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              {badge}
                            </span>
                          )) || <span className="text-xs text-[var(--color-text-muted)]">—</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
