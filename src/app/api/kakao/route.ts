// app/api/kakao/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

 try {
    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.NEXT_PUBLIC_KAKAO_JS_KEY!, // 서버 사이드 키 사용 (NEXT_PUBLIC 제거)
        redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!, // 서버 환경 변수 사용 권장
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.json({ error: "Token fetch failed", details: tokenData }, { status: 400 });
    }

    // 2. 액세스 토큰으로 유저 정보 조회
    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });

    const userData = await userResponse.json();

    // 3. 필요한 정보만 클라이언트로 전달
    return NextResponse.json({
      success: true,
      kakaoId: userData.id,
      nickname: userData.properties?.nickname,
      profileImage: userData.properties?.profile_image,
      email: userData.kakao_account?.email, // 이메일 동의 시
      gender: userData.kakao_account?.gender, // 성별 동의 시
    });

  } catch (error) {
    console.error("Kakao Login Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}