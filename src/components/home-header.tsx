"use client";

import { Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState } from "react";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HomeHeaderVariant = "white" | "transparent";

interface HomeHeaderProps {
  variant?: HomeHeaderVariant;
}

const headerVariants = {
  white: {
    bar: "border-b border-zinc-200/80 bg-white shadow-sm",
    login:
      "bg-orange-500 px-6 font-semibold text-white shadow-sm hover:bg-orange-600",
    toggle: "hover:bg-zinc-100",
    icon: "text-zinc-700",
  },
  transparent: {
    bar: "border-b border-white/10 bg-transparent",
    login:
      "bg-white px-6 font-semibold text-zinc-900 shadow-lg hover:bg-white/90",
    toggle: "hover:bg-white/15",
    icon: "text-white",
  },
} as const;

export function HomeHeader({ variant = "white" }: HomeHeaderProps) {
  const [loginOpen, setLoginOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const styles = headerVariants[variant];

  return (
    <header className="relative z-10">
      <div className={styles.bar}>
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
            <Button
              size="sm"
              className={styles.login}
              onClick={() => setLoginOpen(true)}
            >
              Login
            </Button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "relative rounded-lg p-2 transition-colors",
                styles.toggle,
              )}
              aria-label="Toggle theme"
              type="button"
            >
              <Sun
                className={cn(
                  "h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0",
                  styles.icon,
                )}
              />
              <Moon
                className={cn(
                  "absolute top-2 left-2 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100",
                  styles.icon,
                )}
              />
            </button>
          </div>
        </div>
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
