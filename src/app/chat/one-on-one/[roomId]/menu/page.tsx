import ChatMenuPageClient from "./ChatMenuPageClient";

export function generateStaticParams() {
  return [{ roomId: "placeholder" }];
}

export default function ChatMenuPage() {
  return <ChatMenuPageClient />;
}
