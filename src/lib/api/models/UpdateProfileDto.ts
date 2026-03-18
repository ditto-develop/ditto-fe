/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateProfileDto = {
    /**
     * 자기소개 (최대 300자, null 전송 시 삭제)
     */
    introduction?: string;
    /**
     * 프로필 이미지 URL (null 전송 시 삭제)
     */
    profileImageUrl?: string;
    /**
     * 사는 지역 코드 (null 전송 시 삭제)
     */
    location?: string;
    /**
     * 직업 (null 전송 시 삭제)
     */
    occupation?: string;
    /**
     * 관심사 태그 목록
     */
    interests?: Array<string>;
    /**
     * 선호 최소 나이 (18~100, null 전송 시 삭제)
     */
    preferredMinAge?: number;
    /**
     * 선호 최대 나이 (18~100, null 전송 시 삭제)
     */
    preferredMaxAge?: number;
};

