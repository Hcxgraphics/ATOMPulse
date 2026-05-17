"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import React from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import apiClient from "@/lib/apiClient";
import { ArrowIcon, CheckIcon, ClockIcon, DashboardIcon, Panel, Pill, StatCard, TargetIcon } from "@/components/ui-shell";

export default function DashboardPage() {
  const { user } = useRequireAuth();
  const router = useRouter();
  const [sheet, setSheet] = React.useState<any>(null);
  const [checkins, setCheckins] = React.useState<any[]>([]);
  const [teamSheets, setTeamSheets] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!user) return;
    if (user.role === "MANAGER_L1") {
      apiClient.get("/goal-sheets", { params: { managerId: "me" } }).then(({ data }) => setTeamSheets(data)).catch(() => null);
    }
    apiClient.get("/goal-sheets", { params: { employeeId: "me", cycleId: "current" } }).then(async ({ data }) => {
      setSheet(data);
      if (data?.id) setCheckins((await apiClient.get("/checkins", { params: { goalSheetId: data.id, quarter: "Q2" } })).data);
    }).catch(() => null);
  }, [user]);

  if (!user) return null;
  const goals = sheet?.goals || [];
  const byGoal = new Map(checkins.map((c) => [c.goalId, c]));
  const avgProgress = checkins.length ? checkins.reduce((sum, c) => sum + (c.progressScore || 0), 0) / checkins.length : 0;
  const pendingCheckins = goals.filter((g: any) => !byGoal.get(g.id) || byGoal.get(g.id)?.status === "NOT_STARTED").length;
  const isManager = ["MANAGER_L1", "ADMIN_HR", "SUPER_ADMIN"].includes(user.role);

  return (
    <div>
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-border/80 bg-card/70 p-6 shadow-elevated backdrop-blur-xl sm:p-8">
        <div className="absolute -right-24 -top-28 h-64 w-64 rounded-full gradient-primary opacity-20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div><div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"><span className="h-px w-8 bg-teal" />Q2 2026 Performance Cycle</div><h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">Hello, <span className="gradient-text">{user.name}</span></h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Keep goals aligned, approvals moving, and progress visible across the current cycle.</p></div>
          <div className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-warning/15 text-warning"><ClockIcon /></div><div><div className="text-xs uppercase tracking-wider text-muted-foreground">Window closes in</div><div className="font-mono text-xl font-semibold">12d 04h</div></div><button className="ml-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-glow hover:text-foreground" onClick={() => router.push("/checkins")}>View <ArrowIcon /></button></div>
        </div>
      </section>
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={isManager ? "Pending Approvals" : "Goals Total"} value={isManager ? teamSheets.filter((s) => s.status === "SUBMITTED").length : goals.length} sublabel={isManager ? "Ready for review" : "Current sheet"} accent="primary" icon={<TargetIcon />} />
        <StatCard label={isManager ? "Approved Sheets" : "Locked / Approved"} value={isManager ? teamSheets.filter((s) => ["APPROVED", "LOCKED"].includes(s.status)).length : goals.filter((g: any) => g.status === "LOCKED").length} sublabel="This cycle" accent="success" icon={<CheckIcon />} />
        <StatCard label={isManager ? "Team Size" : "Avg Progress"} value={isManager ? teamSheets.length : <span>{Math.round(avgProgress)}<span className="text-2xl text-muted-foreground/70">%</span></span>} sublabel={isManager ? "Direct sheets" : "Q2 check-ins"} accent="teal" icon={<DashboardIcon />} />
        <StatCard label="Pending Check-ins" value={pendingCheckins} sublabel="Need updates" accent="warning" icon={<ClockIcon />} />
      </div>
      <div className="mb-5 flex items-end justify-between gap-4"><div><div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">My Goals - Current Cycle</div><h2 className="text-2xl font-semibold tracking-tight">Active commitments</h2></div><div className="font-mono text-xs text-muted-foreground">{goals.length} active</div></div>
      <div className="space-y-3">{goals.map((goal: any) => { const c = byGoal.get(goal.id); const progress = Math.round(c?.progressScore || 0); return <Panel key={goal.id} className="transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"><div className="grid grid-cols-12 items-center gap-4"><div className="col-span-12 flex items-center gap-3 md:col-span-5"><span className={`status-dot ${progress >= 100 ? "dot-success" : progress > 0 ? "dot-primary" : "dot-warning"}`} /><div><div className="flex flex-wrap items-center gap-2 font-semibold">{goal.title}<Pill tone="muted">{goal.thrustArea?.name || "Goal"}</Pill></div><div className="mt-1 text-xs text-muted-foreground">{goal.status} - Weightage {goal.weightage}%</div></div></div><div className="col-span-10 md:col-span-6"><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div></div><div className="col-span-2 text-right font-mono text-sm tabular-nums md:col-span-1">{progress}%</div></div></Panel>; })}{goals.length === 0 && <Panel>No goals yet. Create your goal sheet from My Goals.</Panel>}</div>
    </div>
  );
}
