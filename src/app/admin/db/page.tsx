'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from "@/app/admin/adminApi";

interface DbStats {
  users: number;
  quizSets: number;
  quizzes: number;
  matchRequests: number;
  chatRooms: number;
  ratings: number;
  matchRequestsByStatus: {
    PENDING: number;
    ACCEPTED: number;
    REJECTED: number;
    CANCELLED: number;
    EXPIRED: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: DbStats;
}

interface SeedResult {
  createdUsers: number;
  oneToOneUsers: number;
  groupUsers: number;
  matchRequests: number;
  chatRooms: number;
}

const STAT_CARDS = [
  { key: 'users' as const, label: '사용자', emoji: '👤' },
  { key: 'quizSets' as const, label: '퀴즈셋', emoji: '📋' },
  { key: 'quizzes' as const, label: '퀴즈', emoji: '❓' },
  { key: 'matchRequests' as const, label: '매칭 요청', emoji: '💞' },
  { key: 'chatRooms' as const, label: '채팅방', emoji: '💬' },
  { key: 'ratings' as const, label: '평가', emoji: '⭐' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'var(--color-semantic-status-cautionary)',
  ACCEPTED: 'var(--color-semantic-status-positive)',
  REJECTED: 'var(--color-semantic-status-negative)',
  CANCELLED: 'var(--color-semantic-label-alternative)',
  EXPIRED: 'var(--color-semantic-label-assistive)',
};

export default function DbPage() {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);

  const loadStats = () => {
    adminFetch<ApiResponse>('/admin/stats')
      .then((res) => setStats(res.data))
      .catch((e: Error) => setError(e.message));
  };

  useEffect(() => { loadStats(); }, []);

  const handleSeedDummy = async () => {
    if (!confirm('더미 데이터를 생성하시겠습니까?\n(1:1 15명 + GROUP 15명, 이미 존재하는 유저는 스킵됩니다)')) return;
    setSeeding(true);
    setSeedResult(null);
    setError('');
    try {
      const res = await adminFetch<{ success: boolean; data: SeedResult }>('/admin/seed-dummy', { method: 'POST' });
      setSeedResult(res.data);
      loadStats();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700 }}>DB 관리</h1>
      <p style={{ color: 'var(--color-semantic-label-alternative)', margin: '0 0 32px' }}>데이터베이스 엔티티 현황</p>

      {error && (
        <div style={{ background: 'var(--color-semantic-fill-alternative)', color: 'var(--color-semantic-status-negative)', padding: 16, borderRadius: 8, marginBottom: 24 }}>
          {error}
        </div>
      )}

      {!stats && !error && <p style={{ color: 'var(--color-semantic-label-assistive)' }}>로딩 중...</p>}

      {stats && (
        <>
          {/* Stat cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {STAT_CARDS.map(({ key, label, emoji }) => (
              <div
                key={key}
                style={{
                  background: 'var(--color-semantic-static-white)',
                  borderRadius: 12,
                  padding: '20px 24px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-semantic-label-strong)' }}>{stats[key].toLocaleString()}</div>
                <div style={{ color: 'var(--color-semantic-label-alternative)', fontSize: 14, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Match requests by status */}
          <div
            style={{
              background: 'var(--color-semantic-static-white)',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>매칭 요청 상태별 현황</h2>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {Object.entries(stats.matchRequestsByStatus).map(([status, count]) => (
                <div
                  key={status}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    background: `rgb(from ${STATUS_COLORS[status]} r g b / 0.13)`,
                    color: STATUS_COLORS[status],
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {status}: {count}
                </div>
              ))}
            </div>
          </div>

          {/* 더미 데이터 생성 */}
          <div
            style={{
              background: 'var(--color-semantic-static-white)',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>더미 데이터 생성</h2>
            <p style={{ color: 'var(--color-semantic-label-alternative)', fontSize: 13, margin: '0 0 16px' }}>
              현재 주차 기준으로 1:1 유저 15명 + GROUP 유저 15명을 생성합니다.
              <br />
              프로필 사진, 소개문, 소개 노트(10문항), 퀴즈 완료, 매칭/채팅방까지 한 번에 세팅됩니다.
              <br />
              이미 존재하는 유저(동일 전화번호)는 스킵하고 프로필만 업데이트합니다.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <button
                onClick={handleSeedDummy}
                disabled={seeding}
                style={{
                  padding: '10px 24px',
                  background: seeding ? 'var(--color-semantic-fill-alternative)' : 'var(--color-semantic-accent-background-violet)',
                  color: seeding ? 'var(--color-semantic-label-assistive)' : 'var(--color-semantic-static-white)',
                  border: 'none',
                  borderRadius: 8,
                  cursor: seeding ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {seeding ? '생성 중...' : '더미 데이터 생성 (1:1×15 + GROUP×15)'}
              </button>

              {seedResult && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Badge color="var(--color-semantic-accent-foreground-violet)" label={`생성된 유저 ${seedResult.createdUsers}명`} />
                  <Badge color="var(--color-semantic-status-cautionary)" label={`1:1 ${seedResult.oneToOneUsers}명`} />
                  <Badge color="var(--color-semantic-status-positive)" label={`GROUP ${seedResult.groupUsers}명`} />
                  <Badge color="var(--color-semantic-accent-foreground-blue)" label={`매칭 ${seedResult.matchRequests}건`} />
                  <Badge color="var(--color-semantic-accent-foreground-violet)" label={`채팅방 ${seedResult.chatRooms}개`} />
                </div>
              )}
            </div>
          </div>

          <div style={{ color: 'var(--color-semantic-label-assistive)', fontSize: 12 }}>
            Prisma Studio로 상세 조회:{' '}
            <a href="http://localhost:5555" target="_blank" rel="noreferrer" style={{ color: 'var(--color-semantic-accent-foreground-violet)' }}>
              localhost:5555
            </a>{' '}
            (별도 실행 필요: <code>npx prisma studio</code>)
          </div>
        </>
      )}
    </div>
  );
}

function Badge({ color, label }: { color: string; label: string }) {
  return (
    <span
      style={{
        padding: '4px 12px',
        borderRadius: 20,
        background: `rgb(from ${color} r g b / 0.09)`,
        color,
        fontWeight: 600,
        fontSize: 13,
      }}
    >
      {label}
    </span>
  );
}
