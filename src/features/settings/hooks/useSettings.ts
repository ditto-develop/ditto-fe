"use client";

import { useCallback, useEffect, useState } from "react";
import { getExternalCurrentUser, type CurrentUserInfo } from "@/shared/lib/api/externalApi";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/features/settings/api/settingsApi";
import type { NotificationSettings, NotificationSettingKey } from "@/features/settings/model/types";

type UseSettingsResult = {
  currentUser: CurrentUserInfo | null;
  notificationSettings: NotificationSettings | null;
  loading: boolean;
  error: Error | null;
  updateSetting: (key: NotificationSettingKey, checked: boolean) => Promise<boolean>;
};

export function useSettings(): UseSettingsResult {
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;

    setLoading(true);
    Promise.all([getExternalCurrentUser(), getNotificationSettings()])
      .then(([nextCurrentUser, nextNotificationSettings]) => {
        if (!alive) return;
        setCurrentUser(nextCurrentUser);
        setNotificationSettings(nextNotificationSettings);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err : new Error("Failed to load settings"));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const updateSetting = useCallback(async (key: NotificationSettingKey, checked: boolean) => {
    let previous: NotificationSettings | null = null;

    setNotificationSettings((current) => {
      previous = current;
      return current ? { ...current, [key]: checked } : current;
    });

    try {
      const nextSettings = await updateNotificationSettings({ [key]: checked });
      setNotificationSettings(nextSettings);
      return true;
    } catch {
      setNotificationSettings(previous);
      return false;
    }
  }, []);

  return { currentUser, notificationSettings, loading, error, updateSetting };
}
