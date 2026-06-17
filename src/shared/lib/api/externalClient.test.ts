import { afterEach, describe, expect, it } from 'vitest';

import { getExternalApiBase } from '@/shared/lib/api/externalClient';

const ORIGINAL_BASE = process.env.NEXT_PUBLIC_API_BASE;

afterEach(() => {
    if (ORIGINAL_BASE === undefined) {
        delete process.env.NEXT_PUBLIC_API_BASE;
    } else {
        process.env.NEXT_PUBLIC_API_BASE = ORIGINAL_BASE;
    }
});

describe('getExternalApiBase', () => {
    it('removes trailing slashes from the configured base URL', () => {
        process.env.NEXT_PUBLIC_API_BASE = 'https://api.example.com///';
        expect(getExternalApiBase()).toBe('https://api.example.com');
    });

    it('falls back to the production base when the env var is unset', () => {
        delete process.env.NEXT_PUBLIC_API_BASE;
        expect(getExternalApiBase()).toBe('https://api.ditto.pics');
    });
});
