"use client";

import React from "react";
import { Panel, Pill, UsersIcon } from "@/components/ui-shell";

type TaskStatus = "ASSIGNED" | "IN_PROGRESS" | "UNDER_REVIEW" | "COMPLETED" | "BLOCKED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TeamTask = {
  id: string;
  title: string;
  assigneeName: string;
  assigneeInitials: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  linkedGoal: string;
  progress: number;
  team: string;
};

const statusBuckets: { key: TaskStatus; label: string }[] = [
  { key: "ASSIGNED", label: "Assigned" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "UNDER_REVIEW", label: "Review" },
  { key: "COMPLETED", label: "Completed" },
  { key: "BLOCKED", label: "Blocked" },
];

const priorityTone: Record<TaskPriority, "muted" | "primary" | "warning" | "danger"> = {
  LOW: "muted",
  MEDIUM: "primary",
  HIGH: "warning",
  CRITICAL: "danger",
};

export function makeDemoTeamTasks(): TeamTask[] {
  return [
    { id: "tsk-101", title: "Finalize Q2 Sales Forecast", assigneeName: "Ayesha Khan", assigneeInitials: "AK", priority: "HIGH", status: "IN_PROGRESS", dueDate: "2026-05-22", linkedGoal: "Qualified Pipeline", progress: 62, team: "Sales" },
    { id: "tsk-102", title: "Review Deployment Runbook", assigneeName: "Tariq Ahmed", assigneeInitials: "TA", priority: "CRITICAL", status: "UNDER_REVIEW", dueDate: "2026-05-19", linkedGoal: "API Reliability", progress: 88, team: "Engineering" },
    { id: "tsk-103", title: "Customer Escalation Follow-up", assigneeName: "Meera Iyer", assigneeInitials: "MI", priority: "HIGH", status: "BLOCKED", dueDate: "2026-05-20", linkedGoal: "Escalation Resolution", progress: 45, team: "Customer Success" },
    { id: "tsk-104", title: "Update Compliance Checklist", assigneeName: "Vikram Singh", assigneeInitials: "VS", priority: "MEDIUM", status: "ASSIGNED", dueDate: "2026-05-24", linkedGoal: "Audit Item Closure", progress: 12, team: "Operations" },
    { id: "tsk-105", title: "Onboarding KPI Review", assigneeName: "Priyanka Sethi", assigneeInitials: "PS", priority: "LOW", status: "COMPLETED", dueDate: "2026-05-14", linkedGoal: "Training Coverage", progress: 100, team: "Operations" },
    { id: "tsk-106", title: "Bug Reduction Sprint Prep", assigneeName: "Elena Shah", assigneeInitials: "ES", priority: "MEDIUM", status: "IN_PROGRESS", dueDate: "2026-05-26", linkedGoal: "Defect Rate", progress: 54, team: "Engineering" },
  ];
}

export function TeamTasksBoard() {
  const [tasks, setTasks] = React.useState<TeamTask[]>(() => makeDemoTeamTasks());
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("ALL");

  const visibleTasks = tasks.filter((task) => {
    return (statusFilter === "ALL" || task.status === statusFilter) && (priorityFilter === "ALL" || task.priority === priorityFilter);
  });

  const tasksByStatus = statusBuckets.map((bucket) => ({
    ...bucket,
    count: visibleTasks.filter((task) => task.status === bucket.key).length,
    tasks: visibleTasks.filter((task) => task.status === bucket.key),
  }));

  const moveTask = (taskId: string, nextStatus: TaskStatus) => {
    setTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, status: nextStatus } : task));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select className="field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All statuses</option>
          {statusBuckets.map((bucket) => <option key={bucket.key}>{bucket.key}</option>)}
        </select>
        <select className="field" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="ALL">All priorities</option>
          <option>LOW</option>
          <option>MEDIUM</option>
          <option>HIGH</option>
          <option>CRITICAL</option>
        </select>
        <button className="btn btn-secondary min-h-9 px-3 text-xs" onClick={() => { setStatusFilter("ALL"); setPriorityFilter("ALL"); }}>Clear</button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-5 auto-rows-max">
        {tasksByStatus.map((bucket) => (
          <section key={bucket.key} className="kanban-column flex min-h-[280px] flex-col rounded-2xl" onDragOver={(e) => e.preventDefault()} onDrop={() => null}>
            <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
              <div>
                <div className="text-sm font-semibold">{bucket.label}</div>
                <div className="text-[10px] text-muted-foreground">{bucket.count}</div>
              </div>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {bucket.tasks.map((task) => (
                <article key={task.id} className="kanban-card cursor-pointer rounded-xl p-3 transition hover:-translate-y-1 hover:border-primary/40">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h4 className="line-clamp-2 text-xs font-semibold leading-3 flex-1">{task.title}</h4>
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full gradient-primary text-[9px] font-bold text-primary-foreground">{task.assigneeInitials}</span>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    <Pill tone={priorityTone[task.priority]}>{task.priority}</Pill>
                  </div>
                  <div className="text-[9px] text-muted-foreground line-clamp-1">{task.assigneeName}</div>
                  <div className="mt-2 space-y-1">
                    <div className="h-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-primary" style={{ width: `${task.progress}%` }} /></div>
                    <div className="flex justify-between text-[9px] text-muted-foreground"><span>Due {new Date(task.dueDate).toLocaleDateString()}</span><span>{task.progress}%</span></div>
                  </div>
                  <div className="mt-2 text-[8px] text-muted-foreground/60 line-clamp-1">{task.linkedGoal}</div>
                </article>
              ))}
              {bucket.tasks.length === 0 && <div className="text-center text-[10px] text-muted-foreground/40 py-8">No tasks</div>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
