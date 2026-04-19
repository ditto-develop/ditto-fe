import { ChatRoomPageClient } from "./_components/ChatRoomPageClient";

export function generateStaticParams() {
  return [{ roomId: "placeholder" }];
}

export default function ChatRoomPage() {
  return <ChatRoomPageClient />;
}
