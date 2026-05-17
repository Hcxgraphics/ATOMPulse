import { CalendarIcon, PageHeader, Panel, Pill, StatCard, TargetIcon } from "@/components/ui-shell";

const cycles = [
  { name: "2026 Annual Goals", phase: "Check-ins Open", window: "01 Apr - 30 Jun 2026", participants: 1240, completion: 72 },
  { name: "Q1 Calibration", phase: "Locked", window: "01 Jan - 31 Mar 2026", participants: 1188, completion: 94 },
  { name: "Leadership OKRs", phase: "Draft", window: "01 Jul - 30 Sep 2026", participants: 84, completion: 18 },
];

export default function AdminCyclesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Admin control"
        title="Goal Cycles"
        description="Configure cycle windows, submission gates, and organization-wide goal governance."
        actions={
          <>
            <button className="btn btn-secondary">Cycle Settings</button>
            <button className="btn btn-primary">Create Cycle</button>
          </>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active Cycles" value="1" sublabel="Currently accepting check-ins" accent="primary" icon={<CalendarIcon />} />
        <StatCard label="Participants" value="1,240" sublabel="Across active cycle" accent="teal" icon={<TargetIcon />} />
        <StatCard label="Avg Completion" value={<span>72<span className="text-2xl text-muted-foreground/70">%</span></span>} sublabel="Org-wide" accent="success" icon={<TargetIcon />} />
      </div>

      <Panel>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold">Cycle Registry</h2>
            <p className="mt-1 text-sm text-muted-foreground">Operational view of active, locked, and upcoming goal cycles.</p>
          </div>
          <select className="field w-full sm:w-56">
            <option>All cycle states</option>
            <option>Open</option>
            <option>Locked</option>
          </select>
        </div>

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Cycle</th>
                <th>Phase</th>
                <th>Window</th>
                <th>Participants</th>
                <th>Completion</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map((cycle) => (
                <tr key={cycle.name}>
                  <td className="font-semibold">{cycle.name}</td>
                  <td>
                    <Pill tone={cycle.phase === "Locked" ? "success" : cycle.phase === "Draft" ? "muted" : "primary"}>{cycle.phase}</Pill>
                  </td>
                  <td className="font-mono text-xs text-muted-foreground">{cycle.window}</td>
                  <td className="font-mono text-sm">{cycle.participants.toLocaleString()}</td>
                  <td>
                    <div className="flex min-w-36 items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-teal" style={{ width: `${cycle.completion}%` }} />
                      </div>
                      <span className="font-mono text-xs">{cycle.completion}%</span>
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
