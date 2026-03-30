"use client";

import { Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState } from "react";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";

export function HomeHeader() {
  const [loginOpen, setLoginOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(0,0,0,0.52),rgba(0,0,0,0))]" />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <div className="rounded-full border border-white/12 bg-black/24 px-3 py-2 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.85)] backdrop-blur-md sm:px-4">
          <Link href="/" aria-label="Go to homepage">
            <Image
              src="/images/logo-horizontal.png"
              alt="Local City Places"
              width={650}
              height={286}
              className="h-9 w-auto sm:h-10"
              priority
            />
          </Link>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/12 bg-black/24 p-1.5 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.85)] backdrop-blur-md">
          <Button
            size="sm"
            className="rounded-full bg-white px-5 font-semibold text-zinc-900 shadow-none hover:bg-white/90"
            onClick={() => setLoginOpen(true)}
          >
            Login
          </Button>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative rounded-full p-2 transition-colors hover:bg-white/12"
            aria-label="Toggle theme"
            type="button"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 text-white transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute top-2 left-2 h-5 w-5 rotate-90 scale-0 text-white transition-all dark:rotate-0 dark:scale-100" />
          </button>
        </div>
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
