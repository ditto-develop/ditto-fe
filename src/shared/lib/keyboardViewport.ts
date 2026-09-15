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

/**
 * 지난번에 잰 키보드 높이를 기억해 두는 곳.
 *
 * 탭한 순간에는 키보드가 아직 없어 실측이 0 이다. 그 상태로는 "어디까지 올려야
 * 하는지" 를 알 수 없어, 키보드가 다 올라온 뒤에야 화면이 뒤따라 움직였다 —
 * 키보드 따로, 화면 따로 두 번 움직이는 그 끊김의 원인이다. 지난번 값을 알면
 * 누른 순간에 목표를 정해 키보드와 같이 움직일 수 있다.
 */
const REMEMBERED_INSET_KEY = "ditto.keyboard-inset";

interface RememberedInset {
  /** 잴 때의 화면 크기. 다르면(회전·다른 기기) 그 값은 못 쓴다. */
  width: number;
  height: number;
  inset: number;
}

/** undefined 는 "아직 저장소를 읽지 않았다", null 은 "기억이 없다". */
let rememberedInset: RememberedInset | null | undefined;

function readRememberedInset(): RememberedInset | null {
  if (rememberedInset !== undefined) return rememberedInset;

  rememberedInset = null;
  try {
    const raw = window.localStorage.getItem(REMEMBERED_INSET_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object") {
      const { width, height, inset } = parsed as Partial<RememberedInset>;
      if (typeof width === "number" && typeof height === "number" && typeof inset === "number") {
        rememberedInset = { width, height, inset };
      }
    }
  } catch {
    // 프라이빗 모드 등 저장소를 못 읽는 환경. 기억이 없을 뿐이라 그냥 넘어간다.
  }
  return rememberedInset;
}

/**
 * 키보드가 다 올라온 뒤 실제로 잰 높이를 기억한다.
 *
 * 0 도 그대로 기억한다 — 네이티브가 웹뷰를 줄여 주는 환경(가리는 높이가 애초에 0)
 * 이라는 사실도 다음 번에 필요한 정보다. 거기서 "곧 가려질 것" 이라 넘겨짚으면
 * 멀쩡한 화면을 엉뚱하게 올렸다 되돌리게 된다.
 */
export function rememberKeyboardInset(inset: number): void {
  const next: RememberedInset = {
    width: window.innerWidth,
    height: window.innerHeight,
    inset,
  };
  rememberedInset = next;
  try {
    window.localStorage.setItem(REMEMBERED_INSET_KEY, JSON.stringify(next));
  } catch {
    // 저장은 못 해도 이번 세션 동안은 메모리에 남아 그대로 쓰인다.
  }
}

/**
 * 곧 올라올 키보드가 가릴 높이(px).
 *
 * 이미 떠 있으면 실측이 곧 답이다. 아직이면 지난번에 잰 값을 쓰고, **잰 적이 없으면
 * 0 이다 — 추측하지 않는다.** 화면의 40% 쯤이라고 넘겨짚으면 처음 한 번을 위해
 * 남은 모든 경우에서 엉뚱한 위치로 올렸다 되돌릴 위험을 지는 셈이다. 기억이 없는
 * 첫 한 번만 예전처럼 키보드가 올라온 뒤에 따라가고, 그때 잰 값이 다음부터 쓰인다.
 */
export function getExpectedKeyboardInset(): number {
  const live = getKeyboardInset();
  if (live > 0) return live;

  const remembered = readRememberedInset();
  if (!remembered) return 0;
  if (remembered.width !== window.innerWidth) return 0;
  if (remembered.height !== window.innerHeight) return 0;
  return remembered.inset;
}

/**
 * 키보드가 올라온 뒤의 가시 영역.
 * 이미 올라와 있으면 실측이 답이고, 아직이면 곧 가릴 높이만큼 미리 빼서
 * 목표 위치를 지금(=누른 순간) 계산할 수 있게 한다.
 */
