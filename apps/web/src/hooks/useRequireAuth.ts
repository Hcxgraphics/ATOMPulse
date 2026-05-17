"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

type AllowedRole = "EMPLOYEE" | "MANAGER_L1" | "ADMIN_HR" | "SUPER_ADMIN";

export function useRequireAuth(allowedRoles?: AllowedRole[]) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken || state.token);

  useEffect(() => {
    if (!accessToken || !user) {
      router.replace("/login");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role as AllowedRole)) {
      router.replace("/dashboard");
    }
  }, [allowedRoles, accessToken, router, user]);

  return { user, accessToken };
}
