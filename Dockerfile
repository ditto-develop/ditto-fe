# 1) deps 단계: node_modules 설치
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --frozen-lockfile; \
  else echo "No lockfile found." && npm install; \
  fi

# 2) builder 단계: Next.js 앱 빌드
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
RUN npm run build

# 3) runner 단계: Next.js 앱 실행
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]

# --------------------------------------------------------
# 4) storybook-builder 단계: Storybook 정적 빌드
# --------------------------------------------------------
FROM node:20-alpine AS storybook-builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
# Storybook 정적 사이트 빌드 (storybook-static 폴더 생성)
RUN npm run build-storybook

# --------------------------------------------------------
# 5) storybook-runner 단계: Storybook 정적 파일 서빙
# --------------------------------------------------------
FROM node:20-alpine AS storybook-runner
WORKDIR /app

ENV NODE_ENV=production
ENV STORYBOOK_PORT=6006

# 정적 빌드 결과만 복사
COPY --from=storybook-builder /app/storybook-static ./storybook-static

# 정적 파일 서빙을 위한 간단한 서버 패키지 설치
RUN npm install -g serve

EXPOSE 6006

# storybook-static을 6006 포트로 서빙
CMD ["serve", "-s", "storybook-static", "-l", "6006"]
