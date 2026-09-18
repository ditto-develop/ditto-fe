import { afterEach, describe, expect, it, vi } from "vitest";

import { clearChatImageUrlCache, stabilizeChatImageUrl } from "./chatImageUrlCache";

const HOST = "https://ditto-bucket.s3.ap-northeast-2.amazonaws.com";

/** 서명 시각과 유효 기간을 지정한 presigned URL. nonce 로 매번 다른 서명을 흉내낸다. */
function presigned(objectKey: string, signedAt: string, expiresIn: number, nonce: string): string {
  return (
    `${HOST}/${objectKey}?X-Amz-Algorithm=AWS4-HMAC-SHA256` +
    `&X-Amz-Date=${signedAt}&X-Amz-Expires=${expiresIn}&X-Amz-Signature=${nonce}`
  );
}

afterEach(() => {
  clearChatImageUrlCache();
  vi.useRealTimers();
});

describe("stabilizeChatImageUrl", () => {
  it("같은 objectKey 에는 처음 받은 URL 을 계속 돌려준다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-18T00:00:00Z"));

    const first = presigned("rooms/1/a.jpg", "20260918T000000Z", 3600, "sig-1");
    const second = presigned("rooms/1/a.jpg", "20260918T001000Z", 3600, "sig-2");

    expect(stabilizeChatImageUrl("rooms/1/a.jpg", first)).toBe(first);
    // 서버가 새 서명을 줬지만 브라우저 캐시를 살리려고 옛 URL 을 유지한다.
    expect(stabilizeChatImageUrl("rooms/1/a.jpg", second)).toBe(first);
  });

  it("objectKey 가 다르면 서로 영향을 주지 않는다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-18T00:00:00Z"));

    const a = presigned("rooms/1/a.jpg", "20260918T000000Z", 3600, "sig-a");
    const b = presigned("rooms/1/b.jpg", "20260918T000000Z", 3600, "sig-b");

    expect(stabilizeChatImageUrl("rooms/1/a.jpg", a)).toBe(a);
    expect(stabilizeChatImageUrl("rooms/1/b.jpg", b)).toBe(b);
  });

  it("서명이 만료에 가까워지면 새 URL 로 갈아탄다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-18T00:00:00Z"));

    const first = presigned("rooms/1/a.jpg", "20260918T000000Z", 300, "sig-1");
    expect(stabilizeChatImageUrl("rooms/1/a.jpg", first)).toBe(first);

    // 만료 1분 전(= SAFETY_MARGIN_MS)에 닿으면 붙잡아 두지 않는다.
    vi.setSystemTime(new Date("2026-09-18T00:04:30Z"));
    const second = presigned("rooms/1/a.jpg", "20260918T000430Z", 300, "sig-2");
    expect(stabilizeChatImageUrl("rooms/1/a.jpg", second)).toBe(second);
  });

  it("서명 파라미터가 없는 URL 은 캐시하지 않는다", () => {
    const plain = `${HOST}/rooms/1/a.jpg`;
    const other = `${HOST}/rooms/1/a.jpg?v=2`;

    expect(stabilizeChatImageUrl("rooms/1/a.jpg", plain)).toBe(plain);
    expect(stabilizeChatImageUrl("rooms/1/a.jpg", other)).toBe(other);
  });

  it("URL 이 없으면 그대로 돌려준다", () => {
    expect(stabilizeChatImageUrl("rooms/1/a.jpg", null)).toBeNull();
    expect(stabilizeChatImageUrl("", "https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
  });
});
