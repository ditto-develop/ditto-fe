'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../adminApi';

interface MatchRequest {
  id: string;
  quizSetId: string;
  fromUserId: string;
  fromUserNickname: string;
  toUserId: string;
  toUserNickname: string;
  status: string;
  score: number;
  matchingType?: string;
  algorithmVersion: string;
  requestedAt: string;
  respondedAt: string | null;
}

interface MatchListResponse {
  data: MatchRequest[];
  total: number;
  page: number;
  limit: number;
}

interface ApiResponse {
  success: boolean;
  data: MatchListResponse;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:   { bg: '#fef3c7', text: '#d97706' },
  ACCEPTED:  { bg: '#d1fae5', text: '#059669' },
  REJECTED:  { bg: '#fee2e2', text: '#dc2626' },
  CANCELLED: { bg: '#f3f4f6', text: '#6b7280' },
  EXPIRED:   { bg: '#f3f4f6', text: '#9ca3af' },
};

const ALL_STATUSES = ['', 'PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'];
const LIMIT = 50;

type MatchingTab = 'ONE_TO_ONE' | 'GROUP';

interface GroupParticipant {
  userId: string;
  nickname: string;
  email: string;
  quizSetId: string;
  quizSetTitle: string;
  matchingType: string;
  completedAt: string | null;
  groupDeclined: boolean;
}

interface GroupProgressResponse {
  success: boolean;
  data: { year: number; month: number; week: number; items: GroupParticipant[]; total: number };
}

