import type { PluginListenerHandle } from "@capacitor/core";

import { isNativeApp } from "@/shared/lib/native/platform";

/**
 * 화면이 다시 보이게 될 때(탭 복귀·앱 포그라운드 복귀) `onResume` 을 부른다.
 *
 * 두 신호를 함께 듣는다. 웹은 `visibilitychange` 로 충분하지만 앱 웹뷰에서는 그것만
 * 믿을 수 없어(특히 안드로이드 웹뷰) Capacitor `appStateChange` 도 단다. 앱에서는 한
 * 번의 복귀에 둘 다 올 수 있으므로 호출부가 중복 호출을 견뎌야 한다(진행 중이면 건너뛰기).
 *
 * @returns 구독 해제 함수
 */
export function subscribeAppResume(onResume: () => void): () => void {
  let active = true;
  let nativeListener: PluginListenerHandle | undefined;

  const onVisibilityChange = () => {
    if (!document.hidden) onResume();
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  if (isNativeApp()) {
    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) onResume();
        });
        if (active) nativeListener = handle;
        else void handle.remove();
      } catch {
        // 네이티브 리스너 등록 실패는 무시한다 — visibilitychange 가 남는다.
      }
    })();
  }

  return () => {
    active = false;
    document.removeEventListener("visibilitychange", onVisibilityChange);
    void nativeListener?.remove();
  };
}
