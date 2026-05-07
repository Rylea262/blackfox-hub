"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TAB_THEME } from "@/lib/theme/tabs";

type Tab = { href: string; label: string; match: string };

export default function TabNav({
  dashboardHref,
  showNotes,
  showJobs,
  showEmployees,
  showInsurances,
  showServicing,
  showTools,
  showAssets,
  showSuppliers,
  showSubcontractors,
  showConcretePumps,
  showDocuments,
}: {
  dashboardHref: string;
  showNotes: boolean;
  showJobs: boolean;
  showEmployees: boolean;
  showInsurances: boolean;
  showServicing: boolean;
  showTools: boolean;
  showAssets: boolean;
  showSuppliers: boolean;
  showSubcontractors: boolean;
  showConcretePumps: boolean;
  showDocuments: boolean;
}) {
  const pathname = usePathname();

  const tabs: Tab[] = [
    { href: dashboardHref, label: "Dashboard", match: "/dashboard" },
  ];
  if (showNotes)
    tabs.push({ href: "/notes", label: "Notepad", match: "/notes" });
  if (showJobs) tabs.push({ href: "/jobs", label: "Jobs", match: "/jobs" });
  if (showEmployees)
    tabs.push({ href: "/employees", label: "Employees", match: "/employees" });
  if (showInsurances)
    tabs.push({
      href: "/insurances",
      label: "Insurances",
      match: "/insurances",
    });
  if (showServicing)
    tabs.push({
      href: "/servicing",
      label: "Servicing",
      match: "/servicing",
    });
  if (showTools)
    tabs.push({ href: "/tools", label: "Tools", match: "/tools" });
  if (showAssets)
    tabs.push({ href: "/assets", label: "Assets", match: "/assets" });
  if (showSuppliers)
    tabs.push({ href: "/suppliers", label: "Suppliers", match: "/suppliers" });
  if (showSubcontractors)
    tabs.push({
      href: "/subcontractors",
      label: "Subcontractors",
      match: "/subcontractors",
    });
  if (showConcretePumps)
    tabs.push({
      href: "/concrete-pumps",
      label: "Concrete Pumps",
      match: "/concrete-pumps",
    });
  if (showDocuments)
    tabs.push({ href: "/documents", label: "Documents", match: "/documents" });

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {tabs.map((t, i) => {
        const isActive = pathname.startsWith(t.match);
        const colour = TAB_THEME[i % TAB_THEME.length];
        return (
          <Link
            key={t.label}
            href={t.href}
            className={`rounded-full px-3 py-1 font-medium transition ${
              isActive ? colour.pillActive : colour.pillIdle
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
