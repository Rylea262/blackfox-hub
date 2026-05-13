import Alerts from "./alerts";
import {
  RecentChangesQuadrant,
  RecentDocumentsQuadrant,
  RecentJobsQuadrant,
  RecentNotesQuadrant,
} from "./quadrants";

export default function DashboardGrid() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <p className="text-sm text-neutral-500">Welcome back.</p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <RecentJobsQuadrant />
        <RecentDocumentsQuadrant />
      </div>

      <div className="mt-4">
        <Alerts />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <RecentNotesQuadrant />
        <RecentChangesQuadrant />
      </div>
    </div>
  );
}
