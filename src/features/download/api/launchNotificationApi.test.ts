import { afterEach, describe, expect, it, vi } from "vitest";

import { requestLaunchNotification } from "@/features/download/api/launchNotificationApi";
import { LAUNCH_NOTIFICATION_CONSENT_VERSION } from "@/features/download/model/launchNotification";

const externalApiFetch = vi.fn<(path: string, init?: unknown) => Promise<unknown>>(
  async () => null,
);
vi.mock("@/shared/lib/api/externalClient", () => ({
  externalApiFetch: (path: string, init?: unknown) => externalApiFetch(path, init),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("requestLaunchNotification", () => {
  it("동의 여부와 동의 문구 버전을 함께 보내고, 이메일 앞뒤 공백은 뺀다", async () => {
    await requestLaunchNotification("  user@example.com ");

    expect(externalApiFetch).toHaveBeenCalledWith("/api/v1/launch-notification-requests", {
      method: "POST",
      body: {
        email: "user@example.com",
        platform: "ANDROID",
        privacyConsent: true,
        consentVersion: LAUNCH_NOTIFICATION_CONSENT_VERSION,
      },
    });
  });
});
