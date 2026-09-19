/**
 * 배포 직후 "이미 열려 있던 탭"을 살리는 청크 로드 실패 가드.
 *
 * 정적 익스포트라 라우트 HTML 은 해시가 붙은 `_next/static/**` 청크를 가리키는데,
 * 배포하면 빌드 ID 가 바뀌어 청크 파일명이 통째로 갈린다. 배포 전에 문서를 받은 탭은
 * **옛 파일명**을 들고 있으므로, 그 탭에서 라우트를 옮기는 순간 새 청크를 받아야 하는데
 * 파일이 없으면 `ChunkLoadError` 로 떨어져 화면이 하얗게 죽는다.
 *
 * 1차 방어선은 배포 쪽이다 — `_next/static` 은 `--delete` 대상에서 빼서 구 청크를
 * 7일간 남긴다(`.github/workflows/deploy-prod.yml`). 여기는 그 유예를 넘겼거나
 * 네트워크 문제로 청크를 못 받은 경우를 받는 2차 방어선으로, 문서를 한 번 다시 받아
 * 새 빌드로 갈아탄다.
 *
 * 리로드 루프 방지가 핵심이다. 청크가 영영 없는 상태(유예 초과)에서 무조건 새로고침하면
 * 같은 실패 → 새로고침을 무한 반복한다. 그래서 세션당 쿨다운을 두고, 그 안에 또 실패하면
 * 아무것도 하지 않는다(사용자는 깨진 화면을 보지만, 최소한 브라우저가 멈추지는 않는다).
 */

/** 새로고침 시각을 적어 두는 sessionStorage 키. 탭 단위라 다른 탭에 영향이 없다. */
export const CHUNK_RELOAD_MARK_KEY = "ditto:chunk-reload-at";

/** 이 시간 안에 또 청크 실패가 나면 새로고침하지 않는다(루프 차단). */
export const CHUNK_RELOAD_COOLDOWN_MS = 30_000;

/**
 * 청크/모듈 로드 실패로 볼 메시지들.
 * - `ChunkLoadError` / `Loading chunk ... failed`: webpack 런타임(Next 기본)
 * - `Loading CSS chunk`: CSS 청크
 * - `Importing a module script failed` / `error loading dynamically imported module`:
 *   사파리·파이어폭스의 동적 import 실패 문구
 */
const CHUNK_ERROR_PATTERN =
  /ChunkLoadError|Loading chunk\b|Loading CSS chunk\b|Importing a module script failed|error loading dynamically imported module/i;

/**
 * 던져진 값이 청크 로드 실패인지. `unhandledrejection` 의 reason 은 무엇이든 올 수 있어
 * Error 인스턴스를 가정하지 않는다(다른 realm 에서 온 Error 는 instanceof 가 false 다).
 */
export function isChunkLoadError(reason: unknown): boolean {
  if (typeof reason === "string") return CHUNK_ERROR_PATTERN.test(reason);
  if (typeof reason !== "object" || reason === null) return false;

  const { name, message } = reason as { name?: unknown; message?: unknown };
  if (name === "ChunkLoadError") return true;
  return typeof message === "string" && CHUNK_ERROR_PATTERN.test(message);
}

/**
 * `<script>`/`<link>` 엘리먼트 로드 실패가 우리 빌드 산출물 때문인지.
 *
 * 카카오 SDK·gtag 같은 서드파티 스크립트는 광고 차단기만 있어도 늘 실패한다. 그것까지
 * 새로고침으로 받으면 차단기를 쓰는 사용자는 앱을 아예 못 쓰므로, **같은 오리진의
 * `_next/static/`** 만 우리 청크로 인정한다.
 */
export function isOwnChunkUrl(url: string | null | undefined, origin: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url, origin);
    return parsed.origin === origin && parsed.pathname.includes("/_next/static/");
  } catch {
    return false;
  }
}

/**
 * 지금 새로고침해도 되는지(=쿨다운 밖인지).
 * 마크를 읽을 수 없으면(프라이빗 모드 등) 새로고침을 허용한다 — 한 번은 살려 보는 쪽이 낫다.
 */
export function shouldReload(mark: string | null, now: number): boolean {
  if (!mark) return true;
  const at = Number(mark);
  if (!Number.isFinite(at)) return true;
  return now - at > CHUNK_RELOAD_COOLDOWN_MS;
}

/**
 * 전역 가드를 건다. 브라우저가 아니면 no-op 이고, 정리 함수를 돌려준다.
 */
export function initChunkReloadGuard(): () => void {
  if (typeof window === "undefined") return () => {};

  const recover = () => {
    let mark: string | null = null;
    try {
      mark = window.sessionStorage.getItem(CHUNK_RELOAD_MARK_KEY);
    } catch {
      // sessionStorage 접근 불가(프라이빗 모드 등) — 마크 없이 진행한다.
    }
    if (!shouldReload(mark, Date.now())) {
      console.error("[chunk] 청크 로드 실패가 반복된다 — 새로고침을 건너뛴다.");
      return;
    }
    try {
      window.sessionStorage.setItem(CHUNK_RELOAD_MARK_KEY, String(Date.now()));
    } catch {
      // 마크를 못 남기면 쿨다운이 동작하지 않는다. 그래도 한 번은 시도한다.
    }
    console.warn("[chunk] 청크 로드 실패 — 새 빌드로 갈아타기 위해 문서를 다시 받는다.");
    window.location.reload();
  };

  const onError = (event: ErrorEvent | Event) => {
    // 리소스 로드 실패는 버블링하지 않아 캡처 단계로 들어온다. message 가 없고
    // target 이 실패한 엘리먼트다.
    const target = event.target;
    if (target instanceof HTMLScriptElement || target instanceof HTMLLinkElement) {
      const src = target instanceof HTMLScriptElement ? target.src : target.href;
      if (isOwnChunkUrl(src, window.location.origin)) recover();
      return;
    }
    if ("error" in event && isChunkLoadError((event as ErrorEvent).error)) recover();
    else if ("message" in event && isChunkLoadError((event as ErrorEvent).message)) recover();
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    if (isChunkLoadError(event.reason)) recover();
  };

  // 캡처 단계여야 리소스 로드 실패까지 받는다.
  window.addEventListener("error", onError, true);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError, true);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
