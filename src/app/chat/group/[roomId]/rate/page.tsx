import { GroupRatePageClient } from "./_components/GroupRatePageClient";

export function generateStaticParams() {
  return [{ roomId: "placeholder" }];
}

export default function GroupRatePage() {
  return <GroupRatePageClient />;
}
