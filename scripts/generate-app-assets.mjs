/**
 * 네이티브 앱 아이콘 · 스플래시 생성기.
 *
 * 소스는 웹이 쓰는 브랜드 에셋 세 개뿐이고, 나머지는 전부 여기서 파생된다.
 * 손으로 만든 PNG 를 커밋하지 않는 이유는 브랜드가 바뀌었을 때 어느 파일이
 * 낡았는지 알 방법이 없어지기 때문이다. 다시 만들려면:
 *
 *   node scripts/generate-app-assets.mjs
 *
 * 그 다음 `npx cap sync` 는 필요 없다 — 네이티브 리소스 디렉터리를 직접 쓴다.
 *
 * sharp 는 next 가 이미 끌고 오는 것을 그대로 쓴다(devDependency 를 늘리지 않는다).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let sharp;
try {
    sharp = (await import("sharp")).default;
} catch {
    console.error(
        "sharp 를 찾을 수 없다. next 가 의존성으로 끌고 오므로 보통은 `npm ci` 로 해결된다.\n" +
            "next 가 sharp 를 떼어냈다면 `npm i -D sharp` 로 명시적 의존성으로 승격할 것.",
    );
    process.exit(1);
}

/**
 * 브랜드 배경. `--color-atomic-neutral-95`
 * (= `--color-semantic-background-normal-normal`) 의 복제값이다.
 * 토큰이 바뀌면 여기와 capacitor.config.ts 의 android.backgroundColor 도 같이 바꾼다.
 */
const BG = "#E9E6E2";

/**
 * 디자인된 앱 아이콘(Figma 2238:24936, 베타). 둥근 타일 + 워드마크 + 하단 BETA 띠.
 *
 * 타일 모양은 `clip-path="url(#tile)"` **하나로만** 깎는다. 하단 띠는 각진 사각형이라
 * 클립을 떼면 그대로 각진 원본(아래 두 모서리까지 검은색)이 된다. 시스템이 모서리를
 * 직접 깎는 대상(iOS · 원형 · 어댑티브)은 그 각진 원본을 써야 한다 — 둥근 타일을
 * 배경색으로 메우면 아래 두 모서리만 띠 대신 배경색이 비친다.
 */
const ICON_SVG = path.join(ROOT, "public/logo/icon.svg");
const ICON_CLIP_ATTR = ' clip-path="url(#tile)"';
/** 워드마크 단독. 웹 스플래시(`components/splash/Splash.tsx`)가 쓰는 바로 그 파일. */
const WORDMARK_SVG = path.join(ROOT, "public/assets/logo/ditto.svg");
/** 베타 배지. 웹 스플래시가 워드마크 우상단에 얹는 바로 그 파일. */
const BADGE_SVG = path.join(ROOT, "public/assets/logo/beta-badge.svg");

/**
 * 워드마크를 캔버스 폭의 몇 %로 놓을지.
 *
 * - SPLASH: 웹 스플래시가 393px 뷰포트에서 160px 로그를 쓴다(= 40.7%). 같은 비율.
 * - PUSH: 안드로이드 상태바 아이콘(24dp). 콘텐츠 영역이 사실상 22dp 라 폭의 90%를 쓴다.
 *   워드마크 종횡비가 2.105 라 높이는 24dp 중 10.3dp 뿐이지만, 상태바 아이콘은
 *   가로로 긴 편이 오히려 읽힌다(세로를 채우려고 키우면 양옆이 잘린다).
 *
 * 런처 아이콘은 워드마크를 따로 놓지 않는다 — 디자인된 타일(ICON_SVG)을 통째로 쓴다.
 */
const MARK_RATIO = {
    SPLASH: 0.4,
    PUSH: 0.9,
};

/** 워드마크 원본 크기(ditto.svg 는 여백이 0이라 viewBox 가 곧 잉크 박스다). */
const MARK_W = 160;
const MARK_H = 76;
const MARK_ASPECT = MARK_W / MARK_H;

