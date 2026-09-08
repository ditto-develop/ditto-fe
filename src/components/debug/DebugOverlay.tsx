"use client";

/**
 * 임시 진단용 화면 오버레이.
 *
 * Safari 웹 인스펙터에 접근할 수 없는 상황에서 로그인 분기·홈 카드·프로필 로딩 실패 원인을
 * 앱 화면에서 바로 읽기 위한 것이다. 원인 파악이 끝나면 이 컴포넌트와 ClientLayout의 마운트,
 * debugLog.ts, 각 호출부의 debugLog() 를 통째로 제거한다.
 */

import { useEffect, useState } from "react";
import styled from "styled-components";
import { getAccessToken, isAccessTokenExpired } from "@/shared/lib/auth";
import {
  clearDebugLogEntries,
  getDebugLogEntries,
  subscribeDebugLog,
  type DebugLogEntry,
} from "@/shared/lib/debugLog";

// 디자인 토큰을 쓰지 않는다 — 제품 UI가 아니라 곧 삭제될 진단용 오버레이다.
// 하단 탭(MainBottomNav, 60px + safe-area)과 겹치면 실기기/E2E에서 "프로필" 탭 클릭을 가린다.
// 그 위로 띄운다.
const ToggleButton = styled.button`
  position: fixed;
  right: 8px;
  bottom: calc(60px + env(safe-area-inset-bottom, 0px) + 8px);
  z-index: 99999;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #ff5252;
  background: rgba(20, 20, 20, 0.85);
  color: #ff5252;
  font-size: 11px;
  font-family: monospace;
`;

const Panel = styled.div`
  position: fixed;
  left: 8px;
  right: 8px;
  bottom: calc(60px + env(safe-area-inset-bottom, 0px) + 44px);
  z-index: 99999;
  max-height: 50vh;
  overflow-y: auto;
  background: rgba(10, 10, 10, 0.92);
  color: #eee;
  font-family: monospace;
  font-size: 11px;
  line-height: 1.5;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #ff5252;
  white-space: pre-wrap;
  word-break: break-all;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  color: #ff5252;
  font-weight: bold;
`;

const ClearButton = styled.button`
  color: #ff5252;
  background: none;
  border: 1px solid #ff5252;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 10px;
`;

const Entry = styled.div`
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
`;

function readTokenSummary(): string {
  const token = getAccessToken();
  if (!token) return "accessToken 없음";
  return `accessToken 있음 (만료됨: ${isAccessTokenExpired()}, 앞 12자: ${token.slice(0, 12)}...)`;
}

function isCypressRuntime(): boolean {
  return typeof window !== "undefined" && "Cypress" in window;
}

export function DebugOverlay() {
  // 정적 export라 빌드 시점엔 window가 없어 isCypressRuntime()이 항상 false로 평가되고,
  // 그 결과 버튼 마크업이 정적 HTML에 그대로 박힌다(랜딩 페이지 스크롤 오버플로 원인이었다).
  // 마운트 이후에만 판정해 서버/빌드 산출물에는 아예 렌더하지 않는다(AppleLogin과 같은 패턴).
  const [shouldRender, setShouldRender] = useState(false);
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<DebugLogEntry[]>([]);
  const [tokenSummary, setTokenSummary] = useState("");

  useEffect(() => {
    setShouldRender(!isCypressRuntime());
  }, []);

  useEffect(() => {
    setEntries(getDebugLogEntries());
    return subscribeDebugLog(setEntries);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTokenSummary(readTokenSummary());
  }, [open]);

  if (!shouldRender) return null;

  return (
    <>
      <ToggleButton type="button" onClick={() => setOpen((v) => !v)}>
        DEBUG {entries.length > 0 ? `(${entries.length})` : ""}
      </ToggleButton>
      {open && (
        <Panel>
          <PanelHeader>
            <span>{tokenSummary}</span>
            <ClearButton type="button" onClick={clearDebugLogEntries}>
              지우기
            </ClearButton>
          </PanelHeader>
          {entries.length === 0 && <Entry>로그 없음</Entry>}
          {entries
            .slice()
            .reverse()
            .map((entry) => (
              <Entry key={entry.id}>
                [{entry.time}] {entry.message}
              </Entry>
            ))}
        </Panel>
      )}
    </>
  );
}
