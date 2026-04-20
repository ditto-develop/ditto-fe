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
     * 매칭 타입 (ONE_TO_ONE: 1대1 매칭, GROUP: 그룹 매칭)
     */
    matchingType?: CreateQuizSetDto.matchingType;
    /**
     * 강제 적용 패스워드
     */
    forcePassword?: string;
};
export namespace CreateQuizSetDto {
    /**
     * 매칭 타입 (ONE_TO_ONE: 1대1 매칭, GROUP: 그룹 매칭)
     */
    export enum matchingType {
        ONE_TO_ONE = 'ONE_TO_ONE',
        GROUP = 'GROUP',
    }
}

