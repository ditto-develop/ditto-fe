/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ScoreBreakdownDto = {
    /**
     * 퀴즈 일치율 (0~100)
     */
    quizMatchRate: number;
    /**
     * 일치한 퀴즈 수
     */
    matchedQuestions: number;
    /**
     * 전체 비교 퀴즈 수
     */
    totalQuestions: number;
    /**
     * 설명 목록
     */
    reasons: Array<string>;
};

