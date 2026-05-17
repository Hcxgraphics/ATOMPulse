"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { useAuthStore } from "@/lib/store";
import apiClient from "@/lib/apiClient";
import { hasRoleAccess } from "@/lib/access";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
};

const adminRoles = ["ADMIN_HR", "SUPER_ADMIN"];
const managerRoles = ["MANAGER_L1", "ADMIN_HR", "SUPER_ADMIN"];

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "My Work",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
      { href: "/goals", label: "My Goals", icon: <TargetIcon /> },
      { href: "/checkins", label: "Check-ins", icon: <CheckIcon /> },
    ],
  },
  {
    label: "Team",
    items: [{ href: "/team", label: "Team Overview", icon: <UsersIcon />, roles: managerRoles }],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: <ChartIcon />, roles: adminRoles },
      { href: "/admin/cycles", label: "Goal Cycles", icon: <CalendarIcon />, roles: adminRoles },
      { href: "/admin/users", label: "Users", icon: <UserCogIcon />, roles: adminRoles },
      { href: "/admin/shared-goals", label: "Shared Goals", icon: <TargetIcon />, roles: adminRoles },
      { href: "/admin/escalations", label: "Escalations", icon: <ShieldIcon />, roles: adminRoles },
      { href: "/admin/audit", label: "Audit Logs", icon: <ScrollIcon />, roles: adminRoles },
    ],
  },
];

