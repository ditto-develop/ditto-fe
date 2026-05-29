const VOTE_CREATED_PREVIEW = "투표가 생성되었습니다!";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isVoteOpenedPayload(value: unknown): boolean {
  if (!isRecord(value)) return false;

  return (
    typeof value.voteId === "string" &&
    isRecord(value.placeSummary) &&
    isRecord(value.timeSummary)
  );
}

export function formatChatMessagePreview(content?: string | null): string {
  if (!content) return "";

  try {
    const parsed: unknown = JSON.parse(content);
    if (isVoteOpenedPayload(parsed)) {
      return VOTE_CREATED_PREVIEW;
    }
  } catch {
    return content;
  }

  return content;
}
