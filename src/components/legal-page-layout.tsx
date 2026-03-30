import type { ReactNode } from "react";

import { HomeHeader } from "@/components/home-header";
import { TopMarketsFooter } from "@/components/top-markets";

interface LegalPageLayoutProps {
  children: ReactNode;
}

export function LegalPageLayout({ children }: LegalPageLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <HomeHeader />

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/70 bg-background/95 p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>

      <TopMarketsFooter />
    </div>
  );
}