export function expectedVisibleViewport(
  pendingInset: number,
  viewport: VisibleViewport = getVisibleViewport(),
  liveInset: number = getKeyboardInset(),
): VisibleViewport {
  if (liveInset > 0 || pendingInset <= 0) return viewport;
  return { top: viewport.top, height: Math.max(viewport.height - pendingInset, 0) };
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

/** 움직이는 데 걸리는 시간. 키보드가 올라오는 시간(iOS 약 0.25초)에 맞춘 값이다. */
const REVEAL_ANIMATION_MS = 260;

interface RunningScroll {
  scroller: HTMLElement | null;
  /** 이 애니메이션이 향하는 최종 위치. 같은 곳이면 다시 시작하지 않는다. */
  to: number;
  frame: number;
}

let runningScroll: RunningScroll | null = null;

function readScrollTop(scroller: HTMLElement | null): number {
  return scroller ? scroller.scrollTop : window.scrollY;
}

function writeScrollTop(scroller: HTMLElement | null, value: number): void {
  if (scroller) {
    scroller.scrollTop = value;
    return;
  }
  window.scrollTo(window.scrollX, value);
}

function stopScrollAnimation(): void {
  if (!runningScroll) return;
  window.cancelAnimationFrame(runningScroll.frame);
  runningScroll = null;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * 스크롤을 목표 위치까지 부드럽게 옮긴다.
 *
 * 한 번에 튀지 않고 키보드가 올라오는 것과 비슷한 시간·곡선으로 움직여야 둘이 같이
 * 움직이는 것처럼 보인다. `scrollTo({ behavior: "smooth" })` 를 쓰지 않는 건 시간을
 * 정할 수 없어서다 — 브라우저마다 키보드보다 느려 오히려 더 끌려 보인다.
 */
function scrollTowards(scroller: HTMLElement | null, to: number): void {
  /*
   * 이미 같은 곳으로 가는 중이면 그대로 둔다.
   * 보정(뷰포트 변화·타이머)이 불릴 때마다 다시 시작하면 남은 거리를 매번 새로
   * 260ms 에 걸쳐 가느라 끝없이 느려진다.
   */
  if (runningScroll && runningScroll.scroller === scroller && Math.abs(runningScroll.to - to) < 1) {
    return;
  }

  stopScrollAnimation();

  const from = readScrollTop(scroller);
  if (Math.abs(to - from) < 1 || prefersReducedMotion()) {
    writeScrollTop(scroller, to);
    return;
  }

  const startedAt = performance.now();
  const step = (now: number) => {
    const progress = Math.min((now - startedAt) / REVEAL_ANIMATION_MS, 1);
    // 키보드처럼 빠르게 출발해 천천히 멈춘다.
    const eased = 1 - (1 - progress) ** 3;
    writeScrollTop(scroller, from + (to - from) * eased);
    if (progress < 1) {
      runningScroll = { scroller, to, frame: window.requestAnimationFrame(step) };
      return;
    }
    runningScroll = null;
  };

  runningScroll = { scroller, to, frame: window.requestAnimationFrame(step) };
}

export interface RevealOptions {
  /**
   * 목표를 계산할 가시 영역. 생략하면 **지금** 보이는 영역이다.
   * 아직 올라오지 않은 키보드까지 감안하려면 `expectedVisibleViewport()` 를 넘긴다.
   */
  viewport?: VisibleViewport;
  /** 부드럽게 움직일지. 기본은 true. */
  animate?: boolean;
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
  options: RevealOptions = {},
): void {
  const rect = element.getBoundingClientRect();
  const delta = computeScrollDelta(rect, options.viewport ?? getVisibleViewport(), margin);
  // 이미 제자리다. 가는 중이던 애니메이션이 있다면 목적지는 여전히 유효하므로 건드리지 않는다.
  if (Math.abs(delta) < 1) return;

  const scroller = getScrollParent(element);
  const to = readScrollTop(scroller) + delta;

  if (options.animate === false) {
    stopScrollAnimation();
    writeScrollTop(scroller, to);
    return;
  }
  scrollTowards(scroller, to);
}
