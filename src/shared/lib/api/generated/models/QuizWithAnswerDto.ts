/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuizAnswerDto } from './QuizAnswerDto';
import type { QuizChoiceDto } from './QuizChoiceDto';
export type QuizWithAnswerDto = {
    /**
     * 퀴즈 ID
     */
    id: string;
    /**
     * 퀴즈 질문
     */
    question: string;
    /**
     * 퀴즈 세트 ID
     */
    quizSetId: string;
    /**
     * 퀴즈 선택지들
     */
    choices: Array<QuizChoiceDto>;
    /**
     * 퀴즈 순서
     */
    order?: number | null;
    /**
     * 생성일
     */
    createdAt: string;
    /**
     * 수정일
     */
    updatedAt: string;
    /**
     * 사용자의 답변 정보
     */
    userAnswer?: QuizAnswerDto | null;
};

