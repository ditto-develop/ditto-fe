import { RatePageClient } from "./_components/RatePageClient";

export function generateStaticParams() {
  return [{ roomId: "placeholder" }];
}

export default function RatePage() {
  return <RatePageClient />;
}
