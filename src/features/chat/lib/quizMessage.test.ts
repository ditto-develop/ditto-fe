import { describe, expect, it } from "vitest";

import {
  isPairQuizCard,
  isServerGeneratedMessage,
  parseQuizCard,
  parseQuizHint,
} from "@/features/chat/lib/quizMessage";

describe("parseQuizHint", () => {
  it("서버 QuizHintContent 를 읽는다", () => {
    expect(
      parseQuizHint(
        '{"quizId":301,"kind":"SAME","question":"시간이 멈춘다면 그 시각은?","answer":"새벽 2시","hintQuestion":"그 시간엔 주로 뭘 하세요?"}',
      ),
    ).toEqual({
      quizId: 301,
      kind: "SAME",
      question: "시간이 멈춘다면 그 시각은?",
      answer: "새벽 2시",
      hintQuestion: "그 시간엔 주로 뭘 하세요?",
    });
  });

  it("DIFFERENT·SPLIT 은 answer 가 null 이고, 빈 힌트 질문은 null 로 본다", () => {
    expect(
      parseQuizHint('{"quizId":1,"kind":"SPLIT","question":"Q","answer":null,"hintQuestion":"  "}'),
    ).toEqual({ quizId: 1, kind: "SPLIT", question: "Q", answer: null, hintQuestion: null });
  });

  it("JSON 이 아니거나 모양이 어긋나면 null", () => {
    expect(parseQuizHint("그냥 글")).toBeNull();
    expect(parseQuizHint('{"quizId":1,"kind":"OTHER","question":"Q"}')).toBeNull();
    expect(parseQuizHint('{"kind":"SAME","question":"Q"}')).toBeNull();
    expect(parseQuizHint("[1,2]")).toBeNull();
  });
});

describe("parseQuizCard", () => {
  it("1:1 카드는 두 사람의 선택을 싣는다", () => {
    const card = parseQuizCard(
      '{"quizId":301,"question":"커튼을 열면?","choices":[{"choiceId":1,"content":"하늘빛"},{"choiceId":2,"content":"노을빛"}],"senderChoiceId":1,"peerChoiceId":2,"hintQuestion":null}',
    );
    expect(card).toEqual({
      quizId: 301,
      question: "커튼을 열면?",
      choices: [
        { choiceId: 1, content: "하늘빛" },
        { choiceId: 2, content: "노을빛" },
      ],
      senderChoiceId: 1,
      peerChoiceId: 2,
      hintQuestion: null,
    });
    expect(card && isPairQuizCard(card)).toBe(true);
  });

  it("그룹 카드는 인원 수만 있다", () => {
    const card = parseQuizCard(
      '{"quizId":303,"question":"결말은?","choices":[{"choiceId":5,"content":"열린 결말","count":2},{"choiceId":6,"content":"닫힌 결말","count":2}],"hintQuestion":"왜요?"}',
    );
    expect(card).toEqual({
      quizId: 303,
      question: "결말은?",
      choices: [
        { choiceId: 5, content: "열린 결말", count: 2 },
        { choiceId: 6, content: "닫힌 결말", count: 2 },
      ],
      hintQuestion: "왜요?",
    });
    expect(card && isPairQuizCard(card)).toBe(false);
  });

  it("모양이 어긋나면 null", () => {
    expect(parseQuizCard("{")).toBeNull();
    expect(parseQuizCard('{"quizId":1,"question":"Q","choices":[{"content":"x"}]}')).toBeNull();
    expect(parseQuizCard('{"quizId":1,"question":"Q"}')).toBeNull();
  });
});

describe("isServerGeneratedMessage", () => {
  it("SYSTEM·QUIZ_HINT 만 서버가 만든 메시지다", () => {
    expect(isServerGeneratedMessage({ messageType: "SYSTEM" })).toBe(true);
    expect(isServerGeneratedMessage({ messageType: "QUIZ_HINT" })).toBe(true);
    expect(isServerGeneratedMessage({ messageType: "QUIZ_CARD" })).toBe(false);
    expect(isServerGeneratedMessage({ messageType: "TEXT" })).toBe(false);
  });
});
