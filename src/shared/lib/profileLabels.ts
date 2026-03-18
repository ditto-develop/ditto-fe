export const LOCATION_LABELS: Record<string, string> = {
    seoul: "서울",
    gyeonggi: "경기",
    incheon: "인천",
    busan: "부산",
    daegu: "대구",
    daejeon: "대전",
    gwangju: "광주",
    ulsan: "울산",
    sejong: "세종",
    gangwon: "강원",
    chungbuk: "충북",
    chungnam: "충남",
    jeonbuk: "전북",
    jeonnam: "전남",
    gyeongbuk: "경북",
    gyeongnam: "경남",
    jeju: "제주",
};

export const OCCUPATION_LABELS: Record<string, string> = {
    "it-tech": "IT/기술",
    management: "경영/사무",
    marketing: "마케팅/광고",
    design: "디자인",
    education: "교육",
    medical: "의료/보건",
    finance: "금융",
    legal: "법률",
    manufacturing: "제조/생산",
    distribution: "유통/판매",
    service: "서비스",
    construction: "건설",
    "arts-media": "예술/미디어",
    research: "연구",
    "public-admin": "공공/행정",
    student: "학생",
    etc: "기타",
};

export const INTEREST_LABELS: Record<string, string> = {
    workout: "💪 운동",
    "movie-drama": "🍿 영화/드라마",
    performance: "💃 공연",
    photography: "📷 사진",
    reading: "📚 독서",
    music: "🎵 음악",
    cooking: "🧑‍🍳 요리",
    travel: "✈️ 여행",
    gaming: "🎮 게임",
    finance: "💰 재테크",
    "self-improvement": "🚀 자기계발",
    pets: "🐶 반려동물",
    etc: "💬 기타",
};

export function toLocationLabel(value: string): string {
    return LOCATION_LABELS[value] ?? value;
}

export function toOccupationLabel(value: string): string {
    return OCCUPATION_LABELS[value] ?? value;
}

export function toInterestLabel(value: string): string {
    return INTEREST_LABELS[value] ?? value;
}
