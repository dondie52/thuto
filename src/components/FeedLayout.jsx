import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import FeedTopBar from "./FeedTopBar.jsx";
import { useAuth } from "../lib/auth.jsx";
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

  function handleRefresh() {
    refreshRef.current?.();
    loadBadgeCounts();
  }

  return (
    <div className="-mx-4 -my-4 min-h-[calc(100vh-7rem)] bg-gradient-to-b from-brand-50 via-teal-50/80 to-white px-4 py-4 sm:mx-auto sm:my-0 sm:w-full sm:max-w-2xl sm:rounded-[2rem] sm:px-5 sm:py-5">
      <FeedTopBar onRefresh={handleRefresh} messageCount={messageCount} notificationCount={notificationCount} />
      <Outlet context={{ registerRefresh, reloadBadges: loadBadgeCounts }} />
    </div>
  );
}
