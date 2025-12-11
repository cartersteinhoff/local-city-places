"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "./types";

interface SidebarProps {
  navItems: NavItem[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ navItems, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0 transition-all duration-200",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-gradient flex items-center justify-center">
            <span className="text-white font-bold text-sm">LC</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-sidebar-foreground">
              Local City Places
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          // Only use startsWith for paths with more than 1 segment (e.g., /member/grcs)
          // Dashboard paths (/member, /merchant, /admin) should only match exactly
          const hrefSegments = item.href.split('/').filter(Boolean).length;
          const isActive = pathname === item.href ||
            (hrefSegments > 1 && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
