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

type AlertKind = "INS" | "SVC" | "REGO" | "EMP" | "TOOL" | "SUB";

type Alert = {
  key: string;
  kind: AlertKind;
  status: Status;
  title: string;
  detail: string;
  date: string | null;
  href: string;
};

function detailFor(status: Status, label: string, iso: string | null): string {
  if (status === "expired") {
    return iso ? `${label} expired ${iso}` : `${label} expired`;
  }
  return iso ? `${label} expires ${iso}` : `${label} expires soon`;
}

export default async function Alerts() {
  const supabase = createClient();
  const cutoff = isoDateOnly(
    new Date(Date.now() + SOON_DAYS * 86400000),
  );

  const [
    insRes,
    svcRes,
    plantRes,
    assetsRes,
    toolsRes,
    usersRes,
    subsRes,
  ] = await Promise.all([
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
    supabase
      .from("assets")
      .select("id, name, rego_due, next_service_due")
      .or(
        `and(rego_due.not.is.null,rego_due.lte.${cutoff}),and(next_service_due.not.is.null,next_service_due.lte.${cutoff})`,
      ),
    supabase
      .from("tools")
      .select("id, name, next_service_due")
      .not("next_service_due", "is", null)
      .lte("next_service_due", cutoff),
    supabase
      .from("users")
      .select("id, name, email, licence_expiry, white_card_expiry")
      .or(
        `and(licence_expiry.not.is.null,licence_expiry.lte.${cutoff}),and(white_card_expiry.not.is.null,white_card_expiry.lte.${cutoff})`,
      ),
    supabase
      .from("subcontractors")
      .select("id, name, public_liability_expiry, workcover_expiry")
      .or(
        `and(public_liability_expiry.not.is.null,public_liability_expiry.lte.${cutoff}),and(workcover_expiry.not.is.null,workcover_expiry.lte.${cutoff})`,
      ),
  ]);

  const alerts: Alert[] = [];

  for (const i of insRes.data ?? []) {
    const status = dateStatus(i.expiry_date);
    if (status === "ok") continue;
    alerts.push({
      key: `ins-${i.id}`,
      kind: "INS",
      status,
      title: i.name,
      detail: detailFor(status, "Insurance", i.expiry_date),
      date: i.expiry_date,
      href: "/insurances",
    });
  }

  // Dedupe servicing alerts by asset; only flag the soonest upcoming per asset.
  const seenServicingAssets = new Set<string>();
  for (const s of svcRes.data ?? []) {
    const asset = Array.isArray(s.assets)
      ? (s.assets as { id: string; name: string }[])[0]
      : (s.assets as { id: string; name: string } | null);
    if (!asset || seenServicingAssets.has(asset.id)) continue;
    seenServicingAssets.add(asset.id);
    const status = dateStatus(s.next_service_date);
    if (status === "ok") continue;
    alerts.push({
      key: `svc-date-${asset.id}`,
      kind: "SVC",
      status,
      title: asset.name,
      detail: detailFor(status, "Service", s.next_service_date),
      date: s.next_service_date,
      href: "/servicing",
    });
  }

  for (const a of plantRes.data ?? []) {
    if (seenServicingAssets.has(a.id)) continue;
    const status = hoursStatus(a.current_hours, a.next_service_hours);
    if (status === "ok") continue;
    const remaining =
      (a.next_service_hours as number) - (a.current_hours as number);
    alerts.push({
      key: `svc-hrs-${a.id}`,
      kind: "SVC",
      status,
      title: a.name,
      detail:
        status === "expired"
          ? `Service overdue (${-remaining} hrs over)`
          : `Service in ${remaining} hrs`,
      date: null,
      href: "/servicing",
    });
  }

  for (const a of assetsRes.data ?? []) {
    const regoStatus = dateStatus(a.rego_due);
    if (regoStatus !== "ok") {
      alerts.push({
        key: `rego-${a.id}`,
        kind: "REGO",
        status: regoStatus,
        title: a.name,
        detail: detailFor(regoStatus, "Rego", a.rego_due),
        date: a.rego_due,
        href: "/assets",
      });
    }
    if (!seenServicingAssets.has(a.id)) {
      const svcStatus = dateStatus(a.next_service_due);
      if (svcStatus !== "ok") {
        alerts.push({
          key: `asset-svc-${a.id}`,
          kind: "SVC",
          status: svcStatus,
          title: a.name,
          detail: detailFor(svcStatus, "Service", a.next_service_due),
          date: a.next_service_due,
          href: "/assets",
        });
      }
    }
  }

  for (const t of toolsRes.data ?? []) {
    const status = dateStatus(t.next_service_due);
    if (status === "ok") continue;
    alerts.push({
      key: `tool-${t.id}`,
      kind: "TOOL",
      status,
      title: t.name,
      detail: detailFor(status, "Service", t.next_service_due),
      date: t.next_service_due,
      href: "/tools",
    });
  }

  for (const u of usersRes.data ?? []) {
    const label = (u.name as string | null)?.trim() || (u.email as string | null) || "Employee";
    const licStatus = dateStatus(u.licence_expiry);
    if (licStatus !== "ok") {
      alerts.push({
        key: `lic-${u.id}`,
        kind: "EMP",
        status: licStatus,
        title: label,
        detail: detailFor(licStatus, "Licence", u.licence_expiry),
        date: u.licence_expiry,
        href: "/employees",
      });
    }
    const wcStatus = dateStatus(u.white_card_expiry);
    if (wcStatus !== "ok") {
      alerts.push({
        key: `wc-${u.id}`,
        kind: "EMP",
        status: wcStatus,
        title: label,
        detail: detailFor(wcStatus, "White Card", u.white_card_expiry),
        date: u.white_card_expiry,
        href: "/employees",
      });
    }
  }

  for (const s of subsRes.data ?? []) {
    const plStatus = dateStatus(s.public_liability_expiry);
    if (plStatus !== "ok") {
      alerts.push({
        key: `sub-pl-${s.id}`,
        kind: "SUB",
        status: plStatus,
        title: s.name,
        detail: detailFor(plStatus, "Public liability", s.public_liability_expiry),
        date: s.public_liability_expiry,
        href: "/subcontractors",
      });
    }
    const wcStatus = dateStatus(s.workcover_expiry);
    if (wcStatus !== "ok") {
      alerts.push({
        key: `sub-wc-${s.id}`,
        kind: "SUB",
        status: wcStatus,
        title: s.name,
        detail: detailFor(wcStatus, "Workcover", s.workcover_expiry),
        date: s.workcover_expiry,
        href: "/subcontractors",
      });
    }
  }

  // Expired first, then soonest upcoming, then title.
  alerts.sort((x, y) => {
    if (x.status !== y.status) return x.status === "expired" ? -1 : 1;
    if (x.date && y.date && x.date !== y.date) {
      return x.date < y.date ? -1 : 1;
    }
    if (x.date && !y.date) return -1;
    if (!x.date && y.date) return 1;
    return x.title.localeCompare(y.title);
  });

  if (alerts.length === 0) return null;

  return (
    <section className="mx-auto max-w-3xl px-6 pt-6">
      <h2 className="text-lg font-semibold">Needs attention</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Anything expired or due within the next {SOON_DAYS} days.
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
                  {a.kind}
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
