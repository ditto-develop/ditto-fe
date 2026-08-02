import { ReportPageClient } from "./ReportPageClient";

export function generateStaticParams() {
  return [{ userId: "placeholder" }];
}

export default function ReportPage() {
  return <ReportPageClient />;
}
