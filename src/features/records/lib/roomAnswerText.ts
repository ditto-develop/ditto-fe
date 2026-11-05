import type {
  PairQuizCardContent,
  QuizCardChoice,
  QuizHintContent,
} from "@/features/chat/model/types";
import type { RoomQuizMember } from "@/features/records/model/types";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";

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

/**
 * 머리 카드 원 안의 이름 — 앞 두 글자("사부작사부작" → "사부"). Figma 3257:53374 · 3258:54036.
 * 나는 서버가 준 닉네임과 상관없이 "나" 다.
 */
export function avatarLabel(member: RoomQuizMember): string {
  if (member.isMe) return "나";
  return Array.from(member.nickname).slice(0, 2).join("");
}

/* ────────────────────────── 첫 대화 힌트(QUIZ_HINT) ────────────────────────── */

/** 문항에 대화 힌트 질문이 없을 때(IMP-1 FE-3). */
export const DEFAULT_HINT_QUESTION = "왜 이 답을 골랐는지 서로 이야기해보세요.";

export type HintSentence = {
  /** 답 앞부분("두 분 모두 "). 답이 없는 문장은 이것 하나가 전부다. */
  lead: string;
  /** 굵게 칠할 함께 고른 답. DIFFERENT·SPLIT 은 null. */
  answer: string | null;
  /** 답 뒷부분("를 골랐어요."). */
  tail: string;
  /** 이어서 던질 질문 — 문항의 대화 힌트 질문, 없으면 공통 문구. */
  follow: string;
};

/**
 * 힌트 문장. 서버는 문장이 아니라 재료(kind·문항·답·힌트 질문)만 준다.
 * TODO(IMP-1): 기획서 CH-01 확정 문구로 맞춘다 — 지금은 위키 FE-3 의 재료로 만든 임시 문구다.
 */
export function describeHint(hint: QuizHintContent): HintSentence {
  const follow = hint.hintQuestion ?? DEFAULT_HINT_QUESTION;
  switch (hint.kind) {
    case "SAME":
      return hint.answer
        ? { lead: "두 분 모두 ", answer: hint.answer, tail: `${objectParticle(hint.answer)} 골랐어요.`, follow }
        : { lead: "두 분이 같은 답을 골랐어요.", answer: null, tail: "", follow };
    case "UNANIMOUS":
      return hint.answer
        ? { lead: "다 같이 ", answer: hint.answer, tail: `${objectParticle(hint.answer)} 골랐어요.`, follow }
        : { lead: "모두 같은 답을 골랐어요.", answer: null, tail: "", follow };
    case "DIFFERENT":
      return { lead: "두 분의 답이 갈렸어요.", answer: null, tail: "", follow };
    case "SPLIT":
      return { lead: "의견이 반반 갈렸어요.", answer: null, tail: "", follow };
  }
}

/* ────────────────────────── 질문 카드 칩 ────────────────────────── */

export type QuizChip = {
  key: string;
  label: string;
  /** `mine` 은 밝은 칩(나), `other` 는 어두운 칩(상대). Figma 3256:52697 · 3256:52759. */
  tone: "mine" | "other";
};

type PairChoiceInput = {
  choices: Array<{ choiceId: number; content: string }>;
  myChoiceId: number | null;
  peerChoiceId: number | null;
};

/**
 * 1:1 칩 — "나 · 노을빛" / "사부작사부작 · 하늘빛"(나 먼저). 같은 답이면 "둘 다 노을빛" 하나(IMP-1 FE-7).
 */
