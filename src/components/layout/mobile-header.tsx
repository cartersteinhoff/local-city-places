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

export function MobileHeader() {
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

  return (
    <header className="md:hidden h-14 bg-card border-b border-border flex items-center justify-between px-4 sticky top-0 z-40">
      {/* Logo */}
      <Link href="/" className="flex min-w-0 items-center">
        <Image
          src="/images/local-city-places-header-logo-v12.webp"
          alt="Local City Places"
          width={1592}
          height={713}
          className="h-9 w-auto"
          priority
        />
      </Link>

      {/* Right side: Theme toggle + User menu */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute top-2 left-2 w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted transition-colors"
            >
              <Avatar className="w-8 h-8 border-2 border-primary/20">
                {user?.profilePhotoUrl && (
                  <AvatarImage src={user.profilePhotoUrl} alt={displayName} />
                )}
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
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
    </header>
  );
}
