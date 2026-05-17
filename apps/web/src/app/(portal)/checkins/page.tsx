import { CheckIcon, ClockIcon, PageHeader, Panel, Pill, StatCard } from "@/components/ui-shell";

const checkins = [
  { goal: "Revenue Growth", owner: "You", status: "Due", due: "22 May 2026", progress: 80 },
  { goal: "Reduce TAT", owner: "You", status: "Needs Update", due: "20 May 2026", progress: 42 },
  { goal: "Platform Adoption", owner: "You", status: "Submitted", due: "18 May 2026", progress: 67 },
];

export default function CheckinsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Cycle pulse"
        title="Check-ins"
        description="Track current updates, pending submissions, and manager-ready progress notes."
        actions={<button className="btn btn-primary">Start Check-in</button>}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Open Items" value="2" sublabel="Due this week" accent="warning" icon={<ClockIcon />} />
        <StatCard label="Submitted" value="1" sublabel="Awaiting review" accent="primary" icon={<CheckIcon />} />
        <StatCard label="Avg Progress" value={<span>63<span className="text-2xl text-muted-foreground/70">%</span></span>} sublabel="Across active goals" accent="teal" icon={<CheckIcon />} />
      </div>

      <Panel>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Current check-in window</h2>
            <p className="mt-1 text-sm text-muted-foreground">Q2 updates close in 12 days.</p>
          </div>
          <Pill tone="warning">Open</Pill>
        </div>
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Goal</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {checkins.map((item) => (
                <tr key={item.goal}>
                  <td className="font-semibold">{item.goal}</td>
                  <td className="text-muted-foreground">{item.owner}</td>
                  <td>
                    <Pill tone={item.status === "Submitted" ? "success" : "warning"}>{item.status}</Pill>
                  </td>
                  <td className="font-mono text-xs text-muted-foreground">{item.due}</td>
                  <td>
                    <div className="flex min-w-36 items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="font-mono text-xs">{item.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
