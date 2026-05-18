"use client";

import React from "react";
import { Panel, Pill } from "@/components/ui-shell";

type CalendarEvent = {
  date: number;
  title: string;
  type: "task" | "checkin" | "review" | "meeting" | "escalation" | "deadline";
  description?: string;
};

const eventColors: Record<CalendarEvent["type"], { bg: string; text: string; label: string }> = {
  task: { bg: "bg-primary/10", text: "text-primary", label: "Task" },
  checkin: { bg: "bg-teal/10", text: "text-teal", label: "Check-in" },
  review: { bg: "bg-warning/10", text: "text-warning", label: "Review" },
  meeting: { bg: "bg-violet/10", text: "text-violet", label: "Meeting" },
  escalation: { bg: "bg-destructive/10", text: "text-destructive", label: "Escalation" },
  deadline: { bg: "bg-success/10", text: "text-success", label: "Deadline" },
};

export function DashboardCalendarWidget() {
  const now = new Date(2026, 4, 18); // May 18, 2026 (0-indexed)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  
  const events: CalendarEvent[] = [
    { date: 19, title: "Deployment Runbook Review", type: "review" },
    { date: 20, title: "Q2 Check-in Deadline", type: "deadline" },
    { date: 22, title: "Sales Forecast Due", type: "task" },
    { date: 24, title: "Compliance Review", type: "review" },
    { date: 26, title: "Sprint Planning", type: "meeting" },
    { date: 28, title: "Manager 1:1 Check-in", type: "checkin" },
    { date: 30, title: "Escalation Review", type: "escalation" },
  ];

  const [selectedDate, setSelectedDate] = React.useState<number | null>(null);
  const selectedEvents = selectedDate ? events.filter((e) => e.date === selectedDate) : [];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - firstDay + 1;
    return dayNum > 0 && dayNum <= daysInMonth ? dayNum : null;
  });

  return (
    <Panel className="surface-panel">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Calendar</div>
          <h3 className="mt-2 text-xl font-semibold">May 2026</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Click a date to see upcoming tasks, reviews, and deadlines.</p>
        </div>
        <div className="flex gap-2">
          {Object.entries(eventColors).map(([key, { text, label }]) => (
            <div key={key} className="flex items-center gap-1">
              <div className={`h-2 w-2 rounded-full ${text.replace("text-", "bg-")}`} />
              <span className="text-[10px] text-muted-foreground/70">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-1 rounded-2xl border border-border/70 bg-white/[0.02] p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            const dayEvents = day ? events.filter((e) => e.date === day) : [];
            const isToday = day === 18;
            const isSelected = day === selectedDate;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`relative aspect-square rounded-xl p-2 text-left transition ${
                  isToday
                    ? "border-2 border-primary bg-primary/15"
                    : isSelected
                    ? "border border-primary/60 bg-primary/10"
                    : "border border-border/50 bg-white/[0.03] hover:bg-white/[0.06]"
                } ${!day ? "pointer-events-none opacity-0" : ""}`}
              >
                <div className="text-xs font-semibold">{day}</div>
                {dayEvents.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.title}
                        className={`h-1.5 w-1.5 rounded-full ${eventColors[event.type].text.replace("text-", "bg-")}`}
                      />
                    ))}
                    {dayEvents.length > 2 && <div className="text-[9px] text-muted-foreground/60">+{dayEvents.length - 2}</div>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date details */}
      {selectedDate && (
        <div className="rounded-2xl border border-border/70 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold">
              May {selectedDate}, 2026 {selectedDate === 18 ? "(Today)" : ""}
            </h4>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
          {selectedEvents.length > 0 ? (
            <div className="space-y-2">
              {selectedEvents.map((event) => (
                <div
                  key={event.title}
                  className={`flex items-start gap-3 rounded-lg ${eventColors[event.type].bg} p-3`}
                >
                  <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${eventColors[event.type].text.replace("text-", "bg-")} mt-1`} />
                  <div>
                    <div className={`text-sm font-semibold ${eventColors[event.type].text}`}>
                      {event.title}
                    </div>
                    {event.description && (
                      <div className="mt-1 text-xs text-muted-foreground">{event.description}</div>
                    )}
                    <div className="mt-1">
                      <Pill tone={event.type === "escalation" ? "danger" : event.type === "deadline" ? "success" : "muted"}>
                        {eventColors[event.type].label}
                      </Pill>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No events scheduled for this date.</div>
          )}
        </div>
      )}
    </Panel>
  );
}
