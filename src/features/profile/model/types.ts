/**
 * Profile feature — domain model types
 * Figma: 3.2 소개노트
 */

/** 프로필 기본 정보 */
export interface ProfileInfo {
    id: string;
    nickname: string;
    age: number;
    gender: string;
    location: string;
    occupation?: string;
    bio: string;
    avatarUrl: string;
    rating?: number; // ★ 평점
    interests: string[]; // 관심사 태그 (운동, 영화/드라마 등)
}

export interface MyStats {
    participationWeeks: number;
    matchCount: number;
    meetingCount: number;
}

/**
 * 받은 평가 요약.
 *
 * `GET /users/me/ratings` 와 `GET /users/{id}/ratings` 가 **같은 스키마·같은 공개 기준**을
 * 쓴다(BE 위키 Frontend-Native-Login-Peer-Profile-Guide 2-1). 그래서 내 화면과 타인
 * 화면이 이 타입 하나를 공유한다.
 *
 * 공개 여부 플래그는 내려오지 않는다 — `totalCount >= publicThreshold` 로 판정한다.
 * 미달이면 서버가 `averageScore`·`noShowCount` 를 0, `ratings` 를 빈 배열로 내리고
 * `totalCount` 만 실제 값을 준다.
 */
export interface RatingSummary {
    averageScore: number;
    totalCount: number;
    publicThreshold: number;
    noShowCount: number;
    ratings?: Array<{
        comment?: string;
        createdAt?: string;
    }>;
}

/**
 * 상대와 나의 퀴즈 답변 일치 요약(`GET /users/{id}/answers`).
 *
 * **상대가 무엇을 골랐는지는 내려오지 않는다.** 배지에 필요한 수치뿐이다.
 * 기준은 두 사람이 함께 완주한 가장 최근 퀴즈셋이라 매칭 주가 지나도 값이 비지 않는다.
 * 함께 완주한 퀴즈셋이 없으면 `quizSetId` 가 null 이고 나머지는 0 이다(403 이 아니다) —
 * 이때는 배지를 숨긴다.
 */
export interface AnswerMatchSummary {
    quizSetId: string | null;
    matchedCount: number;
    totalCount: number;
    matchRate: number;
}

/** 퀴즈 Q&A 항목 */
export interface QuizAnswer {
    questionNumber: number;
    question: string;
    answer: string;
}

/** 소개노트 뷰 상태 */
export type IntroNoteState =
    | "before_request"   // 대화 신청 전 (신청자 화면)
    | "after_acceptance" // 대화 수락 대기 중 (수신자 화면)
    | "completed"        // 대화 신청 완료 (신청자, 상대방 수락 대기)
    | "chat_started";    // 매칭 성사 후 전체 Q&A 공개
