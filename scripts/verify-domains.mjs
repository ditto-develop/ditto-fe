#!/usr/bin/env node
/**
 * 도메인 · 딥링크 검증.
 *
 * Route53 이전 직후, CloudFront 함수 배포 직후에 돌린다.
 * DNS만 보면 "레코드가 있다"까지밖에 모르고, 실제로 무엇이 서빙되는지는
 * 응답 본문 크기를 빌드 산출물과 대조해야 알 수 있다 — 정적 export 환경에서
 * 동적 라우트가 placeholder로 덮이는 사고가 그렇게만 잡힌다.
 *
 * 사용: npm run verify:domains  [--host ditto.pics]
 */

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { promises as dns } from "node:dns";

const OUT_DIR = "out";
const CF_DOMAIN = "d28wm0h79feewt.cloudfront.net";
const ALB_SUFFIX = "elb.amazonaws.com";

const hostArgIndex = process.argv.indexOf("--host");
const PRIMARY = hostArgIndex > -1 ? process.argv[hostArgIndex + 1] : "ditto.pics";

let failures = 0;
let warnings = 0;

const ok = (msg) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
const bad = (msg) => {
    failures += 1;
    console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
};
const warn = (msg) => {
    warnings += 1;
    console.log(`  \x1b[33m!\x1b[0m ${msg}`);
};

async function resolves(host) {
    try {
        const addrs = await dns.resolve4(host);
        return addrs.length > 0;
    } catch {
        return false;
    }
}

/** CNAME 또는 ALIAS 대상. ALIAS는 A 레코드로 보이므로 CNAME 조회는 실패할 수 있다. */
async function cnameTarget(host) {
    try {
        return (await dns.resolveCname(host))[0] ?? null;
    } catch {
        return null;
    }
}

async function fetchInfo(url) {
    try {
        const res = await fetch(url, { redirect: "manual" });
        const body = res.status >= 300 && res.status < 400 ? "" : await res.text();
        return {
            status: res.status,
            size: Buffer.byteLength(body),
            location: res.headers.get("location"),
        };
    } catch (err) {
        return { status: 0, size: 0, location: null, error: String(err) };
    }
}

/** out/ 에서 해당 경로가 실제로 내보낸 문서의 크기. 없으면 null. */
function localSize(routePath) {
    const rel = routePath.replace(/^\/+|\/+$/g, "");
    const file = join(OUT_DIR, rel, "index.html");
    try {
        return statSync(file).size;
    } catch {
        return null;
    }
}

/** out/**​/placeholder 를 스캔해 동적 라우트 부모 경로를 찾는다. */
function placeholderParents(root = OUT_DIR, found = []) {
    let entries;
    try {
        entries = readdirSync(root);
    } catch {
        return found;
    }
    for (const entry of entries) {
        const full = join(root, entry);
        if (!statSync(full).isDirectory()) continue;
        if (entry === "placeholder") found.push(root.slice(OUT_DIR.length) || "/");
        else placeholderParents(full, found);
    }
    return found;
}

console.log(`\n\x1b[1mDNS\x1b[0m`);

const hosts = [PRIMARY, `www.${PRIMARY}`, `test.${PRIMARY}`, `api.${PRIMARY}`];
for (const host of hosts) {
    const up = await resolves(host);
    const target = await cnameTarget(host);
    const via = target ? ` → ${target}` : "";
    if (!up) {
        if (host.startsWith("test.")) bad(`${host} 해석 실패 — staging 이 죽어 있다`);
        else bad(`${host} 해석 실패`);
        continue;
    }
    if (host.startsWith("api.")) {
        if (target && !target.includes(ALB_SUFFIX)) warn(`${host}${via} — ALB 가 아니다?`);
        else ok(`${host}${via}`);
    } else {
        if (target && !target.includes(CF_DOMAIN)) warn(`${host}${via} — CloudFront 가 아니다?`);
        else ok(`${host}${via}`);
    }
}

