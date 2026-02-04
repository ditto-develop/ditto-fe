/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryGroupDto } from './CategoryGroupDto';
export type WeekGroupDto = {
    /**
     * 주차
     */
    week: number;
    /**
     * 시작일
     */
    startDate: string;
    /**
     * 종료일
     */
    endDate: string;
    /**
     * 카테고리별 그룹 목록
     */
    categories: Array<CategoryGroupDto>;
};

