export type AppRole = "EMPLOYEE" | "MANAGER_L1" | "ADMIN_HR" | "SUPER_ADMIN";

const rolePermissions: Record<AppRole, string[]> = {
  EMPLOYEE: ["CREATE_GOAL", "SUBMIT_GOAL", "LOG_CHECKIN"],
  MANAGER_L1: [
    "CREATE_GOAL",
    "SUBMIT_GOAL",
    "APPROVE_GOAL",
    "RETURN_GOAL",
    "LOG_CHECKIN",
    "VIEW_TEAM_GOALS",
    "VIEW_ANALYTICS",
    "PUSH_SHARED_GOAL",
    "VIEW_AUDIT_LOGS",
  ],
  ADMIN_HR: [
    "CREATE_GOAL",
    "SUBMIT_GOAL",
    "APPROVE_GOAL",
    "RETURN_GOAL",
    "UNLOCK_GOAL",
    "LOG_CHECKIN",
    "VIEW_TEAM_GOALS",
    "VIEW_ANALYTICS",
    "MANAGE_CYCLES",
    "PUSH_SHARED_GOAL",
    "VIEW_AUDIT_LOGS",
    "MANAGE_USERS",
    "EXPORT_REPORTS",
  ],
  SUPER_ADMIN: [
    "CREATE_GOAL",
    "SUBMIT_GOAL",
    "APPROVE_GOAL",
    "RETURN_GOAL",
    "UNLOCK_GOAL",
    "LOG_CHECKIN",
    "VIEW_TEAM_GOALS",
    "VIEW_ANALYTICS",
    "MANAGE_CYCLES",
    "PUSH_SHARED_GOAL",
    "VIEW_AUDIT_LOGS",
    "MANAGE_USERS",
    "EXPORT_REPORTS",
  ],
};

export function getEffectivePermissions(role?: string | null, permissions: string[] = []) {
  const effective = new Set(permissions);
  if (role && role in rolePermissions) {
    for (const permission of rolePermissions[role as AppRole]) {
      effective.add(permission);
    }
  }
  return [...effective];
}

export function hasPermission(role: string | null | undefined, permissions: string[] | undefined, permission: string) {
  return getEffectivePermissions(role, permissions).includes(permission);
}