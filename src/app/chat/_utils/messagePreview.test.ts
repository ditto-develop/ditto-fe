import { describe, expect, it } from "vitest";

import { formatChatMessagePreview } from "./messagePreview";

describe("formatChatMessagePreview", () => {
  it("일반 텍스트는 그대로 둔다", () => {
    expect(formatChatMessagePreview("내일 몇 시에 만나요?")).toBe("내일 몇 시에 만나요?");
  });

  it("빈 값은 빈 문자열이다", () => {
    expect(formatChatMessagePreview(undefined)).toBe("");
    expect(formatChatMessagePreview(null)).toBe("");
    expect(formatChatMessagePreview("")).toBe("");
  });

  // 목록에 사건 코드가 그대로 노출되던 버그(2026-09-17). 방 안에서는 잘 나오는데
  // 목록만 원문을 흘려 "MEMBER_LEFT"가 보였다.
  it("그룹 이탈 코드를 문구로 바꾼다", () => {
    expect(formatChatMessagePreview("MEMBER_LEFT")).toBe("대화방에서 나갔어요.");
  });

  it("대화 종료·인원 부족 코드도 문구로 바꾼다", () => {
    expect(formatChatMessagePreview("USER_LEFT")).toBe("대화가 종료되었어요.");
    expect(formatChatMessagePreview("INSUFFICIENT_MEMBERS")).toBe(
      "인원이 부족해 대화가 종료되었어요.",
    );
  });

  it("투표 코드는 :voteId 접미를 떼고 문구로 바꾼다", () => {
    expect(formatChatMessagePreview("VOTE_CREATED:41")).toBe("투표가 생성되었습니다!");
    expect(formatChatMessagePreview("VOTE_CLOSED:41")).toBe("투표가 마감되었어요.");
  });

  it("투표 생성 JSON 페이로드도 같은 문구가 된다", () => {
    const payload = JSON.stringify({
      voteId: "41",
      placeSummary: { total: 2 },
      timeSummary: { total: 2 },
    });

    expect(formatChatMessagePreview(payload)).toBe("투표가 생성되었습니다!");
  });

  it("모르는 코드는 원문을 유지한다 — 빈 줄보다 낫다", () => {
    expect(formatChatMessagePreview("SOMETHING_NEW")).toBe("SOMETHING_NEW");
  });

  it("콜론이 있는 일반 텍스트를 코드로 오인하지 않는다", () => {
    expect(formatChatMessagePreview("약속: 7시")).toBe("약속: 7시");
  });
});
