"use client";

import { usePathname } from "next/navigation";
import { pageBgForPath } from "@/lib/theme/tabs";

export default function ThemedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const bg = pageBgForPath(pathname);
  return <div className={`min-h-screen transition-colors ${bg}`}>{children}</div>;
}
