import { describe, expect, it } from "vitest";

import {
  deriveRoomState,
  getLastMessagePreview,
  getRoomEndedMessage,
  getSystemMessageText,
  isRoomEndedSystemMessage,
} from "./roomState";

// 금요일 00:00 개방 → 월요일 00:00 만료. 토요일 정오를 '진행 중' 기준 시각으로 쓴다.
const OPENS_AT = "2026-06-05 00:00:00";
const EXPIRES_AT = "2026-06-08 00:00:00";
const SATURDAY_NOON = new Date("2026-06-06T12:00:00").getTime();

describe("deriveRoomState", () => {
  it("진행 중인 방은 OPEN이다", () => {
    expect(
      deriveRoomState({ isEnded: false, opensAt: OPENS_AT, expiresAt: EXPIRES_AT }, SATURDAY_NOON),
    ).toBe("OPEN");
  });

  it("isEnded가 true면 만료 전이어도 ENDED다", () => {
    expect(
      deriveRoomState({ isEnded: true, opensAt: OPENS_AT, expiresAt: EXPIRES_AT }, SATURDAY_NOON),
    ).toBe("ENDED");
  });

  it("만료 시각이 지났으면 서버가 아직 마감을 안 돌렸어도 ENDED다", () => {
    const afterExpiry = new Date("2026-06-09T00:00:00").getTime();
    expect(
      deriveRoomState({ isEnded: false, opensAt: OPENS_AT, expiresAt: EXPIRES_AT }, afterExpiry),
    ).toBe("ENDED");
  });

  it("개방 전(금요일 전)에는 BEFORE_OPEN이다", () => {
    const wednesday = new Date("2026-06-03T12:00:00").getTime();
    expect(
      deriveRoomState({ isEnded: false, opensAt: OPENS_AT, expiresAt: EXPIRES_AT }, wednesday),
    ).toBe("BEFORE_OPEN");
  });

  it("개방 직후 1분은 서버가 아직 막고 있으므로 열지 않는다", () => {
    // 스케줄러가 1분 주기라 opensAt이 지나도 잠시 7005로 거절된다.
    const thirtySecondsAfter = new Date("2026-06-05T00:00:30").getTime();
    expect(
      deriveRoomState(
        { isEnded: false, opensAt: OPENS_AT, expiresAt: EXPIRES_AT },
        thirtySecondsAfter,
      ),
    ).toBe("BEFORE_OPEN");

    const twoMinutesAfter = new Date("2026-06-05T00:02:00").getTime();
    expect(
      deriveRoomState({ isEnded: false, opensAt: OPENS_AT, expiresAt: EXPIRES_AT }, twoMinutesAfter),
    ).toBe("OPEN");
  });

  it("어드민 시각 오버라이드로 서버가 CHATTING_PERIOD면 개방 전이어도 OPEN이다", () => {
    // opensAt은 오버라이드와 무관하게 실제 금요일 그대로 내려온다.
    // 클라 시계(수요일)만 보면 BEFORE_OPEN이지만 서버는 이미 대화 기간이다.
    const wednesday = new Date("2026-06-03T12:00:00").getTime();
    expect(
      deriveRoomState(
        { isEnded: false, opensAt: OPENS_AT, expiresAt: EXPIRES_AT },
        wednesday,
        "CHATTING_PERIOD",
      ),
    ).toBe("OPEN");
  });

  it("서버가 대화 기간이 아니면 오버라이드로 열지 않는다", () => {
    const wednesday = new Date("2026-06-03T12:00:00").getTime();
    expect(
      deriveRoomState(
        { isEnded: false, opensAt: OPENS_AT, expiresAt: EXPIRES_AT },
        wednesday,
        "QUIZ_PERIOD",
      ),
    ).toBe("BEFORE_OPEN");
  });

  it("개방 직후 1분은 서버가 CHATTING_PERIOD여도 스케줄러를 기다린다", () => {
    // 자연스러운 금요일 전환에서는 기간도 CHATTING_PERIOD다. 이때까지 열어 버리면
    // 서버가 아직 7005로 막고 있어 보낸 메시지가 조용히 사라진다.
    const thirtySecondsAfter = new Date("2026-06-05T00:00:30").getTime();
    expect(
      deriveRoomState(
        { isEnded: false, opensAt: OPENS_AT, expiresAt: EXPIRES_AT },
        thirtySecondsAfter,
        "CHATTING_PERIOD",
      ),
    ).toBe("BEFORE_OPEN");
  });

  it("만료된 방은 오버라이드로도 되살아나지 않는다", () => {
    const afterExpiry = new Date("2026-06-09T00:00:00").getTime();
    expect(
      deriveRoomState(
        { isEnded: false, opensAt: OPENS_AT, expiresAt: EXPIRES_AT },
        afterExpiry,
        "CHATTING_PERIOD",
      ),
    ).toBe("ENDED");
  });

  it("시각 정보가 없으면 OPEN으로 둔다(입력을 막지 않는다)", () => {
    expect(deriveRoomState({ isEnded: false, opensAt: null, expiresAt: null })).toBe("OPEN");
  });
});

