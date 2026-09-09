/**
 * 키보드가 떠 있는 동안의 "실제로 보이는 영역"을 다룬다.
 *
 * 모바일 브라우저에서 키보드는 **레이아웃 뷰포트를 줄이지 않는다**. 화면 위에 겹쳐
 * 올라올 뿐이라 `window.innerHeight` 도, `100dvh` 도 그대로다. 그래서 브라우저가
 * 알아서 해 주는 "포커스된 입력창을 화면에 보이게 스크롤"이 동작하지 않는다 —
 * 입력창은 레이아웃상 이미 보이는 위치에 있고, 키보드가 그 위를 덮고 있을 뿐이다.
 * 특히 페이지 자체가 스크롤되지 않고(`overflow: hidden`) 안쪽 컨테이너만 스크롤되는
 * 화면(온보딩 소개 노트)에서는 아무 일도 일어나지 않는다.
 *
 * 진짜 가시 영역은 `visualViewport` 만 알고 있으므로 여기서 그것만 본다.
 * 네이티브가 웹뷰 프레임을 줄여 주는 환경(Capacitor iOS 기본 동작)에서는
 * `visualViewport.height` 와 `window.innerHeight` 가 같이 줄어 인셋이 0 이 되므로,
 * 앱/브라우저 어느 쪽에서도 같은 코드가 그대로 맞는다.
 */

/** 레이아웃 뷰포트 기준, 키보드에 가리지 않은 영역. */
export interface VisibleViewport {
  /** 가시 영역 상단(px). */
  top: number;
  /** 가시 영역 높이(px). */
  height: number;
}

/** `getBoundingClientRect()` 중 세로 위치만. */
export interface ElementBounds {
  top: number;
  bottom: number;
}

/** 기본 여백 — 입력창과 키보드가 붙어 보이지 않을 만큼만. */
export const DEFAULT_REVEAL_MARGIN = 16;

/**
 * 가시 영역 안쪽 여백. 숫자 하나면 위아래 같은 값이다.
 * 위쪽은 스크롤 영역 안에 고정(sticky)된 머리글이 있을 때 그 높이만큼 더 준다 —
 * 그러지 않으면 끌어올린 요소가 머리글 뒤로 들어가 버린다.
 */
export type RevealMargin = number | { top: number; bottom: number };

function resolveMargin(margin: RevealMargin): { top: number; bottom: number } {
  return typeof margin === "number" ? { top: margin, bottom: margin } : margin;
}

/**
 * 요소를 가시 영역 안으로 넣기 위해 스크롤해야 하는 양(px).
 * 양수면 아래로(콘텐츠를 위로 끌어올린다), 음수면 위로, 0이면 이미 보인다.
 *
 * 아래가 잘렸을 때 무작정 끌어올리면 이번엔 질문 문구가 위로 잘리므로,
 * 위쪽 여유분을 넘지 않는 선까지만 올린다. 요소가 가시 영역보다 크면 0 —
 * 어차피 화면을 꽉 채우고 있어 더 나은 위치가 없다.
 */
export function computeScrollDelta(
  element: ElementBounds,
  viewport: VisibleViewport,
  margin: RevealMargin = DEFAULT_REVEAL_MARGIN,
): number {
  const { top: marginTop, bottom: marginBottom } = resolveMargin(margin);
  const visibleTop = viewport.top + marginTop;
  const visibleBottom = viewport.top + viewport.height - marginBottom;

  if (element.bottom > visibleBottom) {
    const headroom = element.top - visibleTop;
    return Math.max(0, Math.min(element.bottom - visibleBottom, headroom));
  }

  if (element.top < visibleTop) {
    return element.top - visibleTop;
  }

  return 0;
}

/** 지금 화면에서 키보드에 가리지 않은 영역. `visualViewport` 가 없으면 화면 전체. */
export function getVisibleViewport(): VisibleViewport {
  const viewport = window.visualViewport;
  if (!viewport) return { top: 0, height: window.innerHeight };
  return { top: viewport.offsetTop, height: viewport.height };
}

/**
 * 키보드가 레이아웃 뷰포트 하단을 가린 높이(px).
 * 네이티브가 웹뷰를 줄여 주는 환경에서는 0 이다(가려진 영역이 애초에 없다).
 */
export function getKeyboardInset(): number {
  const viewport = window.visualViewport;
  if (!viewport) return 0;
  const inset = window.innerHeight - viewport.height - viewport.offsetTop;
  // 1px 미만은 소수점 오차다. 그걸로 상태를 흔들지 않는다.
  return inset > 1 ? Math.round(inset) : 0;
}

/** 요소를 실제로 스크롤하는 조상. 없으면 null(= 문서 자체가 스크롤된다). */
export function getScrollParent(element: HTMLElement): HTMLElement | null {
  let node = element.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const { overflowY } = window.getComputedStyle(node);
    const scrollable = overflowY === "auto" || overflowY === "scroll";
    if (scrollable && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * 요소를 키보드 위로 끌어올린다.
 *
 * 스크롤 컨테이너가 끝까지 밀려 더 올라갈 수 없으면 그만큼만 움직인다 —
 * 마지막 질문까지 올리려면 스크롤 콘텐츠 하단에 키보드 높이만큼 여백이 있어야 한다
 * (`useKeyboardInset` 참고).
 */
export function revealAboveKeyboard(
  element: HTMLElement,
  margin: RevealMargin = DEFAULT_REVEAL_MARGIN,
): void {
  const rect = element.getBoundingClientRect();
  const delta = computeScrollDelta(rect, getVisibleViewport(), margin);
  if (Math.abs(delta) < 1) return;

  const scroller = getScrollParent(element);
  if (scroller) {
    scroller.scrollTop += delta;
    return;
  }
  window.scrollBy(0, delta);
}
