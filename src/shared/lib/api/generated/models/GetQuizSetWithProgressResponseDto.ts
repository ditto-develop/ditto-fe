/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuizWithAnswerDto } from './QuizWithAnswerDto';
export type GetQuizSetWithProgressResponseDto = {
    /**
     * 퀴즈 목록 (사용자 답변 포함)
     */
    quizzes: Array<QuizWithAnswerDto>;
    /**
     * 전체 퀴즈 수
     */
    totalCount: number;
};

