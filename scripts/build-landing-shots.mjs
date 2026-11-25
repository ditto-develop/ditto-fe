#!/usr/bin/env node
/**
 * 웹 다운로드 안내(/download)의 폰 그림을 만든다.
 *
 * `npm run capture:landing` 이 찍은 앱 화면(393×798 pt × 2배, cypress/screenshots/web-landing.cy.ts/)에
 * iPhone 15 모양의 상태 표시줄(54 pt)·다이내믹 아일랜드·테두리를 입힌다.
 *
 * - 갤러리(phone-*.webp): 정면 폰. 테두리 바깥 모서리가 투명하다.
 * - 첫 화면(hero-*.webp): 같은 폰을 비스듬히 눕힌 3D 그림. 폰이 그림 가장자리 밖으로 넘친다.
 *   두께·옆 버튼·그림자를 CSS 3D 로 짜서 헤드리스 Chrome 으로 찍는다(배경 투명). 페이지에서 바로
 *   CSS 3D 로 그리지 않는 건 Safari 마다 결과가 달라질 수 있어서다 — 그림이면 어디서나 같다.
 *
 * 테두리를 그림에 넣어 두면 페이지는 <img> 하나로 끝난다.
 *
 * macOS 에서 돌린다고 본다: 상태 표시줄 시각(9:41)은 시스템 글꼴(Helvetica Neue)로 그리고, Chrome 은
 * 기본 설치 경로를 쓴다(다른 곳이면 CHROME_PATH 로 넘긴다).
 */
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE_DIR = path.join(ROOT, "cypress/screenshots/web-landing.cy.ts");
const OUT_DIR = path.join(ROOT, "public/assets/download");
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/** 갤러리: 캡처 이름 → 결과 파일 이름. */
const FLAT_SHOTS = {
  "week-quiz": "phone-quiz",
  "week-match": "phone-match",
  "week-chat": "phone-chat",
  "week-rate": "phone-rate",
};

/**
 * 첫 화면: 캡처 이름 → 결과 파일 이름과 구도. 예전 스토어 그림(비스듬한 폰을 크게 잘라 쓴 것)과
 * 비슷하게 맞췄다. 수치는 아래 장면(SCENE_W × SCENE_H CSS px) 기준이다.
 * - width: 폰 폭, x·y: 폰 왼쪽 위(회전 전), transform: 폰 가운데를 축으로 돌린다.
 * - buttons: 왼쪽 옆면 버튼 [위치, 길이] (폰 높이 비율). 옆면이 보이는 구도에만 넣는다.
 */
const TILTED_SHOTS = {
  "hero-home": {
    output: "hero-home",
    width: 350,
    x: 100,
    y: 34,
    perspective: 1000,
    // 왼쪽 옆면(버튼)이 보이고, 오른쪽·아래가 그림 밖으로 넘친다.
    transform: "rotateZ(-18deg) rotateY(32deg)",
    buttons: [
      [0.17, 0.04],
      [0.25, 0.07],
      [0.34, 0.07],
    ],
  },
  "hero-quiz-done": {
    output: "hero-quiz-done",
    width: 320,
    x: 62,
    y: -150,
    perspective: 1000,
    // 아랫면이 보이고, 위쪽이 그림 밖으로 넘친다.
    transform: "rotateX(30deg) rotateY(-20deg) rotateZ(14deg)",
    buttons: [],
  },
};

const SCALE = 2; // 캡처 배율(px / pt)
const pt = (value) => Math.round(value * SCALE);

const SCREEN_W = pt(393);
const SCREEN_H = pt(852);
const STATUS_H = pt(54);
const APP_H = pt(798);
const BEZEL = pt(12);
const SCREEN_RADIUS = pt(50);
const OUTER_RADIUS = SCREEN_RADIUS + BEZEL;
const FRAME_W = SCREEN_W + BEZEL * 2;
const FRAME_H = SCREEN_H + BEZEL * 2;

/** 갤러리 폰 폭(px). 페이지에서 폰은 최대 240px 이므로 2배면 충분하다. */
const FLAT_OUTPUT_W = 600;

/** 첫 화면 장면 크기(CSS px). 결과는 2배(800×1176) — 예전 첫 화면 그림과 같은 비율이다. */
const SCENE_W = 400;
const SCENE_H = 588;
/** 3배로 찍어 2배로 줄인다. 3D 로 돌린 가장자리의 계단이 줄어든다. */
const RENDER_SCALE = 3;
/** 폰 두께(CSS px). 1px 간격으로 판을 겹쳐 옆면을 만든다. */
const THICKNESS = 26;

