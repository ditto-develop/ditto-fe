/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateQuizSetDto = {
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
     * 강제 적용 패스워드
     */
    forcePassword?: string;
};

