"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
  background-color: var(--color-semantic-background-normal-normal);
`;

const Card = styled.div`
  width: 360px;
  padding: 40px 32px;
  border-radius: 16px;
  background-color: var(--color-semantic-background-normal-alternative);
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Title = styled.h1`
  font-size: var(--typography-heading-2-font-size);
  font-weight: 700;
  color: var(--color-semantic-label-strong);
  margin: 0;
  text-align: center;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: var(--color-semantic-accent-background-violet);
  color: var(--color-semantic-background-normal-normal);
  font-size: var(--typography-caption-2-font-size);
  font-weight: 600;
  margin-left: 8px;
  vertical-align: middle;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Label = styled.label`
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  color: var(--color-semantic-label-alternative);
  display: block;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--color-semantic-line-normal-normal);
  background-color: var(--color-semantic-background-normal-normal);
  color: var(--color-semantic-label-strong);
  font-size: var(--typography-body-2-normal-font-size);
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: var(--color-semantic-accent-background-violet);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  border: none;
  background-color: var(--color-semantic-accent-background-violet);
  color: var(--color-semantic-background-normal-normal);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.p`
  font-size: var(--typography-label-2-font-size);
  color: var(--color-semantic-status-negative);
  text-align: center;
  margin: 0;
`;

const HintBox = styled.div`
  padding: 12px 14px;
  border-radius: 10px;
  background-color: var(--color-semantic-background-normal-normal);
  border: 1px solid var(--color-semantic-line-normal-normal);
`;

const HintText = styled.p`
  font-size: var(--typography-caption-1-font-size);
  color: var(--color-semantic-label-alternative);
  margin: 0;
  line-height: 1.6;
`;

const BlockedContainer = styled.div`
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
  background-color: var(--color-semantic-background-normal-normal);
`;

const BlockedText = styled.p`
  font-size: var(--typography-body-1-normal-font-size);
  color: var(--color-semantic-label-strong);
`;

export default function LocalLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("localtest");
  const [password, setPassword] = useState("test1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocalhost, setIsLocalhost] = useState<boolean | null>(null);

  useEffect(() => {
    setIsLocalhost(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  }, []);

  if (isLocalhost === null) return null;

  if (!isLocalhost) {
    return (
      <BlockedContainer>
        <BlockedText>로컬 로그인은 localhost 환경에서만 사용 가능합니다.</BlockedText>
      </BlockedContainer>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:10000";
      const res = await fetch(`${apiBase}/api/users/local-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success && data.data?.accessToken) {
        localStorage.setItem("accessToken", data.data.accessToken);
        router.push("/home");
      } else {
        setError(data.error || "로그인에 실패했습니다.");
      }
    } catch {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Title>
          로컬 로그인
          <Badge>DEV ONLY</Badge>
        </Title>

        <Form onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="username">아이디</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              autoComplete="current-password"
            />
          </div>

          {error && <ErrorText>{error}</ErrorText>}

          <Button type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </Form>

        <HintBox>
          <HintText>
            테스트 계정<br />
            아이디: <strong>localtest</strong><br />
            비밀번호: <strong>test1234</strong>
          </HintText>
        </HintBox>
      </Card>
    </Container>
  );
}
