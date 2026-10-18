import { describe, expect, it } from "vitest";

import { avatarImageUrl, toAvatarImageUrl } from "@/shared/lib/avatar";

describe("toAvatarImageUrl", () => {
  /** 가입이 보내던 옛 그림 세트. 번호는 같지만 그림이 달라 고른 것과 다른 사진이 떴다. */
  it("가입 때 저장된 옛 svg 주소를 같은 번호의 지금 그림으로 바꾼다", () => {
    expect(toAvatarImageUrl("/onboarding/profileimg/avatar/m3.svg")).toBe("/assets/avatar/m3.webp");
    expect(toAvatarImageUrl("/onboarding/profileimg/avatar/f8.svg")).toBe("/assets/avatar/f8.webp");
  });

  it("예전 프로필 수정이 저장한 png 주소도 webp 로 맞춘다", () => {
    expect(toAvatarImageUrl("/assets/avatar/m5.png")).toBe("/assets/avatar/m5.webp");
  });

  it("도메인이 붙은 주소도 같은 규칙으로 바꾼다", () => {
    expect(toAvatarImageUrl("https://ditto.pics/onboarding/profileimg/avatar/m1.svg")).toBe("/assets/avatar/m1.webp");
  });

  it("지금 주소·캐리커쳐가 아닌 주소·빈 값은 그대로 둔다", () => {
    expect(toAvatarImageUrl("/assets/avatar/m2.webp")).toBe("/assets/avatar/m2.webp");
    expect(toAvatarImageUrl("https://cdn.example.com/photo.png")).toBe("https://cdn.example.com/photo.png");
    expect(toAvatarImageUrl("/assets/avatar/m9.svg")).toBe("/assets/avatar/m9.svg");
    expect(toAvatarImageUrl(null)).toBeNull();
    expect(toAvatarImageUrl(undefined)).toBeUndefined();
  });
});

describe("avatarImageUrl", () => {
  it("고른 캐리커쳐 id 를 지금 그림 주소로 만든다", () => {
    expect(avatarImageUrl("f4")).toBe("/assets/avatar/f4.webp");
  });
});
