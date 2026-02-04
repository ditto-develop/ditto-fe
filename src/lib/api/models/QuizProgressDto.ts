/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type QuizProgressDto = {
    /**
     * 현재 진행 상태
     */
    status: QuizProgressDto.status;
    /**
     * 선택한 퀴즈 세트 ID
     */
    quizSetId: string | null;
    /**
     * 선택한 퀴즈 세트 제목
     */
    quizSetTitle: string | null;
    /**
     * 전체 퀴즈 수
     */
    totalQuizzes: number;
    /**
     * 푼 퀴즈 수
     */
    answeredQuizzes: number;
};
export namespace QuizProgressDto {
    /**
     * 현재 진행 상태
     */
    export enum status {
        NOT_STARTED = 'NOT_STARTED',
        IN_PROGRESS = 'IN_PROGRESS',
        COMPLETED = 'COMPLETED',
    }
}

