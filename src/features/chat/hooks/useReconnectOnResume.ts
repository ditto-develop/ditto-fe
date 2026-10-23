import { useEffect } from "react";

/**
 * 화면이 다시 보이거나 네트워크가 돌아오면 끊긴 실시간 연결을 곧바로 다시 붙인다.
 *
 * 백그라운드에 있는 동안 웹뷰는 타이머를 멈추거나 늦춰서, 그 사이 서버가 바뀌면(배포·Spot 회수)
 * 재연결 백오프가 앱으로 돌아온 뒤에도 수십 초 남아 있을 수 있다. 사용자가 돌아온 순간이
 * 다시 붙기 가장 좋은 때다. 이미 붙어 있으면 `reconnect` 가 아무것도 하지 않는다.
 *
 * `visibilitychange` 는 앱 전환·화면 복귀를, `pageshow` 는 bfcache 복원을, `online` 은 망 복구를 잡는다.
 */
export function useReconnectOnResume(reconnect: () => void): void {
  useEffect(() => {
    const reconnectIfVisible = () => {
      if (document.visibilityState !== "visible") return;
      reconnect();
    };

    document.addEventListener("visibilitychange", reconnectIfVisible);
    window.addEventListener("pageshow", reconnectIfVisible);
    window.addEventListener("online", reconnectIfVisible);

    return () => {
      document.removeEventListener("visibilitychange", reconnectIfVisible);
      window.removeEventListener("pageshow", reconnectIfVisible);
      window.removeEventListener("online", reconnectIfVisible);
    };
  }, [reconnect]);
}
