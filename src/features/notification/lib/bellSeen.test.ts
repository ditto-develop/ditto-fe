import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  hasNewUnreadSince,
  healBellSeen,
  markBellSeen,
  newestNotificationId,
  readBellSeenId,
} from "@/features/notification/lib/bellSeen";
import type { NotificationItem } from "@/features/notification/model/types";

/** node 환경이라 window 가 없다. 이 모듈이 쓰는 것은 localStorage 뿐이다. */
function createFakeWindow() {
  const entries = new Map<string, string>();
  return {
    localStorage: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => void entries.set(key, value),
      removeItem: (key: string) => void entries.delete(key),
    },
  };
}

/** 서명 없는 테스트용 JWT. getMyMemberId 는 payload 의 sub 만 읽는다. */
function fakeAccessToken(memberId: number): string {
  return `x.${btoa(JSON.stringify({ sub: String(memberId) }))}.y`;
}

function notification(id: number, read: boolean): NotificationItem {
  return {
    id,
    type: "SYSTEM_NOTICE",
    category: "SYSTEM",
    title: `알림 ${id}`,
    body: null,
    targetId: null,
    deepLink: null,
    readAt: read ? "2026-10-26 10:00:00" : null,
    createdAt: "2026-10-26 09:00:00",
  };
}

beforeEach(() => {
  const fakeWindow = createFakeWindow();
  vi.stubGlobal("window", fakeWindow);
  // auth.ts(getMyMemberId)는 window 를 거치지 않고 전역 localStorage 를 읽는다.
  vi.stubGlobal("localStorage", fakeWindow.localStorage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("hasNewUnreadSince", () => {
  const items = [notification(30, false), notification(20, true), notification(10, false)];

  it("본 뒤에 온 안 읽은 알림이 있으면 점을 띄운다", () => {
    expect(hasNewUnreadSince(items, 25)).toBe(true);
  });

  /** 벨을 누른 뒤에는 안 읽은 알림이 남아 있어도 점이 사라져야 한다(QA 2026-10-26). */
  it("이미 본 알림은 안 읽었어도 점을 띄우지 않는다", () => {
    expect(hasNewUnreadSince(items, 30)).toBe(false);
  });

  it("본 뒤에 온 알림을 이미 읽었으면 점을 띄우지 않는다", () => {
    expect(hasNewUnreadSince([notification(40, true)], 30)).toBe(false);
  });
});

describe("newestNotificationId", () => {
  it("가장 큰 id 를 돌려주고 목록이 비면 0 이다", () => {
    expect(newestNotificationId([notification(10, false), notification(30, true)])).toBe(30);
    expect(newestNotificationId([])).toBe(0);
  });
});

describe("markBellSeen", () => {
  it("본 위치를 저장하고 더 작은 값으로는 되돌리지 않는다", () => {
    expect(readBellSeenId()).toBe(0);

    markBellSeen(30);
    markBellSeen(20);

    expect(readBellSeenId()).toBe(30);
  });

  /** 알림 id 는 회원 사이에 공유되는 번호라, 앞 계정의 값이 다음 계정의 알림을 가리면 안 된다. */
  it("계정마다 따로 저장한다", () => {
    window.localStorage.setItem("accessToken", fakeAccessToken(7));
    markBellSeen(30);

    window.localStorage.setItem("accessToken", fakeAccessToken(8));
    expect(readBellSeenId()).toBe(0);
  });

  describe("healBellSeen", () => {
    it("pulls a value left over from before a DB reset down to the newest real id", () => {
      // id 가 1부터 다시 매겨지면 옛 값(500)이 새 알림(3)을 모두 "본 것"으로 가린다.
      markBellSeen(500);

      healBellSeen(3);

      expect(readBellSeenId()).toBe(3);
      expect(hasNewUnreadSince([notification(4, false)], readBellSeenId())).toBe(true);
    });

    it("never raises the value", () => {
      markBellSeen(10);

      healBellSeen(20);

      expect(readBellSeenId()).toBe(10);
    });
  });
});
