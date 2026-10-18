"use client";

import { useRouter } from "next/navigation";

import { WebDownloadView } from "@/features/download/ui/WebDownloadView";

/**
 * 웹 다운로드 안내(/download). ClientLayout 이 브라우저에서 막는 화면 대신에도 이걸 그린다.
 * 약관·고객 지원은 브라우저에서도 열리는 경로라 그대로 이동한다(`isWebOpenPath`).
 */
export function WebDownloadContainer() {
  const router = useRouter();

  return (
    <WebDownloadView
      onAndroidNotify={() => router.push("/download/android")}
      onOpenDocument={(path) => router.push(path)}
    />
  );
}
