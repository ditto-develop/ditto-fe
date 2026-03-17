'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../adminApi';

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
  COMPLETED:   { label: '완료', color: '#10b981' },
  IN_PROGRESS: { label: '진행중', color: '#f59e0b' },
  NOT_STARTED: { label: '미시작', color: '#9ca3af' },
};

const MATCHING_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  ONE_TO_ONE: { label: '1:1', color: '#7c6bff' },
  GROUP:      { label: '그룹', color: '#3b82f6' },
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
            background: '#f3f4f6',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            color: '#374151',
          }}
        >
          새로고침
        </button>
      </div>

      {/* 주차 + 요약 */}
      {data && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ padding: '10px 16px', background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', fontSize: 14, color: '#374151' }}>
            📅 {data.year}년 {data.month}월 {data.week}주차
          </div>
          <div style={{ padding: '10px 16px', background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', fontSize: 14 }}>
            전체 <strong>{data.total}</strong>명
          </div>
          <div style={{ padding: '10px 16px', background: '#d1fae515', border: '1px solid #10b98130', borderRadius: 10, fontSize: 14, color: '#10b981' }}>
            완료 <strong>{completedCount}</strong>명
          </div>
          <div style={{ padding: '10px 16px', background: '#fef3c715', border: '1px solid #f59e0b30', borderRadius: 10, fontSize: 14, color: '#f59e0b' }}>
            진행중 <strong>{inProgressCount}</strong>명
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: 16, borderRadius: 8, marginBottom: 16 }}>
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
                background: active ? '#1a1a2e' : '#f3f4f6',
                color: active ? '#fff' : '#374151',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 테이블 */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
              {['닉네임', '이메일', '퀴즈셋', '타입', '상태', '선택일시', '완료일시'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>데이터가 없습니다.</td>
              </tr>
            )}
            {filtered.map((item) => {
              const statusInfo = STATUS_LABEL[item.status] ?? { label: item.status, color: '#9ca3af' };
              const typeInfo = MATCHING_TYPE_LABEL[item.matchingType] ?? { label: item.matchingType, color: '#9ca3af' };
              return (
                <tr key={item.userId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{item.nickname}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{item.email}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', maxWidth: 200 }}>{item.quizSetTitle}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      background: `${typeInfo.color}20`, color: typeInfo.color,
                    }}>
                      {typeInfo.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      background: `${statusInfo.color}20`, color: statusInfo.color,
                    }}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {new Date(item.selectedAt).toLocaleString('ko-KR')}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>
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
