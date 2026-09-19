import { describe, expect, it } from "vitest";

import {
  CHUNK_RELOAD_COOLDOWN_MS,
  isChunkLoadError,
  isOwnChunkUrl,
  shouldReload,
} from "@/shared/lib/chunkReload";

describe("isChunkLoadError", () => {
  it("webpack 의 ChunkLoadError 를 잡는다", () => {
    const err = new Error("Loading chunk 482 failed.");
    err.name = "ChunkLoadError";
    expect(isChunkLoadError(err)).toBe(true);
  });

  it("이름이 달라도 메시지로 잡는다", () => {
    expect(isChunkLoadError(new Error("Loading chunk app/page failed."))).toBe(true);
    expect(isChunkLoadError(new Error("Loading CSS chunk 12 failed"))).toBe(true);
  });

  it("사파리·파이어폭스의 동적 import 실패 문구도 잡는다", () => {
    expect(isChunkLoadError(new Error("Importing a module script failed."))).toBe(true);
    expect(
      isChunkLoadError(new Error("error loading dynamically imported module: /_next/x.js")),
    ).toBe(true);
  });

  it("다른 realm 에서 온 Error 처럼 instanceof 가 안 먹는 객체도 잡는다", () => {
    expect(isChunkLoadError({ name: "ChunkLoadError", message: "" })).toBe(true);
  });

  it("문자열 reason 도 받는다", () => {
    expect(isChunkLoadError("Uncaught ChunkLoadError")).toBe(true);
  });

  it("관계없는 에러는 잡지 않는다", () => {
    expect(isChunkLoadError(new Error("Network request failed"))).toBe(false);
    expect(isChunkLoadError(new TypeError("undefined is not a function"))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
    expect(isChunkLoadError(42)).toBe(false);
  });
});

describe("isOwnChunkUrl", () => {
  const ORIGIN = "https://ditto.pics";

  it("같은 오리진의 _next/static 만 우리 청크로 본다", () => {
    expect(isOwnChunkUrl("https://ditto.pics/_next/static/chunks/main.js", ORIGIN)).toBe(true);
    expect(isOwnChunkUrl("/_next/static/css/app.css", ORIGIN)).toBe(true);
  });

  it("서드파티 스크립트는 제외한다 — 광고 차단기에 걸려도 새로고침하지 않는다", () => {
    expect(isOwnChunkUrl("https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js", ORIGIN)).toBe(
      false,
    );
    expect(isOwnChunkUrl("https://www.googletagmanager.com/gtag/js?id=G-X", ORIGIN)).toBe(false);
  });

  it("같은 오리진이어도 빌드 산출물이 아니면 제외한다", () => {
    expect(isOwnChunkUrl("https://ditto.pics/assets/logo/ditto.svg", ORIGIN)).toBe(false);
  });

  it("빈 값·깨진 URL 은 제외한다", () => {
    expect(isOwnChunkUrl(null, ORIGIN)).toBe(false);
    expect(isOwnChunkUrl("", ORIGIN)).toBe(false);
  });
});

describe("shouldReload", () => {
  const NOW = 1_700_000_000_000;

  it("새로고침한 적이 없으면 새로고침한다", () => {
    expect(shouldReload(null, NOW)).toBe(true);
  });

  it("쿨다운 안이면 새로고침하지 않는다 — 리로드 루프를 막는다", () => {
    expect(shouldReload(String(NOW - 1_000), NOW)).toBe(false);
    expect(shouldReload(String(NOW - CHUNK_RELOAD_COOLDOWN_MS), NOW)).toBe(false);
  });

  it("쿨다운을 넘겼으면 다시 새로고침한다", () => {
    expect(shouldReload(String(NOW - CHUNK_RELOAD_COOLDOWN_MS - 1), NOW)).toBe(true);
  });

  it("마크가 깨져 있으면 새로고침을 허용한다", () => {
    expect(shouldReload("not-a-number", NOW)).toBe(true);
  });
});
