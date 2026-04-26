import ActivityFeed from "../activity-feed";
import Alerts from "../alerts";

export default function OfficeDashboard() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-6 pt-6">
        <p className="text-sm text-neutral-500">Welcome back.</p>
      </div>
      <Alerts />
      <ActivityFeed />
    </>
  );
}
