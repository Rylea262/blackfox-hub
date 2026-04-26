import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const SOON_DAYS = 30;
const HOURS_WARNING_THRESHOLD = 50;

function isoDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type Status = "expired" | "soon";

function dateStatus(iso: string | null): Status | "ok" {
  if (!iso) return "ok";
  const today = isoDateOnly(new Date());
  if (iso < today) return "expired";
  const soon = isoDateOnly(new Date(Date.now() + SOON_DAYS * 86400000));
  if (iso <= soon) return "soon";
  return "ok";
}

function hoursStatus(
  current: number | null,
  next: number | null,
): Status | "ok" {
  if (current == null || next == null) return "ok";
  const remaining = next - current;
  if (remaining <= 0) return "expired";
  if (remaining < HOURS_WARNING_THRESHOLD) return "soon";
  return "ok";
}

type Alert = {
  key: string;
  kind: "Insurance" | "Service";
  status: Status;
  title: string;
  detail: string;
  href: string;
};

export default async function Alerts() {
  const supabase = createClient();
  const cutoff = isoDateOnly(
    new Date(Date.now() + SOON_DAYS * 86400000),
  );

  const [insRes, svcRes, plantRes] = await Promise.all([
    supabase
      .from("insurances")
      .select("id, name, expiry_date")
      .not("expiry_date", "is", null)
      .lte("expiry_date", cutoff)
      .order("expiry_date", { ascending: true }),
    supabase
      .from("servicing")
      .select("id, next_service_date, assets(id, name)")
      .not("next_service_date", "is", null)
      .lte("next_service_date", cutoff)
      .order("next_service_date", { ascending: true }),
    supabase
      .from("assets")
      .select("id, name, current_hours, next_service_hours")
      .eq("type", "plant")
      .not("current_hours", "is", null)
      .not("next_service_hours", "is", null),
  ]);

  const alerts: Alert[] = [];

  for (const i of insRes.data ?? []) {
    const status = dateStatus(i.expiry_date);
    if (status === "ok") continue;
    alerts.push({
      key: `ins-${i.id}`,
      kind: "Insurance",
      status,
      title: i.name,
      detail: status === "expired" ? "Expired" : "Expires within 30 days",
      href: "/insurances",
    });
  }

  // Dedupe servicing alerts by asset; only flag the soonest upcoming per asset.
  const seenAssets = new Set<string>();
  for (const s of svcRes.data ?? []) {
    const asset = Array.isArray(s.assets)
      ? (s.assets as { id: string; name: string }[])[0]
      : (s.assets as { id: string; name: string } | null);
    if (!asset || seenAssets.has(asset.id)) continue;
    seenAssets.add(asset.id);
    const status = dateStatus(s.next_service_date);
    if (status === "ok") continue;
    alerts.push({
      key: `svc-date-${asset.id}`,
      kind: "Service",
      status,
      title: asset.name,
      detail:
        status === "expired" ? "Service overdue" : "Service due within 30 days",
      href: "/servicing",
    });
  }

  for (const a of plantRes.data ?? []) {
    if (seenAssets.has(a.id)) continue; // already flagged via date alert
    const status = hoursStatus(a.current_hours, a.next_service_hours);
    if (status === "ok") continue;
    const remaining =
      (a.next_service_hours as number) - (a.current_hours as number);
    alerts.push({
      key: `svc-hrs-${a.id}`,
      kind: "Service",
      status,
      title: a.name,
      detail:
        status === "expired"
          ? `Service overdue (${-remaining} hrs over)`
          : `Service in ${remaining} hrs`,
      href: "/servicing",
    });
  }

  // Expired ones first, then upcoming.
  alerts.sort((x, y) => {
    if (x.status !== y.status) return x.status === "expired" ? -1 : 1;
    return x.title.localeCompare(y.title);
  });

  if (alerts.length === 0) return null;

  return (
    <section className="mx-auto max-w-3xl px-6 pt-6">
      <h2 className="text-lg font-semibold">Needs attention</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Insurances and services that are expired or due soon.
      </p>
      <ul className="mt-2 space-y-1.5">
        {alerts.map((a) => (
          <li key={a.key}>
            <Link
              href={a.href}
              className={`flex items-center justify-between gap-3 rounded border px-3 py-2 text-sm hover:bg-white/40 ${
                a.status === "expired"
                  ? "border-red-300 bg-red-50"
                  : "border-orange-300 bg-orange-50"
              }`}
            >
              <span className="flex min-w-0 items-baseline gap-2">
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                    a.status === "expired"
                      ? "bg-red-200 text-red-800"
                      : "bg-orange-200 text-orange-800"
                  }`}
                >
                  {a.kind === "Insurance" ? "INS" : "SVC"}
                </span>
                <span className="truncate font-medium">{a.title}</span>
              </span>
              <span
                className={`shrink-0 text-xs ${
                  a.status === "expired" ? "text-red-700" : "text-orange-700"
                }`}
              >
                {a.detail}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
