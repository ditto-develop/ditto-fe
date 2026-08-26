import { describe, expect, it } from "vitest";

import { toInternalPath } from "@/shared/lib/native/appShell";

/**
 * 딥링크 정규화. 푸시 알림 payload와 유니버설 링크가 이 함수를 통과해
 * Next 라우터로 들어가므로, 외부 URL이 통과하면 앱이 임의 페이지로 끌려간다.
 */
describe("toInternalPath", () => {
  it.each([
    ["/chat/one-on-one/12/", "/chat/one-on-one/12/"],
    ["https://ditto.pics/profile/8/", "/profile/8/"],
    ["https://www.ditto.pics/home/", "/home/"],
    ["https://test.ditto.pics/quiz/3/", "/quiz/3/"],
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
    "javascript:alert(1)",
    "",
  ])("외부·비정상 URL %s 은 거부한다", (input) => {
    expect(toInternalPath(input)).toBeNull();
  });
});
