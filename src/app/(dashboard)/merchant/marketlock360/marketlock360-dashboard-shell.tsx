"use client";

import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout";
import { merchantNavItems } from "../nav";

interface MarketLock360DashboardShellProps {
  children: ReactNode;
}

export function MarketLock360DashboardShell({
  children,
}: MarketLock360DashboardShellProps) {
  return (
    <DashboardLayout navItems={merchantNavItems}>
      <div className="-m-4 overflow-clip md:-m-6">{children}</div>
    </DashboardLayout>
  );
}
