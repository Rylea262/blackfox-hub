import Alerts from "./alerts";
import DashboardGridClient from "./dashboard-grid-client";
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

      <DashboardGridClient
        slots={{
          jobs: <RecentJobsQuadrant />,
          documents: <RecentDocumentsQuadrant />,
          notes: <RecentNotesQuadrant />,
          changes: <RecentChangesQuadrant />,
        }}
        centre={<Alerts />}
      />
    </div>
  );
}
