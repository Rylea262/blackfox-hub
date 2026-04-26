"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; match: string };

export default function TabNav({
  dashboardHref,
  showJobs,
  showEmployees,
  showInsurances,
  showServicing,
}: {
  dashboardHref: string;
  showJobs: boolean;
  showEmployees: boolean;
  showInsurances: boolean;
  showServicing: boolean;
}) {
  const pathname = usePathname();

  const tabs: Tab[] = [
    { href: dashboardHref, label: "Dashboard", match: "/dashboard" },
  ];
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

  return (
    <div className="flex items-center gap-6 text-sm">
      {tabs.map((t) => {
        const isActive = pathname.startsWith(t.match);
        return (
          <Link
            key={t.label}
            href={t.href}
            className={
              isActive
                ? "border-b-2 border-black pb-1 font-semibold"
                : "border-b-2 border-transparent pb-1 text-neutral-600 hover:text-black"
            }
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
