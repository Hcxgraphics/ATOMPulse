"use client";

import React from "react";
import { ChartIcon, ClockIcon, PageHeader, Panel, Pill, StatCard, TargetIcon, UsersIcon } from "@/components/ui-shell";

const trend = [
  { m: "Jan", v: 42 },
  { m: "Feb", v: 51 },
  { m: "Mar", v: 58 },
  { m: "Apr", v: 64 },
  { m: "May", v: 68 },
  { m: "Jun", v: 72 },
];

const donut = [
  { name: "Revenue", value: 32, color: "var(--primary)" },
  { name: "Operations", value: 24, color: "var(--teal)" },
  { name: "People", value: 18, color: "var(--violet)" },
  { name: "Customer", value: 14, color: "var(--success)" },
  { name: "Innovation", value: 12, color: "var(--warning)" },
];

const managers = [
  { name: "A. Mehta", rate: 94 },
  { name: "S. Iyer", rate: 88 },
  { name: "R. Kapoor", rate: 81 },
  { name: "M. Singh", rate: 76 },
  { name: "T. Chen", rate: 68 },
  { name: "L. Park", rate: 54 },
];

const departments = [
  ["Sales", 82],
  ["Ops", 66],
  ["Product", 74],
  ["People", 59],
  ["CX", 88],
  ["Engineering", 71],
] as const;

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Admin intelligence"
        title="Analytics Dashboard"
        description="Org-wide goal completion rates, trends, distribution, and manager effectiveness."
        actions={
          <>
            <select className="field">
              <option>2026 Annual Goals</option>
            </select>
            <select className="field">
              <option>Q2</option>
              <option>Q1</option>
            </select>
          </>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Org Completion" value={<span>72.4<span className="text-2xl text-muted-foreground/70">%</span></span>} sublabel={<span className="text-success">+4.2% from Q1</span>} accent="primary" icon={<ChartIcon />} />
        <StatCard label="On-Track Goals" value="1,402" sublabel="68% of total" accent="success" icon={<TargetIcon />} />
        <StatCard label="Pending Check-ins" value="340" sublabel="Due in 5 days" accent="warning" icon={<ClockIcon />} />
        <StatCard label="Goals / Employee" value="4.2" sublabel="Optimal range: 4-6" accent="violet" icon={<UsersIcon />} />
      </div>

      <Panel className="mb-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Completion Trend</h2>
            <p className="mt-1 text-sm text-muted-foreground">Monthly org-wide completion rate</p>
          </div>
          <Pill tone="primary">Completion %</Pill>
        </div>
        <div className="flex h-72 items-end gap-3 rounded-xl border border-border/70 bg-black/10 p-4">
          {trend.map((point) => (
            <div key={point.m} className="flex h-full flex-1 flex-col justify-end gap-3">
              <div className="relative flex flex-1 items-end">
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-primary to-teal shadow-[0_0_30px_oklch(0.62_0.24_268/0.25)]"
                  style={{ height: `${point.v}%` }}
                />
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 font-mono text-[10px] text-muted-foreground">{point.v}%</span>
              </div>
              <div className="text-center font-mono text-xs text-muted-foreground">{point.m}</div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="text-xl font-semibold">Goal Distribution</h2>
          <p className="mt-1 text-sm text-muted-foreground">By thrust area</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-[220px_1fr] sm:items-center">
            <div
              className="mx-auto h-52 w-52 rounded-full"
              style={{
                background: "conic-gradient(var(--primary) 0 32%, var(--teal) 32% 56%, var(--violet) 56% 74%, var(--success) 74% 88%, var(--warning) 88% 100%)",
              }}
            >
              <div className="grid h-full place-items-center rounded-full p-10">
                <div className="grid h-full w-full place-items-center rounded-full bg-card text-center">
                  <div>
                    <div className="font-mono text-3xl font-semibold">5</div>
                    <div className="text-xs text-muted-foreground">Areas</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {donut.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                    {item.name}
                  </div>
                  <span className="font-mono text-muted-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-semibold">Manager Effectiveness</h2>
          <p className="mt-1 text-sm text-muted-foreground">Check-in approval rate</p>
          <div className="mt-6 space-y-4">
            {managers.map((manager) => (
              <div key={manager.name} className="grid grid-cols-[84px_1fr_44px] items-center gap-3">
                <div className="truncate text-sm">{manager.name}</div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-teal" style={{ width: `${manager.rate}%` }} />
                </div>
                <div className="text-right font-mono text-xs text-muted-foreground">{manager.rate}%</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <h2 className="text-xl font-semibold">Completion Heatmap</h2>
        <p className="mt-1 text-sm text-muted-foreground">By department</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map(([name, value]) => (
            <div key={name} className="rounded-xl border border-border/70 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">{name}</span>
                <span className="font-mono text-xs text-muted-foreground">{value}%</span>
              </div>
              <div className="h-24 rounded-lg" style={{ background: `linear-gradient(135deg, oklch(0.62 0.24 268 / ${value / 130}), oklch(0.78 0.15 195 / ${value / 160}))` }} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
