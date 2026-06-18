"use client";

import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout";
import { merchantNavItems } from "./nav";

interface MerchantDashboardShellProps {
  children: ReactNode;
}

export function MerchantDashboardShell({
  children,
}: MerchantDashboardShellProps) {
  return (
    <DashboardLayout navItems={merchantNavItems}>{children}</DashboardLayout>
  );
}