/**
 * 배지 위치·크기. 워드마크(160×76) 좌상단 기준 단위다. Figma 3171:35348 의 값이고
 * 웹 스플래시의 `.splash-beta-badge`(globals.css) 와 같은 숫자다 — 한쪽을 바꾸면 같이 바꾼다.
 */
const BADGE_OFFSET = { left: 114.5, top: -14.5 };
const BADGE_W = 47.9734;

async function renderMark(widthPx) {
    return sharp(WORDMARK_SVG)
        .resize({ width: Math.round(widthPx) })
        .png()
        .toBuffer();
}

/** 클립을 뗀 각진 아이콘. 둥근 BG 사각형이 남긴 위쪽 모서리 투명은 BG 로 메운다. */
let squareIconSvg;
async function renderSquareIcon(size) {
    if (!squareIconSvg) {
        const svg = await fs.readFile(ICON_SVG, "utf8");
        if (!svg.includes(ICON_CLIP_ATTR)) {
            throw new Error(`${ICON_SVG} 에 ${ICON_CLIP_ATTR.trim()} 가 없다. 타일 클립 구조가 바뀌었다.`);
        }
        squareIconSvg = Buffer.from(svg.replace(ICON_CLIP_ATTR, ""));
    }
    return sharp(squareIconSvg).resize(size, size).flatten({ background: BG }).png().toBuffer();
}

/**
 * 워드마크 + 베타 배지를 캔버스에 놓는다. 가운데 정렬 기준은 **워드마크**다 —
 * 배지는 워드마크 위·오른쪽으로 삐져나가는 장식이라 웹 스플래시처럼 정렬에 끼지 않는다.
 * `background` 를 생략하면 투명 캔버스다.
 */
async function composeSplash(width, height, markWidth, { background = BG } = {}) {
    const scale = markWidth / MARK_W;
    const mark = await renderMark(markWidth);
    const { width: mw, height: mh } = await sharp(mark).metadata();
    const markLeft = Math.round((width - mw) / 2);
    const markTop = Math.round((height - mh) / 2);

    const badge = await sharp(BADGE_SVG)
        .resize({ width: Math.round(BADGE_W * scale) })
        .png()
        .toBuffer();

    return sharp({ create: { width, height, channels: 4, background } })
        .composite([
            { input: mark, left: markLeft, top: markTop },
            {
                input: badge,
                left: Math.round(markLeft + BADGE_OFFSET.left * scale),
                top: Math.round(markTop + BADGE_OFFSET.top * scale),
            },
        ])
        .png()
        .toBuffer();
}

async function write(relPath, buffer) {
    const abs = path.join(ROOT, relPath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, buffer);
    console.log(`  ${relPath}`);
}

// ─────────────────────────────────────────────────────────────
// 아이콘
// ─────────────────────────────────────────────────────────────

/** Android 런처 아이콘 밀도별 크기(dp 48 기준). */
const LAUNCHER_DENSITIES = {
    mdpi: 48,
    hdpi: 72,
    xhdpi: 96,
    xxhdpi: 144,
    xxxhdpi: 192,
};

/**
 * 어댑티브 아이콘 포그라운드는 108dp 캔버스이고, 마스크가 씌워지는 뷰포트는 가운데 72dp 다.
 * 타일을 그 72dp 에 꼭 맞게 놓는다 — 타일 디자인이 곧 "마스크 안에 보일 그림"이기 때문이다.
 *
 * 원형 마스크(가장 빡빡한 경우)에서도 내용이 안 잘리는지: 보장 영역은 지름 66dp 원이다.
 * 렌더링해 재 보면 BETA 글자의 가장 먼 점(타일 x 37%, y 93%)이 중심에서 32.0dp, 워드마크가
 * 28.9dp 라 둘 다 33dp 안에 든다. 원 밖으로 나가는 건 배경과 띠의 모서리뿐이다.
 * 아이콘 디자인이 바뀌면 이 여유(1dp)부터 다시 잴 것.
 */
