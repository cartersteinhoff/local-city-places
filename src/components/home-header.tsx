"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";

type HomeHeaderVariant = "white" | "transparent";

interface HomeHeaderProps {
  variant?: HomeHeaderVariant;
}

const headerVariants = {
  white: {
    bar: "border-b border-[#05355c] bg-[#05355c] shadow-sm",
    login:
      "bg-white px-6 font-semibold text-[#05355c] shadow-sm hover:bg-white/90",
  },
  transparent: {
    bar: "border-b border-[#05355c] bg-[#05355c] shadow-sm",
    login:
      "bg-white px-6 font-semibold text-[#05355c] shadow-sm hover:bg-white/90",
  },
} as const;

export function HomeHeader({ variant = "white" }: HomeHeaderProps) {
  const [loginOpen, setLoginOpen] = useState(false);
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
          </div>
        </div>
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
