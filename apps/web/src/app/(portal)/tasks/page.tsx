"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function TasksPage() {
  const { user } = useRequireAuth(["MANAGER_L1", "ADMIN_HR", "SUPER_ADMIN"]);
  const router = useRouter();

  useEffect(() => {
    // Task management has been integrated into Team Overview
    if (user) {
      router.replace("/team?tab=tasks");
    }
  }, [user, router]);

  return null;
}