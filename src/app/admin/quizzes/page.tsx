'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../adminApi';

interface Quiz {
  id: string;
  question: string;
  order: number;
}

interface QuizSet {
  id: string;
  year: number;
  month: number;
  week: number;
  category: string;
  title: string;
  description?: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  quizzes: Quiz[];
}

interface CurrentWeekResponse {
  success: boolean;
  data: {
    year: number;
    month: number;
    week: number;
    quizSets: QuizSet[];
  };
}

interface SystemStateResponse {
  success: boolean;
  data: {
    year: number;
    month: number;
    week: number;
    period: string;
  };
}

const PERIOD_LABELS: Record<string, { label: string; color: string }> = {
  QUIZ_PERIOD:     { label: '퀴즈 기간 (월-수)', color: '#3b82f6' },
  MATCHING_PERIOD: { label: '매칭 기간 (목)',    color: '#f59e0b' },
  CHATTING_PERIOD: { label: '채팅 기간 (금-일)', color: '#10b981' },
};

export default function QuizzesPage() {
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [systemState, setSystemState] = useState<{ year: number; month: number; week: number; period: string } | null>(null);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchData = () => {
    Promise.all([
      adminFetch<CurrentWeekResponse>('/quiz-sets/current-week'),
      adminFetch<SystemStateResponse>('/system/state'),
    ])
      .then(([quizRes, sysRes]) => {
        setQuizSets(quizRes.data.quizSets);
        setSystemState(sysRes.data);
      })
      .catch((e: Error) => setError(e.message));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (qs: QuizSet) => {
    const action = qs.isActive ? 'deactivate' : 'activate';
    setToggling(qs.id);
    try {
      await adminFetch(`/quiz-sets/${qs.id}/${action}`, { method: 'POST' });
      fetchData();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setToggling(null);
    }
  };

  const periodInfo = systemState ? PERIOD_LABELS[systemState.period] : null;

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700 }}>이번주 퀴즈</h1>

      {/* System state banner */}
      {systemState && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            background: `${periodInfo?.color ?? '#6b7280'}15`,
            borderRadius: 10,
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 14, color: '#374151' }}>
            {systemState.year}년 {systemState.month}월 {systemState.week}주차
          </span>
          <span
            style={{
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              background: `${periodInfo?.color ?? '#6b7280'}20`,
              color: periodInfo?.color ?? '#6b7280',
            }}
          >
            {periodInfo?.label ?? systemState.period}
          </span>
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!quizSets.length && !error && <p style={{ color: '#888' }}>이번주 퀴즈셋이 없습니다.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {quizSets.map((qs) => (
          <div
            key={qs.id}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: qs.isActive ? '2px solid #10b981' : '2px solid transparent',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#7c6bff',
                    background: '#7c6bff15',
                    padding: '2px 8px',
                    borderRadius: 8,
                  }}
                >
                  {qs.category}
                </span>
                <h3 style={{ margin: '8px 0 4px', fontSize: 16, fontWeight: 600 }}>{qs.title}</h3>
                {qs.description && <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{qs.description}</p>}
              </div>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  background: qs.isActive ? '#d1fae5' : '#f3f4f6',
                  color: qs.isActive ? '#059669' : '#9ca3af',
                  flexShrink: 0,
                  marginLeft: 8,
                }}
              >
                {qs.isActive ? '활성' : '비활성'}
              </span>
            </div>

            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
              퀴즈 {qs.quizzes.length}개 · {new Date(qs.startDate).toLocaleDateString('ko-KR')} ~{' '}
              {new Date(qs.endDate).toLocaleDateString('ko-KR')}
            </div>

            <button
              onClick={() => handleToggle(qs)}
              disabled={toggling === qs.id}
              style={{
                width: '100%',
                padding: '8px',
                background: qs.isActive ? '#fee2e2' : '#d1fae5',
                color: qs.isActive ? '#dc2626' : '#059669',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {toggling === qs.id ? '처리 중...' : qs.isActive ? '비활성화' : '활성화'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
