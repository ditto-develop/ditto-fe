/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AnswerComparisonItemDto = {
    /**
     * 퀴즈 ID
     */
    quizId: string;
    /**
     * 퀴즈 질문
     */
    question: string;
    /**
     * 내 선택 답변
     */
    myChoice: string;
    /**
     * 상대 선택 답변
     */
    theirChoice: string;
    /**
     * 일치 여부
     */
    isMatch: boolean;
};