console.log(`\n\x1b[1mHTTP\x1b[0m`);

const apex = await fetchInfo(`https://${PRIMARY}/`);
if (apex.status === 200) ok(`https://${PRIMARY}/ → 200 (${apex.size}b)`);
else bad(`https://${PRIMARY}/ → ${apex.status || apex.error}`);

const www = await fetchInfo(`https://www.${PRIMARY}/`);
if (www.status === 301 || www.status === 308) {
    if (www.location?.includes(`//${PRIMARY}`)) ok(`www → ${www.status} → ${www.location}`);
    else bad(`www → ${www.status} → ${www.location} (정본이 아닌 곳으로 보낸다)`);
} else if (www.status === 200) {
    warn(`www → 200 (리다이렉트 없이 직접 서빙 중)`);
} else {
    bad(`www → ${www.status || www.error}`);
}

console.log(`\n\x1b[1m딥링크 rewrite\x1b[0m`);

const parents = placeholderParents();
if (parents.length === 0) {
    warn(`${OUT_DIR}/ 에 placeholder 가 없다 — 'npm run build' 를 먼저 실행할 것`);
} else {
    // 배포본과 로컬 빌드는 보통 다른 빌드라 크기가 절대 일치하지 않는다.
    // 그래서 로컬과 대조하지 않고 **같은 호스트 안에서** 비교한다:
    //   /{parent}/{숫자}/  === /{parent}/placeholder/   → rewrite 동작
    //   /{parent}/{정적}/  !== /{parent}/placeholder/   → 과매칭 없음
    // 이 비교는 어느 빌드가 올라가 있든 유효하다.
    for (const parent of parents) {
        const ph = await fetchInfo(`https://${PRIMARY}${parent}/placeholder/`);
        if (ph.status !== 200) {
            bad(`${parent}/placeholder/ → ${ph.status || ph.error} (기준값을 못 읽었다)`);
            continue;
        }
        const served = await fetchInfo(`https://${PRIMARY}${parent}/12345/`);
        if (served.status !== 200) {
            bad(`${parent}/12345/ → ${served.status || served.error}`);
        } else if (served.size === ph.size) {
            ok(`${parent}/{id}/ → placeholder 로 rewrite 됨 (${served.size}b)`);
        } else {
            bad(`${parent}/{id}/ → ${served.size}b, placeholder 는 ${ph.size}b — rewrite 미동작`);
        }
    }

    console.log(`\n\x1b[1m형제 정적 라우트 (과매칭 확인)\x1b[0m`);
    // 동적 라우트와 부모를 공유하는 실제 정적 라우트. 여기가 placeholder 와 같은
    // 응답이면 멀쩡하던 페이지가 덮인 것이다.
    for (const parent of parents) {
        const ph = await fetchInfo(`https://${PRIMARY}${parent}/placeholder/`);
        if (ph.status !== 200) continue;

        const dir = join(OUT_DIR, parent.replace(/^\/+/, ""));
        const siblings = readdirSync(dir).filter((entry) => {
            const full = join(dir, entry);
            return (
                statSync(full).isDirectory() &&
                entry !== "placeholder" &&
                localSize(`${parent}/${entry}`) !== null
            );
        });

        for (const entry of siblings) {
            const route = `${parent}/${entry}`;
            const served = await fetchInfo(`https://${PRIMARY}${route}/`);
            if (served.status !== 200) bad(`${route}/ → ${served.status || served.error}`);
            else if (served.size === ph.size) bad(`${route}/ → placeholder 에 덮였다 (${served.size}b)`);
            else ok(`${route}/ → 정상 (${served.size}b)`);
        }
    }
}

console.log(
    `\n${failures === 0 ? "\x1b[32m통과\x1b[0m" : `\x1b[31m실패 ${failures}건\x1b[0m`}` +
        `${warnings ? ` · 경고 ${warnings}건` : ""}\n`,
);
process.exit(failures > 0 ? 1 : 0);