const INK = "#1A1815"; // 상태 표시줄 글자·아이콘(Primary/Normal)
const BODY = "#141311"; // 테두리
const EDGE = "#3B3733"; // 테두리 바깥 테 — 금속 느낌만 살짝

function statusBarSvg(background) {
  const centerY = 29.5; // 아일랜드 가운데
  const right = 291.5; // 오른쪽 아이콘 묶음 시작(pt)
  const bars = [4, 6, 8.5, 11]
    .map((height, index) => {
      const x = right + index * 4.7;
      return `<rect x="${x}" y="${35 - height}" width="3" height="${height}" rx="0.8"/>`;
    })
    .join("");
  const wifiX = right + 17 + 5 + 7.5;
  const arc = (radius) => {
    const dx = radius * Math.SQRT1_2;
    return `M ${wifiX - dx} ${35 - dx} A ${radius} ${radius} 0 0 1 ${wifiX + dx} ${35 - dx}`;
  };
  const batteryX = right + 17 + 5 + 15 + 5;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${SCREEN_W}" height="${STATUS_H}" viewBox="0 0 393 54">
  <rect width="393" height="54" fill="${background}"/>
  <text x="66" y="${centerY + 6}" text-anchor="middle" font-family="Helvetica Neue" font-weight="600"
        font-size="17" fill="${INK}">9:41</text>
  <g fill="${INK}">${bars}</g>
  <g fill="none" stroke="${INK}" stroke-width="2.1" stroke-linecap="round">
    <path d="${arc(5.2)}"/><path d="${arc(9)}"/>
  </g>
  <circle cx="${wifiX}" cy="33.3" r="1.7" fill="${INK}"/>
  <rect x="${batteryX}" y="${centerY - 6}" width="25" height="12" rx="3.6" fill="none" stroke="${INK}"
        stroke-opacity="0.4"/>
  <rect x="${batteryX + 2}" y="${centerY - 4}" width="21" height="8" rx="2" fill="${INK}"/>
  <rect x="${batteryX + 26.2}" y="${centerY - 2}" width="1.6" height="4" rx="0.8" fill="${INK}" fill-opacity="0.4"/>
  <rect x="${(393 - 126) / 2}" y="11" width="126" height="37" rx="18.5" fill="#000"/>
</svg>`;
}

const roundedMask = (width, height, radius) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/></svg>`,
  );

const frameSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${FRAME_W}" height="${FRAME_H}">
  <rect width="${FRAME_W}" height="${FRAME_H}" rx="${OUTER_RADIUS}" fill="${EDGE}"/>
  <rect x="${pt(1.5)}" y="${pt(1.5)}" width="${FRAME_W - pt(3)}" height="${FRAME_H - pt(3)}"
        rx="${OUTER_RADIUS - pt(1.5)}" fill="${BODY}"/>
