"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React from "react";
import { useAuthStore } from "@/lib/store";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { LockIcon, PageHeader, Panel, Pill, ScrollIcon, ShieldIcon, StatCard, TargetIcon, UserCogIcon } from "@/components/ui-shell";

type AuditLog = {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  actor: { id: string; name: string; email: string; role: string };
  target: string;
  cycle: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }).format(new Date(value));
}

function auditIcon(entityType: string) {
  if (entityType === "USER") return <UserCogIcon />;
  if (entityType === "CYCLE") return <LockIcon />;
  if (entityType === "GOAL") return <TargetIcon />;
  if (entityType === "GOAL_SHEET") return <ShieldIcon />;
  return <ScrollIcon />;
}

export default function AuditPage() {
  useRequireAuth(["ADMIN_HR", "SUPER_ADMIN"]);
  const token = useAuthStore(state => state.token);
  const [events, setEvents] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadAuditLogs = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/audit`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Unable to load audit logs (${res.status})`);
      setEvents(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const todayCount = events.filter(event => new Date(event.changedAt).toDateString() === new Date().toDateString()).length;

  return (
    <div>
      <PageHeader
        eyebrow="Immutable trail"
        title="Audit Logs"
        description="Governance trail of every approval, edit, and configuration change."
        actions={<button className="btn btn-secondary" onClick={loadAuditLogs}>Refresh</button>}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Events Loaded" value={events.length} sublabel="Latest 100 records" accent="primary" icon={<ScrollIcon />} />
        <StatCard label="Today" value={todayCount} sublabel="Changes recorded" accent="teal" icon={<ShieldIcon />} />
        <StatCard label="Actors" value={new Set(events.map(event => event.actor.id)).size} sublabel="Unique users" accent="violet" icon={<UserCogIcon />} />
      </div>

      <Panel>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold">Activity Timeline</h2>
            <p className="mt-1 text-sm text-muted-foreground">Connected to `/api/audit`.</p>
          </div>
          {error && <Pill tone="danger">{error}</Pill>}
        </div>

        <div className="relative">
          <div className="absolute bottom-2 left-[19px] top-2 w-px bg-gradient-to-b from-primary/50 via-border to-transparent" />
          <div className="space-y-5">
            {loading && <div className="rounded-xl border border-border/70 bg-white/[0.04] p-4 text-sm text-muted-foreground">Loading audit logs...</div>}
            {!loading && events.length === 0 && <div className="rounded-xl border border-border/70 bg-white/[0.04] p-4 text-sm text-muted-foreground">No audit logs found.</div>}
            {!loading && events.map((event) => (
              <article key={event.id} className="relative flex items-start gap-4">
                <div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary-glow">
                  {auditIcon(event.entityType)}
                </div>
                <div className="flex-1 rounded-xl border border-border/80 bg-white/[0.045] p-4 transition hover:border-primary/40 hover:shadow-glow">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm">
                      <span className="font-semibold">{event.actor.name}</span>{" "}
                      <span className="text-muted-foreground">changed</span>{" "}
                      <span className="font-semibold">{event.fieldName}</span>{" "}
                      <span className="text-muted-foreground">on</span>{" "}
                      <span className="font-semibold">{event.target}</span>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">{formatTime(event.changedAt)}</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill tone="muted">{event.entityType}</Pill>
                    {event.cycle && <Pill tone="primary">{event.cycle}</Pill>}
                    <Pill tone="warning">{event.oldValue ?? "empty"} {"->"} {event.newValue ?? "empty"}</Pill>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}
