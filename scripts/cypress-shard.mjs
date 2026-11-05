#!/usr/bin/env node
/**
 * Cypress 스펙을 N 묶음으로 나눠 그중 하나를 쉼표로 이어 출력한다 — CI 가 묶음마다 러너를 따로 띄워 동시에 돌린다.
 *
 * 사용: node scripts/cypress-shard.mjs <index> <total>   (index 는 0부터)
 *       node scripts/cypress-shard.mjs --check <total>   (모든 스펙이 정확히 한 묶음에 들어가는지 확인)
 *
 * 나누는 법: cypress/spec-timings.json 의 지난 실행 시간(초)으로 긴 스펙부터, 지금 가장 가벼운 묶음에 넣는다.
 * 기록이 없는 새 스펙은 DEFAULT_SECONDS 로 친다. 정렬·동률 처리가 고정이라 같은 입력이면 늘 같은 결과가 나온다.
 * 시간 기록이 낡아도 묶음 사이 균형만 조금 틀어질 뿐 빠지는 스펙은 없다.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SPEC_DIR = join(ROOT, "cypress/e2e");
const DEFAULT_SECONDS = 15;

function listSpecs(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listSpecs(path);
    return name.endsWith(".cy.ts") ? [relative(ROOT, path)] : [];
  });
}

function readTimings() {
  try {
    return JSON.parse(readFileSync(join(ROOT, "cypress/spec-timings.json"), "utf8"));
  } catch {
    return {};
  }
}

export function shard(specs, timings, total) {
  const weighted = specs
    .map((spec) => ({ spec, seconds: timings[spec] ?? DEFAULT_SECONDS }))
    .sort((a, b) => b.seconds - a.seconds || a.spec.localeCompare(b.spec));
  const bins = Array.from({ length: total }, () => ({ seconds: 0, specs: [] }));
  for (const item of weighted) {
    const lightest = bins.reduce((min, bin, i) => (bin.seconds < bins[min].seconds ? i : min), 0);
    bins[lightest].seconds += item.seconds;
    bins[lightest].specs.push(item.spec);
  }
  return bins.map((bin) => bin.specs.sort());
}

const args = process.argv.slice(2);
const specs = listSpecs(SPEC_DIR).sort();
const timings = readTimings();

if (args[0] === "--check") {
  const total = Number(args[1]);
  const all = shard(specs, timings, total).flat();
  const missing = specs.filter((spec) => all.filter((s) => s === spec).length !== 1);
  if (missing.length > 0 || all.length !== specs.length) {
    console.error(`묶음에 빠지거나 겹친 스펙: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log(`${specs.length}개 스펙이 ${total}묶음에 한 번씩 들어갔다.`);
} else {
  const [index, total] = args.map(Number);
  if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || index >= total) {
    console.error("사용: node scripts/cypress-shard.mjs <index> <total>");
    process.exit(1);
  }
  process.stdout.write(shard(specs, timings, total)[index].join(","));
}
