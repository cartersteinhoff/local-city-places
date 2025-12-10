"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ChevronDown, Shield, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  userEmail?: string;
  userName?: string;
  userRole?: "admin" | "merchant" | "member";
}

const roleConfig = {
  admin: { label: "Admin", icon: Shield, href: "/admin", color: "text-primary" },
  merchant: { label: "Merchant", icon: Store, href: "/merchant", color: "text-blue-500" },
  member: { label: "Member", icon: User, href: "/member", color: "text-green-500" },
};

export function Header({ userEmail, userName, userRole }: HeaderProps) {
  const pathname = usePathname();
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
    : pathname.startsWith("/member")
    ? "member"
    : "admin";

  const CurrentIcon = roleConfig[currentView].icon;
  const isAdmin = userRole === "admin";

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      {/* Mobile logo */}
      <div className="md:hidden flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-gradient flex items-center justify-center">
            <span className="text-white font-bold text-sm">LC</span>
          </div>
          <span className="font-semibold text-foreground">
            Local City Places
          </span>
        </Link>
      </div>

      {/* Desktop spacer */}
      <div className="hidden md:block" />

      {/* User menu */}
      <div className="flex items-center gap-3">
        {/* Role Switcher (Admin only) */}
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CurrentIcon className={`w-4 h-4 ${roleConfig[currentView].color}`} />
                <span className="hidden sm:inline">{roleConfig[currentView].label}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Switch View</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(roleConfig).map(([key, config]) => {
                const Icon = config.icon;
                const isActive = currentView === key;
                return (
                  <DropdownMenuItem key={key} asChild disabled={isActive}>
                    <Link href={config.href} className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      {config.label}
                      {isActive && <span className="ml-auto text-xs text-muted-foreground">Current</span>}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-foreground">{displayName}</p>
          {userName && userEmail && (
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">
              {initials}
            </span>
          </div>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Logout button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/api/auth/logout">
              <LogOut className="w-5 h-5" />
              <span className="sr-only">Log out</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
