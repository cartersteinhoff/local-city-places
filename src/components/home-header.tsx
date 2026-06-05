"use client";

import { Radio } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
            <Button size="sm" className={styles.login} asChild>
              <Link href="/member-login">Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
