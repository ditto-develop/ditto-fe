import { afterEach, describe, expect, it, vi } from "vitest";

import { createFeedback, uploadFeedbackScreenshots } from "@/features/feedback/api/feedbackApi";

const externalApiFetch = vi.fn<(path: string, init?: unknown) => Promise<unknown>>(
  async () => null,
);
vi.mock("@/shared/lib/api/externalClient", () => ({
  externalApiFetch: (path: string, init?: unknown) => externalApiFetch(path, init),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

/** 계약 정본은 BE 위키 `Frontend-Feedback-Guide` 다. */
describe("uploadFeedbackScreenshots", () => {
  it("스크린샷이 없으면 아무것도 부르지 않는다", async () => {
    expect(await uploadFeedbackScreenshots([])).toEqual([]);
    expect(externalApiFetch).not.toHaveBeenCalled();
  });

  /**
   * S3 는 Content-Type·크기가 발급 요청과 다르면 403 을 준다. 인증 헤더를 붙여도 거부한다.
   * objectKey 는 가공하지 않고 발급 순서대로 접수에 싣는다.
   */
  it("의견 전용 경로로 발급받고, 같은 타입으로 S3 에 PUT 한 뒤 objectKey 를 순서대로 돌려준다", async () => {
    const put = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", put);
    externalApiFetch.mockResolvedValueOnce({
      uploads: [
        { objectKey: "pending/feedbacks/12/a", uploadUrl: "https://s3.example/a" },
        { objectKey: "pending/feedbacks/12/b", uploadUrl: "https://s3.example/b" },
      ],
    });
    const png = new File(["png-bytes"], "a.png", { type: "image/png" });
    const jpg = new File(["jpeg"], "b.jpg", { type: "image/jpeg" });

    const keys = await uploadFeedbackScreenshots([png, jpg]);

    expect(externalApiFetch).toHaveBeenCalledWith("/api/v1/feedbacks/image-upload-urls", {
      method: "POST",
      body: {
        files: [
          { contentType: "image/png", contentLength: png.size },
          { contentType: "image/jpeg", contentLength: jpg.size },
        ],
      },
    });
    expect(put).toHaveBeenCalledWith("https://s3.example/a", {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: png,
    });
    expect(keys).toEqual(["pending/feedbacks/12/a", "pending/feedbacks/12/b"]);
  });

  it("한 장이라도 S3 업로드가 실패하면 전체를 실패로 본다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 403 })));
    externalApiFetch.mockResolvedValueOnce({
      uploads: [{ objectKey: "pending/feedbacks/12/a", uploadUrl: "https://s3.example/a" }],
    });

    await expect(
      uploadFeedbackScreenshots([new File(["x"], "a.png", { type: "image/png" })]),
    ).rejects.toThrow();
  });
});

describe("createFeedback", () => {
  it("내용·유형·기기 정보·imageKeys 를 그대로 보낸다", async () => {
    externalApiFetch.mockResolvedValueOnce({ id: 51 });
    const body = {
      type: "bug" as const,
      content: "채팅방에서 사진을 보내면 회색 화면만 보여요.",
      appVersion: "1.0.0 (6)",
      os: "iOS 18.2",
      deviceModel: "iPhone",
      imageKeys: ["pending/feedbacks/12/a"],
    };

    expect(await createFeedback(body)).toEqual({ id: 51 });
    expect(externalApiFetch).toHaveBeenCalledWith("/api/v1/feedbacks", { method: "POST", body });
  });
});
