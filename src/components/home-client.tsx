"use client";

import { FeaturedMarquee } from "@/components/featured-marquee";
import { HomeHeader } from "@/components/home-header";
import { TopMarketsFooter } from "@/components/top-markets";

export function HomeClient() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#120d0b_0%,#18110f_16%,#241814_34%,#2f211a_48%,#f1e5d6_48%,#efe4d6_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[44rem] bg-[radial-gradient(circle_at_top,_rgba(255,196,121,0.14),_transparent_56%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-10 h-[40rem] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.06),_transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[7.5rem] h-[30rem] bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.22)_45%,rgba(0,0,0,0))]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <HomeHeader />

        <main className="flex flex-1 items-center">
          <FeaturedMarquee />
        </main>

        <TopMarketsFooter />
      </div>
    </div>
  );
}
