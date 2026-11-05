import type {
  ChatMessage,
  PairQuizCardContent,
  QuizCardChoice,
  QuizCardContent,
  QuizHintContent,
  QuizHintKind,
} from "@/features/chat/model/types";

/*
 * 8.1 퀴즈 메시지(`QUIZ_HINT`·`QUIZ_CARD`) content 읽기. 서버가 JSON 문자열로 싣는다
 * (서버 docs/domains/chat.md "퀴즈 메시지"). 모양이 어긋나면 null — 화면은 그 메시지를 조용히 건너뛴다.
 * JSON 원문을 말풍선에 그대로 보이면 안 된다.
 */

const HINT_KINDS: readonly QuizHintKind[] = ["SAME", "DIFFERENT", "UNANIMOUS", "SPLIT"];

function parseObject(content: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(content);
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseChoices(value: unknown): QuizCardChoice[] | null {
  if (!Array.isArray(value)) return null;
  const choices: QuizCardChoice[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const record = item as Record<string, unknown>;
    const choiceId = numberOrNull(record.choiceId);
    if (choiceId === null || typeof record.content !== "string") return null;
    const count = numberOrNull(record.count);
    choices.push(count === null ? { choiceId, content: record.content } : { choiceId, content: record.content, count });
  }
  return choices;
}

export function parseQuizHint(content: string): QuizHintContent | null {
  const raw = parseObject(content);
  if (!raw) return null;
  const quizId = numberOrNull(raw.quizId);
  const kind = HINT_KINDS.find((value) => value === raw.kind);
  if (quizId === null || !kind || typeof raw.question !== "string") return null;
  return {
    quizId,
    kind,
    question: raw.question,
    answer: stringOrNull(raw.answer),
    hintQuestion: stringOrNull(raw.hintQuestion),
  };
}

export function parseQuizCard(content: string): QuizCardContent | null {
  const raw = parseObject(content);
  if (!raw) return null;
  const quizId = numberOrNull(raw.quizId);
  const choices = parseChoices(raw.choices);
  if (quizId === null || !choices || typeof raw.question !== "string") return null;
  const base = { quizId, question: raw.question, choices, hintQuestion: stringOrNull(raw.hintQuestion) };
  // 1:1 카드만 두 사람의 선택을 싣는다. 그룹 카드는 인원 수만 있다.
  if ("senderChoiceId" in raw || "peerChoiceId" in raw) {
    return {
      ...base,
      senderChoiceId: numberOrNull(raw.senderChoiceId),
      peerChoiceId: numberOrNull(raw.peerChoiceId),
    };
  }
  return base;
}

export function isPairQuizCard(card: QuizCardContent): card is PairQuizCardContent {
  return "senderChoiceId" in card;
}

/** 서버가 만든 메시지(SYSTEM·QUIZ_HINT). 말풍선 묶음·읽음 표시 대상이 아니다. */
export function isServerGeneratedMessage(message: Pick<ChatMessage, "messageType">): boolean {
  return message.messageType === "SYSTEM" || message.messageType === "QUIZ_HINT";
}
