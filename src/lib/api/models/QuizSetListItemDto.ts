/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type QuizSetListItemDto = {
    /**
     * 퀴즈 세트 ID
     */
    id: string;
    /**
     * 년도
     */
    year: number;
    /**
     * 월
     */
    month: number;
    /**
     * 주차
     */
    week: number;
    /**
     * 카테고리
     */
    category: string;
    /**
     * 퀴즈 세트 제목
     */
    title: string;
    /**
     * 퀴즈 세트 설명
     */
    description?: string;
    /**
     * 시작일
     */
    startDate: string;
    /**
     * 종료일
     */
    endDate: string;
    /**
     * 활성화 여부
     */
    isActive: boolean;
};

