"use client";

import React from "react";
import { PageHeader, Pill, StatCard, UsersIcon } from "@/components/ui-shell";

const columns = [
  { id: 'DRAFT', title: 'Draft' },
  { id: 'SUBMITTED', title: 'Submitted' },
  { id: 'APPROVED', title: 'Approved' },
  { id: 'LOCKED', title: 'Locked' },
  { id: 'RETURNED', title: 'Returned' },
];

const mockCards = [
  { id: '1', employee: 'Arjun K.', dept: 'Backend', status: 'SUBMITTED', goals: 4, date: '12 May 2026' },
  { id: '2', employee: 'Sneha R.', dept: 'Frontend', status: 'DRAFT', goals: 2, date: '-' },
  { id: '3', employee: 'Vikram S.', dept: 'Design', status: 'APPROVED', goals: 5, date: '10 May 2026' },
];

export default function TeamOverviewPage() {
  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col">
      <PageHeader
        eyebrow="Manager workspace"
        title="Team Overview"
        description="Manage and approve goals for your direct reports."
        actions={<button className="btn btn-secondary">Export View</button>}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Submitted" value={mockCards.filter(card => card.status === "SUBMITTED").length} sublabel="Ready for review" accent="warning" icon={<UsersIcon />} />
        <StatCard label="Approved" value={mockCards.filter(card => card.status === "APPROVED").length} sublabel="Aligned this cycle" accent="success" icon={<UsersIcon />} />
        <StatCard label="Drafts" value={mockCards.filter(card => card.status === "DRAFT").length} sublabel="Need nudges" accent="primary" icon={<UsersIcon />} />
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const cards = mockCards.filter(c => c.status === col.id);
          return (
            <section key={col.id} className="flex w-72 shrink-0 flex-col rounded-2xl border border-border/80 bg-card/50 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-border/70 p-4">
                <h3 className="text-sm font-semibold">{col.title}</h3>
                <span className="font-mono text-xs text-muted-foreground">{cards.length}</span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {cards.map(card => (
                  <article key={card.id} className="rounded-xl border border-border/80 bg-white/[0.045] p-4 shadow-elevated transition hover:-translate-y-0.5 hover:border-primary/40">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="font-semibold">{card.employee}</div>
                      <Pill tone="muted">{card.dept}</Pill>
                    </div>
                    <div className="mb-4 space-y-1 text-xs text-muted-foreground">
                      <p>{card.goals} Goals</p>
                      {card.status !== 'DRAFT' && <p>Submitted: {card.date}</p>}
                    </div>

                    {card.status === 'SUBMITTED' && (
                      <button className="btn btn-primary min-h-9 w-full text-xs">
                        Review
                      </button>
                    )}
                    {card.status === 'APPROVED' && (
                      <button className="btn btn-secondary min-h-9 w-full text-xs">
                        View
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
