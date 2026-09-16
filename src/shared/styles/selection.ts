import { css } from "styled-components";

/**
 * 전역으로 선택·복사를 막아둔 것(globals.css)을 다시 풀어주는 조각.
 *
 * 채팅 말풍선처럼 "사용자가 복사할 수 있어야 하는" 영역에만 붙인다.
 * 말풍선 컨테이너에 걸면 안의 텍스트(BubbleText)와 이미지(ImageButton/img)가 함께 풀리므로
 * 메시지 종류가 늘어도 이 조각을 옮겨 붙일 필요가 없다.
 *
 * `-webkit-touch-callout`은 iOS 웹뷰의 롱프레스 메뉴(복사·이미지 저장)를 되살리는 속성이다.
 */
export const selectableContent = css`
  -webkit-user-select: text;
  user-select: text;
  -webkit-touch-callout: default;

  img {
    -webkit-touch-callout: default;
    -webkit-user-drag: auto;
  }
`;
