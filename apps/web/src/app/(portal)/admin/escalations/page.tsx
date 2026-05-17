"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React from "react";
import { useAuthStore } from "@/lib/store";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AlertIcon, ArrowIcon, ClockIcon, PageHeader, Panel, Pill, ShieldIcon, StatCard } from "@/components/ui-shell";

type Escalation = {
  id: string;
  reason: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  escalationLevel: number;
  triggeredAt: string;
  resolvedAt: string | null;
  notes: string | null;
  employee: { id: string; name: string; email: string; department: string };
  owner: string;
  cycle: string | null;
  goalSheetStatus: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function EscalationsPage() {
  useRequireAuth(["ADMIN_HR", "SUPER_ADMIN"]);
  const token = useAuthStore(state => state.token);
  const [rows, setRows] = React.useState<Escalation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadEscalations = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/escalations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Unable to load escalations (${res.status})`);
      setRows(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load escalations");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    loadEscalations();
  }, [loadEscalations]);

  const updateEscalation = async (id: string, action: "escalate" | "resolve" | "dismiss") => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/escalations/${id}/${action}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notes: `Marked ${action} from admin console` }),
    });
    if (!res.ok) {
      setError(`Unable to ${action} escalation (${res.status})`);
      return;
    }
    await loadEscalations();
  };

  const pending = rows.filter(row => row.status === "PENDING");
  const highestLevel = rows.reduce((max, row) => Math.max(max, row.escalationLevel), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Governance queue"
        title="Escalations"
        description="Track overdue reviews, unresolved approvals, and escalation levels."
        actions={<button className="btn btn-secondary" onClick={loadEscalations}>Refresh</button>}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={pending.length} sublabel="Awaiting action" accent="warning" icon={<AlertIcon />} />
        <StatCard label="Highest Level" value={`L${highestLevel || 0}`} sublabel="Current queue" accent="destructive" icon={<ShieldIcon />} />
        <StatCard label="Resolved" value={rows.filter(row => row.status === "RESOLVED").length} sublabel="Closed exceptions" accent="success" icon={<ClockIcon />} />
      </div>

      <Panel>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold">Exception Register</h2>
            <p className="mt-1 text-sm text-muted-foreground">Connected to `/api/escalations`.</p>
          </div>
          {error && <Pill tone="danger">{error}</Pill>}
        </div>

        <div className="table-shell overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Level</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Triggered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground">Loading escalations...</td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground">No escalations found.</td>
                </tr>
              )}
              {!loading && rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono text-xs text-muted-foreground">{row.id.slice(-8).toUpperCase()}</td>
                  <td>
                    <div className="flex items-start gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-warning/30 bg-warning/10 text-warning">
                        <AlertIcon />
                      </div>
                      <div>
                        <div className="font-semibold">{row.reason}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {row.employee.name} - {row.employee.department}{row.cycle ? ` - ${row.cycle}` : ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><Pill tone={row.escalationLevel > 1 ? "danger" : "warning"}>L{row.escalationLevel}</Pill></td>
                  <td><Pill tone={row.status === "PENDING" ? "warning" : row.status === "RESOLVED" ? "success" : "muted"}>{row.status}</Pill></td>
                  <td className="text-sm">{row.owner}</td>
                  <td className="font-mono text-xs text-muted-foreground">{formatDate(row.triggeredAt)}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-primary min-h-8 px-2 text-xs" onClick={() => updateEscalation(row.id, "escalate")} disabled={row.status !== "PENDING"}>
                        Escalate <ArrowIcon />
                      </button>
                      <button className="btn btn-secondary min-h-8 px-2 text-xs" onClick={() => updateEscalation(row.id, "resolve")} disabled={row.status !== "PENDING"}>
                        Resolve
                      </button>
                      <button className="btn min-h-8 border-border/70 bg-white/[0.04] px-2 text-xs text-muted-foreground" onClick={() => confirm("Dismiss this escalation? It will be marked as resolved with no further action.") && updateEscalation(row.id, "dismiss")} disabled={row.status !== "PENDING"}>
                        Dismiss
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
