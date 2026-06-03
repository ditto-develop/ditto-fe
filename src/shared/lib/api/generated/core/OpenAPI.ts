/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiRequestOptions } from './ApiRequestOptions';

type Resolver<T> = (options: ApiRequestOptions) => Promise<T>;
type Headers = Record<string, string>;

export type OpenAPIConfig = {
    BASE: string;
    VERSION: string;
    WITH_CREDENTIALS: boolean;
    CREDENTIALS: 'include' | 'omit' | 'same-origin';
    TOKEN?: string | Resolver<string> | undefined;
    USERNAME?: string | Resolver<string> | undefined;
    PASSWORD?: string | Resolver<string> | undefined;
    HEADERS?: Headers | Resolver<Headers> | undefined;
    ENCODE_PATH?: ((path: string) => string) | undefined;
};

export const OpenAPI: OpenAPIConfig = {
    BASE: process.env.NEXT_PUBLIC_API_BASE || 'https://api.ditto.pics',
    VERSION: '0.0.1',
    WITH_CREDENTIALS: false,
    CREDENTIALS: 'include',
    TOKEN: async () => {
        if (typeof window === 'undefined') return '';
        return localStorage.getItem('accessToken') ?? '';
    },
    USERNAME: undefined,
    PASSWORD: undefined,
    // 카카오 소셜 로그인(window.location 리다이렉트)을 제외한 모든 API 요청에 X-API-Key를 첨부한다.
    HEADERS: async () => {
        const apiKey = process.env.NEXT_PUBLIC_DITTO_API_KEY;
        const headers: Headers = {};
        if (apiKey) headers['X-API-Key'] = apiKey;
        return headers;
    },
    ENCODE_PATH: undefined,
};
