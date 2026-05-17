export type AppRole = "EMPLOYEE" | "MANAGER_L1" | "ADMIN_HR" | "SUPER_ADMIN";

const roleHierarchy: Record<AppRole, AppRole[]> = {
  EMPLOYEE: ["EMPLOYEE"],
  MANAGER_L1: ["MANAGER_L1", "EMPLOYEE"],
  ADMIN_HR: ["ADMIN_HR", "MANAGER_L1", "EMPLOYEE"],
  SUPER_ADMIN: ["SUPER_ADMIN", "ADMIN_HR", "MANAGER_L1", "EMPLOYEE"],
};

export const rolePermissions: Record<AppRole, string[]> = {
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

export function getInheritedRoles(role?: string | null): AppRole[] {
  if (!role || !(role in roleHierarchy)) return [];
  return roleHierarchy[role as AppRole];
}

export function hasRoleAccess(userRole: string | null | undefined, allowedRoles?: string[]) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const effectiveRoles = new Set(getInheritedRoles(userRole));
  return allowedRoles.some((role) => effectiveRoles.has(role as AppRole));
}

export function getEffectivePermissions(role?: string | null, permissions: string[] = []) {
  const effective = new Set(permissions);
  if (role && role in rolePermissions) {
    for (const permission of rolePermissions[role as AppRole]) {
      effective.add(permission);
    }
  }
  return [...effective];
}

export function hasPermissionAccess(role: string | null | undefined, permissions: string[] | undefined, permission: string) {
  return getEffectivePermissions(role, permissions).includes(permission);
}