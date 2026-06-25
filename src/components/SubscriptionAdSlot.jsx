import AdBanner from "./AdBanner.jsx";
import { useEntitlements } from "../hooks/useEntitlements.js";

export default function SubscriptionAdSlot() {
  const { entitlements } = useEntitlements();
  if (!entitlements.showAds) return null;
  return <SubscriptionAdSlotInner />;
}

function SubscriptionAdSlotInner() {
  return <AdBanner className="mt-6" />;
}
