"use client";

import React from "react";
import { CheckIcon, Panel, Pill, UsersIcon } from "@/components/ui-shell";
import { InfoTooltip } from "@/components/info-tooltip";

type TaskStatus = "ASSIGNED" | "IN_PROGRESS" | "UNDER_REVIEW" | "COMPLETED" | "BLOCKED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DemoTask = {
  id: string;
  title: string;
  description: string;
  assigneeName: string;
  assigneeInitials: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  linkedGoal: string;
  progress: number;
  comments: { author: string; note: string; timestamp: string }[];
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

function makeDemoTasks(): DemoTask[] {
  return [
    { id: "tsk-101", title: "Finalize Q2 Sales Forecast Deck", description: "Align forecast assumptions with RevOps and validate pipeline coverage by region.", assigneeName: "Ayesha Khan", assigneeInitials: "AK", priority: "HIGH", status: "IN_PROGRESS", dueDate: "2026-05-22", linkedGoal: "Qualified Pipeline Value", progress: 62, comments: [{ author: "Rohan Desai", note: "Please add the churn risk note before Thursday.", timestamp: "2026-05-17 09:20" }], team: "Sales" },
    { id: "tsk-102", title: "Review Deployment Runbook", description: "Validate rollback steps and include monitoring links for the release train.", assigneeName: "Tariq Ahmed", assigneeInitials: "TA", priority: "CRITICAL", status: "UNDER_REVIEW", dueDate: "2026-05-19", linkedGoal: "API Reliability", progress: 88, comments: [{ author: "Ravi Sharma", note: "Looks good. Please add database failover validation.", timestamp: "2026-05-18 10:05" }], team: "Engineering" },
    { id: "tsk-103", title: "Customer Escalation Follow-up", description: "Confirm resolution with the client and close the escalation ticket with a recap.", assigneeName: "Meera Iyer", assigneeInitials: "MI", priority: "HIGH", status: "BLOCKED", dueDate: "2026-05-20", linkedGoal: "Escalation Resolution Time", progress: 45, comments: [{ author: "Meera Iyer", note: "Waiting on legal approval for the final response.", timestamp: "2026-05-18 11:10" }], team: "Customer Success" },
    { id: "tsk-104", title: "Update Compliance Checklist", description: "Refresh the audit evidence index and mark outstanding controls as complete.", assigneeName: "Vikram Singh", assigneeInitials: "VS", priority: "MEDIUM", status: "ASSIGNED", dueDate: "2026-05-24", linkedGoal: "Open Audit Item Closure", progress: 12, comments: [{ author: "Maya Nair", note: "Start with control 4.2 and attach the evidence trail.", timestamp: "2026-05-18 08:55" }], team: "Operations" },
    { id: "tsk-105", title: "Onboarding KPI Review", description: "Summarize new hire time-to-productivity and surface blockers for HR ops.", assigneeName: "Priyanka Sethi", assigneeInitials: "PS", priority: "LOW", status: "COMPLETED", dueDate: "2026-05-14", linkedGoal: "Training Coverage", progress: 100, comments: [{ author: "Priyanka Sethi", note: "Completed with the new onboarding cohort metrics.", timestamp: "2026-05-14 17:30" }], team: "Operations" },
    { id: "tsk-106", title: "Bug Reduction Sprint Prep", description: "Prepare sprint focus items and dependency map for the next delivery cycle.", assigneeName: "Elena Shah", assigneeInitials: "ES", priority: "MEDIUM", status: "IN_PROGRESS", dueDate: "2026-05-26", linkedGoal: "Production Defect Rate", progress: 54, comments: [{ author: "Ravi Sharma", note: "Prioritize accessibility regressions in the first pass.", timestamp: "2026-05-17 14:15" }], team: "Engineering" },
  ];
}

export function TaskWorkspace() {
  // This component is deprecated. Tasks are now integrated into Team Overview.
  // The /tasks page redirects to /team?tab=tasks
  return null;
}