</svg>`);

async function topColor(file) {
  const { data } = await sharp(file).extract({ left: 20, top: 2, width: 1, height: 1 }).raw().toBuffer({
    resolveWithObject: true,
  });
  return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
}

/** 캡처 한 장 → 정면 폰 PNG(FRAME_W × FRAME_H, 테두리 바깥 투명). */
async function buildPhone(source) {
  const file = path.join(SOURCE_DIR, `${source}.png`);
  const meta = await sharp(file).metadata();
  if (meta.width !== SCREEN_W || meta.height !== APP_H) {
    throw new Error(`${source}.png 는 ${SCREEN_W}×${APP_H} 이어야 한다(지금 ${meta.width}×${meta.height}).`);
  }

  // 상태 표시줄 + 앱 화면 → 둥근 화면
  const screen = await sharp({
    create: { width: SCREEN_W, height: SCREEN_H, channels: 4, background: "#000" },
  })
    .composite([
      { input: Buffer.from(statusBarSvg(await topColor(file))), top: 0, left: 0 },
      { input: file, top: STATUS_H, left: 0 },
    ])
    .png()
    .toBuffer();
  const roundedScreen = await sharp(screen)
    .composite([{ input: roundedMask(SCREEN_W, SCREEN_H, SCREEN_RADIUS), blend: "dest-in" }])
    .png()
    .toBuffer();

  // 테두리 위에 화면을 얹는다. 테두리 바깥은 투명하다.
  return sharp(frameSvg)
    .composite([{ input: roundedScreen, top: BEZEL, left: BEZEL }])
    .png()
    .toBuffer();
}

/** 옆면 판 색. 앞쪽은 밝은 금속, 3분의 1 지점에 하이라이트, 뒤로 갈수록 어둡다. */
function sideColor(depth) {
  const t = depth / THICKNESS;
  const highlight = Math.exp(-((t - 0.35) ** 2) / 0.02);
  const value = Math.round(92 - 50 * t + 40 * highlight);
  return `rgb(${value}, ${value - 3}, ${value - 7})`;
}

function tiltedSceneHtml(phoneDataUrl, scene) {
  const phoneW = scene.width;
  const phoneH = (phoneW * FRAME_H) / FRAME_W;
  const radius = `${((OUTER_RADIUS / FRAME_W) * 100).toFixed(2)}% / ${((OUTER_RADIUS / FRAME_H) * 100).toFixed(2)}%`;
  const layers = Array.from(
    { length: THICKNESS },
    (_, index) =>
      `<div class="layer" style="transform: translateZ(${-(index + 1)}px); background: ${sideColor(index + 1)}"></div>`,
  ).join("");
  const buttonDepth = THICKNESS * 0.55;
  const buttons = scene.buttons
    .map(
      ([top, length]) =>
        `<div class="button" style="top: ${top * phoneH}px; height: ${length * phoneH}px; width: ${buttonDepth}px;` +
        ` left: ${-buttonDepth / 2 - 1.2}px; transform: translateZ(${-THICKNESS / 2}px) rotateY(90deg)"></div>`,
    )
    .join("");
  return `<!doctype html>
<html><head><style>
  html, body { margin: 0; background: transparent; overflow: hidden; }
  .stage { position: relative; width: ${SCENE_W}px; height: ${SCENE_H}px; overflow: hidden;
           filter: drop-shadow(-18px 28px 30px rgba(26, 24, 21, 0.22)); }
  .scene { position: absolute; inset: 0; perspective: ${scene.perspective}px; }
  .phone { position: absolute; left: ${scene.x}px; top: ${scene.y}px; width: ${phoneW}px; height: ${phoneH}px;
           transform-style: preserve-3d; transform: ${scene.transform}; }
  .phone img { position: absolute; inset: 0; width: 100%; height: 100%; transform: translateZ(0.5px); }
  .layer { position: absolute; inset: 0; border-radius: ${radius}; }
  .button { position: absolute; border-radius: 3px; background: linear-gradient(90deg, #3a3632, #6d665e 50%, #2a2724); }
</style></head>
<body><div class="stage"><div class="scene"><div class="phone">${layers}${buttons}<img src="${phoneDataUrl}"></div></div></div></body>
</html>`;
}

const run = promisify(execFile);

/** 정면 폰 PNG → 비스듬한 3D 폰 그림(SCENE_W·SCENE_H 의 2배, 배경 투명). */
async function renderTilted(phone, scene) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "landing-hero-"));
  try {
    const html = path.join(dir, "scene.html");
    const shot = path.join(dir, "shot.png");
    await writeFile(html, tiltedSceneHtml(`data:image/png;base64,${phone.toString("base64")}`, scene));
    await run(CHROME, [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      `--force-device-scale-factor=${RENDER_SCALE}`,
      `--window-size=${SCENE_W},${SCENE_H}`,
      "--default-background-color=00000000",
      `--screenshot=${shot}`,
      `file://${html}`,
    ]);
    const { width, height } = await sharp(shot).metadata();
    if (width !== SCENE_W * RENDER_SCALE || height !== SCENE_H * RENDER_SCALE) {
      throw new Error(`Chrome 캡처가 ${width}×${height} 다(${SCENE_W * RENDER_SCALE}×${SCENE_H * RENDER_SCALE} 이어야 한다).`);
    }
    return await sharp(shot).resize({ width: SCENE_W * 2 }).png().toBuffer();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function writeWebp(image, output, { width, quality }) {
  const target = path.join(OUT_DIR, `${output}.webp`);
  await sharp(image).resize({ width }).webp({ quality, alphaQuality: 90, effort: 6 }).toFile(target);
  const meta = await sharp(target).metadata();
  const { size } = await stat(target);
  console.log(`${path.relative(ROOT, target)}  ${meta.width}×${meta.height}  ${Math.round(size / 1024)}KB`);
}

await mkdir(OUT_DIR, { recursive: true });
for (const [source, output] of Object.entries(FLAT_SHOTS)) {
  await writeWebp(await buildPhone(source), output, { width: FLAT_OUTPUT_W, quality: 82 });
}
for (const [source, scene] of Object.entries(TILTED_SHOTS)) {
  const tilted = await renderTilted(await buildPhone(source), scene);
  await writeWebp(tilted, scene.output, { width: SCENE_W * 2, quality: 85 });
}
