export const INTRO_NOTE_FIELDS = [
    {
        code: "travel-items",
        question: "Q1. 여행갈 때 꼭 챙겨야 하는 3가지는?",
        placeholder: "예: 이어폰, 선크림, 카메라",
    },
    {
        code: "weekend-morning",
        question: "Q2. 주말 아침 10시, 나는 주로 뭐하고 있을까?",
        placeholder: "예: 침대에서 유튜브 보기, 동네 카페에서 브런치, 운동",
    },
    {
        code: "friends-say",
        question: "Q3. 친구들이 나한테 제일 많이 하는 말은?",
        placeholder: "예: 너 진짜 느긋하다, 웃긴다, 계획적이다",
    },
    {
        code: "stress-relief",
        question: "Q4. 스트레스 받을 때 나만의 해소법은?",
        placeholder: "예: 혼자 드라이브, 친구 만나서 수다, 집에서 영화 정주행",
    },
    {
        code: "best-choice",
        question: "Q5. 최근 1년 내 가장 잘한 선택은?",
        placeholder: "예: 퇴사하고 이직한 것, 운동 시작한 것, 반려동물 입양",
    },
    {
        code: "happiest-moment",
        question: "Q6. 나를 가장 행복하게 만드는 순간은?",
        placeholder: "예: 맛집 찾았을 때, 좋아하는 음악 들을 때, 친구들이랑 놀 때",
    },
    {
        code: "most-used-apps",
        question: "Q7. 요즘 내가 가장 많이 쓰는 앱 3개는?",
        placeholder: "예:유튜브, 인스타그램, 배달의민족",
    },
    {
        code: "favorite-time",
        question: "Q8. 하루 중 가장 좋아하는 시간대는? 그때 주로 뭐해?",
        placeholder: "예: 저녁 9시, 하루 마무리하며 책 읽기",
    },
    {
        code: "non-negotiable",
        question: "Q9. 내가 절대 양보 못하는 것은?",
        placeholder: "예: 잠자는 시간, 주말 중 하루는 쉬기, 커피",
    },
    {
        code: "one-word",
        question: "Q10. 나를 한 단어로 표현한다면?",
        placeholder: "예: 느긋한, 계획적인, 호기심 많은, 털털한",
    },
] as const;

export type IntroNoteCode = (typeof INTRO_NOTE_FIELDS)[number]["code"];
