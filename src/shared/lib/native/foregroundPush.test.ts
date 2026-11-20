import { describe, expect, it } from "vitest";

import { isViewingDeepLink } from "@/shared/lib/native/pushNotifications";

/**
 * 포그라운드 푸시를 로컬 알림으로 다시 그릴 때, 이미 그 화면을 보고 있으면 띄우지 않는다.
 * 딥링크는 정적 export 라 끝 슬래시가 붙어 오고(`/chat/one-on-one/12/`), 쿼리가 달릴 수도 있다.
 */
describe("isViewingDeepLink", () => {
  it("같은 방을 보고 있으면 true — 끝 슬래시 차이는 무시한다", () => {
    expect(isViewingDeepLink("/chat/one-on-one/12/", "/chat/one-on-one/12")).toBe(true);
    expect(isViewingDeepLink("/chat/one-on-one/12", "/chat/one-on-one/12/")).toBe(true);
  });

  it("해시와 지금 URL 에만 있는 쿼리는 무시한다", () => {
    expect(isViewingDeepLink("/chat/group/7/#latest", "/chat/group/7")).toBe(true);
    expect(isViewingDeepLink("/chat/group/7/", "/chat/group/7?member=3")).toBe(true);
  });

  it("딥링크 쿼리는 지금 URL 에도 같은 값이 있어야 같은 화면이다", () => {
    expect(isViewingDeepLink("/matching/?tab=accept", "/matching/?tab=accept")).toBe(true);
    expect(isViewingDeepLink("/matching/?tab=accept", "/matching/?tab=request")).toBe(false);
    expect(isViewingDeepLink("/matching/?tab=accept", "/matching/")).toBe(false);
  });

  it("다른 방이면 false — 띄워야 한다", () => {
    expect(isViewingDeepLink("/chat/one-on-one/13/", "/chat/one-on-one/12")).toBe(false);
    expect(isViewingDeepLink("/chat/group/12/", "/chat/one-on-one/12")).toBe(false);
  });

  it("딥링크를 모르면 false — 안 띄워서 놓치는 쪽이 더 나쁘다", () => {
    expect(isViewingDeepLink(null, "/chat/one-on-one/12")).toBe(false);
  });
});
