"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import React from "react";
import { ChartIcon, ClockIcon, PageHeader, Panel, Pill, StatCard, TargetIcon, UsersIcon } from "@/components/ui-shell";
import { InfoTooltip } from "@/components/info-tooltip";
import apiClient, { getApiErrorMessage } from "@/lib/apiClient";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function AnalyticsPage() {
  useRequireAuth(["ADMIN_HR", "SUPER_ADMIN"]);
  const [cycles, setCycles] = React.useState<any[]>([]);
  const [cycleId, setCycleId] = React.useState("");
  const [quarter, setQuarter] = React.useState("Q2");
  const [overview, setOverview] = React.useState<any>(null);
  const [distribution, setDistribution] = React.useState<any>(null);
  const [trends, setTrends] = React.useState<any[]>([]);
  const [managers, setManagers] = React.useState<any[]>([]);
  const [tab, setTab] = React.useState("overview");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiClient.get("/admin/cycles").then(({ data }) => {
      setCycles(data);
      setCycleId(data.find((c: any) => c.status === "OPEN" || c.status === "CHECKIN_OPEN")?.id || data[0]?.id || "");
    }).catch((err) => setError(getApiErrorMessage(err, "Failed to load cycles")));
  }, []);

  React.useEffect(() => {
    if (!cycleId) return;
    Promise.all([
      apiClient.get("/analytics/completion-rates", { params: { cycleId, quarter } }),
      apiClient.get("/analytics/goal-distribution", { params: { cycleId } }),
      apiClient.get("/analytics/qoq-trends", { params: { cycleId } }),
      apiClient.get("/analytics/manager-effectiveness", { params: { cycleId } }),
    ]).then(([o, d, t, m]) => {
      setOverview(o.data); setDistribution(d.data); setTrends(t.data.trends); setManagers(m.data.managers);
    }).catch((err) => setError(getApiErrorMessage(err, "Failed to load analytics")));
  }, [cycleId, quarter]);

  const downloadReport = async (format: "csv" | "xlsx") => {
    const response = await apiClient.get("/export/achievement-report", { params: { format, cycleId, quarter }, responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url; a.download = `atompulse-analytics-${quarter}.${format}`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader eyebrow="Admin intelligence" title="Analytics Dashboard" description="Org-wide goal completion rates, trends, distribution, and manager effectiveness." actions={<><select className="field" value={cycleId} onChange={(e) => setCycleId(e.target.value)}>{cycles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select className="field" value={quarter} onChange={(e) => setQuarter(e.target.value)}><option>Q1</option><option>Q2</option><option>Q3</option><option value="Q4_ANNUAL">Q4</option></select></>} />
      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <div className="mb-4 flex flex-wrap gap-2">{["overview", "distribution", "trends", "managers"].map((item) => <button key={item} className={`btn ${tab === item ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab(item)}>{item}</button>)}<button className="btn btn-secondary" onClick={() => downloadReport("csv")}>Export CSV</button><button className="btn btn-secondary" onClick={() => downloadReport("xlsx")}>Export XLSX</button></div>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Employees" value={overview?.totalEmployees ?? 0} sublabel={<span className="inline-flex items-center gap-2">In selected cycle <InfoTooltip label="Employee count help" content="This count reflects active users in the selected cycle and is intended to match the working population seen in the goal and check-in workflows." /></span>} accent="primary" icon={<UsersIcon />} />
        <StatCard label="Submitted" value={overview?.submitted ?? 0} sublabel={<span className="inline-flex items-center gap-2">Goal sheets <InfoTooltip label="Submitted sheets help" content="Submitted sheets are those awaiting or completed manager review. They are the main numerator in completion dashboards." /></span>} accent="success" icon={<TargetIcon />} />
        <StatCard label="Approved" value={overview?.approved ?? 0} sublabel={<span className="inline-flex items-center gap-2">Locked/aligned <InfoTooltip label="Approved sheets help" content="Approved sheets are locked for editing and count toward governance completion. They should match the cycle approval traceability rules." /></span>} accent="warning" icon={<ClockIcon />} />
        <StatCard label="Avg Progress" value={<span>{Math.round(overview?.avgProgressScore || 0)}<span className="text-2xl text-muted-foreground/70">%</span></span>} sublabel={<span className="inline-flex items-center gap-2">Check-in score <InfoTooltip label="Average progress help" content="Average progress combines quarter check-in progress values across active goals and is used to visualize delivery momentum at a glance." /></span>} accent="violet" icon={<ChartIcon />} />
      </div>

      {tab === "overview" && <Panel><h2 className="mb-4 text-xl font-semibold">Department Completion</h2><div className="table-shell"><table><thead><tr><th>Department</th><th>Employees</th><th>Submitted</th><th>Approved</th><th>Avg Score</th></tr></thead><tbody>{overview?.byDepartment?.map((d: any) => <tr key={d.departmentId}><td>{d.departmentName}</td><td>{d.totalEmployees}</td><td>{d.submitted}</td><td>{d.approved}</td><td>{Math.round(d.avgScore)}%</td></tr>)}</tbody></table></div></Panel>}
      {tab === "distribution" && <div className="grid gap-6 lg:grid-cols-2"><Panel><h2 className="text-xl font-semibold">By Thrust Area</h2><div className="mt-5 space-y-3">{distribution?.byThrustArea?.map((item: any) => <div key={item.thrustAreaName}><div className="mb-1 flex justify-between text-sm"><span>{item.thrustAreaName}</span><span>{item.count}</span></div><div className="h-3 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, item.count * 12)}%` }} /></div></div>)}</div></Panel><Panel><h2 className="text-xl font-semibold">By UOM Type</h2><div className="mt-5 space-y-3">{distribution?.byUomType?.map((item: any) => <div key={item.uomTypeName} className="flex items-center justify-between"><span>{item.uomTypeName}</span><Pill tone="primary">{item.onTrack} on track / {item.completed} done</Pill></div>)}</div></Panel></div>}
      {tab === "trends" && <Panel><h2 className="mb-5 text-xl font-semibold">QoQ Trends</h2><div className="space-y-4">{trends.map((row) => <div key={row.departmentName} className="grid grid-cols-[140px_1fr] gap-3"><div>{row.departmentName}</div><div className="grid grid-cols-4 gap-2">{["q1Score","q2Score","q3Score","q4Score"].map((q) => <div key={q} className="rounded-lg bg-white/[0.04] p-3 text-center font-mono text-xs">{Math.round(row[q] || 0)}%</div>)}</div></div>)}</div></Panel>}
      {tab === "managers" && <Panel><h2 className="mb-5 text-xl font-semibold">Manager Effectiveness</h2><div className="space-y-4">{managers.map((m) => <div key={m.managerId} className="grid grid-cols-[160px_1fr_56px] items-center gap-3"><div>{m.managerName}</div><div className="h-3 rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-destructive to-teal" style={{ width: `${m.completionRate}%` }} /></div><div className="font-mono text-xs">{Math.round(m.completionRate)}%</div></div>)}</div></Panel>}
    </div>
  );
}
