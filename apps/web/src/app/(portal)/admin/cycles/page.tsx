"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import React from "react";
import { CalendarIcon, PageHeader, Panel, Pill, StatCard, TargetIcon } from "@/components/ui-shell";
import apiClient, { getApiErrorMessage } from "@/lib/apiClient";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const empty = { name: "", year: new Date().getFullYear(), startDate: "", endDate: "" };

export default function AdminCyclesPage() {
  useRequireAuth(["ADMIN_HR", "SUPER_ADMIN"]);
  const [cycles, setCycles] = React.useState<any[]>([]);
  const [filter, setFilter] = React.useState("ALL");
  const [editing, setEditing] = React.useState<any | null>(null);
  const [form, setForm] = React.useState(empty);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try { setCycles((await apiClient.get("/admin/cycles")).data); }
    catch (err) { setError(getApiErrorMessage(err, "Failed to load cycles")); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const openForm = (cycle?: any) => {
    setEditing(cycle || {});
    setForm(cycle ? { name: cycle.name, year: cycle.year, startDate: cycle.startDate.slice(0, 10), endDate: cycle.endDate.slice(0, 10) } : empty);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const { data } = editing?.id ? await apiClient.patch(`/admin/cycles/${editing.id}`, form) : await apiClient.post("/admin/cycles", form);
      setCycles((prev) => editing?.id ? prev.map((c) => c.id === data.id ? data : c) : [data, ...prev]);
      setEditing(null);
      setMessage(editing?.id ? "Cycle updated" : "Cycle created");
    } catch (err) { setError(getApiErrorMessage(err, "Failed to save cycle")); }
  };

  const setActive = async (cycle: any) => {
    if (!confirm(`Set '${cycle.name}' as the active cycle? This will allow employees to create goals.`)) return;
    try { await apiClient.patch(`/admin/cycles/${cycle.id}`, { status: "OPEN" }); await load(); setMessage("Cycle activated"); }
    catch (err) { setError(getApiErrorMessage(err, "Failed to activate cycle")); }
  };

  const toggleWindow = async (cycle: any, quarter: string) => {
    const existing = cycle.checkins?.find((w: any) => w.quarter === quarter);
    const isActive = !existing?.isActive;
    if (isActive && !confirm(`Activating ${quarter} window will allow employees to submit check-ins. Continue?`)) return;
    try {
      await apiClient.patch(`/admin/cycles/${cycle.id}/checkin-windows`, {
        quarter,
        opensAt: existing?.opensAt || cycle.startDate,
        closesAt: existing?.closesAt || cycle.endDate,
        isActive,
      });
      await load();
      setMessage(`${quarter} check-in window ${isActive ? "activated" : "deactivated"}`);
    } catch (err) { setError(getApiErrorMessage(err, "Failed to update window")); }
  };

  const visible = filter === "ALL" ? cycles : cycles.filter((c) => c.status === filter);

  return (
    <div>
      <PageHeader eyebrow="Admin control" title="Goal Cycles" description="Configure cycle windows, submission gates, and organization-wide goal governance." actions={<><button className="btn btn-secondary" onClick={() => openForm(cycles.find((c) => c.status === "OPEN" || c.status === "CHECKIN_OPEN"))}>Cycle Settings</button><button className="btn btn-primary" onClick={() => openForm()}>Create Cycle</button></>} />
      {message && <div className="mb-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3"><StatCard label="Active Cycles" value={cycles.filter((c) => c.status === "OPEN" || c.status === "CHECKIN_OPEN").length} sublabel="Currently active" accent="primary" icon={<CalendarIcon />} /><StatCard label="Participants" value={cycles.reduce((sum, c) => sum + (c.goalSheets?.length || 0), 0)} sublabel="Across cycles" accent="teal" icon={<TargetIcon />} /><StatCard label="Cycles" value={cycles.length} sublabel="Total configured" accent="success" icon={<TargetIcon />} /></div>
      <Panel>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-semibold">Cycle Registry</h2><p className="mt-1 text-sm text-muted-foreground">Operational view of active, locked, and upcoming goal cycles.</p></div><select className="field w-full sm:w-56" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="ALL">All cycle states</option><option>UPCOMING</option><option>OPEN</option><option>CHECKIN_OPEN</option><option>CLOSED</option></select></div>
        <div className="table-shell"><table><thead><tr><th>Cycle</th><th>Phase</th><th>Window</th><th>Participants</th><th>Actions</th></tr></thead><tbody>{visible.map((cycle) => <tr key={cycle.id}><td className="font-semibold">{cycle.name}</td><td><Pill tone={cycle.status === "OPEN" || cycle.status === "CHECKIN_OPEN" ? "primary" : cycle.status === "CLOSED" ? "success" : "muted"}>{cycle.status}</Pill></td><td className="font-mono text-xs text-muted-foreground">{new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}</td><td className="font-mono text-sm">{cycle.goalSheets?.length || 0}</td><td><div className="flex flex-wrap gap-2"><button className="btn btn-secondary min-h-8 px-2 text-xs" onClick={() => openForm(cycle)}>Edit</button><button className="btn btn-secondary min-h-8 px-2 text-xs" onClick={() => toggleWindow(cycle, "Q2")}>Toggle Q2</button><button className="btn btn-primary min-h-8 px-2 text-xs" onClick={() => setActive(cycle)}>Set Active</button></div></td></tr>)}</tbody></table></div>
      </Panel>
      {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><form onSubmit={save} className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-5 shadow-elevated"><div className="mb-4 flex justify-between"><h2 className="text-xl font-semibold">{editing.id ? "Edit Cycle" : "Create Cycle"}</h2><button type="button" className="btn btn-secondary min-h-8 px-2 text-xs" onClick={() => setEditing(null)}>Close</button></div><div className="space-y-4"><input className="field w-full" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><input className="field w-full" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /><input className="field w-full" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /><input className="field w-full" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /><button className="btn btn-primary w-full">Save</button></div></form></div>}
    </div>
  );
}
