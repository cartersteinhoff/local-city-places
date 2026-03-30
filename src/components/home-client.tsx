"use client";

import { FeaturedMarquee } from "@/components/featured-marquee";
import { HomeHeader } from "@/components/home-header";
import { TopMarketsFooter } from "@/components/top-markets";

export function HomeClient() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#efe4d6]">
      <div className="absolute inset-x-0 top-0 h-[100svh] min-h-[760px] bg-[linear-gradient(180deg,#080808_0%,#0d0c0b_14%,#15110f_36%,#201813_70%,#2a1d16_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[100svh] min-h-[760px] bg-[radial-gradient(circle_at_50%_12%,rgba(255,214,160,0.16),transparent_24%),radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.06),transparent_30%),linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.34)_56%,rgba(0,0,0,0.52))]" />
      <div className="pointer-events-none absolute inset-x-0 top-[calc(100svh-10rem)] h-48 bg-[linear-gradient(180deg,rgba(42,29,22,0),#efe4d6)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <HomeHeader />

        <main className="flex flex-1 items-stretch">
          <FeaturedMarquee />
        </main>

        <TopMarketsFooter />
      </div>
    </div>
  );
}
