/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CurrentWeekQuizSetDto } from './CurrentWeekQuizSetDto';
export type CurrentWeekQuizSetsResponseDto = {
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
     * 카테고리별 퀴즈 세트 목록
     */
    quizSets: Array<CurrentWeekQuizSetDto>;
};

