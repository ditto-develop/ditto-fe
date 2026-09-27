import { Fragment } from "react";
import styled from "styled-components";

import { linkify } from "@/shared/lib/linkify";

export function ChatMessageText({ content }: { content: string }) {
  return linkify(content).map((part, index) =>
    part.type === "link" ? (
      <MessageLink key={index} href={part.href} target="_blank" rel="noopener noreferrer">
        {part.text}
      </MessageLink>
    ) : (
      <Fragment key={index}>{part.text}</Fragment>
    ),
  );
}

const MessageLink = styled.a`
  color: inherit;
  text-decoration: underline;
  overflow-wrap: anywhere;
`;
