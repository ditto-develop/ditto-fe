/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PublicProfileDto = {
    /**
     * 사용자 ID
     */
    userId: string;
    /**
     * 닉네임
     */
    nickname: string;
    /**
     * 성별
     */
    gender: string;
    /**
     * 나이
     */
    age: number;
    /**
     * 자기소개
     */
    introduction?: string;
    /**
     * 프로필 이미지 URL
     */
    profileImageUrl?: string;
    /**
     * 지역
     */
    location?: string;
    /**
     * 선호 최소 나이
     */
    preferredMinAge?: number;
    /**
     * 선호 최대 나이
     */
    preferredMaxAge?: number;
};

