"use client";

import { ChevronDown, Store, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RadioPlayerButton } from "@/components/radio-player-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

type HomeHeaderVariant = "white" | "transparent";

interface HomeHeaderProps {
  variant?: HomeHeaderVariant;
}

const headerVariants = {
  white: {
    bar: "border-b border-sky-300/10 bg-[linear-gradient(135deg,#063860_0%,#01233f_54%,#04131f_100%)] shadow-sm",
    radio:
      "border border-sky-200/25 bg-white/10 px-3 font-semibold text-white shadow-sm hover:bg-white/15 sm:px-4",
    login:
      "bg-[#ff6a00] font-bold text-white shadow-[0_8px_18px_rgba(255,106,0,0.22)] ring-1 ring-orange-300/25 hover:bg-[#f46200] hover:shadow-[0_10px_22px_rgba(255,106,0,0.28)]",
  },
  transparent: {
    bar: "border-b border-white/10 bg-transparent shadow-none",
    radio:
      "border border-sky-200/25 bg-white/10 px-3 font-semibold text-white shadow-sm hover:bg-white/15 sm:px-4",
    login:
      "bg-[#ff6a00] font-bold text-white shadow-[0_8px_18px_rgba(255,106,0,0.22)] ring-1 ring-orange-300/25 hover:bg-[#f46200] hover:shadow-[0_10px_22px_rgba(255,106,0,0.28)]",
  },
} as const;

const loginMenuItemClass =
  "group h-9 cursor-pointer rounded-[11px] px-2 py-0 text-[13px] font-bold text-white/92 transition-colors focus:bg-white/9 focus:text-white data-[highlighted]:bg-white/9 data-[highlighted]:text-white";

const loginMenuIconClass =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-400/12 text-orange-300 transition-colors group-focus:bg-orange-500 group-focus:text-white group-data-[highlighted]:bg-orange-500 group-data-[highlighted]:text-white";

const dashboardHrefByRole = {
  admin: "/admin",
  merchant: "/merchant",
  member: "/member",
} as const;

function getDashboardHref(
  role: keyof typeof dashboardHrefByRole | undefined,
  hasMemberProfile: boolean,
) {
  if (role === "member" && !hasMemberProfile) return "/member/register";
  return role ? dashboardHrefByRole[role] : "/";
}

export function HomeHeader({ variant = "white" }: HomeHeaderProps) {
  const styles = headerVariants[variant];
  const { user, member } = useUser();
  const isAuthenticated = Boolean(user);
  const dashboardHref = getDashboardHref(user?.role, Boolean(member));

  return (
    <header
      className="relative z-10"
      style={{ position: "relative", zIndex: 10 }}
    >
      <div className={styles.bar}>
        <div
          className="relative mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6"
          style={{
            position: "relative",
            display: "flex",
            maxWidth: "80rem",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "clamp(0.5rem, 1.5vw, 1rem)",
            marginRight: "auto",
            marginLeft: "auto",
            padding: "0.75rem clamp(1rem, 2vw, 1.5rem)",
          }}
        >
          <Link
            href="/"
            aria-label="Go to homepage"
            style={{ display: "inline-flex", flexShrink: 0 }}
          >
            <Image
              src="/images/local-city-places-header-logo-v12.webp"
              alt="Local City Places"
              width={161}
              height={72}
              style={{ width: "clamp(88px, 27vw, 161px)", height: "auto" }}
              priority
            />
          </Link>

          <div
            className="flex items-center gap-2"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(0.25rem, 1.2vw, 0.5rem)",
            }}
          >
            <div>
              <RadioPlayerButton className={styles.radio} variant="header" />
            </div>
            {isAuthenticated ? (
              <Button
                asChild
                size="sm"
                aria-label="Open dashboard"
                className={cn(
                  styles.login,
                  "h-11 rounded-[16px] px-3 text-sm leading-none transition-[background-color,box-shadow] min-[480px]:px-4 sm:text-[15px]",
                )}
                style={{
                  display: "inline-flex",
                  height: "2.75rem",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.375rem",
                  whiteSpace: "nowrap",
                }}
              >
                <Link href={dashboardHref}>
                  <User className="size-5" aria-hidden="true" />
                  <span className="hidden min-[480px]:inline">Dashboard</span>
                </Link>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    aria-label="Open login menu"
                    className={cn(
                      styles.login,
                      "group h-11 gap-1.5 rounded-[16px] px-3 text-sm leading-none transition-[background-color,box-shadow] data-[state=open]:bg-[#f46200] data-[state=open]:shadow-[0_12px_26px_rgba(249,115,22,0.28)] sm:px-5 sm:text-[15px]",
                    )}
                    style={{
                      display: "inline-flex",
                      height: "2.75rem",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.375rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Login
                    <span
                      className="flex h-4 w-4 items-center justify-center"
                      aria-hidden="true"
                    >
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="center"
                  sideOffset={6}
                  className={cn(
                    "w-[154px] rounded-[14px] border border-sky-100/18 bg-[#082a45]/92 p-1 text-white shadow-[0_14px_30px_rgba(1,19,31,0.32)] ring-1 ring-white/8 backdrop-blur-xl",
                  )}
                >
                  <DropdownMenuItem asChild className={loginMenuItemClass}>
                    <Link href="/member-login">
                      <span className={loginMenuIconClass}>
                        <User className="h-4 w-4 text-current" />
                      </span>
                      Member
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className={loginMenuItemClass}>
                    <Link href="/merchant-login">
                      <span className={loginMenuIconClass}>
                        <Store className="h-4 w-4 text-current" />
                      </span>
                      Merchant
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
