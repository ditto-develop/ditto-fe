const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || '') + '/api';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('adminAccessToken') ?? '';
}

export async function adminFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[${res.status}] ${text}`);
  }

  const contentType = res.headers.get('content-type');
  if (res.status === 204 || !contentType?.includes('application/json')) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
