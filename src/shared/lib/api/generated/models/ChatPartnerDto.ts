/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ChatPartnerDto = {
    /**
     * 파트너 유저 ID
     */
    userId: string;
    /**
     * 파트너 닉네임
     */
    nickname: string;
    /**
     * 파트너 프로필 이미지 URL
     */
    profileImageUrl?: string;
    /**
     * 매칭 점수 (0~100)
     */
    matchScore?: number;
};

