"use client";

import React from "react";

type InfoTooltipProps = {
  label: string;
  content: React.ReactNode;
  className?: string;
};

export function InfoTooltip({ label, content, className = "" }: InfoTooltipProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <span
      className={`relative inline-flex align-middle ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/70 bg-white/5 text-[11px] font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        onClick={() => setOpen((value) => !value)}
      >
        i
      </button>

      <span
        className={`absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 transition duration-200 ${
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <span className="block rounded-2xl border border-white/10 bg-slate-950/95 px-3 py-2 text-xs leading-5 text-slate-100 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {content}
        </span>
      </span>
    </span>
  );
}