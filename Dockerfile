# 1) deps 단계: node_modules 설치
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# package.json만 먼저 복사해서 의존성 캐시
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./ 
# 사용할 패키지 매니저에 맞게 하나만 쓰면 됨
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --frozen-lockfile; \
  else echo "No lockfile found." && npm install; \
  fi

# 2) builder 단계: 실제 빌드
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 환경변수 필요하면 여기서 설정 가능
ENV NODE_ENV=production

RUN npm run build

# 3) runner 단계: 가볍게 실행만 담당
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Next.js standalone 구조에 맞게 복사
#   - .next/standalone 안에 server.js 포함
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# standalone 빌드 기준: server.js가 루트에 있음
CMD ["node", "server.js"]
