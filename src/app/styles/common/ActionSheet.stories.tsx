import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { ActionSheet, ActionButton } from "../../../components/Action";

const meta: Meta<typeof ActionSheet> = {
  title: "Components/ActionSheet",
  component: ActionSheet,
  args: {
    sticky: false,
    divider: false,
    safeArea: false,
  },
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 스토리 공통 레이아웃
 * - 모바일 화면 비슷하게 하단에 시트가 보이도록 캔버스 구성
 */
const MobileMock = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      width: 390,
      maxWidth: "100%",
      height: 800,
      margin: "0 auto",
      background: "#f5f5f5",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      border: "1px solid #ddd",
      borderRadius: 16,
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

/** 1. 기본 – 버튼 1개 (전체 폭) */
export const SinglePrimary: Story = {
  render: (args) => (
    <MobileMock>
      <ActionSheet {...args}>
        <ActionButton variant="primary">인증 완료하기</ActionButton>
      </ActionSheet>
    </MobileMock>
  ),
};

/** 2. 버튼 2개 – primary + secondary (분할) */
export const TwoButtonsSplit: Story = {
  render: (args) => (
    <MobileMock>
      <ActionSheet {...args}>
        <ActionButton variant="secondary">취소</ActionButton>
        <ActionButton variant="primary">다음으로</ActionButton>
      </ActionSheet>
    </MobileMock>
  ),
};

/** 3. 버튼 3개 – secondary / primary / tertiary */
export const ThreeButtons: Story = {
  render: (args) => (
    <MobileMock>
      <ActionSheet {...args}>
        <ActionButton variant="secondary">이전 단계</ActionButton>
        <ActionButton variant="primary">다음 단계</ActionButton>
        <ActionButton variant="tertiary">나중에 할게요</ActionButton>
      </ActionSheet>
    </MobileMock>
  ),
};

/** 4. Caption 있는 경우 */
export const WithCaption: Story = {
  args: {
    caption: "입력한 내용은 서비스 제공을 위해서만 사용돼요.",
  },
  render: (args) => (
    <MobileMock>
      <ActionSheet {...args}>
        <ActionButton variant="primary">휴대폰 번호로 인증</ActionButton>
      </ActionSheet>
    </MobileMock>
  ),
};

/** 5. Sticky 하단 고정 시트 */
export const StickyBottom: Story = {
  args: {
    sticky: true,
    safeArea: true,
    divider: true,
    caption: "언제든 설정에서 다시 변경할 수 있어요.",
  },
  render: (args) => (
    <div
      style={{
        width: 390,
        maxWidth: "100%",
        height: 800,
        margin: "0 auto",
        background: "#f5f5f5",
        border: "1px solid #ddd",
        borderRadius: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 본문 컨텐츠 더미 */}
      <div style={{ padding: 24, fontSize: 14 }}>
        <p>여기에 화면 본문 내용이 들어갑니다.</p>
        <p>스크롤 영역을 가정한 더미 텍스트입니다.</p>
      </div>

      <ActionSheet {...args}>
        <ActionButton variant="secondary">취소</ActionButton>
        <ActionButton variant="primary">저장하기</ActionButton>
      </ActionSheet>
    </div>
  ),
};

/** 6. Disabled 버튼 상태 예시 */
export const DisabledStates: Story = {
  render: (args) => (
    <MobileMock>
      <ActionSheet {...args}>
        <ActionButton variant="secondary" disabled>
          취소
        </ActionButton>
        <ActionButton variant="primary" disabled>
          인증하기
        </ActionButton>
      </ActionSheet>
    </MobileMock>
  ),
};

/** 7. Tertiary만 있는 경우 (텍스트 액션) */
export const TertiaryOnly: Story = {
  render: (args) => (
    <MobileMock>
      <ActionSheet {...args}>
        <ActionButton variant="tertiary">나중에 할게요</ActionButton>
      </ActionSheet>
    </MobileMock>
  ),
};
