#!/usr/bin/env node
/**
 * 빌드 산출물의 out/app-offline.html 에 Faro 수집 주소를 박아 넣는다.
 *
 * 왜 따로 두나: 이 화면은 앱 번들 안에서 열리는 정적 파일이라 `process.env.NEXT_PUBLIC_*` 치환이
 * 걸리지 않는다(Next 는 public/ 을 그대로 복사한다). `npm run build` 뒤에 자리표시자를 바꾼다.
 * 원본(public/app-offline.html)은 건드리지 않는다 — 주소가 커밋되지 않고, next dev 에서는
 * 자리표시자 그대로라 기록기가 꺼진다.
 *
 * 값은 Next 와 같은 순서로 .env 파일까지 읽는다(@next/env). 앱 번들은 로컬의 `npm run cap:sync`
 * 로 만들어지므로 그때는 .env.local 의 값이 들어간다.
 *
 * 주소가 비면 자리표시자를 그대로 둔다(기록기 no-op). 주소가 이상하면 빌드를 멈춘다 —
 * 조용히 잘못된 주소가 앱 번들에 들어가면 다음 앱 출시까지 고칠 수 없다.
 *
 * 사용:
 *   node scripts/inject-offline-faro.mjs [대상 html]   (기본: out/app-offline.html)
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

import nextEnv from "@next/env";

const TARGET = process.argv[2] ?? "out/app-offline.html";
const URL_PLACEHOLDER = '"__FARO_COLLECTOR_URL__"';
const VERSION_PLACEHOLDER = '"__FARO_APP_VERSION__"';
// 인라인 스크립트에 들어가므로 따옴표·공백·꺾쇠가 섞인 값은 받지 않는다.
const SAFE_URL = /^https:\/\/[0-9A-Za-z.\-_~:/%]+$/;
const SAFE_VERSION = /^[0-9A-Za-z][0-9A-Za-z.\-_]*$/;

nextEnv.loadEnvConfig(process.cwd(), false, { info: () => {}, error: console.error });

const url = process.env.NEXT_PUBLIC_FARO_URL ?? "";

if (url === "") {
  console.log("[offline-faro] NEXT_PUBLIC_FARO_URL 이 비어 있다 — 오프라인 화면 기록기는 꺼진 채로 둔다.");
  process.exit(0);
}
if (!SAFE_URL.test(url)) {
  console.error("[offline-faro] NEXT_PUBLIC_FARO_URL 형식이 아니다(https 주소여야 한다).");
  process.exit(1);
}

function resolveVersion() {
  const fromEnv = process.env.NEXT_PUBLIC_FARO_APP_VERSION;
  if (fromEnv) return fromEnv;
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const version = resolveVersion();
if (!SAFE_VERSION.test(version)) {
  console.error(`[offline-faro] 버전 형식이 아니다: ${version}`);
  process.exit(1);
}

const html = readFileSync(TARGET, "utf8");
for (const placeholder of [URL_PLACEHOLDER, VERSION_PLACEHOLDER]) {
  const count = html.split(placeholder).length - 1;
  if (count !== 1) {
    console.error(`[offline-faro] ${TARGET} 에서 ${placeholder} 가 ${count}번 나온다(정확히 1번이어야 한다).`);
    process.exit(1);
  }
}

writeFileSync(
  TARGET,
  html.replace(URL_PLACEHOLDER, JSON.stringify(url)).replace(VERSION_PLACEHOLDER, JSON.stringify(version)),
);
console.log(`[offline-faro] ${TARGET} 에 수집 주소를 넣었다(version ${version}).`);