export function pairChips({ choices, myChoiceId, peerChoiceId }: PairChoiceInput, partnerName: string): QuizChip[] {
  const mine = choices.find((choice) => choice.choiceId === myChoiceId) ?? null;
  const theirs = choices.find((choice) => choice.choiceId === peerChoiceId) ?? null;
  if (mine && theirs && mine.choiceId === theirs.choiceId) {
    return [{ key: `both-${mine.choiceId}`, label: `둘 다 ${mine.content}`, tone: "mine" }];
  }
  return [
    mine ? { key: `me-${mine.choiceId}`, label: `나 · ${mine.content}`, tone: "mine" as const } : null,
    theirs
      ? { key: `peer-${theirs.choiceId}`, label: `${partnerName} · ${theirs.content}`, tone: "other" as const }
      : null,
  ].filter((chip): chip is QuizChip => chip !== null);
}

/**
 * 1:1 카드는 보낸 사람 기준(`senderChoiceId`)으로 온다. 내가 보낸 카드면 그대로, 상대가 보낸 카드면
 * 두 선택을 맞바꿔 "나" 를 정한다.
 */
export function pairCardChips(
  card: PairQuizCardContent,
  sentByMe: boolean,
  partnerName: string,
): QuizChip[] {
  return pairChips(
    {
      choices: card.choices,
      myChoiceId: sentByMe ? card.senderChoiceId : card.peerChoiceId,
      peerChoiceId: sentByMe ? card.peerChoiceId : card.senderChoiceId,
    },
    partnerName,
  );
}

type CountedChoice = Pick<QuizCardChoice, "choiceId" | "content"> & { count?: number };

/**
 * 그룹 칩 — "열린 결말 2명". 누가 골랐는지는 숨긴다. 내 선택지를 알면(담기 미리보기) 그 칩만 밝게,
 * 모르면(올라온 카드 — 서버가 내 선택을 싣지 않는다) 모두 밝게 둔다.
 */
export function groupChips(choices: CountedChoice[], myChoiceId?: number | null): QuizChip[] {
  return choices
    .filter((choice) => (choice.count ?? 0) > 0)
    .map((choice) => ({
      key: String(choice.choiceId),
      label: `${choice.content} ${choice.count ?? 0}명`,
      tone: myChoiceId == null || choice.choiceId === myChoiceId ? ("mine" as const) : ("other" as const),
    }));
}

/** 모두 같은 답을 골랐으면 그 선택지와 인원. 그룹 카드가 "4명 모두 '끝까지 본다'" 로 바뀐다(Figma 3273:37774). */
export function unanimousGroupChoice(
  choices: CountedChoice[],
): { content: string; count: number } | null {
  const picked = choices.filter((choice) => (choice.count ?? 0) > 0);
  const total = picked.reduce((sum, choice) => sum + (choice.count ?? 0), 0);
  return picked.length === 1 && total > 1 ? { content: picked[0].content, count: total } : null;
}

/* ────────────────────────── 보내기 버튼 ────────────────────────── */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 그 날짜가 든 월~일 주의 월요일(로컬 자정). */
function mondayOf(date: Date): number {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday.getTime();
}

/**
 * 채팅이 열리기 전 딤드 버튼 문구(IMP-1 FE-4). 이번 주면 "금요일 0시부터 보낼 수 있어요",
 * 그 뒤 주(재매칭)면 "11월 13일(금) 0시부터 보낼 수 있어요". 보낼 수 있는지는 서버 `canSendCard` 가
 * 정하고, 이 함수는 문구만 만든다(그래서 기기 시계를 써도 된다).
 */
export function formatSendOpensAt(chatOpensAt: string, now: Date = new Date()): string {
  const opens = parseServerDateTime(chatOpensAt);
  if (!opens) return "채팅이 열리면 보낼 수 있어요";
  const minutes = opens.getMinutes();
  const clock = `${opens.getHours()}시${minutes ? ` ${minutes}분` : ""}`;
  const weekday = WEEKDAYS[opens.getDay()];
  const day =
    mondayOf(opens) === mondayOf(now)
      ? `${weekday}요일`
      : `${opens.getMonth() + 1}월 ${opens.getDate()}일(${weekday})`;
  return `${day} ${clock}부터 보낼 수 있어요`;
}
