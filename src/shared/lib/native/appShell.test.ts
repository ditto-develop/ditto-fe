import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toInternalPath } from "@/shared/lib/native/appShell";

type BackButtonHandler = (event: { canGoBack: boolean }) => void;

const exitApp = vi.fn(async () => {});
const addListener = vi.fn(async () => ({ remove: async () => {} }));

vi.mock("@capacitor/app", () => ({
  App: {
    exitApp: () => exitApp(),
    addListener: (...a: unknown[]) => addListener(...(a as [])),
  },
}));

vi.mock("@capacitor/status-bar", () => ({
  StatusBar: { setStyle: async () => {} },
  Style: { Light: "LIGHT" },
}));

const isNativePlatform = vi.fn(() => true);
vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
    getPlatform: () => "android",
  },
}));

/**
 * 딥링크 정규화. 푸시 알림 payload와 유니버설 링크가 이 함수를 통과해
 * Next 라우터로 들어가므로, 외부 URL이 통과하면 앱이 임의 페이지로 끌려간다.
 */
describe("toInternalPath", () => {
  it.each([
    ["/chat/one-on-one/12/", "/chat/one-on-one/12/"],
    ["https://ditto.pics/profile/8/", "/profile/8/"],
    ["https://www.ditto.pics/home/", "/home/"],
  ])("%s 를 내부 경로 %s 로 바꾼다", (input, expected) => {
    expect(toInternalPath(input)).toBe(expected);
  });

  it("쿼리스트링과 해시를 보존한다", () => {
    expect(toInternalPath("https://ditto.pics/profile/8/?quizSetId=4#top")).toBe(
      "/profile/8/?quizSetId=4#top",
    );
  });

  it.each([
    "https://evil.example.com/phish/",
    "https://ditto.pics.evil.com/profile/1/",
    "https://app.ditto.pics/chat/group/5/",
    "https://test.ditto.pics/quiz/3/",
    "javascript:alert(1)",
    "",
  ])("외부·비정상 URL %s 은 거부한다", (input) => {
    expect(toInternalPath(input)).toBeNull();
  });
});

/**
 * Android 하드웨어 뒤로가기 분기.
 *
 * 여기가 틀리면 사용자가 **앱 밖으로 튕기거나**(뿌리 화면 오판) **모달을 닫으려다
 * 앱이 종료된다**(오버레이보다 뿌리 판정이 먼저 왔을 때). 둘 다 조용한 회귀라 고정한다.
 */
describe("backButton 처리", () => {
  let handler: BackButtonHandler;
  let back: ReturnType<typeof vi.fn>;

  // 이 단위 테스트는 node 환경(vitest.config.ts)에서 돌기 때문에 DOM 이 없다.
  // 핸들러가 실제로 만지는 것은 pathname · history.state · history.back 뿐이라
  // jsdom 을 들이지 않고 그 세 개만 갖춘 window 를 세워 준다.
  async function register(pathname: string, overlayClose?: () => void) {
    back = vi.fn();
    vi.stubGlobal("window", {
      location: { pathname },
      history: { back },
    });

    vi.resetModules();
    if (overlayClose) {
      const { registerOverlay } = await import("@/shared/lib/overlayStack");
      registerOverlay(overlayClose);
    }

    const { initAppShell } = await import("@/shared/lib/native/appShell");
    await initAppShell({ navigate: () => {} });

    const call = addListener.mock.calls.find(([event]) => event === "backButton");
    handler = (call as unknown as [string, BackButtonHandler])[1];
  }

  beforeEach(() => {
    isNativePlatform.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("모달이 열려 있으면 모달만 닫고 화면은 그대로 둔다", async () => {
    // 홈에 떠 있는 모달이어도 종료되지 않아야 한다 — 뿌리 판정보다 먼저 와야 한다.
    const closeModal = vi.fn();
    await register("/home", closeModal);
    handler({ canGoBack: true });

    expect(closeModal).toHaveBeenCalledTimes(1);
    expect(back).not.toHaveBeenCalled();
    expect(exitApp).not.toHaveBeenCalled();
  });

  it.each(["/", "/home"])("뿌리 화면(%s)에서는 앱을 종료한다", async (pathname) => {
    // canGoBack 은 웹뷰 히스토리 기준이라 true 여도 우리 화면이 아닐 수 있다
    // (리다이렉트 로그인이 남긴 kauth.kakao.com 등).
    await register(pathname);
    handler({ canGoBack: true });

    expect(exitApp).toHaveBeenCalledTimes(1);
    expect(back).not.toHaveBeenCalled();
  });

  it("뿌리가 아닌 화면에서는 히스토리를 소비한다", async () => {
    await register("/chat/one-on-one/1");
    handler({ canGoBack: true });

    expect(back).toHaveBeenCalledTimes(1);
    expect(exitApp).not.toHaveBeenCalled();
  });

  it("돌아갈 히스토리가 없으면 앱을 종료한다", async () => {
    await register("/chat/one-on-one/1");
    handler({ canGoBack: false });

    expect(exitApp).toHaveBeenCalledTimes(1);
    expect(back).not.toHaveBeenCalled();
  });

  it("웹에서는 리스너를 아예 걸지 않는다", async () => {
    isNativePlatform.mockReturnValue(false);

    const { initAppShell } = await import("@/shared/lib/native/appShell");
    await initAppShell({ navigate: () => {} });

    expect(addListener).not.toHaveBeenCalled();
  });
});