export default function MatchesPage() {
  const [tab, setTab] = useState<MatchingTab>('ONE_TO_ONE');
  const [result, setResult] = useState<MatchListResponse | null>(null);
  const [groupItems, setGroupItems] = useState<GroupParticipant[]>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [quizSetId, setQuizSetId] = useState('');
  const [pendingQuizSetId, setPendingQuizSetId] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchMatches = (p: number, s: string, qid: string, matchingType: MatchingTab) => {
    setError('');
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (s) params.set('status', s);
    if (qid) params.set('quizSetId', qid);
    params.set('matchingType', matchingType);
    adminFetch<ApiResponse>(`/admin/matches?${params}`)
      .then((res) => setResult(res.data))
      .catch((e: Error) => setError(e.message));
  };

  const fetchGroupParticipants = () => {
    adminFetch<GroupProgressResponse>('/admin/quiz-progress')
      .then((res) => {
        const grouped = res.data.items.filter((i) => i.matchingType === 'GROUP');
        setGroupItems(grouped);
      })
      .catch((e: Error) => setError(e.message));
  };

  useEffect(() => {
    setPage(1);
    setStatus('');
    setQuizSetId('');
    setPendingQuizSetId('');
  }, [tab]);

  useEffect(() => {
    if (tab === 'ONE_TO_ONE') {
      fetchMatches(page, status, quizSetId, tab);
    } else {
      fetchGroupParticipants();
    }
  }, [page, status, quizSetId, tab]);

  const applyFilter = () => {
    setQuizSetId(pendingQuizSetId);
    setPage(1);
  };

  const handleQuizReset = async () => {
    if (!confirm('모든 사용자의 퀴즈 진행 상황을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
    setResetting(true);
    try {
      await adminFetch('/admin/quiz-progress/reset', { method: 'POST' });
      alert('퀴즈 초기화가 완료되었습니다.');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setResetting(false);
    }
  };

  const totalPages = result ? Math.ceil(result.total / LIMIT) : 1;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 24px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    background: active ? '#7c6bff' : '#f3f4f6',
    color: active ? '#fff' : '#6b7280',
    transition: 'all 0.15s',
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>매칭 관리</h1>
        <button
          onClick={handleQuizReset}
          disabled={resetting}
          style={{
            padding: '8px 20px',
            background: resetting ? '#f3f4f6' : '#fee2e2',
            color: resetting ? '#9ca3af' : '#dc2626',
            border: 'none',
            borderRadius: 8,
            cursor: resetting ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {resetting ? '초기화 중...' : '전체 퀴즈 초기화'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button style={tabStyle(tab === 'ONE_TO_ONE')} onClick={() => setTab('ONE_TO_ONE')}>
          1:1 매칭
        </button>
        <button style={tabStyle(tab === 'GROUP')} onClick={() => setTab('GROUP')}>
          그룹 매칭
        </button>
      </div>

      {/* 1:1 전용 필터 */}
      {tab === 'ONE_TO_ONE' && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 4 }}>상태</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{s || '전체'}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 4 }}>퀴즈셋 ID</label>
            <input
              value={pendingQuizSetId}
              onChange={(e) => setPendingQuizSetId(e.target.value)}
              placeholder="quizSetId..."
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, width: 260 }}
            />
          </div>
          <button
            onClick={applyFilter}
            style={{ padding: '8px 20px', background: '#7c6bff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            적용
          </button>
          {result && (
            <span style={{ color: '#6b7280', fontSize: 14, marginLeft: 8 }}>
              전체 <strong>{result.total}</strong>건
            </span>
          )}
        </div>
      )}

      {/* 그룹 요약 */}
      {tab === 'GROUP' && (
        <div style={{ marginBottom: 16, color: '#6b7280', fontSize: 14 }}>
          그룹 퀴즈 완료자 <strong>{groupItems.length}</strong>명
          {' · '}수락 <strong>{groupItems.filter(i => !i.groupDeclined).length}</strong>명
          {' · '}거절 <strong>{groupItems.filter(i => i.groupDeclined).length}</strong>명
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* 1:1 테이블 */}
      {tab === 'ONE_TO_ONE' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
                {['보낸 사람', '받은 사람', '퀴즈셋 ID', '상태', '점수', '요청일', '응답일'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result?.data.map((m) => {
                const sc = STATUS_COLORS[m.status] ?? { bg: '#f3f4f6', text: '#6b7280' };
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>{m.fromUserNickname}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>{m.toUserNickname}</td>
                    <td style={{ padding: '10px 16px', color: '#9ca3af', fontSize: 11 }}>{m.quizSetId.slice(0, 8)}…</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.text }}>
                        {m.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>{m.score.toFixed(0)}</td>
                    <td style={{ padding: '10px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {new Date(m.requestedAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {m.respondedAt ? new Date(m.respondedAt).toLocaleDateString('ko-KR') : '-'}
                    </td>
                  </tr>
                );
              })}
              {result?.data.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>매칭 요청이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 그룹 테이블 */}
      {tab === 'GROUP' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
                {['닉네임', '이메일', '퀴즈셋', '완료일시', '참여 여부'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupItems.map((p) => (
                <tr key={p.userId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 500 }}>{p.nickname}</td>
                  <td style={{ padding: '10px 16px', color: '#6b7280' }}>{p.email}</td>
                  <td style={{ padding: '10px 16px', color: '#6b7280' }}>{p.quizSetTitle}</td>
                  <td style={{ padding: '10px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {p.completedAt ? new Date(p.completedAt).toLocaleString('ko-KR') : '-'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                      background: p.groupDeclined ? '#fee2e2' : '#d1fae5',
                      color: p.groupDeclined ? '#dc2626' : '#059669',
                    }}>
                      {p.groupDeclined ? '거절' : '수락'}
                    </span>
                  </td>
                </tr>
              ))}
              {groupItems.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>그룹 매칭 참여자가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination (1:1 only) */}
      {tab === 'ONE_TO_ONE' && result && totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #d1d5db', cursor: page === 1 ? 'not-allowed' : 'pointer', background: '#fff' }}
          >
            이전
          </button>
          <span style={{ padding: '6px 12px', color: '#6b7280', fontSize: 14 }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #d1d5db', cursor: page === totalPages ? 'not-allowed' : 'pointer', background: '#fff' }}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
