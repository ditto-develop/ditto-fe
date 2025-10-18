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
    BASE: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    VERSION: '0.1.6',
    WITH_CREDENTIALS: true, //서버에서 토큰 삽입을 위해서는 꼭 true로 바꿀 것. [관련해서 블로그 글 남기기]
    CREDENTIALS: 'include',
    TOKEN: undefined,
    USERNAME: undefined,
    PASSWORD: undefined,
    HEADERS: undefined,
    ENCODE_PATH: undefined,
};
