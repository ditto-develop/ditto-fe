"use client";

import styled from "styled-components";
import { getBusinessInfoRows } from "@/shared/lib/businessInfo";

/**
 * 사업자 정보 표.
 *
 * 심사자가 값을 그대로 대조하는 화면이라 항목명(라벨)과 값을 한 줄씩 붙여 둔다.
 * 소재지처럼 긴 값이 잘리면 대조가 안 되므로 줄바꿈을 허용한다.
 */
export function BusinessInfoList() {
  const rows = getBusinessInfoRows();

  return (
    <List>
      {rows.map((row) => (
        <Row key={row.label}>
          <Label>{row.label}</Label>
          <Value>{row.value}</Value>
        </Row>
      ))}
    </List>
  );
}

const List = styled.dl`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin: 0;
  padding: var(--space-4) var(--space-5) var(--space-12);
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Label = styled.dt`
  margin: 0;
  font-size: var(--typography-label-2-font-size);
  font-weight: var(--typography-label-2-font-weight);
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const Value = styled.dd`
  margin: 0;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
  word-break: keep-all;
  overflow-wrap: anywhere;
`;
