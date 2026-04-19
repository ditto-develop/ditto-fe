'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from "@/app/admin/adminApi";

interface SystemState {
  year: number;
  month: number;
  week: number;
  period: string;
}

interface SystemStateResponse {
  success: boolean;
  data: SystemState;
}

const PERIODS = [
  {
    value: 'QUIZ_PERIOD',
    label: 'QUIZ_PERIOD',
    description: '월 ~ 수 | 퀴즈 풀기',
    color: 'var(--color-semantic-accent-foreground-blue)',
    emoji: '📝',
  },
  {
    value: 'MATCHING_PERIOD',
    label: 'MATCHING_PERIOD',
    description: '목요일 | 매칭',
    color: 'var(--color-semantic-status-cautionary)',
    emoji: '💞',
  },
  {
    value: 'CHATTING_PERIOD',
    label: 'CHATTING_PERIOD',
    description: '금 ~ 일 | 채팅',
    color: 'var(--color-semantic-status-positive)',
    emoji: '💬',
  },
];

export default function TimeOverridePage() {
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchState = () => {
    adminFetch<SystemStateResponse>('/system/state')
      .then((res) => {
        setSystemState(res.data);
        setSelected(res.data.period);
      })
      .catch((e: Error) => setMessage({ type: 'error', text: e.message }));
  };

  useEffect(() => {
    fetchState();
  }, []);

  const handleSetOverride = async () => {
    if (!selected) return;
    setLoading(true);
    setMessage(null);
    try {
      await adminFetch('/admin/system/override', {
        method: 'POST',
        body: JSON.stringify({ period: selected }),
      });
      setMessage({ type: 'success', text: `✅ 오버라이드 설정됨: ${selected}` });
      fetchState();
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleClearOverride = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await adminFetch('/admin/system/override', { method: 'DELETE' });
      setMessage({ type: 'success', text: '✅ 오버라이드 해제됨 — 다음 자정에 자동 복귀됩니다' });
      fetchState();
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const currentPeriod = PERIODS.find((p) => p.value === systemState?.period);

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700 }}>시간 임시 조정</h1>
      <p style={{ color: 'var(--color-semantic-label-alternative)', margin: '0 0 32px' }}>
        오늘의 기간을 수동으로 설정합니다. 자정 스케줄러는 오버라이드가 해제될 때까지 자동 업데이트를 건너뜁니다.
      </p>

      {/* Current state */}
      {systemState && (
        <div
          style={{
            background: 'var(--color-semantic-static-white)',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-semantic-label-assistive)', marginBottom: 4 }}>현재 시스템 상태</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-semantic-label-normal)' }}>
              {systemState.year}년 {systemState.month}월 {systemState.week}주차
            </div>
          </div>
          <div
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              background: `rgb(from ${currentPeriod?.color ?? 'var(--color-semantic-label-alternative)'} r g b / 0.13)`,
              color: currentPeriod?.color ?? 'var(--color-semantic-label-alternative)',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {currentPeriod?.emoji} {systemState.period}
          </div>
        </div>
      )}

      {/* Period selector */}
      <div
        style={{
          background: 'var(--color-semantic-static-white)',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>기간 선택</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {PERIODS.map((p) => {
            const isSelected = selected === p.value;
            return (
              <label
                key={p.value}
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: '16px 20px',
                  border: `2px solid ${isSelected ? p.color : 'var(--color-semantic-line-normal-neutral)'}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  background: isSelected ? `rgb(from ${p.color} r g b / 0.06)` : 'var(--color-semantic-background-elevated-alternative)',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="radio"
                  name="period"
                  value={p.value}
                  checked={isSelected}
                  onChange={() => setSelected(p.value)}
                  style={{ display: 'none' }}
                />
                <div style={{ fontSize: 22, marginBottom: 6 }}>{p.emoji}</div>
                <div style={{ fontWeight: 700, color: isSelected ? p.color : 'var(--color-semantic-label-normal)', marginBottom: 2 }}>
                  {p.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-semantic-label-alternative)' }}>{p.description}</div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={handleSetOverride}
          disabled={loading || !selected}
          style={{
            padding: '12px 28px',
            background: 'var(--color-semantic-accent-background-violet)',
            color: 'var(--color-semantic-static-white)',
            border: 'none',
            borderRadius: 10,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            fontSize: 15,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '처리 중...' : '오버라이드 설정'}
        </button>
        <button
          onClick={handleClearOverride}
          disabled={loading}
          style={{
            padding: '12px 28px',
            background: 'var(--color-semantic-static-white)',
            color: 'var(--color-semantic-label-normal)',
            border: '1px solid var(--color-semantic-line-solid-neutral)',
            borderRadius: 10,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 15,
            opacity: loading ? 0.7 : 1,
          }}
        >
          초기화 (자동 복귀)
        </button>
      </div>

      {/* Feedback message */}
      {message && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 8,
            background: message.type === 'success' ? 'var(--color-semantic-fill-alternative)' : 'var(--color-semantic-fill-alternative)',
            color: message.type === 'success' ? 'var(--color-semantic-status-positive)' : 'var(--color-semantic-status-negative)',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Explanation */}
      <div
        style={{
          marginTop: 32,
          padding: 16,
          background: 'var(--color-semantic-fill-alternative)',
          borderRadius: 10,
          fontSize: 13,
          color: 'var(--color-semantic-label-alternative)',
          lineHeight: 1.6,
        }}
      >
        <strong>동작 방식</strong>
        <br />
        • <strong>오버라이드 설정</strong>: Redis에 선택한 기간을 저장하고 자동 업데이트 플래그를 활성화합니다.
        <br />
        • 자정 스케줄러는 오버라이드가 활성화된 동안 업데이트를 건너뜁니다.
        <br />
        • <strong>초기화</strong>: 오버라이드 플래그만 해제됩니다. 실제 기간 복귀는 다음 자정 스케줄러 실행 시 이루어집니다.
      </div>
    </div>
  );
}
