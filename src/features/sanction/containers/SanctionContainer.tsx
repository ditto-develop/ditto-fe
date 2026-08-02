"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";

import { getMySanction } from "@/features/sanction/api/sanctionApi";
import { readSanctionCallback } from "@/features/sanction/lib/sanctionFormat";
import type { EffectiveSanction, SanctionLevel } from "@/features/sanction/model/types";
import { SanctionNoticeView } from "@/features/sanction/ui/SanctionNoticeView";
import { logoutExternal } from "@/shared/lib/api/externalApi";
import { clearTokens } from "@/shared/lib/auth";

type NoticeState = {
  level: SanctionLevel;
  levelDescription: string;
  reasonDescription: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

function fromSanction(sanction: EffectiveSanction): NoticeState {
  return {
    level: sanction.level,
    levelDescription: sanction.levelDescription,
    reasonDescription: sanction.reasonDescription ?? null,
    startsAt: sanction.startsAt,
    endsAt: sanction.endsAt,
  };
}

/**
 * 제재 안내 화면.
 *
 * 두 경로로 진입한다.
 * 1) OAuth 콜백 — 토큰이 아예 발급되지 않으므로 쿼리(sanctionCode/suspendedUntil)만으로 렌더한다.
 * 2) 로그인된 세션에서 403(6006/6007) — 기존 토큰으로 내 제재 조회 API를 호출해 상세를 채운다.
 */
export function SanctionContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const callback = readSanctionCallback(new URLSearchParams(searchParams.toString()));

    // 콜백 진입: 토큰이 없어 API를 부를 수 없다. 쿼리 값만으로 안내한다.
    if (callback) {
      const banned = callback.sanctionCode === "MEMBER_BANNED";
      setNotice({
        level: banned ? "PERMANENT_BAN" : "SUSPENSION",
        levelDescription: banned ? "영구 차단" : "기간 이용 정지",
        reasonDescription: null,
        startsAt: null,
        endsAt: banned ? null : callback.suspendedUntil,
      });
      setLoading(false);
      return undefined;
    }

    let active = true;
    getMySanction()
      .then((data) => {
        if (!active) return;
        // 제재가 이미 해제됐다면 더 보여줄 게 없다. 홈으로 돌려보낸다.
        if (!data.sanction) {
          router.replace("/home");
          return;
        }
        setNotice(fromSanction(data.sanction));
      })
      .catch(() => {
        if (active) setNotice(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  const handleConfirm = async () => {
    // 제재 화면에서 나가면 세션을 정리하고 처음 화면으로 보낸다.
    await logoutExternal().catch(() => undefined);
    clearTokens();
    router.replace("/");
  };

  if (loading) return <StateText>제재 정보를 불러오는 중...</StateText>;

  if (!notice) {
    return (
      <SanctionNoticeView
        level="SUSPENSION"
        levelDescription="계정 이용이 제한됐어요"
        reasonDescription={null}
        startsAt={null}
        endsAt={null}
        onConfirm={handleConfirm}
        confirmLabel="처음으로"
      />
    );
  }

  return <SanctionNoticeView {...notice} onConfirm={handleConfirm} confirmLabel="처음으로" />;
}

const StateText = styled.p`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  margin: 0;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
  background-color: var(--color-semantic-background-normal-normal);
`;
