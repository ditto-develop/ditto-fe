import { Fragment } from "react";
import styled from "styled-components";

export function ChatMessageText({ content }: { content: string }) {
  return content.split(/(https?:\/\/[^\s<>]+)/gi).map((part, index) => {
    if (!/^https?:\/\//i.test(part)) return <Fragment key={index}>{part}</Fragment>;
    const url = part.replace(/[.,!?;:)}\]]+$/, "");
    return (
      <Fragment key={index}>
        <MessageLink href={url} target="_blank" rel="noopener noreferrer">{url}</MessageLink>
        {part.slice(url.length)}
      </Fragment>
    );
  });
}

const MessageLink = styled.a`
  color: inherit;
  text-decoration: underline;
  overflow-wrap: anywhere;
`;
