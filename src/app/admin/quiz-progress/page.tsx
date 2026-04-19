'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from "@/app/admin/adminApi";

interface QuizProgressItem {
  userId: string;
  nickname: string;
  email: string;
  quizSetId: string;
  quizSetTitle: string;
  matchingType: string;
  status: string;
  totalQuizzes: number;
  completedAt: string | null;
  selectedAt: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    year: number;
    month: number;
    week: number;
    items: QuizProgressItem[];
    total: number;
  };
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  COMPLETED:   { label: '완료', color: 'var(--color-semantic-status-positive)' },
  IN_PROGRESS: { label: '진행중', color: 'var(--color-semantic-status-cautionary)' },
  NOT_STARTED: { label: '미시작', color: 'var(--color-semantic-label-assistive)' },
};

const MATCHING_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  ONE_TO_ONE: { label: '1:1', color: 'var(--color-semantic-accent-foreground-violet)' },
  GROUP:      { label: '그룹', color: 'var(--color-semantic-accent-foreground-blue)' },
};

export default function QuizProgressPage() {
  const [data, setData] = useState<ApiResponse['data'] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'>('ALL');

  const fetchData = () => {
    setLoading(true);
    adminFetch<ApiResponse>('/admin/quiz-progress')
      .then((res) => setData(res.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const items = data?.items ?? [];
  const filtered = filter === 'ALL' ? items : items.filter((i) => i.status === filter);

  const completedCount = items.filter((i) => i.status === 'COMPLETED').length;
  const inProgressCount = items.filter((i) => i.status === 'IN_PROGRESS').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>퀴즈 참여 현황</h1>
        <button
          onClick={fetchData}
          style={{
            padding: '6px 14px',
            background: 'var(--color-semantic-fill-alternative)',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-semantic-label-normal)',
          }}
        >
          새로고침
        </button>
      </div>

      {/* 주차 + 요약 */}
      {data && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ padding: '10px 16px', background: 'var(--color-semantic-static-white)', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', fontSize: 14, color: 'var(--color-semantic-label-normal)' }}>
            📅 {data.year}년 {data.month}월 {data.week}주차
          </div>
          <div style={{ padding: '10px 16px', background: 'var(--color-semantic-static-white)', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', fontSize: 14 }}>
            전체 <strong>{data.total}</strong>명
          </div>
          <div style={{ padding: '10px 16px', background: 'rgb(from var(--color-semantic-fill-alternative) r g b / 0.08)', border: '1px solid rgb(from var(--color-semantic-accent-background-lime) r g b / 0.19)', borderRadius: 10, fontSize: 14, color: 'var(--color-semantic-status-positive)' }}>
            완료 <strong>{completedCount}</strong>명
          </div>
          <div style={{ padding: '10px 16px', background: 'rgb(from var(--color-semantic-fill-alternative) r g b / 0.08)', border: '1px solid rgb(from var(--color-semantic-accent-background-redOrange) r g b / 0.19)', borderRadius: 10, fontSize: 14, color: 'var(--color-semantic-status-cautionary)' }}>
            진행중 <strong>{inProgressCount}</strong>명
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--color-semantic-fill-alternative)', color: 'var(--color-semantic-status-negative)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* 필터 탭 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['ALL', 'COMPLETED', 'IN_PROGRESS', 'NOT_STARTED'] as const).map((s) => {
          const active = filter === s;
          const label = s === 'ALL' ? '전체' : (STATUS_LABEL[s]?.label ?? s);
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: active ? 700 : 400,
                background: active ? 'var(--color-semantic-inverse-background)' : 'var(--color-semantic-fill-alternative)',
                color: active ? 'var(--color-semantic-static-white)' : 'var(--color-semantic-label-normal)',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 테이블 */}
      <div style={{ background: 'var(--color-semantic-static-white)', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--color-semantic-fill-alternative)', borderBottom: '1px solid var(--color-semantic-line-normal-neutral)' }}>
              {['닉네임', '이메일', '퀴즈셋', '타입', '상태', '선택일시', '완료일시'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-semantic-label-normal)', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--color-semantic-label-assistive)' }}>불러오는 중...</td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--color-semantic-label-assistive)' }}>데이터가 없습니다.</td>
              </tr>
            )}
            {filtered.map((item) => {
              const statusInfo = STATUS_LABEL[item.status] ?? { label: item.status, color: 'var(--color-semantic-label-assistive)' };
              const typeInfo = MATCHING_TYPE_LABEL[item.matchingType] ?? { label: item.matchingType, color: 'var(--color-semantic-label-assistive)' };
              return (
                <tr key={item.userId} style={{ borderBottom: '1px solid var(--color-semantic-fill-alternative)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{item.nickname}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-semantic-label-alternative)' }}>{item.email}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-semantic-label-alternative)', maxWidth: 200 }}>{item.quizSetTitle}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      background: `rgb(from ${typeInfo.color} r g b / 0.13)`, color: typeInfo.color,
                    }}>
                      {typeInfo.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      background: `rgb(from ${statusInfo.color} r g b / 0.13)`, color: statusInfo.color,
                    }}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-semantic-label-alternative)', whiteSpace: 'nowrap' }}>
                    {new Date(item.selectedAt).toLocaleString('ko-KR')}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-semantic-label-alternative)', whiteSpace: 'nowrap' }}>
                    {item.completedAt ? new Date(item.completedAt).toLocaleString('ko-KR') : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
