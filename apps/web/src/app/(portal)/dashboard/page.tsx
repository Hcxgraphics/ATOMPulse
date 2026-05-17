"use client";

import React from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { ArrowIcon, CheckIcon, ClockIcon, DashboardIcon, Panel, Pill, StatCard, TargetIcon } from "@/components/ui-shell";

const dashboardGoals = [
  { name: "Revenue Growth", tag: "Sales", status: "On Track", weight: 30, progress: 80, tone: "success" },
  { name: "Reduce TAT", tag: "Ops", status: "At Risk", weight: 20, progress: 42, tone: "warning" },
  { name: "Platform Adoption", tag: "Product", status: "On Track", weight: 25, progress: 67, tone: "success" },
  { name: "Customer NPS", tag: "CX", status: "Exceeding", weight: 15, progress: 92, tone: "primary" },
] as const;

export default function DashboardPage() {
  const user = useAuthStore(state => state.user);
  const router = useRouter();

  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div>
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-border/80 bg-card/70 p-6 shadow-elevated backdrop-blur-xl sm:p-8">
        <div className="absolute -right-24 -top-28 h-64 w-64 rounded-full gradient-primary opacity-20 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-teal opacity-10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-px w-8 bg-teal" />
              Q2 2026 Performance Cycle
            </div>
            <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
              Hello, <span className="gradient-text">{user.name}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Your check-in window is open. Keep goals aligned, approvals moving, and progress visible across the current cycle.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-warning/15 text-warning">
              <ClockIcon />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Window closes in</div>
              <div className="font-mono text-xl font-semibold">12d 04h</div>
            </div>
            <button className="ml-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-glow hover:text-foreground">
              View <ArrowIcon />
            </button>
          </div>
        </div>
      </section>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Goals Total" value="5" sublabel="Across 4 thrust areas" accent="primary" icon={<TargetIcon />} />
        <StatCard label="Locked / Approved" value="3" sublabel="60% of portfolio" accent="success" icon={<CheckIcon />} />
        <StatCard label="Avg Progress" value={<span>80<span className="text-2xl text-muted-foreground/70">%</span></span>} sublabel={<span className="text-success">+12% vs Q1</span>} accent="teal" icon={<DashboardIcon />} />
        <StatCard label="Pending Check-ins" value="2" sublabel="Due in 5 days" accent="warning" icon={<ClockIcon />} />
      </div>

      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">My Goals - Current Cycle</div>
          <h2 className="text-2xl font-semibold tracking-tight">Active commitments</h2>
        </div>
        <div className="font-mono text-xs text-muted-foreground">5 of 5 active</div>
      </div>

      <div className="space-y-3">
        {dashboardGoals.map((goal) => (
          <Panel key={goal.name} className="transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow">
            <div className="grid grid-cols-12 items-center gap-4">
              <div className="col-span-12 flex items-center gap-3 md:col-span-5">
                <span className={`status-dot dot-${goal.tone}`} />
                <div>
                  <div className="flex flex-wrap items-center gap-2 font-semibold">
                    {goal.name}
                    <Pill tone="muted">{goal.tag}</Pill>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {goal.status} - Weightage {goal.weight}%
                  </div>
                </div>
              </div>
              <div className="col-span-10 md:col-span-6">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${goal.tone === "warning" ? "bg-warning" : goal.tone === "primary" ? "bg-primary" : "bg-success"}`} style={{ width: `${goal.progress}%` }} />
                </div>
              </div>
              <div className="col-span-2 text-right font-mono text-sm tabular-nums md:col-span-1">{goal.progress}%</div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
