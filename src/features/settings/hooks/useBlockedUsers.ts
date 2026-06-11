"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getBlockedUsers, unblockUser } from "@/features/settings/api/settingsApi";
import type { BlockedUser } from "@/features/settings/model/types";

type UseBlockedUsersResult = {
  blockedUsers: BlockedUser[];
  loading: boolean;
  error: Error | null;
  removeBlockedUser: (id: string) => Promise<boolean>;
};

export function useBlockedUsers(): UseBlockedUsersResult {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;

    setLoading(true);
    getBlockedUsers()
      .then((nextBlockedUsers) => {
        if (alive) setBlockedUsers(nextBlockedUsers);
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err : new Error("Failed to load blocked users"));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const sortedBlockedUsers = useMemo(
    () =>
      [...blockedUsers].sort(
        (left, right) => new Date(right.blockedAt).getTime() - new Date(left.blockedAt).getTime(),
      ),
    [blockedUsers],
  );

  const removeBlockedUser = useCallback(async (id: string) => {
    const previous = blockedUsers;
    setBlockedUsers((current) => current.filter((userItem) => userItem.id !== id));

    try {
      await unblockUser(id);
      return true;
    } catch {
      setBlockedUsers(previous);
      return false;
    }
  }, [blockedUsers]);

  return { blockedUsers: sortedBlockedUsers, loading, error, removeBlockedUser };
}
