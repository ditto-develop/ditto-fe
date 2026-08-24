import { ReportPageClient } from "./ReportPageClient";

/**
 * 신고 화면. 대상 회원은 `?userId=` 쿼리로 받는다.
 *
 * 동적 세그먼트(`/report/[userId]`)를 쓰면 `output: 'export'`가 generateStaticParams의
 * 더미값 페이지 하나만 만들어 낸다. 실제 id 경로는 S3에 객체가 없어 CloudFront 404
 * 폴백(루트 index.html)이 떨어지고, 주소창만 /report/12/ 인 채 앱 첫 화면이 뜬다.
 * 쿼리 파라미터는 정적 라우트 하나로 끝나므로 하드 로드·클라이언트 내비게이션 모두 안전하다.
 */
export default function ReportPage() {
  return <ReportPageClient />;
}
