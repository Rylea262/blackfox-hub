import ActivityFeed from "../activity-feed";

export default function OwnerDashboard() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-6 pt-6">
        <p className="text-sm text-neutral-500">Welcome back.</p>
      </div>
      <ActivityFeed />
    </>
  );
}
