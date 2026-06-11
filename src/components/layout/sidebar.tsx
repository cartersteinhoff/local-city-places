"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  LogOut,
  Mic,
  Moon,
  Shield,
  Store,
  Sun,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { RadioPlayerButton } from "@/components/radio-player-button";
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
import { getMarketLockStatusLabel } from "@/lib/market-lock-status";
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

const MARKETLOCK360_HREF = "/merchant/marketlock360";
const ON_AIR_STUDIO_HREF = "/merchant/on-air-studio";
const ON_AIR_GRADIENT =
  "linear-gradient(90deg, #f43a20 0%, #ff1b14 42%, #10b9b4 100%)";
const MARKETLOCK360_GRADIENT =
  "linear-gradient(90deg, #10b981 0%, #0f766e 52%, #f97316 100%)";

interface SidebarProps {
  navItems: NavItem[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function getActiveHref(pathname: string, navItems: NavItem[]) {
  return navItems
    .filter((item) => {
      const hrefSegments = item.href.split("/").filter(Boolean).length;

      return (
        pathname === item.href ||
        (hrefSegments > 1 && pathname.startsWith(`${item.href}/`))
      );
    })
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

function groupNavItems(navItems: NavItem[]) {
  return navItems.reduce<Array<{ label: string; items: NavItem[] }>>(
    (groups, item) => {
      const label = item.section || "Navigation";
      const existingGroup = groups.find((group) => group.label === label);

      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        groups.push({ label, items: [item] });
      }

      return groups;
    },
    [],
  );
}

function BroadcastMicMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex shrink-0 items-center justify-center text-[#f2381f]",
        compact ? "h-6 w-6" : "h-6 w-7",
      )}
    >
      <span
        className={cn(
          "absolute rounded-l-full border-[#f2381f] border-r-0",
          compact
            ? "left-0 h-4.5 w-1.5 border-y-2 border-l-2"
            : "left-0 h-5 w-2 border-y-2 border-l-2",
        )}
      />
      <span
        className={cn(
          "absolute rounded-l-full border-[#f2381f] border-r-0",
          compact
            ? "left-1.5 h-3.5 w-1 border-y-2 border-l-2"
            : "left-2 h-3.5 w-1.5 border-y-2 border-l-2",
        )}
      />
      <Mic
        className={cn(
          "relative z-10 stroke-[#f2381f]",
          compact ? "h-4 w-4" : "h-4.5 w-4.5",
        )}
        strokeWidth={2.8}
      />
      <span
        className={cn(
          "absolute rounded-r-full border-[#f2381f] border-l-0",
          compact
            ? "right-1.5 h-3.5 w-1 border-y-2 border-r-2"
            : "right-2 h-3.5 w-1.5 border-y-2 border-r-2",
        )}
      />
      <span
        className={cn(
          "absolute rounded-r-full border-[#f2381f] border-l-0",
          compact
            ? "right-0 h-4.5 w-1.5 border-y-2 border-r-2"
            : "right-0 h-5 w-2 border-y-2 border-r-2",
        )}
      />
    </span>
  );
}

function StudioSignalBars({ compact = false }: { compact?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-end justify-end gap-0.5",
        compact ? "h-4 w-4" : "h-5 w-5",
      )}
    >
      <span
        className={cn(
          "w-1 rounded-t-sm bg-[#10b9b4]",
          compact ? "h-1.5" : "h-2",
        )}
      />
      <span
        className={cn(
          "w-1 rounded-t-sm bg-[#10b9b4]",
          compact ? "h-2.5" : "h-3.5",
        )}
      />
      <span
        className={cn(
          "w-1 rounded-t-sm bg-[#10b9b4]",
          compact ? "h-3.5" : "h-5",
        )}
      />
      {!compact && <span className="h-3 w-1 rounded-t-sm bg-[#10b9b4]" />}
    </span>
  );
}

function OnAirStudioMark({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "flex h-10 w-full rounded-full p-[1.5px] transition-[box-shadow,opacity,transform] duration-200",
        isActive
          ? "opacity-100 shadow-[0_6px_16px_rgba(16,185,180,0.14)]"
          : "opacity-[0.78] group-hover:opacity-100 group-hover:shadow-[0_6px_14px_rgba(15,23,42,0.08)]",
      )}
      style={{ background: ON_AIR_GRADIENT }}
    >
      <span
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1.5 rounded-full px-2 transition-colors",
          isActive
            ? "bg-white dark:bg-sidebar"
            : "bg-sidebar group-hover:bg-background dark:group-hover:bg-sidebar-accent",
        )}
      >
        <BroadcastMicMark />
        <span className="min-w-0 flex-1 whitespace-nowrap text-sm font-extrabold leading-none tracking-normal">
          <span className="text-[#f01813]">On-Air</span>{" "}
          <span className="text-[#061c34] dark:text-sidebar-foreground">
            Studio
          </span>
        </span>
        <StudioSignalBars />
      </span>
    </span>
  );
}

