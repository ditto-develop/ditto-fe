/** 웹 다운로드 안내(/download)에 들어가는 폰 그림 목록. */

/** scripts/build-landing-shots.mjs 가 만드는 정면 폰 그림의 크기(px). 테두리 바깥 모서리는 투명하다. */
export const PHONE_IMAGE_WIDTH = 600;
export const PHONE_IMAGE_HEIGHT = 1260;

/** 첫 화면의 비스듬한 폰 그림 크기(px). 폰이 그림 밖으로 넘치고, 폰 바깥은 투명하다. */
export const HERO_IMAGE_WIDTH = 800;
export const HERO_IMAGE_HEIGHT = 1176;

export interface LandingScreen {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/**
 * 폰 그림은 실제 앱 화면을 목업 데이터로 찍어 테두리를 입힌 것이다(`npm run capture:landing` →
 * `npm run build:landing-shots`). 앱 화면이 바뀌면 두 명령을 다시 돌린다. 첫 화면 그림도 같은 캡처로 만든다.
 */
const phone = (name: string, alt: string): LandingScreen => ({
  src: `/assets/download/phone-${name}.webp`,
  alt,
  width: PHONE_IMAGE_WIDTH,
  height: PHONE_IMAGE_HEIGHT,
});

const hero = (name: string, alt: string): LandingScreen => ({
  src: `/assets/download/hero-${name}.webp`,
  alt,
  width: HERO_IMAGE_WIDTH,
  height: HERO_IMAGE_HEIGHT,
});

/** 첫 화면 슬라이드: 홈에서 이번 주 퀴즈를 보고 → 퀴즈를 마친다. 같은 앱 화면을 비스듬히 눕혀 크게 보여 준다. */
export const HERO_SLIDES: readonly LandingScreen[] = [
  hero("home", "디토 앱 홈 화면. 한 주의 타임라인과 이번 주 퀴즈가 보인다"),
  hero("quiz-done", "퀴즈 참여 완료 화면. 목요일에 매칭 결과가 공개된다는 안내가 보인다"),
];

/** 한 주의 흐름. 칩은 그 장면이 한 주의 언제인지 붙인다(월–수 퀴즈 · 목 매칭 · 금–일 대화). */
export const WEEK_SCREENS = [
  {
    ...phone("quiz", "퀴즈 문항 화면. 12개 중 첫 질문과 두 개의 답이 보인다"),
    when: "월–수",
    what: "퀴즈",
    title: "매주 12개의 질문에 답해요",
    description: "정답은 없어요. 나다운 답을 고르면 돼요.",
  },
  {
    ...phone("match", "이번 주 매칭 결과 화면. 같은 답을 고른 사람 세 명이 보인다"),
    when: "목",
    what: "매칭 결과",
    title: "나와 닮은 사람을 만나요",
    description: "같은 답을 고른 사람에게 대화를 신청해요.",
  },
  {
    ...phone("chat", "1:1 대화방 화면. 매칭된 사람과 주고받은 메시지가 보인다"),
    when: "금–일",
    what: "72시간 대화",
    title: "72시간 동안 대화를 나눠요",
    description: "같은 답에서 시작하면 첫 마디가 훨씬 쉬워요.",
  },
  {
    ...phone("rate", "대화 상대 평가 화면. 만남 여부와 별점을 고른다"),
    when: "만남 후",
    what: "평가",
    title: "만남 후 솔직하게 평가해요",
    description: "평가가 쌓일수록 더 좋은 만남으로 이어져요.",
  },
] as const;
