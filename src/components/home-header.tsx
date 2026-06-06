"use client";

import { ChevronDown, Radio, Store, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      "bg-orange-500 px-3 font-semibold text-white shadow-sm hover:bg-orange-600 sm:px-6",
  },
  transparent: {
    bar: "border-b border-sky-300/10 bg-[linear-gradient(135deg,#063860_0%,#01233f_54%,#04131f_100%)] shadow-sm",
    radio:
      "border border-sky-200/25 bg-white/10 px-3 font-semibold text-white shadow-sm hover:bg-white/15 sm:px-4",
    login:
      "bg-orange-500 px-3 font-semibold text-white shadow-sm hover:bg-orange-600 sm:px-6",
  },
} as const;

const loginMenuItemClass =
  "group h-10 cursor-pointer rounded-[12px] px-2.5 py-0 text-[14px] font-semibold text-white/95 transition-colors focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white";

const loginMenuIconClass =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-400/15 text-orange-300 transition-colors group-focus:bg-orange-500 group-focus:text-white group-data-[highlighted]:bg-orange-500 group-data-[highlighted]:text-white";

export function HomeHeader({ variant = "white" }: HomeHeaderProps) {
  const styles = headerVariants[variant];

  return (
    <header className="relative z-10">
      <div className={styles.bar}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Go to homepage">
            <Image
              src="/images/local-city-places-header-logo-v12.webp"
              alt="Local City Places"
              width={1592}
              height={713}
              className="h-14 w-auto sm:h-[72px]"
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            <Button size="sm" className={styles.radio} asChild>
              <Link href="/#live-radio">
                <Radio className="h-4 w-4" />
                Live Radio
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    styles.login,
                    "group h-12 rounded-[18px] px-3 text-base transition-[background-color,box-shadow] data-[state=open]:bg-orange-600 data-[state=open]:shadow-[0_14px_28px_rgba(249,115,22,0.3)] sm:px-6",
                  )}
                >
                  Login
                  <ChevronDown className="ml-1 h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="bottom"
                align="end"
                sideOffset={8}
                className="w-[168px] rounded-[16px] border border-white/15 bg-[#06243d]/95 p-1.5 text-white shadow-[0_18px_45px_rgba(1,19,31,0.38)] backdrop-blur-xl"
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
          </div>
        </div>
      </div>
    </header>
  );
}