function CollapsedOnAirStudioMark({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full p-[1.5px] transition-[box-shadow,opacity] duration-200",
        isActive
          ? "opacity-100 shadow-[0_6px_14px_rgba(16,185,180,0.16)]"
          : "opacity-[0.82] group-hover:opacity-100 group-hover:shadow-[0_6px_14px_rgba(15,23,42,0.1)]",
      )}
      style={{ background: ON_AIR_GRADIENT }}
    >
      <span
        className={cn(
          "flex h-full w-full items-center justify-center gap-0.5 rounded-full transition-colors",
          isActive
            ? "bg-white dark:bg-sidebar"
            : "bg-sidebar group-hover:bg-background dark:group-hover:bg-sidebar-accent",
        )}
      >
        <BroadcastMicMark compact />
        <StudioSignalBars compact />
      </span>
    </span>
  );
}

function MarketLock360Mark({
  isActive,
  statusLabel,
}: {
  isActive: boolean;
  statusLabel: string;
}) {
  return (
    <span
      className={cn(
        "flex h-10 w-full rounded-full p-[1.5px] transition-[box-shadow,opacity,transform] duration-200",
        isActive
          ? "opacity-100 shadow-[0_6px_16px_rgba(249,115,22,0.14)]"
          : "opacity-[0.82] group-hover:opacity-100 group-hover:shadow-[0_6px_14px_rgba(15,23,42,0.08)]",
      )}
      style={{ background: MARKETLOCK360_GRADIENT }}
    >
      <span
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-full px-2.5 transition-colors",
          isActive
            ? "bg-white dark:bg-sidebar"
            : "bg-sidebar group-hover:bg-background dark:group-hover:bg-sidebar-accent",
        )}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <LockKeyhole className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
        <span className="min-w-0 flex-1 whitespace-nowrap text-sm font-extrabold leading-none tracking-normal text-[#061c34] dark:text-sidebar-foreground">
          MarketLock360
        </span>
        <span
          className={cn(
            "flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-black leading-none ring-1",
            statusLabel === "Trial"
              ? "bg-orange-500/10 text-orange-500 ring-orange-500/20"
              : statusLabel === "Pro"
                ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20"
                : "bg-slate-500/10 text-slate-500 ring-slate-500/20 dark:text-slate-300 dark:ring-slate-300/20",
          )}
        >
          {statusLabel}
        </span>
      </span>
    </span>
  );
}

function CollapsedMarketLock360Mark({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full p-[1.5px] transition-[box-shadow,opacity] duration-200",
        isActive
          ? "opacity-100 shadow-[0_6px_14px_rgba(249,115,22,0.16)]"
          : "opacity-[0.82] group-hover:opacity-100 group-hover:shadow-[0_6px_14px_rgba(15,23,42,0.1)]",
      )}
      style={{ background: MARKETLOCK360_GRADIENT }}
    >
      <span
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full transition-colors",
          isActive
            ? "bg-white dark:bg-sidebar"
            : "bg-sidebar group-hover:bg-background dark:group-hover:bg-sidebar-accent",
        )}
      >
        <LockKeyhole className="h-4 w-4 text-emerald-500" strokeWidth={2.4} />
      </span>
    </span>
  );
}

