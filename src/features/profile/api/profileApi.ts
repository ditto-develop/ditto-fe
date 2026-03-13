/**
 * Profile feature API functions
 */

const getApiBase = () => process.env.NEXT_PUBLIC_API_BASE || "https://ditto.pics";

function getToken(): string {
    return typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : "";
}

async function tryRefreshToken(): Promise<string | null> {
    try {
        const res = await fetch(`${getApiBase()}/api/users/auth/refresh`, {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) return null;
        const data = await res.json();
        const newToken = data?.data?.accessToken;
        if (newToken && typeof window !== "undefined") {
            localStorage.setItem("accessToken", newToken);
            return newToken;
        }
        return null;
    } catch {
        return null;
    }
}

// BE는 { success, data?, error? } 래핑 구조로 응답
async function apiFetch<T>(path: string): Promise<T> {
    const makeRequest = (token: string) =>
        fetch(`${getApiBase()}/api${path}`, {
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

    let res = await makeRequest(getToken());

    if (res.status === 401) {
        const newToken = await tryRefreshToken();
        if (newToken) {
            res = await makeRequest(newToken);
        }
    }

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

// --- 소개 노트 질문 목록 (인덱스 0-9 = Q1-Q10) ---
export const INTRO_NOTE_QUESTIONS = [
    "Q1. 여행갈 때 꼭 챙겨야 하는 3가지는?",
    "Q2. 주말 아침 10시, 나는 주로 뭐하고 있을까?",
    "Q3. 친구들이 나한테 제일 많이 하는 말은?",
    "Q4. 스트레스 받을 때 나만의 해소법은?",
    "Q5. 최근 1년 내 가장 잘한 선택은?",
    "Q6. 나를 가장 행복하게 만드는 순간은?",
    "Q7. 요즘 내가 가장 많이 쓰는 앱 3개는?",
    "Q8. 하루 중 가장 좋아하는 시간대는? 그때 주로 뭐해?",
    "Q9. 내가 절대 양보 못하는 것은?",
    "Q10. 나를 한 단어로 표현한다면?",
] as const;

export interface IntroNoteAnswer {
    question: string;
    answer: string;
}

// --- API ---

export function getUserProfile(userId: string): Promise<PublicProfileDto> {
    return apiFetch(`/users/${userId}/profile`);
}

export async function getUserIntroNotes(userId: string): Promise<IntroNoteAnswer[]> {
    const data = await apiFetch<{ answers: string[] }>(`/users/${userId}/intro-notes`);
    return data.answers
        .map((answer, i) => ({ question: INTRO_NOTE_QUESTIONS[i], answer }))
        .filter((item) => item.answer.trim().length > 0);
}
