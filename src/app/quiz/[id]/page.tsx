import { QuizPageClient } from "./QuizPageClient";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function QuizPage() {
  return <QuizPageClient />;
}
