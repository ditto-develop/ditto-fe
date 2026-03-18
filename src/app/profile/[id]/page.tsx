import ProfilePageClient from "./ProfilePageClient";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function ProfilePage() {
  return <ProfilePageClient />;
}
