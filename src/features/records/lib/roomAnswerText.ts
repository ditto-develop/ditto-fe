import type { RoomAnswersSummary } from "@/features/records/lib/roomAnswers";
import type { ChatQuizCard, RoomQuizMember } from "@/features/records/model/types";

/*
 * 대화방 "우리의 답변" 문구. 선택지·닉네임이 서버 값이라 조사(을/를, 은/는)를 FE 가 붙인다.
 */

/** 받침이 있는 숫자 끝소리 — 0(영) 1(일) 3(삼) 6(육) 7(칠) 8(팔). */
const DIGITS_WITH_FINAL = new Set(["0", "1", "3", "6", "7", "8"]);

/**
 * 마지막 글자에 받침이 있는지. 한글 음절과 숫자만 판정하고, 그 밖(영문·기호)은 받침 없음으로 본다
 * — "를/는" 쪽이 틀려도 덜 어색하다.
 */
export function hasFinalConsonant(word: string): boolean {
  const last = Array.from(word.trim()).pop();
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  return DIGITS_WITH_FINAL.has(last);
}

/** "새벽 2시" → "를", "열린 결말" → "을". */
export function objectParticle(word: string): "을" | "를" {
  return hasFinalConsonant(word) ? "을" : "를";
}

/** "새벽 2시" → "는", "열린 결말" → "은". */
export function topicParticle(word: string): "은" | "는" {
  return hasFinalConsonant(word) ? "은" : "는";
}

const NATIVE_COUNTS = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];

/** "두 분", "네 분". 첫 대화 힌트의 주어다(Figma 3256:51233 · 3270:36280). */
export function peopleHonorific(count: number): string {
  return `${NATIVE_COUNTS[count] ?? count} 분`;
}

/**
 * 머리 카드 원 안의 이름 — 앞 두 글자("사부작사부작" → "사부"). Figma 3257:53374 · 3258:54036.
 * 나는 서버가 준 닉네임과 상관없이 "나" 다.
 */
export function avatarLabel(member: RoomQuizMember): string {
  if (member.isMe) return "나";
  return Array.from(member.nickname).slice(0, 2).join("");
}

/** 요약 바 문구. 1:1 "같은 답 7 · 다른 답 5", 그룹 "다 같은 답 4 · 반반 2"(Figma 3256:51203 · 3270:34677). */
export function formatAnswersSummary(summary: RoomAnswersSummary): string {
  if (summary.kind === "ONE_ON_ONE") {
    return `같은 답 ${summary.same} · 다른 답 ${summary.different}`;
  }
  return `다 같은 답 ${summary.allSame} · 반반 ${summary.split}`;
}

export type QuizChip = {
  key: string;
  label: string;
  /** `mine` 은 밝은 칩(나), `other` 는 어두운 칩(상대). Figma 3256:52697 · 3256:52759. */
  tone: "mine" | "other";
};

type ChipChoice = ChatQuizCard["choices"][number];

/**
 * 문항 카드의 칩. 뷰어 기준이라 같은 카드도 보는 사람마다 "나" 가 다르다.
 *
 * - 1:1(`memberIds` 있음): "나 · 노을빛" / "사부작사부작 · 하늘빛". 고른 사람 순서 = 나 먼저.
 * - 그룹(`memberIds` null): "열린 결말 2명" — 누가 골랐는지는 숨긴다. 내 선택지를 알면(테스터
 *   모드에서 방 답변을 읽은 경우) 그 칩만 밝게, 모르면 모두 밝게 둔다.
 */
export function toQuizChips(
  choices: ChipChoice[],
  options: { myUserId: number | null; nameOf: (memberId: number) => string; myChoiceId?: number | null },
): QuizChip[] {
  const { myUserId, nameOf, myChoiceId } = options;
  const picked = choices.filter((choice) => choice.memberCount > 0);

  if (picked.every((choice) => choice.memberIds !== null)) {
    const entries = picked.flatMap((choice) =>
      (choice.memberIds ?? []).map((memberId) => ({ memberId, choice })),
    );
    entries.sort((a, b) => Number(b.memberId === myUserId) - Number(a.memberId === myUserId));
    return entries.map(({ memberId, choice }) => {
      const isMe = memberId === myUserId;
      return {
        key: `${choice.choiceId}-${memberId}`,
        label: `${isMe ? "나" : nameOf(memberId)} · ${choice.content}`,
        tone: isMe ? "mine" : "other",
      };
    });
  }

  return picked.map((choice) => ({
    key: String(choice.choiceId),
    label: `${choice.content} ${choice.memberCount}명`,
    tone: myChoiceId == null || choice.choiceId === myChoiceId ? "mine" : "other",
  }));
}

/** 모두 같은 답을 골랐으면 그 선택지. 문항 카드가 "4명 모두 '끝까지 본다'" 로 바뀐다(Figma 3273:37774). */
export function unanimousChoice(choices: ChipChoice[]): ChipChoice | null {
  const picked = choices.filter((choice) => choice.memberCount > 0);
  const total = picked.reduce((sum, choice) => sum + choice.memberCount, 0);
  return picked.length === 1 && total > 1 ? picked[0] : null;
}
