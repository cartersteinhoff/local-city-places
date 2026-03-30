import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Footer } from "@/components/footer";

interface LegalPageLayoutProps {
  children: ReactNode;
}

export function LegalPageLayout({ children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="LOCAL City Places home">
            <Image
              src="/images/logo-horizontal.png"
              alt="LOCAL City Places"
              width={650}
              height={286}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/70 bg-background/95 p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>

      <Footer className="border-t border-border bg-zinc-100/90 dark:bg-zinc-950/90" />
    </div>
  );
}
