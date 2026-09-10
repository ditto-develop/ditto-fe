/**
 * 화면 체류 시간 누적기.
 *
 * DOM 을 모르는 **순수 로직**이다. 이벤트 배선(visibilitychange, Capacitor
 * appStateChange)은 `useScreenTracking` 이 하고, 시간 계산만 여기서 한다 —
 * 단위 테스트 환경이 node 라 DOM 없이 검증할 수 있어야 하기 때문이다.
 *
 * 벽시계(`durationMs`)와 실제 노출 시간(`engagedMs`)을 나눠 든다. 나누지 않으면
 * 앱을 켜 둔 채 방치한 시간이 전부 체류로 잡혀 "이 화면에 오래 머문다"가
 * "이 화면을 켜 놓고 딴짓한다"와 구분되지 않는다.
 */

export interface EngagementSnapshot {
  /** 진입부터 지금까지의 벽시계 시간. */
  durationMs: number;
  /** 그중 화면이 실제로 보이던 시간만 합한 값. 항상 `durationMs` 이하다. */
  engagedMs: number;
}

export interface EngagementTracker {
  /** 화면이 가려졌다(백그라운드 전환, 탭 숨김). 이미 가려진 상태면 아무 일도 없다. */
  pause(): void;
  /** 화면이 다시 보인다. 이미 보이는 상태면 아무 일도 없다. */
  resume(): void;
  /** 지금까지의 누적치. 여러 번 불러도 상태를 바꾸지 않는다. */
  snapshot(): EngagementSnapshot;
}

/**
 * @param now      시각 소스. 테스트에서 가짜 시계를 넣기 위해 주입받는다.
 * @param visible  생성 시점에 화면이 보이는 상태인지. 백그라운드에서 복귀하며
 *                 화면이 바뀌는 경우가 있어 기본값(true)에 기댈 수 없다.
 */
export function createEngagementTracker(
  now: () => number = Date.now,
  visible = true,
): EngagementTracker {
  const startedAt = now();
  let accumulatedMs = 0;
  let visibleSince: number | null = visible ? startedAt : null;

  return {
    pause() {
      if (visibleSince === null) return;
      accumulatedMs += now() - visibleSince;
      visibleSince = null;
    },
    resume() {
      if (visibleSince !== null) return;
      visibleSince = now();
    },
    snapshot() {
      const current = now();
      const pending = visibleSince === null ? 0 : current - visibleSince;
      return {
        durationMs: current - startedAt,
        engagedMs: accumulatedMs + pending,
      };
    },
  };
}
