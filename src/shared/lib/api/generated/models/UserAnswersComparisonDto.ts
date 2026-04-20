/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnswerComparisonItemDto } from './AnswerComparisonItemDto';
export type UserAnswersComparisonDto = {
    /**
     * 대상 사용자 ID
     */
    targetUserId: string;
    /**
     * 퀴즈셋 ID
     */
    quizSetId: string;
    /**
     * 일치율 (0~100)
     */
    matchRate: number;
    /**
     * 일치 문제 수
     */
    matchedCount: number;
    /**
     * 전체 비교 문제 수
     */
    totalCount: number;
    /**
     * 답변 비교 상세
     */
    comparisons: Array<AnswerComparisonItemDto>;
};

