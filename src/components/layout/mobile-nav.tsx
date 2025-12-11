"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, LogOut, Shield, Store, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { NavItem } from "./types";

interface MobileNavProps {
  navItems: NavItem[];
  userEmail?: string;
  userName?: string;
  userRole?: "admin" | "merchant" | "member";
}

const roleConfig = {
  admin: { label: "Admin", icon: Shield, href: "/admin", color: "text-primary" },
  merchant: { label: "Merchant", icon: Store, href: "/merchant", color: "text-blue-500" },
  member: { label: "Member", icon: User, href: "/member", color: "text-green-500" },
};

export function MobileNav({ navItems, userEmail, userName, userRole }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Show first 4 items in bottom nav, rest go in "More" menu
  const visibleItems = navItems.slice(0, 4);
  const moreItems = navItems.slice(4);

  const displayName = userName || userEmail?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Determine current view based on pathname
  const currentView = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/merchant")
    ? "merchant"
    : "member";

  const isAdmin = userRole === "admin";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 px-3 rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={1.75} />
              <span className="text-xs font-medium truncate max-w-[64px]">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More button with Sheet */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 px-3 rounded-lg transition-colors",
                open
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className="w-5 h-5" strokeWidth={1.75} />
              <span className="text-xs font-medium">More</span>
            </button>
          </SheetTrigger>

          <SheetContent showCloseButton={false}>
            {/* User info section */}
            <div className="flex items-center gap-3 px-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <span className="text-base font-medium text-muted-foreground">
                  {initials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{displayName}</p>
                {userEmail && (
                  <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
                )}
              </div>
            </div>

            {/* Additional nav items */}
            {moreItems.length > 0 && (
              <div className="py-2 border-b border-border">
                {moreItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors",
                        isActive
                          ? "text-primary bg-primary/5"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                      <span className="flex-1 font-medium">{item.label}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Settings section */}
            <div className="py-2 border-b border-border">
              {/* Theme toggle row */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-medium text-foreground">Dark Mode</span>
                <ThemeToggle />
              </div>

              {/* Role switcher (admin only) */}
              {isAdmin && (
                <div className="px-4 py-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Switch View
                  </p>
                  <div className="flex gap-2">
                    {Object.entries(roleConfig).map(([key, config]) => {
                      const Icon = config.icon;
                      const isActive = currentView === key;
                      return (
                        <Link
                          key={key}
                          href={config.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Icon className={cn("w-4 h-4", isActive && config.color)} />
                          <span className="hidden xs:inline">{config.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            <div className="py-2">
              <Link
                href="/api/auth/logout"
                className="flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-5 h-5" strokeWidth={1.75} />
                <span className="font-medium">Log Out</span>
              </Link>
            </div>

            {/* Safe area padding for iOS */}
            <div className="h-safe-area-inset-bottom" />
          </SheetContent>
        </Sheet>
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom bg-card" />
    </nav>
  );
}
