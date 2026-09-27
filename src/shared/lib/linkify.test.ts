import { describe, expect, it } from "vitest";

import { linkify } from "./linkify";

const links = (content: string) =>
  linkify(content).filter((part) => part.type === "link");

describe("linkify", () => {
  it("http(s) 주소를 그대로 링크로 만든다", () => {
    expect(links("여기 https://ditto.pics/home 봐")).toEqual([
      { type: "link", text: "https://ditto.pics/home", href: "https://ditto.pics/home" },
    ]);
  });

  it("스킴 없는 www 주소에는 https 를 붙인다", () => {
    expect(links("www.naver.com 들어가봐")).toEqual([
      { type: "link", text: "www.naver.com", href: "https://www.naver.com" },
    ]);
  });

  it("스킴 없는 도메인과 경로를 링크로 만든다", () => {
    expect(links("naver.com/abc?q=1 참고")).toEqual([
      { type: "link", text: "naver.com/abc?q=1", href: "https://naver.com/abc?q=1" },
    ]);
    expect(links("map.kakao.com")).toEqual([
      { type: "link", text: "map.kakao.com", href: "https://map.kakao.com" },
    ]);
  });

  it("도메인 바로 뒤에 붙은 한글과 문장부호는 링크에서 뺀다", () => {
    expect(links("naver.com에서 찾았어")[0].text).toBe("naver.com");
    expect(links("(www.naver.com).")[0].text).toBe("www.naver.com");
    expect(links("https://naver.com!")[0].text).toBe("https://naver.com");
  });

  it("링크가 아닌 점은 무시한다", () => {
    expect(links("3.14 이고 file.txt 랑 v1.2")).toEqual([]);
    expect(links("naver.community")).toEqual([]);
    expect(links("www.")).toEqual([]);
  });

  it("이메일 주소의 도메인은 링크로 만들지 않는다", () => {
    expect(links("메일은 hello@naver.com 으로")).toEqual([]);
  });

  it("링크 앞뒤 텍스트를 그대로 보존한다", () => {
    const content = "a naver.com b https://x.com c";
    expect(linkify(content).map((part) => part.text).join("")).toBe(content);
  });
});
