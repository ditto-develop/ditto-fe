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

/** 퀴즈 Q&A 항목 */
export interface QuizAnswer {
    questionNumber: number;
    question: string;
    answer: string;
}

/** 소개노트 뷰 상태 */
export type IntroNoteState = "before_request" | "after_acceptance" | "completed";
