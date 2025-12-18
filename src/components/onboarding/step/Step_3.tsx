import React, { useState } from "react";
import styled from "styled-components";

import { IntroContainer, QuestionContainer } from "@/styled/onboarding/Container";
import { Caption1, Label1Normal } from "@/styled/Text";
import { TextAreaWithActions } from "@/components/TextArea";
import { ControlButtonVariant, FormData, OnChange } from "@/types/type";

interface Step3Props {
  data: FormData;     // ✅ FormData 통일
  onChange: OnChange; // ✅ 시그니처 통일
  setControlButton: React.Dispatch<React.SetStateAction<ControlButtonVariant>>;
}

export function Step3Intro({ data, onChange, setControlButton }: Step3Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const saveIntroduceAt = (index: number, value: string) => {
    onChange(
      "introduce",
      data.introduce.map((v, i) => (i === index ? value : v))
    );
  };

  const questions = [
    { title: "Q1. 여행갈 때 꼭 챙겨야 하는 3가지는?", placeholder: "예: 이어폰, 선크림, 카메라" },
    { title: "Q2. 주말 아침 10시, 나는 주로 뭐하고 있을까?", placeholder: "예: 침대에서 유튜브 보기, 동네 카페에서 브런치, 운동" },
    { title: "Q3. 친구들이 나한테 제일 많이 하는 말은?", placeholder: "예: 너 진짜 느긋하다, 웃긴다, 계획적이다" },
    { title: "Q4. 스트레스 받을 때 나만의 해소법은?", placeholder: "예: 혼자 드라이브, 친구 만나서 수다, 집에서 영화 정주행" },
    { title: "Q5. 최근 1년 내 가장 잘한 선택은?", placeholder: "예: 퇴사하고 이직한 것, 운동 시작한 것, 반려동물 입양" },
    { title: "Q6. 나를 가장 행복하게 만드는 순간은?", placeholder: "예: 맛집 찾았을 때, 좋아하는 음악 들을 때, 친구들이랑 놀 때" },
    { title: "Q7. 요즘 내가 가장 많이 쓰는 앱 3개는?", placeholder: "예:유튜브, 인스타그램, 배달의민족" },
    { title: "Q8. 하루 중 가장 좋아하는 시간대는? 그때 주로 뭐해?", placeholder: "예: 저녁 9시, 하루 마무리하며 책 읽기" },
    { title: "Q9. 내가 절대 양보 못하는 것은?", placeholder: "예: 잠자는 시간, 주말 중 하루는 쉬기, 커피" },
    { title: "Q10. 나를 한 단어로 표현한다면?", placeholder: "예: 느긋한, 계획적인, 호기심 많은, 털털한" },
  ] as const;

  const completedCount = data.introduce.filter((v) => v.trim().length > 0).length;

  return (
    <IntroContainer>
      <QuestionProgressCard current={completedCount} total={10} />

      {questions.map((q, index) => {
        const id = `q${index + 1}`;

        return (
          <QuestionContainer key={id}>
            <Label1Normal>{q.title}</Label1Normal>
            <TextAreaWithActions
              id={id}
              initialValue={data.introduce[index] ?? ""}
              placeholder={q.placeholder}
              activeId={activeId}
              onChangeActive={setActiveId}
              onSave={(v) => saveIntroduceAt(index, v)}
            />
          </QuestionContainer>
        );
      })}
    </IntroContainer>
  );
}





interface QuestionProgressCardProps {
  current: number;          // 현재 질문 번호 (1 ~ total)
  total: number;            // 전체 질문 개수
  helperText?: string;      // 아래에 들어갈 안내 문구
}

export const QuestionProgressCard: React.FC<QuestionProgressCardProps> = ({
  current,
  total,
  helperText = "최소 3개 이상 작성해주세요",
}) => {
  const clampedCurrent = Math.min(Math.max(current, 0), total);
  const percent = total > 0 ? (clampedCurrent / total) * 100 : 0;

  return (
    <CardWrapper>
      <HeaderRow>
        <Label1Normal>
          {clampedCurrent}/{total} 질문 완료
        </Label1Normal>
      </HeaderRow>

      <ProgressTrack>
        <ProgressFill style={{ width: `${percent}%` }} />
      </ProgressTrack>

      <HelperText>
        <Caption1>{helperText}</Caption1>
      </HelperText>
    </CardWrapper>
  );
};

// 기본 스타일 (색/폰트/spacing은 나중에 토큰으로 교체하면 됨)
const CardWrapper = styled.div`
  background-color: var(--Background-Normal-Alternative, #DDD8D3);
  border-radius: 12px;

  display: flex;
  width: 361px;
  /* height: 58px; <- 이 고정 높이를 제거했습니다. */
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;

  /* 내부 요소 간의 간격을 재조정했습니다. (원래 gap은 너무 컸습니다.) */
  gap: 8px; /* HeaderRow와 ProgressTrack 사이의 간격 */
`;

const HeaderRow = styled.div`
  /* 기존 margin-bottom: 8px; 대신 CardWrapper의 gap을 사용하거나,
     ProgressTrack과 HelperText 사이의 간격을 ProgressTrack의 margin-bottom으로 조정합니다.
     여기서는 CardWrapper의 gap과 ProgressTrack의 margin을 제거하고 HeaderRow에 gap을 추가했습니다. */
  margin: 0; /* HeaderRow 자체에는 외부 여백이 필요 없습니다. */

  p {
    margin: 0;
    font-size: 14px;
  }

  strong {
    font-weight: 600;
  }
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 2px;
  background-color: #d3cec7; /* TODO: 토큰 */
  border-radius: 999px;
  overflow: hidden;
  /* margin-bottom: 8px; <- CardWrapper의 gap을 사용하도록 제거했습니다. */
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: #26211c; /* TODO: 토큰 */
  transition: width 0.2s ease;
`;

const HelperText = styled.div`
  /* HeaderRow, ProgressTrack, HelperText 간의 간격은
     CardWrapper의 gap (8px)으로 처리됩니다. */
  p {
    margin: 0;
    font-size: 12px;
    color: #7a736b; /* TODO: 토큰 */
  }
`;
