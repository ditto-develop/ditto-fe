import { getNativePlatform } from "@/shared/lib/native/platform";
import { scrubTransportItem } from "@/shared/lib/observability/scrub";

/**
 * Grafana Faro(프런트엔드 관측) 초기화.
 *
 * 수집 대상은 JS 에러, console.warn/error, 페이지 성능(Web Vitals)과 아래 생명주기 이벤트다.
 * 보내는 곳은 BE 와 같은 Grafana Cloud 스택(Frontend Observability)이다.
 *
 * 앱에서 "연결할 수 없어요"(public/app-offline.html) 화면이 뜨는 원인을 좁히는 것이 1차 목적이다.
 * 그 화면은 웹뷰가 문서 로드에 실패한 **뒤에** 뜨므로 실패 자체는 여기서 볼 수 없다. 대신
 * 실패 직전(백그라운드 전환·pagehide·오프라인 전환)과 직후(화면 복귀 방식)를 남겨서, 오프라인
 * 화면이 따로 보내는 기록(에러 코드)과 시각으로 이어 본다.
 *
 * 계측은 **절대 앱을 깨뜨리면 안 된다**(gtag.ts 와 같은 원칙). 아래는 전부 실패해도 조용히 끝난다.
 * 꺼지는 경우:
 *   - 수집 주소(NEXT_PUBLIC_FARO_URL)가 비어 있다 — 로컬, Cypress verify 잡, Storybook
 *   - 운영 빌드가 아니다 — `next dev`(Cypress 포함)에서는 켜지 않는다
 */

/**
 * 수집 주소. Grafana Cloud → Frontend Observability 앱의 collector URL 이다(공개값).
 *
 * ⚠️ `output: 'export'` 라 빌드 시점에 정적 치환된다. deploy-prod.yml 의 deploy 잡 Build 스텝에
 * 넘기지 않으면 빌드는 성공하고 운영에서만 조용히 꺼진다. 치환은 이 **정확한 형태**에만 걸린다.
 */
function getCollectorUrl(): string {
  return process.env.NEXT_PUBLIC_FARO_URL ?? "";
}

/** 배포 커밋. 비면 "unknown" — 어떤 릴리스에서 난 에러인지 가르는 데만 쓴다. */
function getAppVersion(): string {
  return process.env.NEXT_PUBLIC_FARO_APP_VERSION || "unknown";
}

/** 오프라인 화면이 HOME 으로 되돌아올 때 붙이는 표식. app-offline.html 의 FROM_OFFLINE_PARAM 과 같아야 한다. */
export const FROM_OFFLINE_PARAM = "from";
export const FROM_OFFLINE_VALUE = "offline-page";

const LIFECYCLE_DOMAIN = "app_lifecycle";

let started = false;

export function isFaroEnabled(): boolean {
  return process.env.NODE_ENV === "production" && getCollectorUrl() !== "";
}

/**
 * 오프라인 화면에서 넘어왔는지 읽고 주소에서 표식을 지운다.
 * 지우지 않으면 새로고침·공유 때마다 "복귀"로 다시 집계된다.
 */
export function consumeFromOfflineMark(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  if (url.searchParams.get(FROM_OFFLINE_PARAM) !== FROM_OFFLINE_VALUE) return false;
  url.searchParams.delete(FROM_OFFLINE_PARAM);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  return true;
}

/** 문서가 어떻게 열렸는지(navigate/reload/back_forward). 웹뷰가 스스로 reload 했는지 가른다. */
function getNavigationType(): string {
  const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return entry?.type ?? "unknown";
}

/**
 * Faro 를 한 번만 켠다. 꺼진 조건이면 아무것도 하지 않는다.
 *
 * SDK 는 동적 import 로 불러 계측이 꺼진 빌드·환경의 번들에 얹히지 않게 한다.
 * SDK 와 아래 리스너는 문서가 살아 있는 동안 유지한다 — 해제 함수를 주지 않는 이유는
 * 두 번째 호출이 `started` 에 막혀 리스너를 다시 달지 못하기 때문이다.
 */
export async function initFaro(): Promise<void> {
  if (started || typeof window === "undefined" || !isFaroEnabled()) return;
  started = true;

  // 표식은 SDK 를 받기 전에 지운다 — 느린 망에서 사용자가 그사이 주소를 공유할 수 있다.
  const fromOffline = consumeFromOfflineMark();
  const platform = getNativePlatform();

  try {
    const { initializeFaro, getWebInstrumentations, LogLevel } = await import("@grafana/faro-web-sdk");

    const faro = initializeFaro({
      url: getCollectorUrl(),
      app: { name: "ditto-fe", version: getAppVersion(), environment: "production" },
      instrumentations: getWebInstrumentations({ captureConsole: true }),
      // console.log/info 는 디버그 소음이다. 경고·에러만 남긴다.
      consoleInstrumentation: {
        disabledLevels: [LogLevel.TRACE, LogLevel.DEBUG, LogLevel.INFO, LogLevel.LOG],
      },
      // 회원 정보는 붙이지 않는다(user 메타 미설정). 세션에는 실행 환경만 단다.
      sessionTracking: { session: { attributes: { platform } } },
      trackGeolocation: false,
      beforeSend: scrubTransportItem,
    });

    const push = (name: string, attributes: Record<string, string> = {}) => {
      faro.api.pushEvent(name, { platform, ...attributes }, LIFECYCLE_DOMAIN);
    };

    push("app_load", {
      navigation_type: getNavigationType(),
      from_offline_page: String(fromOffline),
      online: String(navigator.onLine),
    });

    document.addEventListener("visibilitychange", () => push(`visibility_${document.visibilityState}`));
    window.addEventListener("pagehide", (event) => push("pagehide", { persisted: String(event.persisted) }));
    window.addEventListener("pageshow", (event) => {
      // 첫 로드의 pageshow 는 app_load 와 겹친다. bfcache 복원만 남긴다.
      if (event.persisted) push("pageshow_restored");
    });
    window.addEventListener("online", () => push("online"));
    window.addEventListener("offline", () => push("offline"));
  } catch (err: unknown) {
    // 광고 차단기·청크 로드 실패 등. 계측이 없을 뿐 앱은 그대로 돈다.
    console.warn("[faro] 초기화 실패:", err);
  }
}
