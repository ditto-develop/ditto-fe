import { useSyncExternalStore } from "react";

import { isNativeApp } from "@/shared/lib/native/platform";

export function MainContainer({ children }: { children: React.ReactNode }) {
  return <div className="splash-main">{children}</div>;
}

export function ImgContainer({ children }: { children: React.ReactNode }) {
  return <div className="splash-img-container">{children}</div>;
}

/** 값이 바뀌지 않으므로 구독할 것이 없다. */
const subscribeNever = () => () => {};

/**
 * 베타 배지. **웹에서만** 그린다.
 *
 * 앱(Capacitor 웹뷰)에는 넣지 않는다 — App Store 가이드라인 2.2 가 베타를 스토어에 올리지
 * 말라고 해서 심사에서 걸린다. 네이티브 아이콘·스플래시도 배지 없이 만든다
 * (scripts/generate-app-assets.mjs).
 *
 * 서버 스냅샷을 false 로 두어 **정적 HTML 에는 배지가 없다.** 앱은 처음부터 배지 없는 화면을
 * 그리고, 웹은 하이드레이션 직후 배지가 붙는다. 반대로(HTML 에 그렸다가 앱에서 지우기)
 * 하면 앱을 켤 때마다 배지가 한 번 스친다. head 인라인 스크립트로 먼저 표식을 다는 방법은
 * <head> 하이드레이션 불일치를 일으켜 쓰지 않는다(2026-10-06 E2E 에서 확인).
 */
export function BetaBadge() {
  const isWeb = useSyncExternalStore(subscribeNever, () => !isNativeApp(), () => false);
  if (!isWeb) return null;
  return <img className="splash-beta-badge" src="/assets/logo/beta-badge.svg" alt="Beta" />;
}
