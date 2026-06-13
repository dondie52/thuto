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
    <div className="-mx-4 min-h-[calc(100vh-7rem)] bg-gradient-to-b from-teal-50 via-white to-white sm:min-h-0">
      <FeedTopBar onRefresh={handleRefresh} messageCount={messageCount} notificationCount={notificationCount} />
      <div className="relative z-0">
        <Outlet context={{ registerRefresh, reloadBadges: loadBadgeCounts }} />
      </div>
    </div>
  );
}
