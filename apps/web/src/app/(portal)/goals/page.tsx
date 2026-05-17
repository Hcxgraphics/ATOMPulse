"use client";

import React, { useState } from "react";
import { PageHeader, Panel, Pill, TargetIcon } from "@/components/ui-shell";

export default function GoalsPage() {
  const [goals, setGoals] = useState([
    { id: '1', title: 'Revenue Growth', thrust: 'Sales', uom: 'Numeric (Min)', target: 5000000, weightage: 30, isLocked: false },
    { id: '2', title: 'Reduce TAT', thrust: 'Ops', uom: 'Timeline', target: '2026-12-31', weightage: 20, isLocked: false },
  ]);

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const trackerTone = totalWeightage === 100 ? "bg-success" : totalWeightage > 100 ? "bg-destructive" : "bg-primary";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="2026 Annual Goals Cycle"
        title="My Goal Sheet"
        description="Build, balance, and submit your commitments for manager approval."
        actions={
          <>
            <button className="btn btn-secondary">Add Goal</button>
            <button disabled={totalWeightage !== 100} className="btn btn-primary">
              Submit for Approval
            </button>
          </>
        }
      />

      <Panel className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Total Weightage</div>
            <div className="mt-1 text-xs text-muted-foreground">Goal sheets must total 100% before submission.</div>
          </div>
          <div className={`font-mono text-lg font-bold ${totalWeightage === 100 ? "text-success" : totalWeightage > 100 ? "text-destructive" : "text-foreground"}`}>
            {totalWeightage}% / 100%
          </div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${trackerTone} transition-all`} style={{ width: `${Math.min(totalWeightage, 100)}%` }} />
        </div>
      </Panel>

      <div className="space-y-4">
        {goals.map(goal => (
          <Panel key={goal.id} className="group transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold tracking-tight">{goal.title}</h3>
                  <Pill tone="primary">{goal.thrust}</Pill>
                  {goal.isLocked && <Pill tone="success">Locked</Pill>}
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <p><span className="text-foreground">UOM:</span> {goal.uom}</p>
                  <p><span className="text-foreground">Target:</span> {goal.target}</p>
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Achieve Q1-Q4 targets seamlessly as planned with measurable checkpoints and aligned ownership.
                </p>
              </div>
              <div className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-right">
                <div className="font-mono text-2xl font-semibold text-primary-glow">{goal.weightage}%</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Weight</div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-border/70 pt-4">
              <button className="btn btn-secondary min-h-9 px-3 text-xs">Edit</button>
              <button className="btn min-h-9 border-destructive/30 bg-destructive/10 px-3 text-xs text-destructive">Delete</button>
            </div>
          </Panel>
        ))}

        {goals.length === 0 && (
          <Panel className="py-14 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary-glow">
              <TargetIcon />
            </div>
            <h3 className="text-sm font-semibold">No goals</h3>
            <p className="mt-1 text-sm text-muted-foreground">Get started by creating a new goal.</p>
            <button className="btn btn-secondary mt-5">Add Goal</button>
          </Panel>
        )}
      </div>
    </div>
  );
}
