/**
 * 네이티브 앱 아이콘 · 스플래시 생성기.
 *
 * 소스는 웹이 쓰는 브랜드 에셋 두 개뿐이고, 나머지는 전부 여기서 파생된다.
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

/** 디자인된 앱 아이콘. 둥근 타일 + 워드마크가 이미 합쳐져 있다. */
const ICON_SVG = path.join(ROOT, "public/logo/icon.svg");
/** 워드마크 단독. 웹 스플래시(`components/splash/Splash.tsx`)가 쓰는 바로 그 파일. */
const WORDMARK_SVG = path.join(ROOT, "public/assets/logo/ditto.svg");

/**
 * 워드마크를 캔버스 폭의 몇 %로 놓을지. 대상마다 마스크가 달라 값이 다르다.
 *
 * - TILE:  icon.svg 원본 그대로(202/256). 둥근 사각형이라 여유가 있다.
 * - ROUND: 원형 마스크. 대각선이 원 안에 들어와야 해서 더 줄인다.
 * - ADAPTIVE_FG: Android 어댑티브 아이콘. 108dp 중 **가운데 72dp만 보장**되고
 *   런처가 원형 마스크를 씌울 수 있다. 워드마크 종횡비가 2.105 라
 *   √(0.60² + (0.60/2.105)²) × 108 = 71.6dp ≤ 72dp 로 딱 들어간다.
 *   이 값을 올리면 런처에 따라 워드마크 양끝이 잘린다.
 * - SPLASH: 웹 스플래시가 393px 뷰포트에서 160px 로그를 쓴다(= 40.7%). 같은 비율.
 * - PUSH: 안드로이드 상태바 아이콘(24dp). 콘텐츠 영역이 사실상 22dp 라 폭의 90%를 쓴다.
 *   워드마크 종횡비가 2.105 라 높이는 24dp 중 10.3dp 뿐이지만, 상태바 아이콘은
 *   가로로 긴 편이 오히려 읽힌다(세로를 채우려고 키우면 양옆이 잘린다).
 */
const MARK_RATIO = {
    TILE: 0.79,
    ROUND: 0.7,
    ADAPTIVE_FG: 0.6,
    SPLASH: 0.4,
    PUSH: 0.9,
};

/** 워드마크 종횡비(ditto.svg 는 여백이 0이라 viewBox 가 곧 잉크 박스다). */
const MARK_ASPECT = 160 / 76;

async function renderMark(widthPx) {
    return sharp(WORDMARK_SVG)
        .resize({ width: Math.round(widthPx) })
        .png()
        .toBuffer();
}

/** 단색 배경 위에 워드마크를 가운데 놓는다. `radius` 를 주면 모서리를 깎는다. */
async function compose(width, height, markWidth, { radius = 0, flatten = false } = {}) {
    const mark = await renderMark(markWidth);
    const layers = [{ input: mark, gravity: "center" }];

    if (radius > 0) {
        // dest-in 은 마스크의 알파가 있는 곳만 남긴다.
        const mask = Buffer.from(
            `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`,
        );
        layers.push({ input: mask, blend: "dest-in" });
    }

    let img = sharp({
        create: { width, height, channels: 4, background: BG },
    }).composite(layers);

    // iOS 아이콘은 알파가 있으면 심사에서 거절된다.
    if (flatten) img = img.flatten({ background: BG });

    return img.png().toBuffer();
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

/** 어댑티브 아이콘 포그라운드는 108dp 캔버스다. */
const ADAPTIVE_SCALE = 108 / 48;

async function generateIcons() {
    console.log("\n아이콘");

    // iOS: 단일 1024 슬롯. 시스템이 알아서 모서리를 깎으므로 **각진 정사각형**을
    // 넣어야 한다. 둥근 소스를 그대로 넣으면 이중으로 깎여 모서리가 비어 보인다.
    const iosIcon = await sharp(ICON_SVG)
        .resize(1024, 1024)
        .flatten({ background: BG })
        .png()
        .toBuffer();
    // icon.svg 는 rx=64 라 모서리가 투명하다. flatten 이 BG 로 메워 각진 정사각형이 된다.
    await write("ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", iosIcon);

    for (const [density, size] of Object.entries(LAUNCHER_DENSITIES)) {
        // 레거시 런처 아이콘(API 24~25). 디자인된 둥근 타일을 그대로 쓴다.
        await write(
            `android/app/src/main/res/mipmap-${density}/ic_launcher.png`,
            await sharp(ICON_SVG).resize(size, size).png().toBuffer(),
        );

        // 원형 변형.
        await write(
            `android/app/src/main/res/mipmap-${density}/ic_launcher_round.png`,
            await compose(size, size, size * MARK_RATIO.ROUND, { radius: size / 2 }),
        );

        // 어댑티브 포그라운드(API 26+). 배경은 ic_launcher_background 색이 깔리므로
        // 여기는 워드마크만 투명 배경에 올린다.
        const fgSize = Math.round(size * ADAPTIVE_SCALE);
        const mark = await renderMark(fgSize * MARK_RATIO.ADAPTIVE_FG);
        await write(
            `android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`,
            await sharp({
                create: {
                    width: fgSize,
                    height: fgSize,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 0 },
                },
            })
                .composite([{ input: mark, gravity: "center" }])
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

async function generateSplashes() {
    console.log("\n스플래시");

    // iOS: LaunchScreen.storyboard 가 2732 정사각 이미지를 scaleAspectFill 로 깐다.
    // 폰(예: 1179×2556)에서는 가운데 폭 1260 단위만 보이므로, 웹과 같은
    // "화면 폭의 40.7%" 를 맞추려면 2732 기준 19% 여야 한다.
    const iosSplash = await compose(2732, 2732, 2732 * 0.19);
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
            await compose(w, h, Math.min(w, h) * MARK_RATIO.SPLASH),
        );
    }
}

console.log(`소스: public/logo/icon.svg · public/assets/logo/ditto.svg (배경 ${BG})`);
await generateIcons();
await generatePushIcons();
await generateSplashes();
console.log(`\n워드마크 종횡비 ${MARK_ASPECT.toFixed(3)} 기준으로 생성 완료.`);
