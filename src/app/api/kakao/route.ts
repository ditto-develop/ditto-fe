// app/api/kakao/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

 try {
    // Log the values being used to help debug configuration issues
    console.log("--- Sending to Kakao ---");
    console.log("Using KAKAO_REST_API_KEY:", process.env.KAKAO_REST_API_KEY);
    console.log("Using KAKAO_REDIRECT_URI:", process.env.KAKAO_REDIRECT_URI);
    console.log("--------------------------");

    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_REST_API_KEY!,
        redirect_uri: process.env.KAKAO_REDIRECT_URI!,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log("Kakao Token Data:", tokenData);

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
    console.log("Kakao User Data:", userData);

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