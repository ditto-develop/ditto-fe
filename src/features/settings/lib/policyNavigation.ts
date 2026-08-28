import { hasValidSession } from "@/shared/lib/auth";

/**
 * 약관·방침 화면의 뒤로가기 목적지.
 *
 * 이 세 화면은 **비로그인으로도 열린다**(ClientLayout 공개 경로). 카카오 검수나
 * 앱스토어 심사처럼 링크로 바로 들어오는 경우가 있어서다. 그때 뒤로가기가
 * `/settings` 로 가면 보호 경로라 곧바로 로그인 화면으로 튕겨 나간다.
 *
 * 세션이 있으면 설정으로 돌아가고, 없으면 첫 화면으로 보낸다.
 */
export function getPolicyBackPath(): string {
    return hasValidSession() ? "/settings" : "/";
}
