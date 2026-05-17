"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import React from "react";
import { PageHeader, Panel, Pill } from "@/components/ui-shell";
import apiClient, { getApiErrorMessage } from "@/lib/apiClient";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const empty = { name: "", email: "", employeeCode: "", departmentId: "", roleId: "", managerId: "", password: "" };

export default function AdminUsersPage() {
  useRequireAuth(["ADMIN_HR", "SUPER_ADMIN"]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [departments, setDepartments] = React.useState<any[]>([]);
  const [roles, setRoles] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("ALL");
  const [editing, setEditing] = React.useState<any | null>(null);
  const [form, setForm] = React.useState(empty);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const [u, d, r] = await Promise.all([apiClient.get("/admin/users"), apiClient.get("/admin/departments"), apiClient.get("/admin/roles")]);
      setUsers(u.data); setDepartments(d.data); setRoles(r.data);
    } catch (err) { setError(getApiErrorMessage(err, "Failed to load users")); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const open = (user?: any) => {
    setEditing(user || {});
    setForm(user ? { name: user.name, email: user.email, employeeCode: user.employeeCode, departmentId: user.departmentId, roleId: user.roleId, managerId: user.managerId || "", password: "" } : empty);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = { ...form } as any;
      if (!body.password) delete body.password;
      const { data } = editing?.id ? await apiClient.patch(`/admin/users/${editing.id}`, body) : await apiClient.post("/admin/users", body);
      setUsers((prev) => editing?.id ? prev.map((u) => u.id === data.id ? data : u) : [data, ...prev]);
      setEditing(null); setMessage(`User ${data.name} saved`);
    } catch (err) { setError(getApiErrorMessage(err, "Failed to save user")); }
  };
  const toggle = async (user: any) => {
    const status = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (status === "INACTIVE" && !confirm(`Deactivating ${user.name} will prevent login. Proceed?`)) return;
    const { data } = await apiClient.patch(`/admin/users/${user.id}`, { status });
    setUsers((prev) => prev.map((u) => u.id === data.id ? data : u));
  };
  const visible = users.filter((u) => (roleFilter === "ALL" || u.role.roleName === roleFilter) && [u.name, u.email, u.employeeCode].join(" ").toLowerCase().includes(search.toLowerCase()));
  return <div><PageHeader eyebrow="Directory" title="Users" description="Manage people, roles, managers, and access status." actions={<button className="btn btn-primary" onClick={() => open()}>Add User</button>} />{message && <div className="mb-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">{message}</div>}{error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}<Panel><div className="mb-4 flex flex-wrap gap-2"><input className="field" placeholder="Search users" value={search} onChange={(e) => setSearch(e.target.value)} /><select className="field" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}><option value="ALL">All roles</option>{roles.map((r) => <option key={r.id}>{r.roleName}</option>)}</select></div><div className="table-shell"><table><thead><tr><th>User</th><th>Role</th><th>Department</th><th>Manager</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map((u) => <tr key={u.id}><td><div className="font-semibold">{u.name}</div><div className="text-xs text-muted-foreground">{u.email} - {u.employeeCode}</div></td><td>{u.role.roleName}</td><td>{u.department.name}</td><td>{u.manager?.name || "-"}</td><td><Pill tone={u.status === "ACTIVE" ? "success" : "muted"}>{u.status}</Pill></td><td><div className="flex gap-2"><button className="btn btn-secondary min-h-8 px-2 text-xs" onClick={() => open(u)}>Edit</button><button className="btn btn-secondary min-h-8 px-2 text-xs" onClick={() => toggle(u)}>{u.status === "ACTIVE" ? "Deactivate" : "Activate"}</button></div></td></tr>)}</tbody></table></div></Panel>{editing && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><form onSubmit={save} className="w-full max-w-lg rounded-2xl border border-border/80 bg-card p-5"><div className="mb-4 flex justify-between"><h2 className="text-xl font-semibold">{editing.id ? "Edit User" : "Add User"}</h2><button type="button" className="btn btn-secondary min-h-8 px-2 text-xs" onClick={() => setEditing(null)}>Close</button></div><div className="grid gap-3 sm:grid-cols-2"><input className="field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><input className="field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><input className="field" placeholder="Employee code" value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} /><input className="field" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><select className="field" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}><option value="">Department</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select><select className="field" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}><option value="">Role</option>{roles.map((r) => <option key={r.id} value={r.id}>{r.roleName}</option>)}</select><select className="field sm:col-span-2" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}><option value="">No manager</option>{users.filter((u) => u.role.roleName === "MANAGER_L1").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select><button className="btn btn-primary sm:col-span-2">Save User</button></div></form></div>}</div>;
}