const ADAPTIVE_SCALE = 108 / 48;
const ADAPTIVE_VIEWPORT = 72 / 108;

async function generateIcons() {
    console.log("\n아이콘");

    // iOS: 단일 1024 슬롯. 시스템이 알아서 모서리를 깎으므로 **각진 정사각형**을
    // 넣어야 한다. 둥근 소스를 그대로 넣으면 이중으로 깎여 모서리가 비어 보인다.
    // 알파가 있으면 심사에서 거절되는데, renderSquareIcon 이 flatten 까지 한다.
    await write(
        "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
        await renderSquareIcon(1024),
    );

    for (const [density, size] of Object.entries(LAUNCHER_DENSITIES)) {
        // 레거시 런처 아이콘(API 24~25). 디자인된 둥근 타일을 그대로 쓴다.
        await write(
            `android/app/src/main/res/mipmap-${density}/ic_launcher.png`,
            await sharp(ICON_SVG).resize(size, size).png().toBuffer(),
        );

        // 원형 변형. 각진 타일을 원으로 깎는다(dest-in 은 마스크의 알파가 있는 곳만 남긴다).
        const circle = Buffer.from(
            `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
        );
        await write(
            `android/app/src/main/res/mipmap-${density}/ic_launcher_round.png`,
            await sharp(await renderSquareIcon(size))
                .composite([{ input: circle, blend: "dest-in" }])
                .png()
                .toBuffer(),
        );

        // 어댑티브 포그라운드(API 26+). 각진 타일을 가운데 72dp 에 놓고, 바깥 18dp 는
        // 가장자리 픽셀을 복사해 채운다 — 위·옆은 배경색, 아래는 BETA 띠가 그대로 이어진다.
        // 마스크 모양·패럴랙스로 뷰포트 밖이 비쳐도 이음새가 없다.
        const fgSize = Math.round(size * ADAPTIVE_SCALE);
        const tileSize = Math.round(fgSize * ADAPTIVE_VIEWPORT);
        const before = Math.floor((fgSize - tileSize) / 2);
        const after = fgSize - tileSize - before;
        await write(
            `android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`,
            await sharp(await renderSquareIcon(tileSize))
                .extend({ top: before, bottom: after, left: before, right: after, extendWith: "copy" })
                .png()
                .toBuffer(),
        );
    }
}

// ─────────────────────────────────────────────────────────────
// 푸시 알림 아이콘 (안드로이드 상태바)
// ─────────────────────────────────────────────────────────────

/** 상태바 아이콘 밀도별 크기(dp 24 기준). 런처 아이콘(48dp)의 절반이다. */
const PUSH_DENSITIES = {
    mdpi: 24,
    hdpi: 36,
    xhdpi: 48,
    xxhdpi: 72,
    xxxhdpi: 96,
};

/**
 * `AndroidManifest.xml` 의 `default_notification_icon` 이 가리키는 아이콘.
 *
 * **지정하지 않으면 안드로이드가 런처 아이콘을 쓰는데, 시스템이 알파만 남기고
 * 전부 흰색으로 칠하기 때문에 우리 런처 아이콘(꽉 찬 타일)은 흰 사각형이 된다.**
 * 그래서 워드마크 모양만 알파로 남긴 자산을 따로 만든다.
 *
 * RGB 는 어차피 시스템이 무시하지만(알파만 본다) 흰색으로 칠해 둔다 —
 * 미리보기에서 파일만 열어봐도 실제로 어떻게 보일지 알 수 있게.
 */
async function generatePushIcons() {
    console.log("\n푸시 아이콘(안드로이드 상태바)");

    for (const [density, size] of Object.entries(PUSH_DENSITIES)) {
        const mark = await renderMark(size * MARK_RATIO.PUSH);
        // 워드마크를 캔버스 가운데 놓아 알파 마스크를 만든다.
        const alphaMask = await sharp({
            create: {
                width: size,
                height: size,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        })
            .composite([{ input: mark, gravity: "center" }])
            .png()
            .toBuffer();

        // dest-in: 흰 캔버스에서 마스크의 알파가 있는 곳만 남긴다 → 흰 워드마크 + 투명 배경.
        await write(
            `android/app/src/main/res/drawable-${density}/ic_stat_ditto.png`,
            await sharp({
                create: { width: size, height: size, channels: 4, background: "#ffffff" },
            })
                .composite([{ input: alphaMask, blend: "dest-in" }])
                .png()
                .toBuffer(),
        );
    }
}

// ─────────────────────────────────────────────────────────────
// 스플래시
// ─────────────────────────────────────────────────────────────

/**
 * Android 12+ 시스템 스플래시 아이콘(`values-v31/styles.xml` 의 windowSplashScreenAnimatedIcon).
 * 배경 없는 아이콘 규격은 288dp 캔버스 · 지름 192dp 원 안이다.
 *
 * 워드마크를 웹과 같은 160dp 로 둔다. 배지까지 합친 묶음의 가장 먼 점은 배지 우상단
 * 둥근 모서리로 중심에서 93.6dp — 96dp 반지름 안에 든다.
 */
const SPLASH_ICON_DENSITIES = {
    mdpi: 1,
    hdpi: 1.5,
    xhdpi: 2,
    xxhdpi: 3,
    xxxhdpi: 4,
};

async function generateSplashes() {
    console.log("\n스플래시");

    // iOS: LaunchScreen.storyboard 가 2732 정사각 이미지를 scaleAspectFill 로 깐다.
    // 폰(예: 1179×2556)에서는 가운데 폭 1260 단위만 보이므로, 웹과 같은
    // "화면 폭의 40.7%" 를 맞추려면 2732 기준 19% 여야 한다.
    const iosSplash = await composeSplash(2732, 2732, 2732 * 0.19);
    for (const name of [
        "splash-2732x2732.png",
        "splash-2732x2732-1.png",
        "splash-2732x2732-2.png",
    ]) {
        await write(`ios/App/App/Assets.xcassets/Splash.imageset/${name}`, iosSplash);
    }

    // Android: 파일명·크기를 템플릿 그대로 유지한다(styles.xml 이 @drawable/splash 를 본다).
    // 짧은 변 기준으로 워드마크를 잡아 세로/가로 자산이 같은 규칙을 쓰게 한다.
    const androidSplashes = {
        drawable: [480, 320],
        "drawable-land-mdpi": [480, 320],
        "drawable-land-hdpi": [800, 480],
        "drawable-land-xhdpi": [1280, 720],
        "drawable-land-xxhdpi": [1600, 960],
        "drawable-land-xxxhdpi": [1920, 1280],
        "drawable-port-mdpi": [320, 480],
        "drawable-port-hdpi": [480, 800],
        "drawable-port-xhdpi": [720, 1280],
        "drawable-port-xxhdpi": [960, 1600],
        "drawable-port-xxxhdpi": [1280, 1920],
    };

    for (const [dir, [w, h]] of Object.entries(androidSplashes)) {
        await write(
            `android/app/src/main/res/${dir}/splash.png`,
            await composeSplash(w, h, Math.min(w, h) * MARK_RATIO.SPLASH),
        );
    }

    // Android 12+: 배경은 windowSplashScreenBackground 가 깔므로 투명 캔버스에 올린다.
    for (const [density, scale] of Object.entries(SPLASH_ICON_DENSITIES)) {
        const size = Math.round(288 * scale);
        await write(
            `android/app/src/main/res/drawable-${density}/splash_icon.png`,
            await composeSplash(size, size, MARK_W * scale, {
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            }),
        );
    }
}

console.log(
    `소스: public/logo/icon.svg · public/assets/logo/ditto.svg · public/assets/logo/beta-badge.svg (배경 ${BG})`,
);
await generateIcons();
await generatePushIcons();
await generateSplashes();
console.log(`\n워드마크 종횡비 ${MARK_ASPECT.toFixed(3)} 기준으로 생성 완료.`);