export function PortalChrome({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<any[]>([]);
  const loadNotifications = React.useCallback(async () => {
    try {
      const { data } = await apiClient.get("/notifications", { params: { userId: "me", limit: 20 } });
      setNotifications(data);
    } catch {
      setNotifications([]);
    }
  }, []);

  React.useEffect(() => {
    if (!user) return;
    loadNotifications();
    const id = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(id);
  }, [loadNotifications, user]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") setCommandOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    const handle = window.setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      const [goals, employees] = await Promise.all([
        apiClient.get("/goal-sheets/search", { params: { q: query } }).catch(() => ({ data: [] })),
        user?.role !== "EMPLOYEE" ? apiClient.get("/admin/users/search", { params: { q: query } }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      setResults([...goals.data.map((item: any) => ({ ...item, group: "Goals" })), ...employees.data.map((item: any) => ({ ...item, group: "People", goalTitle: item.name, employeeName: item.department }))]);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, user?.role]);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "AP";

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || hasRoleAccess(user.role, item.roles)),
    }))
    .filter((group) => group.items.length > 0);

  const current = visibleGroups.flatMap((group) => group.items).find((item) => pathname === item.href);

  const signOut = () => {
    logout();
    router.push("/login");
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  const markAllRead = async () => {
    await apiClient.patch("/notifications/read-all", { userId: "me" }).catch(() => null);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const openNotification = async (notification: any) => {
    await apiClient.patch(`/notifications/${notification.id}/read`).catch(() => null);
    setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    setNotificationsOpen(false);
    if (notification.link) router.push(notification.link);
  };

  const quickActions = [
    { label: "Add New Goal", show: hasRoleAccess(user.role, ["EMPLOYEE"]), action: () => router.push("/goals") },
    { label: "View Pending Approvals", show: hasRoleAccess(user.role, ["MANAGER_L1", "ADMIN_HR", "SUPER_ADMIN"]), action: () => router.push("/team") },
    { label: "Export Achievement Report", show: hasRoleAccess(user.role, ["ADMIN_HR", "SUPER_ADMIN"]), action: () => router.push("/admin/analytics") },
    { label: "View Audit Logs", show: hasRoleAccess(user.role, ["ADMIN_HR", "SUPER_ADMIN"]), action: () => router.push("/admin/audit") },
  ].filter((item) => item.show);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="fixed inset-0 -z-20 gradient-aurora opacity-80" />
      <div className="fixed inset-0 -z-10 grid-bg opacity-40" />

      <div className="flex min-h-screen">
        <aside className="hidden w-[268px] shrink-0 border-r border-border/70 glass-strong lg:flex lg:flex-col">
          <SidebarContent
            groups={visibleGroups}
            pathname={pathname}
            initials={initials}
            userName={user.name}
            role={user.role}
            onLogout={signOut}
          />
        </aside>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-label="Close navigation" />
            <aside className="relative h-full w-[290px] border-r border-border/70 glass-strong">
              <SidebarContent
                groups={visibleGroups}
                pathname={pathname}
                initials={initials}
                userName={user.name}
                role={user.role}
                onLogout={signOut}
                onNavigate={() => setOpen(false)}
              />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border/70 glass-strong">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-10">
              <button className="icon-button lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
                <MenuIcon />
              </button>
              <nav className="min-w-0 text-sm text-muted-foreground">
                <span>AtomPulse</span>
                <span className="mx-2 text-muted-foreground/50">/</span>
                <span className="font-medium text-foreground">{current?.label ?? "Workspace"}</span>
              </nav>
              <div className="ml-auto flex items-center gap-2">
                <button className="hidden h-9 min-w-[220px] items-center gap-2 rounded-lg border border-border/70 bg-white/[0.04] px-3 text-left text-xs text-muted-foreground md:flex" onClick={() => setCommandOpen(true)}>
                  <SearchIcon />
                  Search goals, people, cycles
                  <kbd className="ml-auto rounded border border-border/60 px-1.5 py-0.5 font-mono text-[10px]">K</kbd>
                </button>
                <button className="icon-button" aria-label="Notifications" onClick={() => setNotificationsOpen((value) => !value)}>
                  <BellIcon />
                  {unreadCount > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-teal px-1 text-[10px] font-bold text-background">{unreadCount}</span>}
                </button>
                <div className="grid h-9 w-9 place-items-center rounded-lg gradient-primary text-xs font-bold text-primary-foreground shadow-glow">
                  {initials}
                </div>
              </div>
            </div>
          </header>
          {notificationsOpen && (
            <div className="fixed right-4 top-20 z-50 w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-border/80 bg-card p-4 shadow-elevated">
              <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Notifications</h2><button className="btn btn-secondary min-h-8 px-2 text-xs" onClick={markAllRead}>Mark all read</button></div>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {notifications.map((item) => <button key={item.id} className={`w-full rounded-lg border border-border/70 p-3 text-left text-sm ${item.read ? "bg-white/[0.03] text-muted-foreground" : "bg-primary/10"}`} onClick={() => openNotification(item)}><div className="font-semibold text-foreground">{item.title}</div><div className="mt-1 text-xs">{item.message}</div><div className="mt-2 font-mono text-[10px]">{new Date(item.createdAt).toLocaleString()}</div></button>)}
                {notifications.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">No notifications yet.</div>}
              </div>
            </div>
          )}
          {commandOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 p-4" onClick={() => setCommandOpen(false)}>
              <div className="mx-auto mt-20 w-full max-w-2xl rounded-2xl border border-border/80 bg-card p-4 shadow-elevated" onClick={(event) => event.stopPropagation()}>
                <input autoFocus className="field mb-4 w-full" placeholder="Search goals or people..." value={query} onChange={(event) => setQuery(event.target.value)} />
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Quick Actions</div>
                <div className="mb-4 grid gap-2 sm:grid-cols-2">{quickActions.map((action) => <button key={action.label} className="btn btn-secondary justify-start" onClick={() => { action.action(); setCommandOpen(false); }}>{action.label}</button>)}</div>
                {results.length > 0 && <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Results</div>}
                <div className="max-h-72 space-y-2 overflow-y-auto">{results.map((result, index) => <button key={`${result.group}-${result.goalId || result.id || index}`} className="w-full rounded-lg border border-border/70 p-3 text-left hover:bg-white/[0.04]" onClick={() => { router.push(result.href || "/dashboard"); setCommandOpen(false); }}><div className="text-xs text-muted-foreground">{result.group}</div><div className="font-semibold">{result.goalTitle}</div><div className="text-sm text-muted-foreground">{result.employeeName}</div></button>)}</div>
              </div>
            </div>
          )}

          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <div className="mx-auto w-full max-w-[1400px] animate-rise">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  groups,
  pathname,
  initials,
  userName,
  role,
  onLogout,
  onNavigate,
}: {
  groups: { label: string; items: NavItem[] }[];
  pathname: string;
  initials: string;
  userName: string;
  role: string;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-8 pt-6">
        <Link href="/dashboard" onClick={onNavigate} className="group flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
            <SparkIcon />
            <div className="absolute inset-0 -z-10 rounded-xl gradient-primary opacity-50 blur-lg" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">AtomPulse</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Performance OS</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              {group.label}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                        active ? "nav-active text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                      }`}
                    >
                      <span className={active ? "text-primary-glow" : ""}>{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal shadow-[0_0_12px_var(--teal)]" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border/70 p-3">
        <div className="rounded-xl border border-border/70 bg-white/[0.04] p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{userName}</div>
              <div className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{role}</div>
            </div>
            <button className="icon-button" onClick={onLogout} aria-label="Sign out">
              <LogoutIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</div>}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sublabel,
  accent = "primary",
  icon,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  accent?: "primary" | "teal" | "violet" | "warning" | "success" | "destructive";
  icon?: React.ReactNode;
}) {
  return (
    <div className={`stat-card stat-${accent}`}>
      <div className="relative rounded-2xl border border-border/80 bg-card/70 p-5 backdrop-blur-xl">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={`status-dot dot-${accent}`} />
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
          </div>
          {icon && <div className="text-muted-foreground/70">{icon}</div>}
        </div>
        <div className="font-mono text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">{value}</div>
        {sublabel && <div className="mt-2 text-xs text-muted-foreground">{sublabel}</div>}
      </div>
    </div>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-border/80 bg-card/65 p-5 shadow-elevated backdrop-blur-xl ${className}`}>{children}</section>;
}

