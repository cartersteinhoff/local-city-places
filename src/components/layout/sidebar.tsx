"use client";

import { Check, LogOut, Moon, Shield, Store, Sun, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import type { NavItem } from "./types";

const roleConfig = {
  admin: {
    label: "Admin",
    icon: Shield,
    href: "/admin",
    color: "text-primary",
  },
  merchant: {
    label: "Merchant",
    icon: Store,
    href: "/merchant",
    color: "text-blue-500",
  },
  member: {
    label: "Member",
    icon: User,
    href: "/member",
    color: "text-green-500",
  },
};

interface SidebarProps {
  navItems: NavItem[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ navItems, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, userName } = useUser();

  const fullName = userName || user?.email?.split("@")[0] || "User";
  const nameParts = fullName.split(" ");
  const displayName =
    nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
      : fullName;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const currentView = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/merchant")
      ? "merchant"
      : pathname.startsWith("/member")
        ? "member"
        : "admin";

  const isAdmin = user?.role === "admin";
  const CurrentIcon = roleConfig[currentView].icon;

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0 transition-all duration-200",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <Link href="/" className="flex min-w-0 items-center">
          {isCollapsed ? (
            <div className="w-8 h-8 rounded-lg bg-primary-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">LC</span>
            </div>
          ) : (
            <Image
              src="/images/local-city-places-header-logo-v12.webp"
              alt="Local City Places"
              width={1592}
              height={713}
              className="h-10 w-auto"
              priority
            />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const hrefSegments = item.href.split("/").filter(Boolean).length;
          const isActive =
            pathname === item.href ||
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
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section: Theme toggle + User menu */}
      <div className="border-t border-sidebar-border p-2 space-y-2">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full",
            "text-sidebar-foreground hover:bg-sidebar-accent/50",
          )}
        >
          <Sun
            className="w-5 h-5 shrink-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
            strokeWidth={1.75}
          />
          <Moon
            className="w-5 h-5 shrink-0 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
            strokeWidth={1.75}
          />
          {!isCollapsed && <span>Toggle theme</span>}
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full",
                "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Avatar className="w-7 h-7 border border-sidebar-border shrink-0">
                {user?.profilePhotoUrl && (
                  <AvatarImage src={user.profilePhotoUrl} alt={displayName} />
                )}
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground leading-tight truncate">
                    {displayName}
                  </p>
                  <div className="flex items-center gap-1">
                    <CurrentIcon
                      className={`w-3 h-3 ${roleConfig[currentView].color}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {roleConfig[currentView].label}
                    </span>
                  </div>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            {/* User Info Header */}
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <DropdownMenuSeparator />

            {/* Role Switcher (Admin only) */}
            {isAdmin && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Switch View
                </DropdownMenuLabel>
                {Object.entries(roleConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  const isActiveView = currentView === key;
                  return (
                    <DropdownMenuItem key={key} asChild>
                      <Link
                        href={config.href}
                        className="flex items-center gap-2"
                      >
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        {config.label}
                        {isActiveView && (
                          <Check className="ml-auto w-4 h-4 text-primary" />
                        )}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
              </>
            )}

            {/* Logout */}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => {
                fetch("/api/auth/logout", { method: "POST" }).then(() => {
                  window.location.href = "/";
                });
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
