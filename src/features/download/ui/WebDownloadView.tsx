"use client";

import styled from "styled-components";

import { HeroSlider } from "@/features/download/ui/HeroSlider";
import type { HeroSlide } from "@/features/download/ui/HeroSlider";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/shared/lib/appStore";
import type { IconName } from "@/shared/ui";
import { Body1Normal, Button, Caption1, Icon, Label1Normal, Title2, Title3 } from "@/shared/ui";

interface WebDownloadViewProps {
  /** Play 스토어 공개 출시 후에는 출시 알림 신청 대신 Google Play 버튼을 보여 준다(`isPlayStoreReleased`). */
  playStoreReleased: boolean;
  onAndroidNotify: () => void;
  onOpenDocument: (path: "/settings/terms" | "/settings/privacy" | "/support") => void;
}

/**
 * 첫 화면 슬라이드. 스토어 스크린샷 1·2번은 한 장면을 둘로 나눈 것이라 이어 넘기면 폰이 옆으로
 * 지나가는 것처럼 보인다. 그림 안의 문구는 잘라 내고 폰만 남겼다(800×1176).
 */
const HERO_SLIDES: readonly HeroSlide[] = [
  {
    src: "/assets/download/hero-phone.webp",
    alt: "디토 앱 홈 화면. 이번 주 퀴즈와 한 주의 타임라인이 보인다",
    width: 800,
    height: 1176,
  },
  {
    src: "/assets/download/hero-phone-2.webp",
    alt: "퀴즈 참여 완료 화면. 목요일에 매칭 결과가 공개된다는 안내가 보인다",
    width: 800,
    height: 1176,
  },
];

/**
 * 한 주의 흐름. 그림은 스토어 등록용 스크린샷(build/play-store)을 웹 크기로 줄인 것이라 그림 안에
 * 제목이 이미 있다. 칩은 그 장면이 한 주의 언제인지만 붙인다(월–수 퀴즈 · 목 매칭 · 금–일 대화).
 */
const WEEK_SCREENS = [
  {
    src: "/assets/download/screen-quiz.webp",
    when: "월–수",
    what: "퀴즈",
    alt: "매주 12개의 질문에 답하는 퀴즈 화면",
  },
  {
    src: "/assets/download/screen-profile.webp",
    when: "목",
    what: "매칭 결과",
    alt: "같은 답을 고른 사람의 소개 노트 화면",
  },
  {
    src: "/assets/download/screen-chat.webp",
    when: "금–일",
    what: "72시간 대화",
    alt: "매칭된 사람과 나누는 대화 화면",
  },
  {
    src: "/assets/download/screen-review.webp",
    when: "만남 후",
    what: "평가",
    alt: "만남 후 상대를 평가하는 화면",
  },
] as const;

const TRUST_POINTS: readonly { icon: IconName; text: string }[] = [
  // action.lock 은 그림 자체가 28% 투명이라 다른 아이콘보다 흐리다 — 같은 세트의 진한 자물쇠를 쓴다.
  { icon: "action.lockOutline", text: "나와 같은 답을 고른 사람에게만 프로필이 공개돼요" },
  { icon: "status.profileCheck", text: "만 19세 이상만 참여할 수 있어요" },
  { icon: "status.circleExclamation", text: "불편한 대화는 채팅방에서 바로 신고할 수 있어요" },
];

/**
 * 웹 다운로드 안내. 브라우저로 들어오면 어느 주소든 이 화면이 뜬다(`shouldShowWebDownload`).
 * 앱을 깔게 하는 랜딩이라 첫 화면에 소개와 스토어 버튼을 두고, 아래로 한 주의 흐름(스크린샷)과
 * 안심 포인트를 보여 준 뒤 스토어 버튼을 한 번 더 둔다.
 *
 * App Store 버튼은 https 링크다 — iPhone 에서 누르면 App Store 앱의 디토 페이지로 바로 넘어간다.
 */
