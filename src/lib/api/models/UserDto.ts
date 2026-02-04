/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoleDto } from './RoleDto';
export type UserDto = {
    /**
     * 사용자 ID
     */
    id: string;
    /**
     * 이름
     */
    name: string;
    /**
     * 닉네임
     */
    nickname: string;
    /**
     * 전화번호
     */
    phoneNumber: string;
    /**
     * 이메일
     */
    email?: string;
    /**
     * 성별
     */
    gender: string;
    /**
     * 나이
     */
    age: number;
    /**
     * 생년월일
     */
    birthDate?: string;
    /**
     * 가입일
     */
    joinedAt: string;
    /**
     * 탈퇴일
     */
    leftAt?: string;
    /**
     * 역할 정보
     */
    role: RoleDto;
    /**
     * 소셜 계정 목록
     */
    socialAccounts: Array<string>;
    /**
     * 생성일
     */
    createdAt: string;
    /**
     * 수정일
     */
    updatedAt: string;
};

