import styled, { css } from "styled-components";

const textStyle = css`
  font-family: "Pretendard JP", sans-serif;
  font-feature-settings: "ss10" 1;
`;

export const PageRoot = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--color-semantic-background-normal-normal);
`;

export const TopNavigation = styled.header`
  display: flex;
  align-items: center;
  /* 뒤로가기(24) 다음 8px 에 제목이 온다 — Figma 2153:33126 은 x=16/24/48. */
  gap: 8px;
  width: 100%;
  /*
   * 앱에서 상태바가 웹뷰 위에 겹친다 — 인셋만큼 위를 더 비운다.
   * 이 화면은 PageRoot가 position:fixed + inset:0이라 채팅방 헤더(safe-area를
   * 이미 지킨다)를 덮어쓴다. 여기가 비면 앱에서만 뒤로가기·제목이 상태바에 물린다.
   * 웹에서는 env()가 0이라 기존과 완전히 동일하다.
   */
  padding: calc(16px + env(safe-area-inset-top, 0px)) 16px 16px;
  box-sizing: border-box;
  flex-shrink: 0;
`;

export const BackButton = styled.button`
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-semantic-label-normal);
`;

export const NavTitle = styled.h2`
  ${textStyle};
  flex: 1;
  margin: 0;
  color: var(--color-semantic-label-strong);
  font-size: var(--typography-headline-2-font-size);
  font-weight: 600;
  line-height: 1.412;
  /* 가운데 정렬이 아니다 — Figma 에서 제목은 뒤로가기 옆에 붙는다(x=48). */
  text-align: left;
`;

export const NavCount = styled.span`
  flex-shrink: 0;
  color: var(--color-semantic-label-alternative);
  text-align: center;
  font-feature-settings: 'ss10' on;
  font-family: var(--typography-label-1-normal-bold-font-family);
  font-size: var(--typography-label-1-normal-bold-font-size);
  font-style: var(--typography-label-1-normal-bold-font-style);
  font-weight: var(--typography-label-1-normal-bold-font-weight);
  line-height: var(--typography-label-1-normal-bold-line-height);
  letter-spacing: var(--typography-label-1-normal-bold-letter-spacing);
`;

export const Body = styled.main`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const SectionTitle = styled.h3`
  ${textStyle};
  flex: 1;
  margin: 0;
  color: var(--color-semantic-label-normal);
  font-size: var(--typography-headline-1-font-size);
  font-weight: 600;
  line-height: 1.445;
  letter-spacing: -0.018px;
`;

export const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const OptionRow = styled.div<{ $checked: boolean }>`
  ${textStyle};
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  /*
   * Figma 2153:33436 — 높이 56 고정, 좌우 16 / 상하 12.
   * 장소 행은 32px 지도 버튼이, 시간 행은 22px 라벨이 내용이라 패딩만으로는 높이가
   * 어긋난다. min-height 로 두 종류를 같은 56px 로 맞춘다.
   */
  min-height: 56px;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  box-sizing: border-box;
  /* 선택돼도 배경은 칠하지 않는다 — Figma 는 두 상태 모두 fills 가 비어 있고 테두리만 바뀐다. */
  border: ${({ $checked }) =>
    $checked
      ? "1px solid var(--color-semantic-primary-normal)"
      : "1px solid var(--color-semantic-line-normal-neutral)"};
  text-align: left;
  user-select: none;
`;

export const OptionLabel = styled.span<{ $checked: boolean }>`
  ${textStyle};
  flex: 1;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  letter-spacing: 0.144px;
  color: var(--color-semantic-label-normal);
`;

export const Radio = styled.span<{ $checked: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 9999px;
  border: 1.5px solid
    ${({ $checked }) =>
      $checked
        ? "var(--color-semantic-primary-normal)"
        : "var(--color-semantic-line-normal-normal)"};
  background-color: ${({ $checked }) =>
    $checked ? "var(--color-semantic-primary-normal)" : "transparent"};
  color: var(--color-semantic-static-white);
`;

export const MapPinButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background-color: var(--color-semantic-interaction-disable);
  color: var(--color-semantic-label-normal);
  cursor: pointer;

  &:disabled {
    color: var(--color-semantic-label-assistive);
    cursor: not-allowed;
  }
`;

export const SubmitError = styled.p`
  margin: 0 0 var(--space-2);
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-status-negative);
  text-align: center;
`;

export const ActionArea = styled.footer`
  /*
   * fixed 가 아니라 flex 자식이다. 이미 position:fixed + inset:0 인 PageRoot 안에서
   * 또 fixed 를 걸면 본문이 얼마를 비워 둬야 하는지를 손으로 맞춰야 하고, 그 매직넘버가
   * 인셋을 빠뜨려 노치 기기에서 마지막 선택지를 버튼이 덮었다. 형제 화면
   * (VoteResultsPage / PlaceMapPage)과 같은 구조로 되돌린다.
   */
  flex-shrink: 0;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  background-color: var(--color-semantic-background-normal-normal);
  box-sizing: border-box;
`;

export const PrimaryButton = styled.button<{ $active: boolean }>`
  ${textStyle};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 430px;
  min-height: 48px;
  margin: 0 auto;
  padding: 12px 28px;
  border: none;
  border-radius: 12px;
  background-color: ${({ $active }) =>
    $active
      ? "var(--color-semantic-primary-normal)"
      : "var(--color-semantic-interaction-disable)"};
  color: ${({ $active }) =>
    $active
      ? "var(--color-semantic-static-white)"
      : "var(--color-semantic-label-assistive)"};
  cursor: ${({ $active }) => ($active ? "pointer" : "not-allowed")};
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.091px;
`;

const IconSvg = styled.svg`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
`;

const IconSvgSmall = styled.svg`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
`;

export function ChevronLeftIcon() {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 5L8 12L15 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </IconSvg>
  );
}

export function LocationIcon() {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--color-semantic-label-normal)" }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor" />
    </IconSvg>
  );
}

export function LocationIconSmall({ $muted }: { $muted?: boolean }) {
  return (
    <IconSvgSmall viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: $muted ? "var(--color-semantic-label-assistive)" : "var(--color-semantic-label-normal)" }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor" />
    </IconSvgSmall>
  );
}

export function ClockIcon() {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--color-semantic-label-normal)" }}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconSvg>
  );
}

export function CheckIcon() {
  return (
    <IconSvgSmall viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: 12, height: 12 }}>
      <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </IconSvgSmall>
  );
}
