import { RecordDetailPageClient } from "./RecordDetailPageClient";

export function generateStaticParams() {
  return [{ quizSetId: "placeholder" }];
}

export default function RecordDetailPage() {
  return <RecordDetailPageClient />;
}
