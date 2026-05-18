"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import React from "react";
import { PageHeader, Panel, Pill, StatCard, UsersIcon } from "@/components/ui-shell";
import { TeamTasksBoard } from "@/components/team-tasks-board";
import apiClient, { getApiErrorMessage } from "@/lib/apiClient";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type Sheet = { id: string; status: string; submittedAt?: string; approvedAt?: string; returnedAt?: string; returnReason?: string; employee: any; goals: any[] };
const columns = ["SUBMITTED", "APPROVED", "LOCKED", "RETURNED"];

export default function TeamOverviewPage() {
  useRequireAuth(["MANAGER_L1", "ADMIN_HR", "SUPER_ADMIN"]);
  const [sheets, setSheets] = React.useState<Sheet[]>([]);
  const [reviewSheet, setReviewSheet] = React.useState<Sheet | null>(null);
  const [tab, setTab] = React.useState<"sheets" | "checkins" | "tasks">("sheets");
  const [checkins, setCheckins] = React.useState<any[]>([]);
  const [feedback, setFeedback] = React.useState<Record<string, string>>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadSheets = React.useCallback(async () => {
    try {
      const { data } = await apiClient.get("/goal-sheets", { params: { managerId: "me" } });
      setSheets(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load team sheets"));
    }
  }, []);

  React.useEffect(() => { loadSheets(); }, [loadSheets]);

  const loadCheckins = async () => {
    try {
      const { data } = await apiClient.get("/checkins", { params: { managerId: "me", quarter: "Q2" } });
      setCheckins(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load check-in reviews"));
    }
  };

  React.useEffect(() => { if (tab === "checkins") loadCheckins(); }, [tab]);

  const updateStatus = (id: string, status: string, extra = {}) => {
    setSheets((prev) => prev.map((sheet) => sheet.id === id ? { ...sheet, status, ...extra } : sheet));
  };

  const approve = async (sheet: Sheet) => {
    if (!confirm("Approve this goal sheet? All goals will be locked and the employee will be notified.")) return;
    try {
      const { data } = await apiClient.patch(`/goal-sheets/${sheet.id}/approve`);
      updateStatus(sheet.id, data.status, data);
      setReviewSheet(null);
      setMessage(`${sheet.employee.name}'s goals approved and locked!`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Approval failed"));
    }
  };

  const returnSheet = async (sheet: Sheet) => {
    const returnReason = prompt("Reason for returning (required)");
    if (!returnReason) return;
    try {
      const { data } = await apiClient.patch(`/goal-sheets/${sheet.id}/return`, { returnReason });
      updateStatus(sheet.id, data.status, data);
      setReviewSheet(null);
      setMessage("Goal sheet returned. Employee has been notified.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Return failed"));
    }
  };

  const saveInlineGoal = async (sheet: Sheet, goal: any, patch: any) => {
    try {
      const { data } = await apiClient.patch(`/goal-sheets/${sheet.id}/goals/${goal.id}`, patch);
      setReviewSheet((prev) => prev ? { ...prev, goals: prev.goals.map((item) => item.id === goal.id ? data : item) } : prev);
      setMessage("Goal updated");
    } catch (err) {
      setError(getApiErrorMessage(err, "Update failed"));
    }
  };

  const saveFeedback = async (checkin: any) => {
    if (!feedback[checkin.id]) return;
    try {
      await apiClient.post(`/checkins/${checkin.id}/feedback`, { feedback: feedback[checkin.id] });
      setFeedback((prev) => ({ ...prev, [checkin.id]: "" }));
      setMessage("Feedback saved");
      await loadCheckins();
    } catch (err) {
      setError(getApiErrorMessage(err, "Feedback failed"));
    }
  };

  const downloadReport = async (format: "csv" | "xlsx") => {
    try {
      const response = await apiClient.get("/export/achievement-report", { params: { format, managerId: "me", quarter: "Q2" }, responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `atompulse-team-report-Q2.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getApiErrorMessage(err, "Export failed"));
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col">
      <PageHeader
        eyebrow="Manager workspace"
        title="Team Overview"
        description="Manage and approve goals for your direct reports."
        actions={<><button className="btn btn-secondary" onClick={() => downloadReport("csv")}>Download CSV</button><button className="btn btn-secondary" onClick={() => downloadReport("xlsx")}>Download XLSX</button></>}
      />
      {message && <div className="mb-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="mb-4 flex gap-2">
        <button className={`btn ${tab === "sheets" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("sheets")}>Goal Sheets</button>
        <button className={`btn ${tab === "checkins" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("checkins")}>Check-in Reviews</button>
        <button className={`btn ${tab === "tasks" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("tasks")}>Operational Tasks</button>
      </div>

      {tab === "sheets" ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Submitted" value={sheets.filter(card => card.status === "SUBMITTED").length} sublabel="Ready for review" accent="warning" icon={<UsersIcon />} />
            <StatCard label="Approved" value={sheets.filter(card => card.status === "APPROVED").length} sublabel="Aligned this cycle" accent="success" icon={<UsersIcon />} />
            <StatCard label="Returned" value={sheets.filter(card => card.status === "RETURNED").length} sublabel="Needs rework" accent="primary" icon={<UsersIcon />} />
          </div>
          <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
            {columns.map((col) => {
              const cards = sheets.filter((sheet) => sheet.status === col);
              return (
                <section key={col} className="flex w-72 shrink-0 flex-col rounded-2xl border border-border/80 bg-card/50 backdrop-blur-xl" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                  const id = e.dataTransfer.getData("sheetId");
                  const sheet = sheets.find((item) => item.id === id);
                  if (!sheet) return;
                  if (sheet.status === "SUBMITTED" && col === "APPROVED") approve(sheet);
                  else if (sheet.status === "SUBMITTED" && col === "RETURNED") returnSheet(sheet);
                  else setError("Move the card using the Review panel for proper workflow.");
                }}>
                  <div className="flex items-center justify-between border-b border-border/70 p-4"><h3 className="text-sm font-semibold">{col}</h3><span className="font-mono text-xs text-muted-foreground">{cards.length}</span></div>
                  <div className="flex-1 space-y-3 overflow-y-auto p-3">
                    {cards.map((card) => (
                      <article key={card.id} draggable={card.status === "SUBMITTED"} onDragStart={(e) => e.dataTransfer.setData("sheetId", card.id)} className="rounded-xl border border-border/80 bg-white/[0.045] p-4 shadow-elevated transition hover:-translate-y-0.5 hover:border-primary/40">
                        <div className="mb-3 flex items-start justify-between gap-3"><div className="font-semibold">{card.employee.name}</div><Pill tone="muted">{card.employee.department?.name}</Pill></div>
                        <div className="mb-4 space-y-1 text-xs text-muted-foreground"><p>{card.goals.length} Goals</p>{card.submittedAt && <p>Submitted: {new Date(card.submittedAt).toLocaleDateString()}</p>}</div>
                        <button className={`btn ${card.status === "SUBMITTED" ? "btn-primary" : "btn-secondary"} min-h-9 w-full text-xs`} onClick={() => setReviewSheet(card)}>{card.status === "SUBMITTED" ? "Review" : "View"}</button>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      ) : tab === "checkins" ? (
        <Panel>
          <div className="table-shell">
            <table><thead><tr><th>Employee</th><th>Goal</th><th>Planned</th><th>Actual</th><th>Progress</th><th>Status</th><th>Feedback</th></tr></thead>
              <tbody>{checkins.map((item) => <tr key={item.id}><td>{item.goal.goalSheet.employee.name}</td><td>{item.goal.title}</td><td>{item.plannedValue}</td><td>{item.actualValue ?? "-"}</td><td>{Math.round(item.progressScore || 0)}%</td><td><Pill tone={item.status === "COMPLETED" ? "success" : "warning"}>{item.status}</Pill></td><td><textarea className="field min-w-48" rows={2} value={feedback[item.id] || ""} onChange={(e) => setFeedback({ ...feedback, [item.id]: e.target.value })} /><button className="btn btn-secondary mt-2 min-h-8 px-2 text-xs" onClick={() => saveFeedback(item)}>Save</button></td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
      ) : (
        <Panel>
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Team operational workflow</div>
            <h3 className="mt-2 text-lg font-semibold">Delivery task lifecycle</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Monitor team member task assignments, progress, and lifecycle transitions. Drag cards between columns to update workflow state.</p>
          </div>
          <TeamTasksBoard />
        </Panel>
      )}

      {reviewSheet && (
        <div className="fixed inset-0 z-50 grid place-items-stretch bg-black/60 p-4 sm:place-items-center">
          <Panel className="ml-auto h-full w-full max-w-3xl overflow-y-auto sm:h-auto">
            <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">{reviewSheet.employee.name}</h2><p className="text-sm text-muted-foreground">{reviewSheet.status}{reviewSheet.returnReason ? ` - ${reviewSheet.returnReason}` : ""}</p></div><button className="btn btn-secondary min-h-9 px-3 text-xs" onClick={() => setReviewSheet(null)}>Close</button></div>
            <div className="mb-4 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, reviewSheet.goals.reduce((sum, goal) => sum + goal.weightage, 0))}%` }} /></div>
            <div className="space-y-3">
              {reviewSheet.goals.map((goal) => <div key={goal.id} className="rounded-xl border border-border/70 p-4"><div className="mb-3 font-semibold">{goal.title}</div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Target<input className="field mt-2 w-full" type="number" defaultValue={goal.targetValue} disabled={reviewSheet.status !== "SUBMITTED"} onBlur={(e) => saveInlineGoal(reviewSheet, goal, { targetValue: Number(e.target.value) })} /></label><label className="text-sm">Weight<input className="field mt-2 w-full" type="number" defaultValue={goal.weightage} disabled={reviewSheet.status !== "SUBMITTED"} onBlur={(e) => saveInlineGoal(reviewSheet, goal, { weightage: Number(e.target.value) })} /></label></div></div>)}
            </div>
            {reviewSheet.status === "SUBMITTED" && <div className="mt-5 flex justify-end gap-2"><button className="btn border-destructive/30 bg-destructive/10 text-destructive" onClick={() => returnSheet(reviewSheet)}>Return for Rework</button><button className="btn btn-primary" onClick={() => approve(reviewSheet)} disabled={reviewSheet.goals.reduce((sum, goal) => sum + goal.weightage, 0) !== 100}>Approve Goals</button></div>}
          </Panel>
        </div>
      )}
    </div>
  );
}
