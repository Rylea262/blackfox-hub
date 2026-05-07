"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  // Tailwind needs each colour class as a literal string in the source
  // so the JIT scanner picks them up — keep these palette entries
  // exactly as written below.
  const PALETTE = [
    {
      idle: "bg-blue-100 text-blue-900 hover:bg-blue-200",
      active: "bg-blue-600 text-white",
    },
    {
      idle: "bg-emerald-100 text-emerald-900 hover:bg-emerald-200",
      active: "bg-emerald-600 text-white",
    },
    {
      idle: "bg-amber-100 text-amber-900 hover:bg-amber-200",
      active: "bg-amber-600 text-white",
    },
    {
      idle: "bg-purple-100 text-purple-900 hover:bg-purple-200",
      active: "bg-purple-600 text-white",
    },
    {
      idle: "bg-rose-100 text-rose-900 hover:bg-rose-200",
      active: "bg-rose-600 text-white",
    },
    {
      idle: "bg-cyan-100 text-cyan-900 hover:bg-cyan-200",
      active: "bg-cyan-600 text-white",
    },
    {
      idle: "bg-teal-100 text-teal-900 hover:bg-teal-200",
      active: "bg-teal-600 text-white",
    },
    {
      idle: "bg-indigo-100 text-indigo-900 hover:bg-indigo-200",
      active: "bg-indigo-600 text-white",
    },
    {
      idle: "bg-fuchsia-100 text-fuchsia-900 hover:bg-fuchsia-200",
      active: "bg-fuchsia-600 text-white",
    },
    {
      idle: "bg-lime-100 text-lime-900 hover:bg-lime-200",
      active: "bg-lime-600 text-white",
    },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {tabs.map((t, i) => {
        const isActive = pathname.startsWith(t.match);
        const colour = PALETTE[i % PALETTE.length];
        return (
          <Link
            key={t.label}
            href={t.href}
            className={`rounded-full px-3 py-1 font-medium transition ${
              isActive ? colour.active : colour.idle
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
