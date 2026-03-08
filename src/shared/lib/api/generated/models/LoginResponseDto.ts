/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserDto } from './UserDto';
export type LoginResponseDto = {
    /**
     * 액세스 토큰
     */
    accessToken: string;
    /**
     * 리프레시 토큰 (쿠키로 설정)
     */
    refreshToken?: string;
    /**
     * 사용자 정보
     */
    user: UserDto;
};

