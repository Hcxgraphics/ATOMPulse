"use client";

import React from "react";
import { PortalChrome } from "@/components/ui-shell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalChrome>{children}</PortalChrome>;
}
