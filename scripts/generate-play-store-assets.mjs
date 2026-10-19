/**
 * Google Play 스토어 등록정보 그래픽 생성기.
 *
 *   npm run assets:play                          # 아이콘 · 그래픽 이미지
 *   npm run assets:play -- --screenshots <폴더>   # + 스크린샷 변환
 *
 * 결과는 `build/play-store/` 에 쓴다(gitignore — 언제든 다시 만들 수 있는 생성물이다).
 * Play Console → 기본 스토어 등록정보에 그대로 올린다(docs/play-store-submission.md §4).
 *
 * 앱 안에 들어가는 아이콘·스플래시는 generate-app-assets.mjs 가 맡는다. 이 스크립트는 스토어
 * 화면에만 쓰는 그림이라 따로 뒀고, 소스는 같은 브랜드 에셋이다.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "build/play-store");

let sharp;
try {
    sharp = (await import("sharp")).default;
} catch {
    console.error("sharp 를 찾을 수 없다. next 가 의존성으로 끌고 오므로 보통은 `npm ci` 로 해결된다.");
    process.exit(1);
}

/** generate-app-assets.mjs 의 BG 와 같은 값(`--color-atomic-neutral-95`). 바꾸면 함께 바꾼다. */
const BG = "#E9E6E2";
const ICON_SVG = path.join(ROOT, "public/logo/icon.svg");
const ICON_CLIP_ATTR = ' clip-path="url(#tile)"';
const WORDMARK_SVG = path.join(ROOT, "public/assets/logo/ditto.svg");

async function write(name, buffer) {
    await fs.mkdir(OUT_DIR, { recursive: true });
    await fs.writeFile(path.join(OUT_DIR, name), buffer);
    const { width, height, hasAlpha } = await sharp(buffer).metadata();
    console.log(`  build/play-store/${name}  ${width}×${height}${hasAlpha ? " (알파)" : ""}`);
}

/**
 * 고해상도 아이콘 512×512.
 *
 * Play 는 **각진 정사각형**을 받아 스스로 모서리를 깎는다(iOS 와 같다). 둥근 타일을 넣으면 두 번
 * 깎여 모서리가 비어 보이므로 클립을 뗀 원본을 쓴다 — generate-app-assets.mjs 의 renderSquareIcon 과 같다.
 */
async function generateIcon() {
    const svg = await fs.readFile(ICON_SVG, "utf8");
    if (!svg.includes(ICON_CLIP_ATTR)) {
        throw new Error(`${ICON_SVG} 에 ${ICON_CLIP_ATTR.trim()} 가 없다. 타일 클립 구조가 바뀌었다.`);
    }
    await write(
        "icon-512.png",
        await sharp(Buffer.from(svg.replace(ICON_CLIP_ATTR, "")))
            .resize(512, 512)
            .flatten({ background: BG })
            .png()
            .toBuffer(),
    );
}

/**
 * 그래픽 이미지 1024×500. 알파가 있으면 Play 가 거절한다(24비트 PNG 또는 JPEG).
 *
 * 디자인 시안이 없어 브랜드 배경에 워드마크만 놓는다. 디자이너 시안이 나오면 그걸 쓴다.
 * 워드마크 폭은 높이의 64%(=320px) — 작은 카드로 줄어 보여도 읽히는 크기다.
 */
async function generateFeatureGraphic() {
    const mark = await sharp(WORDMARK_SVG).resize({ width: 320 }).png().toBuffer();
    await write(
        "feature-graphic-1024x500.png",
        await sharp({ create: { width: 1024, height: 500, channels: 3, background: BG } })
            .composite([{ input: mark, gravity: "center" }])
            .removeAlpha()
            .png()
            .toBuffer(),
    );
}

/**
 * App Store 스크린샷(6.9" 1320×2868)을 Play 규격으로 바꾼다.
 *
 * Play 는 **긴 변이 짧은 변의 2배를 넘으면** 거절한다. 1320×2868 은 2.17배라 그대로 못 올린다.
 * 잘라 내면 위아래 문구가 잘리므로 양옆을 늘린다 — 가장자리 픽셀을 복사(`extendWith: "copy"`)하므로
 * 단색·세로 그라데이션 배경이면 이음새가 없다. 알파도 뗀다(App Store 와 같은 조건).
 */
async function convertScreenshots(dir) {
    const files = (await fs.readdir(dir))
        .filter((name) => /\.(png|jpe?g)$/i.test(name))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (files.length === 0) {
        throw new Error(`${dir} 에 PNG/JPEG 가 없다.`);
    }
    if (files.length > 8) {
        console.warn(`  ⚠ ${files.length}장이다. Play 는 휴대전화 스크린샷을 최대 8장까지 받는다.`);
    }

    for (const [index, name] of files.entries()) {
        const input = sharp(path.join(dir, name));
        const { width, height } = await input.metadata();
        const long = Math.max(width, height);
        const short = Math.min(width, height);
        const pad = Math.max(0, Math.ceil(long / 2) - short);
        const left = Math.floor(pad / 2);
        const extend =
            width < height
                ? { left, right: pad - left, top: 0, bottom: 0 }
                : { top: left, bottom: pad - left, left: 0, right: 0 };

        // extend 를 먼저 버퍼로 굳힌다 — sharp 는 한 파이프라인에서 resize 를 extend 보다 먼저 적용한다.
        const padded = await input.extend({ ...extend, extendWith: "copy" }).png().toBuffer();
        await write(
            `screenshot-${index + 1}.png`,
            await sharp(padded)
                // Play 의 한 변 최대값은 3840px 이다.
                .resize(3840, 3840, { fit: "inside", withoutEnlargement: true })
                .flatten({ background: BG })
                .removeAlpha()
                .png()
                .toBuffer(),
        );
    }
}

const screenshotsFlag = process.argv.indexOf("--screenshots");
const screenshotsDir = screenshotsFlag === -1 ? null : process.argv[screenshotsFlag + 1];
if (screenshotsFlag !== -1 && !screenshotsDir) {
    console.error("--screenshots 뒤에 폴더 경로를 준다. 예: npm run assets:play -- --screenshots ~/Downloads/appstore");
    process.exit(1);
}

console.log("Play 스토어 그래픽");
await generateIcon();
await generateFeatureGraphic();
if (screenshotsDir) {
    await convertScreenshots(path.resolve(screenshotsDir));
} else {
    console.log("  (스크린샷 변환은 --screenshots <폴더> 로 켠다)");
}
