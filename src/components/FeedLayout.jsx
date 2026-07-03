import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { registerFeedRefresh } from "../lib/feedRefresh.js";
import { fetchUnreadMessageCount } from "../lib/messaging.js";
import { fetchUnreadNotificationCount } from "../lib/notifications.js";

export default function FeedLayout() {
  const { user } = useAuth();
  const refreshRef = useRef(null);
  const [messageCount, setMessageCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  const registerRefresh = useCallback((fn) => {
    refreshRef.current = fn;
    return () => {
      if (refreshRef.current === fn) refreshRef.current = null;
    };
  }, []);

  const loadBadgeCounts = useCallback(async () => {
    if (!user?.id) {
      setMessageCount(0);
      setNotificationCount(0);
      return;
    }
    const [messages, notifications] = await Promise.all([
      fetchUnreadMessageCount().catch(() => 0),
      fetchUnreadNotificationCount().catch(() => 0),
    ]);
    setMessageCount(messages);
    setNotificationCount(notifications);
  }, [user?.id]);

  useEffect(() => {
    loadBadgeCounts();
    const interval = window.setInterval(loadBadgeCounts, 60_000);
    return () => window.clearInterval(interval);
  }, [loadBadgeCounts]);

  useEffect(() => {
    return registerFeedRefresh(() => {
      refreshRef.current?.();
      loadBadgeCounts();
    });
  }, [loadBadgeCounts]);

  return (
    <div className="-mx-4 flex min-h-full flex-1 flex-col bg-white">
      <Outlet context={{ registerRefresh, reloadBadges: loadBadgeCounts, messageCount, notificationCount }} />
    </div>
  );
}
