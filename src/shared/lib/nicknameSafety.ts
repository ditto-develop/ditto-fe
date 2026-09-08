/**
 * 닉네임 금지어 목록 (운영 정책 기준).
 *
 * 카테고리:
 * 1. 운영진 사칭 — 신고 처리 시 실제 운영진과 혼동을 유발하는 표현
 * 2. 서비스명 사칭 — 디토 공식 계정으로 오인시키는 표현
 * 3. 성적 표현
 * 4. 욕설/비방
 * 5. 혐오 표현
 *
 * 목록이 확정 운영 정책이 되면 서버 관리 목록으로 교체한다 ([[chatSafety.ts]]와 동일 방침).
 */
export const FORBIDDEN_NICKNAME_WORDS = [
  // 1. 운영진 사칭
  "admin", "administrator", "관리자", "운영자", "운영진", "스태프", "staff",
  "매니저", "manager", "moderator", "mod", "info", "help", "test", "testing",
  "support", "null", "service", "no-reply", "undefined", "anonymous",
  "security", "verify", "verified", "authorized", "suspended", "deleted",
  "authentication", "operator", "모더레이터", "디토관리자", "디토운영자", "디토스태프",

  // 2. 서비스명 사칭
  "디토", "ditto", "디토공식", "ditto공식", "공식디토", "official", "company",
  "owner", "디토운영", "디토팀",

  // 3. 성적 표현
  "섹스", "sex", "야동", "포르노", "자위", "딸딸이", "보지", "자지", "음경",
  "질", "창녀", "걸레", "육봉", "색골", "변태", "야한", "19금", "음란",
  "음란마귀", "섹파", "섹친", "원나잇", "원조", "조건", "조건만남", "nude",
  "porn", "pornography", "naked", "pornhub", "sexy", "adult", "onlyfans",
  "pennis", "penis", "jerk", "vagina", "horny", "섹트",

  // 4. 욕설/비방
  "시발", "씨발", "ㅅㅂ", "ㅆㅂ", "개새끼", "개색", "개색기", "개년", "병신",
  "ㅂㅅ", "미친놈", "미친년", "지랄", "좆", "ㅈ같은", "닥쳐", "꺼져", "죽어",
  "죽을래", "엿먹어", "fuck", "shit", "bitch", "asshole", "damn", "dick",

  // 5. 혐오 표현
  "김치녀", "김치남", "한남", "한녀", "맘충", "틀딱", "급식충", "특정지역비하",
  "장애인비하", "흑형", "쪽바리", "짱깨", "자살", "nazi", "nigga", "nigger",
  "rape", "rapist", "terrorist", "cocaine", "hacker", "hack", "spam",
  "spammer", "casino", "gambling", "suicide", "조센징",
] as const;

const CHOSEONG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ",
  "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];
const JUNGSEONG = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ",
  "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
];
const JONGSEONG = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ",
  "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ",
  "ㅍ", "ㅎ",
];

/** 완성형 한글 음절을 자모(호환 자모)로 분해한다. 이미 분리된 자모/그 외 문자는 그대로 둔다. */
function decomposeHangul(text: string): string {
  let result = "";
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const cho = Math.floor(offset / (21 * 28));
      const jung = Math.floor((offset % (21 * 28)) / 28);
      const jong = offset % 28;
      result += CHOSEONG[cho] + JUNGSEONG[jung] + JONGSEONG[jong];
    } else {
      result += ch;
    }
  }
  return result;
}

/** 숫자/기호를 닮은 글자로 치환한다 (예: `4dmin` → `admin`). */
const LOOKALIKE_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
};

/**
 * 특수문자/공백 삽입, 숫자-문자 치환 우회를 정규화한다 (자모 분해는 하지 않음).
 * 영문 ↔ 한글 치환(예: admin → 어드민)은 알고리즘화하지 않고, 목록에 한글 표기를 직접 등록해 대응한다.
 */
function normalizeLiteral(text: string): string {
  const lookalikeReplaced = text
    .toLowerCase()
    .replace(/[013457@$]/g, (ch) => LOOKALIKE_MAP[ch] ?? ch);
  return lookalikeReplaced.replace(/[^0-9a-z가-힣ㄱ-ㅎㅏ-ㅣ]/g, "");
}

/**
 * 자모 분해 후 결합음절 2개 미만(자모 4개 미만) 결과는 제외한다.
 * "ㅅㅂ"/"ㅂㅅ" 같은 2자모 축약 금지어를 완성형 음절 텍스트에 그대로 적용하면, 서로 무관한
 * 단어의 음절 경계(예: "고양이집사" → …ㅈㅣㅂ + ㅅㅏ… = "ㅂㅅ")에서 우연히 걸리는 오탐이 난다.
 * 이런 짧은 자모 축약어는 리터럴 비교(사용자가 실제로 그 자모를 타이핑한 경우)로만 잡는다.
 */
const MIN_FUZZY_LENGTH = 4;

const LITERAL_FORBIDDEN_NICKNAME_WORDS = FORBIDDEN_NICKNAME_WORDS.map(normalizeLiteral);

const FUZZY_FORBIDDEN_NICKNAME_WORDS = LITERAL_FORBIDDEN_NICKNAME_WORDS.map(decomposeHangul).filter(
  (word) => word.length >= MIN_FUZZY_LENGTH
);

/** 닉네임에 금지어가 포함되어 있는지 검사한다. */
export function containsForbiddenNicknameWord(nickname: string): boolean {
  const literal = normalizeLiteral(nickname);
  if (LITERAL_FORBIDDEN_NICKNAME_WORDS.some((word) => literal.includes(word))) {
    return true;
  }

  const decomposed = decomposeHangul(literal);
  return FUZZY_FORBIDDEN_NICKNAME_WORDS.some((word) => decomposed.includes(word));
}
