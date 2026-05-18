"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization, react-hooks/purity */

import React from "react";
import { CheckIcon, ClockIcon, PageHeader, Panel, Pill, StatCard } from "@/components/ui-shell";
import { InfoTooltip } from "@/components/info-tooltip";
import apiClient, { getApiErrorMessage } from "@/lib/apiClient";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type Goal = { id: string; title: string; targetValue: number; uomType?: { formulaType: string; name: string } };
type Checkin = { id: string; goalId: string; quarter: string; plannedValue: number; actualValue: number | null; status: string; progressScore: number | null; submittedAt?: string | null };
type Window = { quarter: string; isActive: boolean; opensAt: string; closesAt: string };

const quarters = ["Q1", "Q2", "Q3", "Q4_ANNUAL"];

function computeScore(formula: string | undefined, target: number, actual: number | null) {
  if (actual === null || Number.isNaN(actual)) return 0;
  if (formula === "MIN") return Math.min((actual / target) * 100, 100);
  if (formula === "MAX") return actual > 0 ? Math.min((target / actual) * 100, 100) : 0;
  if (formula === "ZERO") return actual === 0 ? 100 : 0;
  return actual ? 100 : 0;
}

export default function CheckinsPage() {
  useRequireAuth(["EMPLOYEE", "ADMIN_HR", "SUPER_ADMIN"]);
  const [goalSheet, setGoalSheet] = React.useState<any>(null);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [checkins, setCheckins] = React.useState<Checkin[]>([]);
  const [windows, setWindows] = React.useState<Window[]>([]);
  const [activeQuarter, setActiveQuarter] = React.useState("Q2");
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const activeWindow = windows.find((item) => item.quarter === activeQuarter);
  const windowOpen = Boolean(activeWindow?.isActive);
  const byGoal = new Map(checkins.map((checkin) => [checkin.goalId, checkin]));
  const completedValues = goals.filter((goal) => byGoal.get(goal.id)?.actualValue !== null && byGoal.get(goal.id)?.actualValue !== undefined).length;
  const submitted = checkins.some((checkin) => checkin.submittedAt);

  const loadBase = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cycles = await apiClient.get("/admin/cycles", { params: { status: "CHECKIN_OPEN" } });
      const cycle = cycles.data[0] || (await apiClient.get("/admin/cycles", { params: { status: "OPEN" } })).data[0];
      const active = cycle?.checkins?.find((item: Window) => item.isActive);
      setWindows(cycle?.checkins || []);
      setActiveQuarter(active?.quarter || "Q2");
      const sheet = await apiClient.get("/goal-sheets", { params: { employeeId: "me", cycleId: cycle?.id || "current" } });
      setGoalSheet(sheet.data);
      setGoals(sheet.data?.goals || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load check-ins"));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadBase(); }, [loadBase]);

  const loadCheckins = React.useCallback(async () => {
    if (!goalSheet?.id) return;
    try {
      const { data } = await apiClient.get("/checkins", { params: { goalSheetId: goalSheet.id, quarter: activeQuarter } });
      setCheckins(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load check-ins"));
    }
  }, [activeQuarter, goalSheet?.id]);

  React.useEffect(() => { loadCheckins(); }, [loadCheckins]);

  const saveCheckin = async (goal: Goal, patch: Partial<Checkin>) => {
    if (!windowOpen || submitted) {
      setError("This check-in window is closed or already submitted.");
      return;
    }
    const existing = byGoal.get(goal.id);
    const next = {
      goalId: goal.id,
      quarter: activeQuarter,
      plannedValue: patch.plannedValue ?? existing?.plannedValue ?? goal.targetValue,
      actualValue: patch.actualValue ?? existing?.actualValue ?? null,
      status: patch.status ?? existing?.status ?? "ON_TRACK",
    };
    try {
      const { data } = existing
        ? await apiClient.patch(`/checkins/${existing.id}`, next)
        : await apiClient.post("/checkins", next);
      setCheckins((prev) => {
        const index = prev.findIndex((item) => item.id === data.id || item.goalId === data.goalId);
        if (index < 0) return [...prev, data];
        const updated = [...prev];
        updated[index] = { ...updated[index], ...data };
        return updated;
      });
      setMessage("Draft saved");
    } catch (err) {
      setError(getApiErrorMessage(err, "Save failed"));
    }
  };

  const submitQuarter = async () => {
    if (!goalSheet || completedValues < goals.length) {
      setError(`${goals.length - completedValues} goals still need actual values`);
      return;
    }
    if (!confirm(`Submit ${activeQuarter} check-in? This will notify your manager for review.`)) return;
    try {
      await apiClient.patch("/checkins/submit-quarter", { goalSheetId: goalSheet.id, quarter: activeQuarter });
      await loadCheckins();
      setMessage(`${activeQuarter} check-in submitted! Manager notified.`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Submit failed"));
    }
  };

  if (loading) return <Panel>Loading check-ins...</Panel>;

  return (
    <div>
      <PageHeader
        eyebrow="Cycle pulse"
        title="Check-ins"
        description="Track current updates, pending submissions, and manager-ready progress notes."
        actions={<><button className="btn btn-secondary" onClick={() => setMessage("Draft saved")}>Save Draft</button><button className="btn btn-primary" onClick={submitQuarter} disabled={!windowOpen || submitted}>Submit {activeQuarter} Check-in</button></>}
      />
      {message && <div className="mb-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="mb-5 flex flex-wrap gap-2">
        {quarters.map((quarter) => {
          const win = windows.find((item) => item.quarter === quarter);
          const hasData = checkins.some((item) => item.quarter === quarter);
          const locked = !win?.isActive && !hasData;
          return <button key={quarter} className={`btn ${activeQuarter === quarter ? "btn-primary" : "btn-secondary"} min-h-9`} disabled={locked} onClick={() => setActiveQuarter(quarter)}>{quarter.replace("_ANNUAL", "")}{locked ? " - Closed" : ""}</button>;
        })}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={<span className="inline-flex items-center gap-2">Open Items <InfoTooltip label="Open items help" content="Open items are goals that still need a planned or actual value. They remain editable only while the quarter window is active." /></span>} value={Math.max(0, goals.length - completedValues)} sublabel={windowOpen ? "Window open" : "Window closed"} accent="warning" icon={<ClockIcon />} />
        <StatCard label={<span className="inline-flex items-center gap-2">Submitted <InfoTooltip label="Submitted check-in help" content="Submitted check-ins are locked for the quarter and routed to manager review. They can no longer be autosaved until returned or reopened by governance." /></span>} value={submitted ? "Yes" : "No"} sublabel={submitted ? "Awaiting review" : "Draft"} accent="primary" icon={<CheckIcon />} />
        <StatCard label={<span className="inline-flex items-center gap-2">Avg Progress <InfoTooltip label="Average progress help" content="Average progress is a simple score across the active quarter. It reflects actual performance versus planned values after UOM scoring rules are applied." /></span>} value={<span>{Math.round(checkins.reduce((sum, item) => sum + (item.progressScore || 0), 0) / (checkins.length || 1))}<span className="text-2xl text-muted-foreground/70">%</span></span>} sublabel="Across active goals" accent="teal" icon={<CheckIcon />} />
      </div>

      {!windowOpen && <Panel className="mb-5 border-warning/30 bg-warning/10">This check-in window is closed. Contact your admin to enable late submission.</Panel>}
      {submitted && <Panel className="mb-5 border-success/30 bg-success/10">Submitted on {new Date(checkins.find((item) => item.submittedAt)?.submittedAt || Date.now()).toLocaleString()}</Panel>}

      <div className="space-y-4">
        {goals.map((goal) => {
          const checkin = byGoal.get(goal.id);
          const actual = checkin?.actualValue ?? null;
          const liveScore = Math.round(checkin?.progressScore ?? computeScore(goal.uomType?.formulaType, goal.targetValue, actual));
          return (
            <Panel key={goal.id}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{goal.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Target {goal.targetValue} - {goal.uomType?.name}</p>
                </div>
                <Pill tone={liveScore >= 100 ? "success" : liveScore > 0 ? "primary" : "warning"}>{liveScore}%</Pill>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-sm">Planned<input type="number" className="field mt-2 w-full" defaultValue={checkin?.plannedValue ?? goal.targetValue} disabled={!windowOpen || submitted} onBlur={(e) => saveCheckin(goal, { plannedValue: Number(e.target.value) })} /></label>
                <label className="text-sm">Actual<input type="number" className="field mt-2 w-full" defaultValue={actual ?? ""} disabled={!windowOpen || submitted} onBlur={(e) => saveCheckin(goal, { actualValue: e.target.value === "" ? null : Number(e.target.value) })} /></label>
                <label className="text-sm">Status <InfoTooltip label="Check-in status help" content="Not Started means the goal has no update yet, On Track indicates the quarter is progressing normally, and Completed means the actual value meets the expected outcome." /><select className="field mt-2 w-full" value={checkin?.status || "NOT_STARTED"} disabled={!windowOpen || submitted} onChange={(e) => saveCheckin(goal, { status: e.target.value })}><option value="NOT_STARTED">Not Started</option><option value="ON_TRACK">On Track</option><option value="COMPLETED">Completed</option></select></label>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2"><span className="h-3 w-3"><CheckIcon /></span> Related tasks this quarter</div>
                <div className="text-xs text-muted-foreground">Operational tasks linked to this goal help you break down work into executable items. Track progress on the Team Overview page.</div>
              </div>
            </Panel>
          );
        })}
        {goals.length === 0 && <Panel>No approved goals found for this cycle.</Panel>}
      </div>
    </div>
  );
}
