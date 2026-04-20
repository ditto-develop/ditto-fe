/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MatchingPreferencesDto } from './MatchingPreferencesDto';
export type UserProfileDto = {
    /**
     * 프로필 ID
     */
    id: string;
    /**
     * 사용자 ID
     */
    userId: string;
    /**
     * 자기소개 (최대 300자)
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
     * 매칭 선호 조건
     */
    matchingPreferences: MatchingPreferencesDto;
    /**
     * 생성일시
     */
    createdAt: string;
    /**
     * 수정일시
     */
    updatedAt: string;
};

