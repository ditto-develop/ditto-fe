import { describe, expect, it } from "vitest";

import { NOTIFY_SETTINGS_GUIDE, resolveNotifyPrompt } from "@/features/settings/model/notifyPrompt";

describe("resolveNotifyPrompt", () => {
  it("OS 권한을 읽기 전에는 띄우지 않는다", () => {
    expect(
      resolveNotifyPrompt({ serverMatching: false, osPermission: null, canOpenSettings: true }),
    ).toEqual({ show: false });
  });

  it.each([true, false, null])(
    "OS 거절 + 설정 열기 가능이면 서버 설정(%s)과 무관하게 설정 앱으로 보낸다",
    (serverMatching) => {
      const prompt = resolveNotifyPrompt({ serverMatching, osPermission: "denied", canOpenSettings: true });
      expect(prompt).toMatchObject({ show: true, action: "settings", buttonLabel: "설정에서 알림 켜기" });
    },
  );

  it("OS 거절인데 옛 앱이라 설정을 못 열면 문구로 안내한다", () => {
    const prompt = resolveNotifyPrompt({ serverMatching: true, osPermission: "denied", canOpenSettings: false });
    expect(prompt).toMatchObject({ show: true, action: "guide", caption: NOTIFY_SETTINGS_GUIDE });
  });

  it("아직 안 물었으면 시스템 창을 띄운다", () => {
    const prompt = resolveNotifyPrompt({ serverMatching: true, osPermission: "prompt", canOpenSettings: true });
    expect(prompt).toMatchObject({ show: true, action: "request", caption: null });
  });

  it.each(["granted", "unsupported"] as const)("OS %s 면 서버 설정이 꺼졌을 때만 띄운다", (osPermission) => {
    expect(resolveNotifyPrompt({ serverMatching: false, osPermission, canOpenSettings: true })).toMatchObject({
      show: true,
      action: "enable",
    });
    expect(resolveNotifyPrompt({ serverMatching: true, osPermission, canOpenSettings: true })).toEqual({
      show: false,
    });
    expect(resolveNotifyPrompt({ serverMatching: null, osPermission, canOpenSettings: true })).toEqual({
      show: false,
    });
  });
});
