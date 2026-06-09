"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MobileHeader } from "./mobile-header";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import type { DashboardLayoutProps } from "./types";

export function DashboardLayout({ children, navItems }: DashboardLayoutProps) {
  const pathname = usePathname();
  const usesSolidBlueShell =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/merchant") ||
    pathname.startsWith("/member");

  return (
    <div
      className={cn(
        "min-h-screen bg-background",
        usesSolidBlueShell && "dashboard-dark-blue-shell",
      )}
    >
      <div className="flex">
        {/* Sidebar (desktop/tablet) */}
        <Sidebar navItems={navItems} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile header (logo + user menu) */}
          <MobileHeader />

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav navItems={navItems} />
    </div>
  );
}
