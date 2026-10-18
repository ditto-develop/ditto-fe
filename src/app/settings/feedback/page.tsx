import { FeedbackContainer } from "@/features/feedback/containers/FeedbackContainer";

/** 의견 보내기(버그 제보·개선 제안). 로그인한 회원만 보낼 수 있어 보호 경로에 둔다. */
export default function FeedbackPage() {
  return <FeedbackContainer />;
}
