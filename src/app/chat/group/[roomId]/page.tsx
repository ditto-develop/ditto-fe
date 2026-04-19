import { GroupChatRoomPageClient } from "./_components/GroupChatRoomPageClient";

export function generateStaticParams() {
  return [{ roomId: "placeholder" }];
}

export default function GroupChatRoomPage() {
  return <GroupChatRoomPageClient />;
}
