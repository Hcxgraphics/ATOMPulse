"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import React from "react";
import { PageHeader, Panel, Pill, TargetIcon } from "@/components/ui-shell";
import { InfoTooltip } from "@/components/info-tooltip";
import apiClient, { getApiErrorMessage } from "@/lib/apiClient";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type Goal = {
  id: string;
  title: string;
  description?: string | null;
  thrustAreaId: string;
  uomTypeId: string;
  targetValue: number;
  weightage: number;
  status: string;
  isShared?: boolean;
  thrustArea?: { id: string; name: string };
  uomType?: { id: string; name: string; formulaType: string; description?: string | null };
};

type GoalSheet = {
  id: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "LOCKED" | "RETURNED";
  cycleId: string;
  returnReason?: string | null;
  goals: Goal[];
};

type Option = { id: string; name: string; formulaType?: string; description?: string | null };

const emptyForm = { title: "", description: "", thrustAreaId: "", uomTypeId: "", targetValue: 0, weightage: 10 };

export default function GoalsPage() {
  useRequireAuth(["EMPLOYEE", "ADMIN_HR", "SUPER_ADMIN"]);
  const [goalSheet, setGoalSheet] = React.useState<GoalSheet | null>(null);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [thrustAreas, setThrustAreas] = React.useState<Option[]>([]);
  const [uomTypes, setUomTypes] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);
  const [form, setForm] = React.useState(emptyForm);

  const totalWeightage = goals.reduce((sum, goal) => sum + Number(goal.weightage), 0);
  const isLocked = goalSheet?.status === "LOCKED" || goalSheet?.status === "APPROVED" || goalSheet?.status === "SUBMITTED";
  const canEditSheet = goalSheet && ["DRAFT", "RETURNED"].includes(goalSheet.status);

  const loadGoalSheet = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get("/goal-sheets", { params: { employeeId: "me", cycleId: "current" } });
      setGoalSheet(data);
      setGoals(data?.goals || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load goal sheet"));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadGoalSheet();
  }, [loadGoalSheet]);

  const loadFormOptions = async () => {
    if (thrustAreas.length && uomTypes.length) return;
    const [thrust, uom] = await Promise.all([apiClient.get("/thrust-areas"), apiClient.get("/uom-types")]);
    setThrustAreas(thrust.data);
    setUomTypes(uom.data);
  };

  const createSheet = async () => {
    setSaving(true);
    try {
      const cycles = await apiClient.get("/admin/cycles", { params: { status: "OPEN" } });
      const cycleId = cycles.data[0]?.id;
      const { data } = await apiClient.post("/goal-sheets", { cycleId });
      setGoalSheet(data);
      setGoals([]);
      setMessage("Goal sheet created. Start adding your goals.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create sheet"));
    } finally {
      setSaving(false);
    }
  };

  const openAdd = async () => {
    await loadFormOptions();
    setEditingGoal(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = async (goal: Goal) => {
    await loadFormOptions();
    setEditingGoal(goal);
    setForm({
      title: goal.title,
      description: goal.description || "",
      thrustAreaId: goal.thrustAreaId,
      uomTypeId: goal.uomTypeId,
      targetValue: goal.targetValue,
      weightage: goal.weightage,
    });
    setFormOpen(true);
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Title is required";
    if (!form.thrustAreaId || !form.uomTypeId) return "Select thrust area and UOM type";
    if (Number(form.weightage) < 10) return "Minimum weightage is 10%";
    if (!editingGoal && goals.length >= 8) return "Maximum 8 goals per sheet reached";
    const otherWeight = goals.filter((goal) => goal.id !== editingGoal?.id).reduce((sum, goal) => sum + Number(goal.weightage), 0);
    if (otherWeight + Number(form.weightage) > 100) return `Adding this goal would exceed 100%. Remaining: ${Math.max(0, 100 - otherWeight)}%`;
    return null;
  };

  const saveGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!goalSheet) return;
    const validation = validateForm();
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = editingGoal?.isShared
        ? { weightage: Number(form.weightage) }
        : { ...form, targetValue: Number(form.targetValue), weightage: Number(form.weightage), description: form.description || null };
      const { data } = editingGoal
        ? await apiClient.patch(`/goal-sheets/${goalSheet.id}/goals/${editingGoal.id}`, body)
        : await apiClient.post(`/goal-sheets/${goalSheet.id}/goals`, body);
      setGoals((prev) => editingGoal ? prev.map((goal) => goal.id === data.id ? data : goal) : [...prev, data]);
      setFormOpen(false);
      setMessage(editingGoal ? "Goal updated" : "Goal added");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save goal"));
    } finally {
      setSaving(false);
    }
  };

  const deleteGoal = async (goal: Goal) => {
    if (!goalSheet || !confirm(`Delete '${goal.title}'? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await apiClient.delete(`/goal-sheets/${goalSheet.id}/goals/${goal.id}`);
      setGoals((prev) => prev.filter((item) => item.id !== goal.id));
      setMessage("Goal deleted");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete goal"));
    } finally {
      setSaving(false);
    }
  };

  const submitSheet = async () => {
    if (!goalSheet) return;
    if (!confirm("Submit goal sheet for manager approval? You won't be able to edit after submission.")) return;
    setSaving(true);
    try {
      const { data } = await apiClient.patch(`/goal-sheets/${goalSheet.id}/submit`);
      setGoalSheet(data);
      setGoals(data.goals || goals);
      setMessage("Goal sheet submitted! Your manager has been notified.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to submit goal sheet"));
    } finally {
      setSaving(false);
    }
  };

  const submitHint =
    goals.length === 0 ? "Add at least one goal" :
    totalWeightage < 100 ? `Add ${100 - totalWeightage}% more weightage to submit` :
    totalWeightage > 100 ? `Reduce weightage by ${totalWeightage - 100}% before submitting` :
    !canEditSheet ? `Current status: ${goalSheet?.status}` : null;

  if (loading) return <Panel>Loading goal sheet...</Panel>;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="2026 Annual Goals Cycle"
        title="My Goal Sheet"
        description="Build, balance, and submit your commitments for manager approval."
        actions={
          goalSheet ? (
            <>
              {canEditSheet && <button className="btn btn-secondary" onClick={openAdd} disabled={saving}>Add Goal</button>}
              <button disabled={Boolean(submitHint) || saving} className="btn btn-primary" onClick={submitSheet}>Submit for Approval</button>
            </>
          ) : null
        }
      />

      {message && <div className="mb-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {!goalSheet ? (
        <Panel className="py-14 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary-glow"><TargetIcon /></div>
          <h3 className="text-sm font-semibold">No goal sheet yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Create a sheet for the active cycle, then start adding goals.</p>
          <button className="btn btn-primary mt-5" onClick={createSheet} disabled={saving}>Create Goal Sheet</button>
        </Panel>
      ) : (
        <>
          <Panel className="mb-8">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">Total Weightage <InfoTooltip label="Total weightage guidance" content="Goal sheets must total 100%. Each goal must be at least 10%, and locked sheets cannot be edited after approval." /></div>
                <div className="mt-1 text-xs text-muted-foreground">{submitHint || "Ready to submit."}</div>
              </div>
              <div className={`font-mono text-lg font-bold ${totalWeightage === 100 ? "text-success" : totalWeightage > 100 ? "text-destructive" : "text-foreground"}`}>{totalWeightage}% / 100%</div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${totalWeightage === 100 ? "bg-success" : totalWeightage > 100 ? "bg-destructive" : "bg-primary"}`} style={{ width: `${Math.min(totalWeightage, 100)}%` }} />
            </div>
            <div className="mt-4 flex gap-2"><Pill tone={goalSheet.status === "RETURNED" ? "warning" : isLocked ? "success" : "primary"}>{goalSheet.status}</Pill>{goalSheet.returnReason && <Pill tone="warning">{goalSheet.returnReason}</Pill>}</div>
          </Panel>

          <div className="space-y-4">
            {goals.map((goal) => (
              <Panel key={goal.id} className="transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold tracking-tight">{goal.title}</h3>
                      <Pill tone="primary">{goal.thrustArea?.name || "Goal"}</Pill>
                      {goal.isShared && <Pill tone="warning">Shared</Pill>}
                      {isLocked && <Pill tone="success">Locked</Pill>}
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <p className="flex items-center gap-2"><span className="text-foreground">UOM:</span> {goal.uomType?.name || goal.uomTypeId} <InfoTooltip label="UOM formula help" content="UOM types define how progress is scored. Min and Max compare actuals against targets, Timeline maps delivery checkpoints, and Zero-based checks for completion states." /></p>
                      <p><span className="text-foreground">Target:</span> {goal.targetValue}</p>
                    </div>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{goal.description || "No description provided."}</p>
                  </div>
                  <div className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-right">
                    <div className="font-mono text-2xl font-semibold text-primary-glow">{goal.weightage}%</div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Weight</div>
                  </div>
                </div>
                {!isLocked && (
                  <div className="mt-5 flex justify-end gap-2 border-t border-border/70 pt-4">
                    <button className="btn btn-secondary min-h-9 px-3 text-xs" onClick={() => openEdit(goal)}>Edit</button>
                    <button className="btn min-h-9 border-destructive/30 bg-destructive/10 px-3 text-xs text-destructive" onClick={() => deleteGoal(goal)}>Delete</button>
                  </div>
                )}
              </Panel>
            ))}
            {goals.length === 0 && (
              <Panel className="py-14 text-center">
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary-glow"><TargetIcon /></div>
                <h3 className="text-sm font-semibold">No goals</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get started by creating a new goal.</p>
                {canEditSheet && <button className="btn btn-secondary mt-5" onClick={openAdd}>Add Goal</button>}
              </Panel>
            )}
          </div>
        </>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 grid place-items-stretch bg-black/60 p-4 sm:place-items-center">
          <form onSubmit={saveGoal} className="ml-auto h-full w-full max-w-xl overflow-y-auto rounded-2xl border border-border/80 bg-card p-5 shadow-elevated sm:h-auto">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{editingGoal ? "Edit Goal" : "Add Goal"}</h2>
                {editingGoal?.isShared && <p className="mt-1 text-sm text-warning">Shared goal - only weightage can be modified.</p>}
              </div>
              <button type="button" className="btn btn-secondary min-h-9 px-3 text-xs" onClick={() => setFormOpen(false)}>Close</button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm">Thrust Area<select className="field mt-2 w-full" value={form.thrustAreaId} disabled={editingGoal?.isShared} onChange={(e) => setForm({ ...form, thrustAreaId: e.target.value })}><option value="">Select</option>{thrustAreas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="block text-sm">Title<input className="field mt-2 w-full" value={form.title} disabled={editingGoal?.isShared} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
              <label className="block text-sm">Description<textarea className="field mt-2 w-full" rows={3} value={form.description} disabled={editingGoal?.isShared} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
              <label className="block text-sm">UOM Type<select className="field mt-2 w-full" value={form.uomTypeId} disabled={editingGoal?.isShared} onChange={(e) => setForm({ ...form, uomTypeId: e.target.value })}><option value="">Select</option>{uomTypes.map((item) => <option key={item.id} value={item.id}>{item.name} {item.formulaType ? `(${item.formulaType})` : ""}</option>)}</select></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">Target Value<input type="number" className="field mt-2 w-full" value={form.targetValue} disabled={editingGoal?.isShared} onChange={(e) => setForm({ ...form, targetValue: Number(e.target.value) })} /></label>
                <label className="block text-sm">Weightage<input type="number" min={10} max={100} className="field mt-2 w-full" value={form.weightage} onChange={(e) => setForm({ ...form, weightage: Number(e.target.value) })} /></label>
              </div>
              <button className="btn btn-primary w-full" disabled={saving}>{saving ? "Saving..." : editingGoal ? "Save Changes" : "Save Goal"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
