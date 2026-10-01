"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";

/**
 * 위로 스크롤해 과거 메시지를 앞에 붙여도 읽던 자리를 지킨다.
 *
 * 예전에는 이 보정을 브라우저의 scroll anchoring(`overflow-anchor`)에 맡겼다. 그런데 iOS
 * WebKit(Safari·앱 WebView)은 anchoring 을 지원하지 않고, Chrome 도 `scrollTop` 이 0 이면
 * 앵커를 잡지 않는다. 과거를 부르는 조건이 `scrollTop <= 60` 이라 거의 늘 맨 위 근처에서
 * 붙이게 되고, `scrollTop` 이 그대로 남아 화면이 **방금 붙은 페이지의 맨 위**로 튀었다 —
 * "위로 올리면 방 맨 위로 올라가 버린다"의 정체다.
 *
 * 그래서 바닥에서의 거리(`scrollHeight - scrollTop`)를 잡아 두고, 로딩 문구가 끼거나 과거가
 * 붙어 높이가 달라질 때마다 그 거리를 다시 맞춘다. 로드 중에 사용자가 더 스크롤하면 그 위치를
 * 따라 갱신한다.
 *
 * 보정 자체도 scroll 이벤트를 낸다. 그 이벤트는 React 가 스크롤 핸들러를 새 `loadingOlder` 로
 * 다시 달기 전에 도착할 수 있어, state 만 보면 과거를 한 번 더 부른다. 그래서 진행 중인지는
 * ref(`isPending`)로 따로 알려 준다.
 *
 * @param firstKey 목록 맨 앞 메시지의 식별자. 과거가 붙으면 바뀐다.
 */
export function useKeepScrollOnPrepend(
  listRef: RefObject<HTMLElement | null>,
  firstKey: string | number | null,
  loadingOlder: boolean,
): { beginPrepend: () => void; isPending: () => boolean } {
  const distanceFromBottom = useRef<number | null>(null);

  const beginPrepend = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    distanceFromBottom.current = el.scrollHeight - el.scrollTop;
  }, [listRef]);

  // 로드 중 사용자가 계속 스크롤하면 그 자리를 기준으로 삼는다.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;

    const follow = () => {
      if (distanceFromBottom.current === null) return;
      distanceFromBottom.current = el.scrollHeight - el.scrollTop;
    };
    el.addEventListener("scroll", follow, { passive: true });
    return () => el.removeEventListener("scroll", follow);
  }, [listRef]);

  // 페인트 전에 맞춰야 맨 위로 튄 프레임이 보이지 않는다.
  useLayoutEffect(() => {
    const el = listRef.current;
    const distance = distanceFromBottom.current;
    if (!el || distance === null) return;

    el.scrollTop = el.scrollHeight - distance;
    // 로드가 끝난 렌더(성공이든 실패든)까지 맞춘 뒤 놓는다.
    if (!loadingOlder) distanceFromBottom.current = null;
  }, [listRef, firstKey, loadingOlder]);

  const isPending = useCallback(() => distanceFromBottom.current !== null, []);

  return { beginPrepend, isPending };
}
