"use client";

import styled from "styled-components";
import type { PolicyBlock } from "@/features/settings/model/types";

type PolicyDocumentProps = {
  blocks: PolicyBlock[];
};

export function PolicyDocument({ blocks }: PolicyDocumentProps) {
  return (
    <Document>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === "heading") {
          if (block.level === 1) return <Title key={key}>{block.text}</Title>;
          return <Heading key={key}>{block.text}</Heading>;
        }

        if (block.type === "orderedList") {
          return (
            <OrderedList key={key}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </OrderedList>
          );
        }

        if (block.type === "bulletList") {
          return (
            <BulletList key={key}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </BulletList>
          );
        }

        if (block.type === "table") {
          return (
            <TableScroller key={key}>
              <Table>
                <thead>
                  <tr>
                    {block.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row) => (
                    <tr key={row.join("-")}>
                      {row.map((cell) => (
                        <td key={cell}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableScroller>
          );
        }

        if (block.type === "note") {
          return <Note key={key}>{block.text}</Note>;
        }

        return <Paragraph key={key}>{block.text}</Paragraph>;
      })}
    </Document>
  );
}

const Document = styled.article`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-12);
`;

const Title = styled.h1`
  margin: 0 0 var(--space-2);
  font-size: var(--typography-heading-1-font-size);
  font-weight: var(--typography-heading-1-font-weight);
  line-height: var(--typography-heading-1-line-height);
  letter-spacing: var(--typography-heading-1-letter-spacing);
  color: var(--color-semantic-label-strong);
`;

const Heading = styled.h2`
  margin: var(--space-4) 0 0;
  font-size: var(--typography-headline-2-font-size);
  font-weight: var(--typography-headline-2-font-weight);
  line-height: var(--typography-headline-2-line-height);
  letter-spacing: var(--typography-headline-2-letter-spacing);
  color: var(--color-semantic-label-strong);
`;

const Paragraph = styled.p`
  margin: 0;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
  white-space: pre-wrap;
`;

const Note = styled(Paragraph)`
  color: var(--color-semantic-label-alternative);
`;

const OrderedList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding-left: var(--space-5);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const BulletList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding-left: var(--space-5);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const TableScroller = styled.div`
  width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
  border: 1px solid var(--color-semantic-line-normal-neutral);
  border-radius: var(--radius-radi-4);
`;

const Table = styled.table`
  width: 100%;
  min-width: var(--space-80);
  border-collapse: collapse;
  font-size: var(--typography-label-2-font-size);
  font-weight: var(--typography-label-2-font-weight);
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-normal);

  th,
  td {
    padding: var(--space-2);
    border-bottom: 1px solid var(--color-semantic-line-normal-alternative);
    text-align: left;
    vertical-align: top;
  }

  th {
    font-weight: var(--typography-label-1-normal-font-weight);
    color: var(--color-semantic-label-strong);
    background-color: var(--color-semantic-background-normal-alternative);
  }

  tr:last-child td {
    border-bottom: 0;
  }
`;
