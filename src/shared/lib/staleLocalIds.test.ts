import { describe, expect, it } from "vitest";

import { clearStaleLocalIds, STORAGE_EPOCH } from "@/shared/lib/staleLocalIds";

function memoryStorage(initial: Record<string, string>): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    key: (index) => [...map.keys()][index] ?? null,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    clear: () => map.clear(),
  };
}

describe("clearStaleLocalIds", () => {
  it("removes id-keyed records and keeps everything else", () => {
    const storage = memoryStorage({
      "ditto.hiddenChatRoomIds": '["3"]',
      "ditto.hiddenNotificationIds": '["9"]',
      "ditto.notificationBellSeenId.17": "120",
      "ditto:review:submitted": "{}",
      ditto_match_accepted_notif_4: "1",
      accessToken: "token",
      "ditto.keyboardInset": "300",
    });

    clearStaleLocalIds(storage);

    expect(storage.getItem("ditto.hiddenChatRoomIds")).toBeNull();
    expect(storage.getItem("ditto.hiddenNotificationIds")).toBeNull();
    expect(storage.getItem("ditto.notificationBellSeenId.17")).toBeNull();
    expect(storage.getItem("ditto:review:submitted")).toBeNull();
    expect(storage.getItem("ditto_match_accepted_notif_4")).toBeNull();
    expect(storage.getItem("accessToken")).toBe("token");
    expect(storage.getItem("ditto.keyboardInset")).toBe("300");
    expect(storage.getItem("ditto.storageEpoch")).toBe(STORAGE_EPOCH);
  });

  it("does nothing once the device has passed the current epoch", () => {
    const storage = memoryStorage({
      "ditto.storageEpoch": STORAGE_EPOCH,
      "ditto.notificationBellSeenId.17": "5",
    });

    clearStaleLocalIds(storage);

    // 초기화 뒤에 새로 적힌 기록은 지우면 안 된다.
    expect(storage.getItem("ditto.notificationBellSeenId.17")).toBe("5");
  });
});
