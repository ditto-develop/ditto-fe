import { describe, expect, it } from 'vitest';

import { DEFAULT_TOAST_DURATION, isScreenBoundToast, isStickyToast } from '@/shared/lib/toastScope';

describe('isScreenBoundToast', () => {
  it('옵션이 없으면 기본 시간 뒤 사라지는 안내 토스트로 본다', () => {
    expect(isScreenBoundToast()).toBe(false);
    expect(isScreenBoundToast({})).toBe(false);
    expect(isScreenBoundToast({ duration: DEFAULT_TOAST_DURATION })).toBe(false);
  });

  it('duration 이 0 이하면 화면에 묶인다 — 스스로 사라지지 않는다', () => {
    expect(isScreenBoundToast({ duration: 0 })).toBe(true);
    expect(isScreenBoundToast({ duration: -1 })).toBe(true);
  });

  it('액션이 달리면 duration 과 무관하게 화면에 묶인다', () => {
    expect(isScreenBoundToast({ duration: 5000, actionLabel: '확인' })).toBe(true);
    expect(isScreenBoundToast({ duration: 5000, onAction: () => {} })).toBe(true);
    expect(isScreenBoundToast({ duration: 5000, actionIcon: 'icon' })).toBe(true);
  });

  it('시간이 정해진 순수 안내 토스트는 이동 직전에 띄워도 살아남는다', () => {
    expect(isScreenBoundToast({ duration: 3000 })).toBe(false);
  });
});

describe('isStickyToast', () => {
  it('시간이 정해진 토스트는 스스로 사라지므로 컴포넌트에 묶지 않는다', () => {
    expect(isStickyToast()).toBe(false);
    expect(isStickyToast({ duration: DEFAULT_TOAST_DURATION })).toBe(false);
    // 액션이 달려도 시간이 정해져 있으면 마찬가지다.
    // "참여했어요 [확인]" 처럼 알린 직후 화면이 갱신되는 흐름에서 결과가 사라지면 안 된다.
    expect(isStickyToast({ duration: 3000, actionLabel: '확인' })).toBe(false);
  });

  it('duration 이 0 이하면 컴포넌트에 묶인다 — 아무도 걷어 주지 않는다', () => {
    expect(isStickyToast({ duration: 0 })).toBe(true);
    expect(isStickyToast({ duration: 0, actionLabel: '저장' })).toBe(true);
  });
});
