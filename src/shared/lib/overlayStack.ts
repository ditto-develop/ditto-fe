/**
 * 열려 있는 모달·바텀시트 목록.
 *
 * OS 뒤로가기가 화면을 이탈하는 대신 **맨 위 오버레이만 닫도록** 하기 위한 등록소다.
 * Android 하드웨어/제스처 뒤로가기는 `@capacitor/app` 의 `backButton` 이벤트로 JS 에서
 * 가로챌 수 있으므로(`appShell.ts`), 그 처리기가 여기를 먼저 본다.
 *
 * ## 히스토리에 더미 엔트리를 쌓지 않는 이유
 *
 * "오버레이가 열릴 때 같은 URL 의 히스토리 엔트리를 하나 쌓고 뒤로가기가 그걸
 * 소비하게 한다"는 방법이 있고, iOS 스와이프 백까지 한 번에 처리된다는 장점 때문에
 * 먼저 그렇게 만들어 봤다. **그런데 `history.back()` 이 비동기라서 라우팅과 경합한다.**
 * 실제로 깨진 흐름(2026-09-09, Cypress 6개 스펙):
 *  - 바텀시트에서 모달을 열면(시트가 닫히며 모달이 열린다) 아직 처리되지 않은
 *    시트의 `back()` 이 모달의 엔트리를 걷어내 **모달이 열리자마자 닫혔다.**
 *  - 시트의 메뉴가 화면을 이동하면(신고하기 → `router.push("/report")`) 시트가
 *    걷어내는 엔트리와 라우터의 push 가 경합해 **이동 자체가 취소됐다.**
 * 두 경합은 마이크로태스크 지연·엔트리 물려받기로 하나씩 막을 수는 있었지만, 순서에
 * 기대는 방어가 계속 늘어났다. 히스토리를 건드리지 않으면 이 부류가 통째로 사라진다.
 *
 * ## 그래서 iOS 스와이프 백은?
 *
 * WKWebView 가 네이티브에서 처리해 JS 훅이 없다. 즉 iOS 에서 모달이 열린 채로
 * 스와이프하면 모달만 닫히는 게 아니라 **이전 화면으로 이동한다.** 네이티브 iOS 의
 * 모달도 엣지 스와이프에 반응하지 않으니 "스와이프로 모달을 닫는다"가 원래 기대
 * 동작은 아니다. 정말 막아야 한다면 오버레이가 열린 동안
 * `allowsBackForwardNavigationGestures` 를 끄는 네이티브 플러그인이 필요하다.
 */

type OverlayRecord = {
  readonly close: () => void;
};

/** `registerOverlay` 가 돌려주고 `unregisterOverlay` 가 되받는 불투명 핸들. */
export type OverlayHandle = OverlayRecord;

/** 열려 있는 오버레이. 마지막 원소가 화면 맨 위 = 뒤로가기가 닫을 대상. */
const openOverlays: OverlayRecord[] = [];

/** 오버레이가 열렸음을 알린다. */
export function registerOverlay(close: () => void): OverlayHandle {
  const record: OverlayRecord = { close };
  openOverlays.push(record);
  return record;
}

/** 오버레이가 닫혔음을 알린다. 어떻게 닫혔는지(뒤로가기·버튼)는 상관없다. */
export function unregisterOverlay(handle: OverlayHandle): void {
  const index = openOverlays.indexOf(handle);
  if (index !== -1) openOverlays.splice(index, 1);
}

export function hasOpenOverlay(): boolean {
  return openOverlays.length > 0;
}

/**
 * 맨 위 오버레이를 닫는다.
 *
 * @returns 닫을 오버레이가 있었는지. false 면 호출부가 원래 뒤로가기를 진행한다.
 */
export function closeTopOverlay(): boolean {
  const top = openOverlays[openOverlays.length - 1];
  if (!top) return false;

  // 목록에서 빼는 것은 컴포넌트가 언마운트되며 도는 unregisterOverlay 가 한다.
  // 여기서 미리 빼면 닫기 애니메이션 도중 뒤로가기를 한 번 더 눌렀을 때
  // 그 다음 오버레이가 예기치 않게 닫힌다.
  top.close();
  return true;
}
