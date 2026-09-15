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

  it("쿼리·해시는 떼고 비교한다", () => {
    expect(isViewingDeepLink("/chat/group/7/?from=push", "/chat/group/7")).toBe(true);
  });

  it("다른 방이면 false — 띄워야 한다", () => {
    expect(isViewingDeepLink("/chat/one-on-one/13/", "/chat/one-on-one/12")).toBe(false);
    expect(isViewingDeepLink("/chat/group/12/", "/chat/one-on-one/12")).toBe(false);
  });

  it("딥링크를 모르면 false — 안 띄워서 놓치는 쪽이 더 나쁘다", () => {
    expect(isViewingDeepLink(null, "/chat/one-on-one/12")).toBe(false);
  });
});
