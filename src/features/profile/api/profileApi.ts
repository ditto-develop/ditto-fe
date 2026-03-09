/**
 * Profile feature API functions
 */

const getApiBase = () => process.env.NEXT_PUBLIC_API_BASE || "https://ditto.pics";

function getToken(): string {
    return typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : "";
}

// BE는 { success, data?, error? } 래핑 구조로 응답
async function apiFetch<T>(path: string): Promise<T> {
    const token = getToken();
    const res = await fetch(`${getApiBase()}/api${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    if (!res.ok) {
        throw new Error(`API ${res.status}: ${path}`);
    }
    const json = (await res.json()) as { success: boolean; data?: T; error?: string };
    if (!json.success) {
        throw new Error(json.error || `API error: ${path}`);
    }
    return json.data as T;
}

// --- BE DTO ---

export interface PublicProfileDto {
    userId: string;
    nickname: string;
    gender: string;
    age: number;
    introduction?: string;
    profileImageUrl?: string;
    location?: string;
    preferredMinAge?: number;
    preferredMaxAge?: number;
    interests?: string[];
    rating?: number;
    occupation?: string;
}

// --- API ---

export function getUserProfile(userId: string): Promise<PublicProfileDto> {
    return apiFetch(`/users/${userId}/profile`);
}
