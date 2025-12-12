"use client";

import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Header } from "./header";
import type { DashboardLayoutProps } from "./types";

export function DashboardLayout({
  children,
  navItems,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar (desktop/tablet) */}
        <Sidebar navItems={navItems} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <Header />

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav navItems={navItems} />
    </div>
  );
}