export function WebDownloadView({
  playStoreReleased,
  onAndroidNotify,
  onOpenDocument,
}: WebDownloadViewProps) {
  const storeActions = (
    <StoreActions playStoreReleased={playStoreReleased} onAndroidNotify={onAndroidNotify} />
  );

  return (
    <Page>
      <HeroSection>
        <Inner>
          <TopBar>
            <Logo src="/assets/logo/ditto.svg" alt="ditto" width={72} height={33} />
          </TopBar>

          <HeroGrid>
            <HeroCopy>
              <HeroTitle as="h1">퀴즈로 만나는 새로운 인연</HeroTitle>
              <Body1Normal $color="var(--color-semantic-label-neutral)">
                매주 12개의 질문에 답하면, 나와 같은 답을 고른 사람과 대화가 시작돼요.
              </Body1Normal>
              <HeroActions>{storeActions}</HeroActions>
            </HeroCopy>

            <HeroVisual>
              <HeroSlider slides={HERO_SLIDES} />
            </HeroVisual>
          </HeroGrid>
        </Inner>
      </HeroSection>

      <WeekSection>
        <Inner>
          <SectionHead>
            <Label1Normal $weight="semibold" $color="var(--color-semantic-label-alternative)">
              디토의 일주일
            </Label1Normal>
            <Title2 as="h2">퀴즈부터 매칭, 대화까지</Title2>
            <Body1Normal $color="var(--color-semantic-label-neutral)">
              외모나 스펙이 아닌 생각과 취향으로 시작해요.
            </Body1Normal>
          </SectionHead>

          <Gallery>
            {WEEK_SCREENS.map((screen) => (
              <Shot key={screen.src}>
                <ShotChip>
                  <ShotWhen>{screen.when}</ShotWhen>
                  {screen.what}
                </ShotChip>
                <ShotImage src={screen.src} alt={screen.alt} width={600} height={1200} loading="lazy" />
              </Shot>
            ))}
          </Gallery>
        </Inner>
      </WeekSection>

      <TrustSection>
        <Inner>
          <SectionHead>
            <Title3 as="h2">안심하고 시작하세요</Title3>
          </SectionHead>
          <TrustList>
            {TRUST_POINTS.map((point) => (
              <TrustItem key={point.icon}>
                <TrustIcon>
                  <Icon name={point.icon} size={20} />
                </TrustIcon>
                <Body1Normal $weight="medium" $color="var(--color-semantic-label-normal)">
                  {point.text}
                </Body1Normal>
              </TrustItem>
            ))}
          </TrustList>
        </Inner>
      </TrustSection>

      <FinalSection>
        <Inner>
          <FinalCard>
            {/* 스토어에 올린 아이콘(BETA 띠 없음). 파비콘(assets/app/icon.svg)은 베타 디자인이라 쓰지 않는다. */}
            <FinalAppIcon src="/assets/download/app-icon.webp" alt="" width={64} height={64} />
            <Title3 as="h2" $align="center">
              이번 주 퀴즈, 지금 시작해 보세요
            </Title3>
            <Body1Normal $weight="medium" $align="center" $color="var(--color-semantic-label-neutral)">
              디토는 앱에서 이용할 수 있어요
            </Body1Normal>
            <FinalActions>{storeActions}</FinalActions>
          </FinalCard>
        </Inner>
      </FinalSection>

      <Footer>
        <LegalLinks>
          <LegalLink type="button" onClick={() => onOpenDocument("/settings/terms")}>
            이용약관
          </LegalLink>
          <Separator aria-hidden="true">·</Separator>
          <LegalLink type="button" onClick={() => onOpenDocument("/settings/privacy")}>
            개인정보처리방침
          </LegalLink>
          <Separator aria-hidden="true">·</Separator>
          <LegalLink type="button" onClick={() => onOpenDocument("/support")}>
            고객 지원
          </LegalLink>
        </LegalLinks>
      </Footer>
    </Page>
  );
}

function StoreActions({
  playStoreReleased,
  onAndroidNotify,
}: Pick<WebDownloadViewProps, "playStoreReleased" | "onAndroidNotify">) {
  return (
    <Actions>
      <StoreButton
        as="a"
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        $variant="solid"
        $size="large"
      >
        <StoreGlyph src="/assets/logo/apple.svg" alt="" aria-hidden="true" width={20} height={20} />
        App Store에서 다운로드
      </StoreButton>
      {playStoreReleased ? (
        <StoreButton
          as="a"
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          $variant="solid"
          $size="large"
        >
          Google Play에서 다운로드
        </StoreButton>
      ) : (
        <>
          <FullWidthButton type="button" $variant="outlined" $size="large" onClick={onAndroidNotify}>
            Android 출시 알림 받기
          </FullWidthButton>
          <Caption1 $align="center" $color="var(--color-semantic-label-alternative)">
            Android 앱은 준비 중이에요. 출시되면 메일로 알려 드릴게요.
          </Caption1>
        </>
      )}
    </Actions>
  );
}

/* 데스크톱에서는 소개와 그림을 나란히, 한 주의 흐름은 네 장을 한 줄에 둔다. */
const DESKTOP = "@media (min-width: 960px)";

const Page = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  width: 100%;
  background-color: var(--color-semantic-background-normal-normal);
`;

const Inner = styled.div`
  box-sizing: border-box;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 var(--space-5);

  ${DESKTOP} {
    padding: 0 var(--space-10);
  }
`;

/* ---------- 첫 화면 ---------- */

const HeroSection = styled.section`
  padding: var(--space-5) 0 var(--space-12);

  ${DESKTOP} {
    padding: var(--space-8) 0 var(--space-20);
  }
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  height: var(--space-12);
`;

const Logo = styled.img`
  width: var(--space-18);
  height: auto;
`;

const HeroGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  margin-top: var(--space-6);

  ${DESKTOP} {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-16);
    margin-top: var(--space-10);
  }
`;

const HeroCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  word-break: keep-all;

  ${DESKTOP} {
    flex: 1 1 0;
    max-width: 460px;
  }
`;

/* 한 줄 제목. 모바일 24px(Title3), 데스크톱 28px(Title2). */
const HeroTitle = styled(Title3)`
  color: var(--color-semantic-label-strong);

  ${DESKTOP} {
    font-size: var(--typography-title-2-font-size);
    line-height: var(--typography-title-2-line-height);
    letter-spacing: var(--typography-title-2-letter-spacing);
  }
`;

const HeroActions = styled.div`
  margin-top: var(--space-5);
`;

const HeroVisual = styled.div`
  ${DESKTOP} {
    flex: 0 0 auto;
    width: var(--space-max);
  }
`;

/* ---------- 디토의 일주일 ---------- */

const WeekSection = styled.section`
  padding: var(--space-16) 0;
  background-color: var(--color-semantic-background-normal-alternative);

  ${DESKTOP} {
    padding: var(--space-24) 0;
  }
`;

const SectionHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  word-break: keep-all;
`;

/* 모바일은 옆으로 넘겨 보는 줄(다음 장이 살짝 보인다), 데스크톱은 네 칸 격자. */
const Gallery = styled.ul`
  display: flex;
  gap: var(--space-4);
  margin: var(--space-8) calc(-1 * var(--space-5)) 0;
  padding: var(--space-2) var(--space-5) var(--space-4);
  list-style: none;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding: 0 var(--space-5);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  ${DESKTOP} {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-6);
    margin: var(--space-12) 0 0;
    padding: 0;
    overflow: visible;
  }
`;

const Shot = styled.li`
  display: flex;
  flex: 0 0 68%;
  flex-direction: column;
  gap: var(--space-3);
  scroll-snap-align: start;
`;

const ShotChip = styled.span`
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1);
  border-radius: var(--space-5);
  background-color: var(--color-semantic-background-elevated-alternative);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const ShotWhen = styled.span`
  padding: 0 var(--space-2);
  border-radius: var(--space-4);
  background-color: var(--color-semantic-primary-normal);
  font-weight: var(--typography-label-1-normal-bold-font-weight);
  color: var(--color-semantic-static-white);
`;

const ShotImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--space-5);
  box-shadow: var(--style-semantic-shadow-emphasize);
`;

/* ---------- 안심 포인트 ---------- */

const TrustSection = styled.section`
  padding: var(--space-16) 0 var(--space-8);

  ${DESKTOP} {
    padding: var(--space-20) 0 var(--space-10);
  }
`;

const TrustList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: var(--space-6) 0 0;
  padding: 0;
  list-style: none;

  ${DESKTOP} {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-4);
  }
`;

const TrustItem = styled.li`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--space-4);
  background-color: var(--color-semantic-background-elevated-alternative);
  word-break: keep-all;
`;

const TrustIcon = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: var(--space-10);
  height: var(--space-10);
  border-radius: 50%;
  background-color: var(--color-semantic-fill-normal);
  color: var(--color-semantic-label-normal);
`;

/* ---------- 마지막 다운로드 유도 ---------- */

const FinalSection = styled.section`
  padding: var(--space-8) 0 var(--space-10);
`;

const FinalCard = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: var(--space-10) var(--space-5) var(--space-8);
  border-radius: var(--space-6);
  background-color: var(--color-semantic-background-normal-alternative);
  word-break: keep-all;
`;

const FinalAppIcon = styled.img`
  width: var(--space-16);
  height: var(--space-16);
  margin-bottom: var(--space-2);
  border-radius: var(--space-4);
  box-shadow: var(--style-semantic-shadow-normal);
`;

const FinalActions = styled.div`
  width: 100%;
  max-width: 360px;
  margin-top: var(--space-5);
`;

/* ---------- 스토어 버튼 ---------- */

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  ${DESKTOP} {
    max-width: 360px;
  }
`;

const FullWidthButton = styled(Button)`
  width: 100%;
`;

/* 버튼 모양의 링크. 스토어로 가는 진짜 링크라 길게 눌러 주소를 복사할 수도 있다. */
const StoreButton = styled(Button)`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  text-decoration: none;
`;

const StoreGlyph = styled.img`
  width: var(--space-5);
  height: var(--space-5);
  margin-top: calc(-1 * var(--space-1) / 2);
`;

/* ---------- 바닥글 ---------- */

const Footer = styled.footer`
  display: flex;
  justify-content: center;
  padding: var(--space-4) var(--space-4) calc(var(--space-8) + env(safe-area-inset-bottom, 0px));
`;

const LegalLinks = styled.nav`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-2);
`;

const LegalLink = styled.button`
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--typography-caption-1-font-size);
  font-weight: var(--typography-caption-1-font-weight);
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  color: var(--color-semantic-label-alternative);
  text-decoration: underline;
`;

const Separator = styled.span`
  font-size: var(--typography-caption-1-font-size);
  color: var(--color-semantic-label-assistive);
`;