export function Sidebar({
  navItems,
  isCollapsed: collapsedProp = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { merchant, user, userName } = useUser();
  const activeHref = getActiveHref(pathname, navItems);
  const [localCollapsed, setLocalCollapsed] = useState(collapsedProp);
  const isCollapsed = onToggleCollapse ? collapsedProp : localCollapsed;

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
  const hasSections = navItems.some((item) => item.section);
  const navGroups = groupNavItems(navItems);
  const nextTheme = theme === "dark" ? "light" : "dark";
  const marketLockStatusLabel = getMarketLockStatusLabel(
    merchant?.marketLockStatus,
  );

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
      return;
    }

    setLocalCollapsed((current) => !current);
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = item.href === activeHref;
    const Icon = item.icon;

    if (item.href === MARKETLOCK360_HREF) {
      return (
        <Link
          key={item.href}
          href={item.href}
          title={isCollapsed ? item.label : undefined}
          className={cn(
            "group rounded-md transition-colors",
            isCollapsed ? "flex justify-center py-1" : "block px-0.5 py-0",
          )}
        >
          {isCollapsed ? (
            <CollapsedMarketLock360Mark isActive={isActive} />
          ) : (
            <MarketLock360Mark
              isActive={isActive}
              statusLabel={marketLockStatusLabel}
            />
          )}
        </Link>
      );
    }

    if (item.href === ON_AIR_STUDIO_HREF) {
      return (
        <Link
          key={item.href}
          href={item.href}
          title={isCollapsed ? item.label : undefined}
          className={cn(
            "group rounded-md transition-colors",
            isCollapsed ? "flex justify-center py-1" : "block px-0.5 py-0",
          )}
        >
          {isCollapsed ? (
            <CollapsedOnAirStudioMark isActive={isActive} />
          ) : (
            <OnAirStudioMark isActive={isActive} />
          )}
        </Link>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        title={isCollapsed ? item.label : undefined}
        className={cn(
          "group flex items-center gap-3 rounded-md border-l-2 py-2.5 pr-3 text-sm font-medium transition-colors",
          isCollapsed ? "justify-center border-l-0 px-0" : "pl-2.5",
          isActive
            ? "border-sidebar-primary bg-sidebar-primary/10 text-sidebar-primary"
            : "border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            isActive
              ? "text-sidebar-primary"
              : "text-muted-foreground group-hover:text-sidebar-foreground",
          )}
          strokeWidth={1.75}
        />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "dashboard-dark-blue-sidebar",
        "sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 md:flex",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "relative flex h-14 items-center border-b border-sidebar-border",
          isCollapsed ? "justify-center px-2" : "gap-3 px-3",
        )}
      >
        <Link
          href="/"
          aria-label="Go to Local City Places homepage"
          className="flex min-w-0 items-center"
          title="Local City Places homepage"
        >
          {isCollapsed ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-gradient">
              <span className="text-white font-bold text-sm">LC</span>
            </div>
          ) : (
            <Image
              src="/images/local-city-places-header-logo-v12.webp"
              alt="Local City Places"
              width={1592}
              height={713}
              className="h-11 w-auto"
              priority
            />
          )}
        </Link>

        <button
          type="button"
          onClick={handleToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "z-10 flex items-center justify-center border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm transition-colors hover:bg-sidebar-accent",
            isCollapsed
              ? "absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full"
              : "ml-auto h-8 w-8 rounded-md",
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {hasSections ? (
          <div className={cn("pb-4", isCollapsed ? "space-y-2" : "space-y-3")}>
            {navGroups.map((group) => (
              <div key={group.label}>
                {!isCollapsed && (
                  <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                )}
                <div className="space-y-1">
                  {group.items.map(renderNavItem)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">{navItems.map(renderNavItem)}</div>
        )}
      </nav>

      <div className={cn("px-2 pb-2", isCollapsed && "flex justify-center")}>
        <RadioPlayerButton
          variant={isCollapsed ? "sidebar-collapsed" : "sidebar"}
        />
      </div>

      <div className="border-t border-sidebar-border p-2">
        <div
          className={cn(
            "flex items-center",
            isCollapsed ? "flex-col gap-2" : "gap-2",
          )}
        >
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Open account menu for ${displayName}`}
                title={isCollapsed ? displayName : undefined}
                className={cn(
                  "flex min-w-0 items-center gap-3 rounded-md text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60",
                  isCollapsed
                    ? "h-10 w-10 justify-center p-0"
                    : "flex-1 px-2.5 py-2",
                )}
              >
                <Avatar className="h-8 w-8 shrink-0 border border-sidebar-border">
                  {user?.profilePhotoUrl && (
                    <AvatarImage src={user.profilePhotoUrl} alt="" />
                  )}
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium leading-tight text-sidebar-foreground">
                      {displayName}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <CurrentIcon
                        className={`h-3 w-3 ${roleConfig[currentView].color}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {roleConfig[currentView].label}
                      </span>
                    </div>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className={cn(
                "w-56",
                (currentView === "admin" ||
                  currentView === "merchant" ||
                  currentView === "member") &&
                  "dark:border-sky-300/20 dark:bg-[#061f33] dark:text-slate-50",
              )}
            >
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

          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => setTheme(nextTheme)}
            aria-label={`Switch to ${nextTheme} mode`}
            title={`Switch to ${nextTheme} mode`}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60"
          >
            <Sun
              className="h-4.5 w-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
              strokeWidth={1.75}
            />
            <Moon
              className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
              strokeWidth={1.75}
            />
          </button>
        </div>
      </div>
    </aside>
  );
}
