"use client";

import { Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";

export function HomeHeader() {
  const [loginOpen, setLoginOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const isSweepstakesPage = pathname === "/favorite-merchant-sweepstakes";

  return (
    <header className="relative z-10">
      <div className="border-b border-white/10 bg-[#9a5d22]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Go to homepage">
            <Image
              src="/images/logo-horizontal.png"
              alt="Local City Places"
              width={650}
              height={286}
              className="h-10 w-auto sm:h-12"
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/favorite-merchant-sweepstakes"
              className={[
                "px-2 py-1 text-sm font-medium transition-colors underline-offset-4 hover:underline",
                isSweepstakesPage
                  ? "text-white underline"
                  : "text-white/88 hover:text-white",
              ].join(" ")}
              aria-current={isSweepstakesPage ? "page" : undefined}
            >
              Sweepstakes
            </Link>
            <Button
              size="sm"
              className="bg-white px-6 font-semibold text-zinc-900 shadow-lg hover:bg-white/90"
              onClick={() => setLoginOpen(true)}
            >
              Login
            </Button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative rounded-lg p-2 transition-colors hover:bg-white/15"
              aria-label="Toggle theme"
              type="button"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 text-white transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute top-2 left-2 h-5 w-5 rotate-90 scale-0 text-white transition-all dark:rotate-0 dark:scale-100" />
            </button>
          </div>
        </div>
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
