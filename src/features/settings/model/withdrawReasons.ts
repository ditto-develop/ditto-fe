import type { WithdrawReason } from "@/features/settings/model/types";

export const WITHDRAW_REASONS: WithdrawReason[] = [
  {
    value: "no_desired_match",
    label: "원하는 매칭이 이루어지지 않아요",
    comment:
      "아직 나와 꼭 맞는 사람을 못 만나신 거라면, 조금만 더 기회를 주실 수 있을까요? 퀴즈에 다시 답하면 ditto가 더 잘 찾아드릴게요.",
  },
  {
    value: "low_usage",
    label: "사용 빈도가 낮아졌어요",
    comment:
      "바쁜 일상 속에서 잠시 쉬어가셔도 돼요. 계정은 그대로 두고, 다시 준비되셨을 때 돌아와도 늦지 않아요. ditto가 기다리고 있을게요!",
  },
  {
    value: "privacy_concern",
    label: "개인정보가 걱정돼요",
    comment: "소중한 정보를 안전하게 지키는 건 ditto의 최우선 약속이에요. 개인정보 처리방침을 한번 확인해보시겠어요?",
  },
  {
    value: "bad_experience",
    label: "불편한 경험이 있었어요",
    comment: "불쾌한 경험을 드려서 정말 죄송해요. 신고 기능을 통해 알려주시면 ditto가 더 안전한 공간을 만들기 위해 노력할게요.",
  },
  {
    value: "other",
    label: "기타",
    comment: "불편하셨던 점이 있다면 꼭 알려주세요. 더 나은 ditto를 만드는 데 소중한 의견이 될 거예요.",
  },
];
