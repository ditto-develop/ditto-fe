'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../adminApi';

interface Role {
  code: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  nickname: string;
  phoneNumber: string;
  gender: string;
  age: number;
  joinedAt: string;
  leftAt?: string;
  role: Role;
}

interface ScoreBreakdown {
  quizMatchRate: number;
  matchedQuestions: number;
  totalQuestions: number;
  reasons: string[];
}

interface MatchCandidate {
  userId: string;
  nickname: string;
  gender: string;
  age: number;
  introduction: string | null;
  location: string | null;
  profileImageUrl: string | null;
  matchRate: number;
  scoreBreakdown: ScoreBreakdown;
}

interface MatchCandidateList {
  quizSetId: string;
  matchingType: string;
  algorithmVersion: string;
  candidates: MatchCandidate[];
}

interface ApiResponse {
  success: boolean;
  data: User[];
}

interface MatchApiResponse {
  success: boolean;
  data?: MatchCandidateList;
  error?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [matchModal, setMatchModal] = useState<{ user: User; data: MatchCandidateList } | null>(null);
  const [matchLoading, setMatchLoading] = useState<string | null>(null);
  const [matchError, setMatchError] = useState('');

  const fetchUsers = () => {
    adminFetch<ApiResponse>('/users')
      .then((res) => setUsers(res.data))
      .catch((e: Error) => setError(e.message));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string, nickname: string) => {
    if (!confirm(`"${nickname}" 사용자를 삭제하시겠습니까?`)) return;
    setDeleting(id);
    try {
      await adminFetch(`/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  const handleViewMatchCandidates = async (user: User) => {
    setMatchLoading(user.id);
    setMatchError('');
    try {
      const res = await adminFetch<MatchApiResponse>(`/admin/users/${user.id}/match-candidates`);
      if (res.success && res.data) {
        setMatchModal({ user, data: res.data });
      } else {
        setMatchError(res.error ?? '매칭 후보를 불러올 수 없습니다.');
        setMatchModal({ user, data: { quizSetId: '', matchingType: '', algorithmVersion: '', candidates: [] } });
      }
    } catch (e) {
      const msg = (e as Error).message;
      setMatchModal({ user, data: { quizSetId: '', matchingType: '', algorithmVersion: '', candidates: [] } });
      setMatchError(msg);
    } finally {
      setMatchLoading(null);
    }
  };

  const roleColor: Record<string, string> = {
    SUPER_ADMIN: '#7c6bff',
    ADMIN: '#3b82f6',
    USER: '#10b981',
  };

  const genderLabel = (g: string) => (g === 'MALE' ? '남' : g === 'FEMALE' ? '여' : g);

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700 }}>사용자 관리</h1>
      <p style={{ color: '#666', margin: '0 0 24px' }}>
        전체 사용자: <strong>{users.length}</strong>명
      </p>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
              {['닉네임', '이름', '전화번호', '성별', '나이', '역할', '가입일', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                style={{
                  borderBottom: '1px solid #f3f4f6',
                  opacity: user.leftAt ? 0.5 : 1,
                }}
              >
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                  {user.nickname}
                  {user.leftAt && <span style={{ marginLeft: 6, fontSize: 11, color: '#9ca3af' }}>(탈퇴)</span>}
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{user.name}</td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{user.phoneNumber}</td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{user.gender}</td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{user.age}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: `${roleColor[user.role.code] ?? '#6b7280'}20`,
                      color: roleColor[user.role.code] ?? '#6b7280',
                    }}
                  >
                    {user.role.code}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                  {new Date(user.joinedAt).toLocaleDateString('ko-KR')}
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleViewMatchCandidates(user)}
                    disabled={matchLoading === user.id}
                    style={{
                      padding: '4px 10px',
                      background: '#eff6ff',
                      color: '#3b82f6',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {matchLoading === user.id ? '로딩...' : '매칭 후보'}
                  </button>
                  <button
                    onClick={() => handleDelete(user.id, user.nickname)}
                    disabled={deleting === user.id}
                    style={{
                      padding: '4px 12px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    {deleting === user.id ? '삭제 중...' : '삭제'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !error && (
              <tr>
                <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>
                  사용자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 매칭 후보 모달 */}
      {matchModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => { setMatchModal(null); setMatchError(''); }}
        >
          <div
            style={{
              background: '#fff', borderRadius: 16, padding: 28, width: 560,
              maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  {matchModal.user.nickname}의 매칭 후보
                </h2>
                {matchModal.data.quizSetId && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>
                    퀴즈셋: {matchModal.data.quizSetId} · {matchModal.data.matchingType}
                  </p>
                )}
              </div>
              <button
                onClick={() => { setMatchModal(null); setMatchError(''); }}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}
              >
                ✕
              </button>
            </div>

            {matchError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                {matchError}
              </div>
            )}

            {matchModal.data.candidates.length === 0 && !matchError && (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>
                매칭 후보가 없습니다.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {matchModal.data.candidates.map((c, idx) => (
                <div
                  key={c.userId}
                  style={{
                    border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#f3f4f6', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 700, color: '#6b7280', fontSize: 14, flexShrink: 0,
                  }}>
                    {idx + 1}
                  </div>
                  {c.profileImageUrl && (
                    <img src={c.profileImageUrl} alt={c.nickname} style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{c.nickname}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                      {genderLabel(c.gender)} · {c.age}세{c.location ? ` · ${c.location}` : ''}
                    </div>
                    {c.introduction && (
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.introduction}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>{c.matchRate}%</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {c.scoreBreakdown.matchedQuestions}/{c.scoreBreakdown.totalQuestions} 일치
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