describe("getRoomEndedMessage", () => {
  it("사용자 종료와 기한 만료를 구분한다", () => {
    expect(getRoomEndedMessage({ endedReason: "USER_ENDED" })).toContain("대화가 종료");
    expect(getRoomEndedMessage({ endedReason: "EXPIRED" })).toContain("대화 기간이 끝나");
  });
});

describe("getSystemMessageText", () => {
  it("보는 사람에 따라 문구가 갈린다", () => {
    expect(getSystemMessageText({ content: "USER_LEFT" }, true)).toBe("채팅을 종료했습니다.");
    expect(getSystemMessageText({ content: "USER_LEFT" }, false)).toBe(
      "상대방이 채팅을 종료했습니다.",
    );
  });

  it("모르는 코드는 그리지 않는다", () => {
    expect(getSystemMessageText({ content: "SOMETHING_NEW" }, false)).toBeNull();
  });

  it("기존 평문 종료 메시지도 그대로 표시한다", () => {
    expect(
      getSystemMessageText({ content: "상대방이 채팅을 종료했습니다." }, false),
    ).toBe("상대방이 채팅을 종료했습니다.");
  });
});

describe("isRoomEndedSystemMessage", () => {
  it("이벤트 코드와 기존 평문 종료 메시지를 모두 감지한다", () => {
    expect(isRoomEndedSystemMessage({ messageType: "SYSTEM", content: "USER_LEFT" })).toBe(true);
    expect(
      isRoomEndedSystemMessage({
        messageType: "SYSTEM",
        content: "상대방이 채팅을 종료했습니다.",
      }),
    ).toBe(true);
  });

  it("일반 메시지와 모르는 시스템 이벤트는 종료로 보지 않는다", () => {
    expect(isRoomEndedSystemMessage({ messageType: "TEXT", content: "USER_LEFT" })).toBe(false);
    expect(isRoomEndedSystemMessage({ messageType: "SYSTEM", content: "SOMETHING_NEW" })).toBe(
      false,
    );
  });
});

describe("getLastMessagePreview", () => {
  it("IMAGE는 objectKey 대신 안내 문구를 쓴다", () => {
    expect(
      getLastMessagePreview({
        lastMessage: {
          id: 1,
          roomId: 1,
          senderId: 2,
          messageType: "IMAGE",
          content: "chat/1/object-key",
          imageUrl: "https://example.com/a.png",
          createdAt: "2026-06-06 12:00:00",
        },
      }),
    ).toBe("사진을 보냈어요.");
  });

  it("메시지가 없으면 undefined다", () => {
    expect(getLastMessagePreview({ lastMessage: null })).toBeUndefined();
  });
});