export function Pill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "success" | "warning" | "primary" | "danger" }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function DashboardIcon() { return <IconBase><rect x="3" y="3" width="7" height="8" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="15" width="7" height="6" rx="1.5" /></IconBase>; }
export function TargetIcon() { return <IconBase><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="M12 8v4l3 2" /></IconBase>; }
export function CheckIcon() { return <IconBase><path d="M9 11l2 2 4-5" /><rect x="4" y="4" width="16" height="16" rx="3" /></IconBase>; }
export function UsersIcon() { return <IconBase><path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4" /><circle cx="12" cy="8" r="3" /><path d="M21 19c0-1.8-1.2-3.2-3-3.8" /><path d="M3 19c0-1.8 1.2-3.2 3-3.8" /></IconBase>; }
export function ChartIcon() { return <IconBase><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 15l3-4 3 2 4-7" /></IconBase>; }
export function CalendarIcon() { return <IconBase><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4" /><path d="M16 3v4" /><path d="M4 10h16" /></IconBase>; }
export function ShieldIcon() { return <IconBase><path d="M12 3l7 3v5c0 4.5-2.8 8.5-7 10-4.2-1.5-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-5" /></IconBase>; }
export function ScrollIcon() { return <IconBase><path d="M8 4h10a2 2 0 012 2v13l-3-2-3 2-3-2-3 2V4z" /><path d="M4 6a2 2 0 012-2h2v15l-2-1.3L4 19V6z" /><path d="M11 8h5" /><path d="M11 12h5" /></IconBase>; }
export function BellIcon() { return <IconBase><path d="M18 9a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" /><path d="M10 20a2 2 0 004 0" /></IconBase>; }
export function SearchIcon() { return <IconBase><circle cx="11" cy="11" r="7" /><path d="M20 20l-3-3" /></IconBase>; }
export function MenuIcon() { return <IconBase><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></IconBase>; }
export function LogoutIcon() { return <IconBase><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 4v16" /></IconBase>; }
export function SparkIcon() { return <IconBase><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></IconBase>; }
export function ArrowIcon() { return <IconBase><path d="M7 17L17 7" /><path d="M9 7h8v8" /></IconBase>; }
export function ClockIcon() { return <IconBase><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></IconBase>; }
export function AlertIcon() { return <IconBase><path d="M12 3l9 16H3L12 3z" /><path d="M12 9v4" /><path d="M12 17h.01" /></IconBase>; }
export function LockIcon() { return <IconBase><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V8a4 4 0 018 0v2" /></IconBase>; }
export function UserCogIcon() { return <IconBase><circle cx="9" cy="8" r="3" /><path d="M3 19c0-3 2.5-5 6-5" /><circle cx="17" cy="16" r="2" /><path d="M17 12.5v1" /><path d="M17 18.5v1" /><path d="M13.9 14.2l.8.5" /><path d="M19.3 17.3l.8.5" /><path d="M20.1 14.2l-.8.5" /><path d="M14.7 17.3l-.8.5" /></IconBase>; }
