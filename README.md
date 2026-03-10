# Ditto Frontend

> 디토(Ditto) 서비스의 프론트엔드 리포지토리입니다.
>
> 퀴즈 기반 매칭 플랫폼으로, 사용자가 퀴즈를 통해 공통 관심사를 가진 상대를 매칭받을 수 있습니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | styled-components 6 |
| Animation | Framer Motion, Lottie |
| UI Icons | Lucide React |
| Testing | Vitest, Playwright |
| Component Explorer | Storybook 8 |
| Containerization | Docker, Docker Compose |
| Deployment | AWS EC2 (via GitHub Actions) |

---

## 실행 환경

- **Node.js**: v20+
- **npm**: v10+

---

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일을 생성하고 아래 변수를 설정합니다.

```env
NEXT_PUBLIC_KAKAO_JS_KEY=your_kakao_js_key
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/oauth/kakao
NEXT_PUBLIC_API_BASE=https://ditto.pics
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 으로 접속합니다.

---

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm run test` | Vitest 단위 테스트 실행 |
| `npm run test:e2e` | Playwright E2E 테스트 실행 |
| `npm run verify` | lint + typecheck + test 통합 검증 |
| `npm run storybook` | Storybook 개발 서버 실행 (port 6006) |
| `npm run build-storybook` | Storybook 정적 빌드 |
| `npm run generate-client` | OpenAPI 스펙으로 API 클라이언트 자동 생성 |

---

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── home/               # 홈 (매칭 현황, 이번 주 퀴즈, 타임라인)
│   ├── matching/           # 매칭 후보 목록 및 결과
│   ├── quiz/               # 퀴즈 풀기 및 현재 퀴즈 조회
│   │   ├── [id]/           # 퀴즈 상세 (문항 풀기)
│   │   └── current/        # 현재 진행 중인 퀴즈
│   ├── profile/            # 프로필 조회
│   │   └── [id]/           # 특정 유저 프로필
│   ├── onboarding/         # 온보딩 (튜토리얼, 자기소개 작성)
│   │   └── intro/          # 자기소개 입력
│   └── oauth/kakao/        # 카카오 소셜 로그인 콜백
│
├── components/             # 공통/페이지별 UI 컴포넌트
│   ├── common/             # 버튼, 레이아웃 등 기본 컴포넌트
│   ├── home/               # 홈 전용 컴포넌트
│   ├── display/            # 모달, 카드, 알림 컴포넌트
│   ├── input/              # 입력 폼, 카카오 로그인 버튼
│   ├── quiz/               # 퀴즈 모달 컴포넌트
│   └── onboarding/         # 튜토리얼 컴포넌트
│
├── features/               # 기능별 비즈니스 로직 (FSD 아키텍처)
│   ├── matching/           # 매칭 기능 (API, 컨테이너, 타입)
│   ├── conversation/       # 대화/대화방 기능
│   └── profile/            # 프로필 기능
│
├── shared/                 # 공유 UI 컴포넌트 및 유틸리티
│   ├── ui/                 # Avatar, BottomActionArea, SurfaceCard 등
│   └── lib/                # API 클라이언트 (OpenAPI 자동 생성)
│
├── context/                # React Context (Toast 알림 등)
├── types/                  # 전역 TypeScript 타입 정의
└── styles/                 # 전역 스타일
```

---

## 주요 기능

- **카카오 소셜 로그인**: OAuth2 기반 카카오 계정 인증
- **온보딩**: 신규 사용자 튜토리얼 및 자기소개 작성
- **퀴즈**: 매주 업데이트되는 퀴즈를 풀어 취향/성향 데이터 누적
- **매칭**: 퀴즈 응답 기반 1:1 매칭 후보 추천 및 매칭 요청/수락/거절
- **프로필**: 사용자 프로필 조회 (사진, 위치, 자기소개)
- **홈 대시보드**: 이번 주 퀴즈 현황, 매칭 타임라인, 매칭 결과 모달

---

## Docker로 실행

### 개발/프로덕션 전체 실행

```bash
docker compose up --build
```

| 서비스 | 포트 | 설명 |
|--------|------|------|
| `web` | 3000 | Next.js 앱 |
| `storybook` | 6006 | Storybook 정적 서버 |

### 개별 빌드

```bash
# Next.js 앱만 빌드
docker build --target runner -t ditto-web .

# Storybook만 빌드
docker build --target storybook-runner -t ditto-storybook .
```

---

## API 클라이언트 재생성

백엔드 API 스펙(`ditto-api.json`)이 변경된 경우, 아래 명령어로 클라이언트를 재생성합니다.

```bash
npm run generate-client
```

생성된 파일은 `src/shared/lib/api/generated/` 에 위치합니다.

---

## 배포

GitHub Actions 워크플로우를 통해 `main` 브랜치 푸시 시 AWS EC2에 자동 배포됩니다.

- 배포 URL: [https://ditto.pics](https://ditto.pics)
